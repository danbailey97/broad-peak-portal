import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ChevronRight, Download, RotateCcw, Shield, AlertTriangle, TrendingUp, Info, Minus } from 'lucide-react';
import { jsPDF } from 'jspdf';

// ── NIST CSF 2.0 Framework ────────────────────────────────────────────────────
// Six functions: GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER

interface Question {
  id: string;
  text: string;
  guidance: string;
  weight: number; // 1–3, higher = more critical
  skipIf?: { questionId: string; answer: boolean }; // adaptive skip logic
  followUpIf?: { answer: boolean; questionId: string }; // triggers follow-up
}

interface NISTFunction {
  id: string;
  name: string;
  ref: string;
  description: string;
  color: string;
  questions: Question[];
  bpProducts: string[]; // Broad Peak products relevant if score low
}

const NIST_FUNCTIONS: NISTFunction[] = [
  {
    id: 'govern',
    name: 'Govern',
    ref: 'GV',
    description: 'Organisational context, risk strategy, supply chain risk management, and cybersecurity policy',
    color: '#8b5cf6',
    bpProducts: ['CyberSmart Active Protect', 'Arctic Wolf Managed Risk'],
    questions: [
      { id: 'gv1', text: 'Does your organisation have a documented cybersecurity policy approved by senior leadership?', guidance: 'NIST CSF GV.OC-01: A formal policy sets accountability and demonstrates board-level commitment.', weight: 3 },
      { id: 'gv2', text: 'Do you conduct regular cybersecurity risk assessments (at least annually)?', guidance: 'NIST CSF GV.RM-01: Risk assessments form the foundation of a risk-based security programme.', weight: 3 },
      { id: 'gv3', text: 'Are cybersecurity roles and responsibilities clearly defined for all staff?', guidance: 'NIST CSF GV.RR-01: Every person should know their security responsibilities.', weight: 2 },
      { id: 'gv4', text: 'Do you assess cybersecurity risks posed by your key suppliers and third parties?', guidance: 'NIST CSF GV.SC-01: Supply chain risk is a top NCSC concern — one compromised supplier can affect many clients.', weight: 2 },
      { id: 'gv5', text: 'Does your board or senior leadership receive regular cybersecurity risk updates?', guidance: 'NIST CSF GV.OC-02: Executive visibility is a key differentiator in mature security programmes.', weight: 2 },
    ],
  },
  {
    id: 'identify',
    name: 'Identify',
    ref: 'ID',
    description: 'Asset management, risk assessment, and understanding business context',
    color: '#3b82f6',
    bpProducts: ['CyberSmart Active Protect', 'Arctic Wolf Managed Risk'],
    questions: [
      { id: 'id1', text: 'Do you maintain a complete and up-to-date inventory of all hardware assets (devices, servers, network equipment)?', guidance: 'NIST CSF ID.AM-01: You cannot protect what you cannot see. Asset visibility is foundational.', weight: 3 },
      { id: 'id2', text: 'Do you maintain an inventory of all software, applications, and cloud services in use?', guidance: 'NIST CSF ID.AM-02: Shadow IT is a major risk. All software should be known and approved.', weight: 2 },
      { id: 'id3', text: 'Have you identified and classified your most critical and sensitive data (e.g. customer data, financial records)?', guidance: 'NIST CSF ID.AM-07: Data classification drives appropriate protection levels.', weight: 3 },
      { id: 'id4', text: 'Do you understand which of your systems and processes are critical to business operations?', guidance: 'NIST CSF ID.BE-04: Knowing your critical assets enables prioritised protection and recovery planning.', weight: 2 },
      { id: 'id5', text: 'Are cybersecurity vulnerabilities in your systems identified and tracked (e.g. via regular vulnerability scanning)?', guidance: 'NIST CSF ID.RA-01: Proactive vulnerability identification is far less costly than reactive breach response.', weight: 3 },
    ],
  },
  {
    id: 'protect',
    name: 'Protect',
    ref: 'PR',
    description: 'Identity management, access control, awareness training, data security, and platform security',
    color: '#10b981',
    bpProducts: ['Barracuda Email Gateway Defense', 'Barracuda CloudGen Firewall', 'WatchGuard Firebox', 'WatchGuard AuthPoint', 'Boxphish Security Awareness Training', 'Keepit Microsoft 365 Backup', 'Druva inSync'],
    questions: [
      { id: 'pr1', text: 'Is multi-factor authentication (MFA) enforced for all cloud services, email, and remote access?', guidance: 'NIST CSF PR.AA-03: MFA is the single most effective control against credential-based attacks. IBM 2025 reports it prevents 99% of automated attacks.', weight: 3 },
      { id: 'pr2', text: 'Is the principle of least privilege applied — users only have access to the data and systems they need for their role?', guidance: 'NIST CSF PR.AA-05: Over-privileged accounts dramatically increase the blast radius of any breach.', weight: 3 },
      { id: 'pr3', text: 'Do all staff receive regular security awareness training (at least annually)?', guidance: 'NIST CSF PR.AT-01: Verizon DBIR 2025 found the human element involved in 60% of breaches. Training measurably reduces risk.', weight: 3 },
      { id: 'pr3b', text: 'Do you conduct simulated phishing exercises to test staff awareness?', guidance: 'Phishing simulation is more effective than training alone. KnowBe4 research shows 86% reduction in click rates with combined training and simulation.', weight: 2, skipIf: { questionId: 'pr3', answer: false } },
      { id: 'pr4', text: 'Is critical business data backed up regularly, with backups tested for restoration?', guidance: 'NIST CSF PR.DS-01: Untested backups are not backups. Sophos 2025 found only 53% of ransomware victims successfully recovered from backup.', weight: 3 },
      { id: 'pr4b', text: 'Are backups stored offline or in an immutable cloud location (cannot be modified or deleted by ransomware)?', guidance: 'Air-gapped or immutable backups are critical — ransomware increasingly targets connected backup solutions.', weight: 3, skipIf: { questionId: 'pr4', answer: false } },
      { id: 'pr5', text: 'Is email protected with anti-phishing, anti-spoofing, and malware scanning (beyond basic Microsoft/Google defaults)?', guidance: 'NIST CSF PR.PS-01: Native M365/Google email protection has significant gaps. The FBI recorded $3B+ in BEC losses in 2025.', weight: 3 },
      { id: 'pr6', text: 'Are all devices (laptops, desktops, mobiles) protected with endpoint security software?', guidance: 'NIST CSF PR.PS-02: Endpoint protection is a minimum baseline. EDR provides significantly better protection than legacy AV.', weight: 3 },
      { id: 'pr7', text: 'Is your network segmented so that a compromise of one area cannot easily spread to others?', guidance: 'NIST CSF PR.IR-04: Network segmentation contains lateral movement and limits the blast radius of a successful attack.', weight: 2 },
      { id: 'pr8', text: 'Are all systems patched with security updates within 14 days of release for critical vulnerabilities?', guidance: 'NIST CSF PR.PS-04: Verizon DBIR 2025 found exploitation of vulnerabilities grew 34% YoY. Rapid patching is critical.', weight: 3 },
    ],
  },
  {
    id: 'detect',
    name: 'Detect',
    ref: 'DE',
    description: 'Continuous monitoring, adverse event analysis, and anomaly detection',
    color: '#f59e0b',
    bpProducts: ['Arctic Wolf MDR', 'WatchGuard MDR', 'Barracuda XDR'],
    questions: [
      { id: 'de1', text: 'Do you have security monitoring in place that can detect unusual or suspicious activity across your network and systems?', guidance: 'NIST CSF DE.CM-01: IBM 2025 found the average breach goes undetected for 241 days without monitoring. Early detection dramatically cuts costs.', weight: 3 },
      { id: 'de2', text: 'Are security logs collected and reviewed from key systems (firewalls, servers, identity systems, email)?', guidance: 'NIST CSF DE.CM-03: Log collection without review is meaningless. Logs must be analysed for indicators of compromise.', weight: 2 },
      { id: 'de3', text: 'Do you have 24/7 security monitoring capability (either in-house or via a managed SOC/MDR provider)?', guidance: 'NIST CSF DE.CM-09: Most attacks occur outside business hours. 24/7 monitoring is essential for meaningful detection.', weight: 3, skipIf: { questionId: 'de1', answer: false } },
      { id: 'de4', text: 'Do you receive threat intelligence feeds or alerts about new vulnerabilities relevant to your systems?', guidance: 'NIST CSF DE.AE-02: Threat intelligence enables proactive rather than reactive security posture.', weight: 2 },
    ],
  },
  {
    id: 'respond',
    name: 'Respond',
    ref: 'RS',
    description: 'Incident response planning, communications, analysis, and mitigation',
    color: '#ef4444',
    bpProducts: ['Arctic Wolf MDR', 'WatchGuard MDR', 'Barracuda XDR'],
    questions: [
      { id: 'rs1', text: 'Do you have a documented Incident Response Plan that defines how to handle a cyberattack or data breach?', guidance: 'NIST CSF RS.MA-01: Without a plan, breach response is chaotic. IBM 2025 found organisations with IR plans save an average of $1.5M per breach.', weight: 3 },
      { id: 'rs2', text: 'Has your incident response plan been tested or exercised in the past 12 months (e.g. tabletop exercise)?', guidance: 'NIST CSF RS.MA-04: Plans that have never been tested will fail under pressure. Regular exercises build muscle memory.', weight: 2, skipIf: { questionId: 'rs1', answer: false } },
      { id: 'rs3', text: 'Do you know your legal obligations in the event of a personal data breach (e.g. ICO notification within 72 hours under GDPR)?', guidance: 'NIST CSF RS.CO-02: GDPR requires notification to the ICO within 72 hours of becoming aware of a personal data breach.', weight: 2 },
      { id: 'rs4', text: 'Do you have pre-agreed relationships with external cybersecurity support for incident response assistance?', guidance: 'NIST CSF RS.CO-05: Having external IR support on retainer reduces response time and cost significantly.', weight: 2 },
    ],
  },
  {
    id: 'recover',
    name: 'Recover',
    ref: 'RC',
    description: 'Recovery planning, restoration of capabilities, and lessons learned',
    color: '#06b6d4',
    bpProducts: ['Keepit Microsoft 365 Backup', 'Druva inSync', 'Druva Phoenix', 'Barracuda Cloud-to-Cloud Backup'],
    questions: [
      { id: 'rc1', text: 'Do you have a Business Continuity Plan (BCP) or Disaster Recovery Plan (DRP) covering a major cyberattack?', guidance: 'NIST CSF RC.RP-01: A cyber incident affecting your IT infrastructure requires a specific recovery plan — generic BCP is insufficient.', weight: 3 },
      { id: 'rc2', text: 'Have you defined and tested Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) for critical systems?', guidance: 'NIST CSF RC.RP-03: Without defined RTOs/RPOs, you cannot know whether your recovery capability meets business needs.', weight: 2, skipIf: { questionId: 'rc1', answer: false } },
      { id: 'rc3', text: 'Can you restore critical systems and data within an acceptable timeframe following a ransomware attack?', guidance: 'NIST CSF RC.RP-05: Sophos 2025 found mean remediation cost of $1.84M. Recovery capability directly impacts this figure.', weight: 3 },
      { id: 'rc4', text: 'Do you conduct post-incident reviews to learn from security events and improve your defences?', guidance: 'NIST CSF RC.IM-01: Lessons learned reviews are how organisations mature their security posture over time.', weight: 2 },
    ],
  },
];

const TOTAL_QUESTIONS = NIST_FUNCTIONS.reduce((sum, f) => sum + f.questions.length, 0);

// Risk level per score
function getRiskLevel(score: number): { label: string; color: string; description: string } {
  if (score >= 80) return { label: 'Low Risk', color: '#34d399', description: 'Strong security posture. Focus on continuous improvement.' };
  if (score >= 60) return { label: 'Medium Risk', color: '#fbbf24', description: 'Reasonable baseline with notable gaps requiring attention.' };
  if (score >= 40) return { label: 'High Risk', color: '#f97316', description: 'Significant gaps across multiple areas. Prioritised action required.' };
  return { label: 'Critical Risk', color: '#ef4444', description: 'Fundamental controls missing. Immediate remediation essential.' };
}

// BP product recommendations per gap
const PRODUCT_MAP: Record<string, string[]> = {
  gv1: ['CyberSmart Active Protect'],
  gv2: ['Arctic Wolf Managed Risk', 'CyberSmart Active Protect'],
  gv4: ['CyberSmart Active Protect'],
  id1: ['CyberSmart Active Protect'],
  id2: ['CyberSmart Active Protect'],
  id5: ['Arctic Wolf Managed Risk', 'CyberSmart Cyber Essentials Plus'],
  pr1: ['WatchGuard AuthPoint'],
  pr2: ['WatchGuard AuthPoint'],
  pr3: ['Boxphish Security Awareness Training'],
  pr3b: ['Boxphish Security Awareness Training'],
  pr4: ['Keepit Microsoft 365 Backup', 'Druva inSync'],
  pr4b: ['Keepit Microsoft 365 Backup', 'Druva Phoenix'],
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
  rc1: ['Keepit Microsoft 365 Backup', 'Druva Phoenix'],
  rc2: ['Keepit Microsoft 365 Backup', 'Druva Phoenix'],
  rc3: ['Keepit Microsoft 365 Backup', 'Druva inSync', 'Druva Phoenix', 'BullWall Ransomware Containment'],
};

type Answers = Record<string, boolean | null>;

// Weighted score calculation
function calcFunctionScore(fn: NISTFunction, answers: Answers): number {
  let totalWeight = 0, earnedWeight = 0;
  for (const q of fn.questions) {
    if (answers[q.id] === undefined) continue; // skipped
    if (answers[q.id] === null) continue; // not answered
    totalWeight += q.weight;
    if (answers[q.id] === true) earnedWeight += q.weight;
  }
  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}

function calcOverallScore(answers: Answers): number {
  const scores = NIST_FUNCTIONS.map(f => calcFunctionScore(f, answers));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ── PDF Generation ────────────────────────────────────────────────────────────
function generateRiskPDF(answers: Answers, accountName: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 18;
  let y = 0;

  const pink: [number,number,number] = [198, 87, 147];
  const blue: [number,number,number] = [68, 148, 209];
  const darkBg: [number,number,number] = [26, 10, 46];
  const lightGrey: [number,number,number] = [248, 248, 252];

  const overallScore = calcOverallScore(answers);
  const risk = getRiskLevel(overallScore);
  const riskColor = risk.color.match(/\d+/g)!.map(Number) as [number,number,number];

  // ── Cover ──────────────────────────────────────────────────────────────────
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, W, 297, 'F');
  doc.setFillColor(...pink); doc.rect(0, 0, W/2, 4, 'F');
  doc.setFillColor(...blue); doc.rect(W/2, 0, W/2, 4, 'F');

  y = 55;
  doc.setTextColor(255,255,255); doc.setFontSize(28); doc.setFont('helvetica','bold');
  doc.text('Cyber Risk Score', margin, y); y += 12;
  doc.text('Assessment Report', margin, y); y += 10;
  doc.setFontSize(14); doc.setFont('helvetica','normal');
  doc.setTextColor(...pink);
  doc.text('Based on NIST Cybersecurity Framework 2.0', margin, y);

  y += 22;
  doc.setTextColor(180,180,200); doc.setFontSize(10);
  doc.text(`Organisation: ${accountName}`, margin, y); y += 6;
  doc.text(`Assessment date: ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}`, margin, y); y += 6;
  doc.text('Assessed by: Broad Peak Cyber', margin, y);

  // Score block
  y += 20;
  doc.setFillColor(40,20,70);
  doc.roundedRect(margin, y, W-margin*2, 40, 4, 4, 'F');
  doc.setFontSize(42); doc.setFont('helvetica','bold');
  doc.setTextColor(...riskColor);
  doc.text(`${overallScore}`, margin+10, y+26);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.setTextColor(140,140,170);
  doc.text('/100  Overall Cyber Risk Score', margin+10+doc.getTextWidth(`${overallScore}`)+3, y+26);
  doc.setFontSize(13); doc.setFont('helvetica','bold');
  doc.setTextColor(...riskColor);
  doc.text(risk.label, W-margin-55, y+20);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.setTextColor(150,150,175);
  const descLines = doc.splitTextToSize(risk.description, 55);
  doc.text(descLines, W-margin-55, y+28);

  // Framework reference
  y += 55;
  doc.setFillColor(35,15,60);
  doc.roundedRect(margin, y, W-margin*2, 28, 3, 3, 'F');
  doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.setTextColor(...pink);
  doc.text('FRAMEWORK ALIGNMENT', margin+6, y+8);
  doc.setFont('helvetica','normal'); doc.setTextColor(160,160,190);
  doc.text('NIST CSF 2.0 (2024) · NCSC Cyber Essentials · ISO/IEC 27001:2022 · ICO UK GDPR', margin+6, y+15);
  doc.text('IBM Cost of a Data Breach 2025 · Verizon DBIR 2025 · Sophos State of Ransomware 2025', margin+6, y+22);

  // Function score mini-bars on cover
  y += 38;
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
  doc.text('Score by NIST CSF 2.0 Function', margin, y); y += 8;

  NIST_FUNCTIONS.forEach(fn => {
    const score = calcFunctionScore(fn, answers);
    const c = fn.color.match(/\d+/g)!.map(Number) as [number,number,number];
    doc.setFillColor(40,20,70);
    doc.roundedRect(margin, y, W-margin*2, 10, 1, 1, 'F');
    const barW = Math.max(2, ((W-margin*2-50)*score)/100);
    doc.setFillColor(...c);
    doc.roundedRect(margin+45, y+3, barW, 4, 1, 1, 'F');
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...c);
    doc.text(fn.name, margin+4, y+7);
    doc.setFont('helvetica','normal'); doc.setTextColor(150,150,175);
    doc.text(fn.ref, margin+32, y+7);
    doc.setTextColor(...c);
    doc.text(`${score}%`, W-margin-12, y+7);
    y += 13;
  });

  // Bottom bar
  doc.setFillColor(...pink); doc.rect(0,285,W/2,12,'F');
  doc.setFillColor(...blue); doc.rect(W/2,285,W/2,12,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(8);
  doc.text('Broad Peak Cyber | broadpeakcyber.com', margin, 292);
  doc.text('CONFIDENTIAL', W-margin-28, 292);

  // ── Per-function pages ─────────────────────────────────────────────────────
  NIST_FUNCTIONS.forEach(fn => {
    doc.addPage();
    doc.setFillColor(...lightGrey); doc.rect(0,0,W,297,'F');

    const fnScore = calcFunctionScore(fn, answers);
    const fnRisk = getRiskLevel(fnScore);
    const fnColor = fn.color.match(/\d+/g)!.map(Number) as [number,number,number];

    // Header
    doc.setFillColor(...darkBg); doc.rect(0,0,W,22,'F');
    doc.setFillColor(...fnColor); doc.rect(0,0,4,22,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.text(`${fn.ref}: ${fn.name}`, 10, 10);
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(170,170,200);
    doc.text(fn.description, 10, 17);
    // Score badge
    doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.setTextColor(fnScore >= 80 ? 52 : fnScore >= 60 ? 251 : 239, fnScore >= 80 ? 211 : fnScore >= 60 ? 191 : 68, fnScore >= 80 ? 153 : fnScore >= 60 ? 36 : 68);
    doc.text(`${fnScore}%`, W-margin-16, 14);

    y = 32;
    fn.questions.forEach(q => {
      if (answers[q.id] === undefined) return; // skipped
      const ans = answers[q.id];
      if (y > 258) { doc.addPage(); doc.setFillColor(...lightGrey); doc.rect(0,0,W,297,'F'); y = 20; }

      const cardH = ans === false ? 38 : 20;
      doc.setFillColor(255,255,255);
      doc.roundedRect(margin, y, W-margin*2, cardH, 2, 2, 'F');
      doc.setDrawColor(230,230,240);
      doc.roundedRect(margin, y, W-margin*2, cardH, 2, 2, 'S');
      if (ans === true) doc.setFillColor(52,211,153);
      else if (ans === false) doc.setFillColor(239,68,68);
      else doc.setFillColor(200,200,220);
      doc.rect(margin, y, 3, cardH, 'F');

      doc.setFontSize(8.5); doc.setFont('helvetica', ans===false?'bold':'normal');
      doc.setTextColor(40,40,60);
      const qLines = doc.splitTextToSize(q.text, W-margin*2-38);
      doc.text(qLines, margin+6, y+7);
      // Weight dots
      for(let i=0;i<q.weight;i++) { doc.setFillColor(...fnColor); doc.circle(W-margin-4-(i*5), y+5, 1.2, 'F'); }

      doc.setFontSize(7.5); doc.setFont('helvetica','bold');
      if (ans===true) { doc.setTextColor(52,211,153); doc.text('✓ YES', W-margin-20, y+12); }
      else if (ans===false) { doc.setTextColor(239,68,68); doc.text('✗ NO', W-margin-20, y+12); }

      if (ans === false) {
        doc.setFontSize(7); doc.setFont('helvetica','italic'); doc.setTextColor(100,100,130);
        const gLines = doc.splitTextToSize('↳ ' + q.guidance, W-margin*2-14);
        doc.text(gLines.slice(0,2), margin+6, y+16);

        // BP product recs
        const prods = PRODUCT_MAP[q.id] || [];
        if (prods.length > 0) {
          doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...pink);
          doc.text('Broad Peak: ' + prods.slice(0,2).join(' · '), margin+6, y+29);
        }
      }
      y += cardH + 3;
    });
  });

  // ── Recommendations summary page ──────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...darkBg); doc.rect(0,0,W,297,'F');
  y = 20;
  doc.setTextColor(255,255,255); doc.setFontSize(18); doc.setFont('helvetica','bold');
  doc.text('Priority Recommendations', margin, y); y += 8;
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(150,150,180);
  doc.text('Areas where Broad Peak Cyber can support improvement', margin, y); y += 14;

  // Collect all "No" answers with products
  const gaps = NIST_FUNCTIONS.flatMap(fn =>
    fn.questions
      .filter(q => answers[q.id] === false)
      .map(q => ({ fn: fn.name, fnColor: fn.color, q, prods: PRODUCT_MAP[q.id] || [] }))
  );

  // Deduplicate product recommendations
  const prodFreq: Record<string,number> = {};
  gaps.forEach(g => g.prods.forEach(p => { prodFreq[p] = (prodFreq[p]||0)+1; }));
  const topProds = Object.entries(prodFreq).sort((a,b)=>b[1]-a[1]).slice(0,6);

  if (topProds.length > 0) {
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...pink);
    doc.text('Recommended Solutions', margin, y); y += 8;

    topProds.forEach(([prod, count]) => {
      doc.setFillColor(40,20,70);
      doc.roundedRect(margin, y, W-margin*2, 12, 2, 2, 'F');
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
      doc.text(prod, margin+6, y+8);
      doc.setTextColor(...pink);
      doc.text(`Addresses ${count} gap${count>1?'s':''}`, W-margin-32, y+8);
      y += 15;
    });
    y += 5;
  }

  // Critical gaps (weight 3, answered No)
  const critGaps = gaps.filter(g => g.q.weight === 3).slice(0,8);
  if (critGaps.length > 0) {
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(239,68,68);
    doc.text(`${critGaps.length} Critical Gap${critGaps.length>1?'s':''}`, margin, y); y += 8;
    critGaps.forEach(g => {
      if (y > 265) { doc.addPage(); doc.setFillColor(...darkBg); doc.rect(0,0,W,297,'F'); y=20; }
      doc.setFillColor(40,10,30);
      doc.roundedRect(margin, y, W-margin*2, 14, 2, 2, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
      const qLines = doc.splitTextToSize(g.q.text, W-margin*2-14);
      doc.text(qLines[0], margin+5, y+6);
      doc.setFont('helvetica','normal'); doc.setTextColor(150,150,175);
      doc.text(g.fn, margin+5, y+11);
      y += 17;
    });
  }

  // References
  y += 8;
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(150,150,175);
  doc.text('References & Frameworks', margin, y); y += 6;
  doc.setFontSize(7.5); doc.setFont('helvetica','normal');
  const refs = [
    'NIST Cybersecurity Framework 2.0 (2024) — nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf',
    'IBM Cost of a Data Breach Report 2025 — ibm.com/reports/data-breach',
    'Verizon 2025 Data Breach Investigations Report — verizon.com/business/resources/reports',
    'Sophos State of Ransomware in Enterprise 2025 — sophos.com',
    'NCSC Cyber Essentials Scheme — ncsc.gov.uk/cyberessentials',
    'ISO/IEC 27001:2022 — iso.org/standard/27001',
    'ICO UK GDPR Guidance — ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources',
  ];
  refs.forEach(r => { doc.setTextColor(120,120,150); doc.text(r, margin, y); y += 5; });

  // CTA
  y += 8;
  doc.setFillColor(40,20,70);
  doc.roundedRect(margin, y, W-margin*2, 30, 3, 3, 'F');
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
  doc.text('Speak to Broad Peak Cyber', margin+8, y+10);
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(170,170,205);
  doc.text('Our security specialists can help you prioritise and remediate these findings.', margin+8, y+17);
  doc.text('Email: info@broadpeakcyber.com  |  broadpeakcyber.com', margin+8, y+24);

  doc.setFillColor(...pink); doc.rect(0,285,W/2,12,'F');
  doc.setFillColor(...blue); doc.rect(W/2,285,W/2,12,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(8);
  doc.text('Broad Peak Cyber | broadpeakcyber.com', margin, 292);
  doc.text('CONFIDENTIAL', W-margin-28, 292);

  doc.save(`BroadPeak-CyberRiskScore-${accountName.replace(/\s+/g,'')}-${new Date().toISOString().slice(0,10)}.pdf`);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CyberRiskScore({ accountName }: { accountName: string }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [queuedQuestions, setQueuedQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [started, setStarted] = useState(false);
  const [transition, setTransition] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Build adaptive question queue
  useEffect(() => {
    if (!started) return;
    const queue: Question[] = [];
    for (const fn of NIST_FUNCTIONS) {
      for (const q of fn.questions) {
        if (q.skipIf) {
          const depAns = answers[q.skipIf.questionId];
          if (depAns === q.skipIf.answer) continue; // skip
        }
        queue.push(q);
      }
    }
    setQueuedQuestions(queue);
  }, [answers, started]);

  function getFunctionForQuestion(qId: string): NISTFunction | undefined {
    return NIST_FUNCTIONS.find(fn => fn.questions.some(q => q.id === qId));
  }

  function answerQuestion(val: boolean) {
    const q = queuedQuestions[currentIdx];
    if (!q) return;
    setTransition(true);
    setTimeout(() => {
      const newAnswers = { ...answers, [q.id]: val };
      setAnswers(newAnswers);
      if (currentIdx + 1 >= queuedQuestions.length) {
        setShowResults(true);
      } else {
        setCurrentIdx(i => i + 1);
      }
      setTransition(false);
    }, 180);
  }

  function reset() {
    setAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
    setStarted(false);
    setQueuedQuestions([]);
  }

  const overallScore = calcOverallScore(answers);
  const risk = getRiskLevel(overallScore);

  const progress = queuedQuestions.length > 0 ? Math.round((currentIdx / queuedQuestions.length) * 100) : 0;
  const currentQuestion = queuedQuestions[currentIdx];
  const currentFn = currentQuestion ? getFunctionForQuestion(currentQuestion.id) : undefined;

  // ── Landing ────────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-pink-500/30 to-blue-500/30 rounded-xl flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Cyber Risk Score</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                An adaptive assessment based on the <span className="text-blue-300">NIST Cybersecurity Framework 2.0</span>, the globally recognised standard for cyber risk management. Questions adapt based on your answers. Your score is benchmarked against recognised frameworks including NCSC, ISO 27001, and UK GDPR.
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
                {NIST_FUNCTIONS.map(fn => (
                  <div key={fn.id} className="rounded-xl p-2.5 text-center" style={{ background: fn.color+'22', border: `1px solid ${fn.color}44` }}>
                    <div className="text-xs font-bold mb-0.5" style={{ color: fn.color }}>{fn.ref}</div>
                    <div className="text-xs text-white/70">{fn.name}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded-xl mb-4">
                <Info className="w-4 h-4 text-blue-300 flex-shrink-0" />
                <p className="text-xs text-white/60">Questions are adaptive — your answers determine what is asked next. The assessment takes approximately 5–8 minutes. A branded PDF report with Broad Peak recommendations is generated at the end.</p>
              </div>
              <button onClick={() => setStarted(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
                Start Risk Assessment <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (showResults) {
    const fnScores = NIST_FUNCTIONS.map(fn => ({
      ...fn,
      score: calcFunctionScore(fn, answers),
    }));
    const weakest = [...fnScores].sort((a,b)=>a.score-b.score).slice(0,3);
    const gaps = NIST_FUNCTIONS.flatMap(fn =>
      fn.questions.filter(q => answers[q.id] === false).map(q => ({ fn, q }))
    );
    const prodFreq: Record<string,number> = {};
    gaps.forEach(g => (PRODUCT_MAP[g.q.id]||[]).forEach(p => { prodFreq[p]=(prodFreq[p]||0)+1; }));
    const topProds = Object.entries(prodFreq).sort((a,b)=>b[1]-a[1]).slice(0,5);

    return (
      <div className="space-y-5">
        {/* Score header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Cyber Risk Score</h2>
              <p className="text-white/40 text-sm">{accountName} · NIST CSF 2.0</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold" style={{ color: risk.color }}>{overallScore}</div>
              <div className="text-xs text-white/40">/ 100</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: risk.color+'18', border: `1px solid ${risk.color}40` }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: risk.color }} />
            <div>
              <span className="text-sm font-bold" style={{ color: risk.color }}>{risk.label}</span>
              <span className="text-sm text-white/60 ml-2">{risk.description}</span>
            </div>
          </div>

          {/* NIST function breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {fnScores.map(fn => {
              const fnRisk = getRiskLevel(fn.score);
              return (
                <div key={fn.id} className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-bold" style={{ color: fn.color }}>{fn.ref}: {fn.name}</div>
                    </div>
                    <div className="text-lg font-bold" style={{ color: fnRisk.color }}>{fn.score}%</div>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${fn.score}%`, backgroundColor: fnRisk.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={() => generateRiskPDF(answers, accountName)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/15 transition-colors">
              <RotateCcw className="w-4 h-4" /> Retake
            </button>
          </div>
        </div>

        {/* Weakest areas */}
        {weakest.filter(f => f.score < 80).length > 0 && (
          <div>
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Priority Improvement Areas
            </h3>
            <div className="space-y-3">
              {weakest.filter(f => f.score < 80).map(fn => (
                <div key={fn.id} className="bg-white/5 border border-white/10 rounded-xl p-4" style={{ borderLeftColor: fn.color, borderLeftWidth: 3 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: fn.color }}>{fn.ref}: {fn.name}</span>
                    <span className="text-lg font-bold" style={{ color: getRiskLevel(fn.score).color }}>{fn.score}%</span>
                  </div>
                  <p className="text-xs text-white/50 mb-2">{fn.description}</p>
                  {fn.bpProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {fn.bpProducts.slice(0,3).map(p => (
                        <span key={p} className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-blue-500/20 border border-pink-500/20 text-white/70">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BP recommendations */}
        {topProds.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-pink-400" /> Broad Peak Recommendations
            </h3>
            <div className="space-y-2">
              {topProds.map(([prod, count]) => (
                <div key={prod} className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-900/20 to-blue-900/20 border border-pink-500/20 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-blue-400 flex-shrink-0" />
                  <span className="text-sm text-white font-medium flex-1">{prod}</span>
                  <span className="text-xs text-white/40">Addresses {count} gap{count>1?'s':''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All gaps */}
        {gaps.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-white mb-3">All Gaps ({gaps.length})</h3>
            <div className="space-y-2">
              {NIST_FUNCTIONS.map(fn => {
                const fnGaps = gaps.filter(g => g.fn.id === fn.id);
                if (fnGaps.length === 0) return null;
                return (
                  <div key={fn.id} className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 flex items-center gap-2" style={{ background: fn.color+'18', borderBottom: `1px solid ${fn.color}30` }}>
                      <span className="text-xs font-bold" style={{ color: fn.color }}>{fn.ref}: {fn.name}</span>
                      <span className="text-xs text-white/30 ml-auto">{fnGaps.length} gap{fnGaps.length>1?'s':''}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {fnGaps.map(({ q }) => (
                        <div key={q.id} className="flex items-start gap-2">
                          <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs text-white/80">{q.text}</div>
                            {(PRODUCT_MAP[q.id]||[]).length > 0 && (
                              <div className="text-xs text-pink-400/70 mt-0.5">→ {(PRODUCT_MAP[q.id]||[]).join(' · ')}</div>
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
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-300">Excellent posture — no gaps identified</div>
              <div className="text-xs text-white/50 mt-1">Your organisation demonstrates strong alignment with NIST CSF 2.0. Continue regular reviews to maintain this posture.</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Question view (adaptive) ───────────────────────────────────────────────
  if (!currentQuestion) return <div className="text-white/40 text-sm">Loading...</div>;

  const recentAnswers = queuedQuestions.slice(Math.max(0, currentIdx-3), currentIdx).map(q => ({
    q, ans: answers[q.id], fn: getFunctionForQuestion(q.id)
  }));

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>{currentFn?.ref}: {currentFn?.name} · Question {currentIdx+1} of ~{queuedQuestions.length}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Function indicators */}
      <div className="flex gap-1">
        {NIST_FUNCTIONS.map(fn => (
          <div key={fn.id} className="flex-1 h-1 rounded-full transition-all"
            style={{ background: fn.id === currentFn?.id ? fn.color : fn.color+'30' }} />
        ))}
      </div>

      {/* Question card */}
      <div ref={cardRef} className={`bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-180 ${transition ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
        style={{ borderLeftColor: currentFn?.color, borderLeftWidth: 3 }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: currentFn?.color }}>
            {currentFn?.ref}: {currentFn?.name}
          </span>
          {Array.from({ length: currentQuestion.weight }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: currentFn?.color }} />
          ))}
          <span className="text-xs text-white/30 ml-1">(importance {currentQuestion.weight === 3 ? 'high' : currentQuestion.weight === 2 ? 'medium' : 'standard'})</span>
        </div>

        <h3 className="text-base font-semibold text-white mb-3 leading-snug">{currentQuestion.text}</h3>

        {currentQuestion.guidance && (
          <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-500/20 rounded-xl mb-5">
            <Info className="w-3.5 h-3.5 text-blue-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/60 leading-relaxed">{currentQuestion.guidance}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => answerQuestion(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl font-semibold text-sm hover:bg-emerald-500/30 transition-all">
            <CheckCircle className="w-4 h-4" /> Yes
          </button>
          <button onClick={() => answerQuestion(false)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl font-semibold text-sm hover:bg-red-500/30 transition-all">
            <XCircle className="w-4 h-4" /> No
          </button>
        </div>
      </div>

      {/* Recent answers trail */}
      {recentAnswers.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-white/25 uppercase tracking-wide">Recent answers</div>
          {recentAnswers.map(({ q, ans, fn }) => (
            <div key={q.id} className="flex items-center gap-2.5 p-2 bg-white/3 rounded-lg">
              {ans === true ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
              <span className="text-xs font-medium flex-shrink-0" style={{ color: fn?.color+'cc' }}>{fn?.ref}</span>
              <span className="text-xs text-white/40 truncate">{q.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
