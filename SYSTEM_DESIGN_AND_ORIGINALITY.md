# System Design Write-Up

## 1. Complaint History Model

The complaint lifecycle is the central design concern. Each `Complaint` row stores only its **current** state — `currentStatus` (OPEN, IN_PROGRESS, RESOLVED), `priority` (LOW, MEDIUM, HIGH), and `resolvedAt`. The full audit trail lives in a separate **append-only** table, `ComplaintStatusHistory`.

Every time an admin updates a complaint's status, the system performs a **database transaction** that atomically:
1. Updates the `complaints.current_status` column (and sets `resolved_at` if the new status is RESOLVED).
2. Inserts a new row into `complaint_status_history` with the new status, a timestamp, the actor's user ID (`changed_by`), and an optional free-text note.

This two-table design was chosen over a single-table approach (e.g., storing a JSON array of history entries) for several reasons:
- **Queryability**: We can `GROUP BY` or `ORDER BY` on the history table independently, which makes audit reports and timeline rendering straightforward.
- **Referential integrity**: Foreign keys on `complaint_id` and `changed_by` enforce consistency at the database level, preventing orphaned records.
- **Append-only guarantees**: The history table has no `UPDATE` or `DELETE` operations exposed through the API, ensuring a tamper-proof audit log.

The initial "OPEN" entry is also recorded in the history table at complaint creation time, so the timeline always starts from the moment the resident filed the request. Once a complaint reaches RESOLVED, the API rejects further status changes, enforcing the closed-complaint rule.

## 2. Overdue Detection

Overdue detection uses a **dual approach**: automatic time-based detection combined with manual admin flagging.

**Automatic detection** is computed dynamically at query time rather than stored as a boolean. The API reads `OVERDUE_THRESHOLD_DAYS` from the environment (defaulting to 7), calculates a cutoff date (`now - threshold`), and any non-RESOLVED complaint with a `created_at` older than that cutoff is annotated as overdue. This means:
- The threshold is **configurable** without a code change — just update the `.env` variable.
- There is no background cron job or scheduled task — overdue status is always fresh and computed in real-time.
- If an admin changes the threshold from 7 to 14 days, all API responses immediately reflect the new window.

**Manual flagging** allows an admin to explicitly mark a complaint as overdue via the `isFlaggedOverdue` field, regardless of its age. This is useful for edge cases where a complaint may be recent but the admin knows it needs urgent attention. The final `isOverdue` value returned to the frontend is `isFlaggedOverdue || (currentStatus !== RESOLVED && createdAt < overdueDate)`.

On the admin complaints list, overdue complaints are **sorted to the top** using a post-query sort (`result.sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue))`). The dashboard endpoint similarly counts overdue complaints using an `OR` condition that captures both auto-detected and manually flagged entries.

## 3. Photo Handling

Photo uploads use **Cloudinary** as the external storage provider. The flow is:

1. **Client-side**: The resident selects an image file. A `FileReader` converts it to a base64 data URI on the client. The file size is validated (max 5MB) before conversion.
2. **API**: The base64 string is sent as `photoBase64` in the complaint creation JSON body. The API calls `uploadImage()`, which uses Cloudinary's `uploader.upload()` with automatic format and quality optimization (`fetch_format: auto`, `quality: auto`, width capped at 1200px).
3. **Storage**: Cloudinary returns a `secure_url` which is stored in the `photo_url` column of the complaint.
4. **Fallback**: If Cloudinary credentials are not configured (i.e., set to `"placeholder"`), the system stores the base64 data URI directly in the database. This allows the app to function in development without requiring a Cloudinary account — the photo still renders correctly via a `data:` URI in the `<img>` tag.
5. **Display**: The complaint detail page renders the `photoUrl` in a standard `<img>` element, whether it's a Cloudinary URL or a base64 data URI.

This approach avoids multipart form handling on the server and keeps the API surface uniform (all JSON). The trade-off is a ~33% size increase from base64 encoding, but Cloudinary's server-side optimization compensates for this.

## 4. Notification Flow

Email notifications use the **Resend** transactional email service and follow a **fire-and-forget** pattern. Two types of emails are sent:

### Status Change Notifications
When an admin updates a complaint's status (via `PATCH /api/complaints/:id/status`), the API:
1. Completes the database transaction (status update + history insert).
2. Calls `sendStatusChangeEmail()` **without awaiting** it — this ensures the API response is not blocked by email delivery latency or failures.
3. The email includes the complaint category, new status, admin's note (if any), and a deep link back to the complaint detail page.

### Important Notice Notifications
When an admin posts a notice marked as `isImportant`:
1. The notice is saved to the database.
2. The API queries all users with `role = RESIDENT` to get their email addresses.
3. For each resident, `sendImportantNoticeEmail()` is called in a fire-and-forget loop.
4. The email includes the notice title, body, and a link to the notice board.

### Audit Logging
Every email attempt — successful or failed — is recorded in the `email_logs` table with the recipient address, type (STATUS_CHANGE or IMPORTANT_NOTICE), status (SENT or FAILED), and any error message. This gives the admin visibility into notification delivery without coupling email failures to the main application flow.

The sender address uses Resend's sandbox domain (`onboarding@resend.dev`), which works out of the box on the free tier without domain verification.

## 5. Authentication & Authorization

The system uses **JWT-based authentication** with role-based access control. On login or registration, the server signs a JWT containing the user's ID, email, role, and name. The client stores this token in `localStorage` and sends it as a `Bearer` token in the `Authorization` header.

Each API route uses a `requireAuth()` middleware helper that:
1. Extracts and verifies the JWT.
2. Optionally enforces a specific role (e.g., `requireAuth(req, "ADMIN")`).
3. Returns `401` for missing/invalid tokens or `403` for role mismatches.

This lightweight approach avoids the overhead of session-based auth while providing clear role separation between RESIDENT and ADMIN users.
