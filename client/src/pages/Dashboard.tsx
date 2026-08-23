import { useState, useRef, useEffect } from 'react';
import { apiFetch, getToken } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Shield, Database, Network, Globe, Eye, Search, BookOpen, Clipboard, Star, AlertTriangle, ChevronRight, X, Send, Loader2, ExternalLink, Phone, Mail, Calendar, FileText, Lock, Wifi, Cpu, GraduationCap, ShieldAlert, TrendingUp, ThumbsUp, ThumbsDown, CheckCircle2, CheckCircle, UserRound, Ticket, Plus, Video } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CEReadiness from './CEReadiness';
import CyberRiskScore from './CyberRiskScore';
import { useLang, LangToggleDark } from '../lib/LanguageContext';

interface ProductEntry { name: string; vendor: string; startedAt?: string | null; expiresAt?: string | null; }
interface RelevantProduct { id: string; name: string; vendor: string; categories: string[]; }
interface CategoryEntry { category: string; status: 'active' | 'expired' | 'not_owned'; products: ProductEntry[]; expiresAt: string | null; startedAt?: string | null; }
interface AccountOwner { name: string; email: string; phone?: string; photo?: string; calendly?: string; welcome_video?: string; }
interface CustomerData { accountName: string; domain: string; grid: CategoryEntry[]; accountOwner?: AccountOwner; }
interface Message { role: 'user' | 'assistant'; content: string; relevantCategories?: string[]; relevantProducts?: RelevantProduct[]; }
interface ResearchDoc { id: string; title: string; filename: string; url: string; uploadedAt: string; }

function fmtDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

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

const CATEGORY_NAMES_AR: Record<string, string> = {
  'Email Protection': 'حماية البريد الإلكتروني',
  'Data Protection': 'حماية البيانات',
  'Network Protection': 'حماية الشبكة',
  'Application Protection': 'حماية التطبيقات',
  'MDR/SOC': 'MDR/SOC',
  'Penetration Testing': 'اختبار الاختراق',
  'Security Awareness': 'التوعية الأمنية',
  'GRC': 'GRC',
  'Ransomware Protection': 'الحماية من الفدية',
};

const CATEGORY_DESC_KEYS: Record<string, string> = {
  'Email Protection': 'desc_emailProtection',
  'Data Protection': 'desc_dataProtection',
  'Network Protection': 'desc_networkProtection',
  'Application Protection': 'desc_applicationProtection',
  'MDR/SOC': 'desc_mdrSoc',
  'Penetration Testing': 'desc_penetrationTesting',
  'Security Awareness': 'desc_securityAwareness',
  'GRC': 'desc_grc',
  'Ransomware Protection': 'desc_ransomwareProtection',
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
  'Arctic Wolf': { label: 'Arctic Wolf Docs', url: 'https://docs.arcticwolf.com', hasKB: true },
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
  'Email Protection': ['Barracuda'],
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
  const { t } = useLang();
  if (status === 'active') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#10b98112] text-[#059669] border border-[#10b98130]">● {t('active')}</span>;
  if (status === 'expired') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ef444412] text-[#dc2626] border border-[#ef444430]">⚠ {t('expired')}</span>;
  return null;
}

function CategoryCard({ entry, onClick, highlighted }: { entry: CategoryEntry; onClick: () => void; highlighted?: boolean }) {
  const { t, isAr } = useLang();
  const Icon = CATEGORY_ICONS[entry.category] || Shield;
  const isOwned = entry.status === 'active' || entry.status === 'expired';
  return (
    <button
      data-testid={`category-card-${entry.category.replace(/\s+/g, '-').toLowerCase()}`}
      onClick={onClick}
      className={`relative flex flex-col gap-2 sm:gap-3 p-3 sm:p-5 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] group ${
        highlighted
          ? 'bg-[#fefce8] border-[#fbbf24] shadow-[0_0_0_2px_#fbbf2440] cursor-pointer'
          : isOwned
            ? 'bg-white border-[#e5e7eb] hover:border-[#4494D1] cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
            : 'bg-white border-[#e5e7eb] hover:border-[#4494D1] opacity-70 cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${isOwned ? 'bg-[#4494D112]' : 'bg-[#f3f4f6]'}`}>
          <Icon className={`w-5 h-5 ${isOwned ? 'text-[#4494D1]' : 'text-[#9ca3af]'}`} />
        </div>
        <StatusBadge status={entry.status} />
      </div>
      <div>
        <h3 className="font-semibold text-[#1f2937] text-xs sm:text-sm leading-tight">{isAr ? (CATEGORY_NAMES_AR[entry.category] || entry.category) : entry.category}</h3>
        <p className="text-[#6b7280] text-[10px] sm:text-xs mt-0.5 sm:mt-1 leading-snug hidden sm:block">{t((CATEGORY_DESC_KEYS[entry.category] || 'desc_emailProtection') as any)}</p>
      </div>
      {isOwned && entry.products.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.products.slice(0, 2).map(p => (
            <span key={p.name} className="text-xs bg-[#4494D112] text-[#4494D1] border border-[#4494D130] px-2 py-0.5 rounded-lg">{p.vendor}</span>
          ))}
          {entry.products.length > 2 && <span className="text-xs bg-[#4494D112] text-[#4494D1] border border-[#4494D130] px-2 py-0.5 rounded-lg">+{entry.products.length - 2}</span>}
        </div>
      )}
      {isOwned && (entry.startedAt || entry.expiresAt) && (
        <div className="mt-auto pt-1 border-t border-[#f3f4f6]">
          <div className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>
              {entry.startedAt ? fmtDateShort(entry.startedAt) : '—'}
              {' → '}
              {entry.expiresAt
                ? <span className={new Date(entry.expiresAt) < new Date() ? 'text-[#ef4444] font-medium' : 'text-[#059669] font-medium'}>{fmtDateShort(entry.expiresAt)}</span>
                : '—'
              }
            </span>
          </div>
        </div>
      )}
      {!isOwned && (
        <p className="text-xs text-[#9ca3af] mt-auto">{t('notCurrentlySubscribed')}</p>
      )}
    </button>
  );
}

function CategoryDetailModal({ entry, onClose }: { entry: CategoryEntry; onClose: () => void }) {
  const research = CATEGORY_RESEARCH[entry.category];
  const [docs, setDocs] = useState<ResearchDoc[]>([]);
  const vendors = CATEGORY_VENDORS[entry.category] || [];
  const { t, isAr } = useLang();

  useEffect(() => {
    apiFetch(`/api/research-docs/${encodeURIComponent(entry.category)}`).then(r => r.json()).then(setDocs).catch(() => {});
  }, [entry.category]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-[#e5e7eb] shadow-xl rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[#1f2937]">{isAr ? (CATEGORY_NAMES_AR[entry.category] || entry.category) : entry.category}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <StatusBadge status={entry.status} />
              {(entry.startedAt || entry.expiresAt) && (
                <span className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                  <Calendar className="w-3.5 h-3.5 text-[#9ca3af]" />
                  <span>{t('contract')}:</span>
                  <span className="font-medium text-[#1f2937]">{entry.startedAt ? fmtDate(entry.startedAt) : '—'}</span>
                  <span>→</span>
                  {entry.expiresAt ? (
                    <span className={`font-medium ${new Date(entry.expiresAt) < new Date() ? 'text-[#ef4444]' : 'text-[#059669]'}`}>
                      {fmtDate(entry.expiresAt)}
                    </span>
                  ) : <span className="font-medium">—</span>}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#1f2937] ml-4 flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Your products */}
          {entry.products.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-3">{t('yourProducts')}</h3>
              <div className="space-y-2">
                {entry.products.map(p => {
                  const expired = p.expiresAt && new Date(p.expiresAt) < new Date();
                  return (
                    <div key={p.name} className="p-3 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${expired ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#1f2937]">{p.name}</div>
                          <div className="text-xs text-[#6b7280]">{p.vendor}</div>
                          {(p.startedAt || p.expiresAt) && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                              <Calendar className="w-3 h-3 text-[#9ca3af] flex-shrink-0" />
                              <span className="text-[#6b7280]">{t('start')}:</span>
                              <span className="font-medium text-[#1f2937]">{p.startedAt ? fmtDate(p.startedAt) : '—'}</span>
                              <span className="text-[#9ca3af] mx-0.5">•</span>
                              <span className="text-[#6b7280]">{t('end')}:</span>
                              <span className={`font-medium ${expired ? 'text-[#ef4444]' : 'text-[#059669]'}`}>
                                {p.expiresAt ? fmtDate(p.expiresAt) : '—'}
                              </span>
                              {expired && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Expired</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Further Research */}
          {research && (
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-[#4494D1]" />
                <h3 className="text-sm font-semibold text-[#1f2937]">{t('furtherResearch')}</h3>
              </div>
              <p className="text-[#6b7280] text-sm leading-relaxed mb-4">{research.summary}</p>
              <div className="space-y-2">
                {research.stats.map((stat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#6b7280]">
                    <span className="text-[#7b5ea7] mt-0.5 flex-shrink-0">▸</span>
                    <span>{stat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin-uploaded research docs */}
          {docs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-3">{t('supportingDocuments')}</h3>
              <div className="space-y-2">
                {docs.map(d => (
                  <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-[#f9fafb] hover:bg-[#f3f4f6] rounded-xl transition-colors border border-[#e5e7eb]">
                    <FileText className="w-4 h-4 text-[#4494D1] flex-shrink-0" />
                    <span className="text-sm text-[#1f2937]">{d.title}</span>
                    <ExternalLink className="w-3 h-3 text-[#9ca3af] ml-auto flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Vendors in this category */}
          <div>
            <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-3">{t('vendorExpertise')}</h3>
            <div className="flex flex-wrap gap-2">
              {vendors.map(v => (
                <a key={v} href={VENDOR_RESOURCE_LIBRARY[v]} target="_blank" rel="noopener noreferrer"
                  className="vendor-badge flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors">
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
  const { t } = useLang();
  return (
    <div className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-2xl p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide">{t('yourAccountManager')}</h3>
      <div className="flex items-center gap-4">
        {owner.photo ? (
          <img src={owner.photo} alt={owner.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#e5e7eb]" />
        ) : (
          <div className="w-14 h-14 rounded-full gradient-cta flex items-center justify-center text-xl font-bold text-white border-2 border-white">
            {owner.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
        <div>
          <div className="text-lg font-bold text-[#1f2937]">{owner.name}</div>
          <div className="text-sm text-[#6b7280]">{t('accountManagerRole')}</div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <a href={`mailto:${owner.email}`} className="flex items-center gap-2 text-[#6b7280] hover:text-[#4494D1] transition-colors">
          <Mail className="w-4 h-4 text-[#C65793]" /> {owner.email}
        </a>
        {owner.phone && (
          <a href={`tel:${owner.phone}`} className="flex items-center gap-2 text-[#6b7280] hover:text-[#4494D1] transition-colors">
            <Phone className="w-4 h-4 text-[#4494D1]" /> {owner.phone}
          </a>
        )}
        {owner.calendly && (
          <a href={owner.calendly} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#6b7280] hover:text-[#4494D1] transition-colors">
            <Calendar className="w-4 h-4 text-[#7b5ea7]" /> {t('bookMeeting')}
          </a>
        )}
      </div>
    </div>
  );
}

const CONTACT_ACTIONS = [
  { labelKey: 'requestDemo', subject: 'Demo / Proof of Concept Request', icon: '🎯' },
  { labelKey: 'getQuote', subject: 'Quote Request', icon: '💼' },
  { labelKey: 'moreInformation', subject: 'Request for More Information', icon: '📋' },
  { labelKey: 'bookMeeting', subject: 'Meeting Request', icon: '📅' },
];

function ContactActionButtons({ accountOwner, accountName, relevantCategories }: {
  accountOwner?: AccountOwner;
  accountName: string;
  relevantCategories?: string[];
}) {
  const { t } = useLang();
  const catContext = relevantCategories && relevantCategories.length > 0
    ? `\n\nSecurity categories of interest: ${relevantCategories.join(', ')}` : '';

  const email = accountOwner?.email || 'info@broadpeakcyber.com';
  const recipientName = accountOwner?.name || 'the Broad Peak Cyber team';

  return (
    <div className="ml-9 mt-2 flex flex-wrap gap-1.5">
      {CONTACT_ACTIONS.map(({ labelKey, subject, icon }) => {
        const label = t(labelKey as any);
        const body = encodeURIComponent(
          `Hi ${recipientName},\n\nI'm reaching out from ${accountName} via the Broad Peak customer portal.${catContext}\n\nI'd like to ${label.toLowerCase()}.\n\nPlease get in touch at your earliest convenience.\n\nKind regards`
        );
        return (
          <a
            key={labelKey}
            href={`mailto:${email}?subject=${encodeURIComponent(subject + ' — ' + accountName)}&body=${body}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#e5e7eb] text-[#1f2937] hover:border-[#C65793] hover:text-[#C65793] hover:bg-[#fdf4f9] transition-all shadow-sm"
          >
            <span>{icon}</span> {label}
          </a>
        );
      })}
    </div>
  );
}


interface ChatActionButtonsProps {
  isAr: boolean;
  domain: string;
  accountName: string;
  accountOwner?: AccountOwner;
  messageContent: string;
  messageIndex: number;
}

function ChatActionButtons({ isAr, domain, accountName, accountOwner, messageContent, messageIndex }: ChatActionButtonsProps) {
  const [ticketState, setTicketState] = useState<Record<string, 'idle' | 'loading' | 'done' | 'error'>>({});

  const submitTicket = async (type: 'support' | 'info') => {
    const key = `${messageIndex}-${type}`;
    setTicketState(s => ({ ...s, [key]: 'loading' }));
    const subject = type === 'support'
      ? (isAr ? `طلب دعم فني — ${accountName}` : `Technical Support Request — ${accountName}`)
      : (isAr ? `طلب معلومات / أسعار — ${accountName}` : `Information / Pricing Request — ${accountName}`);
    const description = type === 'support'
      ? (isAr
          ? `سؤال مُرسَل من خلال Broad Peak AI:\n\n${messageContent}`
          : `Query raised via Broad Peak AI:\n\n${messageContent}`)
      : (isAr
          ? `طلب معلومات / أسعار مُرسَل من خلال Broad Peak AI:\n\n${messageContent}`
          : `Information / pricing request raised via Broad Peak AI:\n\n${messageContent}`);
    try {
      const token = getToken();
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject,
          description,
          domain,
          customerName: accountName,
          priority: type === 'support' ? 2 : 1,
          type: type === 'support' ? 'Technical Issue' : 'Sales',
          lang: isAr ? 'ar' : 'en',
        }),
      });
      const data = await res.json();
      setTicketState(s => ({ ...s, [key]: data.ok ? 'done' : 'error' }));
    } catch {
      setTicketState(s => ({ ...s, [key]: 'error' }));
    }
  };

  const supportKey = `${messageIndex}-support`;
  const infoKey = `${messageIndex}-info`;
  const managerEmail = accountOwner?.email || 'support@broadpeakcyber.com';
  const emailSubject = isAr ? `استفسار — ${accountName}` : `Enquiry — ${accountName}`;
  const emailBody = isAr
    ? `مرحباً،\n\nأودّ الاستفسار عن المعلومات التالية:\n\n${messageContent}`
    : `Hi,\n\nI would like to follow up on the following information:\n\n${messageContent}`;

  return (
    <div className="ml-9 mt-2 flex flex-wrap gap-1.5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Log a support ticket */}
      <button
        onClick={() => submitTicket('support')}
        disabled={ticketState[supportKey] === 'loading' || ticketState[supportKey] === 'done'}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#e5e7eb] text-[#1f2937] hover:border-[#C65793] hover:text-[#C65793] hover:bg-[#fdf4f9] transition-all shadow-sm disabled:opacity-60"
        data-testid={`chat-log-ticket-${messageIndex}`}
      >
        <Clipboard className="w-3 h-3" />
        {ticketState[supportKey] === 'loading' ? (isAr ? 'جارٍ الإرسال...' : 'Logging...') :
         ticketState[supportKey] === 'done'    ? (isAr ? '✓ تم تسجيل التذكرة' : '✓ Ticket Logged') :
         ticketState[supportKey] === 'error'   ? (isAr ? '✗ خطأ' : '✗ Error') :
         (isAr ? 'تسجيل تذكرة دعم' : 'Log a Support Ticket')}
      </button>

      {/* Get more information / pricing */}
      <button
        onClick={() => submitTicket('info')}
        disabled={ticketState[infoKey] === 'loading' || ticketState[infoKey] === 'done'}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#e5e7eb] text-[#1f2937] hover:border-[#4494D1] hover:text-[#4494D1] hover:bg-[#f0f7ff] transition-all shadow-sm disabled:opacity-60"
        data-testid={`chat-info-pricing-${messageIndex}`}
      >
        <Search className="w-3 h-3" />
        {ticketState[infoKey] === 'loading' ? (isAr ? 'جارٍ الإرسال...' : 'Sending...') :
         ticketState[infoKey] === 'done'    ? (isAr ? '✓ تم الإرسال' : '✓ Request Sent') :
         ticketState[infoKey] === 'error'   ? (isAr ? '✗ خطأ' : '✗ Error') :
         (isAr ? 'معلومات / أسعار' : 'Get More Info / Pricing')}
      </button>

      {/* Email account manager */}
      <a
        href={`mailto:${managerEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#e5e7eb] text-[#1f2937] hover:border-[#9b4da8] hover:text-[#9b4da8] hover:bg-[#fdf4ff] transition-all shadow-sm"
        data-testid={`chat-email-manager-${messageIndex}`}
      >
        <Mail className="w-3 h-3" />
        {isAr ? 'مراسلة مدير الحساب' : 'Email Account Manager'}
      </a>
    </div>
  );
}

function ChatBot({ domain, accountName, accountOwner, onHighlight, onOpenCategory }: { domain: string; accountName: string; accountOwner?: AccountOwner; onHighlight?: (cats: string[]) => void; onOpenCategory?: (cat: string) => void }) {
  const { t, lang, isAr } = useLang();
  const INTRO_EN = `Hi! I'm your Broad Peak AI assistant. I can answer questions about cybersecurity, your products, and our vendor portfolio. What would you like to know?`;
  const INTRO_AR = 'مرحباً! أنا مساعد Broad Peak الذكي. يمكنني الإجابة على أسئلتك حول الأمن الإلكتروني ومنتجاتك وحلول موردينا. كيف يمكنني مساعدتك؟';
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: isAr ? INTRO_AR : INTRO_EN }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [vendorPrompt, setVendorPrompt] = useState<{ needed: boolean; originalQ: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLang = useRef(lang);
  const ALL_VENDORS = ['Barracuda', 'Keepit', 'Arctic Wolf', 'Boxphish', 'BullWall', 'CyberSmart', 'Druva', 'WatchGuard'];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Update intro message whenever language changes (only if conversation hasn't started)
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: isAr ? INTRO_AR : INTRO_EN }];
      }
      return prev;
    });
  }, [isAr]);

  const sendMessage = async (q: string, vendor?: string) => {
    const effectiveVendor = vendor || selectedVendor;
    const userMsg = q.trim();
    if (!userMsg) return;
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    setVendorPrompt(null);
    const assistantIdx = { current: -1 };
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg, domain, vendor: effectiveVendor, lang }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '', fullText = '';
      let relevantCats: string[] = [];
      let relevantProds: RelevantProduct[] = [];
      setMessages(m => { assistantIdx.current = m.length; return [...m, { role: 'assistant', content: '' }]; });
      setLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.relevantProducts) {
              relevantProds = parsed.relevantProducts;
              relevantCats = [...new Set(parsed.relevantProducts.flatMap((p: RelevantProduct) => p.categories))];
              if (onHighlight) onHighlight(relevantCats);
              setMessages(m => m.map((msg, i) => i === assistantIdx.current ? { ...msg, relevantCategories: relevantCats, relevantProducts: relevantProds } : msg));
            }
            if (parsed.content) {
              fullText += parsed.content;
              setMessages(m => m.map((msg, i) => i === assistantIdx.current ? { ...msg, content: fullText } : msg));
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch (e: any) { if (e.message && !e.message.includes('JSON')) throw e; }
        }
      }
    } catch {
      if (assistantIdx.current >= 0) {
        setMessages(m => m.map((msg, i) => i === assistantIdx.current ? { ...msg, content: 'Sorry, something went wrong. Please try again.' } : msg));
      } else {
        setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full" data-testid="chatbot-container">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full gradient-cta flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'gradient-cta text-white rounded-br-sm' : 'bg-white text-[#1f2937] border border-[#e5e7eb] shadow-sm rounded-bl-sm'
              }`} style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </div>
            </div>
            {/* Action buttons after every non-intro assistant message */}
            {msg.role === 'assistant' && i > 0 && msg.content && (
              <ChatActionButtons
                isAr={isAr}
                domain={domain}
                accountName={accountName}
                accountOwner={accountOwner}
                messageContent={msg.content}
                messageIndex={i}
              />
            )}
            {/* Category chips + business case for assistant messages */}
            {msg.role === 'assistant' && msg.relevantCategories && msg.relevantCategories.length > 0 && (
              <div className="ml-9 mt-2 space-y-2 max-w-[85%]">
                {/* Clickable category tiles */}
                <div className="flex flex-wrap gap-1.5">
                  {msg.relevantCategories.map(cat => (
                    <button key={cat} onClick={() => onOpenCategory && onOpenCategory(cat)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#fef9c3] border border-[#fbbf24] text-[#92400e] hover:bg-[#fef08a] transition-colors">
                      <span>↗</span> {cat}
                    </button>
                  ))}
                </div>
                {/* Business case snippet for first category */}
                {CATEGORY_RESEARCH[msg.relevantCategories[0]] && (
                  <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#0369a1]">📊 Business Case — {msg.relevantCategories[0]}</span>
                      <button onClick={() => onOpenCategory && onOpenCategory(msg.relevantCategories![0])}
                        className="text-xs text-[#4494D1] hover:underline">View full ↗</button>
                    </div>
                    <p className="text-xs text-[#374151] leading-relaxed">{CATEGORY_RESEARCH[msg.relevantCategories[0]].summary.slice(0, 180)}…</p>
                    <div className="mt-1.5 space-y-0.5">
                      {CATEGORY_RESEARCH[msg.relevantCategories[0]].stats.slice(0, 2).map((s, si) => (
                        <div key={si} className="flex items-start gap-1 text-xs text-[#6b7280]">
                          <span className="text-[#4494D1] flex-shrink-0">▸</span><span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full gradient-cta flex items-center justify-center mr-2">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm border border-[#e5e7eb]">
              <Loader2 className="w-4 h-4 text-[#6b7280] animate-spin" />
            </div>
          </div>
        )}
        {vendorPrompt?.needed && (
          <div className="flex flex-wrap gap-2 mt-2">
            {ALL_VENDORS.map(v => (
              <button key={v} onClick={() => { setSelectedVendor(v); sendMessage(vendorPrompt.originalQ, v); }}
                className="vendor-badge px-3 py-1.5 text-sm transition-colors">
                {v}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-[#e5e7eb]">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            data-testid="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('typeQuestion')}
            className="flex-1 bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-sm text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:border-[#4494D1]"
          />
          <button type="submit" disabled={loading || !input.trim()} data-testid="chat-send"
            className="gradient-cta text-white rounded-xl px-4 py-2.5 disabled:opacity-40 hover:opacity-90 transition-opacity">
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

const VENDOR_LOGOS: Record<string, { logo: string; bg: string; taglineKey: string }> = {
  Barracuda: { logo: 'https://www.barracuda.com/favicon.ico', bg: '#d32f2f', taglineKey: 'tagline_barracuda' },
  Keepit: { logo: 'https://www.keepit.com/favicon.ico', bg: '#0d47a1', taglineKey: 'tagline_keepit' },
  'Arctic Wolf': { logo: 'https://arcticwolf.com/favicon.ico', bg: '#1565c0', taglineKey: 'tagline_arcticWolf' },
  Boxphish: { logo: 'https://www.boxphish.com/favicon.ico', bg: '#6a1b9a', taglineKey: 'tagline_boxphish' },
  BullWall: { logo: 'https://bullwall.com/favicon.ico', bg: '#e65100', taglineKey: 'tagline_bullwall' },
  CyberSmart: { logo: 'https://cybersmart.co.uk/favicon.ico', bg: '#2e7d32', taglineKey: 'tagline_cybersmart' },
  Druva: { logo: 'https://www.druva.com/favicon.ico', bg: '#00838f', taglineKey: 'tagline_druva' },
  WatchGuard: { logo: 'https://www.watchguard.com/favicon.ico', bg: '#f57c00', taglineKey: 'tagline_watchguard' },
};

function NewsTab({ domain }: { domain: string }) {
  const { t } = useLang();
  const { data: newsletters } = useQuery({ queryKey: ['/api/newsletters', domain], queryFn: () => apiFetch(`/api/newsletters?domain=${domain}`).then(r => r.json()) });
  return (
    <div className="space-y-8">
      {/* Broad Peak Newsletters — TOP */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl gradient-cta flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-[#1f2937]">{t('broadPeakNewsletters')}</h2>
        </div>
        {newsletters?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {newsletters.map((n: any) => (
              <a key={n.id} href={`/uploads/${n.filename}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-[#e5e7eb] hover:border-[#C65793] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all group">
                <div className="w-10 h-10 rounded-xl gradient-cta flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#1f2937] group-hover:text-[#C65793] transition-colors">{n.title}</div>
                  <div className="text-xs text-[#9ca3af] mt-0.5">{new Date(n.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#9ca3af] group-hover:text-[#C65793] flex-shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-5 bg-[#f9fafb] border border-dashed border-[#d1d5db] rounded-xl text-[#9ca3af]">
            <BookOpen className="w-6 h-6 opacity-40 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('noNewsletters')}</p>
              <p className="text-xs">{t('noNewslettersHint')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Vendor Resource Libraries — large tiles with logos */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#4494D1] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-[#1f2937]">{t('vendorResourceLibraries')}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {VENDOR_NEWS.map(v => {
            const meta = VENDOR_LOGOS[v.vendor] || { logo: '', bg: '#4494D1', taglineKey: 'tagline_barracuda' };
            return (
              <a key={v.vendor} href={v.url} target="_blank" rel="noopener noreferrer"
                className="flex flex-col bg-white border border-[#e5e7eb] hover:border-[#4494D1] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(68,148,209,0.15)] transition-all group overflow-hidden">
                {/* Coloured header with logo */}
                <div className="flex items-center justify-center h-20 px-4" style={{ background: meta.bg + '18', borderBottom: '1px solid ' + meta.bg + '22' }}>
                  {meta.logo ? (
                    <img
                      src={meta.logo}
                      alt={v.vendor}
                      className="h-8 w-8 rounded-lg object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: meta.bg }}>
                      {v.vendor[0]}
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="p-4 flex-1 flex flex-col gap-1">
                  <div className="text-sm font-bold text-[#1f2937] group-hover:text-[#4494D1] transition-colors">{v.vendor}</div>
                  <div className="text-xs text-[#6b7280] leading-tight flex-1">{t((meta as any).taglineKey as any)}</div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-[#4494D1] font-medium">
                    {t('visitLibrary')} <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── RESOURCES TAB ───────────────────────────────────────────────────────────
const DATASHEETS = [
  // ── Barracuda — Email Protection ─────────────────────────────────────────
  { vendor: 'Barracuda', product: 'Total Email Protection', category: 'Email Protection', url: 'https://assets.barracuda.com/assets/docs/dms/Barracuda_Total_Email_Protection_SC_Media_US.pdf' },
  { vendor: 'Barracuda', product: 'Email Gateway Defense', category: 'Email Protection', url: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/DS-Email-Gateway-Defense.pdf' },
  { vendor: 'Barracuda', product: 'Impersonation Protection', category: 'Email Protection', url: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/ds-impersonation-protection.pdf' },
  { vendor: 'Barracuda', product: 'Email Security Gateway', category: 'Email Protection', url: 'https://assets.barracuda.com/assets/docs/dms/datasheet_Email-Security-Gateway_US.pdf' },
  { vendor: 'Barracuda', product: 'Forensics & Incident Response', category: 'Email Protection', url: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/DS-Forensics-Incident-Response.pdf' },
  { vendor: 'Barracuda', product: 'Email Threat Scanner', category: 'Email Protection', url: 'https://www.barracuda.com/products/email-protection/email-threat-scanner' },
  // ── Barracuda — Data Protection ──────────────────────────────────────────
  { vendor: 'Barracuda', product: 'Cloud-to-Cloud Backup', category: 'Data Protection', url: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/DS-Cloud-to-Cloud-Backup.pdf' },
  { vendor: 'Barracuda', product: 'Backup (Physical/Virtual)', category: 'Data Protection', url: 'https://assets.barracuda.com/assets/docs/dms/DS_backup_US.pdf' },
  // ── Barracuda — Network Protection ───────────────────────────────────────
  { vendor: 'Barracuda', product: 'SecureEdge', category: 'Network Protection', url: 'https://assets.barracuda.com/assets/docs/dms/OV_SecureEdge_Specifications_US.pdf' },
  { vendor: 'Barracuda', product: 'SecureEdge Access', category: 'Network Protection', url: 'https://www.barracuda.com/products/network-protection/secureedge-access' },
  { vendor: 'Barracuda', product: 'CloudGen Firewall', category: 'Network Protection', url: 'https://assets.barracuda.com/assets/docs/dms/DS_CloudGen-Firewall_AWS_US.pdf' },
  { vendor: 'Barracuda', product: 'CloudGen WAN', category: 'Network Protection', url: 'https://www.barracuda.com/products/network-protection/sd-wan' },
  // ── Barracuda — Application Protection ───────────────────────────────────
  { vendor: 'Barracuda', product: 'Web Application Firewall', category: 'Application Protection', url: 'https://assets.barracuda.com/assets/docs/dms/Barracuda_Web_Application_Firewall_DS_US_1-8_pdf.pdf' },
  { vendor: 'Barracuda', product: 'WAF-as-a-Service', category: 'Application Protection', url: 'https://assets.barracuda.com/assets/docs/dms/Barracuda_Waf_as_a_Service_DS_US.pdf' },
  { vendor: 'Barracuda', product: 'Advanced Bot Protection', category: 'Application Protection', url: 'https://assets.barracuda.com/assets/docs/dms/solution-brief_ABP_US_1-1.pdf' },
  { vendor: 'Barracuda', product: 'DDoS Protection', category: 'Application Protection', url: 'https://assets.barracuda.com/assets/docs/dms/Barracuda_Web_Application_Firewall_SB_Active_DDoS_Prevention_US.pdf' },
  { vendor: 'Barracuda', product: 'Managed XDR', category: 'MDR / XDR', url: 'https://assets.barracuda.com/assets/docs/dms/DS_Managed-XDR_US.pdf' },
  // ── Keepit ───────────────────────────────────────────────────────────────
  { vendor: 'Keepit', product: 'Microsoft 365 Backup', category: 'Backup', url: 'https://lp.keepit.com/hubfs/product-sheets/Keepit_for_M365_product_sheet_NEWM365Logo.pdf' },
  { vendor: 'Keepit', product: 'Azure AD / Entra ID Backup', category: 'Backup', url: 'https://lp.keepit.com/hubfs/product-sheets/EntraID-Productsheet.pdf' },
  { vendor: 'Keepit', product: 'Dynamics 365 Backup', category: 'Backup', url: 'https://lp.keepit.com/hubfs/product-sheets/Keepit-Microsoft-Dynamics-EN.pdf' },
  { vendor: 'Keepit', product: 'Salesforce Backup', category: 'Backup', url: 'https://www.keepit.com/resources/keepit-backup-and-recovery-for-salesforce/' },
  { vendor: 'Keepit', product: 'Google Workspace Backup', category: 'Backup', url: 'https://www.keepit.com/resources/google-product-sheet/' },
  { vendor: 'Keepit', product: 'Service Guide', category: 'Overview', url: 'https://lp.keepit.com/hubfs/content-assets/EN/Keepit-Service-Guide.pdf' },
  // ── WatchGuard ───────────────────────────────────────────────────────────
  { vendor: 'WatchGuard', product: 'Firebox T-Series (Tabletop)', category: 'Network Security', url: 'https://www.watchguard.com/wgrd-resource-center/docs/firebox-t25' },
  { vendor: 'WatchGuard', product: 'Firebox M290/M390 (Midrange)', category: 'Network Security', url: 'https://www.watchguard.com/wgrd-resource-center/docs/firebox-m290-and-m390' },
  { vendor: 'WatchGuard', product: 'Firebox M6850 (Enterprise)', category: 'Network Security', url: 'https://www.watchguard.com/wgrd-resource-center/docs/firebox-m6850' },
  { vendor: 'WatchGuard', product: 'WatchGuard Cloud', category: 'Network Security', url: 'https://www.watchguard.com/wgrd-resource-center/docs/watchguard-cloud' },
  { vendor: 'WatchGuard', product: 'EPDR (Endpoint Prevention, Detection & Response)', category: 'Endpoint Security', url: 'https://www.watchguard.com/wgrd-resource-center/docs/watchguard-epdr' },
  { vendor: 'WatchGuard', product: 'EDR (Endpoint Detection & Response)', category: 'Endpoint Security', url: 'https://www.watchguard.com/wgrd-resource-center/docs/watchguard-edr' },
  { vendor: 'WatchGuard', product: 'Endpoint Security Basic (AV)', category: 'Endpoint Security', url: 'https://www.watchguard.com/wgrd-resource-center/docs/watchguard-endpoint-security-basic' },
  { vendor: 'WatchGuard', product: 'WatchGuard MDR', category: 'MDR', url: 'https://www.watchguard.com/wgrd-resource-center/docs/watchguard-mdr-msps' },
  { vendor: 'WatchGuard', product: 'AuthPoint MFA', category: 'Identity & MFA', url: 'https://www.watchguard.com/wgrd-resource-center/docs/authpoint' },
  // ── Druva ────────────────────────────────────────────────────────────────
  { vendor: 'Druva', product: 'Data Resiliency Cloud', category: 'Platform', url: 'https://www.druva.com/products/data-resilience' },
  { vendor: 'Druva', product: 'Microsoft 365 Backup', category: 'Backup', url: 'https://www.druva.com/content/dam/druvaincprogram/collateral/datasheet/datasheet-m365-backup-express.pdf' },
  { vendor: 'Druva', product: 'Endpoint Data Protection', category: 'Backup', url: 'https://www.druva.com/content/dam/druvaincprogram/collateral/datasheet/datasheet-endpoint-data-protection-and-cyber-resilience.pdf' },
  { vendor: 'Druva', product: 'SaaS Apps & Endpoints', category: 'Backup', url: 'https://www.druva.com/content/dam/druvaincprogram/collateral/datasheet/datasheet-saas-apps-endpoints.pdf' },
  // ── Arctic Wolf ──────────────────────────────────────────────────────────
  { vendor: 'Arctic Wolf', product: 'Managed Detection & Response', category: 'MDR', url: 'https://cybersecurity.arcticwolf.com/rs/840-OSQ-661/images/AW_Managed_Detection_Response_Datasheet.pdf' },
  { vendor: 'Arctic Wolf', product: 'Managed Risk', category: 'Managed Risk', url: 'https://cybersecurity.arcticwolf.com/rs/840-OSQ-661/images/AW_Managed_Risk_Service_Datasheet.pdf' },
  { vendor: 'Arctic Wolf', product: 'Managed Security Awareness', category: 'Security Awareness', url: 'https://arcticwolf.com/resource/aw/arctic-wolf-managed-security-awareness-datasheet' },
  { vendor: 'Arctic Wolf', product: 'Incident Response', category: 'Incident Response', url: 'https://arcticwolf.com/solutions/incident-response-retainer/' },
  // ── CyberSmart ───────────────────────────────────────────────────────────
  { vendor: 'CyberSmart', product: 'Cyber Essentials', category: 'Compliance', url: 'https://cybersmart.co.uk/products/cyber-essentials/' },
  { vendor: 'CyberSmart', product: 'Cyber Essentials Plus', category: 'Compliance', url: 'https://cybersmart.co.uk/products/cyber-essentials-plus/' },
  // ── BullWall ─────────────────────────────────────────────────────────────
  { vendor: 'BullWall', product: 'Ransomware Containment', category: 'Ransomware Protection', url: 'https://bullwall.com/wp-content/uploads/2023/04/BullWall-Product-Brief_Ransomware-Containment.pdf' },
  { vendor: 'BullWall', product: 'Server Intrusion Protection (SIP)', category: 'Ransomware Protection', url: 'https://bullwall.com/wp-content/uploads/2023/09/BullWall-Product-Brief-SIP.pdf' },
  // ── Boxphish ─────────────────────────────────────────────────────────────
  { vendor: 'Boxphish', product: 'Complete Service Overview 2025', category: 'Security Awareness', url: 'https://www.boxphish.com/wp-content/uploads/2025/05/Complete-Service-Overview-Boxphish-2025.pdf' },
  { vendor: 'Boxphish', product: 'Phishing Simulation', category: 'Security Awareness', url: 'https://www.boxphish.com/phishing-simulations/' },
];

const VENDOR_COLORS: Record<string, string> = {
  Barracuda: 'text-red-300', Keepit: 'text-sky-300', 'Arctic Wolf': 'text-[#4494D1]',
  Boxphish: 'text-[#4494D1]', BullWall: 'text-orange-300', CyberSmart: 'text-emerald-300',
  Druva: 'text-teal-300', WatchGuard: 'text-amber-300',
};

function ResourcesTab({ domain }: { domain: string }) {
  const { t } = useLang();
  const { data: adminSheets } = useQuery({ queryKey: ['/api/datasheets'], queryFn: () => apiFetch(`/api/datasheets?domain=${domain}`).then(r => r.json()) });

  // Group by vendor, then by category within each vendor
  const grouped = DATASHEETS.reduce((acc, ds) => {
    if (!acc[ds.vendor]) acc[ds.vendor] = {};
    const cat = (ds as any).category || 'General';
    if (!acc[ds.vendor][cat]) acc[ds.vendor][cat] = [];
    acc[ds.vendor][cat].push(ds);
    return acc;
  }, {} as Record<string, Record<string, typeof DATASHEETS>>);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-[#1f2937] mb-5">{t('vendorDatasheets')}</h2>
        <div className="space-y-8">
          {Object.entries(grouped).map(([vendor, cats]) => (
            <div key={vendor} className="bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Vendor header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f3f4f6]" style={{ background: 'linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%)' }}>
                <div className="w-7 h-7 rounded-lg gradient-cta flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{vendor[0]}</span>
                </div>
                <span className="text-sm font-bold text-[#1f2937]">{vendor}</span>
                <span className="ms-auto text-xs text-[#9ca3af]">{Object.values(cats).flat().length} {t('resources_count')}</span>
              </div>
              {/* Categories within vendor */}
              <div className="p-4 space-y-4">
                {Object.entries(cats).map(([cat, sheets]) => (
                  <div key={cat}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${VENDOR_COLORS[vendor] || 'text-[#6b7280]'}`}>{cat}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sheets.map(s => (
                        <a key={s.product} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-[#fafafa] hover:bg-white border border-[#e5e7eb] hover:border-[#4494D1] rounded-xl transition-all group">
                          <FileText className="w-4 h-4 text-[#9ca3af] group-hover:text-[#4494D1] flex-shrink-0" />
                          <span className="text-sm text-[#1f2937] leading-snug">{s.product}</span>
                          <ExternalLink className="w-3 h-3 text-[#9ca3af] group-hover:text-[#4494D1] ml-auto flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {adminSheets?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#1f2937] mb-4">Uploaded Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {adminSheets.map((s: any) => (
              <a key={s.id} href={`/uploads/${s.filename}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white hover:bg-[#f9fafb] border border-[#e5e7eb] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all group">
                <FileText className="w-4 h-4 text-pink-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1f2937] truncate">{s.product}</div>
                  <div className="text-xs text-[#9ca3af]">{s.vendor}</div>
                </div>
                <ExternalLink className="w-3 h-3 text-[#9ca3af] group-hover:text-[#4494D1] ml-auto flex-shrink-0" />
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

// ─── MARKDOWN RENDERER ───────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-base font-bold text-[#1f2937] mt-4 mb-2 pb-1 border-b border-[#e5e7eb]">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold text-[#1f2937] mt-4 mb-2 flex items-center gap-1.5"><span className="w-1 h-4 rounded-full inline-block flex-shrink-0" style={{background:'linear-gradient(180deg,#C65793,#4494D1)'}}></span>{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-[#374151] mt-3 mb-1.5">{children}</h3>,
        p: ({ children }) => <p className="text-sm text-[#374151] leading-relaxed mb-2">{children}</p>,
        ul: ({ children }) => <ul className="space-y-1.5 mb-3 ml-1">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-2 mb-3 ml-1 list-none counter-reset-[item]">{children}</ol>,
        li: ({ children, ...props }) => {
          const isOrdered = (props as any).ordered;
          return isOrdered
            ? <li className="flex gap-2.5 text-sm text-[#374151] leading-relaxed"><span className="flex-shrink-0 w-5 h-5 rounded-full gradient-cta text-white text-xs flex items-center justify-center font-bold mt-0.5">{(props as any).index + 1}</span><span>{children}</span></li>
            : <li className="flex gap-2 text-sm text-[#374151] leading-relaxed"><span className="text-[#4494D1] flex-shrink-0 mt-1.5">▸</span><span>{children}</span></li>;
        },
        strong: ({ children }) => <strong className="font-semibold text-[#1f2937]">{children}</strong>,
        em: ({ children }) => <em className="italic text-[#4b5563]">{children}</em>,
        code: ({ inline, children }: any) => inline
          ? <code className="bg-[#f3f4f6] text-[#C65793] px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
          : <pre className="bg-[#1f2937] text-[#e5e7eb] rounded-xl p-3 text-xs font-mono overflow-x-auto mb-3 mt-1"><code>{children}</code></pre>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-[#C65793] pl-3 my-2 text-sm text-[#6b7280] italic">{children}</blockquote>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#4494D1] hover:underline font-medium inline-flex items-center gap-0.5">{children}<ExternalLink className="w-3 h-3 inline" /></a>,
        hr: () => <hr className="border-[#e5e7eb] my-3" />,
        table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="w-full text-xs border-collapse">{children}</table></div>,
        th: ({ children }) => <th className="text-left px-3 py-2 bg-[#f3f4f6] font-semibold text-[#374151] border border-[#e5e7eb]">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 border border-[#e5e7eb] text-[#374151]">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

interface FdTicket {
  id: number; subject: string; status: string; statusCode: number;
  priority: string; priorityCode: number; createdAt: string; updatedAt: string;
  requesterName: string; requesterEmail: string; type: string | null; tags: string[];
}

function TicketStatusBadge({ status, code }: { status: string; code: number }) {
  const color = code === 1 ? 'bg-blue-100 text-blue-700'
    : code === 2 ? 'bg-amber-100 text-amber-700'
    : code === 3 ? 'bg-emerald-100 text-emerald-700'
    : code === 4 ? 'bg-gray-100 text-gray-500'
    : 'bg-purple-100 text-purple-700';
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>{status}</span>;
}

function TicketPriorityDot({ code }: { code: number }) {
  const color = code === 4 ? 'bg-red-500' : code === 3 ? 'bg-orange-400' : code === 2 ? 'bg-amber-400' : 'bg-gray-300';
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />;
}

function TechnicalSupportTab({ domain, accountName, accountOwner }: { domain: string; accountName: string; accountOwner?: AccountOwner }) {
  const { t, lang, isAr } = useLang();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const [ticketState, setTicketState] = useState<'idle' | 'submitting' | 'human-form' | 'done-happy' | 'done-human'>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Freshdesk tickets
  const [tickets, setTickets] = useState<FdTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  // New ticket form
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState(2);
  const [newType, setNewType] = useState('');
  const [submittingNew, setSubmittingNew] = useState(false);
  const [newTicketDone, setNewTicketDone] = useState<FdTicket | null>(null);

  useEffect(() => {
    if (domain) {
      setTicketsLoading(true);
      apiFetch(`/api/tickets?domain=${encodeURIComponent(domain)}`)
        .then(r => r.json())
        .then(d => { if (d.ok) setTickets(d.tickets || []); else setTicketsError('No Tickets'); })
        .catch(() => setTicketsError('No Tickets'))
        .finally(() => setTicketsLoading(false));
    }
  }, [domain]);

  async function submitNewTicket() {
    if (!newSubject.trim() || !newDescription.trim()) return;
    setSubmittingNew(true);
    try {
      const r = await apiFetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject, description: newDescription, priority: newPriority, type: newType || null, domain, customerName: accountName, lang }),
      });
      const d = await r.json();
      if (d.ok && d.ticket) {
        setTickets(prev => [d.ticket, ...prev]);
        setNewTicketDone(d.ticket);
        setNewSubject(''); setNewDescription(''); setNewPriority(2); setNewType('');
      } else {
        alert(d.error || 'Failed to submit ticket');
      }
    } catch { alert('Failed to submit ticket'); }
    finally { setSubmittingNew(false); }
  }

  // Inline ticket form state for "Speak to a human" flow
  const [humanTicketSubject, setHumanTicketSubject] = useState('');
  const [humanTicketDesc, setHumanTicketDesc] = useState('');
  const [humanTicketPriority, setHumanTicketPriority] = useState(2);
  const [humanTicketSubmitting, setHumanTicketSubmitting] = useState(false);

  async function handleHappy(question: string, answer: string) {
    setTicketState('submitting');
    try {
      await apiFetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[Resolved] [${selectedVendor}] ${question.slice(0, 80)}`,
          description: `Customer satisfied with AI response.\n\nQuestion: ${question}\n\nAI Answer: ${answer}`,
          priority: 1,
          type: 'Question',
          domain,
          customerName: accountName,
          lang,
        }),
      });
    } catch { /* still show done */ }
    setTicketState('done-happy');
  }

  async function submitHumanTicket(question: string, answer: string) {
    if (!humanTicketSubject.trim()) return;
    setHumanTicketSubmitting(true);
    try {
      const r = await apiFetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: humanTicketSubject || `[${selectedVendor}] ${question.slice(0, 80)}`,
          description: `${humanTicketDesc}\n\n---\nOriginal question: ${question}\nAI response: ${answer}`,
          priority: humanTicketPriority,
          type: 'Problem',
          domain,
          customerName: accountName,
          lang,
        }),
      });
      const d = await r.json();
      if (d.ok && d.ticket) {
        setTickets(prev => [d.ticket, ...prev]);
      }
      setTicketState('done-human');
    } catch { setTicketState('done-human'); }
    finally { setHumanTicketSubmitting(false); }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const startSupport = (cat: string, vendor: string) => {
    const kb = VENDOR_KB[vendor];
    setSelectedCat(cat);
    setSelectedVendor(vendor);
    setTicketState('idle');
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
    setTicketState('idle');
    if (!kb.hasKB) {
      setMessages(m => [...m, { role: 'assistant', content: `Support for ${selectedVendor} is coming soon. Please contact your account manager for assistance.` }]);
      return;
    }
    setLoading(true);
    const assistantIdx = { current: -1 };
    try {
      const resp = await apiFetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, vendor: selectedVendor, domain }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '', fullText = '', statusText = '';
      // Add placeholder assistant message for streaming
      setMessages(m => { assistantIdx.current = m.length; return [...m, { role: 'assistant', content: '' }]; });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'status' && parsed.text) {
              statusText = parsed.text;
              setMessages(m => m.map((msg, i) => i === assistantIdx.current ? { ...msg, content: statusText } : msg));
            } else if (parsed.type === 'delta' && parsed.text) {
              if (statusText) { fullText = ''; statusText = ''; }
              fullText += parsed.text;
              setMessages(m => m.map((msg, i) => i === assistantIdx.current ? { ...msg, content: fullText } : msg));
            } else if (parsed.type === 'done') {
              // Sources available in parsed.sources if needed
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message);
            }
          } catch (e: any) { if (e.message && !e.message.includes('JSON')) throw e; }
        }
      }
    } catch {
      if (assistantIdx.current >= 0) {
        setMessages(m => m.map((msg, i) => i === assistantIdx.current ? { ...msg, content: 'Something went wrong. Please try again.' } : msg));
      } else {
        setMessages(m => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
      }
    } finally { setLoading(false); }
  };

  if (!selectedCat) {
    return (
      <div className="space-y-6">

      {/* ── AI Category Picker + Contact card ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left: category tile picker */}
        <div className="lg:col-span-2 gradient-bg rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <p className="text-white/90 text-sm leading-relaxed">{t('technicalSupportDescription')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {SUPPORT_CATEGORIES.map(({ cat, vendors }) => {
              const Icon = CATEGORY_ICONS[cat] || Shield;
              return (
                <button key={cat} data-testid={`support-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => { if (vendors.length === 1) startSupport(cat, vendors[0]); else setSelectedCat(cat); }}
                  className="flex flex-col gap-2 p-3 sm:p-4 bg-white hover:bg-[#f9fafb] border border-[#e5e7eb] hover:border-[#4494D1] rounded-xl sm:rounded-2xl text-left shadow-[0_1px_4px_rgba(0,0,0,0.10)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all">
                  <div className="p-2 rounded-xl bg-[#4494D112] w-fit">
                    <Icon className="w-5 h-5 text-[#4494D1]" />
                  </div>
                  <div className="text-sm font-semibold text-[#1f2937] leading-tight">{isAr ? (CATEGORY_NAMES_AR[cat] || cat) : cat}</div>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {vendors.map(v => (
                      <span key={v} className={`text-xs px-2 py-0.5 rounded-full font-medium ${VENDOR_KB[v]?.hasKB ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                        {VENDOR_KB[v]?.hasKB ? v : `${v} (soon)`}
                      </span>
                    ))}
                    {vendors.length === 0 && <span className="text-xs text-[#9ca3af]">{t('comingSoon')}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Contact Our Team card — stretches to match category grid height */}
        <div className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden flex flex-col">
          <div className="h-1 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #C65793, #9b4da8, #4494D1)' }} />
          <div className="p-5 flex flex-col gap-4 flex-1">
            <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide">{t('contactOurTeamHeader')}</h3>
            {accountOwner ? (
              <>
                <div className="flex items-center gap-3">
                  {accountOwner.photo ? (
                    <img src={accountOwner.photo} alt={accountOwner.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#e5e7eb]" />
                  ) : (
                    <div className="w-14 h-14 rounded-full gradient-cta flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                      {accountOwner.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="text-base font-bold text-[#1f2937]">{accountOwner.name}</div>
                    <div className="text-xs text-[#6b7280]">{t('accountManagerRole')}</div>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <a href={`mailto:${accountOwner.email}`}
                    className="flex items-center gap-2.5 text-[#6b7280] hover:text-[#4494D1] transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-[#C6579312] flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 text-[#C65793]" />
                    </div>
                    <span className="group-hover:underline truncate">{accountOwner.email}</span>
                  </a>
                  {accountOwner.phone && (
                    <a href={`tel:${accountOwner.phone}`}
                      className="flex items-center gap-2.5 text-[#6b7280] hover:text-[#4494D1] transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-[#4494D112] flex items-center justify-center flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 text-[#4494D1]" />
                      </div>
                      <span className="group-hover:underline">{accountOwner.phone}</span>
                    </a>
                  )}
                  {accountOwner.calendly && (
                    <a href={accountOwner.calendly} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-[#6b7280] hover:text-[#4494D1] transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-[#7b5ea712] flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-[#7b5ea7]" />
                      </div>
                      <span className="group-hover:underline">{t('bookMeetingLink')}</span>
                    </a>
                  )}
                </div>
                {/* Welcome video — shown if uploaded by admin, otherwise placeholder */}
                {accountOwner.welcome_video ? (
                  <div className="rounded-xl overflow-hidden border border-[#e5e7eb] bg-black mt-1">
                    <video src={accountOwner.welcome_video} controls className="w-full max-h-40 object-cover" />
                  </div>
                ) : (
                  <div className="mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e5e7eb] bg-[#f9fafb] py-5 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#C6579312] flex items-center justify-center">
                      <Video className="w-5 h-5 text-[#C65793]" />
                    </div>
                    <p className="text-xs font-medium text-[#6b7280]">{t('welcomeVideo')}</p>
                    <p className="text-[11px] text-[#9ca3af] leading-tight px-2">{t('noVideoYet')}</p>
                  </div>
                )}

                <a href={`mailto:${accountOwner.email}?subject=Technical Support Request — ${accountName}`}
                  className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #C65793, #4494D1)' }}>
                  <Mail className="w-4 h-4" /> {t('emailForSupport')}
                </a>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#6b7280]">{t('needHelp')}</p>
                <a href="mailto:support@broadpeakcyber.com?subject=Technical Support Request — ${accountName}"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #C65793, #4494D1)' }}>
                  <Mail className="w-4 h-4" /> {t('contactSupport')}
                </a>
              </div>
            )}
          </div>
        </div>

      {/* ── Support Tickets Section — full width, spans all 3 cols ───────── */}
      <div className="lg:col-span-3 bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4494D112] flex items-center justify-center">
              <Ticket className="w-4 h-4 text-[#4494D1]" />
            </div>
            <h3 className="font-semibold text-[#1f2937] text-sm">{t('supportTickets')}</h3>
            {tickets.length > 0 && (
              <span className="text-xs bg-[#f3f4f6] text-[#6b7280] px-2 py-0.5 rounded-full">{tickets.length}</span>
            )}
          </div>
          <button
            onClick={() => { setShowNewTicket(v => !v); setNewTicketDone(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #C65793, #4494D1)' }}
            data-testid="button-new-ticket"
          >
            <Plus className="w-3.5 h-3.5" /> {t('logATicket')}
          </button>
        </div>

        {/* New Ticket Form */}
        {showNewTicket && (
          <div className="px-5 py-4 border-b border-[#e5e7eb] bg-[#fafafa] space-y-3">
            {newTicketDone ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-emerald-800">Ticket #{newTicketDone.id} logged successfully</div>
                  <div className="text-xs text-emerald-600">{newTicketDone.subject}</div>
                </div>
                <button onClick={() => { setNewTicketDone(null); setShowNewTicket(false); }} className="ml-auto text-emerald-500 hover:text-emerald-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#6b7280] mb-1">{t('subjectLabel')}</label>
                    <input
                      value={newSubject} onChange={e => setNewSubject(e.target.value)}
                      placeholder={t('subjectPlaceholder')}
                      className="w-full text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4494D1]/30 focus:border-[#4494D1]"
                      data-testid="input-ticket-subject"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6b7280] mb-1">{t('priorityLabel')}</label>
                    <select value={newPriority} onChange={e => setNewPriority(Number(e.target.value))}
                      className="w-full text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4494D1]/30"
                      data-testid="select-ticket-priority">
                      <option value={1}>{t('priorityLow')}</option>
                      <option value={2}>{t('priorityMedium')}</option>
                      <option value={3}>{t('priorityHigh')}</option>
                      <option value={4}>{t('priorityUrgent')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6b7280] mb-1">{t('typeLabel')}</label>
                    <select value={newType} onChange={e => setNewType(e.target.value)}
                      className="w-full text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4494D1]/30"
                      data-testid="select-ticket-type">
                      <option value="">{t('selectType')}</option>
                      <option value="Question">{t('ticketTypeQuestion')}</option>
                      <option value="Incident">{t('typeIncident')}</option>
                      <option value="Problem">{t('typeProblem')}</option>
                      <option value="Feature Request">{t('typeFeatureRequest')}</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#6b7280] mb-1">{t('descriptionLabel')}</label>
                    <textarea
                      value={newDescription} onChange={e => setNewDescription(e.target.value)}
                      placeholder={t('descriptionPlaceholder')}
                      rows={4}
                      className="w-full text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4494D1]/30 focus:border-[#4494D1] resize-none"
                      data-testid="textarea-ticket-description"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setShowNewTicket(false)} className="text-sm text-[#6b7280] hover:text-[#1f2937] px-3 py-1.5">{t('cancel')}</button>
                  <button
                    onClick={submitNewTicket}
                    disabled={submittingNew || !newSubject.trim() || !newDescription.trim()}
                    className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #C65793, #4494D1)' }}
                    data-testid="button-submit-ticket"
                  >
{submittingNew ? t('submitting') : t('submitTicket')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Ticket list */}
        <div className="divide-y divide-[#f3f4f6]">
          {ticketsLoading && (
            <div className="px-5 py-6 text-center text-sm text-[#9ca3af]">{t('loadingTickets')}</div>
          )}
          {!ticketsLoading && ticketsError && (
            <div className="px-5 py-4 text-sm text-[#ef4444]">{ticketsError}</div>
          )}
          {!ticketsLoading && !ticketsError && tickets.length === 0 && (
            <div className="px-5 py-8 text-center">
              <Ticket className="w-8 h-8 text-[#d1d5db] mx-auto mb-2" />
              <p className="text-sm text-[#9ca3af]">{t('noTicketsFound')}</p>
              <p className="text-xs text-[#d1d5db] mt-1">{t('ticketsDomainHint')}</p>
            </div>
          )}
          {tickets.map(t => (
            <div key={t.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#fafafa] transition-colors" data-testid={`ticket-row-${t.id}`}>
              <TicketPriorityDot code={t.priorityCode} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-[#9ca3af]">#{t.id}</span>
                  <span className="text-sm font-medium text-[#1f2937] truncate flex-1">{t.subject}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <TicketStatusBadge status={t.status} code={t.statusCode} />
                  <span className="text-[10px] text-[#9ca3af]">{t.priority} priority</span>
                  {t.type && <span className="text-[10px] text-[#9ca3af]">· {t.type}</span>}
                  <span className="text-[10px] text-[#9ca3af] ml-auto">{fmtDate(t.createdAt)}</span>
                </div>
                {t.requesterName && t.requesterEmail && !t.requesterEmail.includes('barracuda') && !t.requesterEmail.includes('boxphish') && (
                  <div className="text-[10px] text-[#c4c9d4] mt-0.5">{t.requesterName} · {t.requesterEmail}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      </div>
      </div>
    );
  }

  if (selectedCat && !selectedVendor) {
    const vendors = CATEGORY_VENDORS[selectedCat] || [];
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedCat(null)} className="text-sm text-[#9ca3af] hover:text-[#1f2937] flex items-center gap-1">← {t('cancel')}</button>
        <h3 className="text-lg font-bold text-[#1f2937]">{selectedCat} — Select Vendor</h3>
        <div className="grid grid-cols-2 gap-3">
          {vendors.map(v => {
            const kb = VENDOR_KB[v];
            return (
              <button key={v} onClick={() => startSupport(selectedCat, v)}
                className="flex items-center justify-between p-4 bg-white hover:bg-[#f9fafb] border border-[#e5e7eb] hover:border-[#4494D1] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all text-left">
                <div>
                  <div className="text-sm font-medium text-[#1f2937]">{v}</div>
                  <div className={`text-xs mt-1 ${kb?.hasKB ? 'text-[#059669]' : 'text-[#9ca3af]'}`}>
{kb?.hasKB ? `KB: ${kb.label}` : t('comingSoon')}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const kb = VENDOR_KB[selectedVendor!];
  return (
    <div className="flex flex-col h-[500px] sm:h-[560px]">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => { setSelectedCat(null); setSelectedVendor(null); setMessages([]); setInitDone(false); }}
          className="text-sm text-[#9ca3af] hover:text-[#1f2937]">← {t('cancel')}</button>
        <span className="text-sm font-medium text-[#1f2937]">{selectedCat} — {selectedVendor}</span>
        {kb?.url && (
          <a href={kb.url} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs text-[#4494D1] hover:text-[#357eb2] flex items-center gap-1">
            {kb.label} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4 space-y-4">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const userQ = messages[i - 1]?.content || '';
          return (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm gradient-cta text-white text-sm leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full">
                  {/* Assistant message card */}
                  <div className="flex items-start gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full gradient-cta flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs text-[#9ca3af] mt-1.5 font-medium">Broad Peak AI · {selectedVendor} Support</span>
                  </div>
                  <div className="ml-9 bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-sm shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
                    {/* Gradient top accent */}
                    <div className="h-0.5" style={{background:'linear-gradient(90deg,#C65793,#9b4da8,#4494D1)'}} />
                    <div className="p-4">
                      <MarkdownContent content={msg.content} />
                    </div>
                    {/* Satisfaction buttons — only on last assistant message when not loading and has content */}
                    {isLast && !loading && msg.content.length > 40 && i > 0 && (
                      <div className="border-t border-[#f3f4f6] px-4 py-3 space-y-3">
                        {ticketState === 'idle' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#9ca3af] mr-1">{t('happyWithResponse')}?</span>
                            <button
                              onClick={() => handleHappy(userQ, msg.content)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f0fdf4] border border-[#86efac] text-[#166534] hover:bg-[#dcfce7] transition-colors">
                              <ThumbsUp className="w-3.5 h-3.5" /> {t('happyWithResponse')}
                            </button>
                            <button
                              onClick={() => { setTicketState('human-form'); setHumanTicketSubject(`[${selectedVendor}] ${userQ.slice(0, 80)}`); setHumanTicketDesc(''); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#fff7ed] border border-[#fed7aa] text-[#9a3412] hover:bg-[#ffedd5] transition-colors">
                              <UserRound className="w-3.5 h-3.5" /> {t('speakToHuman')}
                            </button>
                          </div>
                        )}
                        {ticketState === 'human-form' && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-[#1f2937]">{t('logSupportTicket')}</p>
                            <input
                              value={humanTicketSubject}
                              onChange={e => setHumanTicketSubject(e.target.value)}
                              placeholder={t('ticketSubjectPlaceholder')}
                              className="w-full border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-xs text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:border-[#4494D1]"
                            />
                            <textarea
                              value={humanTicketDesc}
                              onChange={e => setHumanTicketDesc(e.target.value)}
                              placeholder={t('ticketDescriptionPlaceholder')}
                              rows={3}
                              className="w-full border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-xs text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:border-[#4494D1] resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <select
                                value={humanTicketPriority}
                                onChange={e => setHumanTicketPriority(Number(e.target.value))}
                                className="border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs text-[#1f2937] focus:outline-none focus:border-[#4494D1]">
                                <option value={1}>{t('priorityLow')}</option>
                                <option value={2}>{t('priorityMedium')}</option>
                                <option value={3}>{t('priorityHigh')}</option>
                                <option value={4}>{t('priorityUrgent')}</option>
                              </select>
                              <button
                                onClick={() => submitHumanTicket(userQ, msg.content)}
                                disabled={humanTicketSubmitting || !humanTicketSubject.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium gradient-cta text-white disabled:opacity-40">
                                {humanTicketSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ticket className="w-3.5 h-3.5" />}
                                {t('logTicket')}
                              </button>
                              <button onClick={() => setTicketState('idle')} className="text-xs text-[#9ca3af] hover:text-[#1f2937] px-2">{t('cancel')}</button>
                            </div>
                          </div>
                        )}
                        {ticketState === 'submitting' && (
                          <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('loggingTicket')}
                          </div>
                        )}
                        {ticketState === 'done-happy' && (
                          <div className="flex items-center gap-2 text-xs text-[#166534] font-medium">
                            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
{t('ticketRaised')}
                          </div>
                        )}
                        {ticketState === 'done-human' && (
                          <div className="flex items-center gap-2 text-xs text-[#9a3412] font-medium">
                            <Ticket className="w-4 h-4 text-[#f97316]" />
                            {t('ticketRaised')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2 ml-9">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[#C65793] animate-bounce" style={{animationDelay:'0ms'}} />
              <span className="w-2 h-2 rounded-full bg-[#9b4da8] animate-bounce" style={{animationDelay:'150ms'}} />
              <span className="w-2 h-2 rounded-full bg-[#4494D1] animate-bounce" style={{animationDelay:'300ms'}} />
            </div>
            <span className="text-xs text-[#9ca3af]">{t('loadingTickets').replace('...', '')} {kb?.label}...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {kb?.hasKB && (
        <div className="mt-3">
          <form onSubmit={e => { e.preventDefault(); sendSupportMsg(); }} className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Ask a ${selectedVendor} question...`}
              className="flex-1 bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-sm text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:border-[#4494D1]" />
            <button type="submit" disabled={loading || !input.trim()}
              className="gradient-cta text-white rounded-xl px-4 py-2.5 disabled:opacity-40">
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
  const { t, dir, isAr } = useLang();
  const [activeTab, setActiveTab] = useState<'products' | 'support' | 'news' | 'resources' | 'ce-readiness' | 'risk-score'>('products');
  const [selectedCategory, setSelectedCategory] = useState<CategoryEntry | null>(null);
  const [highlightedCategories, setHighlightedCategories] = useState<string[]>([]);
  const [latestRiskScore, setLatestRiskScore] = useState<{ score: number; label: string; submitted_at: string } | null>(null);

  // Load latest risk score for this domain
  useEffect(() => {
    if (!domain) return;
    const token = getToken();
    fetch(`/api/assessments?domain=${encodeURIComponent(domain)}&type=cyber-risk-score`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []).then(rows => {
      if (Array.isArray(rows) && rows.length > 0) {
        const latest = rows[0];
        setLatestRiskScore({ score: latest.score, label: latest.label, submitted_at: latest.submitted_at });
      }
    }).catch(() => {});
  }, [domain]);

  const { data: customer, isLoading } = useQuery<CustomerData>({
    queryKey: ['/api/customer', domain],
    queryFn: () => apiFetch(`/api/customer/${domain}`).then(r => r.json()),
  });

  const tabs = [
    { id: 'products' as const, label: t('myProducts') },
    { id: 'support' as const, label: t('technicalSupport') },
    { id: 'news' as const, label: t('newsUpdates') },
    { id: 'resources' as const, label: t('resources') },
    { id: 'ce-readiness' as const, label: t('ceReadiness') },
    { id: 'risk-score' as const, label: t('riskScore') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5]" dir={dir}
      style={{ fontFamily: isAr ? "'Cairo', sans-serif" : undefined }}>
      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-black-text.jpg" alt="Broad Peak Cyber" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-3">
            {customer && <span className="text-sm text-[#6b7280] hidden md:block">{customer.accountName}</span>}
            <LangToggleDark />
            <button onClick={onLogout} data-testid="logout-button"
              className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#1f2937] transition-colors">
              <LogOut className="w-4 h-4" /> {t('signOut')}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-8 flex flex-col gap-4 sm:gap-6">
        {/* Welcome */}
        {customer && (
          <div className="gradient-cta rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow-[0_8px_24px_rgba(123,94,167,0.20)]">
            <h1 className="text-xl sm:text-2xl font-bold text-white">{t('welcomeBack')}</h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1">{customer.accountName} · {customer.grid.filter(g => g.status === 'active').length} {t('activeSecurityServices')}</p>
          </div>
        )}

        {/* Tabs — gradient bar, white text, evenly spread */}
        <div className="w-full rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(123,94,167,0.18)] overflow-x-auto"
          style={{ background: 'linear-gradient(160deg, #C65793 0%, #9b4da8 40%, #5a6bbf 70%, #4494D1 100%)' }}>
          <div className="flex min-w-max sm:min-w-0 w-full">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`tab-${tab.id}`}
                className={`flex-1 px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base font-bold whitespace-nowrap transition-all relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/90'
                }`}>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C65793] animate-spin" /></div>
        ) : !customer ? (
          <div className="flex-1 flex items-center justify-center text-[#9ca3af] text-sm">{t('noDataFound')}</div>
        ) : (
          <>
            {/* MY PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                {/* Left: 3x3 tile grid — stretches to fill sidebar height */}
                <div className="lg:col-span-2 lg:self-stretch">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 h-full" style={{ gridAutoRows: '1fr' }}>
                    {ALL_CATEGORIES.map(cat => {
                      const entry = customer.grid.find(g => g.category === cat) || { category: cat, status: 'not_owned' as const, products: [], expiresAt: null, startedAt: null };
                      return <CategoryCard key={cat} entry={entry} onClick={() => { setSelectedCategory(entry); setHighlightedCategories([]); }} highlighted={highlightedCategories.includes(cat)} />;
                    })}
                  </div>
                </div>

                {/* Right: account manager + chatbot + risk score summary */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Account Manager */}
                  {customer.accountOwner && (
                    <AccountManagerCard owner={customer.accountOwner} />
                  )}

                  {/* Ask Broad Peak AI */}
                  <div className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-2xl flex flex-col" style={{ height: '360px' }}>
                    <div className="px-4 pt-4 pb-3 border-b border-[#e5e7eb] flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full gradient-cta flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-[#1f2937]">{t('askBroadPeakAI')}</span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <ChatBot domain={domain} accountName={customer.accountName}
                        onHighlight={(cats) => setHighlightedCategories(cats)}
                        onOpenCategory={(cat) => {
                          const entry = customer.grid.find(g => g.category === cat) || { category: cat, status: 'not_owned' as const, products: [], expiresAt: null, startedAt: null };
                          setSelectedCategory(entry);
                        }}
                      />
                    </div>
                  </div>

                  {/* Cyber Risk Score Summary */}
                  <div className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
                    <div className="h-1" style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #06b6d4)' }} />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#8b5cf612] flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5 text-[#8b5cf6]" />
                          </div>
                          <span className="text-sm font-semibold text-[#1f2937]">{t('cyberRiskScore')}</span>
                        </div>
                        <button onClick={() => setActiveTab('risk-score')}
                          className="text-xs text-[#4494D1] hover:underline font-medium">
                          {latestRiskScore ? t('retake') : t('takeAssessmentLink')}
                        </button>
                      </div>

                      {latestRiskScore ? (() => {
                        const score = latestRiskScore.score;
                        const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
                        const bgColor = score >= 80 ? '#f0fdf4' : score >= 60 ? '#fffbeb' : score >= 40 ? '#fff7ed' : '#fef2f2';
                        const date = new Date(latestRiskScore.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                        return (
                          <div>
                            <div className="flex items-end gap-3 mb-3">
                              <div className="text-5xl font-bold leading-none" style={{ color }}>{score}</div>
                              <div className="text-sm text-[#6b7280] mb-1">/ 100</div>
                              <div className="ml-auto text-right">
                                <div className="text-sm font-semibold" style={{ color }}>{latestRiskScore.label.split('·')[0].trim()}</div>
                                <div className="text-xs text-[#9ca3af]">Last assessed {date}</div>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden mb-3">
                              <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
                            </div>
                            <div className="rounded-xl p-3 text-xs" style={{ background: bgColor, border: `1px solid ${color}30` }}>
                              <span className="font-semibold" style={{ color }}>
                                {score >= 80 ? t('strongPosture') : score >= 60 ? t('someAttention') : t('significantGaps')}
                              </span>
                              <span className="text-[#6b7280] ms-1">{t('clickRetake')}</span>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="text-center py-4">
                          <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex items-center justify-center mx-auto mb-2">
                            <Shield className="w-5 h-5 text-[#9ca3af]" />
                          </div>
                          <p className="text-sm text-[#6b7280] mb-3">{t('noRiskAssessment')}</p>
                          <button onClick={() => setActiveTab('risk-score')}
                            className="text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                            {t('takeAssessment')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && <TechnicalSupportTab domain={domain} accountName={customer.accountName} accountOwner={customer.accountOwner} />}
            {activeTab === 'news' && <NewsTab domain={domain} />}
            {activeTab === 'resources' && <ResourcesTab domain={domain} />}
            {activeTab === 'ce-readiness' && (
              <div className="w-full min-w-0">
                <CEReadiness accountName={customer.accountName} domain={domain} />
              </div>
            )}
            {activeTab === 'risk-score' && (
              <div className="w-full">
                <CyberRiskScore accountName={customer.accountName} domain={domain}
                  onSave={(score: number, label: string, submitted_at: string) => setLatestRiskScore({ score, label, submitted_at })} />
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
