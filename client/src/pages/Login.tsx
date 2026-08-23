import React, { useState, useEffect } from 'react';
import { login, apiFetch } from '../lib/api';
import { useLang, LangToggle } from '../lib/LanguageContext';
import { ArrowLeft, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const GRADIENT = 'linear-gradient(135deg, #C65793 0%, #7b5ea7 50%, #4494D1 100%)';

type View = 'login' | 'forgot' | 'reset' | 'totp';

function Card({ children, dir }: { children: React.ReactNode; dir: string }) {
  return (
    <div dir={dir} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, backdropFilter: 'blur(16px)', padding: '2rem' }}>
      {children}
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, dir, hint }: any) {
  return (
    <div>
      <label className="text-white/80 text-sm font-medium block mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', color: '#fff' }}
        dir={dir || 'ltr'}
        required
      />
      {hint && <p className="text-white/40 text-xs mt-1">{hint}</p>}
    </div>
  );
}

function Alert({ type, message }: { type: 'error' | 'success' | 'warn'; message: string }) {
  const styles = {
    error: { bg: 'rgba(220,38,38,0.20)', border: 'rgba(220,38,38,0.40)', text: '#fca5a5' },
    success: { bg: 'rgba(5,150,105,0.20)', border: 'rgba(5,150,105,0.40)', text: '#6ee7b7' },
    warn: { bg: 'rgba(255,193,7,0.15)', border: 'rgba(255,193,7,0.35)', text: '#fde68a' },
  }[type];
  return (
    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: styles.bg, border: `1px solid ${styles.border}`, color: styles.text }}>
      {message}
    </div>
  );
}

export default function LoginPage({ onLogin, onAdmin }: { onLogin: (s: any) => void; onAdmin: () => void }) {
  const { t, dir, isAr } = useLang();
  const [view, setView] = useState<View>('login');

  // Login state
  const [domain, setDomain] = useState('');
  const [password, setPassword] = useState('');
  const [pendingDomain, setPendingDomain] = useState(''); // domain that needs TOTP
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);

  // Forgot password state
  const [forgotDomain, setForgotDomain] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password state (token from URL hash)
  const [resetToken, setResetToken] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Detect reset token in hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/[?&]token=([^&]+)/);
    if (match) {
      setResetToken(match[1]);
      setView('reset');
      // Clean URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setWaking(false);

    const attemptLogin = async (retriesLeft: number): Promise<void> => {
      try {
        const data = await login(domain.replace(/^@/, ''), password);
        onLogin(data);
      } catch (err: any) {
        const msg = err.message || '';
        if (msg.includes('requires2FA')) {
          setPendingDomain(domain.replace(/^@/, '').toLowerCase().trim());
          setView('totp');
          return;
        }
        if (retriesLeft > 0 && (msg.includes('502') || msg.includes('503') || msg.includes('Failed to fetch') || msg.includes('NetworkError'))) {
          setWaking(true);
          await new Promise(res => setTimeout(res, 4000));
          return attemptLogin(retriesLeft - 1);
        }
        setWaking(false);
        setError(msg || t('noAccount'));
      }
    };

    try {
      await attemptLogin(3);
    } finally {
      setLoading(false);
      setWaking(false);
    }
  }

  // ── TOTP verify ───────────────────────────────────────────────────────────
  async function handleTotp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(pendingDomain, password, totpCode);
      onLogin(data);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password ────────────────────────────────────────────────────────
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ domain: forgotDomain.replace(/^@/, '') }),
      });
      setForgotSent(true);
    } catch {
      setForgotError('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  }

  // ── Reset password ─────────────────────────────────────────────────────────
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');
    if (newPwd.length < 8) { setResetError(t('passwordTooShort')); return; }
    if (newPwd !== confirmPwd) { setResetError(t('passwordMismatch')); return; }
    setResetLoading(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, newPassword: newPwd }),
      });
      if (!res.ok) {
        const d = await res.json();
        setResetError(d.error || t('invalidResetToken'));
      } else {
        setResetSuccess(true);
      }
    } catch {
      setResetError(t('invalidResetToken'));
    } finally {
      setResetLoading(false);
    }
  }

  const btnStyle = { background: GRADIENT };
  const btnCls = 'w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 mt-1';
  const backBtn = (
    <button type="button" onClick={() => { setView('login'); setError(''); setForgotSent(false); setForgotError(''); }}
      className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm transition-colors mb-4">
      <ArrowLeft className="w-4 h-4" />
      {t('backToLogin')}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4" dir={dir}
      style={{ fontFamily: isAr ? "'Cairo', sans-serif" : undefined }}>
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      <div className="fixed top-4 end-4 z-50"><LangToggle /></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.80)', borderRadius: 20, padding: '16px 32px' }}>
            <img src="/logo-black-text.jpg" alt="Broad Peak" style={{ height: 48, objectFit: 'contain' }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{t('customerPortal')}</h1>
            <p className="text-white/70 text-sm mt-1">
              {view === 'login' && t('signInToAccess')}
              {view === 'forgot' && t('forgotPasswordTitle')}
              {view === 'reset' && t('resetPasswordTitle')}
              {view === 'totp' && 'Two-Factor Authentication'}
            </p>
          </div>
        </div>

        {/* ── LOGIN VIEW ── */}
        {view === 'login' && (
          <Card dir={dir}>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <InputField label={t('emailDomain')} value={domain} onChange={setDomain}
                placeholder={t('emailDomainPlaceholder')} hint={t('emailDomainHint')} />
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-white/80 text-sm font-medium">{t('password')}</label>
                  <button type="button" onClick={() => { setView('forgot'); setForgotDomain(domain); }}
                    className="text-white/50 hover:text-white/80 text-xs transition-colors">
                    {t('forgotPassword')}
                  </button>
                </div>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', color: '#fff' }}
                  dir="ltr" required />
              </div>
              {error && <Alert type="error" message={error} />}
              {waking && <Alert type="warn" message={isAr ? '⏳ جارٍ تشغيل الخادم، يُرجى الانتظار...' : '⏳ Server is waking up, retrying…'} />}
              <button type="submit" disabled={loading} className={btnCls} style={btnStyle} data-testid="login-submit">
                {waking ? (isAr ? 'جارٍ الاتصال...' : 'Connecting…') : loading ? t('signingIn') : t('signIn')}
              </button>
            </form>
          </Card>
        )}

        {/* ── TOTP VIEW ── */}
        {view === 'totp' && (
          <Card dir={dir}>
            {backBtn}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(198,87,147,0.25)', border: '1px solid rgba(198,87,147,0.4)' }}>
                <Shield className="w-5 h-5 text-[#C65793]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Authenticator Code Required</p>
                <p className="text-white/50 text-xs mt-0.5">Open your authenticator app and enter the 6-digit code</p>
              </div>
            </div>
            <form onSubmit={handleTotp} className="flex flex-col gap-4">
              <div>
                <label className="text-white/80 text-sm font-medium block mb-1.5">{t('enterCode')}</label>
                <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                  placeholder="000000" value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none text-center tracking-[0.4em] font-mono"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', color: '#fff' }}
                  dir="ltr" autoFocus />
              </div>
              {error && <Alert type="error" message={error} />}
              <button type="submit" disabled={loading || totpCode.length !== 6} className={btnCls} style={btnStyle}>
                {loading ? t('signingIn') : t('signIn')}
              </button>
            </form>
          </Card>
        )}

        {/* ── FORGOT PASSWORD VIEW ── */}
        {view === 'forgot' && (
          <Card dir={dir}>
            {backBtn}
            {!forgotSent ? (
              <form onSubmit={handleForgot} className="flex flex-col gap-4">
                <p className="text-white/60 text-sm">{t('forgotPasswordDesc')}</p>
                <InputField label={t('emailDomain')} value={forgotDomain} onChange={setForgotDomain}
                  placeholder={t('emailDomainPlaceholder')} hint={t('emailDomainHint')} />
                {forgotError && <Alert type="error" message={forgotError} />}
                <button type="submit" disabled={forgotLoading || !forgotDomain} className={btnCls} style={btnStyle}>
                  {forgotLoading ? '...' : t('sendResetLink')}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <p className="text-white text-center text-sm leading-relaxed">{t('resetLinkSent')}</p>
                <button type="button" onClick={() => setView('login')} className="text-white/50 hover:text-white/80 text-sm transition-colors">
                  {t('backToLogin')}
                </button>
              </div>
            )}
          </Card>
        )}

        {/* ── RESET PASSWORD VIEW ── */}
        {view === 'reset' && (
          <Card dir={dir}>
            {!resetSuccess ? (
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <p className="text-white/60 text-sm">{t('resetPasswordDesc')}</p>
                <InputField label={t('newPassword')} type="password" value={newPwd} onChange={setNewPwd} placeholder="••••••••" />
                <InputField label={t('confirmPassword')} type="password" value={confirmPwd} onChange={setConfirmPwd} placeholder="••••••••" />
                {resetError && <Alert type="error" message={resetError} />}
                <button type="submit" disabled={resetLoading || !newPwd || !confirmPwd} className={btnCls} style={btnStyle}>
                  {resetLoading ? '...' : t('setNewPassword')}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <p className="text-white text-center text-sm leading-relaxed">{t('passwordResetSuccess')}</p>
                <button type="button" onClick={() => setView('login')} className={btnCls} style={btnStyle}>
                  {t('backToLogin')}
                </button>
              </div>
            )}
          </Card>
        )}

        <div className="text-center mt-4">
          <button onClick={onAdmin} className="text-white/40 text-xs hover:text-white/60 transition-colors">
            {t('adminLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
