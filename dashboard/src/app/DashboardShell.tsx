"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

// ─── Lucide-style inline SVG icon helpers ──────────────────────────────────

function IconNotes() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconTimeline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconLogOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="#111111" />
      <circle cx="31" cy="31" r="9" fill="#FFFFFF" />
      <circle cx="31" cy="31" r="3.5" fill="#111111" />
    </svg>
  );
}

function IconPanelLeftClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <path d="M15 9l-3 3 3 3" />
    </svg>
  );
}

function IconPanelLeftOpen() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <path d="M13 15l3-3-3-3" />
    </svg>
  );
}

// ─── Main Nav Items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Notes Explorer", href: "/notes", icon: <IconNotes /> },
  { label: "Timeline Feed", href: "/timeline", icon: <IconTimeline /> },
  { label: "Settings", href: "/settings", icon: <IconSettings /> },
];

const NO_SHELL_PREFIXES = ["/login", "/signup", "/forgot-password"];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      setCollapsed(localStorage.getItem("stickle_sidebar_collapsed") === "true");
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("stickle_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.data?.type === "STICKLE_SYNC_AUTH_TO_DASHBOARD" && e.data?.session) {
        try {
          const supabase = createBrowserClient();
          const { data: current } = await supabase.auth.getSession();
          if (current.session?.user?.id !== e.data.session?.user?.id || !current.session) {
            await supabase.auth.setSession({
              access_token: e.data.session.access_token,
              refresh_token: e.data.session.refresh_token,
            });
            router.refresh();
          }
        } catch (err) {
          console.warn("Failed to sync session from extension:", err);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  const handleSignOut = async () => {
    try {
      if (typeof window !== "undefined") {
        window.postMessage("STICKLE_DASHBOARD_SIGNOUT", "*");
      }
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  // Auth/login pages: render content directly without the shell
  const isAuthPage = NO_SHELL_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="dashboard-root">
      {/* ── Top Bar ──────────────────────────────────── */}
      <header className="dashboard-topbar">
        <div
          style={{
            width: "100%",
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Clean Logo lockup */}
          <Link
            href="/notes"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <div style={{ transition: "transform 0.15s ease" }}>
              <IconPin />
            </div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "-0.7px",
                color: "#111111",
              }}
            >
              stickle
            </span>
            <span className="eyebrow-lime" style={{ fontSize: "9px" }}>
              Dashboard
            </span>
          </Link>

          {/* Right: Working Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="btn-pill btn-secondary"
            style={{ fontSize: "13px", padding: "7px 16px", gap: "6px", cursor: "pointer" }}
          >
            <IconLogOut />
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Body: Sidebar + Main ──────────────────────── */}
      <div className="dashboard-body">
        {/* ── Sidebar ── */}
        <aside className={`dashboard-sidebar${collapsed ? " collapsed" : ""}`}>
          <nav style={{ padding: "16px 12px", flex: 1 }}>
            {/* Sidebar Header with Collapse Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "space-between",
                marginBottom: "12px",
                padding: "0 4px",
              }}
            >
              {!collapsed && <span className="sidebar-section-label" style={{ margin: 0 }}>Menu</span>}
              <button
                onClick={toggleSidebar}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="sidebar-toggle-btn"
              >
                {collapsed ? <IconPanelLeftOpen /> : <IconPanelLeftClose />}
              </button>
            </div>

            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/notes" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`sidebar-link${isActive ? " active" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Upgrade CTA at bottom */}
          <div style={{ padding: "12px" }}>
            <div className="sidebar-divider" style={{ margin: "0 0 12px" }} />
            <Link
              href="/upgrade"
              title="Upgrade Plan"
              className="btn-pill btn-lime"
              style={{
                width: "100%",
                fontSize: "13px",
                padding: "10px 16px",
                borderRadius: "12px",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <IconZap />
              <span className="upgrade-btn-text">Upgrade Plan</span>
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
