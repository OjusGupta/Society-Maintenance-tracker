"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function NewNoticePage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user?.role !== "ADMIN") router.push("/complaints");
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, body, isImportant }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post notice");

      router.push("/notices");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  if (isLoading) return <div className="spinner" />;

  return (
    <div className="container page-wrapper">
      <div className="page-header">
        <Link href="/notices" className="btn btn-ghost mb-md" style={{ paddingLeft: 0 }}>
          ← Back to notice board
        </Link>
        <h1>Post Notice</h1>
        <p className="page-subtitle">Announce important updates to all residents</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        {error && <div className="alert alert-error mb-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
          <div className="form-group">
            <label htmlFor="title">Notice Title</label>
            <input
              id="title"
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water supply interruption"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="body">Message Body</label>
            <textarea
              id="body"
              className="textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the full announcement here..."
              required
              rows={6}
            />
          </div>

          <label className="toggle-wrap">
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
            />
            <div>
              <div className="font-semibold" style={{ color: "var(--text-primary)" }}>Mark as Important</div>
              <div className="text-xs text-muted mt-1">This will send an email notification to all residents immediately.</div>
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary w-full mt-md"
            disabled={loading}
            style={{ padding: "12px" }}
          >
            {loading ? "Posting..." : "Post Notice"}
          </button>
        </form>
      </div>
    </div>
  );
}
