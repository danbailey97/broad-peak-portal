import React, { useState, useEffect } from 'react';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/Admin';
import { setToken, setAdminToken, clearTokens } from './lib/api';
import { LanguageProvider } from './lib/LanguageContext';

export default function App() {
  const [page, setPage] = useState<'login' | 'dashboard' | 'admin'>('login');
  const [session, setSession] = useState<{ domain: string; accountName: string; mustChangePassword?: boolean; userEmail?: string; userName?: string } | null>(null);

  useEffect(() => {
    if (window.location.hash === '#admin') setPage('admin');
  }, []);

  function handleLogin(s: { domain: string; accountName: string; token: string; mustChangePassword?: boolean; userEmail?: string; userName?: string }) {
    setToken(s.token);
    setSession({ domain: s.domain, accountName: s.accountName, mustChangePassword: s.mustChangePassword, userEmail: s.userEmail, userName: s.userName });
    setPage('dashboard');
  }

  function handleAdminLogin(token: string) {
    setAdminToken(token);
    setPage('admin');
  }

  function handleLogout() {
    clearTokens();
    setSession(null);
    setPage('login');
    window.location.hash = '';
  }

  return (
    <LanguageProvider>
      {page === 'admin' && <AdminPage onLogout={handleLogout} />}
      {page === 'dashboard' && session && <Dashboard domain={session.domain} mustChangePassword={!!session.mustChangePassword} userEmail={session.userEmail || ''} userName={session.userName || ''} onLogout={handleLogout} />}
      {page === 'login' && <LoginPage onLogin={handleLogin} onAdmin={() => { window.location.hash = '#admin'; setPage('admin'); }} />}
    </LanguageProvider>
  );
}
