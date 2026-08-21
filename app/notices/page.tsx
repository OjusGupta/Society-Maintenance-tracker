"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NoticesPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/notices", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setNotices)
      .finally(() => setLoading(false));
  }, [token]);

  if (isLoading || loading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Notice Board</h1>
            <p className="page-subtitle">Announcements and updates from the committee</p>
          </div>
          {user?.role === "ADMIN" && (
            <Link href="/admin/notices/new" className="btn btn-primary">
              + Post Notice
            </Link>
          )}
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">No entries</div>
          <h3>No notices yet</h3>
          <p>There are no announcements on the notice board right now.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-lg max-w-3xl" style={{ maxWidth: 800 }}>
          {notices.map((n) => (
            <div key={n.id} className={`notice-card ${n.isImportant ? "notice-important" : ""}`}>
              <div className="flex items-center justify-between mb-sm">
                <h3 className="card-title text-lg">{n.title}</h3>
                {n.isImportant && <span className="badge badge-important">Important</span>}
              </div>
              <p style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {n.body}
              </p>
              <div className="notice-meta">
                <span>Posted {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                <span>•</span>
                <span>By {n.postedBy.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
