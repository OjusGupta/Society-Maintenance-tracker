"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    code: "§ RAISE",
    title: "Raise a complaint",
    desc: "Residents file an issue with a category, description, and a photo. It's timestamped and assigned a ticket the moment it's submitted.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="5" y="4" width="14" height="17" rx="1" />
        <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" strokeLinecap="square" />
        <path d="M8 12l2.5 2.5L16 9" strokeLinecap="square" strokeLinejoin="miter" />
      </svg>
    ),
  },
  {
    code: "§ ROUTE",
    title: "Admin routes it",
    desc: "The committee sets priority, updates status, and leaves a note at every step — building a full audit trail nobody has to chase down.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" strokeLinecap="square" />
      </svg>
    ),
  },
  {
    code: "§ NOTIFY",
    title: "Everyone stays informed",
    desc: "Status changes email the resident automatically. Important notices are pinned to the board and pushed to every household.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 10v4a1 1 0 001 1h2l5 4V5L6 9H4a1 1 0 00-1 1z" strokeLinejoin="miter" />
        <path d="M16 9a4 4 0 010 6" strokeLinecap="square" />
        <path d="M19 6a8 8 0 010 12" strokeLinecap="square" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.role === "ADMIN" ? "/admin/dashboard" : "/complaints");
    }
  }, [user, isLoading, router]);

  return (
    <div className="hero">
      <div className="hero-grid">
        <div>
          <span className="hero-eyebrow">Form SMT&#8209;01 · Resident Work Order System</span>
          <h1>
            Every complaint,<br />
            <span className="underline">tracked to resolution.</span>
          </h1>
          <p className="hero-desc">
            Residents file maintenance issues with photos. Admins move them through
            an open-to-resolved workflow. Nothing gets lost between a WhatsApp
            message and a forgotten notepad.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary btn-lg">Get Started</Link>
            <Link href="/login" className="btn btn-secondary btn-lg">Sign In</Link>
          </div>
        </div>

        <div className="ticket" aria-hidden="true">
          <div className="ticket-header">
            <div>
              <div className="ticket-id">TICKET #SMT-2847</div>
              <div className="ticket-title">Leaking pipe, B-Wing</div>
            </div>
            <div className="ticket-stamp">Overdue</div>
          </div>
          <div className="ticket-row">
            <span className="ticket-line-label">Category</span>
            <span className="ticket-line-value">Plumbing</span>
          </div>
          <div className="ticket-row">
            <span className="ticket-line-label">Priority</span>
            <span className="ticket-line-value">High</span>
          </div>
          <div className="ticket-row">
            <span className="ticket-line-label">Filed</span>
            <span className="ticket-line-value">4 days ago</span>
          </div>
          <div className="ticket-footer">Flat B-204 · Auto-tracked since filing</div>
        </div>
      </div>

      <div className="features-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-code">{f.code}</div>
            <div className="feature-icon">{f.icon}</div>
            <div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
