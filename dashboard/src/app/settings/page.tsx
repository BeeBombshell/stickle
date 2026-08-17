"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

function IconZap() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function SettingsProfilePage() {
  const [profile, setProfile] = useState<{
    email?: string;
    tier?: string;
    license_key?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("email, tier, license_key")
            .eq("id", session.user.id)
            .maybeSingle();

          setProfile(data || { email: session.user.email, tier: "free" });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const tier = profile?.tier || "free";
  const isPro = tier !== "free";

  const TIER_LABEL: Record<string, string> = {
    supporter: "Stickle Pro Supporter",
    team_member: "Stickle Teams",
    free: "Stickle Free",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "48px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-hairline-soft)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Current plan section */}
      <div>
        <span className="eyebrow" style={{ marginBottom: "12px" }}>
          Current Plan
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderRadius: "var(--radius-lg)",
            background: isPro ? "var(--color-block-lime)" : "white",
            border: "1px solid var(--color-hairline)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.3px",
                marginBottom: "4px",
              }}
            >
              {TIER_LABEL[tier] || tier}
            </div>
            {profile?.email && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--color-ink-muted)",
                }}
              >
                {profile.email}
              </div>
            )}
          </div>

          <span
            style={{
              padding: "5px 14px",
              borderRadius: "var(--radius-pill)",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              background: isPro ? "rgba(0,0,0,0.12)" : "var(--color-surface-soft)",
              color: "var(--color-ink)",
            }}
          >
            {tier.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Pro features checklist */}
      {isPro && (
        <div>
          <span className="eyebrow" style={{ marginBottom: "12px" }}>
            Your Features
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              "Unlimited notes & cross-device sync",
              "Remote MCP server (Claude Desktop, Cursor)",
              "Notion database export",
              "Priority support",
            ].map((feat) => (
              <div
                key={feat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "14px",
                  color: "var(--color-ink)",
                }}
              >
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "9999px",
                    background: "var(--color-block-lime)",
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
        </div>
      )}

      {/* License key */}
      {profile?.license_key && (
        <div>
          <span className="eyebrow" style={{ marginBottom: "8px" }}>
            License Key
          </span>
          <div
            style={{
              padding: "12px 16px",
              background: "white",
              border: "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--color-ink)",
              wordBreak: "break-all",
            }}
          >
            {profile.license_key}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ paddingTop: "4px" }}>
        {!isPro ? (
          <Link
            href="/upgrade"
            className="btn-pill btn-primary"
            style={{ fontSize: "14px", gap: "8px" }}
          >
            <IconZap />
            Upgrade to Pro — $29 Lifetime
          </Link>
        ) : (
          <Link
            href="/upgrade"
            className="btn-pill btn-secondary"
            style={{ fontSize: "14px" }}
          >
            Manage Subscription / View Invoices
          </Link>
        )}
      </div>
    </div>
  );
}
