import { useState, useEffect } from 'preact/hooks';
import { submitWaitlistEmail, getWaitlistState, validateEmail, WaitlistState } from '../../lib/waitlist';

interface WaitlistFormProps {
  source?: string;
  variant?: 'hero' | 'standalone' | 'card';
  defaultUseCase?: string;
}

const USE_CASES = [
  { id: 'Researcher', label: 'Research & Reading' },
  { id: 'Developer', label: 'Developer & AI Tools' },
  { id: 'Product', label: 'Design & Product' },
  { id: 'Student', label: 'Academic & Study' },
];

export function WaitlistForm({ source = 'homepage', variant = 'standalone', defaultUseCase = 'Researcher' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState(defaultUseCase);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [state, setState] = useState<WaitlistState>({ isJoined: false });

  useEffect(() => {
    setState(getWaitlistState());
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email (e.g., alex@example.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await submitWaitlistEmail({
        email,
        useCase: selectedUseCase,
        source,
      });

      if (res.success) {
        setState(getWaitlistState());
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If already joined, show returning visitor badge
  if (state.isJoined) {
    return (
      <div style={styles.successBox}>
        <div style={styles.successBadge}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>YOU'RE ON THE LIST!</span>
        </div>
        <h3 style={styles.successHeadline}>You're on the rollout waitlist!</h3>
        <p style={styles.successSub}>
          We'll notify <strong>{state.email}</strong> as soon as Stickle is released on the Chrome Web Store.
        </p>
        <div style={styles.successMeta}>
          <span>Joined: {state.joinedAt ? new Date(state.joinedAt).toLocaleDateString() : 'Recently'}</span>
          {state.useCase && <span>Role: {state.useCase}</span>}
        </div>
      </div>
    );
  }

  // Hero layout variant (compact inline bar)
  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubmit} style={styles.heroFormContainer}>
        <div style={styles.heroInputRow}>
          <input
            type="email"
            placeholder="Enter your email to get notified..."
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            disabled={loading}
            style={{
              ...styles.textInput,
              borderColor: errorMsg ? '#ef4444' : '#e5e5e0',
            }}
          />
          <button type="submit" disabled={loading} style={styles.btnPrimaryPill}>
            {loading ? 'Joining...' : 'Get Notified →'}
          </button>
        </div>
        {errorMsg && <div style={styles.errorText}>{errorMsg}</div>}
      </form>
    );
  }

  // Standalone / Section layout (full interactive card with role pills)
  return (
    <div style={styles.cardContainer}>
      <form onSubmit={handleSubmit}>
        {/* Role Selector Pills */}
        <div style={{ marginBottom: 20 }}>
          <label style={styles.fieldLabel}>HOW DO YOU PLAN TO USE STICKLE?</label>
          <div style={styles.pillsRow}>
            {USE_CASES.map((uc) => {
              const isSelected = selectedUseCase === uc.id;
              return (
                <button
                  type="button"
                  key={uc.id}
                  onClick={() => setSelectedUseCase(uc.id)}
                  style={{
                    ...styles.pillToggle,
                    ...(isSelected ? styles.pillToggleSelected : styles.pillToggleDefault),
                  }}
                >
                  {uc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input & Submit Button Row */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <label style={styles.fieldLabel}>YOUR EMAIL ADDRESS</label>
          <div style={styles.inputBtnGroup}>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              disabled={loading}
              style={{
                ...styles.textInput,
                flex: 1,
                borderColor: errorMsg ? '#ef4444' : '#e5e5e0',
              }}
            />
            <button type="submit" disabled={loading} style={styles.btnPrimaryPill}>
              {loading ? 'Joining Waitlist...' : 'Join Waitlist'}
            </button>
          </div>
        </div>

        {errorMsg && <div style={styles.errorText}>{errorMsg}</div>}

        <div style={styles.guaranteeText}>
          100% private. No credit card required. Unsubscribe anytime.
        </div>
      </form>
    </div>
  );
}

const styles = {
  heroFormContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    maxWidth: 520,
    width: '100%',
  },
  heroInputRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: '32px 28px',
    border: '1px solid #e5e5e0',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
    maxWidth: 640,
    width: '100%',
    margin: '0 auto',
  },
  fieldLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: '#52514e',
    display: 'block',
    marginBottom: 8,
  },
  pillsRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  pillToggle: {
    padding: '8px 16px',
    borderRadius: 50, // {rounded.pill}
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: '1px solid #e5e5e0',
  },
  pillToggleDefault: {
    backgroundColor: '#ffffff',
    color: '#111111',
  },
  pillToggleSelected: {
    backgroundColor: '#111111',
    color: '#ffffff',
    borderColor: '#111111',
  },
  inputBtnGroup: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  textInput: {
    padding: '12px 18px',
    fontSize: 15,
    fontFamily: 'inherit',
    borderRadius: 50, // {rounded.pill}
    border: '1px solid #e5e5e0',
    backgroundColor: '#ffffff',
    color: '#111111',
    outline: 'none',
    boxSizing: 'border-box' as const,
    minWidth: 240,
  },
  btnPrimaryPill: {
    backgroundColor: '#111111',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 600,
    padding: '12px 26px',
    borderRadius: 50, // {rounded.pill}
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'transform 0.1s ease, opacity 0.15s ease',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 8,
    fontWeight: 500,
  },
  guaranteeText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#737373',
    marginTop: 16,
    textAlign: 'center' as const,
  },

  // Success Box styles
  successBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: '32px 28px',
    border: '1px solid #d1f7c4',
    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
    maxWidth: 600,
    width: '100%',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  successBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1f7c4',
    color: '#052e16',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.6px',
    padding: '6px 14px',
    borderRadius: 50,
    marginBottom: 16,
  },
  successHeadline: {
    fontSize: 24,
    fontWeight: 800,
    color: '#111111',
    letterSpacing: '-0.5px',
    margin: '0 0 10px',
  },
  successSub: {
    fontSize: 15,
    color: '#52514e',
    lineHeight: 1.5,
    margin: '0 0 16px',
  },
  successMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#737373',
  },
};
