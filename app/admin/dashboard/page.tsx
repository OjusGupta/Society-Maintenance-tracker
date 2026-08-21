"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user?.role !== "ADMIN") router.push("/complaints");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [token]);

  if (isLoading || loading) return <div className="spinner" />;

  const maxCatCount = Math.max(...data.byCategory.map((c: any) => c.count), 1);
  const inProgressCount = data.byStatus.find((s: any) => s.status === "IN_PROGRESS")?.count || 0;
  const resolvedCount = data.byStatus.find((s: any) => s.status === "RESOLVED")?.count || 0;

  return (
    <div className="container page-wrapper">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="page-subtitle">Overview of society maintenance</p>
      </div>

      <div className="stats-grid mb-2xl">
        <div className="stat-card stat-accent">
          <div className="stat-label">Total Complaints</div>
          <div className="stat-value">{data.total}</div>
        </div>
        <div className="stat-card stat-danger">
          <div className="stat-label">Overdue</div>
          <div className="stat-value text-danger">{data.overdueCount}</div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-label">In Progress</div>
          <div className="stat-value text-warning">{inProgressCount}</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-label">Resolved</div>
          <div className="stat-value text-success">{resolvedCount}</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <Link href="/admin/complaints" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          
          <div className="flex flex-col gap-md">
            {data.recentComplaints.length === 0 ? (
              <div className="text-center py-4">
                <div className="empty-icon" style={{ margin: "0 auto var(--space-md)" }}>No entries</div>
                <p className="text-muted text-sm">No recent activity</p>
              </div>
            ) : (
              data.recentComplaints.map((c: any) => (
                <Link key={c.id} href={`/complaints/${c.id}`} className="complaint-item" style={{ padding: "12px 16px" }}>
                  <div className="complaint-body">
                    <div className="flex items-center justify-between mb-xs">
                      <span className="font-semibold text-sm">{c.category.replace(/_/g, " ")}</span>
                      {c.currentStatus === "RESOLVED" ? (
                        <span className="badge badge-resolved">Resolved</span>
                      ) : (
                        <span className="badge badge-open">{c.currentStatus}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted line-clamp-1">{c.description}</p>
                    <p className="text-xs text-dim mt-xs">
                      {new Date(c.createdAt).toLocaleDateString()} by {c.resident.name}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title mb-lg">By Category</h3>
          <div className="flex flex-col">
            {data.byCategory.map((cat: any) => (
              <div key={cat.category} className="chart-row">
                <div className="chart-label">{cat.category.replace(/_/g, " ")}</div>
                <div className="chart-bar-bg flex-1">
                  <div 
                    className="chart-bar-fill" 
                    style={{ 
                      width: `${(cat.count / maxCatCount) * 100}%`,
                      background: "var(--brand-primary)"
                    }} 
                  />
                </div>
                <div className="chart-value">{cat.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
