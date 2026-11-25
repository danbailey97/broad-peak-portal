// Barracuda implementation wizard — content sourced from Barracuda Campus
// (documentation.campus.barracuda.com). Email protection assumes the cloud-based
// products (BarracudaONE / Email Gateway Defense) with Microsoft 365 as the mail platform.
// Each configuration question carries plain-English guidance and a best-practice default;
// the customer's chosen depth (light / intermediate / bespoke) decides which are asked.

import type { ImplLink, ImplPhase, ImplStep } from './keepitImplementation';

const C = 'https://documentation.campus.barracuda.com/wiki/spaces/';
const L = (label: string, path: string): ImplLink => ({ label, url: path.startsWith('http') ? path : C + path });
const ONE = 'https://login.barracudanetworks.com/';

// ── Products & plans ──────────────────────────────────────────────
export type BarracudaProductId = 'egd' | 'ip' | 'ir' | 'dfp' | 'ccb' | 'di' | 'cas' | 'sat' | 'se' | 'waas' | 'xdr';
export interface BarracudaProduct { id: BarracudaProductId; name: string; group: 'Email Protection' | 'Data Protection' | 'Network & Application' | 'Managed Security'; hint: string }

export const BARRACUDA_PRODUCTS: BarracudaProduct[] = [
  { id: 'egd', name: 'Email Gateway Defense', group: 'Email Protection', hint: 'Inbound & outbound filtering: spam, viruses, ATP sandboxing, link protection, DLP & encryption' },
  { id: 'ip', name: 'Impersonation Protection', group: 'Email Protection', hint: 'AI protection against BEC, impersonation and account takeover' },
  { id: 'ir', name: 'Incident Response', group: 'Email Protection', hint: 'Post-delivery remediation, threat hunting and automated workflows' },
  { id: 'dfp', name: 'Domain Fraud Protection (DMARC)', group: 'Email Protection', hint: 'DMARC reporting, sender analysis and enforcement' },
  { id: 'cas', name: 'Cloud Archiving Service', group: 'Email Protection', hint: 'Indexed email archive, retention policies, legal hold, eDiscovery' },
  { id: 'sat', name: 'Security Awareness Training', group: 'Email Protection', hint: 'Phishing simulation and user training' },
  { id: 'ccb', name: 'Cloud-to-Cloud Backup', group: 'Data Protection', hint: 'Microsoft 365 & Entra ID backup and point-in-time restore' },
  { id: 'di', name: 'Data Inspector', group: 'Data Protection', hint: 'Find sensitive data and malware in OneDrive & SharePoint' },
  { id: 'se', name: 'SecureEdge (Web Security & ZTNA)', group: 'Network & Application', hint: 'DNS/web filtering, AI-tool controls and Zero Trust access' },
  { id: 'waas', name: 'WAF-as-a-Service', group: 'Network & Application', hint: 'Cloud web application firewall for your websites & APIs' },
  { id: 'xdr', name: 'Managed XDR', group: 'Managed Security', hint: '24/7 SOC-backed detection and response' },
];

export interface BarracudaPlan { id: string; name: string; products: BarracudaProductId[]; note?: string }
// Plan contents from "Overview of Email Protection Plans" (Barracuda Campus)
export const BARRACUDA_PLANS: BarracudaPlan[] = [
  { id: 'ep-adv', name: 'Email Protection Advanced', products: ['egd', 'ip', 'ir', 'dfp'] },
  { id: 'ep-prem', name: 'Email Protection Premium', products: ['egd', 'ip', 'ir', 'dfp', 'ccb', 'di'] },
  { id: 'ep-pp', name: 'Email Protection Premium Plus', products: ['egd', 'ip', 'ir', 'dfp', 'ccb', 'di', 'cas', 'sat'] },
  { id: 'iep', name: 'Integrated Email Protection', products: ['ip', 'ir', 'dfp'], note: 'API-based protection inside Microsoft 365 — no gateway' },
  { id: 'iep-prem', name: 'Integrated Email Protection Premium', products: ['ip', 'ir', 'dfp', 'ccb', 'di'] },
  { id: 'iep-pp', name: 'Integrated Email Protection Premium Plus', products: ['ip', 'ir', 'dfp', 'ccb', 'di', 'cas', 'sat'] },
  { id: 'custom', name: 'Individual products / not sure', products: [] },
];

export const EGD_REGIONS = [
  { id: 'UK', label: 'United Kingdom', inbound: '35.176.92.96/27', spf: 'include:spf.ess.uk.barracudanetworks.com', ess: 'uk.ess.barracudanetworks.com' },
  { id: 'DE', label: 'Germany', inbound: '35.157.190.224/27', spf: 'include:spf.ess.de.barracudanetworks.com', ess: 'de.ess.barracudanetworks.com' },
  { id: 'US', label: 'United States', inbound: '209.222.82.0/24', spf: 'include:spf.ess.barracudanetworks.com', ess: 'us.ess.barracudanetworks.com' },
  { id: 'CA', label: 'Canada', inbound: '15.222.16.128/25', spf: 'include:spf.ess.ca.barracudanetworks.com', ess: 'ca.ess.barracudanetworks.com' },
  { id: 'AU', label: 'Australia', inbound: '3.24.133.128/25', spf: 'include:spf.ess.au.barracudanetworks.com', ess: 'au.ess.barracudanetworks.com' },
  { id: 'IN', label: 'India', inbound: '13.200.136.128/25', spf: 'include:spf.ess.in.barracudanetworks.com', ess: 'in.ess.barracudanetworks.com' },
];

export type Depth = 'light' | 'intermediate' | 'bespoke';
export const DEPTHS: { id: Depth; title: string; titleAr: string; desc: string; descAr: string }[] = [
  { id: 'light', title: 'Light touch', titleAr: 'لمسة خفيفة', desc: 'Follow Broad Peak & Barracuda best practice. We only ask the essentials (region, domains, alert email).', descAr: 'اتبع أفضل الممارسات لدينا ولدى Barracuda. نسأل الأساسيات فقط.' },
  { id: 'intermediate', title: 'Intermediate', titleAr: 'متوسط', desc: 'We explain the most important options in plain English, recommend a choice and ask for your input.', descAr: 'نشرح أهم الخيارات بلغة بسيطة ونوصي بخيار ونطلب رأيك.' },
  { id: 'bespoke', title: 'Bespoke', titleAr: 'مخصص', desc: 'Tell us about a wide range of configuration options — content filtering, DLP, categories, exemptions and more.', descAr: 'أخبرنا عن مجموعة واسعة من خيارات الإعداد — التصفية، منع تسرب البيانات، الاستثناءات والمزيد.' },
];

// ── Basics (asked at every depth) ─────────────────────────────────
export interface BarracudaBasics {
  plan: string;
  products: BarracudaProductId[];
  region: string;          // EGD region id
  domains: string;         // comma separated list of email domains
  alertEmail: string;      // security team / distribution list for alerts
  deployment: 'recommend' | 'mx' | 'inline';
  depth: Depth;
}

// ── Configuration questions ──────────────────────────────────────
export interface CfgOption { value: string; label: string; desc?: string }
export interface CfgQuestion {
  id: string;
  product: BarracudaProductId;
  level: 'intermediate' | 'bespoke';
  title: string;
  explain: string;          // plain-English: what is this and why it matters
  bestPractice: string;     // our recommendation and the reason
  kind: 'single' | 'multi';
  options: CfgOption[];
  recommended: string | string[];
  textLabel?: string;       // optional free-text box alongside the options
  textPlaceholder?: string;
  showIf?: (b: BarracudaBasics, a: Answers) => boolean;
  link: ImplLink;
}
export type Answers = Record<string, string | string[]>;

const egdMx = (b: BarracudaBasics) => resolveDeployment(b) === 'mx';

export const CFG_QUESTIONS: CfgQuestion[] = [
  // ── Email Gateway Defense ──
  {
    id: 'geoCountries', product: 'egd', level: 'intermediate', kind: 'multi',
    title: 'Block or quarantine email by country of origin',
    explain: 'Email Gateway Defense can look at where a message was sent from and block or quarantine it based on the country. A large share of spam and phishing comes from a handful of countries, so if you never do business with — or expect email from — a country, filtering mail from it removes a whole category of risk at almost no cost. If you DO have customers, suppliers or staff there, leave it unticked (or add exemptions for those senders).',
    bestPractice: 'Only filter countries you have no business ties with. Start with Quarantine rather than Block for the first 30 days so you can check the Message Log for anything legitimate, then switch to Block. Pick from the commonly suggested countries below or type your own list.',
    options: [
      { value: 'CHN', label: 'China' }, { value: 'RUS', label: 'Russia' }, { value: 'PRK', label: 'North Korea' }, { value: 'IRN', label: 'Iran' },
      { value: 'NGA', label: 'Nigeria' }, { value: 'VNM', label: 'Vietnam' }, { value: 'BRA', label: 'Brazil' }, { value: 'IDN', label: 'Indonesia' },
      { value: 'BLR', label: 'Belarus' }, { value: 'KAZ', label: 'Kazakhstan' },
    ],
    recommended: [],
    textLabel: 'Other countries to filter (names or ISO codes, comma separated)', textPlaceholder: 'e.g. Ukraine, Turkey, PAK',
    link: L('Regional Policies', 'EGD/pages/2850952/Regional+Policies'),
  },
  {
    id: 'geoAction', product: 'egd', level: 'intermediate', kind: 'single',
    title: 'What should happen to email from those countries?',
    explain: 'Quarantine holds the message so an admin (or the user, via their quarantine digest) can release it. Block rejects it outright and nobody sees it.',
    bestPractice: 'Quarantine for the first 30 days, then move to Block once you are confident nothing legitimate is caught.',
    options: [{ value: 'quarantine', label: 'Quarantine (recommended to start)' }, { value: 'block', label: 'Block' }],
    recommended: 'quarantine',
    textLabel: 'Trusted senders in those countries to exempt (email addresses or domains)', textPlaceholder: 'e.g. supplier.cn, partner@example.ru',
    showIf: (_b, a) => countriesChosen(a).length > 0,
    link: L('Regional Policies', 'EGD/pages/2850952/Regional+Policies'),
  },
  {
    id: 'atpMode', product: 'egd', level: 'intermediate', kind: 'single',
    title: 'Advanced Threat Protection (attachment sandboxing)',
    explain: 'ATP opens attachments and download links in a secure cloud sandbox to catch brand-new malware that normal virus scanning misses. You choose whether mail is held until the scan finishes, or delivered straight away and scanned afterwards.',
    bestPractice: '"Scan First, then Deliver" is the more secure option — the user can never open an infected attachment. Barracuda notes some messages may be briefly deferred while scanning (anything deferred over two hours is quarantined). Choose "Deliver First" only if a few minutes\' delay on attachments is unacceptable to the business.',
    options: [
      { value: 'scanFirst', label: 'Scan First, then Deliver (recommended)', desc: 'Most secure; attachments may be briefly delayed' },
      { value: 'deliverFirst', label: 'Deliver First, then Scan', desc: 'No delay; the user could open a threat before the verdict' },
    ],
    recommended: 'scanFirst',
    link: L('Understanding Advanced Threat Protection', 'EGD/pages/2850933'),
  },
  {
    id: 'banners', product: 'egd', level: 'intermediate', kind: 'single',
    title: 'External sender warning banner',
    explain: 'Adds a banner to the top of every email that comes from outside your organisation, reminding users to be careful with links and attachments. It is one of the simplest ways to stop "CEO fraud" emails that pretend to be internal.',
    bestPractice: 'Turn it on for everyone. If you are worried about user reaction, use Trial Mode for a pilot group first.',
    options: [{ value: 'on', label: 'On for everyone (recommended)' }, { value: 'trial', label: 'Trial mode for selected users' }, { value: 'off', label: 'Off' }],
    recommended: 'on',
    textLabel: 'Pilot users for Trial mode (comma separated)', textPlaceholder: 'e.g. it@yourco.com, ops@yourco.com',
    link: L('Anti-Fraud and Anti-Phishing Protection', 'EGD/pages/2850931/Anti-Fraud+and+Anti-Phishing+Protection'),
  },
  {
    id: 'pwArchives', product: 'egd', level: 'intermediate', kind: 'single',
    title: 'Password-protected attachments (ZIPs, Office files, PDFs)',
    explain: 'Attackers often send password-protected ZIP or Office files because scanners cannot look inside them — the password is written in the email body. You can block, quarantine or ignore these.',
    bestPractice: 'Quarantine. It stops the attack technique but lets an admin release genuine files (for example payslips or legal documents). If a regular sender legitimately uses them, add an Ignore rule for that filename.',
    options: [{ value: 'quarantine', label: 'Quarantine (recommended)' }, { value: 'block', label: 'Block' }, { value: 'ignore', label: 'Ignore (allow)' }],
    recommended: 'quarantine',
    link: L('Content Analysis – Inbound Mail', 'EGD/pages/2851312'),
  },
  {
    id: 'thirdParty', product: 'egd', level: 'intermediate', kind: 'multi',
    title: 'Which services send email on behalf of your domain?',
    explain: 'Sender Spoof Protection blocks any inbound message claiming to be from your own domain that does not come from your mail system — a common phishing trick. But legitimate tools (marketing platforms, invoicing, HR or ticketing systems) also send "as" your domain. Telling us about them means we can exempt them and add them to SPF/DMARC so nothing legitimate breaks.',
    bestPractice: 'Enable Sender Spoof Protection and exempt only the specific third-party services you use. Prefer exempting by sending IP address where the vendor publishes them — Barracuda notes sender exemptions can be abused by spammers.',
    options: [
      { value: 'Mailchimp', label: 'Mailchimp' }, { value: 'HubSpot', label: 'HubSpot' }, { value: 'Salesforce', label: 'Salesforce' }, { value: 'Xero', label: 'Xero' },
      { value: 'Sage', label: 'Sage' }, { value: 'Freshdesk', label: 'Freshdesk' }, { value: 'Zendesk', label: 'Zendesk' }, { value: 'SendGrid', label: 'SendGrid' }, { value: 'DocuSign', label: 'DocuSign' },
    ],
    recommended: [],
    textLabel: 'Other services or sending domains', textPlaceholder: 'e.g. payroll.provider.com, noreply@ourcrm.com',
    link: L('Sender Authentication', 'EGD/pages/2850945'),
  },
  {
    id: 'digest', product: 'egd', level: 'intermediate', kind: 'single',
    title: 'Quarantine digest emails for users',
    explain: 'Users can get a regular email listing messages held in their quarantine, with one-click Deliver, Allow sender or Block sender links. Quarantined mail is deleted after 30 days.',
    bestPractice: 'Daily digest, with users not allowed to change the interval — this keeps behaviour consistent and makes sure nobody misses legitimate mail. Note: build the user list (Entra ID sync) before turning quarantine notifications on.',
    options: [{ value: 'daily', label: 'Daily (recommended)' }, { value: 'twice', label: 'Twice a day' }, { value: 'weekly', label: 'Weekly' }, { value: 'never', label: 'Never — admins manage quarantine' }],
    recommended: 'daily',
    link: L('Quarantine Notifications', 'EGD/pages/2851176/Quarantine+Notifications'),
  },
  {
    id: 'continuity', product: 'egd', level: 'intermediate', kind: 'single',
    title: 'Email Continuity (keep email working if Microsoft 365 is down)',
    explain: 'With spooling and Email Continuity, Barracuda holds incoming mail if Microsoft 365 is unreachable and gives users a web mailbox to read and send email for up to 96 hours. It is only available with MX deployment.',
    bestPractice: 'Turn it on for all users on all domains — Barracuda recommends this for business-continuity compliance.',
    options: [{ value: 'yes', label: 'Enable (recommended)' }, { value: 'no', label: 'Do not enable' }],
    recommended: 'yes',
    showIf: b => egdMx(b),
    link: L('Email Continuity', 'EGD/pages/2850972'),
  },
  {
    id: 'linkProt', product: 'egd', level: 'bespoke', kind: 'single',
    title: 'Link Protection & typosquatting',
    explain: 'Rewrites links in emails so each click is checked in real time. If the site turns malicious after delivery, the user sees a Barracuda warning page instead. Typosquatting protection also corrects look-alike domains (e.g. tripadivsor.com → tripadvisor.com).',
    bestPractice: 'On, with typosquatting protection. Turning Link Protection off also turns off ATP scanning of links.',
    options: [{ value: 'on', label: 'Link Protection + typosquatting (recommended)' }, { value: 'linkOnly', label: 'Link Protection only' }, { value: 'off', label: 'Off' }],
    recommended: 'on',
    link: L('Understanding Link Protection', 'EGD/pages/2850935/Understanding+Link+Protection'),
  },
  {
    id: 'intent', product: 'egd', level: 'bespoke', kind: 'single',
    title: 'Intent Analysis — malicious links in the message body',
    explain: 'Intent Analysis looks for links to known malicious or fraudulent sites in the message body. You choose what happens when one is found.',
    bestPractice: 'Quarantine, so false positives can be released by users or admins. Block is stricter but nothing can be recovered.',
    options: [{ value: 'quarantine', label: 'Quarantine (recommended)' }, { value: 'block', label: 'Block' }, { value: 'defer', label: 'Defer' }, { value: 'off', label: 'Off' }],
    recommended: 'quarantine',
    link: L('Anti-Fraud and Anti-Phishing Protection', 'EGD/pages/2850931/Anti-Fraud+and+Anti-Phishing+Protection'),
  },
  {
    id: 'attachTypes', product: 'egd', level: 'bespoke', kind: 'multi',
    title: 'Risky attachment types to quarantine',
    explain: 'Some file types are almost never sent legitimately by email but are frequently used to deliver malware — scripts, executables and disk images.',
    bestPractice: 'Quarantine the high-risk set below. If a department genuinely needs one (e.g. developers receiving .js files), untick it or ask us to add a sender-specific exemption.',
    options: ['exe', 'js', 'vbs', 'scr', 'bat', 'cmd', 'ps1', 'hta', 'iso', 'img', 'lnk', 'msi', 'jar', 'wsf'].map(v => ({ value: v, label: '.' + v })),
    recommended: ['exe', 'js', 'vbs', 'scr', 'bat', 'cmd', 'ps1', 'hta', 'iso', 'img', 'lnk', 'wsf'],
    textLabel: 'Other extensions', textPlaceholder: 'e.g. .xlsm, .docm',
    link: L('Attachment Filtering – Inbound', 'EGD/pages/2850904'),
  },
  {
    id: 'languages', product: 'egd', level: 'bespoke', kind: 'multi',
    title: 'Quarantine email written in languages you never receive',
    explain: 'Like country filtering, but based on the character set of the message. If nobody in your organisation reads, say, Chinese or Cyrillic text, these messages are almost always spam.',
    bestPractice: 'Only select languages you are certain you never receive. Language exemptions can only be set account-wide, not per domain.',
    options: [{ value: 'Chinese', label: 'Chinese' }, { value: 'Cyrillic', label: 'Cyrillic (Russian etc.)' }, { value: 'Korean', label: 'Korean' }, { value: 'Japanese', label: 'Japanese' }, { value: 'Thai', label: 'Thai' }, { value: 'Vietnamese', label: 'Vietnamese' }],
    recommended: [],
    link: L('Regional Policies', 'EGD/pages/2850952/Regional+Policies'),
  },
  {
    id: 'spf', product: 'egd', level: 'bespoke', kind: 'single',
    title: 'SPF, DKIM and DMARC checks on inbound mail',
    explain: 'These checks confirm a sender is allowed to send for the domain it claims. Barracuda\'s defaults are: SPF hard fail = Block, SPF soft fail = Off, independent DKIM check = Off, block on missing PTR record = Yes.',
    bestPractice: 'Keep Barracuda\'s defaults and turn DMARC checks On. Quarantining SPF soft fails is stricter but catches more misconfigured legitimate senders.',
    options: [
      { value: 'default', label: 'Defaults + DMARC on (recommended)' },
      { value: 'strict', label: 'Strict: also quarantine SPF soft fail & DKIM failures' },
      { value: 'relaxed', label: 'Relaxed: quarantine (not block) SPF hard fail' },
    ],
    recommended: 'default',
    link: L('Sender Authentication', 'EGD/pages/2850945'),
  },
  {
    id: 'categories', product: 'egd', level: 'bespoke', kind: 'single',
    title: 'Marketing emails and newsletters',
    explain: 'Email Categorization can sort "grey mail" that is not technically spam. By default marketing newsletters are Off (no special action), while corporate, transactional, mailing-list and social media email are allowed.',
    bestPractice: 'Keep Transactional on Allow (Barracuda recommends this so invoices and confirmations are never caught). Quarantining marketing mail reduces inbox clutter but users will see more digest entries.',
    options: [{ value: 'off', label: 'Leave marketing at default (recommended)' }, { value: 'quarantine', label: 'Quarantine marketing & newsletters' }, { value: 'block', label: 'Block marketing & newsletters' }],
    recommended: 'off',
    link: L('Anti-Spam and Email Categorization', 'EGD/pages/2850900'),
  },
  {
    id: 'dlp', product: 'egd', level: 'bespoke', kind: 'multi',
    title: 'Outbound data-loss prevention & encryption',
    explain: 'Outbound content policies can encrypt, quarantine or block outgoing mail that contains sensitive data. A common setup is "users type [secure] in the subject to encrypt". Note: Barracuda\'s predefined credit card / privacy / HIPAA patterns are based on US formats.',
    bestPractice: 'Enable subject-keyword encryption and quarantine outbound credit card numbers. Disable Rich Text Format (RTF) for external mail so attachments can be scanned.',
    options: [
      { value: 'encryptKeyword', label: 'Encrypt when the subject contains a keyword (recommended)' },
      { value: 'cards', label: 'Quarantine outbound credit card numbers (recommended)' },
      { value: 'privacy', label: 'Quarantine outbound personal data (Privacy pattern)' },
      { value: 'disableRtf', label: 'Disable RTF on outbound external mail (recommended)' },
    ],
    recommended: ['encryptKeyword', 'cards', 'disableRtf'],
    textLabel: 'Encryption keyword', textPlaceholder: '[secure]',
    link: L('How to Use DLP and Outbound Mail Encryption', 'EGD/pages/2850879/How+to+Use+DLP+and+Outbound+Mail+Encryption'),
  },
  {
    id: 'trusted', product: 'egd', level: 'bespoke', kind: 'multi',
    title: 'Trusted partners, relays and rate control',
    explain: 'Inbound Rate Control slows down a single IP sending large volumes in 30 minutes. If you relay through known servers or receive bulk mail from partners, their IPs can be exempted. Trusted partners can also be exempted from spam scoring.',
    bestPractice: 'Exempt trusted partners by IP address (Inbound Settings > IP Address Policies), not by email address — spammers can forge addresses. Keep the default rate-control threshold unless you see deferrals.',
    options: [{ value: 'none', label: 'Nothing to add (recommended unless you know of one)' }],
    recommended: ['none'],
    textLabel: 'Trusted partner IP addresses or relays (comma separated)', textPlaceholder: 'e.g. 203.0.113.10, 198.51.100.0/24',
    link: L('Inbound Rate Control', 'EGD/pages/2851318'),
  },

  // ── Impersonation Protection ──
  {
    id: 'ipMode', product: 'ip', level: 'intermediate', kind: 'single',
    title: 'What should happen when an impersonation attack is detected?',
    explain: 'Impersonation Protection uses AI to learn who normally emails whom, then spots business email compromise, CEO fraud and account takeover. You choose whether it acts automatically (Enforcement mode) or only reports (Reporting mode).',
    bestPractice: 'Barracuda\'s best-practice guide recommends starting in Enforcement mode with "Send to junk/spam" — users can still see and recover a false positive, but the attack is out of the inbox. Note: Reporting mode also disables Incident Response automatic remediation.',
    options: [
      { value: 'junk', label: 'Send to junk/spam (recommended)', desc: 'Enforcement mode; user can still review it' },
      { value: 'delete', label: 'Delete', desc: 'Enforcement mode; user cannot review it' },
      { value: 'report', label: 'Leave in inbox (Reporting mode)', desc: 'Monitor only; nothing is removed' },
    ],
    recommended: 'junk',
    link: L('How to Specify Attack Response Options', 'SEN/pages/561906257/How+to+Specify+Attack+Response+Options'),
  },
  {
    id: 'ipNotify', product: 'ip', level: 'bespoke', kind: 'single',
    title: 'Tell users when an attack aimed at them is removed?',
    explain: 'Impersonation Protection can send the targeted user an alert explaining that a suspicious email was moved. You can customise the wording.',
    bestPractice: 'Yes — it reinforces awareness and tells the user where the message went.',
    options: [{ value: 'yes', label: 'Yes, alert the recipient (recommended)' }, { value: 'no', label: 'No' }],
    recommended: 'yes',
    link: L('How to Specify Attack Response Options', 'SEN/pages/561906257/How+to+Specify+Attack+Response+Options'),
  },
  {
    id: 'signature', product: 'ip', level: 'intermediate', kind: 'single',
    title: 'Do you use an email signature service with Microsoft 365?',
    explain: 'Services such as Exclaimer or CodeTwo route internal mail out and back in to add signatures. Barracuda notes you may need an extra step so internal mail is not flagged or remediated.',
    bestPractice: 'Tell us which one so we can add the right exemption before you enable enforcement.',
    options: [{ value: 'no', label: 'No' }, { value: 'exclaimer', label: 'Exclaimer' }, { value: 'codetwo', label: 'CodeTwo' }, { value: 'other', label: 'Other / not sure' }],
    recommended: 'no',
    link: L('Impersonation Protection – Getting Started', 'SEN/pages/7798831/Getting+Started'),
  },

  // ── Incident Response ──
  {
    id: 'irAuto', product: 'ir', level: 'intermediate', kind: 'single',
    title: 'Automatic remediation of known threats',
    explain: 'When Barracuda confirms a threat, Incident Response can automatically pull every copy out of every mailbox. You choose between moving copies to Junk or deleting them. Deleting also enables "continuous remediation", which keeps removing new copies for 72 hours.',
    bestPractice: 'Enable it and choose Delete — automatic remediation only acts on verified threats, and continuous remediation catches copies that arrive later in a campaign.',
    options: [
      { value: 'delete', label: 'Enable — delete + continuous remediation (recommended)' },
      { value: 'junk', label: 'Enable — move to Junk folder' },
      { value: 'off', label: 'Do not enable' },
    ],
    recommended: 'delete',
    link: L('Automatic Remediation Settings', 'FIR/pages/1508750/Automatic+Remediation+Settings'),
  },
  {
    id: 'irReport', product: 'ir', level: 'bespoke', kind: 'multi',
    title: 'User reporting & automated workflows',
    explain: 'The Barracuda Outlook add-in gives users a "Report" button. Automated workflows can then notify your team by email, Slack or Microsoft Teams and act on reported emails automatically.',
    bestPractice: 'Deploy the Outlook add-in to everyone and notify the security team by email; add Teams if that is where your IT team works.',
    options: [{ value: 'addin', label: 'Deploy the Outlook report add-in (recommended)' }, { value: 'email', label: 'Workflow notifications by email (recommended)' }, { value: 'teams', label: 'Workflow notifications to Teams' }, { value: 'slack', label: 'Workflow notifications to Slack' }],
    recommended: ['addin', 'email'],
    link: L('Incident Response documentation', 'FIR/pages/1507498'),
  },

  // ── Domain Fraud Protection ──
  {
    id: 'dmarc', product: 'dfp', level: 'intermediate', kind: 'single',
    title: 'How quickly should we move DMARC to enforcement?',
    explain: 'DMARC tells the world\'s mail servers what to do with email that pretends to be from your domain. It starts in Reporting mode (p=none), which reports problems but does not protect you. Once every legitimate sender is identified and passing, you enforce — after that, spoofed email using your domain is rejected.',
    bestPractice: 'Report first, review sources after 2–4 weeks, then enforce as soon as all approved sources pass. Staying in reporting mode forever gives no protection.',
    options: [{ value: 'phased', label: 'Report, review, then enforce (recommended)' }, { value: 'report', label: 'Reporting only for now' }],
    recommended: 'phased',
    link: L('Domain Fraud Protection – Getting Started', 'BDFP/pages/5242891/Getting+Started'),
  },

  // ── Cloud Archiving Service ──
  {
    id: 'casRetention', product: 'cas', level: 'intermediate', kind: 'single',
    title: 'How long should archived email be kept?',
    explain: 'The archive keeps a tamper-proof copy of every email sent and received. A retention policy decides when old messages are permanently purged. New tenants default to 7 years.',
    bestPractice: 'Barracuda\'s best practice is not to keep email longer than your regulatory and compliance obligations require. Check with whoever owns compliance — 6 or 7 years is common in the UK; some sectors require longer.',
    options: [{ value: '7', label: '7 years (default)' }, { value: '6', label: '6 years' }, { value: '10', label: '10 years' }, { value: '3', label: '3 years' }, { value: 'forever', label: 'Forever' }],
    recommended: '7',
    link: L('Retention Policies and Litigation Holds', 'BCAS/pages/4063259'),
  },
  {
    id: 'casExtra', product: 'cas', level: 'bespoke', kind: 'multi',
    title: 'Archive extras',
    explain: 'Litigation holds let auditors freeze messages matching a search so they cannot be purged. Historic import pulls existing Exchange Online mail into the archive so it is complete from day one.',
    bestPractice: 'Enable litigation holds (no impact until used) and import historic mail.',
    options: [{ value: 'holds', label: 'Enable litigation holds (recommended)' }, { value: 'import', label: 'Import existing Exchange Online mail (recommended)' }],
    recommended: ['holds', 'import'],
    link: L('Retention Policies and Litigation Holds', 'BCAS/pages/4063259'),
  },

  // ── Security Awareness Training ──
  {
    id: 'satCadence', product: 'sat', level: 'intermediate', kind: 'single',
    title: 'How often should staff receive phishing simulations?',
    explain: 'Simulated phishing emails test whether staff spot real-world lures; anyone who clicks gets short training. Little-and-often works better than an annual course.',
    bestPractice: 'Monthly simulations with varied difficulty, plus a short training module each quarter (Broad Peak recommendation).',
    options: [{ value: 'monthly', label: 'Monthly (recommended)' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'fortnightly', label: 'Every two weeks' }],
    recommended: 'monthly',
    link: L('Security Awareness Training – Before You Begin', 'BPL/pages/3378779/Before+You+Begin'),
  },
  {
    id: 'satSso', product: 'sat', level: 'bespoke', kind: 'single',
    title: 'Single sign-on for Security Awareness Training admins',
    explain: 'Admins sign in to the training platform to build campaigns and see reports.',
    bestPractice: 'Barracuda strongly recommends SSO for all administrative users.',
    options: [{ value: 'yes', label: 'Set up SSO (recommended)' }, { value: 'no', label: 'Not now' }],
    recommended: 'yes',
    link: L('Email Allow List and Best Practices', 'BPL/pages/3375141/Email+Allow+List+and+Best+Practices'),
  },

  // ── Cloud-to-Cloud Backup ──
  {
    id: 'ccbSources', product: 'ccb', level: 'intermediate', kind: 'multi',
    title: 'Which Microsoft 365 data should be backed up?',
    explain: 'Microsoft keeps deleted data for a limited time only. Cloud-to-Cloud Backup keeps independent, point-in-time copies so you can recover from accidental deletion, ransomware or a malicious insider. Important: once a data source is enabled it cannot be turned off.',
    bestPractice: 'Back up everything — Exchange, OneDrive, SharePoint, Teams and Planner — plus Entra ID so users, groups and roles can be restored.',
    options: [{ value: 'Exchange', label: 'Exchange Online' }, { value: 'OneDrive', label: 'OneDrive' }, { value: 'SharePoint', label: 'SharePoint' }, { value: 'Teams', label: 'Teams' }, { value: 'Planner', label: 'Planner' }, { value: 'Entra', label: 'Entra ID' }],
    recommended: ['Exchange', 'OneDrive', 'SharePoint', 'Teams', 'Planner', 'Entra'],
    link: L('Cloud-to-Cloud Backup – Getting Started', 'BCCB/pages/701661209/Getting+Started'),
  },
  {
    id: 'ccbRetention', product: 'ccb', level: 'intermediate', kind: 'single',
    title: 'How long should backups be kept?',
    explain: 'Retention controls how long deleted or replaced items are kept in the backup. When an item passes its retention period it is permanently purged within about 7 days. The default policy is 1 year; the minimum is 30 days.',
    bestPractice: 'At least 1 year. Match your data-retention policy, and consider longer for SharePoint/OneDrive if you hold records with legal retention requirements.',
    options: [{ value: '1y', label: '1 year (default)' }, { value: '3y', label: '3 years' }, { value: '7y', label: '7 years' }, { value: 'forever', label: 'Forever' }],
    recommended: '1y',
    link: L('How to Configure Retention Policies', 'BCCB/pages/99123208/How+to+Configure+Retention+Policies'),
  },

  // ── Data Inspector ──
  {
    id: 'diOptions', product: 'di', level: 'intermediate', kind: 'multi',
    title: 'Data Inspector scanning options',
    explain: 'Data Inspector scans OneDrive and SharePoint for sensitive data (150+ built-in classifiers, e.g. card numbers, passport numbers) and for stored malware. Malware scanning is off by default.',
    bestPractice: 'Scan the entire tenant (needs a Global Admin), turn on malware scanning, and alert your compliance contact. Wait two weeks to understand the baseline before notifying end users.',
    options: [{ value: 'tenant', label: 'Scan the entire tenant (recommended)' }, { value: 'malware', label: 'Enable malware scanning (recommended)' }, { value: 'adminAlerts', label: 'Email alerts to admins/compliance (recommended)' }, { value: 'userAlerts', label: 'Notify users who store sensitive data' }],
    recommended: ['tenant', 'malware', 'adminAlerts'],
    textLabel: 'Custom data to detect (e.g. employee ID format, project code names)', textPlaceholder: 'e.g. EMP-######, Project Falcon',
    link: L('Data Inspector – Getting Started', 'BDI/pages/4325385/Getting+Started'),
  },

  // ── SecureEdge ──
  {
    id: 'seUse', product: 'se', level: 'intermediate', kind: 'single',
    title: 'What should SecureEdge solve first?',
    explain: 'Web Security filters internet and DNS traffic and controls use of AI tools. ZTNA (Zero Trust Network Access) replaces VPNs by giving users secure access only to the apps they need.',
    bestPractice: 'Start with Web Security (quick win, protects every user), then add ZTNA.',
    options: [{ value: 'web', label: 'Web Security first (recommended)' }, { value: 'ztna', label: 'ZTNA first' }, { value: 'both', label: 'Both' }],
    recommended: 'web',
    link: L('SecureEdge Onboarding Wizard', 'SEP/pages/538607617/SecureEdge+Onboarding+Wizard'),
  },
  {
    id: 'seRisk', product: 'se', level: 'intermediate', kind: 'single',
    title: 'How strict should web filtering be?',
    explain: 'SecureEdge balances three dials: Security Risk Tolerance (lower = blocks more threats), Liability Tolerance (higher = blocks more content that could create compliance/HR issues) and Productivity Focus (more relaxed = lets more categories through).',
    bestPractice: 'Balanced: Medium risk tolerance, High liability tolerance, Medium productivity. Schools usually choose Strict.',
    options: [{ value: 'balanced', label: 'Balanced (recommended)' }, { value: 'strict', label: 'Strict — blocks more (suits schools & regulated sectors)' }, { value: 'open', label: 'Open — fewer blocks, more productivity' }],
    recommended: 'balanced',
    link: L('SecureEdge Onboarding Wizard', 'SEP/pages/538607617/SecureEdge+Onboarding+Wizard'),
  },
  {
    id: 'seAi', product: 'se', level: 'intermediate', kind: 'multi',
    title: 'Which AI tools are approved for staff?',
    explain: 'SecureEdge can block unapproved and high-risk AI tools and guide users to the ones you approve — stopping company data being pasted into unknown AI services.',
    bestPractice: 'Keep both defaults on (block unapproved AI and guide users to approved tools; block high-risk AI tools) and approve only the tools covered by your data policy.',
    options: [{ value: 'Copilot', label: 'Microsoft Copilot' }, { value: 'ChatGPT', label: 'ChatGPT' }, { value: 'Claude', label: 'Claude' }, { value: 'Gemini', label: 'Gemini' }, { value: 'Perplexity', label: 'Perplexity' }],
    recommended: ['Copilot'],
    textLabel: 'Other approved AI tools', textPlaceholder: 'e.g. Grammarly',
    showIf: (_b, a) => a.seUse !== 'ztna',
    link: L('SecureEdge Onboarding Wizard', 'SEP/pages/538607617/SecureEdge+Onboarding+Wizard'),
  },
  {
    id: 'seConn', product: 'se', level: 'bespoke', kind: 'single',
    title: 'Agent or agentless?',
    explain: 'Agentless protects a whole office network or DNS location with no software on devices. The Access Agent enforces policy on each device wherever it is — needed for remote workers and for ZTNA.',
    bestPractice: 'Use the Access Agent on company laptops (protection follows the user) and agentless for office networks and guest Wi-Fi.',
    options: [{ value: 'agent', label: 'Access Agent (recommended)' }, { value: 'agentless', label: 'Agentless (DNS location)' }],
    recommended: 'agent',
    link: L('SecureEdge Onboarding Wizard', 'SEP/pages/538607617/SecureEdge+Onboarding+Wizard'),
  },

  // ── WAF-as-a-Service ──
  {
    id: 'wafApps', product: 'waas', level: 'intermediate', kind: 'multi',
    title: 'Which websites or apps should be protected?',
    explain: 'WAF-as-a-Service sits in front of your website and blocks attacks such as SQL injection, bots and DDoS. You list every domain users use to reach the site (both www and non-www).',
    bestPractice: 'Include every form of each domain — domains not added will not be accessible. Use HTTPS to the backend server, and restrict direct traffic so attackers cannot bypass the WAF.',
    options: [{ value: 'https', label: 'Backend over HTTPS (recommended)' }, { value: 'restrict', label: 'Restrict direct traffic to the WAF only (recommended)' }],
    recommended: ['https', 'restrict'],
    textLabel: 'Website domains to protect', textPlaceholder: 'e.g. www.yourco.com, yourco.com, portal.yourco.com',
    link: L('WAF-as-a-Service – Getting Started', 'WAFAAS/pages/3932196/Getting+Started'),
  },
  {
    id: 'wafMode', product: 'waas', level: 'intermediate', kind: 'single',
    title: 'When should the WAF start blocking?',
    explain: 'New applications start in monitoring mode — attacks are logged but not blocked — so you can check nothing legitimate would be stopped.',
    bestPractice: 'Monitor for 1–2 weeks, review the logs for false positives, then switch to blocking.',
    options: [{ value: '2w', label: 'Monitor 1–2 weeks, then block (recommended)' }, { value: 'now', label: 'Block straight away' }, { value: 'monitor', label: 'Monitor only for now' }],
    recommended: '2w',
    link: L('WAF-as-a-Service – Getting Started', 'WAFAAS/pages/3932196/Getting+Started'),
  },

  // ── XDR ──
  {
    id: 'xdrScope', product: 'xdr', level: 'intermediate', kind: 'multi',
    title: 'What should the XDR SOC monitor?',
    explain: 'Barracuda Managed XDR collects telemetry from your environment and a 24/7 SOC investigates and responds. The more sources connected, the better the visibility.',
    bestPractice: 'Connect Microsoft 365 / Entra ID and your Barracuda email products as a minimum; add endpoints (Managed Endpoint) and your firewall for full coverage.',
    options: [{ value: 'cloud', label: 'Microsoft 365 & Entra ID (recommended)' }, { value: 'email', label: 'Barracuda email security (recommended)' }, { value: 'endpoint', label: 'Endpoints (Managed Endpoint)' }, { value: 'firewall', label: 'Firewall / network' }],
    recommended: ['cloud', 'email'],
    textLabel: 'Out-of-hours escalation contacts (name & phone)', textPlaceholder: 'e.g. Jane Smith +44 7700 900000',
    link: L('Barracuda XDR – Setting up new customer accounts', 'SKOUT/pages/997294082/Setting+up+new+customer+accounts'),
  },
];

// ── helpers ─────────────────────────────────────────────────────
export function resolveDeployment(b: BarracudaBasics): 'mx' | 'inline' {
  if (b.deployment === 'mx' || b.deployment === 'inline') {
    if (b.deployment === 'inline' && !(b.products.includes('ip') || b.products.includes('ir'))) return 'mx';
    return b.deployment;
  }
  // Recommendation: MX keeps Email Continuity & spooling and avoids duplicate archive
  // records; inline is suggested only for multi-domain M365 tenants without CAS.
  const nDomains = splitList(b.domains).length;
  const hasIp = b.products.includes('ip') || b.products.includes('ir');
  if (hasIp && nDomains > 1 && !b.products.includes('cas')) return 'inline';
  return 'mx';
}
export const splitList = (s: string | undefined) => (s || '').split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
const txt = (a: Answers, id: string) => (typeof a[id + '_text'] === 'string' ? (a[id + '_text'] as string) : '').trim();
const arr = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);
const one = (a: Answers, id: string) => (typeof a[id] === 'string' ? (a[id] as string) : '');
export function countriesChosen(a: Answers): string[] {
  const picked = arr(a, 'geoCountries').map(v => CFG_QUESTIONS[0].options.find(o => o.value === v)?.label + ` (${v})`);
  return [...picked, ...splitList(txt(a, 'geoCountries'))];
}

export function questionsFor(b: BarracudaBasics, answers: Answers): CfgQuestion[] {
  return CFG_QUESTIONS.filter(q => b.products.includes(q.product) && (!q.showIf || q.showIf(b, answers)));
}
export function askedQuestions(b: BarracudaBasics, answers: Answers): CfgQuestion[] {
  if (b.depth === 'light') return [];
  return questionsFor(b, answers).filter(q => b.depth === 'bespoke' || q.level === 'intermediate');
}
export function defaultAnswers(): Answers {
  const a: Answers = {};
  CFG_QUESTIONS.forEach(q => { a[q.id] = Array.isArray(q.recommended) ? [...q.recommended] : q.recommended; });
  return a;
}
export function describeAnswer(q: CfgQuestion, a: Answers): string {
  const v = a[q.id];
  const labels = (Array.isArray(v) ? v : [v]).filter(Boolean).map(x => q.options.find(o => o.value === x)?.label || x).map(s => s.replace(/ \(recommended[^)]*\)/i, ''));
  const t = txt(a, q.id);
  const parts = [...labels, ...(t ? [t] : [])];
  return parts.length ? parts.join(', ') : 'None';
}
export function isRecommended(q: CfgQuestion, a: Answers): boolean {
  const v = a[q.id];
  const r = q.recommended;
  if (Array.isArray(r)) { const s = Array.isArray(v) ? v : []; return s.length === r.length && r.every(x => s.includes(x)) && !txt(a, q.id); }
  return v === r;
}

// ── Plan builder ─────────────────────────────────────────────────
export function buildBarracudaPlan(b: BarracudaBasics, a: Answers): ImplPhase[] {
  const has = (p: BarracudaProductId) => b.products.includes(p);
  const reg = EGD_REGIONS.find(r => r.id === b.region) || EGD_REGIONS[0];
  const dep = resolveDeployment(b);
  const domains = splitList(b.domains);
  const primary = domains[0] || 'your primary domain';
  const extra = domains.slice(1);
  const alert = b.alertEmail || 'your security team distribution list';
  const email = has('egd') || has('ip') || has('ir');
  const phases: ImplPhase[] = [];

  // ── 1. Prepare ──
  const prep: ImplStep[] = [{
    id: 'bp-prep-one', title: 'Sign in to BarracudaONE and confirm your subscriptions', portal: 'BarracudaONE', startUrl: ONE,
    summary: 'Everything in this plan is managed from BarracudaONE (Barracuda Cloud Control). Confirm each product you bought is visible and activated, and that the people who will administer it have the right product entitlements.',
    actions: ['Sign in at login.barracudanetworks.com', 'Apps menu (bottom left): confirm every product in this plan is listed', 'Settings > Admin > Users: give admins the product entitlements they need', 'Have a Microsoft 365 Global Admin available for the connection steps'],
    detail: [`Open ${ONE} (I will sign in myself).`, 'Open the Apps menu (bottom left) and list every Barracuda product shown, with its status (active, trial, needs activation).', `Compare against this plan: ${b.products.map(p => BARRACUDA_PRODUCTS.find(x => x.id === p)?.name).join(', ')}. Report anything missing.`, 'Open Settings > Admin > Users and list the users and their product entitlements. Ask me before adding users or changing entitlements.'],
    verify: ['Every product in scope is visible in Apps', 'Named admins have entitlements'], pauseBefore: ['adding users or changing entitlements'],
    links: [L('Email Protection plans overview', 'EBTHREE/overview'), L('Impersonation Protection – managing users', 'SEN/pages/7798831/Getting+Started')],
  }];
  if (has('ip') || has('ir')) prep.push({
    id: 'bp-prep-audit', title: 'Turn on Microsoft 365 audit log search', portal: 'Microsoft Purview', startUrl: 'https://purview.microsoft.com/audit/auditsearch',
    summary: 'Account Takeover Protection needs Microsoft sign-in data, and Barracuda can only collect it once Microsoft audit log search is turned on. Barracuda also recommends finishing any Exchange-to-365 migration before activating.',
    actions: ['Microsoft Purview > Audit', 'If you see "Start recording user and admin activity", turn it on', 'Confirm no Exchange migration is still in progress'],
    detail: ['Open https://purview.microsoft.com/audit/auditsearch (I will sign in as an admin).', 'If a banner offers "Start recording user and admin activity", tell me and wait for my approval before clicking it.', 'Report whether auditing is now on.'],
    verify: ['Audit log search is on'], pauseBefore: ['turning on auditing'],
    links: [L('Integrated Email Protection Best Practices', 'EBTHREE/pages/616431639/Integrated+Email+Protection+Best+Practices')],
  });
  phases.push({ id: 'bp-prep', title: 'Prepare', subtitle: `${prep.length} steps`, steps: prep });

  // ── 2. Email Protection onboarding & mail flow ──
  if (has('egd')) {
    const mf: ImplStep[] = [];
    mf.push({
      id: 'egd-wizard', title: 'Run the Email Protection setup wizard', portal: 'BarracudaONE', startUrl: ONE,
      summary: `Connect Microsoft 365, choose the ${reg.label} data centre and confirm your domain(s). The region cannot be changed later. Deployment method: ${dep === 'mx' ? 'MX records — Barracuda receives your mail first, which enables Email Continuity and lets you lock Microsoft 365 down to Barracuda only' : 'Inline — Microsoft 365 receives mail first and the wizard creates the rules and connectors for you (no Email Continuity)'}.`,
      actions: ['Apps > Email Gateway Defense (or Trials Hub > Open under Email Protection)', 'Next > Connect (do not Skip) > sign in as Global Admin > Accept', `Region: ${reg.label} (permanent)`, `Domain(s): ${domains.join(', ') || primary}`, dep === 'mx' ? 'MX: add Barracuda MX records at priority 99, wait 24–48h, verify, remove old MX, set Barracuda to 1 and 10' : 'Inline: accept the extra Microsoft app; wizard creates 3 rules + 3 connectors'],
      needs: ['Microsoft 365 Global Admin', dep === 'mx' ? 'Access to your DNS provider' : 'Nothing else — the wizard configures Exchange Online'],
      detail: [
        `Open ${ONE}, click Apps > Email Gateway Defense. If the Trials Hub opens, click Open under Email Protection. If a "Set Up Now" banner shows, click it.`,
        'Click Next, then Connect (never Skip — skipping removes the inline option). When the Microsoft sign-in appears, STOP and let me sign in as Global Admin and accept the permissions.',
        `When the threat scan starts, click Next. Select Region "${reg.label}". Tell me this cannot be changed and wait for my confirmation before clicking Next.`,
        `Confirm the domain(s) to protect: ${domains.join(', ') || '(ask me)'}. ${dep === 'mx' ? 'Select MX record deployment (only available when one domain is selected — protect the primary domain here; others are added later).' : 'Select Inline deployment.'}`,
        ...(dep === 'mx' ? [
          'Copy the primary and backup MX records from "Add new MX records" and show them to me. I will add them at my DNS provider with priority 99 (or guide me through it if I open the DNS portal).',
          'Tell me to come back after 24–48 hours. When I return, click Verify records and report the result.',
          'Then list the "Remove old MX records" entries for me to delete, and remind me to set the Barracuda records to priority 1 and 10. Click Verify update and report.',
        ] : [
          'Click Next. When Microsoft asks me to accept the additional application, STOP and let me accept it.',
          'Click Next to deploy. Report the rules, connectors, connection-filter entry and allow-spoofing policy the wizard says it created. The outbound rule is created disabled — that is expected.',
        ]),
        'Click Complete setup only after I confirm. Note: the wizard cannot be reopened once completed.',
      ],
      verify: ['Domain shows as verified', dep === 'mx' ? 'Only Barracuda MX records remain (priority 1 and 10)' : 'Wizard reports rules and connectors created'],
      pauseBefore: ['Microsoft sign-in and consent', 'selecting the region', 'Complete setup'],
      links: [L('Email Protection Advanced Plan Initial Deployment', 'EBTHREE/pages/91553817/Email+Protection+Advanced+Plan+Initial+Deployment'), L('Inline Deployment Considerations and Requirements', 'EGD/pages/990969857/Inline+Deployment+Considerations+and+Requirements')],
    });
    if (dep === 'mx') mf.push({
      id: 'egd-connector', title: 'Create the Barracuda Inbound Connector and Enhanced Filtering', portal: 'Exchange admin centre', startUrl: 'https://admin.exchange.microsoft.com/#/connectors',
      summary: `Tell Microsoft 365 to trust mail arriving from Barracuda's ${reg.label} range (${reg.inbound}) and enable Enhanced Filtering so Microsoft still sees the real sender IP. This is the connector best practice: one named partner connector, TLS required, and the last hop skipped.`,
      actions: ['Exchange admin > Mail flow > Connectors > Add a connector', 'From: Partner organization; Name: Barracuda Inbound Connector', `Identify by sender IP: ${reg.inbound}`, 'Keep "Reject email messages if they aren\'t sent over TLS"', 'security.microsoft.com/skiplisting: auto-detect & skip last IP; apply to entire organisation'],
      detail: ['Open https://admin.exchange.microsoft.com/#/connectors and click Add a connector.', 'Connection from: Partner organization. Next. Name: "Barracuda Inbound Connector". Next.', `Choose "By verifying that the IP address of the sending server matches…" and add ${reg.inbound}. Next.`, 'Leave the default "Reject email messages if they aren\'t sent over TLS". Next. Show me the summary and wait for my approval before Create connector.', 'Open https://security.microsoft.com/skiplisting, select Barracuda Inbound Connector, choose "Automatically detect and skip the last IP address" and "Apply to entire organization". Ask before Save.', 'Open Defender > Email & collaboration > Policies & rules > Threat policies > Anti-spam > Anti-spam inbound policy (Default) and report the current actions — do not change them.'],
      verify: ['Connector exists with the correct IP range', 'Enhanced Filtering enabled for the connector'], pauseBefore: ['creating the connector', 'saving Enhanced Filtering'],
      links: [L('Step 2 – Configure Microsoft 365 for Inbound and Outbound Mail', 'EGD/pages/2850836/Step+2+-+Configure+Microsoft+365+for+Inbound+and+Outbound+Mail'), L('EGD IP ranges', 'EGD/pages/2850960/Email+Gateway+Defense+IP+Ranges+Used+for+Configuration')],
    });
    if (extra.length) mf.push({
      id: 'egd-domains', title: `Add your other domains (${extra.length})`, portal: 'Email Gateway Defense', startUrl: ONE,
      summary: 'Barracuda recommends adding every Microsoft 365 accepted domain. Use the Microsoft hostname (e.g. yourco-com.mail.protection.outlook.com) as the destination, not an IP address.',
      actions: ['Microsoft 365 admin > Settings > Domains: note each domain\'s mail hostname', 'EGD > Domains > Add Domain: domain + hostname', 'Verify ownership for each'],
      detail: [`For each of: ${extra.join(', ')} — open the Microsoft 365 admin centre > Settings > Domains, click the domain and note its *.mail.protection.outlook.com hostname.`, `In BarracudaONE > Apps > Email Gateway Defense > Domains click Add Domain, enter the domain and the hostname. Ask before saving each.`, 'Follow the on-screen domain verification and report the status of every domain.'],
      verify: ['Every domain listed and verified'], pauseBefore: ['adding each domain'],
      links: [L('Step 2 – Add additional domains', 'EGD/pages/2850836/Step+2+-+Configure+Microsoft+365+for+Inbound+and+Outbound+Mail')],
    });
    if (dep === 'mx') mf.push({
      id: 'egd-lockdown', title: 'Validate mail flow, then lock Microsoft 365 to Barracuda only', portal: 'Exchange Online PowerShell', startUrl: 'https://admin.exchange.microsoft.com/',
      summary: 'Wait at least 24 hours after the MX change, check no one is still sending directly to Microsoft, then restrict the inbound connector so attackers cannot bypass Barracuda by targeting your tenant directly.',
      actions: ['Wait ≥24h after MX change', 'Check message trace for mail arriving NOT via Barracuda', 'Run: Set-InboundConnector -Identity "Barracuda Inbound Connector" -RestrictDomainsToIPAddresses $true'],
      detail: ['Confirm with me that at least 24 hours have passed since the MX records changed.', 'Open Exchange admin > Mail flow > Message trace and look at the last 24 hours of inbound mail. Report any external messages that did NOT come through the Barracuda connector.', 'If clean, show me the PowerShell command: Install-Module ExchangeOnlineManagement; Connect-ExchangeOnline; Set-InboundConnector -Identity "Barracuda Inbound Connector" -RestrictDomainsToIPAddresses $true — I will run it myself.'],
      verify: ['No direct-to-tenant external mail', 'Connector restricted'], pauseBefore: ['any restriction change'],
      links: [L('Restrict inbound mail to Barracuda IPs', 'EGD/pages/2851004')],
    });
    mf.push({
      id: 'egd-spf', title: 'Add Barracuda to your SPF record', portal: 'DNS provider', startUrl: 'https://mxtoolbox.com/spf.aspx',
      summary: `So outbound mail relayed by Barracuda passes SPF, add "${reg.spf}" to the SPF TXT record of each sending domain (keep the existing Microsoft include).`,
      actions: [`Add ${reg.spf} to each domain\'s SPF record`, 'Keep include:spf.protection.outlook.com', 'Only one SPF record per domain'],
      detail: [`For each domain (${domains.join(', ') || 'ask me'}), look up the current SPF record at https://mxtoolbox.com/spf.aspx and report it.`, `Propose the new record with ${reg.spf} added before the final -all/~all, keeping existing includes, and check it stays under 10 DNS lookups.`, 'I will update DNS myself (or guide me in my DNS portal). Re-check afterwards.'],
      verify: ['SPF includes Barracuda and Microsoft, single record, ≤10 lookups'], pauseBefore: ['any DNS change'],
      links: [L('Step 2 – Configure SPF', 'EGD/pages/2850836/Step+2+-+Configure+Microsoft+365+for+Inbound+and+Outbound+Mail')],
    });
    mf.push({
      id: 'egd-users', title: 'Sync users from Microsoft Entra ID', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: 'Barracuda needs a user list before quarantine and per-user settings work. Sync from Entra ID so new starters and leavers are handled automatically.',
      actions: ['EGD > Users > User Add/Update', 'Choose Microsoft Entra ID sync and authorise', 'Confirm user count matches Microsoft 365'],
      detail: ['Open BarracudaONE > Apps > Email Gateway Defense > Users.', 'Find the directory/Entra ID synchronisation option and show it to me. STOP at the Microsoft consent screen for me to approve.', 'After sync, report the number of users imported and compare with the Microsoft 365 licensed user count.'],
      verify: ['Users synced; counts match'], pauseBefore: ['Microsoft consent'],
      links: [L('Step 2 – Configure user accounts and lists', 'EGD/pages/2850836/Step+2+-+Configure+Microsoft+365+for+Inbound+and+Outbound+Mail')],
    });
    mf.push(dep === 'mx' ? {
      id: 'egd-outbound', title: 'Route outbound mail through Barracuda', portal: 'Exchange admin centre', startUrl: 'https://admin.exchange.microsoft.com/#/connectors',
      summary: 'Outbound filtering protects your reputation and enables DLP & encryption. First ask Barracuda Support to confirm "Outbound Groups" are enabled on your account (we can do this for you).',
      actions: ['Confirm Outbound Groups enabled with Barracuda Support', 'Connector: Office 365 → Partner organization; domains: *', 'Smart host: the outbound hostname from EGD > Domains', 'TLS: Always, trusted CA; Validate; Create'],
      needs: ['Confirmation from Barracuda Support (or Broad Peak) that Outbound Groups are enabled'],
      detail: ['Ask me to confirm Outbound Groups are enabled. Do not continue until I say yes.', 'In BarracudaONE > Email Gateway Defense > Domains, copy the outbound hostname from Outbound Smarthost Configuration (looks like d12345.o.ess.barracudanetworks.com).', 'Open https://admin.exchange.microsoft.com/#/connectors > Add a connector. From: Office 365; To: Partner organization. Name: "Barracuda Outbound". Only when sent to these domains: *. Route via smart host: paste the hostname.', 'Keep "Always use TLS… Issued by trusted CA". Validate with an external address I give you (a failed test email from onmicrosoft.com is expected). Ask before Create connector.'],
      verify: ['A test email to an external mailbox shows Barracuda in its headers'], pauseBefore: ['creating the connector'],
      links: [L('Step 2 – Configure outbound mail', 'EGD/pages/2850836/Step+2+-+Configure+Microsoft+365+for+Inbound+and+Outbound+Mail')],
    } : {
      id: 'egd-outbound', title: 'Enable outbound filtering rule (inline)', portal: 'Exchange admin centre', startUrl: 'https://admin.exchange.microsoft.com/#/transportrules',
      summary: 'The wizard created the rule "Send outbound email to Barracuda for filtering" switched off. Turn it on once inbound is working.',
      actions: ['Exchange admin > Mail flow > Rules', 'Select "Send outbound email to Barracuda for filtering"', 'Enable'],
      detail: ['Open https://admin.exchange.microsoft.com/#/transportrules.', 'Find "Send outbound email to Barracuda for filtering" and report its status.', 'Ask for my approval, then enable it.'],
      verify: ['Rule enabled; outbound test mail appears in the EGD Message Log'], pauseBefore: ['enabling the rule'],
      links: [L('Initial deployment – Step 7', 'EBTHREE/pages/91553817/Email+Protection+Advanced+Plan+Initial+Deployment')],
    });
    phases.push({ id: 'bp-mailflow', title: 'Email Gateway Defense — mail flow', subtitle: `${dep === 'mx' ? 'MX deployment' : 'Inline deployment'} · ${mf.length} steps`, steps: mf, note: dep === 'mx' ? 'MX deployment: Barracuda receives mail first. Email Continuity is available and Microsoft 365 can be locked to accept mail only from Barracuda.' : 'Inline deployment: Microsoft 365 receives mail first. No Email Continuity/spooling; if you also use Cloud Archiving, inbound messages will appear twice in the archive.' });

    // ── 3. EGD policies (driven by answers) ──
    const pol: ImplStep[] = [];
    const countries = countriesChosen(a);
    const langs = arr(a, 'languages');
    pol.push({
      id: 'egd-spam', title: 'Anti-spam, reputation & categories', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: `Turn on the Barracuda Reputation Block List (Barracuda strongly recommends it), keep virus scanning and the Real-Time System on, keep Transactional email on Allow, and set marketing/newsletters to: ${describeAnswer(q('categories'), a)}.`,
      actions: ['Inbound Settings > Anti-Spam/Antivirus', 'Use Barracuda Reputation Block List: on', 'Virus scanning & Real-Time System: on', `Marketing & newsletters: ${describeAnswer(q('categories'), a)}; Transactional: Allow`],
      detail: ['Open BarracudaONE > Email Gateway Defense > Inbound Settings > Anti-Spam/Antivirus. Report the current values of every setting on the page.', 'Propose: Use Barracuda Reputation Block List ON; virus scanning ON; Use Barracuda Real-Time System ON; Email Categorization — Corporate Allow, Transactional Allow, Mailing Lists Allow, Social Media Allow, Marketing ' + (one(a, 'categories') === 'off' ? 'Off' : one(a, 'categories') === 'block' ? 'Block' : 'Quarantine') + '.', 'Ask for my approval, then Save Changes.'],
      verify: ['BRBL on; categories as agreed'], pauseBefore: ['Save Changes'],
      links: [L('Anti-Spam and Email Categorization', 'EGD/pages/2850900'), L('Anti-Spam/Antivirus', 'EGD/pages/2850941')],
    });
    pol.push({
      id: 'egd-phish', title: 'Anti-phishing: banners, Intent Analysis & Link Protection', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: `External sender banner: ${describeAnswer(q('banners'), a)}. Intent Analysis action: ${describeAnswer(q('intent'), a)}. Link Protection: ${describeAnswer(q('linkProt'), a)}.`,
      actions: ['Inbound Settings > Anti-Phishing', 'Anti-Fraud Intelligence: on', `External Sender Warning / banners: ${one(a, 'banners')}`, `Intent Analysis on; Content Analysis: ${one(a, 'intent')}`, `Link Protection ${one(a, 'linkProt') === 'off' ? 'off' : 'Yes'}${one(a, 'linkProt') === 'on' ? ' + Typosquatting' : ''}`],
      detail: ['Open Email Gateway Defense > Inbound Settings > Anti-Phishing and report current values.', `Set Anti-Fraud Intelligence on. External Sender Warning: ${one(a, 'banners') === 'off' ? 'Off' : 'On'}. Email warning banners: ${one(a, 'banners') === 'trial' ? 'Trial Mode for ' + (txt(a, 'banners') || '(ask me for pilot users)') : one(a, 'banners') === 'off' ? 'Off' : 'On'}.`, `Intent Analysis: On. Content Analysis action: ${one(a, 'intent') === 'off' ? 'Off' : one(a, 'intent').charAt(0).toUpperCase() + one(a, 'intent').slice(1)}.`, `Link Protection: ${one(a, 'linkProt') === 'off' ? 'No' : 'Yes'}. Typosquatting Protection: ${one(a, 'linkProt') === 'on' ? 'Yes' : 'No'}.`, 'Show me the planned changes and Save only after I approve.'],
      verify: ['Send a test email from an external mailbox and confirm the banner and link rewriting'], pauseBefore: ['Save Changes'],
      links: [L('Anti-Fraud and Anti-Phishing Protection', 'EGD/pages/2850931/Anti-Fraud+and+Anti-Phishing+Protection')],
    });
    pol.push({
      id: 'egd-atp', title: 'Advanced Threat Protection', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: `ATP mode: ${describeAnswer(q('atpMode'), a)}. Admin notifications go to ${alert}.`,
      actions: ['ATP settings page', `Mode: ${one(a, 'atpMode') === 'deliverFirst' ? 'Deliver First, then Scan' : 'Scan First, then Deliver'}`, `Notify Admin: Yes → ${alert}`, 'Avoid ATP exemptions unless essential'],
      detail: ['Open Email Gateway Defense > ATP settings and report the current mode.', `Set Advanced Threat Protection to "${one(a, 'atpMode') === 'deliverFirst' ? 'Deliver First, then Scan' : 'Scan First, then Deliver'}".`, `If Notify Admin is available, set it to Yes and ATP Notification Email to ${alert}.`, 'Do not add exemptions. Ask before Save.'],
      verify: ['ATP mode set'], pauseBefore: ['Save Changes'],
      links: [L('Understanding Advanced Threat Protection', 'EGD/pages/2850933')],
    });
    const att = [...arr(a, 'attachTypes'), ...splitList(txt(a, 'attachTypes')).map(x => x.replace(/^\./, ''))];
    pol.push({
      id: 'egd-content', title: 'Attachment & content policies', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: `Password-protected archives, Office files and PDFs: ${describeAnswer(q('pwArchives'), a)}. Quarantine high-risk attachment types: ${att.map(x => '.' + x).join(' ') || 'none'}.`,
      actions: ['Inbound Settings > Content Policies', `Password-protected archive / Microsoft / PDF: ${one(a, 'pwArchives')}`, 'Attachment filters (File Name, Archive Files Content ticked): Quarantine risky extensions'],
      detail: ['Open Email Gateway Defense > Inbound Settings > Content Policies and report existing attachment and content filters.', `Set Password Protected Archive, Microsoft document and PDF handling to ${one(a, 'pwArchives') || 'Quarantine'}.`, `Add attachment filters by File Name with "Archive Files Content" selected and action Quarantine for: ${att.map(x => '*.' + x).join(', ') || '(none)'}. Skip any that already exist.`, 'Show me the list before saving.'],
      verify: ['Filters listed on Content Policies'], pauseBefore: ['Save Changes'],
      links: [L('Attachment Filtering – Inbound', 'EGD/pages/2850904'), L('Content Analysis', 'EGD/pages/2851312')],
    });
    const third = [...arr(a, 'thirdParty'), ...splitList(txt(a, 'thirdParty'))];
    const spfMode = one(a, 'spf');
    pol.push({
      id: 'egd-auth', title: 'Sender authentication & spoof protection', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: `Apply DMARC checks, keep SPF hard-fail ${spfMode === 'relaxed' ? 'on Quarantine' : 'on Block'}, and enable Sender Spoof Protection for your domains${third.length ? `, exempting your third-party senders (${third.join(', ')})` : ''}.`,
      actions: ['Inbound Settings > Sender Authentication', `DMARC: Yes; SPF Hard Fail: ${spfMode === 'relaxed' ? 'Quarantine' : 'Block'}; SPF Soft Fail: ${spfMode === 'strict' ? 'Quarantine' : 'Off'}; DKIM: ${spfMode === 'strict' ? 'Quarantine' : 'Off'}; PTR: Yes`, 'Domains > Edit > Options > Enable Sender Spoof Protection: Yes', third.length ? 'Inbound Settings > Sender Policies: Exempt the third-party services' : 'No third-party exemptions needed'],
      detail: ['Open Email Gateway Defense > Inbound Settings > Sender Authentication and report the current values.', `Set: Apply DMARC checks Yes; SPF Hard Fail ${spfMode === 'relaxed' ? 'Quarantine' : 'Block'}; SPF Soft Fail ${spfMode === 'strict' ? 'Quarantine' : 'Off'}; DKIM ${spfMode === 'strict' ? 'Quarantine' : 'Off'}; Block on No PTR Records Yes. Ask before saving.`, ...(third.length ? [`For each third-party sender (${third.join(', ')}), find the sending domain or published IP range with me. Prefer IP-based exemptions in Inbound Settings > IP Address Policies; otherwise add a Sender Policy with action Exempt (domain, no wildcards).`] : []), `Then for each domain on the Domains tab: Edit > Options > Enable Sender Spoof Protection = Yes. Ask before saving.`],
      verify: ['Send a test from each third-party service and confirm it is delivered'], pauseBefore: ['each Save Changes'],
      links: [L('Sender Authentication', 'EGD/pages/2850945'), L('Sender & Recipient Policies', 'EGD/pages/2850925')],
    });
    if (countries.length || langs.length) pol.push({
      id: 'egd-geo', title: 'Regional policies: countries & languages', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: `${countries.length ? `${one(a, 'geoAction') === 'block' ? 'Block' : 'Quarantine'} email from: ${countries.join(', ')}.` : ''} ${langs.length ? `Quarantine messages in: ${langs.join(', ')}.` : ''} Exempted senders are still scanned for spam and viruses.`,
      actions: ['Inbound Settings > Regional Policies', ...(countries.length ? [`Add countries (ISO alpha-3 in Bulk Edit) → ${one(a, 'geoAction') || 'quarantine'}`] : []), ...(langs.length ? [`Languages → Quarantine: ${langs.join(', ')}`] : []), ...(txt(a, 'geoAction') ? [`GeoIP exemptions: ${txt(a, 'geoAction')}`] : []), 'Review the Message Log after 30 days'],
      detail: ['Open Email Gateway Defense > Inbound Settings > Regional Policies and report existing entries.', ...(countries.length ? [`Add these countries with action ${one(a, 'geoAction') === 'block' ? 'Block' : 'Quarantine'}: ${countries.join(', ')}. For free-text country names, confirm the ISO 3166 alpha-3 code with me.`] : []), ...(langs.length ? [`Set these language/character sets to Quarantine: ${langs.join(', ')}.`] : []), ...(txt(a, 'geoAction') ? [`Add GeoIP Exemptions by Email Address/Domain for: ${txt(a, 'geoAction')}.`] : []), 'Show me the final table and Save only after my approval.'],
      verify: ['Policies saved; check Message Log over the next week for "Regional Policies" hits'], pauseBefore: ['Save Changes'],
      links: [L('Regional Policies', 'EGD/pages/2850952/Regional+Policies')],
    });
    else pol.push({
      id: 'egd-geo', title: 'Review regional (country) policies after 30 days', portal: 'Email Gateway Defense', startUrl: ONE, infoOnly: true,
      summary: 'You chose not to filter by country now. After 30 days, look at the Message Log and dashboard for countries that only ever send you spam — those are good candidates to quarantine under Inbound Settings > Regional Policies.',
      actions: ['Set a reminder for 30 days', 'Message Log: filter blocked/quarantined mail and note source countries', 'Ask us if you want help choosing'], detail: [], verify: [],
      links: [L('Regional Policies', 'EGD/pages/2850952/Regional+Policies')],
    });
    const dg = one(a, 'digest');
    pol.push({
      id: 'egd-quar', title: 'Quarantine notifications', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: dg === 'never' ? 'Users will not receive digests; admins manage the quarantine. Set an admin report so nothing is missed.' : `Send users a ${dg === 'twice' ? 'twice-daily' : dg} quarantine digest (deliver / allow / block links with two-step confirmation). Users sign in at https://${reg.ess}.`,
      actions: ['Users > Quarantine Notification', dg === 'never' ? 'Notification Interval: Never' : `Scheduled: ${dg === 'twice' ? '09:00 and 15:00 on weekdays' : dg === 'weekly' ? 'Monday 09:00' : '09:00 on weekdays'}`, 'Allow users to specify interval: No', `Outbound Settings > Notifications: admin report → ${alert}`],
      detail: ['Confirm users have been synced first (previous section).', `Open Email Gateway Defense > Users > Quarantine Notification. Set Notification Interval to ${dg === 'never' ? 'Never' : `Scheduled and drag-select ${dg === 'twice' ? '09:00 and 15:00 Monday–Friday' : dg === 'weekly' ? 'Monday 09:00' : '09:00 Monday–Friday'}`}. Allow users to specify interval: No. Ask before saving.`, `Open Outbound Settings > Notifications > Admin Quarantine Notification: Scheduled daily, Notification Address ${alert}. Ask before saving.`],
      verify: ['A test user receives a digest at the next scheduled time'], pauseBefore: ['Save Changes'],
      links: [L('Quarantine Notifications', 'EGD/pages/2851176/Quarantine+Notifications')],
    });
    if (dep === 'mx' && one(a, 'continuity') !== 'no') pol.push({
      id: 'egd-continuity', title: 'Email Continuity & spooling', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: 'If Microsoft 365 goes down, Barracuda spools inbound mail and, after 10 minutes, gives users a web mailbox for up to 96 hours. Barracuda recommends enabling it for all users on all domains.',
      actions: ['Domains > each domain > Edit > Options > Spooling: Yes', 'Users > Email Continuity: Auto-Enable'],
      detail: ['For each domain on the Domains tab: Edit > Options > Spooling = Yes. Ask before saving each.', 'Open Users > Email Continuity and set Auto-Enable. Ask before saving.'],
      verify: ['Spooling Yes on every domain; Email Continuity Auto-Enable'], pauseBefore: ['Save Changes'],
      links: [L('Email Continuity', 'EGD/pages/2850972')],
    });
    const dlp = arr(a, 'dlp');
    if (dlp.some(x => x !== 'disableRtf')) pol.push({
      id: 'egd-dlp', title: 'Outbound DLP & encryption', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: `${dlp.includes('encryptKeyword') ? `Encrypt outgoing mail when the subject contains "${txt(a, 'dlp') || '[secure]'}". ` : ''}${dlp.includes('cards') ? 'Quarantine outbound credit card numbers. ' : ''}${dlp.includes('privacy') ? 'Quarantine outbound personal data (US-format Privacy pattern). ' : ''}Validate the domain to brand encryption notifications.`,
      actions: ['Outbound Settings > Content Policies', ...(dlp.includes('encryptKeyword') ? [`Message Content Filter: Subject contains ${txt(a, 'dlp') || '[secure]'} → Encrypt`] : []), ...(dlp.includes('cards') ? ['Predefined Filters: Credit Cards → Quarantine'] : []), ...(dlp.includes('privacy') ? ['Predefined Filters: Privacy → Quarantine'] : []), 'Domains > Edit > Encryption: validate CNAME, add logo (160×65)'],
      detail: ['Open Email Gateway Defense > Outbound Settings > Content Policies and report existing filters.', ...(dlp.includes('encryptKeyword') ? [`Add a Message Content Filter: pattern ${txt(a, 'dlp') || '[secure]'}, match Subject, action Encrypt.`] : []), ...(dlp.includes('cards') ? ['Predefined Filters: Credit Cards → Quarantine.'] : []), ...(dlp.includes('privacy') ? ['Predefined Filters: Privacy → Quarantine.'] : []), 'Ask before saving. Then open Domains > Edit (sending domain) > Encryption and walk me through Validate CNAME.'],
      verify: ['Send a test with the keyword to an external mailbox and confirm it arrives encrypted'], pauseBefore: ['Save Changes', 'DNS changes'],
      links: [L('How to Use DLP and Outbound Mail Encryption', 'EGD/pages/2850879/How+to+Use+DLP+and+Outbound+Mail+Encryption')],
    });
    if (dlp.includes('disableRtf')) pol.push({
      id: 'egd-rtf', title: 'Disable Rich Text Format on outbound mail', portal: 'Exchange admin centre', startUrl: 'https://admin.exchange.microsoft.com/#/remotedomains',
      summary: 'RTF turns attachments into winmail.dat files that Barracuda cannot inspect for DLP. Forcing HTML for external mail fixes this.',
      actions: ['Exchange admin > Mail flow > Remote domains > Default', 'Use rich-text format: Never', 'or PowerShell: Set-RemoteDomain -Identity Default -TNEFEnabled $false'],
      detail: ['Open https://admin.exchange.microsoft.com/#/remotedomains, edit Default, and report the current "Use rich-text format" value.', 'Ask for approval, then set it to Never and save.'],
      verify: ['Default remote domain RTF = Never'], pauseBefore: ['saving'],
      links: [L('Step 8 – Disable RTF', 'EGD/pages/2850836/Step+2+-+Configure+Microsoft+365+for+Inbound+and+Outbound+Mail')],
    });
    if (txt(a, 'trusted')) pol.push({
      id: 'egd-trusted', title: 'Trusted partner IPs & rate-control exemptions', portal: 'Email Gateway Defense', startUrl: ONE,
      summary: `Exempt trusted partner/relay IPs (${txt(a, 'trusted')}) by IP address — more reliable than exempting email addresses. Virus scanning still applies.`,
      actions: ['Inbound Settings > IP Address Policies: Exempt each IP', 'Inbound Settings > Rate Control: add to Rate Control Exemption'],
      detail: [`Open Inbound Settings > IP Address Policies and add Exempt entries for: ${txt(a, 'trusted')} (confirm netmasks with me).`, 'Open Inbound Settings > Rate Control and add the same IPs to Rate Control Exemption. Leave the threshold unchanged. Ask before each save.'],
      verify: ['Entries listed'], pauseBefore: ['Save Changes'],
      links: [L('Inbound Rate Control', 'EGD/pages/2851318'), L('Sender & Recipient Policies', 'EGD/pages/2850925')],
    });
    phases.push({ id: 'bp-egd-policy', title: 'Email Gateway Defense — protection settings', subtitle: `${pol.length} steps · your choices applied`, steps: pol });
  }

  // ── Impersonation Protection ──
  if (has('ip')) {
    const ipm = one(a, 'ipMode');
    const st: ImplStep[] = [];
    if (!has('egd')) st.push({
      id: 'ip-connect', title: 'Connect Impersonation Protection to Microsoft 365', portal: 'BarracudaONE', startUrl: ONE,
      summary: 'Connect your tenant (Global Admin) so Barracuda can learn your communication patterns. Learning takes several hours to several days; Barracuda emails you when protection is live.',
      actions: ['BarracudaONE > Impersonation Protection', 'Connect to Microsoft 365 > Global Admin > Accept', 'Wait for the "ready" email'],
      detail: [`Open ${ONE} and select Impersonation Protection in the left navigation.`, 'Click the connect-to-Microsoft-365 option. STOP at the Microsoft sign-in and consent screens for me.', 'Report the status shown after connecting.'],
      verify: ['Tenant connected; learning in progress'], pauseBefore: ['Microsoft sign-in and consent'],
      links: [L('Impersonation Protection – Getting Started', 'SEN/pages/7798831/Getting+Started')],
    });
    st.push({
      id: 'ip-response', title: 'Set attack responses & alerts', portal: 'Impersonation Protection', startUrl: ONE,
      summary: `Advanced attacks: ${describeAnswer(q('ipMode'), a)}. ${ipm === 'report' ? 'Reporting mode also disables Incident Response automatic remediation — plan a date to switch to Enforcement.' : 'Barracuda recommends starting in Enforcement mode.'} Security team alerts → ${alert}.`,
      actions: ['Settings > Email threats', `Action: ${ipm === 'delete' ? 'Delete' : ipm === 'report' ? 'Leave in inbox' : 'Send to junk/spam'}`, `Alert recipients: ${one(a, 'ipNotify') === 'no' ? 'No' : 'Yes'}`, `Alert security team: ${alert}`, `Settings > Account Takeover: alert ${alert}`],
      detail: ['Open Impersonation Protection > Settings > Email threats and report the current values.', `Set the advanced attack action to "${ipm === 'delete' ? 'Delete' : ipm === 'report' ? 'Leave in inbox' : 'Send to junk/spam'}". Alert recipients: ${one(a, 'ipNotify') === 'no' ? 'No' : 'Yes'}. Alert security team: Yes, address ${alert}. Ask before Save.`, `Open the Account Takeover tab: alert security team Yes, address ${alert}. Ask before Save.`],
      verify: ['No "Reporting Mode" banner (unless you chose it)', 'Alert address set on both tabs'], pauseBefore: ['Save'],
      links: [L('How to Specify Attack Response Options', 'SEN/pages/561906257/How+to+Specify+Attack+Response+Options'), L('Enforcement or Reporting Mode', 'SEN/pages/554304316')],
    });
    if (one(a, 'signature') && one(a, 'signature') !== 'no') st.push({
      id: 'ip-signature', title: 'Exempt your email signature service', portal: 'Impersonation Protection', startUrl: ONE,
      summary: 'Signature services route internal mail out and back. Without an exemption, Impersonation Protection may flag internal email. We will confirm the right method for your service with Barracuda.',
      actions: ['Identify the signature service\'s sending hosts', 'Add to Allowed Senders (shared with Incident Response)', 'Test internal mail after enforcement'],
      detail: ['Open Impersonation Protection settings and locate the Allowed Senders list. Report current entries.', `Help me identify the sending domain/hosts used by our signature service (${one(a, 'signature')}).`, 'Do not add anything until I confirm — we may check with Broad Peak support first.'],
      verify: ['Internal email with signatures is not flagged'], pauseBefore: ['adding entries'],
      links: [L('Impersonation Protection – Getting Started', 'SEN/pages/7798831/Getting+Started')],
    });
    st.push({
      id: 'ip-tune', title: 'Tune weekly for the first month', portal: 'Impersonation Protection', startUrl: ONE, infoOnly: true,
      summary: 'Barracuda\'s best practice: monitor detections, false positives and top senders to set a baseline, tune allow/block lists, then keep a weekly review going. Review Account Takeover alerts and encourage users to report missed attacks.',
      actions: ['Weekly: review detections and false positives', 'Adjust sender/domain allow lists only for proven false positives', 'Review Account Takeover alerts', 'Schedule a weekly report to the security team'], detail: [], verify: [],
      links: [L('Integrated Email Protection Best Practices', 'EBTHREE/pages/616431639/Integrated+Email+Protection+Best+Practices'), L('Account Takeover Alerts', 'SEN/pages/7798948')],
    });
    phases.push({ id: 'bp-ip', title: 'Impersonation Protection', subtitle: `${st.length} steps`, steps: st, note: 'Barracuda needs several hours to several days to learn your environment after connection, and up to 72 hours for new mailboxes.' });
  }

  // ── Incident Response ──
  if (has('ir')) {
    const ar = one(a, 'irAuto');
    const rep = arr(a, 'irReport');
    const st: ImplStep[] = [{
      id: 'ir-auto', title: 'Automatic remediation settings', portal: 'Incident Response', startUrl: ONE,
      summary: ar === 'off' ? 'Automatic remediation will stay off; incidents are created and remediated manually.' : `Automatically remove verified threats from every mailbox (${ar === 'junk' ? 'move to Junk' : 'delete, with 72-hour continuous remediation'}), alert affected users and the security team (${alert})${has('sat') ? ', and ignore Security Awareness Training campaign emails' : ''}.`,
      actions: ['Incident Response > Settings > Automatic Remediation', `Enable: ${ar === 'off' ? 'No' : 'Yes'}`, ...(ar !== 'off' ? [`Default action: ${ar === 'junk' ? 'Move to Junk' : 'Delete'}`, ...(ar === 'delete' ? ['Continuous remediation: on'] : []), ...(has('sat') ? ['Ignore SAT campaign emails: on'] : []), 'Alert recipient: on', `Alert security team: ${alert}`] : [])],
      detail: ['Open Incident Response (Apps menu) > Settings > Automatic Remediation and report the current values.', ar === 'off' ? 'Set Automatic Remediation to No.' : `Enable Automatic Remediation. Default action: ${ar === 'junk' ? 'Move emails to users\' Junk folder' : 'Delete emails from users\' mailboxes'}. ${ar === 'delete' ? 'Enable continuous remediation. ' : ''}${has('sat') ? 'Enable "Ignore Security Awareness Training campaign emails". ' : ''}Send alert to recipient: Yes. Send alert to security team: Yes, ${alert}.`, 'Ask before saving.'],
      verify: ['Settings saved as agreed'], pauseBefore: ['Save'],
      links: [L('Automatic Remediation Settings', 'FIR/pages/1508750/Automatic+Remediation+Settings')],
    }];
    if (rep.length) st.push({
      id: 'ir-report', title: 'User reporting add-in & automated workflows', portal: 'Microsoft 365 admin / Incident Response', startUrl: 'https://admin.microsoft.com/#/Settings/IntegratedApps',
      summary: `${rep.includes('addin') ? 'Deploy the Barracuda Outlook add-in so users can report suspicious email. ' : ''}${rep.some(x => x !== 'addin') ? `Create a workflow that triggers on user reports and notifies the team via ${rep.filter(x => x !== 'addin').join(', ')}.` : ''}`,
      actions: [...(rep.includes('addin') ? ['M365 admin > Settings > Integrated apps: deploy the Barracuda add-in to everyone'] : []), ...(rep.some(x => x !== 'addin') ? ['Incident Response > Automated Workflows: trigger = user report; action = notify'] : [])],
      detail: [...(rep.includes('addin') ? ['Open https://admin.microsoft.com/#/Settings/IntegratedApps. Search for the Barracuda email reporting add-in and show me the deployment options. STOP for my approval before deploying (recommend: Entire organisation).'] : []), ...(rep.some(x => x !== 'addin') ? [`In Incident Response, open Automated Workflows and create a workflow from a template: trigger "user reports an email"; notification via ${rep.filter(x => x !== 'addin').join(' and ')} to ${alert}. Ask before saving.`] : [])],
      verify: ['Report button visible in Outlook for a test user (can take up to 24h)'], pauseBefore: ['deploying the add-in', 'saving the workflow'],
      links: [L('Incident Response documentation', 'FIR/pages/1507498')],
    });
    phases.push({ id: 'bp-ir', title: 'Incident Response', subtitle: `${st.length} steps`, steps: st });
  }

  // ── Domain Fraud Protection ──
  if (has('dfp')) {
    const st: ImplStep[] = [{
      id: 'dfp-1', title: 'Step 1 — Set up DMARC reporting on each domain', portal: 'Domain Fraud Protection', startUrl: ONE,
      summary: 'Check SPF, then publish a reporting-only DMARC record (p=none) supplied by Barracuda. This reports on who is sending as your domain but does not yet protect you.',
      actions: ['BarracudaONE > Domain Fraud Protection', 'Domain marked Not Configured > Set Up DMARC Reporting', 'Check My SPF > Configure DMARC > publish record > Check My DMARC'],
      detail: [`Open ${ONE} > Domain Fraud Protection. List every domain and its status.`, 'For each Not Configured domain: Set Up DMARC Reporting > Check My SPF and report the result.', 'Show me the DMARC record Barracuda gives (v=DMARC1; p=none; …). I will publish it in DNS; then click Check My DMARC and report.'],
      verify: ['Every domain shows Reporting Only'], pauseBefore: ['any DNS change'],
      links: [L('Step 1 – Configuring DMARC on Your Domain', 'BDFP/pages/5242894/Step+1+-+Configuring+DMARC+on+Your+Domain')],
    }, {
      id: 'dfp-2', title: 'Step 2 — Review email sources (after 2–4 weeks)', portal: 'Domain Fraud Protection', startUrl: ONE,
      summary: `Mark each sending source as Approved or Not Approved. Start with high-volume sources; unrecognised high-volume sources should be treated as a risk. ${has('egd') ? 'Barracuda Email Gateway Defense and Microsoft 365 should be Approved.' : ''} Marking is for sorting only — it does not block anything by itself.`,
      actions: ['Domains > Review High Volume Sources', 'Mark as Approved / Not Approved', 'Low-volume: largest first, then Mark All', 'Investigate failing approved sources (SPF/DKIM alignment)'],
      detail: ['Open Domain Fraud Protection > Review High Volume Sources. For each source show me the name, volume and pass rate, and ask me whether to Approve. Do not mark anything without my answer.', 'Then the Unknown tab > Low Volume Sources: summarise and ask me whether to Mark All as Not Approved.', 'For Approved sources failing DMARC, open Investigate and explain the SPF/DKIM issue in plain English.'],
      verify: ['No Unknown high-volume sources', 'All approved sources passing'], pauseBefore: ['marking sources'],
      links: [L('Step 2 – Working with Email Sources', 'BDFP/pages/5242897')],
    }];
    if (one(a, 'dmarc') !== 'report') st.push({
      id: 'dfp-3', title: 'Step 3 — Enforce DMARC', portal: 'Domain Fraud Protection', startUrl: ONE,
      summary: 'When Barracuda has seen enough traffic it shows an Enforce DMARC button. After you publish the new record, email that fails DMARC — spoofed mail using your domain — is rejected by receivers.',
      actions: ['Click Enforce DMARC when it appears', 'Copy DNS Record > update DNS', 'Check DMARC Record', 'Keep monitoring reports for new sources'],
      detail: ['Open Domain Fraud Protection and report which domains show an Enforce DMARC button.', 'For a domain I choose, click Enforce DMARC and Copy DNS Record; show me the record. I will update DNS, then click Check DMARC Record and report.'],
      verify: ['Domain status shows enforcement'], pauseBefore: ['clicking Enforce', 'DNS change'],
      links: [L('Step 3 – Enabling DMARC Enforcement', 'BDFP/pages/5242930/Step+3+-+Enabling+DMARC+Enforcement')],
    });
    phases.push({ id: 'bp-dfp', title: 'Domain Fraud Protection (DMARC)', subtitle: `${st.length} steps · over several weeks`, steps: st });
  }

  // ── Cloud-to-Cloud Backup ──
  if (has('ccb')) {
    const src = arr(a, 'ccbSources');
    const m365 = src.filter(s => s !== 'Entra');
    const ret = one(a, 'ccbRetention');
    const retLabel = ret === 'forever' ? 'Retain data forever' : ret === '3y' ? '3 years' : ret === '7y' ? '7 years' : '1 year (Default retention)';
    phases.push({
      id: 'bp-ccb', title: 'Cloud-to-Cloud Backup', subtitle: '4 steps',
      steps: [{
        id: 'ccb-activate', title: 'Activate Cloud-to-Cloud Backup', portal: 'BarracudaONE', startUrl: ONE,
        summary: 'Activate the subscription from the Cloud-to-Cloud Backup dashboard.',
        actions: ['Apps > Cloud-to-Cloud Backup', 'Dashboard > Products > Activate subscription'],
        detail: [`Open ${ONE} > Apps > Cloud-to-Cloud Backup. On Dashboard > Products report the status. If "Activate subscription" is shown, ask me, then click it.`],
        verify: ['Subscription active'], pauseBefore: ['activating'],
        links: [L('Cloud-to-Cloud Backup – Getting Started', 'BCCB/pages/701661209/Getting+Started')],
      }, ...(ret !== '1y' ? [{
        id: 'ccb-retention', title: `Create a ${retLabel} retention policy`, portal: 'Cloud-to-Cloud Backup', startUrl: ONE,
        summary: 'The built-in Default retention policy is 1 year and cannot be edited, so create your own before connecting sources. Retention applies to backed-up data only; purges are permanent.',
        actions: ['Backup > Retention policies > Create Policy', `Retain all data for: ${retLabel}`],
        detail: ['Open Cloud-to-Cloud Backup > Backup > Retention policies > Create Policy.', `Name "${retLabel} – standard", description "Broad Peak implementation", Retain all data for: ${ret === 'forever' ? 'select Retain data forever' : retLabel}. Ask before Create.`],
        verify: ['Policy listed'], pauseBefore: ['Create'],
        links: [L('How to Configure Retention Policies', 'BCCB/pages/99123208/How+to+Configure+Retention+Policies')],
      } as ImplStep] : []), {
        id: 'ccb-connect', title: 'Connect Microsoft 365 and choose data sources', portal: 'Cloud-to-Cloud Backup', startUrl: ONE,
        summary: `Connect with a Global Admin (only needed for the initial connection; credentials are not stored). Enable: ${src.join(', ')}. Once a data source is enabled it cannot be turned off.`,
        actions: ['Backup > Backup sources > Add source', `Microsoft 365${src.includes('Entra') ? ' + Microsoft Entra ID' : ''}`, `Toggle on: ${m365.join(', ')}`, `Retention: ${retLabel}`, 'Finish'],
        needs: ['Microsoft 365 Global Admin'],
        detail: ['Open Backup > Backup sources > Add source and select Microsoft 365. STOP at the Microsoft sign-in/consent for me.', `Toggle on: ${m365.join(', ')}. Warn me that enabled sources cannot be turned off and wait for my confirmation.`, `Assign retention policy: ${retLabel}. Ask before Finish.`, ...(src.includes('Entra') ? ['Then Add source again for Microsoft Entra ID (ask me whether we have Entra ID P1/P2 → Premium, otherwise Basic). STOP at consent.'] : [])],
        verify: ['Sources listed with the right retention'], pauseBefore: ['Microsoft consent', 'enabling sources', 'Finish'],
        links: [L('How to Connect to Your Microsoft Tenant', 'BCCB/pages/3244070'), L('Data backed up in Microsoft 365', 'BCCB/pages/3244042')],
      }, {
        id: 'ccb-first', title: 'Run and verify the first backup, set alerts', portal: 'Cloud-to-Cloud Backup', startUrl: ONE,
        summary: `Kick off the first backup, check item counts, browse a restore, and send backup alerts to ${alert}.`,
        actions: ['Dashboard > Back up now (per source)', 'Activities: watch for errors', 'Restore: browse a mailbox/site to confirm', `Settings > Email Notifications: ${alert}`],
        detail: ['Open Dashboard and report each data source\'s backup status. Ask before clicking Back up now.', 'Open Activities and report any warnings or errors.', 'Open Restore and browse (do not restore) one mailbox and one site to confirm data is visible.', `Open Settings > Email Notifications and, after my approval, add ${alert}.`],
        verify: ['First backup complete for every source', 'Alerts configured'], pauseBefore: ['Back up now', 'saving notifications'],
        links: [L('Back up and restore', 'BCCB/pages/1005191249')],
      }],
    });
  }

  // ── Data Inspector ──
  if (has('di')) {
    const o = arr(a, 'diOptions');
    phases.push({
      id: 'bp-di', title: 'Data Inspector', subtitle: '2 steps',
      steps: [{
        id: 'di-setup', title: 'Run the Data Inspector setup wizard', portal: 'Data Inspector', startUrl: ONE,
        summary: `Accept the terms, choose your data-storage region (pick the one that meets your data-residency needs — all connections share it) and connect ${o.includes('tenant') ? 'the entire Microsoft 365 tenant (Global Admin)' : 'a single OneDrive'}. Scanning starts straight away.`,
        actions: ['BarracudaONE > Data Inspector', 'Terms & Conditions > Accept', `Region: closest to ${reg.label}`, `Data source: ${o.includes('tenant') ? 'entire tenant' : 'individual OneDrive'}`, 'Complete'],
        detail: [`Open ${ONE} > Data Inspector. If the wizard opens, click Open the Terms and Conditions and tell me to review them; I will click Accept.`, 'Ask me whether to allow product-news data collection (optional).', `Show me the region options and recommend the one matching ${reg.label}. Wait for my choice.`, `Select data source: ${o.includes('tenant') ? 'entire Microsoft 365 tenant' : 'individual OneDrive account'}. STOP at Microsoft sign-in/consent for me. Then Complete.`],
        verify: ['Detections page begins to populate'], pauseBefore: ['accepting terms', 'region', 'Microsoft consent'],
        links: [L('Data Inspector – Getting Started', 'BDI/pages/4325385/Getting+Started')],
      }, {
        id: 'di-config', title: 'Malware scanning, alerts & custom classifiers', portal: 'Data Inspector', startUrl: ONE,
        summary: `${o.includes('malware') ? 'Turn on malware scanning (off by default). ' : ''}${o.includes('adminAlerts') ? `Email alerts to ${alert}. ` : ''}${o.includes('userAlerts') ? 'Notify users who store sensitive data (recommended after a 2-week baseline). ' : ''}${txt(a, 'diOptions') ? `Custom classifiers: ${txt(a, 'diOptions')}.` : ''}`,
        actions: [...(o.includes('malware') ? ['Settings > Manage Tenant > Enable Malware Scanning'] : []), ...(o.includes('adminAlerts') ? [`Email notifications → ${alert}`] : []), ...(o.includes('userAlerts') ? ['User notifications on'] : []), ...(txt(a, 'diOptions') ? ['Add custom classifiers'] : [])],
        detail: [...(o.includes('malware') ? ['Open Settings > Manage Tenant and, after my approval, Enable Malware Scanning.'] : []), ...(o.includes('adminAlerts') ? [`Find the email notification settings and propose alerting ${alert}. Ask before saving.`] : []), ...(o.includes('userAlerts') ? ['Show me the user notification options; do not enable until I confirm.'] : []), ...(txt(a, 'diOptions') ? [`Help me define custom classifiers for: ${txt(a, 'diOptions')}. Ask before saving.`] : [])],
        verify: ['Settings saved'], pauseBefore: ['each save'],
        links: [L('Data Inspector overview', 'BDI/overview')],
      }],
    });
  }

  // ── Cloud Archiving Service ──
  if (has('cas')) {
    const ex = arr(a, 'casExtra');
    const yrs = one(a, 'casRetention');
    const st: ImplStep[] = [{
      id: 'cas-setup', title: 'Activate, connect directory & run the initial setup wizard', portal: 'Cloud Archiving Service', startUrl: ONE,
      summary: 'Activate the subscription, connect directory services (Entra ID) so users can search their own archive, and run the initial setup wizard.',
      actions: ['Step 1 Activate Subscription', 'Step 2 Configure Directory Services', 'Step 3 Launch the Initial Setup Wizard', 'Step 4 Choose your deployment: Microsoft 365 journaling'],
      detail: [`Open ${ONE} > Cloud Archiving Service. Report whether the subscription is active.`, 'Walk me through Configure Directory Services (Entra ID). STOP at any Microsoft consent.', 'Launch the Initial Setup Wizard and show me each page before continuing.'],
      verify: ['Directory connected; wizard complete'], pauseBefore: ['Microsoft consent', 'finishing the wizard'],
      links: [L('Cloud Archiving Service – Getting Started', 'BCAS/pages/4063314/Getting+Started')],
    }, {
      id: 'cas-journal', title: 'Journal Microsoft 365 mail to the archive', portal: 'Cloud Archiving Service / PowerShell', startUrl: ONE,
      summary: `Run Barracuda's Office 365 setup script so Microsoft 365 journals a copy of every message directly to the archive. ${has('egd') ? 'Do NOT relay archive mail through Email Gateway Defense — Barracuda warns it can be blocked by rate limits or scoring.' : ''} One mail organisation maps to one archive account; max message size 150 MB.`,
      actions: ['Mail Sources > SMTP journaling', 'Journaling Setup Scripts > Office 365 Setup Script > Download/Show Script', 'Run in PowerShell (Exchange admin)', ...(dep === 'inline' && has('egd') ? ['Inline deployment: expect duplicate inbound records'] : [])],
      detail: ['Open Cloud Archiving Service > Mail Sources > SMTP journaling.', 'Under Journaling Setup Scripts > Office 365 Setup Script click Show Script and display it to me. Explain what it does line by line. I will run it in PowerShell myself.', 'Afterwards, send a test email and confirm it appears in the archive search.'],
      verify: ['New mail appears in archive search'], pauseBefore: ['running any script'],
      links: [L('How to Journal from Microsoft 365', 'BCAS/pages/4063243/How+to+Journal+to+the+Cloud+Archiving+Service+from+Microsoft+365+Mail+Service')],
    }, {
      id: 'cas-retention', title: `Retention: ${yrs === 'forever' ? 'keep forever' : yrs + ' years'}${ex.includes('holds') ? ' + litigation holds' : ''}`, portal: 'Cloud Archiving Service', startUrl: ONE,
      summary: `Set the Global Retention Policy to ${yrs === 'forever' ? 'Forever' : `${Number(yrs) * 365} days (${yrs} years)`}. Retention policies run daily and deletions are permanent. ${ex.includes('holds') ? 'Enable litigation holds so auditors can freeze messages when needed.' : ''}`,
      actions: ['Policy > Retention', 'Allow automatic message deletion: ' + (yrs === 'forever' ? 'No' : 'Yes'), `Global Retention Policy: ${yrs === 'forever' ? 'Forever' : Number(yrs) * 365 + ' days'}`, ...(ex.includes('holds') ? ['Enable Litigation Holds'] : [])],
      detail: ['Open Policy > Retention and report the current settings.', yrs === 'forever' ? 'Set the Global Retention Policy to Forever.' : `Set Allow automatic message deletion to Yes and Global Retention Policy "For" ${Number(yrs) * 365} days. Warn me deletions are permanent.`, ...(ex.includes('holds') ? ['Find Enable Litigation Holds and turn it on.'] : []), 'Ask before Submit/Save.'],
      verify: ['Retention policy shown as agreed'], pauseBefore: ['Save'],
      links: [L('Retention Policies and Litigation Holds', 'BCAS/pages/4063259')],
    }];
    if (ex.includes('import')) st.push({
      id: 'cas-import', title: 'Import historic Exchange Online mail', portal: 'Cloud Archiving Service', startUrl: ONE,
      summary: 'Pull existing mailbox content into the archive so it is complete from day one.',
      actions: ['Mail Sources > Exchange Online import', 'Authorise and choose mailboxes', 'Monitor progress'],
      detail: ['Find the Exchange Online email import option and show me the configuration. STOP at Microsoft consent.', 'Ask me which mailboxes to include before starting.'],
      verify: ['Import job running'], pauseBefore: ['Microsoft consent', 'starting the import'],
      links: [L('How to Journal from Microsoft 365 (next: Exchange Online Email Import)', 'BCAS/pages/4063243/How+to+Journal+to+the+Cloud+Archiving+Service+from+Microsoft+365+Mail+Service')],
    });
    phases.push({ id: 'bp-cas', title: 'Cloud Archiving Service', subtitle: `${st.length} steps`, steps: st });
  }

  // ── Security Awareness Training ──
  if (has('sat')) {
    phases.push({
      id: 'bp-sat', title: 'Security Awareness Training', subtitle: '3 steps', note: 'Within one business day of purchase the Security Awareness Training Onboarding Team emails you getting-started instructions.',
      steps: [{
        id: 'sat-allow', title: 'Allow-list simulation emails', portal: has('egd') ? 'Email Gateway Defense & Microsoft Defender' : 'Microsoft Defender', startUrl: 'https://security.microsoft.com/advanceddelivery',
        summary: `Simulations come from 3.145.232.16/28. ${has('egd') ? 'Exempt that range in Email Gateway Defense, and ' : ''}add it to Microsoft Defender Advanced Delivery so links are not pre-clicked (which would record false "clicks"). Never allow-list a domain on its own, and keep antivirus scanning in place.`,
        actions: [...(has('egd') ? ['EGD > Inbound Settings > IP Address Policies: Exempt 3.145.232.16/28'] : []), 'Defender > Advanced delivery > Phishing simulation: add the IP range and campaign domains', 'Exempt *.phishline.com from web proxy caching'],
        detail: [...(has('egd') ? ['In Email Gateway Defense > Inbound Settings > IP Address Policies add 3.145.232.16 / 255.255.255.240 as Exempt, comment "Barracuda SAT". Ask before saving.'] : []), 'Open https://security.microsoft.com/advanceddelivery > Phishing simulation tab. Show me the current entries. With my approval, add sending IP 3.145.232.16/28 and the campaign sending domains I give you.'],
        verify: ['Test campaign email arrives in the inbox with links intact'], pauseBefore: ['saving'],
        links: [L('Email Allow List and Best Practices', 'BPL/pages/3375141/Email+Allow+List+and+Best+Practices')],
      }, {
        id: 'sat-admins', title: `Add admins${one(a, 'satSso') === 'yes' ? ' and set up SSO' : ''}`, portal: 'Security Awareness Training', startUrl: ONE,
        summary: `Sign in via BarracudaONE > Security Awareness Training, add the people who will run campaigns${one(a, 'satSso') === 'yes' ? ', and configure single sign-on (Barracuda strongly recommends SSO for all admins)' : ''}. Complete Domain Authorization.`,
        actions: ['BarracudaONE > Security Awareness Training', 'User Management: add campaign admins', 'Domain Authorization', ...(one(a, 'satSso') === 'yes' ? ['Configure SSO'] : [])],
        detail: [`Open ${ONE} > Security Awareness Training. Report what is shown.`, 'Open User Management and list admins. Ask me who to add.', 'Open Domain Authorization and walk me through authorising our domains.', ...(one(a, 'satSso') === 'yes' ? ['Find the SSO settings and show me what is required from Entra ID; do not save until I confirm.'] : [])],
        verify: ['Admins added; domains authorised'], pauseBefore: ['adding admins', 'saving SSO'],
        links: [L('Before You Begin', 'BPL/pages/3378779/Before+You+Begin')],
      }, {
        id: 'sat-campaign', title: `Plan the first campaign (${one(a, 'satCadence') || 'monthly'} cadence)`, portal: 'Security Awareness Training', startUrl: ONE, infoOnly: true,
        summary: `Start with a baseline simulation to everyone, then run simulations ${one(a, 'satCadence') === 'fortnightly' ? 'every two weeks' : one(a, 'satCadence') || 'monthly'} with a short training module for anyone who clicks. Avoid tax-authority or government-agency themes and third-party logos — Barracuda restricts these.`,
        actions: ['Baseline campaign to all users', 'Send test emails to yourself first', 'Auto-enrol clickers in training', `Repeat ${one(a, 'satCadence') || 'monthly'}`], detail: [], verify: [],
        links: [L('Before You Begin', 'BPL/pages/3378779/Before+You+Begin')],
      }],
    });
  }

  // ── SecureEdge ──
  if (has('se')) {
    const use = one(a, 'seUse');
    const risk = one(a, 'seRisk');
    const dials = risk === 'strict' ? 'Security Risk Tolerance Low, Liability Tolerance High, Productivity Focus Medium' : risk === 'open' ? 'Security Risk Tolerance High, Liability Tolerance Low, Productivity Focus Relaxed' : 'Security Risk Tolerance Medium, Liability Tolerance High, Productivity Focus Medium';
    const ai = [...arr(a, 'seAi'), ...splitList(txt(a, 'seAi'))];
    const st: ImplStep[] = [{
      id: 'se-personal', title: 'Start SecureEdge and personalise', portal: 'SecureEdge', startUrl: 'https://se.barracudanetworks.com/',
      summary: 'Run the welcome wizard: pick the reporting-data region (Europe or North America), business type and user count.',
      actions: ['Start now!', `Region: ${['US', 'CA'].includes(reg.id) ? 'North America' : 'Europe'}`, 'Type of business & number of users'],
      detail: ['Open SecureEdge (I will sign in). On the welcome wizard click Start now! and complete Introduction.', `On Personalization choose Region ${['US', 'CA'].includes(reg.id) ? 'North America' : 'Europe'} (ask me to confirm), type of business and number of users (ask me). Submit only after my confirmation.`],
      verify: ['"What should we solve first?" page reached'], pauseBefore: ['Submit'],
      links: [L('SecureEdge Onboarding Wizard', 'SEP/pages/538607617/SecureEdge+Onboarding+Wizard')],
    }];
    if (use !== 'ztna') st.push({
      id: 'se-web', title: 'Web & AI security onboarding', portal: 'SecureEdge', startUrl: 'https://se.barracudanetworks.com/',
      summary: `Connection: ${one(a, 'seConn') === 'agentless' ? 'agentless DNS location' : 'Access Agent on devices'}. Posture: ${dials}. Approved AI tools: ${ai.join(', ') || 'none'}; keep "block unapproved AI" and "block high-risk AI" on.`,
      actions: ['What should we solve first? > Web Security > Start', `Connection type: ${one(a, 'seConn') === 'agentless' ? 'Agentless' : 'Access Agent'}`, `Web security posture: ${dials}`, `AI tools usage: ${ai.join(', ') || 'none'}`, 'AI posture: both boxes ticked'],
      detail: ['Under Web Security click Start.', `Select connection type ${one(a, 'seConn') === 'agentless' ? 'Agentless; add a Location (ask me for name, region; type DNS over HTTPS unless I say otherwise)' : 'Access Agent'}.`, `Set Web security posture: ${dials}. Ask before Save.`, `AI tools usage: select ${ai.join(', ') || '(ask me)'}. Keep "Blocked unapproved AI and guide users to approved tools" and "Block high risk AI tools" ticked. Ask before Save.`, 'Complete Setup location and report when all steps show Done.'],
      verify: ['All onboarding steps show Done'], pauseBefore: ['each Save'],
      links: [L('SecureEdge Onboarding Wizard', 'SEP/pages/538607617/SecureEdge+Onboarding+Wizard')],
    });
    if (use !== 'web') st.push({
      id: 'se-ztna', title: 'ZTNA onboarding', portal: 'SecureEdge', startUrl: 'https://se.barracudanetworks.com/',
      summary: 'Set up the user directory, add your first application (e.g. Microsoft 365), set the device posture policy, enable Advanced Threat Protection and TLS inspection, and deploy the agent.',
      actions: ['ZTNA > Start', 'Directory & authentication (or connect Entra ID later)', 'Add application + device posture policy', 'Enable ATP & TLS inspection', 'Deploy agent'],
      detail: ['Under ZTNA click Start. For the directory, ask me whether to add a pilot user locally or connect Entra ID after onboarding.', 'Add application: ask me which app (suggest Microsoft 365, predefined). Show the device posture options and ask which to enforce.', 'Enable Advanced threat protection and TLS inspection after my approval.', `Set web posture: ${dials}. Deploy agent for the pilot user. Report when all steps show Done.`],
      verify: ['Pilot user can reach the app via the agent'], pauseBefore: ['each Save'],
      links: [L('SecureEdge Onboarding Wizard', 'SEP/pages/538607617/SecureEdge+Onboarding+Wizard')],
    });
    phases.push({ id: 'bp-se', title: 'SecureEdge', subtitle: `${st.length} steps`, steps: st });
  }

  // ── WAF-as-a-Service ──
  if (has('waas')) {
    const o = arr(a, 'wafApps');
    const sites = splitList(txt(a, 'wafApps'));
    phases.push({
      id: 'bp-waas', title: 'WAF-as-a-Service', subtitle: '3 steps',
      steps: [{
        id: 'waas-app', title: 'Add your application', portal: 'WAF-as-a-Service', startUrl: 'https://waas.barracudanetworks.com/',
        summary: `Add the application with every domain users use (${sites.join(', ') || 'e.g. www and non-www'}), point it at your backend over ${o.includes('https') ? 'HTTPS' : 'HTTP'}, and test the connection. If a firewall protects the server, allow the WAF IPs shown.`,
        actions: ['Applications > Add new', 'Name, app group, all DNS domains', `Backend: ${o.includes('https') ? 'HTTPS' : 'HTTP'} + public IP/hostname > Test Connection`, 'Firewall: Get IP Addresses and allow them'],
        detail: ['Open https://waas.barracudanetworks.com/ (I will sign in). Applications > Add new.', `Name the app (ask me). Enter domains: ${sites.join(', ') || '(ask me — include www and non-www)'}. Continue.`, `Backend protocol ${o.includes('https') ? 'HTTPS' : 'HTTP'}; ask me for the backend IP/hostname and port. Test Connection and report.`, 'If it fails because of a firewall, expand the section, click Get IP Addresses and list them for me.'],
        verify: ['Test Connection succeeds'], pauseBefore: ['Add'],
        links: [L('WAF-as-a-Service – Getting Started', 'WAFAAS/pages/3932196/Getting+Started')],
      }, {
        id: 'waas-dns', title: 'Point DNS at the WAF (CNAME)', portal: 'DNS provider', startUrl: 'https://waas.barracudanetworks.com/',
        summary: 'Create a CNAME (app######.prod.cudawaas.com) for every domain — use a CNAME, not an IP, because WAF IPs can change. Delete any existing A record first. HTTPS certificates are issued automatically once DNS points to the WAF.',
        actions: ['Copy the CNAME target', 'DNS: replace A records with CNAME for each domain', 'Wait for "configured" status'],
        detail: ['Show me the CNAME target for the application.', 'List each domain and its current DNS record. I will make the changes; then report when the application shows as configured.'],
        verify: ['Application marked configured; certificate issued'], pauseBefore: ['DNS changes'],
        links: [L('WAF-as-a-Service – Getting Started', 'WAFAAS/pages/3932196/Getting+Started')],
      }, {
        id: 'waas-mode', title: `${o.includes('restrict') ? 'Restrict direct traffic and ' : ''}move to blocking`, portal: 'WAF-as-a-Service', startUrl: 'https://waas.barracudanetworks.com/',
        summary: `${o.includes('restrict') ? 'Restrict your origin server to accept traffic only from the WAF so attackers cannot bypass it. ' : ''}${one(a, 'wafMode') === 'now' ? 'Switch to blocking mode now.' : one(a, 'wafMode') === 'monitor' ? 'Stay in monitoring mode for now and review logs weekly.' : 'Review logs for 1–2 weeks of monitoring, then switch to blocking.'} Subscribe to the Barracuda status page.`,
        actions: [...(o.includes('restrict') ? ['Restricting Direct Traffic: allow only WAF IPs on the origin'] : []), 'Review logs for false positives', one(a, 'wafMode') === 'monitor' ? 'Stay in monitoring' : 'Switch mode to blocking', 'barracuda.statuspage.io: Subscribe to Updates'],
        detail: ['Open the application and report the current mode and the last 7 days of detected attacks.', ...(o.includes('restrict') ? ['Show me the Restricting Direct Traffic IP list so I can apply it on the origin firewall.'] : []), one(a, 'wafMode') === 'monitor' ? 'Do not change mode.' : 'Ask me before switching the mode to blocking.'],
        verify: ['Mode as agreed; origin accepts only WAF traffic'], pauseBefore: ['changing mode'],
        links: [L('WAF-as-a-Service – Getting Started', 'WAFAAS/pages/3932196/Getting+Started')],
      }],
    });
  }

  // ── XDR ──
  if (has('xdr')) {
    const sc = arr(a, 'xdrScope');
    phases.push({
      id: 'bp-xdr', title: 'Managed XDR', subtitle: '2 steps', note: 'Managed XDR accounts are created by your partner. Broad Peak will set up your account and SentinelOne site (if you have Managed Endpoint) and send your dashboard login.',
      steps: [{
        id: 'xdr-account', title: 'Agree the escalation call list with Broad Peak', portal: 'Barracuda XDR Dashboard', startUrl: 'https://xdr.barracudanetworks.com/react-login', infoOnly: true,
        summary: `The SOC calls these people, in order, when it finds something serious. ${txt(a, 'xdrScope') ? `You told us: ${txt(a, 'xdrScope')}.` : 'Have at least two contacts with out-of-hours phone numbers.'}`,
        actions: ['Send us 2–3 escalation contacts (name, role, phone, hours)', 'Receive your XDR dashboard login', 'Review the Exclusions page with us'], detail: [], verify: [],
        links: [L('Setting up new customer accounts', 'SKOUT/pages/997294082/Setting+up+new+customer+accounts')],
      }, {
        id: 'xdr-integrations', title: 'Connect data sources', portal: 'Barracuda XDR Dashboard', startUrl: 'https://xdr.barracudanetworks.com/react-login',
        summary: `Connect: ${sc.map(x => ({ cloud: 'Microsoft 365 & Entra ID', email: 'Barracuda email security', endpoint: 'Managed Endpoint agents', firewall: 'firewall/network' } as Record<string, string>)[x] || x).join(', ')}.`,
        actions: ['XDR Dashboard > Interoperability Catalog', ...sc.map(x => ({ cloud: 'Securing the Cloud: connect Microsoft 365', email: 'Integrate Impersonation Protection, Incident Response' + (has('egd') ? ' and Email Gateway Defense' : ''), endpoint: 'Setting up Endpoint Protection for Devices', firewall: 'Connect firewall log source' } as Record<string, string>)[x] || x)],
        detail: ['Open https://xdr.barracudanetworks.com/react-login (I will sign in). Open the Interoperability Catalog and list what is already connected.', `For each of ${sc.join(', ')}, open the integration page and show me what is required. STOP at any Microsoft consent and ask before saving anything.`],
        verify: ['Each integration shows as connected'], pauseBefore: ['Microsoft consent', 'saving integrations'],
        links: [L('Integrated Email Protection Best Practices – XDR', 'EBTHREE/pages/616431639/Integrated+Email+Protection+Best+Practices')],
      }],
    });
  }

  // ── Verify & go live ──
  phases.push({
    id: 'bp-golive', title: 'Verify & go live', subtitle: 'Confirm everything is working',
    steps: [{
      id: 'bp-verify', title: 'End-to-end checks and handover', portal: 'BarracudaONE', startUrl: ONE,
      summary: 'Confirm mail is flowing through Barracuda, policies are being applied, alerts reach your team and backups have completed. Record the settings for your runbook.',
      actions: [...(email ? ['Send external → internal and internal → external test mails; check Message Log'] : []), ...(has('egd') ? ['Confirm quarantine digest arrives; check Dashboard for blocked threats'] : []), ...(has('ccb') ? ['Confirm first backup complete'] : []), 'Save the AI Summary Reports from each step as your runbook'],
      detail: [`Open ${ONE}. For each product in scope (${b.products.map(p => BARRACUDA_PRODUCTS.find(x => x.id === p)?.name).join(', ')}), open its dashboard and report status, recent activity and any warnings.`, ...(has('egd') ? ['In Email Gateway Defense > Message Log report the last 20 inbound and outbound messages with their action/reason.'] : []), 'Do not change anything — report only.'],
      verify: ['All products healthy; no unexplained errors'],
      links: [L('Email Protection plans overview', 'EBTHREE/overview')],
    }],
  });
  return phases;
}

function q(id: string): CfgQuestion { return CFG_QUESTIONS.find(x => x.id === id)!; }

// ── CoWork prompt ───────────────────────────────────────────────
export function buildBarracudaPrompt(step: ImplStep, ctx: { accountName: string; phase: ImplPhase; stepNo: number; total: number; next?: ImplStep; basics: BarracudaBasics; answers: Answers }): string {
  const b = ctx.basics;
  const reg = EGD_REGIONS.find(r => r.id === b.region) || EGD_REGIONS[0];
  const lines: string[] = [];
  lines.push(`You are Claude, operating my Chrome browser (Claude CoWork) to complete ONE step of a Barracuda implementation for ${ctx.accountName}.`);
  lines.push('');
  lines.push(`## This step (${ctx.stepNo} of ${ctx.total}): ${step.title}`);
  lines.push(`Section: ${ctx.phase.title}`);
  lines.push(`Where: ${step.portal} — start at ${step.startUrl}`);
  lines.push('');
  lines.push('## Context');
  lines.push(`- Barracuda products in scope: ${b.products.map(p => BARRACUDA_PRODUCTS.find(x => x.id === p)?.name).join(', ')}`);
  lines.push(`- Plan: ${BARRACUDA_PLANS.find(p => p.id === b.plan)?.name || 'Individual products'}`);
  if (b.products.includes('egd')) lines.push(`- Email Gateway Defense region: ${reg.label} (inbound IP range ${reg.inbound}; SPF ${reg.spf}); deployment: ${resolveDeployment(b) === 'mx' ? 'MX records' : 'Inline'}`);
  lines.push(`- Mail platform: Microsoft 365 (cloud). Email domains: ${splitList(b.domains).join(', ') || 'ask me'}`);
  lines.push(`- Security alert address: ${b.alertEmail || 'ask me'}`);
  lines.push(`- Goal of this step: ${step.summary}`);
  if (step.needs?.length) lines.push(`- Prerequisites: ${step.needs.join('; ')}`);
  lines.push(`- Official Barracuda Campus guidance (open it if the screen differs): ${step.links.map(l => l.url).join(' , ')}`);
  lines.push('');
  lines.push('## Ground rules');
  lines.push('- I am signed in to the relevant admin portals. If any sign-in, MFA, consent or password prompt appears, STOP and ask me to complete it. Never type, store or repeat passwords, secrets, tokens or keys.');
  lines.push('- Before changing anything, report the CURRENT value of every setting you will touch so we have a record to roll back to.');
  lines.push('- Only do what this step describes. Do not change other settings, delete anything, or move on to the next step.');
  if (step.pauseBefore?.length) lines.push(`- Pause and get my explicit confirmation before: ${step.pauseBefore.join('; ')}.`);
  lines.push('- Barracuda menus change over time. If the UI does not match, describe what you see and check the Campus link before improvising.');
  lines.push('');
  lines.push('## Instructions');
  step.detail.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
  lines.push('');
  lines.push('## Check before finishing');
  step.verify.forEach(v => lines.push(`- ${v}`));
  lines.push('');
  lines.push('## Summary Report');
  lines.push('When done, give me a structured report I can save:');
  lines.push('- Every setting changed (page, setting, old value → new value). Never include secrets.');
  lines.push('- Anything you could not complete and why.');
  lines.push('- Warnings: permissions granted, mail-flow or DNS changes, or settings that may affect users.');
  lines.push(ctx.next ? `- Confirm I am ready for the next step: "${ctx.next.title}".` : '- Confirm the Barracuda implementation is complete and list recommended follow-ups.');
  return lines.join('\n');
}
