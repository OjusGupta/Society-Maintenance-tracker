"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", flatNumber: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.formErrors?.[0] || data.error || "Registration failed");
        return;
      }

      login(data.token, data.user);
      router.push("/complaints");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-eyebrow">Access Form · Register</span>
        <h1>Create account</h1>
        <p className="auth-subtitle">Join your society&apos;s maintenance platform</p>

        {error && <div className="alert alert-error mt-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-lg mt-xl">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" className="input" value={form.name} onChange={set("name")} placeholder="Ravi Sharma" required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" className="input" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            <div className="form-group">
              <label htmlFor="flat">Flat / Unit</label>
              <input id="flat" type="text" className="input" value={form.flatNumber} onChange={set("flatNumber")} placeholder="A-204" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="input" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required minLength={6} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-sm" disabled={loading} style={{ padding: "12px" }}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-muted mt-xl" style={{ fontSize: 13 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
