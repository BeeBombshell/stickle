"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Lucide SVG icons ─────────────────────────────────────────────────────

function IconZap() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="28" height="28" viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="12" fill="#111111" />
      <circle cx="30" cy="30" r="10" fill="#FFFFFF" />
      <circle cx="30" cy="30" r="4" fill="#111111" />
    </svg>
  );
}

// ─── Login content ────────────────────────────────────────────────────────

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectToParam = searchParams.get("redirectTo") || "/notes";
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      setLoading(provider);
      setError(null);
      const supabase = createClient();
      const targetPath = redirectToParam.startsWith("/")
        ? redirectToParam
        : `/${redirectToParam}`;
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetPath)}`;

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (signInError) throw signInError;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate sign in";
      setError(message);
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Left: Lime hero panel ── */}
      <div
        style={{
          background: "var(--color-block-lime)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconPin />
          <span
            style={{
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "-0.8px",
              color: "#111",
            }}
          >
            stickle
          </span>
        </div>

        {/* Headline */}
        <div>
          <h1
            style={{
              fontSize: "clamp(36px, 4vw, 56px)",
              fontWeight: 340,
              lineHeight: 1.05,
              letterSpacing: "-1.2px",
              color: "#111",
              marginBottom: "20px",
              maxWidth: "480px",
            }}
          >
            Leave notes in the margins of the web.
          </h1>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 330,
              color: "rgba(17,17,17,0.7)",
              lineHeight: 1.5,
              maxWidth: "380px",
            }}
          >
            Persistent anchored sticky notes across every page. Synced across devices. Accessible to your AI agents.
          </p>
        </div>

        {/* Feature badges */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { icon: <IconZap />, text: "Real-time cross-device sync" },
            { icon: <IconShield />, text: "Private & local-first by default" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#111",
              }}
            >
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "9999px",
                  background: "rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {icon}
              </span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Sign in form ── */}
      <div
        style={{
          background: "var(--color-canvas)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "340px" }}>
          <span
            className="eyebrow"
            style={{ marginBottom: "16px", textAlign: "center", display: "block" }}
          >
            STICKLE DASHBOARD
          </span>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            Sign in to continue
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-ink-muted)",
              textAlign: "center",
              marginBottom: "32px",
              lineHeight: 1.5,
            }}
          >
            Access your web notes, cross-device sync, and Remote MCP integrations.
          </p>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: "20px",
                borderRadius: "var(--radius-md)",
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: "13px",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              id="btn-google-signin"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading !== null}
              className="btn-pill btn-primary"
              style={{
                width: "100%",
                padding: "14px 24px",
                fontSize: "14px",
                gap: "10px",
                opacity: loading !== null ? 0.6 : 1,
              }}
            >
              {/* Google logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
              <span>
                {loading === "google" ? "Connecting…" : "Continue with Google"}
              </span>
            </button>

            <button
              id="btn-github-signin"
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading !== null}
              className="btn-pill btn-secondary"
              style={{
                width: "100%",
                padding: "14px 24px",
                fontSize: "14px",
                gap: "10px",
                opacity: loading !== null ? 0.6 : 1,
              }}
            >
              {/* GitHub logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>
                {loading === "github" ? "Connecting…" : "Continue with GitHub"}
              </span>
            </button>
          </div>

          <p
            style={{
              marginTop: "24px",
              fontSize: "12px",
              color: "var(--color-ink-muted)",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            By signing in you agree to our terms of service. Your notes are private and never shared.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            color: "var(--color-ink-muted)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Loading authentication…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
