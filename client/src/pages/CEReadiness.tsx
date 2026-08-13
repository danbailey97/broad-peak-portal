import { useState } from 'react';
import { CheckCircle, XCircle, ChevronRight, Download, RotateCcw, Shield, AlertTriangle, Info } from 'lucide-react';
import { jsPDF } from 'jspdf';

// ── CE Readiness Questions (NCSC Cyber Essentials 5 controls) ────────────────
const CE_SECTIONS = [
  {
    id: 'firewall',
    title: 'Firewalls',
    control: 'CE Control 1',
    description: 'Boundary and device-level firewalls protecting your internet-facing services',
    questions: [
      { id: 'fw1', text: 'Do you have a firewall or equivalent device protecting your internet connection?', guidance: 'This includes hardware firewalls, software firewalls, or cloud-based perimeter protection.' },
      { id: 'fw2', text: 'Is your firewall configured to block all inbound connections by default unless explicitly permitted?', guidance: 'Default-deny rules are required. All inbound rules should be documented and reviewed.' },
      { id: 'fw3', text: 'Are firewall rules reviewed and approved at least annually?', guidance: 'Regular review ensures unused or overly permissive rules are removed.' },
      { id: 'fw4', text: 'Are all internet-facing services (websites, remote access, email) protected by firewall rules?', guidance: 'Every service accessible from the internet must be explicitly permitted and protected.' },
      { id: 'fw5', text: 'Are personal devices used for work required to have a software firewall enabled?', guidance: 'CE requires firewalls on all devices in scope, including personal (BYOD) devices used for work.' },
    ],
  },
  {
    id: 'secure_config',
    title: 'Secure Configuration',
    control: 'CE Control 2',
    description: 'Devices and software configured securely, with unnecessary features removed',
    questions: [
      { id: 'sc1', text: 'Are default administrator usernames and passwords changed on all devices before deployment?', guidance: 'Default credentials are publicly known and must be changed on all routers, switches, and servers.' },
      { id: 'sc2', text: 'Is unnecessary software (unused applications, services, features) removed or disabled?', guidance: 'Attack surface reduction — only software needed for business purposes should be present.' },
      { id: 'sc3', text: 'Do you maintain an inventory of all devices and software in your organisation?', guidance: 'You cannot secure what you cannot see. An asset register is a CE+ prerequisite.' },
      { id: 'sc4', text: 'Is the auto-run or auto-play feature disabled on all devices?', guidance: 'Prevents malware from automatically executing when removable media is connected.' },
      { id: 'sc5', text: 'Are all computers configured to lock automatically after a period of inactivity?', guidance: 'Screen lock after 15 minutes of inactivity is a common CE requirement.' },
    ],
  },
  {
    id: 'user_access',
    title: 'User Access Control',
    control: 'CE Control 3',
    description: 'Limiting access to data and services to only those who need it',
    questions: [
      { id: 'ua1', text: 'Does every user have their own unique account — no shared accounts?', guidance: 'Shared accounts prevent accountability and make audit trails impossible.' },
      { id: 'ua2', text: 'Are administrator accounts only used when performing administrative tasks?', guidance: 'Day-to-day work should use standard accounts. Admin rights should be separate.' },
      { id: 'ua3', text: 'Is the number of users with administrative privileges kept to the minimum necessary?', guidance: '"Least privilege" — admin rights should only be granted to those who genuinely need them.' },
      { id: 'ua4', text: 'Are accounts removed or disabled promptly when a staff member leaves or changes role?', guidance: 'Stale accounts are a common attack vector. Leaver processes must include account deprovisioning.' },
      { id: 'ua5', text: 'Is multi-factor authentication (MFA) enabled for remote access and cloud services?', guidance: 'MFA is now a core CE requirement for all cloud services and remote access.' },
      { id: 'ua6', text: 'Are strong passwords (minimum 12 characters or a three-word passphrase) enforced?', guidance: 'NCSC recommends three-word passphrases. Complexity rules alone are insufficient.' },
    ],
  },
  {
    id: 'malware',
    title: 'Malware Protection',
    control: 'CE Control 4',
    description: 'Protecting against malware using anti-malware software and safe browsing practices',
    questions: [
      { id: 'ml1', text: 'Is anti-malware or endpoint protection software installed on all devices?', guidance: 'All in-scope devices must have active malware protection — Windows Defender is acceptable.' },
      { id: 'ml2', text: 'Is anti-malware software kept up to date with current signatures or definitions?', guidance: 'Signatures must be updated at least daily. Cloud-based solutions typically do this automatically.' },
      { id: 'ml3', text: 'Are devices configured to prevent users from installing unauthorised software?', guidance: 'Application whitelisting or administrator-only installation rights are recommended.' },
      { id: 'ml4', text: 'Is web filtering or safe browsing protection in place to block known malicious websites?', guidance: 'DNS filtering or browser-level protection that blocks access to known malicious domains.' },
      { id: 'ml5', text: 'Are email attachments scanned for malware before delivery?', guidance: 'Email remains the #1 malware delivery vector. Gateway scanning is essential.' },
    ],
  },
  {
    id: 'patching',
    title: 'Security Update Management',
    control: 'CE Control 5',
    description: 'Keeping devices and software up to date with the latest security patches',
    questions: [
      { id: 'pt1', text: 'Are operating systems on all devices updated with the latest security patches within 14 days of release?', guidance: 'NCSC CE requires critical and high patches within 14 days. This applies to all in-scope devices.' },
      { id: 'pt2', text: 'Are all applications and software kept up to date — not just the operating system?', guidance: 'Browsers, Office suites, PDF readers, and all installed applications must be patched.' },
      { id: 'pt3', text: 'Is software that is no longer supported by the vendor (end-of-life) removed or isolated?', guidance: 'Unsupported software cannot receive security patches and must be removed or network-isolated.' },
      { id: 'pt4', text: 'Are firmware updates applied to network devices (routers, firewalls, switches) regularly?', guidance: 'Network device firmware is frequently overlooked but is critical to CE compliance.' },
      { id: 'pt5', text: 'Do you have a documented patch management process or policy?', guidance: 'CE+ requires evidence of a documented process — not just ad-hoc patching.' },
    ],
  },
];

const TOTAL_QUESTIONS = CE_SECTIONS.reduce((sum, s) => sum + s.questions.length, 0);

// Recommendations for "No" answers
const RECOMMENDATIONS: Record<string, string> = {
  fw1: 'Deploy a business-grade firewall or UTM appliance (e.g. Barracuda CloudGen Firewall or WatchGuard Firebox) to protect your internet perimeter.',
  fw2: 'Review and update your firewall ruleset to implement a default-deny posture, explicitly permitting only required inbound services.',
  fw3: 'Establish a formal firewall rule review process — at minimum annually, ideally quarterly — with documented sign-off.',
  fw4: 'Audit all internet-facing services and ensure each has a corresponding, restrictive firewall rule with the minimum required permissions.',
  fw5: 'Enforce software firewall requirements on all work devices via MDM or group policy. Consider Barracuda CloudGen or WatchGuard endpoint agents.',
  sc1: 'Implement a process to change all default credentials before device deployment. Use a password manager for secure credential storage.',
  sc2: 'Conduct a software audit and remove or disable all applications and services not required for business operations.',
  sc3: 'Build and maintain a live asset register covering hardware, software, and cloud services. CyberSmart Active Protect automates this.',
  sc4: 'Apply group policy or MDM settings to disable auto-run/auto-play across all Windows and macOS devices.',
  sc5: 'Configure screen lock via group policy (Windows) or MDM profile (macOS/iOS/Android) to activate after 10–15 minutes of inactivity.',
  ua1: 'Audit Active Directory / Azure AD and eliminate any shared accounts. Assign individual accounts to every user.',
  ua2: 'Implement Privileged Access Workstations (PAW) or at minimum, require admin users to have separate standard and admin accounts.',
  ua3: 'Conduct an access rights review and revoke admin privileges from users who do not require them for their role.',
  ua4: 'Establish a formal leaver / role-change process that includes immediate account deprovisioning as a mandatory step.',
  ua5: 'Enable MFA on all cloud services (Microsoft 365, Google Workspace, etc.) and remote access (VPN, RDP). WatchGuard AuthPoint provides MFA for all access types.',
  ua6: 'Enforce strong password policies via Active Directory / Azure AD. Implement a password manager and consider moving to passphrase-based authentication.',
  ml1: 'Deploy endpoint protection on all in-scope devices. WatchGuard EPDR or Barracuda XDR provide business-grade endpoint protection.',
  ml2: 'Configure anti-malware solutions to update automatically. Cloud-managed solutions (e.g. WatchGuard Endpoint) update continuously.',
  ml3: 'Restrict software installation rights to administrators via group policy or MDM. Review application whitelisting options.',
  ml4: 'Implement DNS filtering (e.g. via WatchGuard DNSWatch or Barracuda) to block access to known malicious websites.',
  ml5: 'Deploy email gateway scanning (e.g. Barracuda Email Gateway Defense) to scan all inbound attachments and links before delivery.',
  pt1: 'Implement automated patch management with a 14-day SLA for critical and high-severity patches. Consider a dedicated patch management tool.',
  pt2: 'Enable automatic updates for all applications. Use software management tools to track and enforce updates across the estate.',
  pt3: 'Audit for end-of-life software and either upgrade, replace, or network-isolate any systems that cannot be patched.',
  pt4: 'Establish a quarterly firmware review process for all network devices. Subscribe to vendor security advisories.',
  pt5: 'Document your patch management policy and process, including SLAs, responsibilities, and exception handling. This is a CE+ audit requirement.',
};

interface Answers { [questionId: string]: boolean | null; }

function generateCEPDF(answers: Answers, accountName: string, ceLevel: 'CE' | 'CE+') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 18;
  let y = 0;

  // Colour palette
  const pink: [number, number, number] = [198, 87, 147];
  const blue: [number, number, number] = [68, 148, 209];
  const darkBg: [number, number, number] = [26, 10, 46];
  const lightGrey: [number, number, number] = [248, 248, 252];
  const midGrey: [number, number, number] = [120, 120, 140];

  // ── Cover page ──────────────────────────────────────────────────────────────
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, W, 297, 'F');

  // Gradient bar
  doc.setFillColor(...pink);
  doc.rect(0, 0, W / 2, 4, 'F');
  doc.setFillColor(...blue);
  doc.rect(W / 2, 0, W / 2, 4, 'F');

  y = 60;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Cyber Essentials', margin, y);
  y += 12;
  doc.text('Readiness Assessment', margin, y);
  y += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...pink);
  doc.text(`${ceLevel} Gap Analysis Report`, margin, y);

  y += 20;
  doc.setTextColor(180, 180, 200);
  doc.setFontSize(11);
  doc.text(`Prepared for: ${accountName}`, margin, y);
  y += 7;
  doc.text(`Assessment date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, y);
  y += 7;
  doc.text('Assessed by: Broad Peak Cyber', margin, y);

  // Score block
  const failedQuestions = Object.entries(answers).filter(([, v]) => v === false);
  const answeredCount = Object.values(answers).filter(v => v !== null).length;
  const passedCount = Object.values(answers).filter(v => v === true).length;
  const score = answeredCount > 0 ? Math.round((passedCount / answeredCount) * 100) : 0;
  const readiness = score >= 90 ? 'High' : score >= 70 ? 'Medium' : 'Low';
  const readinessColor: [number, number, number] = score >= 90 ? [52, 211, 153] : score >= 70 ? [251, 191, 36] : [239, 68, 68];

  y += 25;
  doc.setFillColor(255, 255, 255, 0.1);
  doc.setFillColor(40, 20, 70);
  doc.roundedRect(margin, y, W - margin * 2, 35, 4, 4, 'F');
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...readinessColor);
  doc.text(`${score}%`, margin + 10, y + 22);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 200);
  doc.text('Overall Readiness Score', margin + 10, y + 30);
  doc.setFontSize(13);
  doc.setTextColor(...readinessColor);
  doc.text(`${readiness} Readiness`, W - margin - 55, y + 22);
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 170);
  doc.text(`${passedCount}/${answeredCount} controls met`, W - margin - 55, y + 30);

  // Cover letter
  y += 55;
  doc.setFontSize(10);
  doc.setTextColor(160, 160, 185);
  doc.setFont('helvetica', 'normal');
  const coverText = [
    `Dear ${accountName},`,
    '',
    'Thank you for completing the Broad Peak Cyber Essentials Readiness Assessment. This report provides a',
    `high-level analysis of your organisation\'s current posture against the five Cyber Essentials controls`,
    'required for NCSC Cyber Essentials certification.',
    '',
    'This assessment is designed to identify areas that may require attention before undergoing formal',
    'accreditation. The recommendations contained in this report are advisory in nature and reflect best',
    'practice guidance from the NCSC Cyber Essentials scheme and broader cybersecurity frameworks.',
    '',
    'Broad Peak Cyber specialises in helping organisations of all sizes achieve and maintain Cyber Essentials',
    'and Cyber Essentials Plus certification. We can support you through preparation, remediation, and the',
    'certification process itself. Please contact your account manager to discuss next steps.',
  ];
  coverText.forEach(line => {
    doc.text(line, margin, y);
    y += 5.5;
  });

  // Bottom bar
  doc.setFillColor(...pink);
  doc.rect(0, 285, W / 2, 12, 'F');
  doc.setFillColor(...blue);
  doc.rect(W / 2, 285, W / 2, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Broad Peak Cyber | broadpeakcyber.com', margin, 292);
  doc.text('CONFIDENTIAL', W - margin - 28, 292);

  // ── Section results pages ───────────────────────────────────────────────────
  CE_SECTIONS.forEach(section => {
    doc.addPage();
    doc.setFillColor(...lightGrey);
    doc.rect(0, 0, W, 297, 'F');

    // Section header
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, W, 22, 'F');
    doc.setFillColor(...pink);
    doc.rect(0, 0, 4, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 10, 10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text(section.control + ' · ' + section.description, 10, 17);

    y = 32;
    section.questions.forEach(q => {
      const ans = answers[q.id];
      const passed = ans === true;
      const failed = ans === false;

      if (y > 260) { doc.addPage(); doc.setFillColor(...lightGrey); doc.rect(0, 0, W, 297, 'F'); y = 20; }

      // Question card
      const cardH = failed ? 40 : 22;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, W - margin * 2, cardH, 2, 2, 'F');
      doc.setDrawColor(230, 230, 240);
      doc.roundedRect(margin, y, W - margin * 2, cardH, 2, 2, 'S');

      // Status indicator
      if (passed) { doc.setFillColor(52, 211, 153); }
      else if (failed) { doc.setFillColor(239, 68, 68); }
      else { doc.setFillColor(200, 200, 220); }
      doc.rect(margin, y, 3, cardH, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', ans === false ? 'bold' : 'normal');
      doc.setTextColor(40, 40, 60);
      const qLines = doc.splitTextToSize(q.text, W - margin * 2 - 20);
      doc.text(qLines, margin + 7, y + 7);

      // Status label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      if (passed) { doc.setTextColor(52, 211, 153); doc.text('✓ COMPLIANT', W - margin - 28, y + 7); }
      else if (failed) { doc.setTextColor(239, 68, 68); doc.text('✗ GAP IDENTIFIED', W - margin - 32, y + 7); }
      else { doc.setTextColor(150, 150, 170); doc.text('– NOT ANSWERED', W - margin - 32, y + 7); }

      // Recommendation for failed
      if (failed && RECOMMENDATIONS[q.id]) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...midGrey);
        const recLines = doc.splitTextToSize('↳ ' + RECOMMENDATIONS[q.id], W - margin * 2 - 14);
        doc.text(recLines.slice(0, 2), margin + 7, y + 16);
      }

      y += cardH + 4;
    });
  });

  // ── Summary / next steps page ───────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, W, 297, 'F');

  y = 20;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary & Next Steps', margin, y);

  y += 15;
  // Score breakdown by section
  CE_SECTIONS.forEach(section => {
    const sectionQs = section.questions.map(q => answers[q.id]);
    const passed = sectionQs.filter(a => a === true).length;
    const total = sectionQs.length;
    const pct = Math.round((passed / total) * 100);
    const barColor: [number, number, number] = pct === 100 ? [52, 211, 153] : pct >= 60 ? [251, 191, 36] : [239, 68, 68];

    if (y > 260) { doc.addPage(); doc.setFillColor(...darkBg); doc.rect(0, 0, W, 297, 'F'); y = 20; }

    doc.setFillColor(40, 20, 70);
    doc.roundedRect(margin, y, W - margin * 2, 16, 2, 2, 'F');

    // Bar
    const barW = ((W - margin * 2 - 70) * pct) / 100;
    doc.setFillColor(50, 30, 80);
    doc.roundedRect(margin + 6, y + 9, W - margin * 2 - 70, 4, 1, 1, 'F');
    if (barW > 0) {
      doc.setFillColor(...barColor);
      doc.roundedRect(margin + 6, y + 9, barW, 4, 1, 1, 'F');
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(section.title, margin + 6, y + 7);
    doc.setTextColor(...barColor);
    doc.text(`${passed}/${total}`, W - margin - 18, y + 7);
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 165);
    doc.text(section.control, margin + 6 + doc.getTextWidth(section.title) + 4, y + 7);

    y += 20;
  });

  // Gaps summary
  if (failedQuestions.length > 0) {
    y += 5;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...pink);
    doc.text(`${failedQuestions.length} Gap${failedQuestions.length > 1 ? 's' : ''} Requiring Attention`, margin, y);
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 220);
    doc.text('Broad Peak Cyber can assist with all identified gaps. Contact your account manager to discuss a', margin, y);
    y += 5;
    doc.text('remediation roadmap and support with the formal Cyber Essentials certification process.', margin, y);
  } else {
    y += 5;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 211, 153);
    doc.text('No gaps identified — Ready for formal certification', margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 220);
    doc.text('Your responses indicate you are well-positioned for Cyber Essentials certification.', margin, y);
    y += 5;
    doc.text('Contact your Broad Peak account manager to arrange formal accreditation.', margin, y);
  }

  y += 20;
  doc.setFillColor(40, 20, 70);
  doc.roundedRect(margin, y, W - margin * 2, 35, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Contact Broad Peak Cyber', margin + 8, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 210);
  doc.text('Email: info@broadpeakcyber.com  |  Web: broadpeakcyber.com', margin + 8, y + 18);
  doc.text('CyberSmart Partner — Cyber Essentials & Cyber Essentials Plus Certification', margin + 8, y + 26);

  // Bottom bar
  doc.setFillColor(...pink);
  doc.rect(0, 285, W / 2, 12, 'F');
  doc.setFillColor(...blue);
  doc.rect(W / 2, 285, W / 2, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Broad Peak Cyber | broadpeakcyber.com', margin, 292);
  doc.text('CONFIDENTIAL', W - margin - 28, 292);

  doc.save(`BroadPeak-CE-Readiness-${accountName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Main Component ───────────────────────────────────────────────────────────
const CE_SECTION_COLORS: Record<string, string> = {
  firewall: '#C65793',
  secure_config: '#7b5ea7',
  user_access: '#4494D1',
  malware: '#059669',
  patching: '#f59e0b',
};

export default function CEReadiness({ accountName }: { accountName: string }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [ceLevel, setCeLevel] = useState<'CE' | 'CE+'>('CE');
  const [started, setStarted] = useState(false);

  const allQuestions = CE_SECTIONS.flatMap(s => s.questions.map(q => ({ ...q, sectionId: s.id, sectionTitle: s.title })));
  const flatIndex = CE_SECTIONS.slice(0, currentSection).reduce((sum, s) => sum + s.questions.length, 0) + currentQ;
  const progress = Math.round((Object.keys(answers).length / TOTAL_QUESTIONS) * 100);

  const section = CE_SECTIONS[currentSection];
  const question = section?.questions[currentQ];

  function answer(val: boolean) {
    const qId = CE_SECTIONS[currentSection].questions[currentQ].id;
    const newAnswers = { ...answers, [qId]: val };
    setAnswers(newAnswers);

    // Advance
    const nextQ = currentQ + 1;
    if (nextQ < CE_SECTIONS[currentSection].questions.length) {
      setCurrentQ(nextQ);
    } else {
      const nextSection = currentSection + 1;
      if (nextSection < CE_SECTIONS.length) {
        setCurrentSection(nextSection);
        setCurrentQ(0);
      } else {
        setShowResults(true);
      }
    }
  }

  function reset() {
    setAnswers({});
    setCurrentSection(0);
    setCurrentQ(0);
    setShowResults(false);
    setStarted(false);
  }

  const failedIds = Object.entries(answers).filter(([, v]) => v === false).map(([k]) => k);
  const passedCount = Object.values(answers).filter(v => v === true).length;
  const score = TOTAL_QUESTIONS > 0 ? Math.round((passedCount / TOTAL_QUESTIONS) * 100) : 0;

  if (!started) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-2xl p-6 border-l-4 border-l-[#C65793]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#4494D112] rounded-xl">
              <Shield className="w-6 h-6 text-[#1f2937]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#1f2937] mb-2">Cyber Essentials Readiness Assessment</h2>
              <p className="text-[#6b7280] text-sm leading-relaxed mb-4">
                This assessment covers the five NCSC Cyber Essentials controls. Answer yes/no to {TOTAL_QUESTIONS} questions to identify gaps before formal certification. A downloadable PDF report with recommendations is generated at the end.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                {CE_SECTIONS.map(s => (
                  <div key={s.id} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-3 text-center">
                    <div className="text-xs text-[#6b7280] mb-1">{s.control}</div>
                    <div className="text-xs font-semibold text-[#1f2937]">{s.title}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-[#6b7280]">Assessment level:</span>
                <div className="flex gap-2">
                  {(['CE', 'CE+'] as const).map(l => (
                    <button key={l} onClick={() => setCeLevel(l)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${ceLevel === l ? 'gradient-cta text-white' : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setStarted(true)}
                className="flex items-center gap-2 px-6 py-3 gradient-cta text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
                Start Assessment <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const sectionScores = CE_SECTIONS.map(s => {
      const passed = s.questions.filter(q => answers[q.id] === true).length;
      return { ...s, passed, total: s.questions.length, pct: Math.round((passed / s.questions.length) * 100) };
    });

    return (
      <div className="space-y-6">
        {/* Score header */}
        <div className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-2xl p-6 border-l-4 border-l-[#4494D1]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#1f2937]">Readiness Assessment Complete</h2>
              <p className="text-[#6b7280] text-sm mt-1">{ceLevel} Gap Analysis · {accountName}</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${score >= 90 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{score}%</div>
              <div className="text-sm text-[#6b7280]">{passedCount}/{TOTAL_QUESTIONS} controls met</div>
            </div>
          </div>

          {/* Section breakdown */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {sectionScores.map(s => (
              <div key={s.id} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-3">
                <div className="text-xs text-[#9ca3af] mb-1">{s.control}</div>
                <div className="text-xs font-medium text-[#1f2937] mb-2">{s.title}</div>
                <div className="text-sm font-bold" style={{ color: s.pct === 100 ? '#34d399' : s.pct >= 60 ? '#fbbf24' : '#f87171' }}>{s.pct}%</div>
                <div className="h-1 bg-[#f3f4f6] rounded-full mt-1">
                  <div className="h-1 rounded-full transition-all" style={{ width: `${s.pct}%`, backgroundColor: s.pct === 100 ? '#34d399' : s.pct >= 60 ? '#fbbf24' : '#f87171' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => generateCEPDF(answers, accountName, ceLevel)}
              className="flex items-center gap-2 px-5 py-2.5 gradient-cta text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 bg-[#f3f4f6] text-[#6b7280] rounded-xl text-sm hover:bg-[#e5e7eb] transition-colors">
              <RotateCcw className="w-4 h-4" /> Restart
            </button>
          </div>
        </div>

        {/* Gaps detail */}
        {failedIds.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-[#1f2937] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> {failedIds.length} Gap{failedIds.length !== 1 ? 's' : ''} Identified
            </h3>
            <div className="space-y-3">
              {CE_SECTIONS.map(section => {
                const sectionFails = section.questions.filter(q => answers[q.id] === false);
                if (sectionFails.length === 0) return null;
                return (
                  <div key={section.id} className="bg-white border border-red-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-xl p-4 border-l-4 border-l-red-500">
                    <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">{section.title} — {section.control}</div>
                    {sectionFails.map(q => (
                      <div key={q.id} className="mb-3 last:mb-0">
                        <div className="flex items-start gap-2 mb-1">
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-[#1f2937]">{q.text}</span>
                        </div>
                        <div className="ml-6 text-xs text-[#6b7280] leading-relaxed">{RECOMMENDATIONS[q.id]}</div>
                      </div>
                    ))}
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {failedIds.length === 0 && (
          <div className="bg-[#10b98112] border border-[#10b98130] rounded-xl p-5 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-300">No gaps identified</div>
              <div className="text-xs text-[#6b7280] mt-1">Your responses indicate you are well-positioned for {ceLevel} certification. Contact your account manager to arrange formal accreditation.</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Question view
  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-[#6b7280] mb-2">
          <span>{section.title} · Question {currentQ + 1} of {section.questions.length}</span>
          <span>{progress}% complete · {TOTAL_QUESTIONS - Object.keys(answers).length} remaining</span>
        </div>
        <div className="h-1.5 bg-[#f3f4f6] rounded-full">
          <div className="h-1.5 rounded-full gradient-cta transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5">
        {CE_SECTIONS.map((s, i) => (
          <div key={s.id} className={`flex-1 h-1 rounded-full transition-all ${i < currentSection ? 'bg-emerald-500' : i === currentSection ? 'gradient-cta' : 'bg-[#f3f4f6]'}`} />
        ))}
      </div>

      {/* Question card */}
      <div className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-2xl p-6 border-l-4" style={{ borderLeftColor: CE_SECTION_COLORS[section.id] }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: CE_SECTION_COLORS[section.id] }}>{section.control} — {section.title}</span>
        </div>
        <h3 className="text-lg font-semibold text-[#1f2937] mb-3 leading-snug">{question.text}</h3>
        {question.guidance && (
          <div className="flex items-start gap-2 p-3 bg-[#4494D112] border border-[#4494D130] rounded-xl mb-5">
            <Info className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#6b7280] leading-relaxed">{question.guidance}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => answer(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#f0fdf4] border-2 border-[#10b981] text-[#059669] rounded-xl font-semibold text-sm hover:bg-[#dcfce7] transition-all">
            <CheckCircle className="w-5 h-5" /> Yes — In place
          </button>
          <button onClick={() => answer(false)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#fef2f2] border-2 border-[#ef4444] text-[#dc2626] rounded-xl font-semibold text-sm hover:bg-[#fee2e2] transition-all">
            <XCircle className="w-5 h-5" /> No — Not in place
          </button>
        </div>
      </div>

      {/* Previous answers in section */}
      {currentQ > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-[#9ca3af] uppercase tracking-wide">Previous answers in this section</div>
          {section.questions.slice(0, currentQ).map(q => (
            <div key={q.id} className="flex items-center gap-3 p-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
              {answers[q.id] === true ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              <span className="text-xs text-[#6b7280] truncate">{q.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
