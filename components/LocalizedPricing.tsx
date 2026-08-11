import { useState, useEffect } from 'preact/hooks';
import {
  SUPPORTED_CURRENCIES,
  detectUserCurrency,
  setPreferredCurrency,
  formatPrice,
  type CurrencyCode,
} from '../lib/currency';
import { openDodoCheckout } from '../lib/dodo-payments';

interface LocalizedPricingProps {
  userEmail?: string;
  userId?: string;
  onSelectTier?: (tier: 'pro' | 'teams') => void;
  compact?: boolean;
}

export function LocalizedPricing({ userEmail, userId, compact = false }: LocalizedPricingProps) {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [detectedRegion, setDetectedRegion] = useState<string>('USD');

  useEffect(() => {
    const detected = detectUserCurrency();
    setCurrency(detected);
    setDetectedRegion(detected);
  }, []);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    setPreferredCurrency(newCurrency);
  };

  const currConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;

  return (
    <div className="stickle-pricing-wrapper" style={{ width: '100%' }}>
      {/* Region & Currency Selector Bar */}
      <div
        className="currency-bar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 16px',
          background: 'var(--color-bg-subtle, #f7f7f8)',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid var(--color-border-subtle, #e5e5e7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
          <span style={{ fontSize: '16px' }}>📍</span>
          <span>
            Region Currency:{' '}
            <strong style={{ color: 'var(--color-fg-main, #111)' }}>
              {currConfig.flag} {currConfig.name} ({currConfig.symbol})
            </strong>
          </span>
          {detectedRegion === currency && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '100px',
                background: '#e4f579',
                color: '#111',
                fontWeight: 600,
              }}
            >
              Auto-detected
            </span>
          )}
        </div>

        {/* Currency Switcher Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => {
            const item = SUPPORTED_CURRENCIES[code];
            const isActive = code === currency;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleCurrencyChange(code)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '100px',
                  border: isActive ? '1px solid #111' : '1px solid #e0e0e0',
                  background: isActive ? '#111' : '#fff',
                  color: isActive ? '#fff' : '#444',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.flag} {item.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Free Plan */}
        <div
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #e0e0e0)',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', fontWeight: 600 }}>
              Open Source
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 12px 0' }}>Stickle Free</h3>
            <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>$0</div>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
              Local-first sticky notes anchored to any webpage. 100% open source & private.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: '13px', lineHeight: '1.8' }}>
              <li>✓ Local-first 3-tier DOM Anchoring</li>
              <li>✓ IndexedDB local persistence</li>
              <li>✓ Text selection highlights</li>
              <li>✓ Notion manual export</li>
              <li>✓ Local STDIO MCP Server</li>
            </ul>
          </div>
          <button
            disabled
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '100px',
              border: '1px solid #ccc',
              background: '#f0f0f0',
              color: '#666',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Included Free
          </button>
        </div>

        {/* Pro Supporter Plan */}
        <div
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid #111',
            background: '#ffffff',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              background: '#e4f579',
              color: '#111',
              padding: '3px 12px',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            MOST POPULAR
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111', fontWeight: 600 }}>
              Lifetime Access
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 12px 0' }}>Pro Supporter</h3>
            <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
              {formatPrice(currConfig.proPrice, currConfig.code)}
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#666' }}> / lifetime</span>
            </div>
            <div style={{ fontSize: '12px', color: '#00875a', fontWeight: 600, marginBottom: '16px' }}>
              Pay once, use forever. Localized via Dodo Payments.
            </div>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
              Cross-device cloud sync, central web dashboard, and remote MCP server.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: '13px', lineHeight: '1.8' }}>
              <li>✓ Everything in Free</li>
              <li>✓ <strong>Real-time Cloud Sync</strong> across devices</li>
              <li>✓ <strong>Central Web Dashboard</strong> access</li>
              <li>✓ <strong>Remote MCP Server</strong> (HTTPS/SSE)</li>
              <li>✓ Custom pastel themes & note defaults</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => openDodoCheckout({ plan: 'pro', currency, userEmail, userId })}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '100px',
              border: 'none',
              background: '#111111',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.1s ease',
            }}
          >
            Buy Pro ({formatPrice(currConfig.proPrice, currConfig.code)})
          </button>
        </div>

        {/* Teams Plan */}
        <div
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #e0e0e0)',
            background: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', fontWeight: 600 }}>
              Team Workspaces
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '6px 0 12px 0' }}>Stickle Teams</h3>
            <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
              {formatPrice(currConfig.teamsPrice, currConfig.code)}
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#666' }}> / user / month</span>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>Flexible monthly billing per seat</div>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
              Collaborate live on the web. Share sticky notes, highlights, and team timelines.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: '13px', lineHeight: '1.8' }}>
              <li>✓ Everything in Pro Supporter</li>
              <li>✓ <strong>Team Shared Annotations</strong> on any web page</li>
              <li>✓ <strong>Author Badges</strong> & read-only enforcement</li>
              <li>✓ <strong>Team Activity Timeline</strong></li>
              <li>✓ Workspace roles & member invite controls</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => openDodoCheckout({ plan: 'teams', currency, userEmail, userId })}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '100px',
              border: '1px solid #111',
              background: '#ffffff',
              color: '#111111',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Get Teams ({formatPrice(currConfig.teamsPrice, currConfig.code)}/mo)
          </button>
        </div>
      </div>
    </div>
  );
}
