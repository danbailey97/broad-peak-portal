import React, { useState } from 'react';
import { login } from '../lib/api';
import { useLang, LangToggle } from '../lib/LanguageContext';

const GRADIENT = 'linear-gradient(135deg, #C65793 0%, #7b5ea7 50%, #4494D1 100%)';

export default function LoginPage({ onLogin, onAdmin }: { onLogin: (s: any) => void; onAdmin: () => void }) {
  const { t, dir, isAr } = useLang();
  const [domain, setDomain] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
        // 502/503 = Render cold start — auto-retry up to 3 times
        if (retriesLeft > 0 && (msg.includes('502') || msg.includes('503') || msg.includes('Failed to fetch') || msg.includes('NetworkError'))) {
          setWaking(true);
          await new Promise(res => setTimeout(res, 4000));
          return attemptLogin(retriesLeft - 1);
        }
        setWaking(false);
        setError(err.message || t('noAccount'));
      }
    };

    try {
      await attemptLogin(3);
    } finally {
      setLoading(false);
      setWaking(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4" dir={dir}
      style={{ fontFamily: isAr ? "'Cairo', sans-serif" : undefined }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      {/* Language toggle — top right (flips to top left in RTL automatically) */}
      <div className="fixed top-4 end-4 z-50">
        <LangToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.80)', borderRadius: 20, padding: '16px 32px' }}>
            <img src="/logo-black-text.jpg" alt="Broad Peak" style={{ height: 48, objectFit: 'contain' }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{t('customerPortal')}</h1>
            <p className="text-white/70 text-sm mt-1">{t('signInToAccess')}</p>
          </div>
        </div>

        {/* Login card */}
        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, backdropFilter: 'blur(16px)', padding: '2rem' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-white/80 text-sm font-medium block mb-1.5">{t('emailDomain')}</label>
              <input
                type="text"
                placeholder={t('emailDomainPlaceholder')}
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', color: '#fff', textAlign: isAr ? 'right' : 'left' }}
                dir="ltr"  /* always LTR for domain input — auth-safe */
                required
              />
              <p className="text-white/40 text-xs mt-1">{t('emailDomainHint')}</p>
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium block mb-1.5">{t('password')}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', color: '#fff' }}
                dir="ltr"  /* always LTR for passwords */
                required
              />
            </div>
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(220,38,38,0.20)', border: '1px solid rgba(220,38,38,0.40)', color: '#fca5a5' }}>
                {error}
              </div>
            )}
            {waking && (
              <div className="rounded-xl px-4 py-3 text-sm text-center" style={{ background: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.35)', color: '#fde68a' }}>
                {isAr ? '⏳ جارٍ تشغيل الخادم، يُرجى الانتظار...' : '⏳ Server is waking up, retrying…'}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ background: GRADIENT }}
              data-testid="login-submit"
            >
              {waking ? (isAr ? 'جارٍ الاتصال...' : 'Connecting…') : loading ? t('signingIn') : t('signIn')}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <button onClick={onAdmin} className="text-white/40 text-xs hover:text-white/60 transition-colors">
            {t('adminLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
