import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useLang } from '../lib/LanguageContext';
import { Shield, Lock, CheckCircle2, X, Eye, EyeOff, ChevronLeft } from 'lucide-react';

const GRADIENT = 'linear-gradient(135deg, #C65793 0%, #7b5ea7 50%, #4494D1 100%)';

interface Props {
  domain: string;
  onClose: () => void;
}

type Section = 'menu' | 'changePassword' | 'setup2FA' | 'disable2FA';

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const s = type === 'error'
    ? { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: X }
    : { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', icon: CheckCircle2 };
  const Icon = s.icon;
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function PasswordInput({ label, value, onChange, placeholder }: any) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '••••••••'}
          className="w-full rounded-xl px-4 py-3 pr-11 text-sm border border-[#e5e7eb] bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:border-[#C65793] transition-colors"
          dir="ltr"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SecuritySettings({ domain, onClose }: Props) {
  const { t, dir, isAr } = useLang();
  const [section, setSection] = useState<Section>('menu');

  // 2FA status
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAConfigured, setTwoFAConfigured] = useState(false);

  // Change password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // 2FA setup
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // 2FA disable
  const [disableCode, setDisableCode] = useState('');
  const [disablePwd, setDisablePwd] = useState('');
  const [disableError, setDisableError] = useState('');
  const [disableSuccess, setDisableSuccess] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  // Load 2FA status on mount
  useEffect(() => {
    apiFetch(`/api/auth/2fa-status?domain=${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then(d => { setTwoFAEnabled(d.enabled); setTwoFAConfigured(d.configured); })
      .catch(() => {});
  }, [domain]);

  // Load QR when opening 2FA setup
  useEffect(() => {
    if (section === 'setup2FA' && !qrDataUrl) {
      apiFetch('/api/auth/2fa-setup', { method: 'POST', body: JSON.stringify({ domain }) })
        .then(r => r.json())
        .then(d => { setQrDataUrl(d.qrDataUrl); setSecret(d.secret); })
        .catch(() => setSetupError('Could not load QR code. Please try again.'));
    }
  }, [section]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);
    if (newPwd.length < 8) { setPwdError(t('passwordTooShort')); return; }
    if (newPwd !== confirmPwd) { setPwdError(t('passwordMismatch')); return; }
    setPwdLoading(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ domain, currentPassword: currentPwd, newPassword: newPwd }),
      });
      if (!res.ok) { const d = await res.json(); setPwdError(d.error); }
      else { setPwdSuccess(true); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }
    } catch { setPwdError('Something went wrong. Please try again.'); }
    finally { setPwdLoading(false); }
  }

  async function handleEnable2FA(e: React.FormEvent) {
    e.preventDefault();
    setSetupError('');
    setSetupLoading(true);
    try {
      const res = await apiFetch('/api/auth/2fa-enable', {
        method: 'POST',
        body: JSON.stringify({ domain, code: setupCode }),
      });
      if (!res.ok) { const d = await res.json(); setSetupError(d.error); }
      else { setSetupSuccess(true); setTwoFAEnabled(true); }
    } catch { setSetupError('Something went wrong. Please try again.'); }
    finally { setSetupLoading(false); }
  }

  async function handleDisable2FA(e: React.FormEvent) {
    e.preventDefault();
    setDisableError('');
    setDisableLoading(true);
    try {
      const res = await apiFetch('/api/auth/2fa-disable', {
        method: 'POST',
        body: JSON.stringify({ domain, code: disableCode || undefined, password: disablePwd || undefined }),
      });
      if (!res.ok) { const d = await res.json(); setDisableError(d.error); }
      else { setDisableSuccess(true); setTwoFAEnabled(false); setTwoFAConfigured(false); }
    } catch { setDisableError('Something went wrong. Please try again.'); }
    finally { setDisableLoading(false); }
  }

  const cardCls = 'bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.08)]';
  const btnPrimary = 'w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50';
  const btnSecondary = 'flex items-center gap-2 text-sm font-medium text-[#6b7280] hover:text-[#1f2937] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} dir={dir}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ fontFamily: isAr ? "'Cairo', sans-serif" : undefined }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f3f4f6] flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #fdf4f9 0%, #f0f4ff 100%)' }}>
          <div className="flex items-center gap-3">
            {section !== 'menu' && (
              <button onClick={() => { setSection('menu'); setPwdError(''); setPwdSuccess(false); setSetupError(''); setSetupSuccess(false); setDisableError(''); setDisableSuccess(false); setSetupCode(''); setDisableCode(''); setDisablePwd(''); }}
                className={btnSecondary}>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[#1f2937] text-base">{t('securitySettings')}</h2>
              <p className="text-[#9ca3af] text-xs">{domain}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#1f2937] transition-colors p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* ── MENU ── */}
          {section === 'menu' && (
            <div className="space-y-3">
              {/* Change password card */}
              <button onClick={() => setSection('changePassword')}
                className={`${cardCls} w-full p-4 flex items-center gap-4 hover:border-[#C65793] hover:shadow-md transition-all text-left`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #fdf4f9, #f5e9ff)' }}>
                  <Lock className="w-5 h-5 text-[#C65793]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1f2937] text-sm">{t('changePassword')}</p>
                  <p className="text-[#9ca3af] text-xs mt-0.5">Update your portal password</p>
                </div>
                <ChevronLeft className={`w-4 h-4 text-[#d1d5db] flex-shrink-0 ${isAr ? '' : 'rotate-180'}`} />
              </button>

              {/* 2FA card */}
              <button onClick={() => setSection(twoFAEnabled ? 'disable2FA' : 'setup2FA')}
                className={`${cardCls} w-full p-4 flex items-center gap-4 hover:border-[#4494D1] hover:shadow-md transition-all text-left`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #eff6ff, #e0f2fe)' }}>
                  <Shield className="w-5 h-5 text-[#4494D1]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1f2937] text-sm">{t('twoFactorAuth')}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${twoFAEnabled ? 'bg-emerald-500' : 'bg-[#d1d5db]'}`} />
                    <p className="text-xs" style={{ color: twoFAEnabled ? '#059669' : '#9ca3af' }}>
                      {twoFAEnabled ? t('twoFAEnabled') : t('twoFADisabled')}
                    </p>
                  </div>
                </div>
                <ChevronLeft className={`w-4 h-4 text-[#d1d5db] flex-shrink-0 ${isAr ? '' : 'rotate-180'}`} />
              </button>
            </div>
          )}

          {/* ── CHANGE PASSWORD ── */}
          {section === 'changePassword' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <PasswordInput label={t('currentPassword')} value={currentPwd} onChange={setCurrentPwd} />
              <PasswordInput label={t('newPassword')} value={newPwd} onChange={setNewPwd} />
              <PasswordInput label={t('confirmPassword')} value={confirmPwd} onChange={setConfirmPwd} />
              {pwdError && <Alert type="error" message={pwdError} />}
              {pwdSuccess && <Alert type="success" message={t('passwordChanged')} />}
              <button type="submit" disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd} className={btnPrimary} style={{ background: GRADIENT }}>
                {pwdLoading ? '...' : t('savePassword')}
              </button>
            </form>
          )}

          {/* ── SETUP 2FA ── */}
          {section === 'setup2FA' && (
            <div className="space-y-5">
              {!setupSuccess ? (
                <>
                  <div className="rounded-xl p-4 bg-[#eff6ff] border border-[#bfdbfe]">
                    <p className="text-[#1d4ed8] text-sm font-medium mb-1">{t('scan2FACode')}</p>
                    <p className="text-[#3b82f6] text-xs">{t('scan2FADesc')}</p>
                  </div>

                  {qrDataUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-white border-2 border-[#e5e7eb] rounded-2xl shadow-sm">
                        <img src={qrDataUrl} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                      <div className="w-full">
                        <button type="button" onClick={() => setShowSecret(s => !s)}
                          className="text-[#4494D1] text-xs hover:underline flex items-center gap-1">
                          {t('cantScanQR')}
                        </button>
                        {showSecret && (
                          <div className="mt-2 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] p-3">
                            <p className="text-xs text-[#6b7280] mb-1">{t('secretKey')}:</p>
                            <p className="font-mono text-xs text-[#1f2937] break-all select-all">{secret}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-[#9ca3af] text-sm">Loading QR code…</div>
                  )}

                  <form onSubmit={handleEnable2FA} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">{t('enter2FACode')}</label>
                      <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                        placeholder="000000" value={setupCode} onChange={e => setSetupCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-xl px-4 py-3 text-center tracking-[0.4em] font-mono text-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:border-[#4494D1] transition-colors"
                        dir="ltr" autoFocus />
                    </div>
                    {setupError && <Alert type="error" message={setupError} />}
                    <button type="submit" disabled={setupLoading || setupCode.length !== 6} className={btnPrimary} style={{ background: GRADIENT }}>
                      {setupLoading ? '...' : t('verify2FA')}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#1f2937] mb-1">{t('twoFAEnabled')}</p>
                    <p className="text-[#6b7280] text-sm">{t('twoFASetupSuccess')}</p>
                  </div>
                  <button onClick={onClose} className={btnPrimary} style={{ background: GRADIENT }}>Done</button>
                </div>
              )}
            </div>
          )}

          {/* ── DISABLE 2FA ── */}
          {section === 'disable2FA' && (
            <div className="space-y-4">
              {!disableSuccess ? (
                <>
                  <div className="rounded-xl p-4 bg-[#fff7ed] border border-[#fed7aa]">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-[#ea580c]" />
                      <p className="text-[#ea580c] text-sm font-medium">{t('twoFAEnabled')}</p>
                    </div>
                    <p className="text-[#c2410c] text-xs">{t('twoFAEnabledDesc')}</p>
                  </div>
                  <p className="text-[#6b7280] text-sm">{t('disable2FAConfirm')}</p>
                  <form onSubmit={handleDisable2FA} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1.5">{t('enterCode')}</label>
                      <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                        placeholder="000000" value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-xl px-4 py-3 text-center tracking-[0.4em] font-mono text-lg border border-[#e5e7eb] bg-[#f9fafb] text-[#1f2937] focus:outline-none focus:border-[#4494D1]"
                        dir="ltr" />
                    </div>
                    <p className="text-center text-xs text-[#9ca3af]">{t('orEnterPassword')}</p>
                    <PasswordInput label="" value={disablePwd} onChange={setDisablePwd} placeholder="Current password" />
                    {disableError && <Alert type="error" message={disableError} />}
                    <button type="submit" disabled={disableLoading || (!disableCode && !disablePwd)}
                      className={`${btnPrimary} bg-[#dc2626]`}>
                      {disableLoading ? '...' : t('confirmDisable')}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  <div className="text-center">
                    <p className="font-bold text-[#1f2937] mb-1">{t('twoFADisabledSuccess')}</p>
                  </div>
                  <button onClick={onClose} className={btnPrimary} style={{ background: GRADIENT }}>Done</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
