import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronRight, Download, RotateCcw, Shield, AlertTriangle, TrendingUp, Info, HelpCircle, Target } from 'lucide-react';
import { jsPDF } from 'jspdf';

// ── NIST CSF 2.0 Framework ────────────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  why: string;
  example: string;
  guidance: string;
  weight: number;
  skipIf?: { questionId: string; answer: boolean };
}

interface NISTFunction {
  id: string;
  name: string;
  ref: string;
  description: string;
  tagline: string;
  color: string;
  questions: Question[];
  bpProducts: string[];
}

const NIST_FUNCTIONS: NISTFunction[] = [
  {
    id: 'govern',
    name: 'Govern',
    ref: 'GV',
    description: 'Organisational context, risk strategy, supply chain risk, and cybersecurity policy',
    tagline: 'Leadership, accountability, and risk strategy',
    color: '#8b5cf6',
    bpProducts: ['CyberSmart Active Protect', 'Arctic Wolf Managed Risk'],
    questions: [
      {
        id: 'gv1',
        text: 'Does your organisation have a documented cybersecurity policy approved by senior leadership?',
        why: 'A formal policy sets accountability, demonstrates board-level commitment, and provides the foundation for all other security controls. Without it, security becomes ad-hoc and inconsistent.',
        example: 'An Acceptable Use Policy (AUP) and an Information Security Policy signed by the CEO or board satisfy this requirement. They don\'t need to be lengthy — clarity and commitment matter more than volume.',
        guidance: 'NIST CSF GV.OC-01. Your policy should cover: data classification, acceptable use, incident reporting, and password requirements. Review annually.',
        weight: 3,
      },
      {
        id: 'gv2',
        text: 'Do you conduct formal cybersecurity risk assessments at least annually?',
        why: 'Risk assessments identify threats, vulnerabilities, and their potential impact before attackers find them. Without them, you\'re flying blind — spending on the wrong controls while leaving real risks unaddressed.',
        example: 'An annual workshop with IT and department heads identifying top risks, their likelihood and impact, and current mitigations. Document the output and track remediation.',
        guidance: 'NIST CSF GV.RM-01. Risk assessments form the foundation of a risk-based security programme. Regulators (ICO, FCA) increasingly expect evidence of formal risk management.',
        weight: 3,
      },
      {
        id: 'gv3',
        text: 'Are cybersecurity roles and responsibilities clearly defined for all staff?',
        why: 'When a security incident occurs, confusion about who is responsible for what is one of the most damaging factors. Clear RACI matrices prevent both gaps (nobody does it) and conflict (everyone thinks someone else does it).',
        example: 'Role-specific guidance in onboarding packs: "Finance team — your responsibility for protecting payment data includes..." Avoid generic "everyone is responsible for security" statements without specifics.',
        guidance: 'NIST CSF GV.RR-01. Every person should know their security responsibilities. Consider a simple one-pager for each team defining their specific obligations.',
        weight: 2,
      },
      {
        id: 'gv4',
        text: 'Do you assess the cybersecurity risks posed by your key suppliers and third parties?',
        why: 'Third-party breaches are a leading attack vector. The SolarWinds attack (2020) compromised 18,000 organisations through a single trusted supplier. Your security is only as strong as your weakest supplier.',
        example: 'Sending a security questionnaire to key suppliers annually. Reviewing suppliers\' ISO 27001 or Cyber Essentials certificates. Adding security clauses to supplier contracts.',
        guidance: 'NIST CSF GV.SC-01. NCSC supply chain guidance recommends assessing any supplier with access to your data or systems. Start with your highest-risk suppliers.',
        weight: 2,
      },
      {
        id: 'gv5',
        text: 'Does your board or senior leadership receive regular cybersecurity risk updates?',
        why: 'Cybersecurity decisions (budgets, risk tolerance, incident response) require executive buy-in. Without regular briefings, cyber risk remains invisible at board level — until a major incident forces it into view.',
        example: 'A quarterly cyber risk dashboard for the board covering: top risks, recent incidents, patch compliance status, and any regulatory changes. Keep it concise and business-focused.',
        guidance: 'NIST CSF GV.OC-02. Executive visibility is a key differentiator in mature security programmes. Frame updates in business impact terms, not technical ones.',
        weight: 2,
      },
    ],
  },
  {
    id: 'identify',
    name: 'Identify',
    ref: 'ID',
    description: 'Asset management, risk assessment, and understanding business context',
    tagline: 'Know what you have before you can protect it',
    color: '#3b82f6',
    bpProducts: ['CyberSmart Active Protect', 'Arctic Wolf Managed Risk'],
    questions: [
      {
        id: 'id1',
        text: 'Do you maintain a complete, up-to-date inventory of all hardware assets?',
        why: 'You cannot protect what you cannot see. Unregistered devices — personal laptops, old servers, forgotten IoT devices — are frequently the entry point for attackers precisely because they\'re overlooked.',
        example: 'A spreadsheet or automated tool listing every laptop, server, switch, firewall, phone, tablet, and printer — including make, model, serial number, OS version, and owner. Updated when assets change.',
        guidance: 'NIST CSF ID.AM-01. Asset visibility is foundational to every other security control. Automated tools (Intune, CyberSmart) are significantly more reliable than manual registers.',
        weight: 3,
      },
      {
        id: 'id2',
        text: 'Do you have visibility of all software, applications, and cloud services in use?',
        why: 'Shadow IT — applications adopted by teams without IT approval — is a major risk. Unsanctioned tools may not meet your security standards, may store sensitive data outside your control, and are rarely patched.',
        example: 'Discovering that your marketing team uses a free cloud file-sharing tool to send customer data, or that a department runs a legacy database application IT didn\'t know about.',
        guidance: 'NIST CSF ID.AM-02. Cloud Access Security Brokers (CASBs) can discover shadow IT. At minimum, conduct annual software audits via endpoint management tools.',
        weight: 2,
      },
      {
        id: 'id3',
        text: 'Have you identified and classified your most critical and sensitive data?',
        why: 'Not all data requires the same level of protection. Knowing what your crown jewels are — customer personal data, financial records, intellectual property — lets you prioritise defences appropriately.',
        example: 'A data classification scheme: Confidential (customer PII, financial data), Internal (business documents), Public. Applied consistently across systems and shared with staff.',
        guidance: 'NIST CSF ID.AM-07. UK GDPR requires you to understand what personal data you hold, where it is, and how it\'s protected. Data classification is the starting point.',
        weight: 3,
      },
      {
        id: 'id4',
        text: 'Do you know which systems and processes are critical to your business operations?',
        why: 'Without knowing your critical assets, you can\'t prioritise their protection or plan meaningful recovery. A ransomware attack that hits your billing system has very different business impact than one targeting a test server.',
        example: 'Identifying that your ERP system, customer database, and email are business-critical — meaning a 4-hour outage would cause significant harm — and ensuring these receive higher protection priority.',
        guidance: 'NIST CSF ID.BE-04. Knowing your critical assets enables prioritised protection and recovery planning. This informs your Business Continuity Plan and DRP.',
        weight: 2,
      },
      {
        id: 'id5',
        text: 'Are cybersecurity vulnerabilities in your systems identified through regular scanning?',
        why: 'Vulnerabilities are found in software constantly. Without active scanning, you\'re unaware of critical weaknesses until an attacker exploits them. Proactive identification is far cheaper than reactive breach response.',
        example: 'Monthly internal vulnerability scans using tools like Nessus, Qualys, or Microsoft Defender. Annual external penetration tests. Subscribing to NCSC\'s vulnerability alerts.',
        guidance: 'NIST CSF ID.RA-01. Vulnerability scanning is a CE+ requirement. The NCSC\'s free Vulnerability Scanning service is available to UK organisations.',
        weight: 3,
      },
    ],
  },
  {
    id: 'protect',
    name: 'Protect',
    ref: 'PR',
    description: 'Identity management, access control, awareness training, data security, and platform security',
    tagline: 'Implement safeguards to limit the impact of incidents',
    color: '#10b981',
    bpProducts: ['Barracuda Email Gateway Defense', 'WatchGuard Firebox', 'WatchGuard AuthPoint', 'Boxphish Security Awareness', 'Keepit M365 Backup', 'Druva inSync'],
    questions: [
      {
        id: 'pr1',
        text: 'Is MFA enforced for all cloud services, email, and remote access?',
        why: 'MFA is the single most effective control against credential-based attacks. IBM 2025 reports MFA prevents over 99% of automated attacks. Passwords alone are insufficient — they are regularly phished, leaked, or guessed.',
        example: 'Microsoft 365 with MFA enabled for all users via Conditional Access policies. Staff authenticate with Microsoft Authenticator app on their phone — a stolen password cannot grant access without the phone.',
        guidance: 'NIST CSF PR.AA-03. MFA is now a mandatory Cyber Essentials requirement for all cloud services and remote access. Configure via Microsoft 365 Admin Center > Security > MFA.',
        weight: 3,
      },
      {
        id: 'pr2',
        text: 'Is the principle of least privilege applied — users only access what they need for their role?',
        why: 'Over-privileged accounts dramatically increase the blast radius of any breach. If a marketing manager\'s account is compromised and they have access to finance systems they shouldn\'t, the attacker gets access too.',
        example: 'Customer service staff can access the CRM — but not the finance system. Finance staff can access accounting software — but not HR records. Reviewed and updated when roles change.',
        guidance: 'NIST CSF PR.AA-05. Conduct access rights reviews at least annually (or when staff change roles). Remove access within the same day when staff leave.',
        weight: 3,
      },
      {
        id: 'pr3',
        text: 'Do all staff receive regular security awareness training at least annually?',
        why: 'The human element is involved in the majority of cyber breaches — through phishing, social engineering, and accidental data exposure. Training measurably reduces risk. Verizon DBIR 2025 found the human element involved in 60% of breaches.',
        example: 'Annual security awareness training covering: phishing recognition, password hygiene, data handling, and incident reporting. Supplemented by regular threat updates and policy reminders.',
        guidance: 'NIST CSF PR.AT-01. Training should be engaging and relevant — dry compliance tick-boxes are ineffective. Boxphish combines video training with simulated phishing for maximum impact.',
        weight: 3,
      },
      {
        id: 'pr3b',
        text: 'Do you run simulated phishing exercises to test staff awareness?',
        why: 'Training alone is significantly less effective than training combined with practice. Simulated phishing exercises expose gaps in real behaviour — not just knowledge — and identify staff who need additional support.',
        example: 'Quarterly simulated phishing campaigns mimicking real attack styles (invoice fraud, IT helpdesk impersonation). Staff who click receive immediate education rather than punishment.',
        guidance: 'KnowBe4 research shows 86% reduction in click rates with combined training and simulation programmes. Boxphish provides both training and simulated phishing in one platform.',
        weight: 2,
        skipIf: { questionId: 'pr3', answer: false },
      },
      {
        id: 'pr4',
        text: 'Is critical business data backed up regularly, with backups tested for restoration?',
        why: 'Untested backups are not backups. Sophos 2025 found only 53% of ransomware victims successfully recovered from backup — meaning nearly half paid the ransom or lost data permanently, despite having "backups".',
        example: 'Daily automated backups of all critical data. Monthly restoration tests — actually restoring a file or database to verify it works. Backup logs reviewed weekly for failures.',
        guidance: 'NIST CSF PR.DS-01. The 3-2-1 rule: 3 copies, on 2 different media, with 1 offsite or cloud. Test backups quarterly minimum — document the test results.',
        weight: 3,
      },
      {
        id: 'pr4b',
        text: 'Are backups stored offline or in an immutable location (ransomware-resistant)?',
        why: 'Modern ransomware specifically targets connected backup solutions. Attackers wait inside networks for weeks, discovering and encrypting or deleting backups before triggering the ransomware — ensuring maximum leverage.',
        example: 'Keepit or Druva provide immutable cloud backup — once written, data cannot be modified or deleted, even by ransomware with admin credentials. Air-gapped tape backups also qualify.',
        guidance: 'Air-gapped, offline, or immutable backups are essential. Ask your backup vendor: "Can ransomware delete or encrypt our backups if it gets admin access?" The answer should be no.',
        weight: 3,
        skipIf: { questionId: 'pr4', answer: false },
      },
      {
        id: 'pr5',
        text: 'Is email protected with advanced anti-phishing and anti-spoofing beyond basic defaults?',
        why: 'Email is the #1 attack vector. Native Microsoft 365 and Google Workspace protection has well-documented gaps — it misses sophisticated phishing, business email compromise (BEC), and zero-day malware. The FBI recorded $3B+ in BEC losses in 2025.',
        example: 'Barracuda Email Gateway Defense inspects every inbound email, sandboxes suspicious attachments, rewrites links, and blocks spoofed sender domains that M365 misses.',
        guidance: 'NIST CSF PR.PS-01. At minimum, ensure SPF, DKIM, and DMARC records are correctly configured for your domain. Consider advanced email security for Microsoft 365 or Google Workspace.',
        weight: 3,
      },
      {
        id: 'pr6',
        text: 'Are all devices protected with endpoint security software (beyond basic antivirus)?',
        why: 'Legacy antivirus detects known malware signatures but misses modern fileless attacks, living-off-the-land techniques, and novel ransomware variants. EDR (Endpoint Detection and Response) provides behavioural analysis that catches what AV misses.',
        example: 'WatchGuard EPDR or Barracuda XDR monitor endpoint behaviour continuously, catching attacks that evade signature-based tools — like a PowerShell script that doesn\'t contain any known malware signatures.',
        guidance: 'NIST CSF PR.PS-02. Windows Defender meets Cyber Essentials baseline. EDR provides significantly better protection and is recommended for any organisation handling sensitive data.',
        weight: 3,
      },
      {
        id: 'pr7',
        text: 'Is your network segmented so compromise of one area cannot spread freely?',
        why: 'Flat networks — where every device can communicate with every other device — allow attackers to move freely once inside. Segmentation contains breaches to the affected area, dramatically limiting impact.',
        example: 'Separating your guest WiFi from your internal network. Putting manufacturing systems on a separate VLAN from office computers. Isolating servers from workstations. Each requires separate authentication to cross.',
        guidance: 'NIST CSF PR.IR-04. Network segmentation is particularly important for organisations with operational technology (OT) or critical manufacturing systems alongside IT.',
        weight: 2,
      },
      {
        id: 'pr8',
        text: 'Are all systems patched with critical security updates within 14 days of release?',
        why: 'Verizon DBIR 2025 found exploitation of known vulnerabilities grew 34% year-on-year. Attackers weaponise patches within hours of release — the window between "patch available" and "exploit in the wild" is shrinking.',
        example: 'Automated patch deployment via Intune or WSUS. A maximum 14-day SLA for critical and high-severity patches. Weekly reporting on patch compliance across all devices.',
        guidance: 'NIST CSF PR.PS-04. The 14-day requirement is mandated by Cyber Essentials. WannaCry exploited a vulnerability that had been patched 60 days earlier — those who patched within 14 days were safe.',
        weight: 3,
      },
    ],
  },
  {
    id: 'detect',
    name: 'Detect',
    ref: 'DE',
    description: 'Continuous monitoring, adverse event analysis, and anomaly detection',
    tagline: 'Find threats before they become breaches',
    color: '#f59e0b',
    bpProducts: ['Arctic Wolf MDR', 'WatchGuard MDR', 'Barracuda XDR'],
    questions: [
      {
        id: 'de1',
        text: 'Do you have security monitoring that detects unusual or suspicious activity?',
        why: 'IBM 2025 found the average breach goes undetected for 241 days without monitoring. The longer an attacker remains undetected, the more damage they cause — and the more it costs. Early detection saves an average of $1.9M per incident.',
        example: 'A SIEM (Security Information and Event Management) system that correlates logs from across your environment and alerts on anomalies — like a user accessing 10,000 files in one hour, or a login from an unusual country.',
        guidance: 'NIST CSF DE.CM-01. Monitoring doesn\'t need to be complex. Even basic alerting on failed login attempts, large data transfers, or unusual admin activity provides significant value.',
        weight: 3,
      },
      {
        id: 'de2',
        text: 'Are security logs collected and reviewed from key systems?',
        why: 'Log collection without review is security theatre. Logs are only valuable if someone (or something) is actually looking at them for indicators of compromise. Many breaches are visible in logs — just never noticed.',
        example: 'Centralised log collection from your firewall, Active Directory, M365, and key servers. Weekly review by IT, or automated alerting via a SIEM or MDR service.',
        guidance: 'NIST CSF DE.CM-03. At minimum, collect logs from: firewalls, authentication systems, email gateway, and DNS. Retain logs for a minimum of 90 days (12 months recommended for incident investigation).',
        weight: 2,
      },
      {
        id: 'de3',
        text: 'Do you have 24/7 security monitoring — in-house or via a managed SOC/MDR provider?',
        why: 'Most cyberattacks occur outside business hours — attackers deliberately time their activity to avoid detection. Monday morning is peak ransomware deployment time. Without 24/7 monitoring, attacks run unchecked all weekend.',
        example: 'Arctic Wolf MDR or WatchGuard MDR provide a 24/7 Security Operations Centre that monitors your environment continuously, alerting on threats and responding in real-time at a fraction of the cost of in-house SOC.',
        guidance: 'NIST CSF DE.CM-09. 24/7 monitoring is beyond many in-house IT teams. Managed Detection and Response (MDR) provides enterprise-grade SOC capability at SME price points.',
        weight: 3,
        skipIf: { questionId: 'de1', answer: false },
      },
      {
        id: 'de4',
        text: 'Do you receive threat intelligence feeds relevant to your systems and sector?',
        why: 'Threat intelligence enables proactive rather than reactive security. Knowing that a specific ransomware group is targeting your sector this week allows you to review relevant controls before you\'re attacked.',
        example: 'NCSC Early Warning Service (free for UK organisations). Sector-specific ISACs (Information Sharing and Analysis Centres). Arctic Wolf provides threat intelligence as part of its MDR service.',
        guidance: 'NIST CSF DE.AE-02. The NCSC\'s free Early Warning service provides curated threat intelligence based on your IP ranges and domains. Register at ncsc.gov.uk/section/products-services/early-warning.',
        weight: 2,
      },
    ],
  },
  {
    id: 'respond',
    name: 'Respond',
    ref: 'RS',
    description: 'Incident response planning, communications, analysis, and mitigation',
    tagline: 'Know exactly what to do when an incident occurs',
    color: '#ef4444',
    bpProducts: ['Arctic Wolf MDR', 'WatchGuard MDR', 'Barracuda XDR'],
    questions: [
      {
        id: 'rs1',
        text: 'Do you have a documented Incident Response Plan for handling a cyberattack?',
        why: 'Without a plan, breach response is chaotic. IBM 2025 found organisations with IR plans save an average of $1.5M per breach compared to those without. A plan that\'s never been written will never be executed correctly under pressure.',
        example: 'A documented playbook covering: who to call first, how to isolate affected systems, when to notify the ICO, how to communicate with customers, and who has authority to take systems offline.',
        guidance: 'NIST CSF RS.MA-01. Your IR plan doesn\'t need to be extensive — a clear, actionable document covering the first 24 hours is more valuable than a comprehensive document nobody has read.',
        weight: 3,
      },
      {
        id: 'rs2',
        text: 'Has your incident response plan been tested or exercised in the past 12 months?',
        why: 'Plans that have never been tested will fail under pressure. Tabletop exercises expose gaps, build muscle memory, and ensure everyone knows their role — so the first time isn\'t during a live ransomware attack at 2am.',
        example: 'A 2-hour tabletop exercise: "It\'s Friday at 5pm. Your finance manager reports their computer is showing a ransom note. What do you do?" Walk through the plan step by step, identifying gaps.',
        guidance: 'NIST CSF RS.MA-04. Include IT, senior management, HR, and communications in exercises. Document outcomes and update the plan based on findings.',
        weight: 2,
        skipIf: { questionId: 'rs1', answer: false },
      },
      {
        id: 'rs3',
        text: 'Do you understand your legal obligations for reporting a personal data breach?',
        why: 'UK GDPR requires notification to the ICO within 72 hours of becoming aware of a personal data breach. Failure to report in time can result in significant fines — on top of the breach itself. Many organisations don\'t know the clock starts ticking immediately.',
        example: 'If a ransomware attack encrypts a database containing customer names and email addresses, you must notify the ICO within 72 hours and potentially notify affected individuals.',
        guidance: 'NIST CSF RS.CO-02. "Aware" means any member of staff with the authority to act — not just when the DPO is officially informed. Train your frontline staff to escalate immediately.',
        weight: 2,
      },
      {
        id: 'rs4',
        text: 'Do you have pre-agreed relationships with external cybersecurity incident response support?',
        why: 'During an incident is the worst time to find an IR firm. Searching for help, negotiating contracts, and onboarding a new supplier takes days — days during which the attacker is still active.',
        example: 'An IR retainer with a cybersecurity firm that guarantees a response within hours and already has your network architecture and contact details. Many cyber insurance policies include access to IR firms.',
        guidance: 'NIST CSF RS.CO-05. Check your cyber insurance policy — most include access to a panel of approved IR firms as part of coverage. Arctic Wolf MDR includes IR support.',
        weight: 2,
      },
    ],
  },
  {
    id: 'recover',
    name: 'Recover',
    ref: 'RC',
    description: 'Recovery planning, restoration of capabilities, and lessons learned',
    tagline: 'Restore operations and learn from every incident',
    color: '#06b6d4',
    bpProducts: ['Keepit M365 Backup', 'Druva inSync', 'Druva Phoenix', 'Barracuda Cloud-to-Cloud Backup'],
    questions: [
      {
        id: 'rc1',
        text: 'Do you have a Business Continuity or Disaster Recovery Plan covering a major cyberattack?',
        why: 'A cyberattack is fundamentally different from a traditional disaster (fire, flood). Systems may not be physically destroyed but still be unavailable for weeks. Generic BCPs often fail to address the specific challenges of cyber incidents.',
        example: 'A cyber-specific recovery plan: how to operate without your ERP system for 2 weeks, which manual processes substitute for automated ones, how to communicate if email is unavailable.',
        guidance: 'NIST CSF RC.RP-01. Sophos 2025 found mean remediation cost of £1.84M for ransomware — largely driven by extended downtime. A tested recovery plan directly reduces this figure.',
        weight: 3,
      },
      {
        id: 'rc2',
        text: 'Have you defined and tested RTOs and RPOs for your critical systems?',
        why: 'Recovery Time Objective (RTO — how long you can survive without a system) and Recovery Point Objective (RPO — how much data loss is acceptable) must be defined before an incident, not during one.',
        example: 'Finance system: RTO 4 hours (cannot process payroll without it), RPO 1 hour (maximum 1 hour of transaction data loss). Email: RTO 8 hours, RPO 4 hours. These drive your backup and recovery investment decisions.',
        guidance: 'NIST CSF RC.RP-03. Without defined RTOs/RPOs, you cannot know whether your current recovery capability meets business needs. Define them with business owners, not just IT.',
        weight: 2,
        skipIf: { questionId: 'rc1', answer: false },
      },
      {
        id: 'rc3',
        text: 'Can you restore critical systems and data within an acceptable timeframe following ransomware?',
        why: 'Sophos 2025 found that the mean recovery time from ransomware is 1 week, with 15% taking a month or more. Each day of downtime has direct financial impact. Your recovery capability directly determines how long you\'re down.',
        example: 'Testing actual restoration from backup: restore a critical server from backup and verify it\'s fully operational. Measure the time taken. Does this meet your RTO? If not, your backup solution needs upgrading.',
        guidance: 'NIST CSF RC.RP-05. Recovery capability should be tested at least annually through a full restoration exercise — not just backup verification. Include time-to-recovery in your test documentation.',
        weight: 3,
      },
      {
        id: 'rc4',
        text: 'Do you conduct post-incident reviews to improve your defences after security events?',
        why: 'Every security event — even minor ones — contains lessons. Organisations that conduct blameless post-incident reviews consistently improve their posture over time. Those that don\'t repeat the same mistakes.',
        example: 'After a phishing email is reported: "How did it get through our email filter? Was it a new variant? Should we adjust our filtering rules? Do staff need refresher training on this type of attack?"',
        guidance: 'NIST CSF RC.IM-01. Post-incident reviews should be blameless and constructive — focused on process improvement, not individual accountability. Document findings and track remediation.',
        weight: 2,
      },
    ],
  },
];

const TOTAL_QUESTIONS = NIST_FUNCTIONS.reduce((sum, f) => sum + f.questions.length, 0);

function getRiskLevel(score: number): { label: string; color: string; bgColor: string; description: string } {
  if (score >= 80) return { label: 'Low Risk', color: '#10b981', bgColor: '#f0fdf4', description: 'Strong security posture. Focus on continuous improvement and monitoring.' };
  if (score >= 60) return { label: 'Medium Risk', color: '#f59e0b', bgColor: '#fffbeb', description: 'Reasonable baseline with notable gaps requiring prioritised attention.' };
  if (score >= 40) return { label: 'High Risk', color: '#f97316', bgColor: '#fff7ed', description: 'Significant gaps across multiple areas. Prioritised remediation plan required.' };
  return { label: 'Critical Risk', color: '#ef4444', bgColor: '#fef2f2', description: 'Fundamental controls missing. Immediate remediation action essential.' };
}

const PRODUCT_MAP: Record<string, string[]> = {
  gv1: ['CyberSmart Active Protect'],
  gv2: ['Arctic Wolf Managed Risk', 'CyberSmart Active Protect'],
  gv4: ['CyberSmart Active Protect'],
  id1: ['CyberSmart Active Protect'],
  id2: ['CyberSmart Active Protect'],
  id5: ['Arctic Wolf Managed Risk', 'CyberSmart CE+'],
  pr1: ['WatchGuard AuthPoint'],
  pr2: ['WatchGuard AuthPoint'],
  pr3: ['Boxphish Security Awareness Training'],
  pr3b: ['Boxphish Security Awareness Training'],
  pr4: ['Keepit M365 Backup', 'Druva inSync'],
  pr4b: ['Keepit M365 Backup', 'Druva Phoenix'],
  pr5: ['Barracuda Email Gateway Defense'],
  pr6: ['WatchGuard Endpoint EDR/EPDR', 'Barracuda XDR'],
  pr7: ['Barracuda CloudGen Firewall', 'WatchGuard Firebox'],
  pr8: ['CyberSmart Active Protect'],
  de1: ['Arctic Wolf MDR', 'WatchGuard MDR', 'Barracuda XDR'],
  de2: ['Arctic Wolf MDR', 'Barracuda XDR'],
  de3: ['Arctic Wolf MDR', 'WatchGuard MDR', 'Barracuda XDR'],
  de4: ['Arctic Wolf MDR'],
  rs1: ['Arctic Wolf MDR', 'WatchGuard MDR'],
  rs2: ['Arctic Wolf MDR'],
  rs4: ['Arctic Wolf MDR'],
  rc1: ['Keepit M365 Backup', 'Druva Phoenix'],
  rc2: ['Keepit M365 Backup', 'Druva Phoenix'],
  rc3: ['Keepit M365 Backup', 'Druva inSync', 'Druva Phoenix', 'BullWall'],
};

type Answers = Record<string, boolean | null>;

function calcFunctionScore(fn: NISTFunction, answers: Answers): number {
  let totalWeight = 0, earnedWeight = 0;
  for (const q of fn.questions) {
    if (answers[q.id] === undefined || answers[q.id] === null) continue;
    totalWeight += q.weight;
    if (answers[q.id] === true) earnedWeight += q.weight;
  }
  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}

function calcOverallScore(answers: Answers): number {
  const scores = NIST_FUNCTIONS.map(f => calcFunctionScore(f, answers));
  const answered = scores.filter((_, i) => NIST_FUNCTIONS[i].questions.some(q => answers[q.id] !== undefined));
  if (answered.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function generateRiskPDF(answers: Answers, accountName: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 18;
  let y = 0;

  const pink: [number, number, number] = [198, 87, 147];
  const blue: [number, number, number] = [68, 148, 209];
  const darkBg: [number, number, number] = [26, 10, 46];
  const lightGrey: [number, number, number] = [248, 248, 252];

  const overallScore = calcOverallScore(answers);
  const risk = getRiskLevel(overallScore);
  const riskRgb = overallScore >= 80 ? [16, 185, 129] as [number,number,number] : overallScore >= 60 ? [245, 158, 11] as [number,number,number] : overallScore >= 40 ? [249, 115, 22] as [number,number,number] : [239, 68, 68] as [number,number,number];

  doc.setFillColor(...darkBg); doc.rect(0, 0, W, 297, 'F');
  doc.setFillColor(...pink); doc.rect(0, 0, W / 2, 4, 'F');
  doc.setFillColor(...blue); doc.rect(W / 2, 0, W / 2, 4, 'F');

  y = 55;
  doc.setTextColor(255, 255, 255); doc.setFontSize(28); doc.setFont('helvetica', 'bold');
  doc.text('Cyber Risk Score', margin, y); y += 12;
  doc.text('Assessment Report', margin, y); y += 10;
  doc.setFontSize(14); doc.setFont('helvetica', 'normal');
  doc.setTextColor(...pink);
  doc.text('Based on NIST Cybersecurity Framework 2.0', margin, y);

  y += 22;
  doc.setTextColor(180, 180, 200); doc.setFontSize(10);
  doc.text(`Organisation: ${accountName}`, margin, y); y += 6;
  doc.text(`Assessment date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, y); y += 6;
  doc.text('Assessed by: Broad Peak Cyber', margin, y);

  y += 20;
  doc.setFillColor(40, 20, 70);
  doc.roundedRect(margin, y, W - margin * 2, 40, 4, 4, 'F');
  doc.setFontSize(42); doc.setFont('helvetica', 'bold');
  doc.setTextColor(...riskRgb);
  doc.text(`${overallScore}`, margin + 10, y + 28);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 140, 170);
  doc.text('/100  Overall Cyber Risk Score', margin + 10 + doc.getTextWidth(`${overallScore}`) + 3, y + 28);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.setTextColor(...riskRgb);
  doc.text(risk.label, W - margin - 55, y + 22);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 175);
  const descLines = doc.splitTextToSize(risk.description, 55);
  doc.text(descLines, W - margin - 55, y + 30);

  y += 55;
  doc.setFillColor(35, 15, 60);
  doc.roundedRect(margin, y, W - margin * 2, 28, 3, 3, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...pink);
  doc.text('FRAMEWORK ALIGNMENT', margin + 6, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 190);
  doc.text('NIST CSF 2.0 (2024) · NCSC Cyber Essentials · ISO/IEC 27001:2022 · UK GDPR / ICO', margin + 6, y + 15);
  doc.text('IBM Cost of a Data Breach 2025 · Verizon DBIR 2025 · Sophos State of Ransomware 2025', margin + 6, y + 22);

  y += 38;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('Score by NIST CSF 2.0 Function', margin, y); y += 8;

  NIST_FUNCTIONS.forEach(fn => {
    const score = calcFunctionScore(fn, answers);
    const c = fn.color.match(/\d+/g)!.map(Number) as [number, number, number];
    doc.setFillColor(40, 20, 70);
    doc.roundedRect(margin, y, W - margin * 2, 10, 1, 1, 'F');
    const barW = Math.max(2, ((W - margin * 2 - 50) * score) / 100);
    doc.setFillColor(...c);
    doc.roundedRect(margin + 45, y + 3, barW, 4, 1, 1, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...c);
    doc.text(fn.name, margin + 4, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 175);
    doc.text(fn.ref, margin + 32, y + 7);
    doc.setTextColor(...c);
    doc.text(`${score}%`, W - margin - 12, y + 7);
    y += 13;
  });

  doc.setFillColor(...pink); doc.rect(0, 285, W / 2, 12, 'F');
  doc.setFillColor(...blue); doc.rect(W / 2, 285, W / 2, 12, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8);
  doc.text('Broad Peak Cyber | broadpeakcyber.com', margin, 292);
  doc.text('CONFIDENTIAL', W - margin - 28, 292);

  NIST_FUNCTIONS.forEach(fn => {
    doc.addPage();
    doc.setFillColor(...lightGrey); doc.rect(0, 0, W, 297, 'F');
    const fnScore = calcFunctionScore(fn, answers);
    const fnColor = fn.color.match(/\d+/g)!.map(Number) as [number, number, number];

    doc.setFillColor(...darkBg); doc.rect(0, 0, W, 22, 'F');
    doc.setFillColor(...fnColor); doc.rect(0, 0, 4, 22, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(`${fn.ref}: ${fn.name}`, 10, 10);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(170, 170, 200);
    doc.text(fn.description, 10, 17);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    const sc = fnScore >= 80 ? [16, 185, 129] as [number,number,number] : fnScore >= 60 ? [245, 158, 11] as [number,number,number] : [239, 68, 68] as [number,number,number];
    doc.setTextColor(...sc);
    doc.text(`${fnScore}%`, W - margin - 16, 14);

    y = 32;
    fn.questions.forEach(q => {
      if (answers[q.id] === undefined) return;
      const ans = answers[q.id];
      if (y > 258) { doc.addPage(); doc.setFillColor(...lightGrey); doc.rect(0, 0, W, 297, 'F'); y = 20; }

      const cardH = ans === false ? 40 : 20;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, W - margin * 2, cardH, 2, 2, 'F');
      doc.setDrawColor(230, 230, 240);
      doc.roundedRect(margin, y, W - margin * 2, cardH, 2, 2, 'S');
      if (ans === true) doc.setFillColor(52, 211, 153);
      else if (ans === false) doc.setFillColor(239, 68, 68);
      else doc.setFillColor(200, 200, 220);
      doc.rect(margin, y, 3, cardH, 'F');

      doc.setFontSize(8.5); doc.setFont('helvetica', ans === false ? 'bold' : 'normal');
      doc.setTextColor(40, 40, 60);
      const qLines = doc.splitTextToSize(q.text, W - margin * 2 - 38);
      doc.text(qLines, margin + 6, y + 7);
      for (let i = 0; i < q.weight; i++) { doc.setFillColor(...fnColor); doc.circle(W - margin - 4 - (i * 5), y + 5, 1.2, 'F'); }

      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      if (ans === true) { doc.setTextColor(52, 211, 153); doc.text('✓ YES', W - margin - 20, y + 12); }
      else if (ans === false) { doc.setTextColor(239, 68, 68); doc.text('✗ NO', W - margin - 20, y + 12); }

      if (ans === false) {
        doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 100, 130);
        const gLines = doc.splitTextToSize('↳ ' + q.why, W - margin * 2 - 14);
        doc.text(gLines.slice(0, 2), margin + 6, y + 16);
        const prods = PRODUCT_MAP[q.id] || [];
        if (prods.length > 0) {
          doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...pink);
          doc.text('Broad Peak: ' + prods.slice(0, 2).join(' · '), margin + 6, y + 31);
        }
      }
      y += cardH + 3;
    });
  });

  doc.addPage();
  doc.setFillColor(...darkBg); doc.rect(0, 0, W, 297, 'F');
  y = 20;
  doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('Priority Recommendations', margin, y); y += 8;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 180);
  doc.text('Areas where Broad Peak Cyber can support improvement', margin, y); y += 14;

  const gaps = NIST_FUNCTIONS.flatMap(fn =>
    fn.questions.filter(q => answers[q.id] === false).map(q => ({ fn, q, prods: PRODUCT_MAP[q.id] || [] }))
  );
  const prodFreq: Record<string, number> = {};
  gaps.forEach(g => g.prods.forEach(p => { prodFreq[p] = (prodFreq[p] || 0) + 1; }));
  const topProds = Object.entries(prodFreq).sort((a, b) => b[1] - a[1]).slice(0, 6);

  if (topProds.length > 0) {
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...pink);
    doc.text('Recommended Solutions', margin, y); y += 8;
    topProds.forEach(([prod, count]) => {
      doc.setFillColor(40, 20, 70);
      doc.roundedRect(margin, y, W - margin * 2, 12, 2, 2, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text(prod, margin + 6, y + 8);
      doc.setTextColor(...pink);
      doc.text(`Addresses ${count} gap${count > 1 ? 's' : ''}`, W - margin - 32, y + 8);
      y += 15;
    });
    y += 5;
  }

  const critGaps = gaps.filter(g => g.q.weight === 3).slice(0, 8);
  if (critGaps.length > 0) {
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(239, 68, 68);
    doc.text(`${critGaps.length} Critical Gap${critGaps.length > 1 ? 's' : ''}`, margin, y); y += 8;
    critGaps.forEach(g => {
      if (y > 265) { doc.addPage(); doc.setFillColor(...darkBg); doc.rect(0, 0, W, 297, 'F'); y = 20; }
      doc.setFillColor(40, 10, 30);
      doc.roundedRect(margin, y, W - margin * 2, 14, 2, 2, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      const qLines = doc.splitTextToSize(g.q.text, W - margin * 2 - 14);
      doc.text(qLines[0], margin + 5, y + 6);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 175);
      doc.text(g.fn.name, margin + 5, y + 11);
      y += 17;
    });
  }

  y += 8;
  doc.setFillColor(40, 20, 70);
  doc.roundedRect(margin, y, W - margin * 2, 30, 3, 3, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('Speak to Broad Peak Cyber', margin + 8, y + 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(170, 170, 205);
  doc.text('Our security specialists can help you prioritise and remediate these findings.', margin + 8, y + 17);
  doc.text('Email: info@broadpeakcyber.com  |  broadpeakcyber.com', margin + 8, y + 24);

  doc.setFillColor(...pink); doc.rect(0, 285, W / 2, 12, 'F');
  doc.setFillColor(...blue); doc.rect(W / 2, 285, W / 2, 12, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8);
  doc.text('Broad Peak Cyber | broadpeakcyber.com', margin, 292);
  doc.text('CONFIDENTIAL', W - margin - 28, 292);

  doc.save(`BroadPeak-CyberRiskScore-${accountName.replace(/\s+/g, '')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CyberRiskScore({ accountName }: { accountName: string }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [queuedQuestions, setQueuedQuestions] = useState<(Question & { fnId: string })[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [started, setStarted] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!started) return;
    const queue: (Question & { fnId: string })[] = [];
    for (const fn of NIST_FUNCTIONS) {
      for (const q of fn.questions) {
        if (q.skipIf) {
          const depAns = answers[q.skipIf.questionId];
          if (depAns === q.skipIf.answer) continue;
        }
        queue.push({ ...q, fnId: fn.id });
      }
    }
    setQueuedQuestions(queue);
  }, [answers, started]);

  function getFn(qId: string) {
    return NIST_FUNCTIONS.find(fn => fn.questions.some(q => q.id === qId));
  }

  function answerQuestion(val: boolean) {
    const q = queuedQuestions[currentIdx];
    if (!q) return;
    setFade(true);
    setTimeout(() => {
      const newAnswers = { ...answers, [q.id]: val };
      setAnswers(newAnswers);
      setShowExample(false);
      if (currentIdx + 1 >= queuedQuestions.length) {
        setShowResults(true);
      } else {
        setCurrentIdx(i => i + 1);
      }
      setFade(false);
    }, 180);
  }

  function reset() {
    setAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
    setStarted(false);
    setQueuedQuestions([]);
    setShowExample(false);
  }

  const overallScore = calcOverallScore(answers);
  const risk = getRiskLevel(overallScore);
  const progress = queuedQuestions.length > 0 ? Math.round((currentIdx / queuedQuestions.length) * 100) : 0;
  const currentQuestion = queuedQuestions[currentIdx];
  const currentFn = currentQuestion ? getFn(currentQuestion.id) : undefined;

  // ── Landing ──────────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="space-y-5">
        {/* Hero */}
        <div className="rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #06b6d4)' }} />
          <div className="bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#1f2937]">Cyber Risk Score</h2>
                <p className="text-[#6b7280] text-sm leading-relaxed mt-1">
                  An adaptive assessment based on the <strong>NIST Cybersecurity Framework 2.0</strong> — the globally recognised standard for cyber risk management. Each question includes real-world context and statistics to help you understand exactly why it matters.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NIST Functions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {NIST_FUNCTIONS.map(fn => (
            <div key={fn.id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: fn.color }}>
                  {fn.ref}
                </div>
                <span className="text-sm font-bold text-[#1f2937]">{fn.name}</span>
              </div>
              <p className="text-xs text-[#9ca3af] leading-snug">{fn.tagline}</p>
              <div className="mt-2 text-[10px] text-[#9ca3af]">{fn.questions.length} questions</div>
            </div>
          ))}
        </div>

        {/* What to expect */}
        <div className="bg-[#f0f6ff] border border-[#4494D130] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-[#4494D1] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-[#1f2937] mb-1">Adaptive & contextual</div>
              <div className="text-xs text-[#6b7280] leading-relaxed">
                Questions adapt based on your answers — some follow-ups are skipped if they aren't relevant to you. Each question includes <strong>why it matters</strong>, a <strong>real-world example</strong>, and the <strong>NIST CSF reference</strong>. Takes approximately 5–8 minutes. A branded PDF report with product recommendations is generated at the end.
              </div>
            </div>
          </div>
        </div>

        {/* Stats teaser */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { stat: '241 days', label: 'Average breach dwell time without monitoring', source: 'IBM 2025' },
            { stat: '$1.5M', label: 'Average saving for orgs with an IR plan', source: 'IBM 2025' },
            { stat: '60%', label: 'Of breaches involve the human element', source: 'Verizon DBIR 2025' },
          ].map(s => (
            <div key={s.stat} className="bg-white border border-[#e5e7eb] rounded-xl p-3 text-center shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-lg font-bold text-[#C65793]">{s.stat}</div>
              <div className="text-[10px] text-[#6b7280] leading-snug mt-1">{s.label}</div>
              <div className="text-[9px] text-[#9ca3af] mt-1">{s.source}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setStarted(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-white rounded-xl font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
          Begin Risk Assessment <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (showResults) {
    const fnScores = NIST_FUNCTIONS.map(fn => ({ ...fn, score: calcFunctionScore(fn, answers) }));
    const gaps = NIST_FUNCTIONS.flatMap(fn =>
      fn.questions.filter(q => answers[q.id] === false).map(q => ({ fn, q }))
    );
    const prodFreq: Record<string, number> = {};
    gaps.forEach(g => (PRODUCT_MAP[g.q.id] || []).forEach(p => { prodFreq[p] = (prodFreq[p] || 0) + 1; }));
    const topProds = Object.entries(prodFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const weakest = [...fnScores].sort((a, b) => a.score - b.score).slice(0, 3).filter(f => f.score < 80);

    return (
      <div className="space-y-5">
        {/* Score card */}
        <div className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #06b6d4)' }} />
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1f2937]">Cyber Risk Score</h2>
                <p className="text-[#9ca3af] text-sm">{accountName} · NIST CSF 2.0</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold" style={{ color: risk.color }}>{overallScore}</div>
                <div className="text-xs text-[#9ca3af]">/ 100</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: risk.bgColor, border: `1px solid ${risk.color}40` }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: risk.color }} />
              <div>
                <span className="text-sm font-bold" style={{ color: risk.color }}>{risk.label}</span>
                <span className="text-sm text-[#6b7280] ml-2">{risk.description}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {fnScores.map(fn => {
                const fnRisk = getRiskLevel(fn.score);
                return (
                  <div key={fn.id} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center text-white" style={{ background: fn.color }}>{fn.ref}</div>
                        <span className="text-xs font-semibold text-[#1f2937]">{fn.name}</span>
                      </div>
                      <div className="text-base font-bold" style={{ color: fnRisk.color }}>{fn.score}%</div>
                    </div>
                    <div className="h-1.5 bg-[#f3f4f6] rounded-full">
                      <div className="h-1.5 rounded-full" style={{ width: `${fn.score}%`, backgroundColor: fnRisk.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 flex-wrap">
              <button onClick={() => generateRiskPDF(answers, accountName)}
                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #C65793, #4494D1)' }}>
                <Download className="w-4 h-4" /> Download PDF Report
              </button>
              <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 bg-[#f3f4f6] text-[#6b7280] rounded-xl text-sm hover:bg-[#e5e7eb] transition-colors">
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
            </div>
          </div>
        </div>

        {weakest.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#1f2937] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Priority Areas
            </h3>
            <div className="space-y-3">
              {weakest.map(fn => (
                <div key={fn.id} className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.06)] rounded-xl p-4" style={{ borderLeftColor: fn.color, borderLeftWidth: 3 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold" style={{ color: fn.color }}>{fn.ref}: {fn.name}</span>
                    <span className="text-base font-bold" style={{ color: getRiskLevel(fn.score).color }}>{fn.score}%</span>
                  </div>
                  <p className="text-xs text-[#6b7280] mb-2">{fn.tagline}</p>
                  {fn.bpProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {fn.bpProducts.slice(0, 3).map(p => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color: fn.color, borderColor: fn.color + '40', background: fn.color + '0a' }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {topProds.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#1f2937] mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#C65793]" /> Broad Peak Recommendations
            </h3>
            <div className="space-y-2">
              {topProds.map(([prod, count]) => (
                <div key={prod} className="flex items-center gap-3 p-3 bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.05)] rounded-xl">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #C65793, #4494D1)' }} />
                  <span className="text-sm text-[#1f2937] font-medium flex-1">{prod}</span>
                  <span className="text-xs text-[#9ca3af]">Addresses {count} gap{count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gaps.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#1f2937] mb-3">All Gaps ({gaps.length})</h3>
            <div className="space-y-2">
              {NIST_FUNCTIONS.map(fn => {
                const fnGaps = gaps.filter(g => g.fn.id === fn.id);
                if (fnGaps.length === 0) return null;
                return (
                  <div key={fn.id} className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                    <div className="px-4 py-2 flex items-center gap-2" style={{ background: fn.color + '10', borderBottom: `1px solid ${fn.color}25` }}>
                      <div className="w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center text-white" style={{ background: fn.color }}>{fn.ref}</div>
                      <span className="text-xs font-bold" style={{ color: fn.color }}>{fn.name}</span>
                      <span className="text-xs text-[#9ca3af] ml-auto">{fnGaps.length} gap{fnGaps.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {fnGaps.map(({ q }) => (
                        <div key={q.id} className="flex items-start gap-2">
                          <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs text-[#1f2937]">{q.text}</div>
                            {(PRODUCT_MAP[q.id] || []).length > 0 && (
                              <div className="text-[10px] text-[#C65793] mt-0.5">→ {(PRODUCT_MAP[q.id] || []).join(' · ')}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {gaps.length === 0 && (
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-5 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-700">Excellent posture — no gaps identified</div>
              <div className="text-xs text-emerald-600 mt-1">Your organisation demonstrates strong alignment with NIST CSF 2.0. Continue regular reviews to maintain this posture.</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Question view ──────────────────────────────────────────────────────────
  if (!currentQuestion) return <div className="text-[#9ca3af] text-sm text-center py-8">Preparing questions...</div>;

  const recentAnswers = queuedQuestions.slice(Math.max(0, currentIdx - 3), currentIdx).map(q => ({
    q, ans: answers[q.id], fn: getFn(q.id),
  }));

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-[#9ca3af] mb-1.5">
          <span>Question {currentIdx + 1} of ~{queuedQuestions.length}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-1.5 bg-[#f3f4f6] rounded-full">
          <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)' }} />
        </div>
      </div>

      {/* Function indicators */}
      <div className="flex gap-1">
        {NIST_FUNCTIONS.map(fn => (
          <div key={fn.id} className="flex-1 h-1 rounded-full transition-all"
            style={{ background: fn.id === currentFn?.id ? fn.color : fn.color + '25' }} />
        ))}
      </div>

      {/* Function context */}
      {currentFn && (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: currentFn.color }}>
              {currentFn.ref}
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: currentFn.color }}>{currentFn.ref}: {currentFn.name}</div>
              <div className="text-xs text-[#9ca3af]">{currentFn.tagline}</div>
            </div>
          </div>
        </div>
      )}

      {/* Question card */}
      <div className={`bg-white border-2 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 ${fade ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
        style={{ borderColor: (currentFn?.color || '#e5e7eb') + '60' }}>

        {/* Weight indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < currentQuestion.weight ? (currentFn?.color || '#9ca3af') : '#f3f4f6' }} />
            ))}
          </div>
          <span className="text-[10px] text-[#9ca3af]">
            {currentQuestion.weight === 3 ? 'High importance' : currentQuestion.weight === 2 ? 'Medium importance' : 'Standard'}
          </span>
        </div>

        <h3 className="text-base font-bold text-[#1f2937] mb-4 leading-snug">{currentQuestion.text}</h3>

        {/* Why it matters */}
        <div className="mb-3 p-3 rounded-xl border" style={{ background: (currentFn?.color || '#6b7280') + '08', borderColor: (currentFn?.color || '#e5e7eb') + '30' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: currentFn?.color || '#6b7280' }} />
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: currentFn?.color || '#6b7280' }}>Why this matters</span>
          </div>
          <p className="text-xs text-[#374151] leading-relaxed">{currentQuestion.why}</p>
        </div>

        {/* NIST ref */}
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full border font-mono" style={{ color: currentFn?.color, borderColor: (currentFn?.color || '#e5e7eb') + '40', background: (currentFn?.color || '#e5e7eb') + '0a' }}>
            {currentQuestion.guidance.match(/NIST CSF [\w.-]+/)?.[0] || 'NIST CSF 2.0'}
          </span>
        </div>

        {/* Example toggle */}
        <button onClick={() => setShowExample(v => !v)}
          className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#6b7280] mb-4 transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
          {showExample ? 'Hide example' : 'See a real-world example'}
        </button>

        {showExample && (
          <div className="mb-4 p-3 bg-[#f0f6ff] border border-[#4494D130] rounded-xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="w-3.5 h-3.5 text-[#4494D1]" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#4494D1]">Real-world example</span>
            </div>
            <p className="text-xs text-[#374151] leading-relaxed">{currentQuestion.example}</p>
          </div>
        )}

        {/* Guidance */}
        <div className="mb-5 p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#9ca3af] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#6b7280] leading-relaxed">{currentQuestion.guidance.replace(/^NIST CSF [\w.-]+\.\s*/, '')}</p>
          </div>
        </div>

        {/* Answer buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => answerQuestion(true)}
            className="flex items-center justify-center gap-2 py-4 bg-[#f0fdf4] border-2 border-[#10b981] text-[#059669] rounded-xl font-bold text-sm hover:bg-[#dcfce7] transition-all">
            <CheckCircle className="w-5 h-5" /> Yes
          </button>
          <button onClick={() => answerQuestion(false)}
            className="flex items-center justify-center gap-2 py-4 bg-[#fef2f2] border-2 border-[#ef4444] text-[#dc2626] rounded-xl font-bold text-sm hover:bg-[#fee2e2] transition-all">
            <XCircle className="w-5 h-5" /> No
          </button>
        </div>
      </div>

      {/* Recent trail */}
      {recentAnswers.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">Recent answers</div>
          {recentAnswers.map(({ q, ans, fn }) => (
            <div key={q.id} className="flex items-center gap-2.5 p-2.5 bg-white border border-[#e5e7eb] rounded-lg">
              {ans === true
                ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
              <span className="text-[10px] font-bold flex-shrink-0" style={{ color: fn?.color }}>{fn?.ref}</span>
              <span className="text-xs text-[#9ca3af] truncate">{q.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
