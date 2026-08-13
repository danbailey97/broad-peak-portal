import React, { useState } from 'react';
import { login } from '../lib/api';

const PINK = '#C65793';
const BLUE = '#4494D1';
const GRADIENT = 'linear-gradient(135deg, #C65793 0%, #7b5ea7 50%, #4494D1 100%)';

export default function LoginPage({ onLogin, onAdmin }: { onLogin: (s: any) => void; onAdmin: () => void }) {
  const [domain, setDomain] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(domain.replace(/^@/, ''), password);
      onLogin(data);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4">
      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.30)', borderRadius: 20, padding: '16px 32px', backdropFilter: 'blur(12px)' }}>
            <img src="/logo-white-text.jpg" alt="Broad Peak" style={{ height: 48, objectFit: 'contain' }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Customer Portal</h1>
            <p className="text-white/70 text-sm mt-1">Sign in to access your account</p>
          </div>
        </div>

        {/* Login card */}
        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, backdropFilter: 'blur(16px)', padding: '2rem' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-white/80 text-sm font-medium block mb-1.5">Your email domain</label>
              <input
                type="text"
                placeholder="e.g. yourcompany.com"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', color: '#fff' }}
                required
              />
              <p className="text-white/40 text-xs mt-1">Enter the part after @ in your work email</p>
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium block mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', color: '#fff' }}
                required
              />
            </div>
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(220,38,38,0.20)', border: '1px solid rgba(220,38,38,0.40)', color: '#fca5a5' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 mt-2"
              style={{ background: GRADIENT, boxShadow: '0 4px 20px rgba(198,87,147,0.40)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Need access?{' '}
          <a href="mailto:support@broadpeakcyber.com" className="text-white/60 underline">Contact Broad Peak</a>
          {' · '}
          <button onClick={onAdmin} className="text-white/40 underline text-xs">Admin</button>
        </p>
      </div>
    </div>
  );
}
