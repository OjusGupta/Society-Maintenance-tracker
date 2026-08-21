"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Complaint = {
  id: string;
  category: string;
  description: string;
  priority: string;
  currentStatus: string;
  createdAt: string;
  isOverdue: boolean;
  photoUrl?: string;
};

function statusBadge(status: string, isOverdue: boolean) {
  if (isOverdue) return <span className="badge badge-overdue">Overdue</span>;
  if (status === "OPEN") return <span className="badge badge-open">Open</span>;
  if (status === "IN_PROGRESS") return <span className="badge badge-inprogress">In Progress</span>;
  if (status === "RESOLVED") return <span className="badge badge-resolved">Resolved</span>;
  return <span className="badge">{status}</span>;
}

function priorityBadge(priority: string) {
  if (priority === "HIGH") return <span className="badge badge-high">High</span>;
  if (priority === "MEDIUM") return <span className="badge badge-medium">Medium</span>;
  return <span className="badge badge-low">Low</span>;
}

export default function MyComplaintsPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user?.role === "ADMIN") router.push("/admin/complaints");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/complaints", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setComplaints)
      .catch(() => setError("Failed to load complaints"))
      .finally(() => setLoading(false));
  }, [token]);

  if (isLoading || loading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>My Complaints</h1>
            <p className="page-subtitle">Track your maintenance requests</p>
          </div>
          <Link href="/complaints/new" className="btn btn-primary">
            + New Complaint
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error mb-lg">{error}</div>}

      {complaints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">No entries</div>
          <h3>No complaints yet</h3>
          <p>Raise your first maintenance complaint and we&apos;ll track it for you.</p>
          <Link href="/complaints/new" className="btn btn-primary mt-xl">
            Raise a Complaint
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id} className={c.isOverdue ? "row-overdue" : ""}>
                  <td className="font-semibold">{c.category.replace(/_/g, " ")}</td>
                  <td><p className="line-clamp-1" style={{ maxWidth: 300 }}>{c.description}</p></td>
                  <td className="text-muted text-sm">
                    {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td>{priorityBadge(c.priority)}</td>
                  <td>{statusBadge(c.currentStatus, c.isOverdue)}</td>
                  <td>
                    <Link href={`/complaints/${c.id}`} className="btn btn-ghost btn-sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
