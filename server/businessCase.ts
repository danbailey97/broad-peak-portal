import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
  TableBorders, convertInchesToTwip, UnderlineType,
} from 'docx';

// ─── Per-category rich content ───────────────────────────────────────────────
const CATEGORY_CONTENT: Record<string, {
  tagline: string;
  executiveSummary: string;
  threatLandscape: string[];
  whyNow: string;
  solution: string;
  vendors: { name: string; description: string }[];
  benefits: string[];
  risks: string[];
  roi: string;
  recommendation: string;
}> = {
  'Email Protection': {
    tagline: 'Defend against phishing, BEC, and advanced email-borne threats',
    executiveSummary: 'Email remains the single largest attack surface for organisations of all sizes. Business Email Compromise (BEC) and phishing attacks cost global businesses over $3 billion in 2025 alone, with the average phishing-initiated breach costing $4.88 million. Investing in advanced email security is no longer optional — it is a foundational control that directly reduces financial, operational, and reputational risk.',
    threatLandscape: [
      '$3B+ in BEC losses recorded by FBI IC3 in 2025 — a 26% year-on-year increase',
      'Phishing-initiated breaches cost organisations an average of $4.88M (IBM Cost of a Data Breach 2025)',
      '58% of financially motivated attacks are BEC-related (Verizon DBIR 2025)',
      'AI-generated spear-phishing now bypasses traditional signature-based filters at scale',
      'Supply chain email attacks increased 162% in 2024–25 (Abnormal Security)',
    ],
    whyNow: 'Threat actors are leveraging generative AI to craft convincing, personalised phishing at unprecedented scale. Legacy email filtering based on signatures and reputation alone is no longer sufficient. Regulatory frameworks including GDPR, NIS2, and the UK Cyber Essentials Plus scheme now explicitly require multi-layered email controls. Failure to act exposes the organisation to both financial loss and regulatory sanction.',
    solution: 'A modern email security platform provides multi-layer protection across inbound filtering, link-time URL detonation, attachment sandboxing, impersonation detection, and post-delivery remediation. Barracuda Email Security Gateway and Barracuda Email Protection provide AI-driven threat detection that analyses content, sender behaviour, and communication patterns — catching the attacks that bypass Microsoft 365 and Google Workspace native controls. Boxphish delivers the human firewall layer through continuous phishing simulation and targeted micro-training.',
    vendors: [
      { name: 'Barracuda Email Security', description: 'AI-powered email gateway with inbound filtering, outbound DLP, link protection, and post-delivery remediation integrated directly with M365/Google Workspace.' },
      { name: 'Boxphish', description: 'Phishing simulation and security awareness platform with auto-enrolment, bite-sized video training, and detailed click-rate analytics.' },
    ],
    benefits: [
      'Reduction in successful phishing and BEC attempts reaching users',
      'Automated post-delivery remediation removes threats already in inboxes',
      'Simulated phishing measurably reduces employee click rates by up to 86%',
      'Consolidated reporting dashboard for security and compliance teams',
      'Supports Cyber Essentials and Cyber Essentials Plus certification requirements',
    ],
    risks: [
      'Without investment: continued exposure to costly BEC and credential-theft attacks',
      'Regulatory non-compliance risk under GDPR, NIS2, and UK Cyber Essentials mandates',
      'Reputational damage and customer churn following a publicised email breach',
      'Average dwell time before detection remains 6+ months without advanced email monitoring',
    ],
    roi: 'With an average phishing-initiated breach costing $4.88M and advanced email security typically priced between £3–£8 per user per month, organisations achieve measurable ROI from prevention of a single incident. Phishing simulation training demonstrably reduces click rates by up to 86%, directly reducing the probability of a successful attack.',
    recommendation: 'Broad Peak Cyber recommends a phased deployment: (1) deploy gateway-level filtering and integration with M365/Google Workspace; (2) enable sandboxing and link-time URL detonation; (3) launch phishing simulation and awareness training with automated enrolment triggered by click events.',
  },
  'Data Protection': {
    tagline: 'Backup, recovery, and data resilience across cloud and on-prem environments',
    executiveSummary: 'Data loss — whether through ransomware, accidental deletion, or platform outage — carries an average cost of $4.44 million per incident. Microsoft 365, Google Workspace, and Salesforce operate on a shared responsibility model: they protect platform availability but not your data. Without independent backup, organisations have no recovery option when data is deleted, corrupted, or encrypted by ransomware.',
    threatLandscape: [
      'Global average data breach cost: $4.44M (IBM 2025)',
      'Customer PII was compromised in 53% of all breaches in 2025',
      'U.S. breach costs reached $10.22M — the highest globally',
      '76% of organisations took over 100 days to fully recover from a data breach',
      'Microsoft 365 data is protected by Microsoft for 30–90 days only — after that, it is permanently deleted',
    ],
    whyNow: 'The rise of ransomware-as-a-service has made data destruction a predictable business risk, not an edge case. Regulatory frameworks including GDPR require demonstrable ability to restore personal data after an incident. NIS2, Cyber Essentials Plus, and ISO 27001 all mandate documented backup and recovery procedures. Cloud platform SLAs explicitly exclude responsibility for user-generated data loss.',
    solution: 'Comprehensive data protection requires independent backup across SaaS platforms (M365, Google Workspace, Salesforce), endpoint, and cloud workloads. Keepit provides immutable, cloud-to-cloud backup with vendor-independent storage that cannot be impacted by ransomware affecting your primary tenant. Druva delivers endpoint backup and cloud workload protection with a single-pane management console. Barracuda Cloud-to-Cloud Backup (CCB) provides rapid restore of M365 mailboxes, OneDrive, SharePoint, and Teams data.',
    vendors: [
      { name: 'Keepit', description: 'Immutable, vendor-independent cloud backup for M365, Google Workspace, Salesforce, and more — stored in Keepit\'s own infrastructure, not your cloud tenant.' },
      { name: 'Druva', description: 'SaaS data protection across endpoints, M365, and cloud workloads with AI-driven anomaly detection and ransomware recovery capabilities.' },
      { name: 'Barracuda CCB', description: 'Cloud-to-Cloud Backup for M365 data including Exchange, SharePoint, OneDrive, and Teams with granular restore and compliance hold.' },
    ],
    benefits: [
      'Guaranteed recovery point and time objectives for business-critical data',
      'Immutable backup storage protects against ransomware-driven backup deletion',
      'Regulatory compliance evidence for GDPR Article 32 and NIS2 backup mandates',
      'Granular restore at item, folder, mailbox, or site level',
      'Automated daily backups requiring no manual intervention',
    ],
    risks: [
      'Without backup: permanent data loss following ransomware or accidental deletion',
      'GDPR enforcement action for failure to demonstrate data restoration capability',
      'Extended downtime and productivity loss during unassisted recovery attempts',
      'Financial exposure from ransom payment as the only alternative to data loss',
    ],
    roi: 'The cost of comprehensive SaaS backup (typically £2–£6 per user per month) is negligible compared to the average $4.44M breach cost or the productivity and legal costs of unrecoverable data loss. Organisations with backup capability recover 47% faster from incidents and avoid ransom payments that average $1M.',
    recommendation: 'Broad Peak Cyber recommends beginning with M365 backup as the highest-risk, most common data loss scenario, then extending to endpoint and cloud workload protection. A quarterly restore test should be mandated to verify recoverability.',
  },
  'Network Protection': {
    tagline: 'Secure your network perimeter, remote access, and cloud connectivity',
    executiveSummary: 'Vulnerability exploitation has overtaken phishing as the leading initial access vector, growing 34% year-on-year. Attackers are systematically scanning for and exploiting edge devices, VPNs, and misconfigured firewalls. A modern hybrid mesh firewall strategy — spanning on-premises, cloud, and remote access — is now essential to maintaining a defensible network perimeter.',
    threatLandscape: [
      'Vulnerability exploitation grew 34% YoY and is now the #1 initial access vector (Verizon DBIR 2025)',
      'Exploitation of edge devices and VPNs surged 8x to 22% of all incidents',
      'Nation-state actors used vulnerability exploitation in 70% of breaches',
      'Only 54% of network vulnerabilities are fully remediated within 90 days',
      'Gartner classifies firewall as "Hybrid Mesh Firewall" — reflecting cloud-delivered, multi-site requirements',
    ],
    whyNow: 'The shift to hybrid working has expanded the network perimeter to include home offices, cloud environments, and branch sites that legacy firewalls were never designed to protect. Gartner\'s Hybrid Mesh Firewall framework requires SD-WAN integration, cloud-delivered security, and centralised policy management — capabilities unavailable in traditional on-premises appliances.',
    solution: 'Barracuda CloudGen Firewall provides a unified security platform spanning on-premises, cloud, and remote access with integrated SD-WAN, IPS/IDS, and application control. WatchGuard Firebox extends this to branch and mid-market environments with a consistent policy framework and deep packet inspection.',
    vendors: [
      { name: 'Barracuda CloudGen Firewall', description: 'Next-generation firewall with SD-WAN, IPS, application control, and cloud-delivered threat intelligence — available as hardware, virtual, or cloud-delivered.' },
      { name: 'WatchGuard Firebox', description: 'Unified threat management appliance with layered security services including Gateway AV, APT Blocker, and DNSWatch for DNS-layer filtering.' },
    ],
    benefits: [
      'Centralised policy management across all sites and cloud environments',
      'Integrated SD-WAN reduces WAN costs while maintaining security posture',
      'Deep packet inspection and application control over all traffic',
      'Real-time threat intelligence from global sensor networks',
      'Compliance-ready logging and reporting for NIS2 and ISO 27001',
    ],
    risks: [
      'Continued exposure through unpatched edge devices and VPN vulnerabilities',
      'Inability to enforce consistent security policy across hybrid and remote environments',
      'Regulatory non-compliance with NIS2 network security mandates',
      'Lateral movement risk if attackers breach an inadequately segmented network',
    ],
    roi: 'The average breach involving network exploitation costs $4.44M. Modern firewall licensing typically costs £10–£30 per user per year. Segmentation and firewall controls demonstrably reduce breach impact and dwell time, with organisations with mature network security experiencing 40% lower breach costs.',
    recommendation: 'Broad Peak Cyber recommends a network security assessment to identify current perimeter exposure, followed by a phased firewall refresh aligned to the Gartner Hybrid Mesh Firewall model — prioritising remote access, internet edge, and cloud connectivity.',
  },
  'Application Protection': {
    tagline: 'Protect web applications, APIs, and identity from exploitation',
    executiveSummary: 'Web applications and APIs are the primary breach surface for external attackers. OWASP\'s 2025 Top 10 refresh confirms that broken access control and API security failures dominate real-world incidents. Multi-factor authentication and web application firewalls are now baseline requirements for any organisation with internet-facing applications.',
    threatLandscape: [
      'Broken Access Control is the #1 risk for the 22nd consecutive year (OWASP Top 10:2025)',
      '100% of tested applications showed some form of security misconfiguration',
      'Supply Chain Failures debuted at #3 with 5.19% incidence rate',
      'API attacks grew 681% in 2024–25 (Salt Security)',
      'MFA bypass techniques are now standard in commodity attack toolkits',
    ],
    whyNow: 'Remote and hybrid work has made identity the new perimeter. Traditional VPN-based access control is insufficient when users access SaaS applications from unmanaged devices on untrusted networks. Gartner\'s WAAP Market Guide confirms renewed enterprise demand for web application and API protection since late 2024.',
    solution: 'WatchGuard AuthPoint provides MFA with risk-based authentication, device DNA verification, and cloud-delivered identity management. WatchGuard EDR provides endpoint detection and response with AI-driven threat hunting to stop attacks that bypass perimeter defences.',
    vendors: [
      { name: 'WatchGuard AuthPoint', description: 'Cloud-based MFA with push notifications, QR codes, and TOTP — with risk-based policies and device DNA to block cloned credentials.' },
      { name: 'WatchGuard EDR', description: 'AI-powered endpoint detection and response with automated remediation, threat hunting, and zero-trust application service.' },
    ],
    benefits: [
      'MFA reduces account takeover risk by over 99% for covered accounts',
      'Risk-based authentication policies adapt to anomalous access patterns',
      'Endpoint behavioural monitoring detects fileless and living-off-the-land attacks',
      'Automated response and rollback reduces attacker dwell time',
      'Supports Cyber Essentials requirement for MFA on administrative accounts',
    ],
    risks: [
      'Without MFA: exposed to credential-stuffing and phishing-based account takeover',
      'Endpoint compromise enables lateral movement, data exfiltration, and ransomware',
      'Regulatory non-compliance with Cyber Essentials and NIS2 access control requirements',
      'API and web application vulnerabilities exploitable without WAF coverage',
    ],
    roi: 'MFA is estimated to block 99.9% of automated credential attacks (Microsoft). WatchGuard AuthPoint deployment cost is typically £5–£10 per user per month — a fraction of the $4.44M average breach cost.',
    recommendation: 'Broad Peak Cyber recommends prioritising MFA deployment for all administrative and remote-access accounts as an immediate action, followed by EDR deployment across endpoints and a web application security review.',
  },
  'MDR/SOC': {
    tagline: '24/7 threat detection, investigation, and response from a dedicated security operations team',
    executiveSummary: 'Building and operating an in-house 24/7 Security Operations Centre is beyond the resource capacity of most organisations. Managed Detection and Response (MDR) delivers continuous monitoring, threat hunting, and incident response capability at a fraction of the cost. Gartner forecasts double-digit MDR market growth through 2028, reflecting mainstream adoption as the de facto SOC model for mid-market organisations.',
    threatLandscape: [
      'MDR market projected at $2.15B with 20% CAGR through 2028',
      '88% of organisations experienced security consequences from cyber skills shortages (ISC2 2025)',
      '600+ providers now offer MDR globally — selection quality matters',
      'Average attacker dwell time before detection: 194 days without continuous monitoring',
      'By 2028, 50% of MDR findings will include exposure context (Gartner)',
    ],
    whyNow: 'The cybersecurity skills shortage shows no sign of abating. ISC2\'s 2025 study confirms 88% of organisations face consequences from security staffing gaps. Hiring, training, and retaining a dedicated SOC team typically costs £500K–£1M per year before tooling. MDR delivers equivalent — often superior — capability at a predictable monthly cost.',
    solution: 'Arctic Wolf Managed Detection and Response provides 24/7 SOC-as-a-service with a dedicated Concierge Security Team (CST) that understands your environment. Arctic Wolf continuously ingests telemetry from endpoints, network, cloud, and identity sources, hunting for threats that bypass automated controls. WatchGuard MDR extends this to WatchGuard-protected environments with deep device-level telemetry.',
    vendors: [
      { name: 'Arctic Wolf', description: 'Market-leading MDR with a dedicated Concierge Security Team, 24/7 monitoring across endpoint, network, cloud, and identity, and monthly reporting.' },
      { name: 'WatchGuard MDR', description: 'MDR service integrated with WatchGuard security products, providing SOC monitoring, threat hunting, and incident response for WatchGuard-protected environments.' },
    ],
    benefits: [
      '24/7 monitoring without in-house staffing cost — typically 5–10x cheaper than an internal SOC',
      'Dedicated security analysts who understand your specific environment',
      'Threat intelligence enrichment from millions of telemetry sources globally',
      'Regulatory compliance evidence with monthly security reports',
      'Incident response capability included — no separate IR retainer required',
    ],
    risks: [
      'Without MDR: attackers operate undetected for an average of 194 days',
      'In-house monitoring is typically limited to business hours — leaving nights and weekends uncovered',
      'Skills shortage makes hiring qualified SOC analysts increasingly difficult and expensive',
      'Regulatory expectation of continuous security monitoring growing under NIS2',
    ],
    roi: 'Arctic Wolf MDR typically costs £15–£35 per user per month. An equivalent in-house SOC (3 analysts, tooling, training) costs £500K–£1M annually. MDR also reduces mean time to detect and respond, directly limiting breach cost and scope.',
    recommendation: 'Broad Peak Cyber recommends a 30-day proof-of-value with Arctic Wolf, connecting your M365/Entra ID environment first, then expanding to endpoint and network telemetry. A dedicated Concierge Security Team kick-off will be arranged within 48 hours of onboarding.',
  },
  'Penetration Testing': {
    tagline: 'Identify and remediate exploitable vulnerabilities before attackers do',
    executiveSummary: 'Penetration testing delivers among the highest security ROI of any investment — testing your defences before attackers do at a fraction of the cost of a breach. Gartner\'s 2025 Adversarial Exposure Validation Market Guide formalises continuous penetration testing and red team exercises as a recognised security category, reflecting maturation from an annual compliance checkbox to an ongoing risk management discipline.',
    threatLandscape: [
      'Average breach cost of $4.44M vs. penetration test cost of £5K–£50K = potential 100:1 ROI',
      'Only 48% of vulnerabilities identified in pen tests are ever fully remediated',
      'Organisations using regular security testing save an average of $2M+ per breach',
      'Gartner AEV Market Guide 2025 formalises continuous validation as a strategic category',
      'Cyber Essentials Plus mandates internal and external vulnerability assessment',
    ],
    whyNow: 'Cyber Essentials Plus — increasingly required in UK government and critical infrastructure supply chains — mandates regular external and internal vulnerability assessment. NIS2 requires demonstrable security testing capability. Beyond compliance, the shift to hybrid working has introduced new attack surfaces (VPNs, home networks, SaaS applications) that were absent from historic pen test scopes.',
    solution: 'CyberSmart Cyber Essentials and Cyber Essentials Plus provides automated and assisted assessment aligned to the NCSC\'s five technical controls — firewall, secure configuration, access control, malware protection, and patch management. This serves as a foundation for broader penetration testing scope and provides the certification required for UK government supply chain qualification.',
    vendors: [
      { name: 'CyberSmart CE/CE+', description: 'Automated Cyber Essentials and Cyber Essentials Plus assessment with continuous monitoring, guided remediation, and NCSC-accredited certification.' },
    ],
    benefits: [
      'NCSC-accredited Cyber Essentials and Cyber Essentials Plus certification',
      'Continuous monitoring identifies new vulnerabilities between formal assessments',
      'Supply chain and government contract qualification',
      'Board-ready reporting with risk-prioritised remediation recommendations',
      'Cyber insurance premium reductions typically 10–25% upon CE+ certification',
    ],
    risks: [
      'Without testing: unknown vulnerabilities exploited with no prior warning',
      'Supply chain disqualification if CE/CE+ certification is not maintained',
      'Regulatory exposure under NIS2 without evidence of security validation',
      'Insurance coverage gaps or premium increases without security certification',
    ],
    roi: 'Cyber Essentials certification unlocks UK government supply chain opportunities worth potentially millions in annual contract value. Cyber insurance premium reductions of 10–25% provide immediate ROI. Prevention of a single incident at the $4.44M average breach cost returns the pen test investment many times over.',
    recommendation: 'Broad Peak Cyber recommends beginning with Cyber Essentials certification as an immediate deliverable, providing a defensible baseline and compliance evidence, before scoping a broader penetration test programme aligned to your highest-risk systems.',
  },
  'Security Awareness': {
    tagline: 'Build a human firewall through simulated phishing and targeted training',
    executiveSummary: 'The human element is involved in approximately 60% of all security breaches. Sustained security awareness training combined with regular phishing simulation is the most cost-effective intervention available to reduce the probability of a successful social-engineering attack. Organisations that implement continuous training programmes reduce phishing click rates by up to 86%.',
    threatLandscape: [
      'Human element involved in ~60% of breaches (Verizon DBIR 2025)',
      'Untrained employees are 8.8x more likely to click phishing emails (Boxphish 2025)',
      'Sustained training reduces phishing click rates by up to 86% (KnowBe4)',
      '85% reduction in simulated-phishing click rates achieved after 12 months of continuous training',
      'AI-generated spear-phishing has rendered one-time annual training obsolete',
    ],
    whyNow: 'Generative AI has lowered the bar for highly personalised, convincing phishing attacks. Attackers no longer need language skills or insider knowledge to craft credible impersonation emails. Annual training modules are demonstrably insufficient — behavioural research shows that continuous micro-learning and just-in-time training triggered by simulated failures is the only evidence-based model for sustained behaviour change.',
    solution: 'Boxphish delivers a fully automated phishing simulation and training platform with auto-enrolment — users who click simulated phishing links are immediately enrolled in relevant, bite-sized training content. The platform provides detailed analytics, department-level benchmarking, and board-level reporting on organisational risk posture over time.',
    vendors: [
      { name: 'Boxphish', description: 'Automated phishing simulation platform with AI-generated attack scenarios, just-in-time micro-training, and analytics dashboard for board reporting.' },
    ],
    benefits: [
      'Measurable reduction in phishing click rates within 90 days of deployment',
      'Automated enrolment — no IT or HR administration required',
      'Bite-sized video training that employees actually complete',
      'Department and individual risk scoring for targeted intervention',
      'Board-ready reporting showing risk reduction over time',
    ],
    risks: [
      'Without training: employees remain the most accessible entry point for attackers',
      'AI-generated phishing will increasingly bypass technical controls, making the human layer critical',
      'Regulatory expectation of security awareness training under NIS2 and GDPR',
      'Reputational and financial damage from BEC and credential-theft attacks succeeding through employee error',
    ],
    roi: 'Boxphish is typically priced at £3–£8 per user per month. With an 86% reduction in click rates, the probability and cost of a successful phishing attack is dramatically reduced. The IBM 2025 report confirms that organisations with mature security awareness programmes experience significantly lower breach costs.',
    recommendation: 'Broad Peak Cyber recommends a 30-day pilot running simulated phishing campaigns across a representative employee sample, establishing a baseline click rate before deploying the full training programme company-wide.',
  },
  'GRC': {
    tagline: 'Structured governance, risk management, and compliance across your regulatory obligations',
    executiveSummary: 'Overlapping regulatory frameworks — GDPR, NIS2, DORA, ISO 27001, SOC 2 — place growing compliance obligations on organisations. Manual, spreadsheet-based GRC processes are no longer viable for auditable, board-level governance. Gartner\'s 2025 Magic Quadrant for GRC Tools confirms the market has matured into a platform discipline with clear leaders delivering automation, evidence collection, and framework mapping.',
    threatLandscape: [
      'Gartner published first Magic Quadrant for GRC Tools in October 2025 — confirming market maturity',
      '88% of organisations experienced security consequences from skills gaps (ISC2 2025)',
      'NIS2 Directive enforcement began October 2024 — affecting thousands of UK/EU organisations',
      'DORA (Digital Operational Resilience Act) applies to financial sector entities from January 2025',
      'Share of organisations with "right level" of cybersecurity staffing reached record high of 34%',
    ],
    whyNow: 'NIS2 enforcement creates direct board-level accountability for cybersecurity risk management, with sanctions of up to €10M or 2% of global turnover. DORA imposes operational resilience requirements on financial sector suppliers. ISO 27001 is increasingly required in enterprise and public sector procurement. Manual compliance management at this scale is not sustainable.',
    solution: 'CyberSmart Active Protect provides continuous compliance monitoring aligned to Cyber Essentials, ISO 27001, and industry frameworks — with automated evidence collection and board-ready dashboards. Arctic Wolf Managed Risk delivers continuous attack surface management and vulnerability prioritisation with compliance reporting aligned to NIST CSF and ISO 27001.',
    vendors: [
      { name: 'CyberSmart Active Protect', description: 'Continuous compliance monitoring platform with automated evidence collection, framework mapping (CE, ISO 27001), and board-level risk dashboard.' },
      { name: 'Arctic Wolf Managed Risk', description: 'Attack surface management and compliance reporting aligned to NIST CSF, ISO 27001, and CIS Controls — with dedicated analyst support.' },
    ],
    benefits: [
      'Automated evidence collection replacing manual spreadsheet-based compliance exercises',
      'Continuous compliance posture monitoring — not just point-in-time snapshots',
      'Framework cross-mapping: single effort covering multiple standards',
      'Board-level risk dashboards with quantified risk scores',
      'Audit-ready reporting for ISO 27001, GDPR, NIS2, and Cyber Essentials',
    ],
    risks: [
      'NIS2 non-compliance: sanctions of up to €10M or 2% of global turnover',
      'DORA non-compliance for financial sector organisations',
      'Supply chain exclusion from enterprise/public sector procurement without ISO 27001 or CE',
      'Reputational damage from demonstrably inadequate governance practices',
    ],
    roi: 'GRC platforms typically cost £5–£15 per user per month. They eliminate the cost of manual compliance exercises (typically 200–500 person-hours per audit cycle) and provide defensible evidence that avoids regulatory sanction. ISO 27001 certification can unlock enterprise contracts worth multiples of the GRC investment.',
    recommendation: 'Broad Peak Cyber recommends beginning with a GRC gap assessment against your primary regulatory obligations, then deploying CyberSmart Active Protect for continuous monitoring while building the evidence base required for formal certification.',
  },
  'Ransomware Protection': {
    tagline: 'Detect, contain, and recover from ransomware before encryption completes',
    executiveSummary: 'Ransomware remains one of the most financially damaging threats facing organisations. While Sophos\'s 2025 research shows that fewer attacks are completing encryption (49% — the lowest in five years), ransom payments remain high at a median of $1M, and backup usage for recovery has fallen to a 4-year low. Dedicated ransomware containment technology stops active attacks in progress — before encryption completes and data is lost.',
    threatLandscape: [
      'Only 49% of ransomware attacks resulted in full encryption in 2025 — but 48% of victims still paid (Sophos)',
      'Median ransom payment: $1M in 2025',
      'Exploited vulnerabilities were the #1 ransomware entry point (29% of incidents)',
      'Use of backups for recovery fell to a 4-year low of 53%',
      'Ransomware-as-a-service lowered attacker skill barrier — increasing attack frequency',
    ],
    whyNow: 'The availability of ransomware-as-a-service kits has democratised ransomware attacks, making them accessible to low-skill threat actors. While defences have improved, attackers have adapted — exfiltrating data before encryption to enable double-extortion even if backups exist. Dedicated ransomware containment technology that detects and halts file encryption in real time provides a last line of defence that backup alone cannot replicate.',
    solution: 'BullWall Ransomware Containment provides a dedicated last-line-of-defence solution that detects active ransomware encryption in progress and immediately isolates the affected system — stopping the attack before it spreads. BullWall integrates with existing EDR, SIEM, and backup platforms, providing containment capability that complements rather than replaces existing security controls.',
    vendors: [
      { name: 'BullWall', description: 'Ransomware containment platform that detects file-encryption activity in real time and automatically isolates affected systems — stopping attacks before they spread to shared drives and critical systems.' },
    ],
    benefits: [
      'Stops active ransomware encryption in real time — before it reaches file servers and shared drives',
      'Complements EDR, backup, and firewall — not a replacement',
      'Automated isolation response in seconds — not minutes or hours',
      'Reduces blast radius and recovery scope dramatically',
      'Provides forensic data for insurance claims and regulatory notification',
    ],
    risks: [
      'Without containment: a single compromised endpoint can encrypt entire shared file systems in minutes',
      'Backup alone does not prevent data exfiltration for double-extortion',
      'Ransom payment does not guarantee data recovery — decryption keys are provided in only 70% of cases',
      'Regulatory obligation to notify ICO within 72 hours — containment limits scope of notification',
    ],
    roi: 'BullWall containment typically costs £8–£15 per user per month. Against a median ransom payment of $1M — plus recovery costs, downtime, regulatory fines, and reputational damage — the ROI from preventing a single incident is measurable in millions. BullWall\'s value lies in limiting the blast radius of attacks that bypass all other controls.',
    recommendation: 'Broad Peak Cyber recommends deploying BullWall as a complementary layer to existing EDR and backup — specifically targeting the gap between initial compromise and containment. A proof-of-concept deployment against your shared file server environment can be completed in under one week.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BRAND_PINK = '7b2869';   // dark pink for headings (on white background)
const BRAND_BLUE = '1a5ca8';   // dark blue for accents
const BRAND_GREY = '6b7280';   // body text grey
const LIGHT_GREY = 'f3f4f6';   // section background

function heading1(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    run: { color: BRAND_PINK, bold: true, size: 32 },
  });
}

function heading2(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    run: { color: BRAND_BLUE, bold: true, size: 26 },
  });
}

function body(text: string, bold = false, colour = '1f2937') {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, bold, color: colour, size: 22 })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, color: '374151' })],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { color: 'e5e7eb', size: 6, space: 1, style: BorderStyle.SINGLE } },
    children: [],
  });
}

function inputRow(label: string, placeholder: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: LIGHT_GREY, type: ShadingType.CLEAR, color: 'auto' },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: '374151' })] })],
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: placeholder, size: 20, color: '9ca3af', italics: true })] })],
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          }),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'e5e7eb' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateBusinessCase(
  category: string,
  accountName: string,
  products: { name: string; vendor: string; expiresAt?: string }[],
): Promise<Buffer> {
  const content = CATEGORY_CONTENT[category];
  if (!content) throw new Error(`No business case content for category: ${category}`);

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const children: (Paragraph | Table)[] = [
    // ── Cover ──────────────────────────────────────────────────────────────
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: 'BUSINESS CASE', bold: true, size: 48, color: BRAND_PINK })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: category, bold: true, size: 40, color: '1f2937' })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: content.tagline, size: 24, color: BRAND_GREY, italics: true })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: `Prepared for: ${accountName}`, size: 22, color: '374151' })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: `Prepared by: Broad Peak Cyber`, size: 22, color: '374151' })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: `Date: ${today}`, size: 22, color: '374151' })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: `Classification: Confidential`, size: 22, color: '374151' })],
    }),
    divider(),

    // ── Section 1: Executive Summary ──────────────────────────────────────
    heading1('1. Executive Summary'),
    body(content.executiveSummary),
    divider(),

    // ── Section 2: Threat Landscape ───────────────────────────────────────
    heading1('2. Threat Landscape & Market Context'),
    body('The following statistics, sourced from leading industry research (IBM, Verizon, Gartner, Sophos, and others), provide the evidence base for this investment decision:'),
    ...content.threatLandscape.map(stat => bullet(stat)),
    new Paragraph({ spacing: { before: 160, after: 80 }, children: [new TextRun({ text: 'Why invest now?', bold: true, size: 22, color: '1f2937' })] }),
    body(content.whyNow),
    divider(),

    // ── Section 3: Proposed Solution ──────────────────────────────────────
    heading1('3. Proposed Solution'),
    body(content.solution),
    new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: 'Recommended Products', bold: true, size: 22, color: '1f2937' })] }),
    ...content.vendors.flatMap(v => [
      new Paragraph({ spacing: { before: 140, after: 40 }, children: [new TextRun({ text: v.name, bold: true, size: 22, color: BRAND_BLUE })] }),
      body(v.description),
    ]),

    // Show current products if any
    ...(products.length > 0 ? [
      new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: 'Your Current Products in this Category', bold: true, size: 22, color: '1f2937' })] }),
      ...products.map(p => {
        const expiryText = p.expiresAt ? `  (expires ${new Date(p.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })})` : '';
        return bullet(`${p.name} — ${p.vendor}${expiryText}`);
      }),
    ] : []),
    divider(),

    // ── Section 4: Benefits ───────────────────────────────────────────────
    heading1('4. Key Benefits'),
    ...content.benefits.map(b => bullet(b)),
    divider(),

    // ── Section 5: Risks of Inaction ──────────────────────────────────────
    heading1('5. Risks of Inaction'),
    body('Failure to invest in this capability exposes the organisation to the following risks:'),
    ...content.risks.map(r => bullet(r)),
    divider(),

    // ── Section 6: Return on Investment ───────────────────────────────────
    heading1('6. Return on Investment'),
    body(content.roi),
    divider(),

    // ── Section 7: Recommendation ─────────────────────────────────────────
    heading1('7. Recommendation'),
    body(content.recommendation),
    body('Broad Peak Cyber is available to provide a tailored demonstration, proof-of-concept, or detailed scoping workshop at your convenience. Please contact your Account Manager to arrange next steps.'),
    divider(),

    // ── Section 8: Commercials ────────────────────────────────────────────
    heading1('8. Commercial Summary'),
    body('Please complete the following section with the commercial terms presented. This section is intended to be completed by the Broad Peak Cyber account team prior to board submission.'),
    new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

    inputRow('Product / Solution', 'Enter product name(s) and scope'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Number of Users / Seats', 'Enter quantity'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Contract Term', 'e.g. 12 months / 36 months'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Annual Cost (excl. VAT)', '£'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Cost Per User Per Month', '£'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Implementation / Onboarding Cost', '£ (if applicable)'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Payment Terms', 'e.g. Annual upfront / Monthly'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Discount Applied', '% or £ value'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Total Investment (Year 1)', '£'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Total Investment (3-Year)', '£'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Proposed Start Date', 'DD/MM/YYYY'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Renewal Date', 'DD/MM/YYYY'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Purchase Order Reference', 'Enter PO number once raised'),
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [] }),
    inputRow('Notes / Special Conditions', 'Any additional commercial terms, SLAs, or conditions'),
    new Paragraph({ spacing: { before: 160, after: 0 }, children: [] }),

    divider(),

    // ── Footer ────────────────────────────────────────────────────────────
    new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [new TextRun({ text: 'Broad Peak Cyber  |  Confidential', size: 18, color: BRAND_GREY })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: 'This document has been prepared exclusively for the named recipient. It should not be shared with third parties without the express written consent of Broad Peak Cyber.', size: 18, color: BRAND_GREY, italics: true })],
    }),
  ];

  const doc = new Document({
    creator: 'Broad Peak Cyber',
    title: `Business Case — ${category}`,
    description: `Business case for ${category} investment prepared for ${accountName}`,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: '1f2937' },
          paragraph: { spacing: { line: 360 } },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: { bold: true, size: 32, color: BRAND_PINK, font: 'Calibri' },
          paragraph: { spacing: { before: 400, after: 200 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: { bold: true, size: 26, color: BRAND_BLUE, font: 'Calibri' },
          paragraph: { spacing: { before: 320, after: 160 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
            right: convertInchesToTwip(1.2),
          },
        },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}
