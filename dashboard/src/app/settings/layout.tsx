"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function IconCreditCard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconNotion() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z" />
      <path d="M8 8l4 8 4-8" />
    </svg>
  );
}

function IconCpu() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="15" x2="23" y2="15" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="15" x2="4" y2="15" />
    </svg>
  );
}

const TABS = [
  { label: "Profile", href: "/settings", icon: <IconUser />, exact: true },
  { label: "Import & Export", href: "/settings/export", icon: <IconDownload />, exact: false },
  { label: "Notion Integration", href: "/settings/notion", icon: <IconNotion />, exact: false },
  { label: "Connected MCPs", href: "/settings/mcp", icon: <IconCpu />, exact: false },
  { label: "API Tokens", href: "/settings/tokens", icon: <IconKey />, exact: false },
  { label: "Billing", href: "/settings/billing", icon: <IconCreditCard />, exact: false },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page header */}
      <div>
        <span className="eyebrow" style={{ marginBottom: "6px" }}>
          ACCOUNT SETTINGS
        </span>
        <h1 className="display-lg" style={{ marginBottom: "8px", fontSize: "36px" }}>
          Settings
        </h1>
        <p className="body-lg">
          Manage your profile, API tokens, and billing preferences.
        </p>
      </div>

      {/* Tab nav + content */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "24px", alignItems: "start" }}>
        {/* Tab navigation */}
        <nav
          className="color-block color-block-soft"
          style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}
        >
          {TABS.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`settings-tab${isActive ? " active" : ""}`}
              >
                {tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Content panel */}
        <div
          className="color-block color-block-soft"
          style={{ padding: "28px", minHeight: "400px" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
