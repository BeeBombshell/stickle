import Link from "next/link";

function IconZap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

const PRO_FEATURES = [
  "Unlimited notes & cross-device sync",
  "Remote MCP server (Claude Desktop, Cursor, Antigravity)",
  "Notion database export (1-click)",
  "Obsidian markdown export",
  "Priority support & roadmap access",
  "All future Pro features — lifetime deal",
];

export default function BillingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <span className="eyebrow" style={{ marginBottom: "6px" }}>
          PLAN & BILLING
        </span>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.3px",
            marginBottom: "6px",
          }}
        >
          Billing
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-ink-muted)", lineHeight: 1.5 }}>
          Manage your plan and access. Stickle Pro is a one-time lifetime purchase — no subscriptions.
        </p>
      </div>

      {/* Pricing card */}
      <div
        className="color-block color-block-lime"
        style={{ padding: "28px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              }}
            >
              <IconZap />
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "-0.4px",
                }}
              >
                Stickle Pro Supporter
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "var(--color-ink-muted)", maxWidth: "380px" }}>
              One-time early access price. Includes all current and future Pro features.
            </p>
          </div>

          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              $29
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--color-ink-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              Lifetime
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          {PRO_FEATURES.map((feat) => (
            <div
              key={feat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "9999px",
                  background: "rgba(0,0,0,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconCheck />
              </span>
              {feat}
            </div>
          ))}
        </div>

        <Link
          href="/upgrade"
          className="btn-pill btn-primary"
          style={{ fontSize: "15px", gap: "8px", padding: "12px 28px" }}
        >
          <IconZap />
          Get Pro Access
          <IconArrowRight />
        </Link>
      </div>

      {/* Already pro section */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: "var(--radius-lg)",
          background: "white",
          border: "1px solid var(--color-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>
            Already a Pro Supporter?
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-ink-muted)" }}>
            View your license key and invoices, or contact support.
          </div>
        </div>
        <Link
          href="/upgrade"
          className="btn-pill btn-secondary"
          style={{ fontSize: "13px", flexShrink: 0 }}
        >
          Manage Subscription
        </Link>
      </div>
    </div>
  );
}
