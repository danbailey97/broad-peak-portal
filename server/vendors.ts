// Complete vendor/product catalogue — 9 categories
// Email Protection | Data Protection | Network Protection | Application Protection
// MDR/SOC | Penetration Testing | Security Awareness | GRC | Ransomware Protection

export interface VendorProduct {
  id: string;
  vendor: string;
  name: string;
  categories: string[];
  description: string;
  features: string[];
  datasheetUrl?: string;
  vendorUrl?: string;
  useCases?: string[];
}

export interface VendorInfo {
  name: string;
  resourceLibrary: string;
  knowledgeBase: string | null;
  hasPublicKB: boolean;
  supportLabel: string; // shown in UI
}

export const ALL_CATEGORIES = [
  'Email Protection',
  'Data Protection',
  'Network Protection',
  'Application Protection',
  'MDR/SOC',
  'Penetration Testing',
  'Security Awareness',
  'GRC',
  'Ransomware Protection',
];

// Category icons (emoji for speed)
export const CAT_ICONS: Record<string, string> = {
  'Email Protection': '✉️',
  'Data Protection': '🔒',
  'Network Protection': '🛡️',
  'Application Protection': '🌐',
  'MDR/SOC': '👁️',
  'Penetration Testing': '🔍',
  'Security Awareness': '🎓',
  'GRC': '📋',
  'Ransomware Protection': '🚨',
};

export const VENDOR_INFO: Record<string, VendorInfo> = {
  Barracuda: {
    name: 'Barracuda',
    resourceLibrary: 'https://www.barracuda.com/resources/resource-library',
    knowledgeBase: 'https://campus.barracuda.com/',
    hasPublicKB: true,
    supportLabel: 'Barracuda Campus',
  },
  Keepit: {
    name: 'Keepit',
    resourceLibrary: 'https://www.keepit.com/resources/',
    knowledgeBase: 'https://help.keepit.com/support/solutions',
    hasPublicKB: true,
    supportLabel: 'Keepit Help Centre',
  },
  'Arctic Wolf': {
    name: 'Arctic Wolf',
    resourceLibrary: 'https://arcticwolf.com/resources/',
    knowledgeBase: null,
    hasPublicKB: false,
    supportLabel: 'In Development',
  },
  Boxphish: {
    name: 'Boxphish',
    resourceLibrary: 'https://www.boxphish.com/resources/',
    knowledgeBase: 'https://boxphishsupport.helpdocs.io/',
    hasPublicKB: true,
    supportLabel: 'Boxphish HelpDocs',
  },
  BullWall: {
    name: 'BullWall',
    resourceLibrary: 'https://www.bullwall.com/resources',
    knowledgeBase: null,
    hasPublicKB: false,
    supportLabel: 'In Development',
  },
  CyberSmart: {
    name: 'CyberSmart',
    resourceLibrary: 'https://cybersmart.co.uk/products/',
    knowledgeBase: null,
    hasPublicKB: false,
    supportLabel: 'In Development',
  },
  Druva: {
    name: 'Druva',
    resourceLibrary: 'https://www.druva.com/learning-center/resources',
    knowledgeBase: 'https://help.druva.com/en/',
    hasPublicKB: true,
    supportLabel: 'Druva Help Centre',
  },
  WatchGuard: {
    name: 'WatchGuard',
    resourceLibrary: 'https://www.watchguard.com/wgrd-resource-center/datasheets',
    knowledgeBase: 'https://www.watchguard.com/wgrd-support/find-answers',
    hasPublicKB: true,
    supportLabel: 'WatchGuard Support',
  },
};

export const PRODUCTS: VendorProduct[] = [
  // ── BARRACUDA ──────────────────────────────────────────────
  {
    id: 'barracuda-egd',
    vendor: 'Barracuda',
    name: 'Barracuda Email Gateway Defense',
    categories: ['Email Protection'],
    description: 'Cloud-native email security gateway protecting against spam, phishing, malware, and advanced email threats.',
    features: ['Anti-spam and anti-phishing', 'Advanced threat protection (ATP) with sandboxing', 'Link protection and URL rewriting', 'Impersonation and domain fraud protection', 'Outbound email filtering'],
    datasheetUrl: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/DS-Email-Gateway-Defense.pdf',
    vendorUrl: 'https://www.barracuda.com/products/email-protection',
    useCases: ['phishing', 'spam', 'email security', 'email protection', 'BEC', 'email gateway'],
  },
  {
    id: 'barracuda-premium',
    vendor: 'Barracuda',
    name: 'Barracuda Email Security Premium',
    categories: ['Email Protection'],
    description: 'All-in-one email security combining gateway defense, AI-powered inbox protection, and email continuity.',
    features: ['Combines EGD + Impersonation Protection + Forensics + Continuity', 'AI threat intelligence', 'Account takeover protection', 'Automated incident response'],
    datasheetUrl: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/DS-Email-Gateway-Defense.pdf',
    vendorUrl: 'https://www.barracuda.com/products/email-protection',
    useCases: ['email security', 'account takeover', 'impersonation', 'email protection'],
  },
  {
    id: 'barracuda-premium-plus',
    vendor: 'Barracuda',
    name: 'Barracuda Email Security Premium Plus',
    categories: ['Email Protection'],
    description: 'Barracuda\'s most comprehensive email security tier, adding security awareness training and advanced archiving.',
    features: ['Full Premium tier features', 'Security awareness training included', 'Advanced email archiving', 'E-discovery and compliance'],
    datasheetUrl: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/DS-Email-Gateway-Defense.pdf',
    vendorUrl: 'https://www.barracuda.com/products/email-protection',
    useCases: ['email security', 'compliance', 'archiving', 'security training'],
  },
  {
    id: 'barracuda-xdr',
    vendor: 'Barracuda',
    name: 'Barracuda XDR',
    categories: ['Email Protection', 'MDR/SOC'],
    description: '24/7 managed XDR service combining threat detection across endpoints, email, and cloud with expert SOC response.',
    features: ['24/7 SOC monitoring', 'Cross-layer threat correlation', 'Automated threat response', 'Incident management', 'Compliance reporting'],
    datasheetUrl: 'https://assets.barracuda.com/assets/docs/dms/DS_Managed-XDR_US.pdf',
    vendorUrl: 'https://www.barracuda.com/products/managed-xdr',
    useCases: ['XDR', 'MDR', 'SOC', '24/7 monitoring', 'threat detection', 'incident response'],
  },
  {
    id: 'barracuda-ccb',
    vendor: 'Barracuda',
    name: 'Barracuda Cloud-to-Cloud Backup',
    categories: ['Data Protection'],
    description: 'Microsoft 365 backup and recovery covering Exchange, SharePoint, OneDrive, and Teams.',
    features: ['Exchange Online backup', 'SharePoint and OneDrive backup', 'Teams backup', 'Granular restore', 'Unlimited retention', 'GDPR-compliant storage'],
    datasheetUrl: 'https://www.barracuda.com/content/dam/barracuda-msp/docs/resources/pdf/data-sheets/DS-Cloud-to-Cloud-Backup.pdf',
    vendorUrl: 'https://www.barracuda.com/products/data-protection/cloud-to-cloud-backup',
    useCases: ['Microsoft 365 backup', 'email backup', 'SharePoint backup', 'data recovery', 'M365', 'backup'],
  },
  {
    id: 'barracuda-firewall',
    vendor: 'Barracuda',
    name: 'Barracuda CloudGen Firewall',
    categories: ['Network Protection'],
    description: 'Next-generation firewall with SD-WAN capabilities, deep packet inspection, and zero-trust network access.',
    features: ['Deep packet inspection', 'Intrusion detection and prevention', 'SD-WAN built-in', 'Zero-trust network access', 'Advanced threat protection', 'Centralised management'],
    datasheetUrl: 'https://assets.barracuda.com/assets/docs/dms/DS_CloudGen-Firewall_AWS_US.pdf',
    vendorUrl: 'https://www.barracuda.com/products/network-protection/cloudgen-firewall',
    useCases: ['firewall', 'network security', 'SD-WAN', 'zero trust', 'network protection', 'NGFW'],
  },
  // ── KEEPIT ─────────────────────────────────────────────────
  {
    id: 'keepit-m365',
    vendor: 'Keepit',
    name: 'Keepit Microsoft 365 Backup',
    categories: ['Data Protection'],
    description: 'Immutable, vendor-independent cloud backup for Microsoft 365 including Exchange, SharePoint, OneDrive, Teams, and Dynamics.',
    features: ['Exchange, SharePoint, OneDrive, Teams backup', 'Dynamics 365 backup', 'Entra ID backup', 'Immutable storage (no M365 dependency)', 'Point-in-time recovery', 'Power Apps backup'],
    datasheetUrl: 'https://www.keepit.com/resources/keepit-for-microsoft-365-product-sheet/',
    vendorUrl: 'https://www.keepit.com/',
    useCases: ['Microsoft 365 backup', 'M365', 'SharePoint backup', 'Teams backup', 'data protection', 'backup'],
  },
  // ── ARCTIC WOLF ────────────────────────────────────────────
  {
    id: 'arctic-wolf-mdr',
    vendor: 'Arctic Wolf',
    name: 'Arctic Wolf MDR',
    categories: ['MDR/SOC'],
    description: 'Fully managed detection and response with dedicated Concierge Security Team providing 24/7 monitoring, triage, and guided response.',
    features: ['24/7 security monitoring', 'Dedicated Concierge Security Team', 'Unlimited log retention', 'Threat hunting', 'Cloud and endpoint visibility', 'Guided incident response'],
    datasheetUrl: 'https://arcticwolf.com/resource/aw/arctic-wolf-managed-detection-and-response',
    vendorUrl: 'https://arcticwolf.com/solutions/managed-detection-and-response/',
    useCases: ['MDR', 'SOC', '24/7 monitoring', 'threat detection', 'incident response', 'managed security'],
  },
  {
    id: 'arctic-wolf-risk',
    vendor: 'Arctic Wolf',
    name: 'Arctic Wolf Managed Risk',
    categories: ['MDR/SOC', 'GRC'],
    description: 'Continuous vulnerability and risk management with expert guidance and prioritised remediation.',
    features: ['Vulnerability scanning', 'Risk scoring and prioritisation', 'Concierge-guided remediation', 'Attack surface monitoring', 'Compliance mapping'],
    datasheetUrl: 'https://arcticwolf.com/resources/',
    vendorUrl: 'https://arcticwolf.com/solutions/managed-risk/',
    useCases: ['vulnerability management', 'risk assessment', 'compliance', 'attack surface'],
  },
  // ── BOXPHISH ───────────────────────────────────────────────
  {
    id: 'boxphish-sat',
    vendor: 'Boxphish',
    name: 'Boxphish Security Awareness Training',
    categories: ['Security Awareness'],
    description: 'Automated phishing simulation and security awareness training platform to build a human firewall across the organisation.',
    features: ['Automated phishing simulations', 'Engaging micro-learning modules', 'Personalised learning paths', 'Real-time reporting and dashboards', 'Microsoft 365 integration', 'GDPR-compliant'],
    datasheetUrl: 'https://www.boxphish.com/wp-content/uploads/2025/05/Complete-Service-Overview-Boxphish-2025.pdf',
    vendorUrl: 'https://www.boxphish.com/product/',
    useCases: ['phishing simulation', 'security awareness', 'security training', 'human firewall', 'employee training'],
  },
  // ── BULLWALL ───────────────────────────────────────────────
  {
    id: 'bullwall-ransomware',
    vendor: 'BullWall',
    name: 'BullWall Ransomware Containment',
    categories: ['Ransomware Protection'],
    description: 'Real-time ransomware containment that detects and isolates ransomware within seconds, stopping encryption before it spreads.',
    features: ['Real-time ransomware detection', 'Automatic user isolation', 'Server containment', 'Works alongside existing AV/EDR', 'Instant alerting', 'Forensic evidence capture'],
    datasheetUrl: 'https://bullwall.com/wp-content/uploads/2023/04/BullWall-Product-Brief_Ransomware-Containment.pdf',
    vendorUrl: 'https://bullwall.com/ransomware-containment/',
    useCases: ['ransomware', 'ransomware protection', 'ransomware containment', 'encryption attack', 'cyber attack'],
  },
  // ── CYBERSMART ─────────────────────────────────────────────
  {
    id: 'cybersmart-ce',
    vendor: 'CyberSmart',
    name: 'Cyber Essentials',
    categories: ['Penetration Testing', 'GRC'],
    description: 'UK government-backed Cyber Essentials certification demonstrating foundational cyber hygiene controls.',
    features: ['NCSC-backed certification', 'Boundary firewalls assessment', 'Secure configuration check', 'Access control review', 'Malware protection validation', 'Patch management audit'],
    datasheetUrl: 'https://cybersmart.co.uk/products/cyber-essentials/',
    vendorUrl: 'https://cybersmart.co.uk/products/cyber-essentials/',
    useCases: ['cyber essentials', 'certification', 'compliance', 'NCSC', 'government certification'],
  },
  {
    id: 'cybersmart-ce-plus',
    vendor: 'CyberSmart',
    name: 'Cyber Essentials Plus',
    categories: ['Penetration Testing', 'GRC'],
    description: 'Enhanced Cyber Essentials certification with independent technical verification and hands-on vulnerability testing.',
    features: ['All Cyber Essentials controls', 'Independent technical audit', 'Vulnerability scanning', 'Internal and external testing', 'Higher assurance for supply chain bids'],
    datasheetUrl: 'https://cybersmart.co.uk/products/cyber-essentials-plus/',
    vendorUrl: 'https://cybersmart.co.uk/products/cyber-essentials-plus/',
    useCases: ['cyber essentials plus', 'penetration testing', 'vulnerability testing', 'supply chain', 'government contracts'],
  },
  {
    id: 'cybersmart-active',
    vendor: 'CyberSmart',
    name: 'CyberSmart Active Protect',
    categories: ['GRC'],
    description: 'Continuous compliance monitoring platform providing real-time visibility into your cyber hygiene posture.',
    features: ['Continuous device monitoring', 'Real-time compliance alerts', 'Automated remediation guidance', 'Policy management', 'Board-level reporting'],
    datasheetUrl: 'https://cybersmart.co.uk/products/',
    vendorUrl: 'https://cybersmart.co.uk/',
    useCases: ['compliance monitoring', 'GRC', 'cyber hygiene', 'risk management', 'continuous monitoring'],
  },
  // ── DRUVA ──────────────────────────────────────────────────
  {
    id: 'druva-insync',
    vendor: 'Druva',
    name: 'Druva inSync',
    categories: ['Data Protection'],
    description: 'Cloud-native SaaS data protection for endpoints and Microsoft 365, with built-in compliance and e-discovery.',
    features: ['Endpoint backup (Windows/Mac)', 'Microsoft 365 backup', 'Ransomware recovery', 'Legal hold and e-discovery', 'GDPR compliance tools', 'Air-gapped cloud storage'],
    datasheetUrl: 'https://www.druva.com/documents/pf/datasheets/datasheet-druva-insync.pdf',
    vendorUrl: 'https://www.druva.com/products/resilience-cloud/platform-overview',
    useCases: ['endpoint backup', 'laptop backup', 'data protection', 'e-discovery', 'compliance backup'],
  },
  {
    id: 'druva-phoenix',
    vendor: 'Druva',
    name: 'Druva Phoenix',
    categories: ['Data Protection'],
    description: 'Cloud-native server and workload protection for hybrid and on-premises infrastructure.',
    features: ['Server and VM backup', 'AWS workload protection', 'Disaster recovery', 'Ransomware protection', 'Instant recovery', 'Centralised management'],
    datasheetUrl: 'https://www.druva.com/learning-center/resources/datasheets/datasheet-druva-phoenix',
    vendorUrl: 'https://www.druva.com/products/resilience-cloud/platform-overview',
    useCases: ['server backup', 'disaster recovery', 'VM backup', 'workload protection', 'infrastructure backup'],
  },
  // ── WATCHGUARD ─────────────────────────────────────────────
  {
    id: 'watchguard-firebox',
    vendor: 'WatchGuard',
    name: 'WatchGuard Firebox',
    categories: ['Network Protection'],
    description: 'Enterprise-grade unified threat management (UTM) firewall with SD-WAN, IPS, and advanced threat detection.',
    features: ['Intrusion prevention (IPS)', 'Application control', 'Web filtering', 'SD-WAN', 'VPN (IPSec/SSL)', 'APT Blocker sandboxing'],
    datasheetUrl: 'https://www.watchguard.com/wgrd-resource-center/docs/firebox-m290-and-m390',
    vendorUrl: 'https://www.watchguard.com/wgrd-products/firebox',
    useCases: ['firewall', 'UTM', 'network security', 'IPS', 'SD-WAN', 'network protection'],
  },
  {
    id: 'watchguard-authpoint',
    vendor: 'WatchGuard',
    name: 'WatchGuard AuthPoint',
    categories: ['Application Protection'],
    description: 'Cloud-based multi-factor authentication (MFA) protecting access to networks, VPNs, and cloud applications.',
    features: ['Push-based MFA', 'Hardware token support', 'Risk-based authentication', 'Single sign-on (SSO)', 'RADIUS integration', 'Identity theft protection'],
    datasheetUrl: 'https://www.watchguard.com/wgrd-resource-center/docs/authpoint-multi-factor-authentication',
    vendorUrl: 'https://www.watchguard.com/wgrd-products/authpoint',
    useCases: ['MFA', 'multi-factor authentication', 'identity', 'access control', 'SSO', 'password protection'],
  },
  {
    id: 'watchguard-mdr',
    vendor: 'WatchGuard',
    name: 'WatchGuard MDR',
    categories: ['MDR/SOC'],
    description: '24/7 managed detection and response service built on WatchGuard\'s endpoint security platform.',
    features: ['24/7 threat hunting and monitoring', 'Expert security analysts', 'Automated response playbooks', 'Endpoint and network visibility', 'Monthly reporting'],
    datasheetUrl: 'https://www.watchguard.com/wgrd-resource-center/docs/watchguard-mdr-msps',
    vendorUrl: 'https://www.watchguard.com/wgrd-products/managed-services/mdr',
    useCases: ['MDR', 'managed security', 'threat hunting', '24/7 monitoring'],
  },
  {
    id: 'watchguard-edr',
    vendor: 'WatchGuard',
    name: 'WatchGuard Endpoint EDR/EPDR',
    categories: ['Application Protection', 'MDR/SOC'],
    description: 'AI-powered endpoint detection and response with Zero-Trust Application Service for complete endpoint protection.',
    features: ['AI threat detection', 'Zero-Trust Application Service', 'Behavioural analysis', 'Ransomware protection', 'Threat hunting', 'Automated containment'],
    datasheetUrl: 'https://www.watchguard.com/wgrd-resource-center/docs/watchguard-endpoint-edr-epdr',
    vendorUrl: 'https://www.watchguard.com/wgrd-products/endpoint-detection-and-response',
    useCases: ['EDR', 'EPDR', 'endpoint protection', 'zero trust', 'ransomware', 'AI detection'],
  },
];

export const ALL_VENDORS = ['Barracuda', 'Keepit', 'Arctic Wolf', 'Boxphish', 'BullWall', 'CyberSmart', 'Druva', 'WatchGuard'];

export function findRelevantProducts(query: string): VendorProduct[] {
  const q = query.toLowerCase();
  return PRODUCTS.filter(p =>
    p.useCases?.some(u => q.includes(u.toLowerCase())) ||
    p.categories.some(c => q.includes(c.toLowerCase())) ||
    q.includes(p.name.toLowerCase()) ||
    q.includes(p.vendor.toLowerCase())
  );
}

export function getVendorsByCategory(category: string): string[] {
  return [...new Set(PRODUCTS.filter(p => p.categories.includes(category)).map(p => p.vendor))];
}
