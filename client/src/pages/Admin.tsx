import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch, getAdminToken } from '../lib/api';
import { Upload, Trash2, Plus, LogOut, Shield, Users, FileText, BookOpen, ChevronDown, ChevronUp, ExternalLink, Loader2, Calendar, Phone, Mail } from 'lucide-react';

const ALL_CATEGORIES = [
  'Email Protection', 'Data Protection', 'Network Protection', 'Application Protection',
  'MDR/SOC', 'Penetration Testing', 'Security Awareness', 'GRC', 'Ransomware Protection',
];
const ALL_VENDORS = ['Barracuda', 'Keepit', 'Arctic Wolf', 'Boxphish', 'BullWall', 'CyberSmart', 'Druva', 'WatchGuard'];

function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/5 transition-colors">
        <Icon className="w-5 h-5 text-pink-400" />
        <span className="font-semibold text-white flex-1">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-white/10">{children}</div>}
    </div>
  );
}

export default function Admin({ onLogout }: { onLogout: () => void }) {
  const qc = useQueryClient();

  // ── Account Managers ──────────────────────────────────────
  const { data: accountManagers = [] } = useQuery({ queryKey: ['/api/admin/account-managers'], queryFn: () => apiFetch("/api/admin/account-managers").then(r => r.json()) });
  const [amForm, setAmForm] = useState({ email: '', name: '', display_name: '', phone: '', calendly: '' });
  const [amPhoto, setAmPhoto] = useState<File | null>(null);
  const [amSaving, setAmSaving] = useState(false);
  const amPhotoRef = useRef<HTMLInputElement>(null);

  const saveAM = async () => {
    if (!amForm.email || !amForm.name) return;
    setAmSaving(true);
    const fd = new FormData();
    Object.entries(amForm).forEach(([k, v]) => fd.append(k, v));
    if (amPhoto) fd.append('photo', amPhoto);
    await fetch('/api/admin/account-managers', { method: 'POST', body: fd, headers: { 'Authorization': `Bearer ${getAdminToken()}` } });
    qc.invalidateQueries({ queryKey: ['/api/admin/account-managers'] });
    setAmForm({ email: '', name: '', display_name: '', phone: '', calendly: '' });
    setAmPhoto(null);
    setAmSaving(false);
  };

  const deleteAM = async (email: string) => {
    await apiFetch(`/api/admin/account-managers/${encodeURIComponent(email)}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['/api/admin/account-managers'] });
  };

  // ── Newsletters ──────────────────────────────────────────
  const { data: newsletters = [] } = useQuery({ queryKey: ['/api/admin/newsletters'], queryFn: () => apiFetch("/api/admin/newsletters").then(r => r.json()) });
  const [nlTitle, setNlTitle] = useState('');
  const [nlFile, setNlFile] = useState<File | null>(null);
  const nlRef = useRef<HTMLInputElement>(null);
  const nlMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('title', nlTitle);
      if (nlFile) fd.append('file', nlFile);
      return fetch('/api/admin/newsletters', { method: 'POST', body: fd, headers: { 'Authorization': `Bearer ${getAdminToken()}` } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/admin/newsletters'] }); setNlTitle(''); setNlFile(null); },
  });
  const deleteNl = useMutation({ mutationFn: (id: string) => apiFetch(`/api/admin/newsletters/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/newsletters'] }) });

  // ── Datasheets ───────────────────────────────────────────
  const { data: datasheets = [] } = useQuery({ queryKey: ['/api/datasheets'], queryFn: () => apiFetch("/api/datasheets").then(r => r.json()) });
  const [dsVendor, setDsVendor] = useState('');
  const [dsProduct, setDsProduct] = useState('');
  const [dsCat, setDsCat] = useState('');
  const [dsFile, setDsFile] = useState<File | null>(null);
  const dsRef = useRef<HTMLInputElement>(null);
  const dsMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('vendor', dsVendor); fd.append('product', dsProduct); fd.append('category', dsCat);
      if (dsFile) fd.append('file', dsFile);
      return fetch('/api/admin/datasheets', { method: 'POST', body: fd, headers: { 'Authorization': `Bearer ${getAdminToken()}` } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/datasheets'] }); setDsVendor(''); setDsProduct(''); setDsCat(''); setDsFile(null); },
  });
  const deleteDs = useMutation({ mutationFn: (id: string) => apiFetch(`/api/admin/datasheets/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/datasheets'] }) });

  // ── Research Docs ─────────────────────────────────────────
  const [rdCat, setRdCat] = useState('');
  const [rdTitle, setRdTitle] = useState('');
  const [rdFile, setRdFile] = useState<File | null>(null);
  const rdRef = useRef<HTMLInputElement>(null);
  const [rdSaving, setRdSaving] = useState(false);

  const saveRD = async () => {
    if (!rdCat || !rdTitle || !rdFile) return;
    setRdSaving(true);
    const fd = new FormData();
    fd.append('category', rdCat); fd.append('title', rdTitle); fd.append('file', rdFile);
    await fetch('/api/admin/research-docs', { method: 'POST', body: fd, headers: { 'Authorization': `Bearer ${getAdminToken()}` } });
    setRdCat(''); setRdTitle(''); setRdFile(null); setRdSaving(false);
  };

  // ── Cache Stats ───────────────────────────────────────────
  const { data: stats } = useQuery({ queryKey: ['/api/admin/cache-stats'], queryFn: () => apiFetch("/api/admin/cache-stats").then(r => r.json()) });

  const inputCls = 'bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40 w-full';
  const btnCls = 'flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40';
  const selectCls = 'bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 w-full';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 40%, #0a1628 100%)' }}>
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-white-text.jpg" alt="Broad Peak Cyber" className="h-8 object-contain" />
            <span className="text-white/40 text-sm">/ Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-white/40 hidden md:block">
              Password: <span className="font-mono text-white/60">BPAdmin2024!</span> · 
              URL: <span className="font-mono text-white/60">/#admin</span>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          {stats && <p className="text-white/40 text-sm mt-1">{stats.count} customer accounts cached · Last updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'never'}</p>}
        </div>

        {/* Account Manager Profiles */}
        <Section title="Account Manager Profiles" icon={Users}>
          <div className="space-y-4 mt-4">
            {/* Existing AMs */}
            {(accountManagers as any[]).length > 0 && (
              <div className="space-y-3 mb-4">
                {(accountManagers as any[]).map((am: any) => (
                  <div key={am.email} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                    {am.photo_path ? (
                      <img src={`/uploads/${am.photo_path.split('/').pop()}`} className="w-10 h-10 rounded-full object-cover" alt={am.name} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/40 to-blue-500/40 flex items-center justify-center text-sm font-bold text-white">
                        {am.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{am.display_name || am.name}</div>
                      <div className="text-xs text-white/50 flex items-center gap-2">
                        <span>{am.email}</span>
                        {am.phone && <span>· {am.phone}</span>}
                        {am.calendly && <a href={am.calendly} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200">Calendly ↗</a>}
                      </div>
                    </div>
                    <button onClick={() => deleteAM(am.email)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            {/* Add / update AM */}
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Email (e.g. tim.blakey@broadpeakcyber.com)" value={amForm.email} onChange={e => setAmForm(f => ({ ...f, email: e.target.value }))} />
              <input className={inputCls} placeholder="Full name" value={amForm.name} onChange={e => setAmForm(f => ({ ...f, name: e.target.value }))} />
              <input className={inputCls} placeholder="Display name (optional)" value={amForm.display_name} onChange={e => setAmForm(f => ({ ...f, display_name: e.target.value }))} />
              <input className={inputCls} placeholder="Phone" value={amForm.phone} onChange={e => setAmForm(f => ({ ...f, phone: e.target.value }))} />
              <input className={inputCls} placeholder="Calendly URL (optional)" value={amForm.calendly} onChange={e => setAmForm(f => ({ ...f, calendly: e.target.value }))} />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => amPhotoRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm border border-white/20 hover:bg-white/15 transition-colors w-full">
                  <Upload className="w-4 h-4" /> {amPhoto ? amPhoto.name : 'Upload photo'}
                </button>
                <input type="file" ref={amPhotoRef} accept="image/*" className="hidden" onChange={e => setAmPhoto(e.target.files?.[0] || null)} />
              </div>
            </div>
            <button onClick={saveAM} disabled={amSaving || !amForm.email || !amForm.name} className={btnCls}>
              {amSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Account Manager
            </button>
            <p className="text-xs text-white/30 mt-2">Account owners are auto-detected from Salesforce. Add profiles here to enrich with photo, phone, and Calendly link.</p>
          </div>
        </Section>

        {/* Newsletters */}
        <Section title="Newsletters & Updates" icon={BookOpen}>
          <div className="space-y-4 mt-4">
            {(newsletters as any[]).length > 0 && (
              <div className="space-y-2 mb-4">
                {(newsletters as any[]).map((n: any) => (
                  <div key={n.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <FileText className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{n.title}</div>
                      <div className="text-xs text-white/40">{new Date(n.uploaded_at).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => deleteNl.mutate(n.id)} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <input className={inputCls} placeholder="Newsletter title" value={nlTitle} onChange={e => setNlTitle(e.target.value)} />
            <div className="flex gap-3">
              <button type="button" onClick={() => nlRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm border border-white/20 hover:bg-white/15 transition-colors flex-1">
                <Upload className="w-4 h-4" /> {nlFile ? nlFile.name : 'Choose file (PDF)'}
              </button>
              <input type="file" ref={nlRef} accept=".pdf,.docx" className="hidden" onChange={e => setNlFile(e.target.files?.[0] || null)} />
              <button onClick={() => nlMutation.mutate()} disabled={!nlTitle || !nlFile || nlMutation.isPending} className={btnCls}>
                {nlMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Upload
              </button>
            </div>
          </div>
        </Section>

        {/* Research Docs */}
        <Section title="Research & Business Case Docs" icon={BookOpen}>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-white/50">Upload supporting documents (Gartner reports, whitepapers, business case PDFs) per security category. They appear in the "Further Research" panel when customers click a category.</p>
            <div className="grid grid-cols-2 gap-3">
              <select className={selectCls} value={rdCat} onChange={e => setRdCat(e.target.value)}>
                <option value="">Select category</option>
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className={inputCls} placeholder="Document title" value={rdTitle} onChange={e => setRdTitle(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => rdRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm border border-white/20 hover:bg-white/15 transition-colors flex-1">
                <Upload className="w-4 h-4" /> {rdFile ? rdFile.name : 'Choose PDF / document'}
              </button>
              <input type="file" ref={rdRef} accept=".pdf,.docx,.pptx" className="hidden" onChange={e => setRdFile(e.target.files?.[0] || null)} />
              <button onClick={saveRD} disabled={rdSaving || !rdCat || !rdTitle || !rdFile} className={btnCls}>
                {rdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Upload
              </button>
            </div>
          </div>
        </Section>

        {/* Datasheets */}
        <Section title="Product Datasheets" icon={FileText} defaultOpen={false}>
          <div className="space-y-4 mt-4">
            {(datasheets as any[]).length > 0 && (
              <div className="space-y-2 mb-4">
                {(datasheets as any[]).map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{d.product}</div>
                      <div className="text-xs text-white/40">{d.vendor} · {d.category}</div>
                    </div>
                    <button onClick={() => deleteDs.mutate(d.id)} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <select className={selectCls} value={dsVendor} onChange={e => setDsVendor(e.target.value)}>
                <option value="">Vendor</option>
                {ALL_VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <input className={inputCls} placeholder="Product name" value={dsProduct} onChange={e => setDsProduct(e.target.value)} />
              <select className={selectCls} value={dsCat} onChange={e => setDsCat(e.target.value)}>
                <option value="">Category</option>
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => dsRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm border border-white/20 hover:bg-white/15 transition-colors flex-1">
                <Upload className="w-4 h-4" /> {dsFile ? dsFile.name : 'Choose PDF'}
              </button>
              <input type="file" ref={dsRef} accept=".pdf" className="hidden" onChange={e => setDsFile(e.target.files?.[0] || null)} />
              <button onClick={() => dsMutation.mutate()} disabled={!dsVendor || !dsProduct || !dsCat || !dsFile || dsMutation.isPending} className={btnCls}>
                {dsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Upload
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
