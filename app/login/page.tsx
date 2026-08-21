"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      login(data.token, data.user);
      router.push(data.user.role === "ADMIN" ? "/admin/dashboard" : "/complaints");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-eyebrow">Access Form · Sign In</span>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="alert alert-error mt-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-lg mt-xl">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-sm" disabled={loading} style={{ padding: "12px" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-muted mt-xl" style={{ fontSize: 13 }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
            Create one
          </Link>
        </p>

        <div className="divider" />

        <div className="demo-box">
          <p className="mono text-dim text-xs font-semibold mb-sm" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Demo credentials
          </p>
          <p className="text-sm text-muted">
            <strong>Admin:</strong> admin@society.com / admin123
          </p>
          <p className="text-sm text-muted">
            <strong>Resident:</strong> resident@society.com / resident123
          </p>
        </div>
      </div>
    </div>
  );
}
