"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type ComplaintDetail = {
  id: string;
  category: string;
  description: string;
  priority: string;
  currentStatus: string;
  photoUrl?: string;
  createdAt: string;
  isOverdue: boolean;
  statusHistory: Array<{
    id: string;
    status: string;
    note?: string;
    timestamp: string;
    changedBy: { name: string; role: string };
  }>;
};

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin action state
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/complaints/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setComplaint(data);
        setStatus(data.currentStatus);
        setPriority(data.priority);
        setLoading(false);
      });
  }, [id, token]);

  const handleUpdateStatus = async () => {
    if (status === complaint?.currentStatus && !note) return;
    setActionLoading(true);
    try {
      await fetch(`/api/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, note }),
      });
      window.location.reload();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePriority = async () => {
    if (priority === complaint?.priority) return;
    setActionLoading(true);
    try {
      await fetch(`/api/complaints/${id}/priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ priority }),
      });
      window.location.reload();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push(backLink);
      } else {
        alert("Failed to delete complaint");
      }
    } catch (err) {
      alert("Failed to delete complaint");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || loading) return <div className="spinner" />;
  if (!complaint) return <div className="container page-wrapper">Complaint not found</div>;

  const isAdmin = user?.role === "ADMIN";
  const backLink = isAdmin ? "/admin/complaints" : "/complaints";

  return (
    <div className="container page-wrapper">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Link href={backLink} className="btn btn-ghost mb-md" style={{ paddingLeft: 0 }}>
            ← Back
          </Link>
          <div className="flex items-center gap-md flex-wrap mb-sm">
            <h1>Complaint Details</h1>
            {complaint.isOverdue && <span className="badge badge-overdue">Overdue</span>}
          </div>
          <p className="page-subtitle">ID: {complaint.id}</p>
        </div>
        <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading} style={{ marginTop: "1rem" }}>
          Delete Request
        </button>
      </div>

      <div className="detail-grid">
        {/* Left Column: Info & Timeline */}
        <div className="flex flex-col gap-xl">
          <div className="card">
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <div className="detail-label">Category</div>
                <div className="detail-value">{complaint.category.replace(/_/g, " ")}</div>
              </div>
              <div className="detail-info-item">
                <div className="detail-label">Priority</div>
                <div className="detail-value">{complaint.priority}</div>
              </div>
              <div className="detail-info-item" style={{ gridColumn: "1 / -1" }}>
                <div className="detail-label">Description</div>
                <div className="detail-value" style={{ fontWeight: 400, marginTop: 4 }}>
                  {complaint.description}
                </div>
              </div>
            </div>

            {complaint.photoUrl && (
              <div className="mt-lg">
                <div className="detail-label mb-sm">Attached Photo</div>
                <img src={complaint.photoUrl} alt="Complaint" className="photo-preview" />
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title mb-lg">Status Timeline</h3>
            <div className="timeline">
              {complaint.statusHistory.map((h, i) => (
                <div key={h.id} className="timeline-item">
                  <div className="timeline-line" />
                  <div className={`timeline-dot timeline-dot-${h.status.toLowerCase().replace("_", "")}`}>
                    {h.status === "RESOLVED" ? "✓" : h.status === "IN_PROGRESS" ? "⚙" : "○"}
                  </div>
                  <div className="timeline-body">
                    <div className="timeline-time">
                      {new Date(h.timestamp).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
                      })}
                    </div>
                    <div className="timeline-status">
                      {h.status.replace("_", " ")}
                    </div>
                    {h.note && <div className="timeline-note">{h.note}</div>}
                    <div className="timeline-actor">
                      Updated by {h.changedBy.name} ({h.changedBy.role})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Admin Actions */}
        {isAdmin && (
          <div className="flex flex-col gap-lg">
            <div className="card">
              <h3 className="card-title mb-md">Update Status</h3>
              <div className="form-group mb-md">
                <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div className="form-group mb-md">
                <textarea
                  className="textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  rows={2}
                  style={{ minHeight: "80px" }}
                />
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={handleUpdateStatus}
                disabled={actionLoading}
              >
                Save Status
              </button>
            </div>

            <div className="card">
              <h3 className="card-title mb-md">Update Priority</h3>
              <div className="form-group mb-md">
                <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <button
                className="btn btn-secondary w-full"
                onClick={handleUpdatePriority}
                disabled={actionLoading}
              >
                Save Priority
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
