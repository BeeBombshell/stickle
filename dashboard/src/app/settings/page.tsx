"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ email?: string; tier?: string; license_key?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
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

  return (
    <div className="max-w-3xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-[#111] mb-2">Account Settings & Billing</h1>
      <p className="text-sm text-[#666] mb-8">
        Manage your subscription tier, license status, and remote access configuration.
      </p>

      {/* Subscription Card */}
      <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-[#888]">Current Plan</div>
            <div className="text-xl font-extrabold text-[#111] capitalize mt-1">
              {tier === "supporter" ? "Stickle Pro Supporter" : tier === "team_member" ? "Stickle Teams" : "Stickle Free Tier"}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              tier !== "free" ? "bg-[#e4f579] text-[#111]" : "bg-[#f0f0f0] text-[#666]"
            }`}
          >
            {tier.toUpperCase()}
          </span>
        </div>

        {profile?.license_key && (
          <div className="mb-6 p-3 bg-[#f8f8f6] rounded-xl border border-[#e5e5e0] text-xs font-mono">
            <span className="text-[#888]">License Key: </span>
            <span className="font-bold text-[#111]">{profile.license_key}</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {tier === "free" ? (
            <Link
              href="/upgrade"
              className="px-5 py-2.5 rounded-full bg-[#111] text-white text-xs font-bold hover:bg-[#222] transition-colors"
            >
              Upgrade to Pro ($29 Lifetime) ⚡
            </Link>
          ) : (
            <Link
              href="/upgrade"
              className="px-5 py-2.5 rounded-full bg-white text-[#111] border border-[#111] text-xs font-bold hover:bg-[#f5f5f5] transition-colors"
            >
              Manage Subscription / View Invoices ↗
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
