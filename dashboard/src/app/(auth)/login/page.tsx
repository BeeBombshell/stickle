"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      setLoading(provider);
      setError(null);
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/notes`,
        },
      });

      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || "Failed to initiate sign in");
      setLoading(null);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="color-block color-block-soft border border-[#e5e5e0] text-center shadow-sm">
        {/* Exact Holygrail Logo Lockup */}
        <div className="w-12 h-12 bg-[#111111] rounded-[14px] mx-auto mb-6 flex items-center justify-center shadow-md">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
            <circle cx="14" cy="14" r="5" fill="white" opacity="0.9" />
            <circle cx="14" cy="14" r="2" fill="#111" />
          </svg>
        </div>

        <span className="eyebrow text-[#52514e] mb-2">STICKLE AUTHENTICATION</span>
        <h1 className="card-title text-2xl text-[#111111] mb-2">
          Sign In to Stickle
        </h1>
        <p className="text-sm font-sans text-[#52514e] mb-6">
          Access your web notes, cross-device sync, and Remote MCP integrations across all your browsers.
        </p>

        {/* Lime Accent Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#e4f579] text-[#111111] text-[11px] font-mono uppercase tracking-[0.6px] font-semibold mb-8">
          <span>⚡ Real-Time Cloud Sync</span>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-2xl bg-red-50 text-red-600 text-xs border border-red-200">
            {error}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthSignIn("google")}
            disabled={loading !== null}
            className="w-full btn-pill btn-primary py-3 flex items-center justify-center gap-3 text-sm disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            <span>{loading === "google" ? "Connecting..." : "Continue with Google"}</span>
          </button>

          <button
            onClick={() => handleOAuthSignIn("github")}
            disabled={loading !== null}
            className="w-full btn-pill btn-secondary py-3 flex items-center justify-center gap-3 text-sm disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>{loading === "github" ? "Connecting..." : "Continue with GitHub"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
