"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { openDodoCheckout } from "@/lib/dodo-payments";
import { createClient } from "@/lib/supabase/client";

type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'BRL' | 'JPY';

const SUPPORTED_CURRENCIES: Record<CurrencyCode, { code: CurrencyCode; symbol: string; name: string; flag: string; proPrice: number; teamsPrice: number }> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', proPrice: 29, teamsPrice: 9 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', proPrice: 27, teamsPrice: 8 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', proPrice: 24, teamsPrice: 7 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', proPrice: 2399, teamsPrice: 749 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', proPrice: 39, teamsPrice: 12 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', proPrice: 44, teamsPrice: 14 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', proPrice: 149, teamsPrice: 45 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', proPrice: 4200, teamsPrice: 1300 },
};

function formatPrice(amount: number, currencyCode: CurrencyCode): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount}`;
  }
}

function UpgradeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawStatus = searchParams.get("status")?.toLowerCase();
  const paymentId = searchParams.get("payment_id");
  const legacySuccess = searchParams.get("success") === "true";

  const isSuccess =
    rawStatus === "succeeded" ||
    rawStatus === "paid" ||
    rawStatus === "success" ||
    (!!paymentId && rawStatus !== "failed" && rawStatus !== "cancelled") ||
    (legacySuccess && !rawStatus);

  const isFailed =
    rawStatus === "failed" ||
    rawStatus === "cancelled" ||
    rawStatus === "error" ||
    rawStatus === "declined";

  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
          if (session.user.email) setEmail(session.user.email);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    // Detect currency via timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.startsWith("Europe/")) setCurrency("EUR");
      else if (tz === "Europe/London") setCurrency("GBP");
      else if (tz.startsWith("Asia/Kolkata") || tz.startsWith("Asia/Calcutta")) setCurrency("INR");
      else if (tz.startsWith("Asia/Tokyo")) setCurrency("JPY");
      else if (tz.startsWith("America/Toronto") || tz.startsWith("America/Vancouver")) setCurrency("CAD");
      else if (tz.startsWith("Australia/")) setCurrency("AUD");
      else setCurrency("USD");
    } catch {}
  }, []);

  const handleCheckout = (plan: "pro" | "teams") => {
    if (!user) {
      router.push("/login?redirectTo=/upgrade");
      return;
    }

    openDodoCheckout({
      plan,
      currency,
      userEmail: user.email || email || undefined,
      userId: user.id,
      redirectUrl: typeof window !== "undefined" ? `${window.location.origin}/upgrade` : undefined,
    });
  };

  const currConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Header Banner */}
      <div className="text-center mb-10">
        <span className="eyebrow-lime text-xs font-mono uppercase tracking-wider mb-2 inline-block px-3 py-1 bg-[#e4f579] rounded-full text-[#111] font-bold">
          Unlock Full Power
        </span>
        <h1 className="text-4xl font-extrabold text-[#111111] tracking-tight mt-2">
          Upgrade Stickle Account
        </h1>
        <p className="text-[#666666] text-base max-w-xl mx-auto mt-3">
          Support open-source development and unlock real-time cloud sync, central web dashboard access, and remote MCP server integrations.
        </p>
      </div>

      {/* Success Notification Banner */}
      {isSuccess && (
        <div className="mb-8 p-4 bg-[#e6f4ea] border border-[#34a853] text-[#137333] rounded-xl text-center font-medium shadow-sm flex items-center justify-center gap-2">
          <span className="text-xl">🎉</span>
          <span>
            Thank you for upgrading! Your payment was successful {paymentId ? `(ID: ${paymentId})` : ""}. Your license key and features are being provisioned. Re-open your Stickle extension to refresh status.
          </span>
        </div>
      )}

      {/* Failure Notification Banner */}
      {isFailed && (
        <div className="mb-8 p-4 bg-[#fce8e6] border border-[#ea4335] text-[#c5221f] rounded-xl text-center font-medium shadow-sm flex items-center justify-center gap-2">
          <span className="text-xl">⚠️</span>
          <span>
            Payment was not completed (Status: {rawStatus || "failed"}). Your account was not charged. Please try again or select another payment method.
          </span>
        </div>
      )}

      {/* Auth Status Notification Bar */}
      {!authLoading && !user && (
        <div className="mb-8 p-4 bg-[#fff9e6] border border-[#ffe58f] text-[#876800] rounded-2xl text-center text-xs shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-left">
            <span className="text-base">🔒</span>
            <span>
              <strong>Sign in required to upgrade:</strong> Please sign in to your Stickle account before completing purchase so your license key is bound to your account.
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/login?redirectTo=/upgrade")}
            className="px-4 py-2 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-[#222] transition-colors whitespace-nowrap shadow-sm"
          >
            Sign In Now ↗
          </button>
        </div>
      )}

      {!authLoading && user && (
        <div className="mb-8 p-3 bg-[#e8f4fd] border border-[#b6e0fe] text-[#004085] rounded-2xl text-center text-xs flex items-center justify-center gap-2 shadow-sm">
          <span>👤</span>
          <span>
            Signed in as <strong>{user.email}</strong>. Your license will be automatically linked to your account.
          </span>
        </div>
      )}

      {/* Currency Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#f8f8f6] border border-[#e5e5e0] rounded-2xl mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-[#111]">
          <span>📍 Selected Currency:</span>
          <span className="font-bold">
            {currConfig.flag} {currConfig.name} ({currConfig.symbol})
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => {
            const item = SUPPORTED_CURRENCIES[code];
            const isActive = code === currency;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#111111] text-white"
                    : "bg-white text-[#444] border border-[#e0e0e0] hover:border-[#111]"
                }`}
              >
                {item.flag} {item.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Email Input for Pre-filling Checkout */}
      <div className="mb-8 max-w-md mx-auto">
        <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider mb-2 text-center">
          Pre-filled account email for activation
        </label>
        <input
          type="email"
          placeholder="your.email@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!!user?.email}
          className="w-full px-4 py-2.5 rounded-xl border border-[#e0e0e0] text-sm focus:outline-none focus:border-[#111] transition-colors disabled:bg-[#f5f5f5] disabled:text-[#666]"
        />
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-[#888] mb-1">
              Open Source
            </div>
            <h2 className="text-xl font-bold text-[#111] mb-2">Free Tier</h2>
            <div className="text-3xl font-extrabold text-[#111] mb-4">$0</div>
            <p className="text-xs text-[#666] mb-6 leading-relaxed">
              Local-first sticky notes anchored to any webpage. 100% open source & private.
            </p>
            <ul className="space-y-2.5 text-xs text-[#444] mb-8">
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> 3-tier DOM Anchoring
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> IndexedDB local persistence
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Text selection highlights
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Local STDIO MCP Server
              </li>
            </ul>
          </div>
          <button
            disabled
            className="w-full py-2.5 rounded-full bg-[#f0f0f0] text-[#888] text-xs font-semibold border border-[#e0e0e0]"
          >
            Current Free Plan
          </button>
        </div>

        {/* Pro Supporter */}
        <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 flex flex-col justify-between shadow-lg relative">
          <div className="absolute -top-3 right-6 bg-[#e4f579] text-[#111] px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            RECOMMENDED
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-[#111] mb-1">
              Lifetime Access
            </div>
            <h2 className="text-xl font-bold text-[#111] mb-2">Pro Supporter</h2>
            <div className="text-3xl font-extrabold text-[#111] mb-1">
              {formatPrice(currConfig.proPrice, currConfig.code)}
              <span className="text-xs font-normal text-[#666]"> / lifetime</span>
            </div>
            <div className="text-[11px] text-[#00875a] font-semibold mb-4">
              Pay once. Dodo Payments localized pricing.
            </div>
            <p className="text-xs text-[#666] mb-6 leading-relaxed">
              Cross-device cloud sync, central web dashboard, and remote MCP server.
            </p>
            <ul className="space-y-2.5 text-xs text-[#111] font-medium mb-8">
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Everything in Free
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Real-time Cloud Sync
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Central Web Dashboard
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Remote MCP (HTTPS/SSE)
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => handleCheckout("pro")}
            className="w-full py-3 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-[#222] transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {user ? (
              `Buy Pro (${formatPrice(currConfig.proPrice, currConfig.code)})`
            ) : (
              `Sign In to Buy Pro (${formatPrice(currConfig.proPrice, currConfig.code)}) ↗`
            )}
          </button>
        </div>

        {/* Teams */}
        <div className="bg-[#fafafa] border border-[#e5e5e0] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-[#666] mb-1">
              Team Workspaces
            </div>
            <h2 className="text-xl font-bold text-[#111] mb-2">Stickle Teams</h2>
            <div className="text-3xl font-extrabold text-[#111] mb-1">
              {formatPrice(currConfig.teamsPrice, currConfig.code)}
              <span className="text-xs font-normal text-[#666]"> / user / mo</span>
            </div>
            <div className="text-[11px] text-[#666] mb-4">Flexible monthly billing</div>
            <p className="text-xs text-[#666] mb-6 leading-relaxed">
              Collaborate live on shared web annotations, team timelines, and roles.
            </p>
            <ul className="space-y-2.5 text-xs text-[#444] mb-8">
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Everything in Pro
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Shared Web Annotations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Author Badges & Roles
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#34a853]">✓</span> Team Activity Timeline
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => handleCheckout("teams")}
            className="w-full py-3 rounded-full bg-white text-[#111] border border-[#111] text-xs font-bold hover:bg-[#f5f5f5] transition-colors flex items-center justify-center gap-2"
          >
            {user ? (
              `Get Teams (${formatPrice(currConfig.teamsPrice, currConfig.code)}/mo)`
            ) : (
              `Sign In to Get Teams (${formatPrice(currConfig.teamsPrice, currConfig.code)}/mo) ↗`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-[#666]">Loading pricing matrix...</div>}>
      <UpgradeContent />
    </Suspense>
  );
}
