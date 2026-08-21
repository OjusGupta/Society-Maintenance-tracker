"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminComplaintsPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user?.role !== "ADMIN") router.push("/complaints");
  }, [user, isLoading, router]);

  const fetchComplaints = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (category) params.append("category", category);
      if (date) params.append("date", date);

      const res = await fetch(`/api/complaints?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setComplaints(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [token, status, category, date]);

  if (isLoading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <div className="page-header">
        <h1>Manage Complaints</h1>
        <p className="page-subtitle">View and update all resident complaints</p>
      </div>

      <div className="filters-bar">
        <div className="form-group">
          <label>Status</label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="CLEANING">Cleaning</option>
            <option value="SECURITY">Security</option>
            <option value="LIFT">Lift</option>
            <option value="PARKING">Parking</option>
            <option value="INTERNET">Internet</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Date Range</label>
          <select className="select" value={date} onChange={(e) => setDate(e.target.value)}>
            <option value="">Any Time</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Resident</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No complaints found.</td></tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className={c.isOverdue ? "row-overdue" : ""}>
                    <td className="text-sm font-semibold text-dim">{c.id.slice(-6)}</td>
                    <td className="text-sm">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="text-sm">
                      {c.resident.name}
                      <div className="text-xs text-dim">Flat: {c.resident.flatNumber || "N/A"}</div>
                    </td>
                    <td><span className="badge badge-category">{c.category.replace(/_/g, " ")}</span></td>
                    <td>
                      {c.priority === "HIGH" ? <span className="badge badge-high">High</span> :
                       c.priority === "MEDIUM" ? <span className="badge badge-medium">Medium</span> :
                       <span className="badge badge-low">Low</span>}
                    </td>
                    <td>
                      {c.isOverdue ? <span className="badge badge-overdue">Overdue</span> :
                       c.currentStatus === "OPEN" ? <span className="badge badge-open">Open</span> :
                       c.currentStatus === "IN_PROGRESS" ? <span className="badge badge-inprogress">In Progress</span> :
                       <span className="badge badge-resolved">Resolved</span>}
                    </td>
                    <td>
                      <Link href={`/complaints/${c.id}`} className="btn btn-secondary btn-sm">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
