"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => (pathname === href ? "nav-link active" : "nav-link");

  return (
    <nav className="navbar">
      <div
        className="container navbar-inner"
        style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}
      >
        {/* LEFT: brand */}
        <Link href="/" className="navbar-brand" style={{ justifySelf: "start" }}>
          <img src="/logo.svg" alt="SocietyTrack" style={{ height: "22px" }} />
        </Link>

        {/* CENTER: nav links */}
        <div className="navbar-links" style={{ justifySelf: "center", display: "flex", gap: "6px" }}>
          {!isLoading && user?.role === "ADMIN" && (
            <>
              <Link href="/admin/dashboard" className={isActive("/admin/dashboard")}>Dashboard</Link>
              <Link href="/admin/complaints" className={isActive("/admin/complaints")}>Complaints</Link>
              <Link href="/notices" className={isActive("/notices")}>Notices</Link>
              <Link href="/admin/notices/new" className={isActive("/admin/notices/new")}>Post Notice</Link>
            </>
          )}
          {!isLoading && user?.role === "RESIDENT" && (
            <>
              <Link href="/complaints" className={isActive("/complaints")}>My Complaints</Link>
              <Link href="/complaints/new" className={isActive("/complaints/new")}>New Complaint</Link>
              <Link href="/notices" className={isActive("/notices")}>Notices</Link>
            </>
          )}
        </div>

        {/* RIGHT: account & theme */}
        <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: "12px" }}>
          <ThemeToggle />
          {!isLoading && user ? (
            <div className="nav-user" style={{ gap: "10px" }}>
              <span className="nav-user-name">{user.name}</span>
              {user.role === "ADMIN" && <span className="nav-user-role">Admin</span>}
              <button onClick={logout} className="btn btn-ghost btn-sm">Sign out</button>
            </div>
          ) : !isLoading && !user ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    </nav>
  );
}
