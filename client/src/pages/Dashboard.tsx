import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Shield, Database, Network, Globe, Eye, Search, BookOpen, Clipboard, Star, AlertTriangle, ChevronRight, X, Send, Loader2, ExternalLink, Phone, Mail, Calendar, FileText, Lock, Wifi, Cpu, GraduationCap, ShieldAlert } from 'lucide-react';
import CEReadiness from './CEReadiness';
import CyberRiskScore from './CyberRiskScore';

interface ProductEntry { name: string; vendor: string; }
interface CategoryEntry { category: string; status: 'active' | 'expired' | 'not_owned'; products: ProductEntry[]; expiresAt: string | null; }
interface AccountOwner { name: string; email: string; phone?: string; photo?: string; calendly?: string; }
interface CustomerData { accountName: string; domain: string; grid: CategoryEntry[]; accountOwner?: AccountOwner; }
interface Message { role: 'user' | 'assistant'; content: string; }
interface ResearchDoc { id: string; title: string; filename: string; url: string; uploadedAt: string; }

const CATEGORY_ICONS: Record<string, any> = {
  'Email Protection': Mail,
  'Data Protection': Lock,
  'Network Protection': Wifi,
  'Application Protection': Globe,
  'MDR/SOC': Eye,
  'Penetration Testing': Search,
  'Security Awareness': GraduationCap,
  'GRC': Clipboard,
  'Ransomware Protection': ShieldAlert,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Email Protection': 'Email security, anti-phishing, and BEC prevention',
  'Data Protection': 'Backup, recovery, and data resilience',
  'Network Protection': 'Firewall, SD-WAN, and perimeter security',
  'Application Protection': 'WAF, MFA, and endpoint defence',
  'MDR/SOC': '24/7 managed detection and response',
  'Penetration Testing': 'Vulnerability testing and security validation',
  'Security Awareness': 'Phishing simulation and staff training',
  'GRC': 'Governance, risk, compliance and Cyber Essentials',
  'Ransomware Protection': 'Ransomware containment and rapid response',
};

// Research data pre-loaded from vendor-urls.json logic
const CATEGORY_RESEARCH: Record<string, { summary: string; stats: string[] }> = {
  'Email Protection': {
    summary: 'Business email compromise and phishing remain the costliest attack vectors. The FBI recorded over $3 billion in BEC losses in 2025 alone, and phishing-initiated breaches cost organisations nearly $4.9 million on average.',
    stats: ['$3B+ in BEC losses recorded by FBI IC3 in 2025', 'Phishing breaches cost avg. $4.88M (IBM 2025)', '58% of financially motivated phishing attacks were BEC-related (Verizon DBIR 2025)', 'Total cybercrime losses reached $20.9B in 2025 — up 26% YoY'],
  },
  'Data Protection': {
    summary: 'Data breach and data-loss costs remain a top boardroom concern. Cloud-to-cloud backup is essential as Microsoft 365, Google Workspace, and Salesforce do not include comprehensive native backup by default.',
    stats: ['Global avg. breach cost: $4.44M (IBM 2025)', 'Customer PII was compromised in 53% of breaches', 'U.S. breach costs rose to $10.22M — highest globally', '76% of organisations took over 100 days to fully recover'],
  },
  'Network Protection': {
    summary: 'Gartner now classifies the firewall market as "Hybrid Mesh Firewall," reflecting convergence of on-prem, virtual, and cloud-delivered security. Vulnerability exploitation is now the leading initial access vector.',
    stats: ['Vulnerability exploitation grew 34% YoY (Verizon DBIR 2025)', 'Exploitation of edge devices/VPNs surged 8x to 22% of incidents', 'Only 54% of network vulnerabilities are fully remediated', 'Nation-state breaches used vuln exploitation 70% of the time'],
  },
  'Application Protection': {
    summary: 'Web applications and APIs remain a primary breach surface. OWASP\'s first major Top 10 refresh since 2021 shows access control and misconfiguration failures dominate real-world risk.',
    stats: ['Broken Access Control remains #1 risk for the 22nd year (OWASP Top 10:2025)', '100% of tested applications showed some form of misconfiguration', 'Supply Chain Failures debuted at #3 with 5.19% incidence rate', 'Gartner WAAP Market Guide reports renewed demand growth since late 2024'],
  },
  'MDR/SOC': {
    summary: 'Managed Detection and Response is now mainstream as organisations struggle to staff and run their own 24/7 SOC. Gartner forecasts continued double-digit MDR spend growth through 2028.',
    stats: ['MDR market projected at $2.15B by 2025 (20% CAGR)', 'By 2028, 50% of MDR findings will include exposure context (Gartner)', '600+ providers now offer MDR services globally', '88% of orgs experienced security consequences from skills shortage (ISC2 2025)'],
  },
  'Penetration Testing': {
    summary: 'Regular penetration testing delivers among the highest ROI in security spend. Gartner has formalised this space under "Adversarial Exposure Validation," reflecting the shift to continuous security validation.',
    stats: ['Avg. breach cost of $4.44M vs. pen test cost of $5K–$50K = 100:1 ROI potential', 'Organisations using security testing save avg. $2M+ per breach vs. those who don\'t', 'Only 48% of pen test vulnerabilities are ever remediated', 'Gartner AEV Market Guide (2025) formalises continuous pen testing as a category'],
  },
  'Security Awareness': {
    summary: 'The human element is involved in the majority of breaches. Sustained security awareness training and phishing simulation directly reduces the volume of successful social-engineering incidents.',
    stats: ['Sustained training reduces phishing click rates by up to 86% (KnowBe4)', 'Untrained employees are 8.8x more likely to click phishing emails (Boxphish)', 'Human element involved in ~60% of breaches (Verizon DBIR 2025)', '85% reduction in simulated-phishing click rates after sustained training'],
  },
  'GRC': {
    summary: 'GRC has moved from manual spreadsheet exercises to a strategic platform discipline. Regulatory pressure (GDPR, NIS2, DORA) combined with skills gaps means organisations need structured, auditable frameworks.',
    stats: ['Gartner published 2025 Magic Quadrant for GRC Tools (October 2025)', '88% of orgs experienced security consequences from skills shortage (ISC2 2025)', 'Share of orgs with "right level" of cybersecurity staffing rose to 34% — a record high', 'Overlapping frameworks (GDPR, NIS2, SOC 2, ISO 27001) driving GRC automation demand'],
  },
  'Ransomware Protection': {
    summary: 'Ransomware remains one of the most disruptive threats. Sophos research shows more attacks are stopped before encryption, but ransom payment behaviour and recovery costs remain high.',
    stats: ['Only 49% of ransomware attacks resulted in encryption in 2025 — lowest in 5 years (Sophos)', '48% of enterprises paid the ransom — median payment $1M', 'Use of backups for recovery fell to a 4-year low of 53%', 'Exploited vulnerabilities were the #1 ransomware entry point (29% of incidents)'],
  },
};

const ALL_CATEGORIES = [
  'Email Protection', 'Data Protection', 'Network Protection',
  'Application Protection', 'MDR/SOC', 'Penetration Testing',
  'Security Awareness', 'GRC', 'Ransomware Protection',
];

// -- VENDOR SUPPORT KB LINKS (for Technical Support page)
const VENDOR_KB: Record<string, { label: string; url: string | null; hasKB: boolean }> = {
  Barracuda: { label: 'Barracuda Campus', url: 'https://campus.barracuda.com/', hasKB: true },
  Keepit: { label: 'Keepit Help Centre', url: 'https://help.keepit.com/support/solutions', hasKB: true },
  Boxphish: { label: 'Boxphish HelpDocs', url: 'https://boxphishsupport.helpdocs.io/', hasKB: true },
  Druva: { label: 'Druva Help Centre', url: 'https://help.druva.com/en/', hasKB: true },
  WatchGuard: { label: 'WatchGuard Support', url: 'https://www.watchguard.com/wgrd-support/find-answers', hasKB: true },
  'Arctic Wolf': { label: 'In Development', url: null, hasKB: false },
  BullWall: { label: 'In Development', url: null, hasKB: false },
  CyberSmart: { label: 'In Development', url: null, hasKB: false },
};

const VENDOR_RESOURCE_LIBRARY: Record<string, string> = {
  Barracuda: 'https://www.barracuda.com/resources/resource-library',
  Keepit: 'https://www.keepit.com/resources/',
  'Arctic Wolf': 'https://arcticwolf.com/resources/',
  Boxphish: 'https://www.boxphish.com/resources/',
  BullWall: 'https://www.bullwall.com/resources',
  CyberSmart: 'https://cybersmart.co.uk/products/',
  Druva: 'https://www.druva.com/learning-center/resources',
  WatchGuard: 'https://www.watchguard.com/wgrd-resource-center/datasheets',
};

const CATEGORY_VENDORS: Record<string, string[]> = {
  'Email Protection': ['Barracuda', 'Boxphish'],
  'Data Protection': ['Barracuda', 'Keepit', 'Druva'],
  'Network Protection': ['Barracuda', 'WatchGuard'],
  'Application Protection': ['WatchGuard'],
  'MDR/SOC': ['Arctic Wolf', 'WatchGuard', 'Barracuda'],
  'Penetration Testing': ['CyberSmart'],
  'Security Awareness': ['Boxphish'],
  'GRC': ['CyberSmart', 'Arctic Wolf'],
  'Ransomware Protection': ['BullWall'],
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">● Active</span>;
  if (status === 'expired') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">⚠ Expired</span>;
  return null;
}

function CategoryCard({ entry, onClick }: { entry: CategoryEntry; onClick: () => void }) {
  const Icon = CATEGORY_ICONS[entry.category] || Shield;
  const isOwned = entry.status === 'active' || entry.status === 'expired';
  return (
    <button
      data-testid={`category-card-${entry.category.replace(/\s+/g, '-').toLowerCase()}`}
      onClick={onClick}
      className={`relative flex flex-col gap-3 p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] hover:shadow-xl group ${
        isOwned
          ? 'bg-white/10 border-white/20 hover:border-white/40 cursor-pointer'
          : 'bg-white/5 border-white/10 hover:border-white/20 opacity-60 cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${isOwned ? 'bg-gradient-to-br from-pink-500/30 to-blue-500/30' : 'bg-white/10'}`}>
          <Icon className={`w-5 h-5 ${isOwned ? 'text-white' : 'text-white/40'}`} />
        </div>
        <StatusBadge status={entry.status} />
      </div>
      <div>
        <h3 className="font-semibold text-white text-sm leading-tight">{entry.category}</h3>
        <p className="text-white/50 text-xs mt-1 leading-snug">{CATEGORY_DESCRIPTIONS[entry.category]}</p>
      </div>
      {isOwned && entry.products.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {entry.products.slice(0, 2).map(p => (
            <span key={p.name} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{p.vendor}</span>
          ))}
          {entry.products.length > 2 && <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">+{entry.products.length - 2}</span>}
        </div>
      )}
      {!isOwned && (
        <p className="text-xs text-white/30 mt-auto">Not currently subscribed</p>
      )}
    </button>
  );
}

function CategoryDetailModal({ entry, onClose }: { entry: CategoryEntry; onClose: () => void }) {
  const research = CATEGORY_RESEARCH[entry.category];
  const [docs, setDocs] = useState<ResearchDoc[]>([]);
  const vendors = CATEGORY_VENDORS[entry.category] || [];

  useEffect(() => {
    apiFetch(`/api/research-docs/${encodeURIComponent(entry.category)}`).then(r => r.json()).then(setDocs).catch(() => {});
  }, [entry.category]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900/95 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{entry.category}</h2>
            <StatusBadge status={entry.status} />
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Your products */}
          {entry.products.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">Your Products</h3>
              <div className="space-y-2">
                {entry.products.map(p => (
                  <div key={p.name} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">{p.name}</div>
                      <div className="text-xs text-white/50">{p.vendor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Further Research */}
          {research && (
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-purple-300" />
                <h3 className="text-sm font-semibold text-purple-200">Further Research & Business Case</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-4">{research.summary}</p>
              <div className="space-y-2">
                {research.stats.map((stat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/70">
                    <span className="text-purple-400 mt-0.5 flex-shrink-0">▸</span>
                    <span>{stat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin-uploaded research docs */}
          {docs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">Supporting Documents</h3>
              <div className="space-y-2">
                {docs.map(d => (
                  <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                    <FileText className="w-4 h-4 text-blue-300 flex-shrink-0" />
                    <span className="text-sm text-white">{d.title}</span>
                    <ExternalLink className="w-3 h-3 text-white/40 ml-auto flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Vendors in this category */}
          <div>
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">Vendor Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {vendors.map(v => (
                <a key={v} href={VENDOR_RESOURCE_LIBRARY[v]} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-full text-sm text-white/80 transition-colors">
                  {v} <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountManagerCard({ owner }: { owner: AccountOwner }) {
  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Your Account Manager</h3>
      <div className="flex items-center gap-4">
        {owner.photo ? (
          <img src={owner.photo} alt={owner.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/20" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500/40 to-blue-500/40 flex items-center justify-center text-xl font-bold text-white border-2 border-white/20">
            {owner.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
        <div>
          <div className="text-lg font-bold text-white">{owner.name}</div>
          <div className="text-sm text-white/60">Broad Peak Cyber</div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <a href={`mailto:${owner.email}`} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <Mail className="w-4 h-4 text-pink-400" /> {owner.email}
        </a>
        {owner.phone && (
          <a href={`tel:${owner.phone}`} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <Phone className="w-4 h-4 text-blue-400" /> {owner.phone}
          </a>
        )}
        {owner.calendly && (
          <a href={owner.calendly} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <Calendar className="w-4 h-4 text-purple-400" /> Book a meeting
          </a>
        )}
      </div>
    </div>
  );
}

function ChatBot({ domain, accountName }: { domain: string; accountName: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your Broad Peak AI assistant. I can answer questions about cybersecurity, your products, and our vendor portfolio. What would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [vendorPrompt, setVendorPrompt] = useState<{ needed: boolean; originalQ: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ALL_VENDORS = ['Barracuda', 'Keepit', 'Arctic Wolf', 'Boxphish', 'BullWall', 'CyberSmart', 'Druva', 'WatchGuard'];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (q: string, vendor?: string) => {
    const effectiveVendor = vendor || selectedVendor;
    const userMsg = q.trim();
    if (!userMsg) return;
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    setVendorPrompt(null);
    try {
      const resp = await apiFetch('/api/chat', { method: 'POST', body: JSON.stringify({ question: userMsg, domain, vendor: effectiveVendor }) });
      const data = await resp.json();
      if (data.needsVendor) {
        setVendorPrompt({ needed: true, originalQ: userMsg });
        setMessages(m => [...m, { role: 'assistant', content: data.reply || 'Which vendor product are you asking about? Please select or type below.' }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full" data-testid="chatbot-container">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-br-sm' : 'bg-white/10 text-white/90 rounded-bl-sm'
            }`} style={{ whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center mr-2">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/10 px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
            </div>
          </div>
        )}
        {vendorPrompt?.needed && (
          <div className="flex flex-wrap gap-2 mt-2">
            {ALL_VENDORS.map(v => (
              <button key={v} onClick={() => { setSelectedVendor(v); sendMessage(vendorPrompt.originalQ, v); }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white transition-colors">
                {v}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-white/10">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            data-testid="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your security products..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40"
          />
          <button type="submit" disabled={loading || !input.trim()} data-testid="chat-send"
            className="bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-xl px-4 py-2.5 disabled:opacity-40 hover:opacity-90 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── NEWS TAB ───────────────────────────────────────────────────────────────
const VENDOR_NEWS = [
  { vendor: 'Barracuda Networks', url: 'https://www.barracuda.com/resources/resource-library' },
  { vendor: 'Keepit', url: 'https://www.keepit.com/resources/' },
  { vendor: 'Arctic Wolf', url: 'https://arcticwolf.com/resources/' },
  { vendor: 'Boxphish', url: 'https://www.boxphish.com/resources/' },
  { vendor: 'BullWall', url: 'https://www.bullwall.com/resources' },
  { vendor: 'CyberSmart', url: 'https://cybersmart.co.uk/products/' },
  { vendor: 'Druva', url: 'https://www.druva.com/learning-center/resources' },
  { vendor: 'WatchGuard', url: 'https://www.watchguard.com/wgrd-resource-center/datasheets' },
];

function NewsTab({ domain }: { domain: string }) {
  const { data: newsletters } = useQuery({ queryKey: ['/api/newsletters', domain], queryFn: () => apiFetch(`/api/newsletters?domain=${domain}`).then(r => r.json()) });
  return (
    <div className="space-y-8">
      {/* Vendor Resource Libraries */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Vendor Resource Libraries</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {VENDOR_NEWS.map(v => (
            <a key={v.vendor} href={v.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group">
              <span className="text-sm text-white/80 font-medium leading-tight">{v.vendor} — Resource Library</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 flex-shrink-0 transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Broad Peak Newsletters */}
      {newsletters?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Broad Peak Newsletters</h2>
          <div className="space-y-3">
            {newsletters.map((n: any) => (
              <div key={n.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <FileText className="w-5 h-5 text-pink-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{n.title}</div>
                  <div className="text-xs text-white/40">{new Date(n.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <a href={`/uploads/${n.filename}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1">
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!newsletters || newsletters.length === 0) && (
        <div className="text-center py-12 text-white/30">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No newsletters uploaded yet</p>
        </div>
      )}
    </div>
  );
}

// ─── RESOURCES TAB ───────────────────────────────────────────────────────────
const DATASHEETS = [
  { vendor: 'Barracuda', product: 'Email Gateway Defense', url: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/DS-Email-Gateway-Defense.pdf' },
  { vendor: 'Barracuda', product: 'Cloud-to-Cloud Backup', url: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/DS-Cloud-to-Cloud-Backup.pdf' },
  { vendor: 'Barracuda', product: 'CloudGen Firewall', url: 'https://assets.barracuda.com/assets/docs/dms/DS_CloudGen-Firewall_AWS_US.pdf' },
  { vendor: 'Barracuda', product: 'Managed XDR', url: 'https://assets.barracuda.com/assets/docs/dms/DS_Managed-XDR_US.pdf' },
  { vendor: 'Keepit', product: 'Microsoft 365 Backup', url: 'https://www.keepit.com/resources/keepit-for-microsoft-365-product-sheet/' },
  { vendor: 'Keepit', product: 'Service Guide', url: 'https://lp.keepit.com/hubfs/content-assets/EN/Keepit-Service-Guide.pdf' },
  { vendor: 'Arctic Wolf', product: 'MDR Datasheet', url: 'https://arcticwolf.com/resource/aw/arctic-wolf-managed-detection-and-response' },
  { vendor: 'Boxphish', product: 'Service Overview 2025', url: 'https://www.boxphish.com/wp-content/uploads/2025/05/Complete-Service-Overview-Boxphish-2025.pdf' },
  { vendor: 'BullWall', product: 'Ransomware Containment', url: 'https://bullwall.com/wp-content/uploads/2023/04/BullWall-Product-Brief_Ransomware-Containment.pdf' },
  { vendor: 'CyberSmart', product: 'Cyber Essentials', url: 'https://cybersmart.co.uk/products/cyber-essentials/' },
  { vendor: 'CyberSmart', product: 'Cyber Essentials Plus', url: 'https://cybersmart.co.uk/products/cyber-essentials-plus/' },
  { vendor: 'Druva', product: 'inSync Datasheet', url: 'https://www.druva.com/documents/pf/datasheets/datasheet-druva-insync.pdf' },
  { vendor: 'Druva', product: 'Phoenix Datasheet', url: 'https://www.druva.com/learning-center/resources/datasheets/datasheet-druva-phoenix' },
  { vendor: 'WatchGuard', product: 'Firebox M290/M390', url: 'https://www.watchguard.com/wgrd-resource-center/docs/firebox-m290-and-m390' },
  { vendor: 'WatchGuard', product: 'AuthPoint MFA', url: 'https://www.watchguardonline.co.uk/productattachments/index/download?id=338' },
  { vendor: 'WatchGuard', product: 'WatchGuard MDR', url: 'https://www.watchguard.com/wgrd-resource-center/docs/watchguard-mdr-msps' },
];

const VENDOR_COLORS: Record<string, string> = {
  Barracuda: 'text-red-300', Keepit: 'text-sky-300', 'Arctic Wolf': 'text-blue-300',
  Boxphish: 'text-purple-300', BullWall: 'text-orange-300', CyberSmart: 'text-emerald-300',
  Druva: 'text-teal-300', WatchGuard: 'text-amber-300',
};

function ResourcesTab({ domain }: { domain: string }) {
  const { data: adminSheets } = useQuery({ queryKey: ['/api/datasheets'], queryFn: () => apiFetch(`/api/datasheets?domain=${domain}`).then(r => r.json()) });
  const grouped = DATASHEETS.reduce((acc, ds) => { (acc[ds.vendor] = acc[ds.vendor] || []).push(ds); return acc; }, {} as Record<string, typeof DATASHEETS>);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Vendor Datasheets & Product Guides</h2>
        <div className="space-y-6">
          {Object.entries(grouped).map(([vendor, sheets]) => (
            <div key={vendor}>
              <h3 className={`text-sm font-semibold uppercase tracking-wide mb-2 ${VENDOR_COLORS[vendor] || 'text-white/60'}`}>{vendor}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sheets.map(s => (
                  <a key={s.product} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group">
                    <FileText className="w-4 h-4 text-white/40 group-hover:text-white/60 flex-shrink-0" />
                    <span className="text-sm text-white/80">{s.product}</span>
                    <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-white/60 ml-auto flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {adminSheets?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Uploaded Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adminSheets.map((s: any) => (
              <a key={s.id} href={`/uploads/${s.filename}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
                <FileText className="w-4 h-4 text-pink-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{s.product}</div>
                  <div className="text-xs text-white/40">{s.vendor}</div>
                </div>
                <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-white/60 ml-auto flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TECHNICAL SUPPORT TAB ──────────────────────────────────────────────────
const SUPPORT_CATEGORIES = ALL_CATEGORIES.map(cat => ({
  cat,
  vendors: CATEGORY_VENDORS[cat] || [],
}));

function TechnicalSupportTab({ domain, accountName }: { domain: string; accountName: string }) {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const startSupport = (cat: string, vendor: string) => {
    const kb = VENDOR_KB[vendor];
    setSelectedCat(cat);
    setSelectedVendor(vendor);
    setMessages([{ role: 'assistant', content: kb.hasKB
      ? `Hi! I'm ready to help with ${vendor} questions. I'll search the ${kb.label} knowledge base for accurate answers. What issue are you experiencing?`
      : `Hi! Support for ${vendor} is coming soon. For now, please contact Broad Peak directly and we'll assist you with ${cat} queries.`
    }]);
    setInitDone(true);
  };

  const sendSupportMsg = async () => {
    const q = input.trim();
    if (!q || !selectedVendor) return;
    const kb = VENDOR_KB[selectedVendor];
    setMessages(m => [...m, { role: 'user', content: q }]);
    setInput('');
    if (!kb.hasKB) {
      setMessages(m => [...m, { role: 'assistant', content: `Support for ${selectedVendor} is coming soon. Please contact your account manager for assistance.` }]);
      return;
    }
    setLoading(true);
    try {
      const resp = await apiFetch('/api/chat', { method: 'POST', body: JSON.stringify({ question: q, domain, vendor: selectedVendor }) });
      const data = await resp.json();
      setMessages(m => [...m, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally { setLoading(false); }
  };

  if (!selectedCat) {
    return (
      <div className="space-y-6">
        <p className="text-white/60 text-sm">Select a security category to get technical support</p>
        <div className="grid grid-cols-3 gap-3">
          {SUPPORT_CATEGORIES.map(({ cat, vendors }) => {
            const Icon = CATEGORY_ICONS[cat] || Shield;
            const hasLiveKB = vendors.some(v => VENDOR_KB[v]?.hasKB);
            return (
              <button key={cat} data-testid={`support-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => { if (vendors.length === 1) startSupport(cat, vendors[0]); else setSelectedCat(cat); }}
                className="flex flex-col gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all">
                <Icon className="w-5 h-5 text-white/60" />
                <div className="text-sm font-medium text-white leading-tight">{cat}</div>
                <div className="flex flex-wrap gap-1">
                  {vendors.map(v => (
                    <span key={v} className={`text-xs px-2 py-0.5 rounded-full ${VENDOR_KB[v]?.hasKB ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'}`}>
                      {VENDOR_KB[v]?.hasKB ? v : `${v} (soon)`}
                    </span>
                  ))}
                  {vendors.length === 0 && <span className="text-xs text-white/30">Coming soon</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (selectedCat && !selectedVendor) {
    const vendors = CATEGORY_VENDORS[selectedCat] || [];
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedCat(null)} className="text-sm text-white/50 hover:text-white flex items-center gap-1">← Back</button>
        <h3 className="text-lg font-bold text-white">{selectedCat} — Select Vendor</h3>
        <div className="grid grid-cols-2 gap-3">
          {vendors.map(v => {
            const kb = VENDOR_KB[v];
            return (
              <button key={v} onClick={() => startSupport(selectedCat, v)}
                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all text-left">
                <div>
                  <div className="text-sm font-medium text-white">{v}</div>
                  <div className={`text-xs mt-1 ${kb?.hasKB ? 'text-emerald-400' : 'text-white/30'}`}>
                    {kb?.hasKB ? `KB: ${kb.label}` : 'In Development'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const kb = VENDOR_KB[selectedVendor!];
  return (
    <div className="flex flex-col h-[420px]">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => { setSelectedCat(null); setSelectedVendor(null); setMessages([]); setInitDone(false); }}
          className="text-sm text-white/50 hover:text-white">← Back</button>
        <span className="text-sm font-medium text-white">{selectedCat} — {selectedVendor}</span>
        {kb?.url && (
          <a href={kb.url} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1">
            {kb.label} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-white/5 rounded-xl p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-br-sm' : 'bg-white/10 text-white/90 rounded-bl-sm'
            }`} style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 text-white/50 animate-spin" /><span className="text-xs text-white/40">Searching {kb?.label}...</span></div>
        )}
        <div ref={bottomRef} />
      </div>
      {kb?.hasKB && (
        <div className="mt-3">
          <form onSubmit={e => { e.preventDefault(); sendSupportMsg(); }} className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Ask a ${selectedVendor} question...`}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40" />
            <button type="submit" disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-xl px-4 py-2.5 disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────────────
export default function Dashboard({ domain, onLogout }: { domain: string; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'products' | 'support' | 'news' | 'resources' | 'ce-readiness' | 'risk-score'>('products');
  const [selectedCategory, setSelectedCategory] = useState<CategoryEntry | null>(null);

  const { data: customer, isLoading } = useQuery<CustomerData>({
    queryKey: ['/api/customer', domain],
    queryFn: () => apiFetch(`/api/customer/${domain}`).then(r => r.json()),
  });

  const tabs = [
    { id: 'products' as const, label: 'My Products' },
    { id: 'support' as const, label: 'Technical Support' },
    { id: 'news' as const, label: 'News & Updates' },
    { id: 'resources' as const, label: 'Resources' },
    { id: 'ce-readiness' as const, label: 'CE Readiness' },
    { id: 'risk-score' as const, label: 'Risk Score' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 40%, #0a1628 100%)' }}>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-white-text.jpg" alt="Broad Peak Cyber" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-3">
            {customer && <span className="text-sm text-white/60 hidden md:block">{customer.accountName}</span>}
            <button onClick={onLogout} data-testid="logout-button"
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Welcome */}
        {customer && (
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-white/50 text-sm mt-1">{customer.accountName} · {customer.grid.filter(g => g.status === 'active').length} active security services</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} data-testid={`tab-${t.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-white/40 animate-spin" /></div>
        ) : !customer ? (
          <div className="flex-1 flex items-center justify-center text-white/40 text-sm">No data found for this account</div>
        ) : (
          <>
            {/* MY PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: 3x3 grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {ALL_CATEGORIES.map(cat => {
                      const entry = customer.grid.find(g => g.category === cat) || { category: cat, status: 'not_owned' as const, products: [], expiresAt: null };
                      return <CategoryCard key={cat} entry={entry} onClick={() => setSelectedCategory(entry)} />;
                    })}
                  </div>
                </div>

                {/* Right: chatbot + account manager */}
                <div className="space-y-4">
                  {/* Account Manager */}
                  {customer.accountOwner && (
                    <AccountManagerCard owner={customer.accountOwner} />
                  )}

                  {/* Ask Broad Peak AI */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col" style={{ height: '420px' }}>
                    <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-white">Ask Broad Peak AI</span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <ChatBot domain={domain} accountName={customer.accountName} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && <TechnicalSupportTab domain={domain} accountName={customer.accountName} />}
            {activeTab === 'news' && <NewsTab domain={domain} />}
            {activeTab === 'resources' && <ResourcesTab domain={domain} />}
            {activeTab === 'ce-readiness' && (
              <div className="max-w-3xl">
                <CEReadiness accountName={customer.accountName} />
              </div>
            )}
            {activeTab === 'risk-score' && (
              <div className="max-w-3xl">
                <CyberRiskScore accountName={customer.accountName} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Category Detail Modal */}
      {selectedCategory && <CategoryDetailModal entry={selectedCategory} onClose={() => setSelectedCategory(null)} />}
    </div>
  );
}
