import { useState, useEffect } from 'preact/hooks';
import { initSupabase, getProfile } from '../../lib/auth';

export default function AuthCallbackApp() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function handleCallback() {
      try {
        const client = initSupabase();
        if (!client) {
          setStatus('error');
          setErrorMessage('Supabase client could not be initialized.');
          return;
        }

        // Handle URL hash parameters explicitly if available
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.replace(/^#/, ''));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await client.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }

        // Also check if PKCE code parameter exists in search query
        const search = window.location.search;
        if (search && search.includes('code=')) {
          const params = new URLSearchParams(search);
          const code = params.get('code');
          if (code) {
            await client.auth.exchangeCodeForSession(code);
          }
        }

        const { data, error } = await client.auth.getSession();
        if (error || !data.session) {
          // Listen briefly for onAuthStateChange in case token processing is async
          const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
            if (session) {
              const profile = await getProfile();
              setEmail(session.user.email || profile?.email || 'User');
              setStatus('success');
              if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                chrome.storage.local.set({ stickle_user_session: session });
              }
            }
          });

          // Wait 2s for listener before declaring error
          setTimeout(() => {
            if (status === 'loading') {
              setStatus('error');
              setErrorMessage(error?.message || 'No valid authentication session found in URL hash.');
            }
            authListener.subscription.unsubscribe();
          }, 2000);
          return;
        }

        const profile = await getProfile();
        setEmail(data.session.user.email || profile?.email || 'User');
        setStatus('success');

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ stickle_user_session: data.session });
        }

        // Auto-close tab after 3.5 seconds
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.close) {
            window.close();
          }
        }, 3500);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.message || 'Authentication processing error.');
      }
    }

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111111',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: status === 'success' ? '#e4f579' : status === 'error' ? '#ffd6e8' : '#ffffff',
        color: '#111111',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        {/* Eyebrow Label (DESIGN.md) */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color: '#111111',
          marginBottom: '16px',
          opacity: 0.8,
        }}>
          Stickle Cloud Authentication
        </div>

        {status === 'loading' && (
          <div>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏳</div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', tracking: '-0.26px' }}>
              Authenticating...
            </h1>
            <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
              Verifying your secure magic link session with Supabase.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ fontSize: '42px', marginBottom: '16px' }}>🎉</div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.26px' }}>
              Signed In Successfully!
            </h1>
            <p style={{ fontSize: '15px', color: '#2a3000', marginBottom: '24px', lineHeight: '1.5' }}>
              You are now signed in as <strong>{email}</strong>. Cross-device cloud sync and feature flags are active.
            </p>

            <button
              onClick={() => window.close()}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px', // Pill CTA (DESIGN.md)
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              Close Window
            </button>
            <p style={{ fontSize: '11px', color: '#556600', marginTop: '16px' }}>
              This tab will close automatically in 3 seconds.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ fontSize: '42px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#991b1b' }}>
              Authentication Failed
            </h1>
            <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '24px', lineHeight: '1.5' }}>
              {errorMessage}
            </p>
            <button
              onClick={() => window.close()}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px', // Pill CTA (DESIGN.md)
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Close &amp; Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
