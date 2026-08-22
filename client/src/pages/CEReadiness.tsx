import { useState, useEffect } from 'react';
import { useLang } from '../lib/LanguageContext';
import { getToken } from '../lib/api';
import { CheckCircle, XCircle, ChevronRight, Download, RotateCcw, Shield, AlertTriangle, Info, Lock, Wifi, Users, Bug, RefreshCw, HelpCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

// ── CE Readiness Questions ───────────────────────────────────────────────────
const CE_SECTIONS = [
  {
    id: 'firewall',
    title: 'Firewalls',
    control: 'CE Control 1',
    icon: 'wifi',
    color: '#C65793',
    tagline: 'Your first line of defence against the internet',
    intro: 'Firewalls act as a security barrier between your internal network and the internet. Cyber Essentials requires that every internet-connected device — and your network boundary — is protected by a correctly configured firewall.',
    questions: [
      {
        id: 'fw1',
        text: 'Do you have a firewall protecting your internet connection?',
        why: 'Without a boundary firewall, your network is directly exposed to internet-based attacks 24/7. The NCSC reports that unprotected services are typically probed within minutes of going online.',
        example: 'This could be a hardware appliance (e.g. Barracuda CloudGen Firewall, WatchGuard Firebox), a software firewall built into your router, or a cloud-based perimeter solution.',
        guidance: 'Any device connecting your internal network to the internet must have active firewall protection — including broadband routers and cloud gateways.',
      },
      {
        id: 'fw2',
        text: 'Is your firewall configured to block all inbound connections unless explicitly permitted?',
        why: 'A firewall that allows traffic by default provides little protection. The "default-deny" principle ensures only services you intentionally expose are reachable from the internet.',
        example: 'If you only need HTTPS (port 443) inbound for a web server, all other ports should be blocked. Remote desktop (RDP on port 3389) should never be open to the internet.',
        guidance: 'Review your firewall ruleset — look for any broad "allow all" inbound rules. Every inbound permission should have a documented business reason.',
      },
      {
        id: 'fw3',
        text: 'Are your firewall rules reviewed and approved at least annually?',
        why: 'Outdated firewall rules are a common attack vector. Services get decommissioned, staff leave, and old rules accumulate — creating unintended openings.',
        example: 'A rule opened for a contractor two years ago may still be active. Annual reviews catch these and ensure your ruleset reflects your current business needs.',
        guidance: 'Document each review with sign-off from a responsible manager. CE+ requires evidence of this process during the on-site technical audit.',
      },
      {
        id: 'fw4',
        text: 'Are all internet-facing services (websites, email, remote access) covered by firewall rules?',
        why: 'Every service exposed to the internet is a potential entry point. Attackers systematically scan all 65,535 ports — any open port without a firewall rule is an unguarded door.',
        example: 'Common services requiring protection: web servers (80/443), mail servers (25/587), VPN gateways, Microsoft 365 connectors, and any remote access tools.',
        guidance: 'Conduct a port scan of your external IP addresses (tools like Shodan or nmap from an external perspective) to confirm what is actually visible from the internet.',
      },
      {
        id: 'fw5',
        text: 'Are personal or work devices required to have a software firewall enabled?',
        why: 'Cyber Essentials scopes all devices used for work — including employee-owned (BYOD) devices. A laptop used to access company email must have firewall protection, even outside the office.',
        example: 'Windows Defender Firewall (enabled by default on Windows 10/11) meets this requirement. macOS has a built-in firewall under System Preferences > Security & Privacy.',
        guidance: 'Check whether your MDM or endpoint management solution enforces firewall status. If you use Intune, look for device compliance policies.',
      },
    ],
  },
  {
    id: 'secure_config',
    title: 'Secure Configuration',
    control: 'CE Control 2',
    icon: 'lock',
    color: '#7b5ea7',
    tagline: 'Remove what you don\'t need — secure what remains',
    intro: 'Every device, application, and service ships with default settings optimised for ease of use — not security. Secure configuration means actively removing unnecessary functionality and hardening what remains before devices are deployed.',
    questions: [
      {
        id: 'sc1',
        text: 'Are default usernames and passwords changed on all devices before deployment?',
        why: 'Default credentials (e.g. "admin/admin", "admin/password") are publicly documented and the first thing attackers try. The Mirai botnet — which caused major internet outages — spread entirely by exploiting unchanged default credentials.',
        example: 'Routers, switches, firewalls, NAS devices, printers, and IP cameras all ship with default credentials. Any of these accessible from the internet with unchanged defaults is immediately compromised.',
        guidance: 'Maintain a secure register of all device credentials (using a password manager). Include this step in your device deployment checklist.',
      },
      {
        id: 'sc2',
        text: 'Is unnecessary software, services, and features removed or disabled?',
        why: 'Every piece of software is a potential vulnerability. Software you don\'t use can still be exploited. The principle of "attack surface reduction" means only what is needed for business should be present.',
        example: 'Unused Windows features like Telnet, TFTP Client, and Remote Registry service should be disabled. Trial software, games, and personal applications should be removed from work devices.',
        guidance: 'Run a software audit using your asset management tool or manually review installed programs. Remove anything without a clear business justification.',
      },
      {
        id: 'sc3',
        text: 'Do you maintain an inventory of all devices and software?',
        why: 'You cannot protect what you cannot see. Without an asset inventory, you will inevitably have unpatched systems, unconfigured devices, and forgotten accounts — all prime targets.',
        example: 'Your inventory should include: all laptops, desktops, servers, phones, tablets, network equipment, and cloud services. Tools like CyberSmart or Intune can automate this.',
        guidance: 'CE+ (the higher level, verified by an assessor) specifically requires evidence of a maintained asset register during the technical audit.',
      },
      {
        id: 'sc4',
        text: 'Is auto-run / auto-play disabled on all devices?',
        why: 'Auto-run allows software on USB drives or CDs to execute automatically when connected — a common malware distribution method. Disabling it prevents drive-by infections from physical media.',
        example: 'The infamous Stuxnet malware used Windows auto-run to spread via USB drives. Even trusted-looking USB sticks found in a car park should never be plugged in.',
        guidance: 'This is typically configured via Group Policy (Windows) or MDM. Search for "Disable Autoplay" in your Group Policy management console.',
      },
      {
        id: 'sc5',
        text: 'Do all computers lock automatically after a period of inactivity?',
        why: 'An unlocked device left unattended — in a café, at a desk, or on a train — gives anyone physical access to all data and systems. Automatic lock is a basic but essential control.',
        example: 'NCSC guidance recommends locking after 10–15 minutes of inactivity. Many organisations set 5 minutes for high-security areas. A PIN or password must be required to unlock.',
        guidance: 'Configurable via Group Policy (Windows: Computer Configuration > Policies > Windows Settings > Security Settings > Account Policies) or MDM profile.',
      },
    ],
  },
  {
    id: 'user_access',
    title: 'User Access Control',
    control: 'CE Control 3',
    icon: 'users',
    color: '#4494D1',
    tagline: 'Give people only the access they genuinely need',
    intro: 'The principle of least privilege — giving users access only to what they need for their role — limits the damage any single compromised account can cause. Insider threats, compromised credentials, and accidental data access are all significantly reduced by tight access control.',
    questions: [
      {
        id: 'ua1',
        text: 'Does every user have their own individual account — no shared accounts?',
        why: 'Shared accounts make it impossible to know who did what, audit activities, or hold individuals accountable. They also can\'t have personal MFA. If one person with the password leaves, the entire account must be changed.',
        example: '"Reception" or "Shared PC" accounts used by multiple people are non-compliant. Every person — including contractors and temps — must have an individual, named account.',
        guidance: 'Review your Active Directory or Azure AD for generic/shared accounts. Assign individual accounts before removing shared ones to avoid disruption.',
      },
      {
        id: 'ua2',
        text: 'Are administrator accounts separate from standard accounts and used only for admin tasks?',
        why: 'Browsing the web or reading email with an admin account means malware encountered during those activities runs with administrative privileges — capable of modifying the entire system.',
        example: 'IT staff should have two accounts: a standard account (e.g. j.smith@company.com) for daily use, and an admin account (e.g. admin.j.smith@company.com) used only when managing systems.',
        guidance: 'This is particularly important for domain administrators. Admin sessions should be kept short and logged.',
      },
      {
        id: 'ua3',
        text: 'Is the number of users with admin privileges kept to the minimum necessary?',
        why: 'Every admin account is a high-value target. If an attacker compromises an admin account, they have the keys to your entire kingdom. Fewer admins means smaller blast radius.',
        example: 'A 50-person company typically needs 2–3 IT administrators. If everyone has admin rights for convenience, that\'s a significant risk. Review and revoke where not essential.',
        guidance: 'Conduct an access rights review — list all users with admin privileges across all systems (AD, Microsoft 365, cloud platforms) and justify each one.',
      },
      {
        id: 'ua4',
        text: 'Are accounts removed or disabled promptly when staff leave or change role?',
        why: 'Dormant accounts from ex-employees are a well-documented attack vector. Attackers seek them out specifically because they\'re often overlooked and may have elevated privileges.',
        example: 'An ex-employee\'s Active Directory account, still active 6 months after leaving, could be used to access company data — especially if that person is now disgruntled.',
        guidance: 'Your HR offboarding process should include an IT step. For CE compliance, "promptly" means within the same working day the person leaves.',
      },
      {
        id: 'ua5',
        text: 'Is multi-factor authentication (MFA) enabled for cloud services and remote access?',
        why: 'MFA is now a mandatory CE requirement for all cloud services (Microsoft 365, Google Workspace, Salesforce, etc.) and all remote access (VPN, RDP, remote desktop tools). Passwords alone are no longer sufficient.',
        example: 'Even a complex password can be phished, guessed, or leaked in a data breach. MFA means a stolen password alone cannot grant access — the attacker also needs your phone.',
        guidance: 'Enable MFA in Microsoft 365 Admin Center under Security > MFA. Consider Conditional Access policies to enforce MFA for all users. WatchGuard AuthPoint is a dedicated MFA solution.',
      },
      {
        id: 'ua6',
        text: 'Are strong passwords (12+ characters or a three-word passphrase) enforced?',
        why: 'Short or predictable passwords are cracked in seconds using modern tools. NCSC now recommends three-word passphrases (e.g. "correct-horse-battery") as both strong and memorable — length matters more than complexity.',
        example: '"P@ssw0rd1!" fails modern security standards despite meeting old complexity rules. "purple-mountain-table" is far stronger and easier to remember.',
        guidance: 'Configure minimum password length of 12 characters in your Active Directory or Azure AD password policy. Block common passwords using Azure AD Password Protection.',
      },
    ],
  },
  {
    id: 'malware',
    title: 'Malware Protection',
    control: 'CE Control 4',
    icon: 'bug',
    color: '#059669',
    tagline: 'Defend against malicious software across every entry point',
    intro: 'Malware — including ransomware, trojans, spyware, and viruses — causes billions in damage annually. Cyber Essentials requires a layered approach: anti-malware software on devices, blocking known malicious websites, and scanning email attachments before they reach users.',
    questions: [
      {
        id: 'ml1',
        text: 'Is anti-malware or endpoint protection software installed on all in-scope devices?',
        why: 'Endpoint protection catches known malware signatures and suspicious behaviours before they can execute. Without it, a malicious email attachment or website download can silently compromise a device.',
        example: 'Windows Defender (built into Windows 10/11) is CE-acceptable for basic compliance. Business-grade EDR solutions (WatchGuard EPDR, Barracuda XDR) provide significantly better detection and response.',
        guidance: 'Check that protection is active and not just installed — the service must be running. Use your MDM to confirm status across all managed devices.',
      },
      {
        id: 'ml2',
        text: 'Is anti-malware kept up to date with current definitions or signatures?',
        why: 'New malware variants emerge constantly. Outdated definitions mean your protection doesn\'t recognise the latest threats. Definition updates should occur at least daily.',
        example: 'Cloud-managed solutions (Windows Defender, CrowdStrike, WatchGuard Endpoint) update automatically. Legacy on-premise AV may need manual update checks — ensure this is happening.',
        guidance: 'Check your endpoint management console for devices with outdated signatures. Set automatic update policies and alert on devices that haven\'t updated within 24 hours.',
      },
      {
        id: 'ml3',
        text: 'Are users prevented from installing unauthorised software?',
        why: 'Users inadvertently installing malware disguised as legitimate software (pirated tools, "free" utilities, cracked software) is a major infection vector. Restricting installation rights prevents this.',
        example: 'Standard users should not have local administrator rights. Where admin rights are needed for specific purposes, use just-in-time access rather than permanent elevation.',
        guidance: 'Remove local administrator rights from standard users via Group Policy or Intune. Establish a software request process for legitimate business tools.',
      },
      {
        id: 'ml4',
        text: 'Is web filtering in place to block access to known malicious websites?',
        why: 'Malicious websites deliver malware through drive-by downloads (simply visiting is enough), phishing pages, and malicious ads. DNS filtering blocks these before the browser even connects.',
        example: 'Solutions include: Barracuda DNS filtering, WatchGuard DNSWatch, Cisco Umbrella, or Microsoft Defender SmartScreen. Many next-gen firewalls include web filtering.',
        guidance: 'Test your web filtering by navigating to a known test malicious domain (NCSC provides test URLs). Check whether the block page appears.',
      },
      {
        id: 'ml5',
        text: 'Are email attachments and links scanned for malware before delivery?',
        why: 'Email remains the #1 malware delivery mechanism. Microsoft 365 and Google Workspace basic plans provide limited protection — dedicated email security catches significantly more threats.',
        example: 'A malicious Word document with embedded macros, a PDF with an exploit, or a link to a freshly-registered phishing site — all require active scanning beyond basic email filtering.',
        guidance: 'Barracuda Email Gateway Defense and Microsoft Defender for Office 365 Plan 2 provide advanced email threat protection including sandboxing and link rewriting.',
      },
    ],
  },
  {
    id: 'patching',
    title: 'Security Update Management',
    control: 'CE Control 5',
    icon: 'refresh',
    color: '#f59e0b',
    tagline: 'Fix known vulnerabilities before attackers exploit them',
    intro: 'Software vulnerabilities are discovered daily. Vendors release patches to fix them — but those patches only help if you apply them. Cyber Essentials requires critical and high-severity patches to be applied within 14 days of release to all in-scope devices.',
    questions: [
      {
        id: 'pt1',
        text: 'Are operating systems patched with critical/high security updates within 14 days of release?',
        why: 'The 14-day window is the CE requirement because attackers typically weaponise known vulnerabilities within days of a patch being released — meaning the time between patch and exploit is shrinking.',
        example: 'Verizon DBIR 2025 found exploitation of vulnerabilities grew 34% year-on-year. WannaCry (2017) exploited a vulnerability that Microsoft had patched 60 days earlier — unpatched organisations were devastated.',
        guidance: 'Enable automatic Windows Updates for security patches. Use Windows Server Update Services (WSUS) or Intune to enforce and report patch compliance across your estate.',
      },
      {
        id: 'pt2',
        text: 'Are all applications and software — not just the OS — kept up to date?',
        why: 'Attackers frequently target application vulnerabilities (browsers, PDF readers, Office, Java) rather than the OS. A fully-patched Windows system with an outdated browser is still vulnerable.',
        example: 'Chrome, Firefox, Adobe Acrobat, Microsoft Office, and third-party applications all need regular updates. Browser extensions and plugins are particularly overlooked.',
        guidance: 'Use a software management tool (Intune, PDQ Deploy, SCCM) to track and deploy application updates. Consider enabling automatic updates where supported.',
      },
      {
        id: 'pt3',
        text: 'Is end-of-life software (no longer receiving security patches) removed or isolated?',
        why: 'End-of-life software receives no security patches — meaning every newly discovered vulnerability remains permanently unaddressed. Running Windows 7 or Server 2012 without Extended Security Updates is a CE failure.',
        example: 'Common EOL products: Windows 7 (EOL Jan 2020), Windows 10 21H2 (EOL Jun 2023), Windows Server 2008 (EOL Jan 2020), Internet Explorer 11 (EOL Jun 2022), Office 2016 (EOL Oct 2025).',
        guidance: 'CE compliance requires removal or network isolation of EOL systems. Isolated means no internet access and no connection to systems holding sensitive data.',
      },
      {
        id: 'pt4',
        text: 'Are firmware updates applied to network devices (routers, firewalls, switches)?',
        why: 'Network device firmware vulnerabilities are actively targeted — a compromised firewall or router can intercept all traffic. This is frequently overlooked compared to server and desktop patching.',
        example: 'In 2024, Cisco and Fortinet both issued emergency patches for firewall vulnerabilities actively exploited in the wild. Organisations that didn\'t patch within days were compromised.',
        guidance: 'Subscribe to security advisories from your network device vendors. Schedule quarterly firmware reviews. Many modern firewalls (WatchGuard, Barracuda) support automatic firmware updates.',
      },
      {
        id: 'pt5',
        text: 'Do you have a documented patch management process or policy?',
        why: 'Ad-hoc patching is unreliable. A documented process ensures patches are applied consistently, within defined timeframes, with accountability. CE+ requires this as written evidence.',
        example: 'Your policy should include: who is responsible for patching, which systems are in scope, what timeframes apply (14 days for critical/high), and how exceptions are handled and approved.',
        guidance: 'For CE+, the on-site assessor will ask for your patch management documentation. A simple policy document with defined responsibilities and SLAs is sufficient.',
      },
    ],
  },
];


// ── Arabic CE Sections ───────────────────────────────────────────────────────
const CE_SECTIONS_AR = [
  {
    id: 'firewall',
    title: 'جدران الحماية',
    control: 'الضابط الأول',
    tagline: 'خط دفاعك الأول ضد الإنترنت',
    intro: 'تعمل جدران الحماية كحاجز أمني بين شبكتك الداخلية والإنترنت. تشترط Cyber Essentials أن تكون كل جهاز متصل بالإنترنت — وحدود شبكتك — محمية بجدار حماية مُهيَّأ بشكل صحيح.',
    questions: [
      {
        id: 'fw1',
        text: 'هل لديك جدار حماية يحمي اتصالك بالإنترنت؟',
        why: 'بدون جدار حماية على حدود الشبكة، تكون شبكتك مكشوفة مباشرة للهجمات القادمة من الإنترنت على مدار الساعة. تُفيد NCSC بأن الخدمات غير المحمية يتم استكشافها خلال دقائق من الاتصال بالإنترنت.',
        example: 'يمكن أن يكون ذلك جهازًا ماديًا (مثل Barracuda CloudGen Firewall أو WatchGuard Firebox)، أو جدار حماية برمجي مدمج في جهاز التوجيه، أو حل سحابي لحماية المحيط.',
        guidance: 'يجب أن تحتوي كل جهاز يربط شبكتك الداخلية بالإنترنت على حماية نشطة بجدار الحماية — بما في ذلك أجهزة التوجيه للنطاق العريض وبوابات السحابة.',
      },
      {
        id: 'fw2',
        text: 'هل تم تهيئة جدار الحماية لحظر جميع الاتصالات الواردة ما لم يُسمح بها صراحةً؟',
        why: 'جدار الحماية الذي يسمح بالمرور الافتراضي يوفر حماية ضئيلة. يضمن مبدأ "الحظر الافتراضي" أن الخدمات التي تعرضها عن قصد فقط هي القابلة للوصول من الإنترنت.',
        example: 'إذا كنت تحتاج فقط إلى HTTPS (المنفذ 443) للوارد لخادم ويب، يجب حظر جميع المنافذ الأخرى. يجب ألا يكون سطح المكتب البعيد (RDP على المنفذ 3389) مفتوحًا على الإنترنت أبدًا.',
        guidance: 'راجع مجموعة قواعد جدار الحماية — ابحث عن أي قواعد واردة عريضة من نوع "السماح بالكل". يجب أن يكون لكل إذن وارد سبب عمل موثق.',
      },
      {
        id: 'fw3',
        text: 'هل يتم مراجعة قواعد جدار الحماية والموافقة عليها مرة واحدة على الأقل سنويًا؟',
        why: 'قواعد جدار الحماية القديمة هي ناقل هجوم شائع. يتم إيقاف الخدمات، ومغادرة الموظفين، وتراكم القواعد القديمة — مما يخلق فتحات غير مقصودة.',
        example: 'قد تكون قاعدة فُتحت لمقاول قبل عامين لا تزال نشطة. تكشف المراجعات السنوية عن هذه الحالات وتضمن أن مجموعة قواعدك تعكس احتياجات عملك الحالية.',
        guidance: 'وثِّق كل مراجعة مع موافقة من مدير مسؤول. تتطلب CE+ أدلة على هذه العملية خلال التدقيق التقني الميداني.',
      },
      {
        id: 'fw4',
        text: 'هل تغطي قواعد جدار الحماية جميع الخدمات المواجهة للإنترنت (المواقع الإلكترونية، البريد الإلكتروني، الوصول عن بُعد)؟',
        why: 'كل خدمة مكشوفة للإنترنت هي نقطة دخول محتملة. يقوم المهاجمون بمسح جميع المنافذ الـ 65535 بشكل منهجي — أي منفذ مفتوح بدون قاعدة جدار حماية هو باب غير محروس.',
        example: 'الخدمات الشائعة التي تتطلب الحماية: خوادم الويب (80/443)، خوادم البريد (25/587)، بوابات VPN، موصلات Microsoft 365، وأي أدوات وصول عن بُعد.',
        guidance: 'قم بإجراء مسح للمنافذ على عناوين IP الخارجية الخاصة بك (أدوات مثل Shodan أو nmap من منظور خارجي) لتأكيد ما هو مرئي فعلًا من الإنترنت.',
      },
      {
        id: 'fw5',
        text: 'هل يُطلب من الأجهزة الشخصية أو المهنية تفعيل جدار حماية برمجي؟',
        why: 'تشمل Cyber Essentials جميع الأجهزة المستخدمة للعمل — بما في ذلك الأجهزة المملوكة للموظفين (BYOD). يجب أن يتمتع الكمبيوتر المحمول المستخدم للوصول إلى بريد الشركة بحماية جدار الحماية حتى خارج المكتب.',
        example: 'يستوفي جدار حماية Windows Defender (المفعّل افتراضيًا في Windows 10/11) هذا المتطلب. يحتوي macOS على جدار حماية مدمج ضمن تفضيلات النظام > الأمان والخصوصية.',
        guidance: 'تحقق مما إذا كان حل MDM أو إدارة نقاط النهاية الخاص بك يفرض حالة جدار الحماية. إذا كنت تستخدم Intune، ابحث عن سياسات امتثال الأجهزة.',
      },
    ],
  },
  {
    id: 'secure_config',
    title: 'التهيئة الآمنة',
    control: 'الضابط الثاني',
    tagline: 'أزل ما لا تحتاجه — أمِّن ما تبقى',
    intro: 'تأتي كل جهاز وتطبيق وخدمة بإعدادات افتراضية مُحسَّنة لسهولة الاستخدام وليس للأمان. تعني التهيئة الآمنة إزالة الوظائف غير الضرورية بشكل فعّال وتصليب ما تبقى قبل نشر الأجهزة.',
    questions: [
      {
        id: 'sc1',
        text: 'هل يتم تغيير أسماء المستخدمين وكلمات المرور الافتراضية على جميع الأجهزة قبل النشر؟',
        why: 'بيانات الاعتماد الافتراضية (مثل "admin/admin" أو "admin/password") موثقة علنًا وهي أول ما يجربه المهاجمون. انتشرت بوتنت Mirai — التي تسببت في انقطاعات إنترنت كبرى — كليًا باستغلال بيانات الاعتماد الافتراضية غير المغيّرة.',
        example: 'أجهزة التوجيه والمحوّلات وجدران الحماية وأجهزة NAS والطابعات وكاميرات IP تأتي جميعها ببيانات اعتماد افتراضية. أي منها يمكن الوصول إليه من الإنترنت ببيانات اعتماد افتراضية يتعرض للاختراق فورًا.',
        guidance: 'احتفظ بسجل آمن لجميع بيانات اعتماد الأجهزة (باستخدام مدير كلمات مرور). أدرج هذه الخطوة في قائمة التحقق الخاصة بنشر الأجهزة.',
      },
      {
        id: 'sc2',
        text: 'هل تتم إزالة أو تعطيل البرامج والخدمات والميزات غير الضرورية؟',
        why: 'كل برنامج هو ثغرة محتملة. يمكن استغلال البرامج التي لا تستخدمها. يعني مبدأ "تقليل سطح الهجوم" أن ما هو ضروري للعمل فقط هو ما يجب أن يكون موجودًا.',
        example: 'يجب تعطيل ميزات Windows غير المستخدمة مثل Telnet وعميل TFTP وخدمة Remote Registry. يجب إزالة البرامج التجريبية والألعاب والتطبيقات الشخصية من أجهزة العمل.',
        guidance: 'قم بإجراء تدقيق للبرامج باستخدام أداة إدارة الأصول الخاصة بك أو مراجعة البرامج المثبتة يدويًا. أزل أي شيء ليس له مبرر تجاري واضح.',
      },
      {
        id: 'sc3',
        text: 'هل تحتفظ بجرد لجميع الأجهزة والبرامج؟',
        why: 'لا يمكنك حماية ما لا تراه. بدون جرد الأصول، ستكون حتمًا لديك أنظمة غير مُرقَّعة وأجهزة غير مُهيَّأة وحسابات منسية — وكلها أهداف رئيسية.',
        example: 'يجب أن يشمل جردك: جميع أجهزة الكمبيوتر المحمولة والمكتبية والخوادم والهواتف والأجهزة اللوحية ومعدات الشبكة والخدمات السحابية. يمكن لأدوات مثل CyberSmart أو Intune أتمتة ذلك.',
        guidance: 'تتطلب CE+ (المستوى الأعلى الذي يتحقق منه مقيّم) تحديدًا أدلة على وجود سجل أصول محدَّث خلال التدقيق التقني.',
      },
      {
        id: 'sc4',
        text: 'هل تم تعطيل التشغيل التلقائي/التشغيل التلقائي للوسائط على جميع الأجهزة؟',
        why: 'يسمح التشغيل التلقائي للبرامج الموجودة على محركات USB أو الأقراص المضغوطة بالتنفيذ تلقائيًا عند توصيلها — وهو أسلوب توزيع شائع للبرامج الضارة. يمنع تعطيله الإصابات الناجمة عن الوسائط المادية.',
        example: 'استخدمت برمجية Stuxnet الخبيثة الشهيرة ميزة التشغيل التلقائي في Windows للانتشار عبر محركات USB. حتى محركات USB الموثوقة الظاهر التي تُوجد في مواقف السيارات يجب ألا تُوصَّل أبدًا.',
        guidance: 'يتم تهيئة ذلك عادةً عبر Group Policy (Windows) أو MDM. ابحث عن "تعطيل التشغيل التلقائي" في وحدة تحكم إدارة Group Policy.',
      },
      {
        id: 'sc5',
        text: 'هل تُقفل جميع أجهزة الكمبيوتر تلقائيًا بعد فترة من الخمول؟',
        why: 'الجهاز غير المقفل المتروك دون مراقبة — في مقهى أو على مكتب أو في قطار — يمنح أي شخص وصولًا ماديًا لجميع البيانات والأنظمة. القفل التلقائي ضابط أساسي رغم بساطته.',
        example: 'توصي NCSC بالقفل بعد 10-15 دقيقة من الخمول. تضبط كثير من المنظمات 5 دقائق للمناطق عالية الأمان. يجب أن تكون هناك كلمة مرور أو رقم PIN مطلوبان لإلغاء القفل.',
        guidance: 'قابل للتهيئة عبر Group Policy (Windows) أو ملف تعريف MDM.',
      },
    ],
  },
  {
    id: 'user_access',
    title: 'التحكم في وصول المستخدم',
    control: 'الضابط الثالث',
    tagline: 'امنح الناس فقط الوصول الذي يحتاجونه فعلًا',
    intro: 'يحدّ مبدأ الامتياز الأدنى — منح المستخدمين وصولًا فقط لما يحتاجونه لأدوارهم — من الضرر الذي قد يتسبب فيه أي حساب مخترق واحد. التهديدات الداخلية وبيانات الاعتماد المخترقة والوصول العرضي إلى البيانات كلها تنخفض بشكل كبير مع ضوابط وصول صارمة.',
    questions: [
      {
        id: 'ua1',
        text: 'هل لكل مستخدم حسابه الفردي الخاص — لا حسابات مشتركة؟',
        why: 'الحسابات المشتركة تجعل من المستحيل معرفة من فعل ماذا، ومراجعة الأنشطة، أو محاسبة الأفراد. كما لا يمكنها الحصول على MFA شخصي. إذا غادر شخص لديه كلمة المرور، يجب تغيير الحساب بأكمله.',
        example: 'حسابات "الاستقبال" أو "الكمبيوتر المشترك" التي يستخدمها عدة أشخاص غير متوافقة. يجب أن يكون لكل شخص — بما في ذلك المقاولون والعمال المؤقتون — حساب فردي باسم شخصي.',
        guidance: 'راجع Active Directory أو Azure AD الخاص بك بحثًا عن الحسابات العامة أو المشتركة. خصص حسابات فردية قبل إزالة الحسابات المشتركة لتجنب الاضطراب.',
      },
      {
        id: 'ua2',
        text: 'هل تكون حسابات المسؤول منفصلة عن الحسابات العادية وتُستخدم فقط لمهام الإدارة؟',
        why: 'تصفح الويب أو قراءة البريد الإلكتروني بحساب مسؤول يعني أن البرامج الضارة التي تُواجَه خلال تلك الأنشطة تعمل بامتيازات إدارية — قادرة على تعديل النظام بأكمله.',
        example: 'يجب أن يكون لدى موظفي تكنولوجيا المعلومات حسابان: حساب عادي (مثل j.smith@company.com) للاستخدام اليومي، وحساب مسؤول (مثل admin.j.smith@company.com) يُستخدم فقط عند إدارة الأنظمة.',
        guidance: 'هذا مهم بشكل خاص لمسؤولي المجال. يجب أن تكون جلسات المسؤول قصيرة ومسجَّلة.',
      },
      {
        id: 'ua3',
        text: 'هل يُبقى عدد المستخدمين ذوي امتيازات المسؤول في حده الأدنى الضروري؟',
        why: 'كل حساب مسؤول هو هدف عالي القيمة. إذا اخترق مهاجم حساب مسؤول، فلديه مفاتيح مملكتك بأكملها. كلما قل عدد المسؤولين، كان نطاق الضرر المحتمل أصغر.',
        example: 'تحتاج شركة مكونة من 50 شخصًا عادةً إلى 2-3 مسؤولي تكنولوجيا معلومات. إذا كان للجميع حقوق مسؤول للراحة، فهذا خطر كبير. راجع وأسقط الامتيازات حيثما لم تكن ضرورية.',
        guidance: 'أجرِ مراجعة لحقوق الوصول — اسرد جميع المستخدمين ذوي امتيازات المسؤول عبر جميع الأنظمة (AD وMicrosoft 365 والمنصات السحابية) وبرر كل منها.',
      },
      {
        id: 'ua4',
        text: 'هل تتم إزالة أو تعطيل الحسابات فورًا عند مغادرة الموظفين أو تغيير أدوارهم؟',
        why: 'الحسابات الخاملة لموظفين سابقين هي ناقل هجوم موثق جيدًا. يبحث المهاجمون عنها تحديدًا لأنها كثيرًا ما تُغفَل وقد تحتوي على امتيازات مرتفعة.',
        example: 'يمكن استخدام حساب Active Directory لموظف سابق، لا يزال نشطًا بعد 6 أشهر من مغادرته، للوصول إلى بيانات الشركة — خاصةً إذا كان ذلك الشخص ساخطًا الآن.',
        guidance: 'يجب أن تتضمن عملية مغادرة الموظفين في الموارد البشرية خطوة لتكنولوجيا المعلومات. للامتثال لـ CE، تعني "فورًا" في غضون يوم العمل نفسه الذي يغادر فيه الشخص.',
      },
      {
        id: 'ua5',
        text: 'هل المصادقة متعددة العوامل (MFA) مفعّلة للخدمات السحابية والوصول عن بُعد؟',
        why: 'MFA هي الآن متطلب إلزامي لـ CE لجميع الخدمات السحابية (Microsoft 365 وGoogle Workspace وSalesforce وغيرها) وجميع وسائل الوصول عن بُعد (VPN وRDP وأدوات سطح المكتب البعيد). كلمات المرور وحدها لم تعد كافية.',
        example: 'حتى كلمة مرور معقدة يمكن اختراقها عبر التصيد الاحتيالي أو تخمينها أو تسريبها في اختراق بيانات. تعني MFA أن كلمة مرور مسروقة وحدها لا يمكنها منح الوصول — فالمهاجم يحتاج أيضًا إلى هاتفك.',
        guidance: 'فعّل MFA في مركز إدارة Microsoft 365 ضمن الأمان > MFA. ضع في اعتبارك سياسات الوصول المشروط لفرض MFA على جميع المستخدمين. WatchGuard AuthPoint هو حل MFA مخصص.',
      },
      {
        id: 'ua6',
        text: 'هل يتم فرض كلمات مرور قوية (12 حرفًا أو أكثر أو عبارة مكونة من ثلاث كلمات)؟',
        why: 'يتم كسر كلمات المرور القصيرة أو القابلة للتنبؤ في ثوانٍ باستخدام الأدوات الحديثة. توصي NCSC الآن بعبارات مكونة من ثلاث كلمات لأنها قوية وسهلة التذكر — الطول أهم من التعقيد.',
        example: '"P@ssw0rd1!" لا تستوفي معايير الأمان الحديثة على الرغم من استيفائها لقواعد التعقيد القديمة. "purple-mountain-table" أقوى بكثير وأسهل في التذكر.',
        guidance: 'هيّئ الحد الأدنى لطول كلمة المرور بـ 12 حرفًا في سياسة كلمة مرور Active Directory أو Azure AD الخاصة بك. فعّل Azure AD Password Protection لحظر كلمات المرور الشائعة.',
      },
    ],
  },
  {
    id: 'malware',
    title: 'الحماية من البرامج الضارة',
    control: 'الضابط الرابع',
    tagline: 'الدفاع ضد البرامج الضارة عبر كل نقطة دخول',
    intro: 'تتسبب البرامج الضارة — بما في ذلك برامج الفدية وأحصنة طروادة وبرامج التجسس والفيروسات — في خسائر بمليارات الدولارات سنويًا. تتطلب Cyber Essentials نهجًا متعدد الطبقات: برامج مكافحة البرامج الضارة على الأجهزة، وحظر المواقع الضارة المعروفة، ومسح مرفقات البريد الإلكتروني قبل وصولها إلى المستخدمين.',
    questions: [
      {
        id: 'ml1',
        text: 'هل مكافحة البرامج الضارة أو برنامج حماية نقاط النهاية مثبت على جميع الأجهزة في النطاق؟',
        why: 'تلتقط حماية نقاط النهاية توقيعات البرامج الضارة المعروفة والسلوكيات المشبوهة قبل أن تتمكن من التنفيذ. بدونها، يمكن أن يُخترق جهاز بصمت من خلال مرفق بريد إلكتروني ضار أو تنزيل موقع.',
        example: 'Windows Defender (المدمج في Windows 10/11) مقبول لـ CE للامتثال الأساسي. توفر حلول EDR التجارية (WatchGuard EPDR وBarracuda XDR) اكتشافًا واستجابة أفضل بكثير.',
        guidance: 'تحقق من أن الحماية نشطة وليست مجرد مثبتة — يجب أن تكون الخدمة قيد التشغيل. استخدم MDM لتأكيد الحالة عبر جميع الأجهزة المُدارة.',
      },
      {
        id: 'ml2',
        text: 'هل تتم تحديثات مكافحة البرامج الضارة بالتعريفات أو التوقيعات الحالية؟',
        why: 'تظهر متغيرات برامج ضارة جديدة باستمرار. التعريفات القديمة تعني أن حمايتك لا تتعرف على أحدث التهديدات. يجب أن تحدث تحديثات التعريف يوميًا على الأقل.',
        example: 'الحلول المُدارة سحابيًا (Windows Defender وCrowdStrike وWatchGuard Endpoint) تتحدث تلقائيًا. قد يحتاج برنامج مكافحة الفيروسات القديم المحلي إلى فحوصات تحديث يدوية — تأكد من حدوث ذلك.',
        guidance: 'تحقق من وحدة تحكم إدارة نقاط النهاية بحثًا عن أجهزة ذات توقيعات قديمة. اضبط سياسات التحديث التلقائي وأرسل تنبيهًا بشأن الأجهزة التي لم تُحدَّث خلال 24 ساعة.',
      },
      {
        id: 'ml3',
        text: 'هل يُمنع المستخدمون من تثبيت برامج غير مصرح بها؟',
        why: 'المستخدمون الذين يثبتون عن غير قصد برامج ضارة متنكرة في شكل برامج مشروعة (أدوات مقرصنة أو "مجانية" أو برامج مكسورة) هم ناقل إصابة رئيسي. يمنع تقييد حقوق التثبيت ذلك.',
        example: 'يجب ألا يمتلك المستخدمون العاديون حقوق المسؤول المحلي. حيثما تُطلب حقوق المسؤول لأغراض محددة، استخدم الوصول في الوقت المناسب بدلًا من الرفع الدائم.',
        guidance: 'أزل حقوق المسؤول المحلي من المستخدمين العاديين عبر Group Policy أو Intune. أنشئ عملية طلب برامج للأدوات التجارية المشروعة.',
      },
      {
        id: 'ml4',
        text: 'هل يوجد تصفية للويب لحظر الوصول إلى المواقع الضارة المعروفة؟',
        why: 'تقوم المواقع الضارة بتوصيل البرامج الضارة من خلال التنزيلات التلقائية (مجرد الزيارة يكفي) وصفحات التصيد الاحتيالي والإعلانات الضارة. تحظر تصفية DNS هذه المواقع قبل أن يتصل بها المتصفح.',
        example: 'تشمل الحلول: Barracuda DNS filtering وWatchGuard DNSWatch وCisco Umbrella وMicrosoft Defender SmartScreen. تتضمن كثير من جدران الحماية من الجيل التالي تصفية الويب.',
        guidance: 'اختبر تصفية الويب بالانتقال إلى نطاق اختبار معروف ضار (توفر NCSC عناوين URL للاختبار). تحقق مما إذا كانت صفحة الحظر تظهر.',
      },
      {
        id: 'ml5',
        text: 'هل يتم فحص مرفقات البريد الإلكتروني والروابط بحثًا عن برامج ضارة قبل التسليم؟',
        why: 'البريد الإلكتروني يبقى آلية توصيل البرامج الضارة الرئيسية رقم 1. توفر خطط Microsoft 365 وGoogle Workspace الأساسية حماية محدودة — يكتشف أمان البريد الإلكتروني المخصص تهديدات أكثر بكثير.',
        example: 'مستند Word ضار بوحدات ماكرو مضمنة أو PDF يحتوي على ثغرة أو رابط لموقع تصيد احتيالي مسجل حديثًا — كل هذه تتطلب مسحًا نشطًا يتجاوز تصفية البريد الإلكتروني الأساسية.',
        guidance: 'يوفر Barracuda Email Gateway Defense وMicrosoft Defender for Office 365 Plan 2 حماية متقدمة لتهديدات البريد الإلكتروني بما في ذلك بيئة الاختبار المعزولة وإعادة كتابة الروابط.',
      },
    ],
  },
  {
    id: 'patching',
    title: 'إدارة تحديثات الأمان',
    control: 'الضابط الخامس',
    tagline: 'أصلح الثغرات المعروفة قبل أن يستغلها المهاجمون',
    intro: 'تُكتشف ثغرات البرامج يوميًا. يُصدر البائعون تصحيحات لإصلاحها — لكن تلك التصحيحات لا تُفيد إلا إذا طبّقتها. تشترط Cyber Essentials تطبيق التصحيحات الحرجة وعالية الخطورة خلال 14 يومًا من إصدارها على جميع الأجهزة في النطاق.',
    questions: [
      {
        id: 'pt1',
        text: 'هل يتم تصحيح أنظمة التشغيل بتحديثات الأمان الحرجة/العالية في غضون 14 يومًا من الإصدار؟',
        why: 'نافذة الـ 14 يومًا هي متطلب CE لأن المهاجمين عادةً ما يسلّحون الثغرات المعروفة في غضون أيام من إصدار تصحيح — مما يعني أن الوقت بين التصحيح والاستغلال يتقلص.',
        example: 'وجد Verizon DBIR 2025 أن استغلال الثغرات نما بنسبة 34% سنة بعد سنة. استغل WannaCry (2017) ثغرة كانت Microsoft قد أصدرت تصحيحًا لها قبل 60 يومًا — المنظمات غير المُصحَّحة دُمِّرت.',
        guidance: 'فعّل التحديثات التلقائية لـ Windows للتصحيحات الأمنية. استخدم Windows Server Update Services (WSUS) أو Intune لفرض امتثال التصحيح والإبلاغ عنه عبر أصولك.',
      },
      {
        id: 'pt2',
        text: 'هل جميع التطبيقات والبرامج — وليس نظام التشغيل فقط — محدَّثة؟',
        why: 'كثيرًا ما يستهدف المهاجمون ثغرات التطبيقات (المتصفحات وقارئات PDF وOffice وJava) بدلًا من نظام التشغيل. نظام Windows مُصحَّح بالكامل مع متصفح قديم لا يزال عُرضة للهجوم.',
        example: 'Chrome وFirefox وAdobe Acrobat وMicrosoft Office وتطبيقات الجهات الخارجية كلها تحتاج إلى تحديثات منتظمة. امتدادات المتصفح والمكونات الإضافية مغفولة بشكل خاص.',
        guidance: 'استخدم أداة إدارة برامج (Intune أو PDQ Deploy أو SCCM) لتتبع ونشر تحديثات التطبيقات. فكّر في تفعيل التحديثات التلقائية حيثما كانت مدعومة.',
      },
      {
        id: 'pt3',
        text: 'هل تتم إزالة أو عزل البرامج منتهية الصلاحية (التي لم تعد تتلقى تصحيحات الأمان)؟',
        why: 'البرامج منتهية الصلاحية لا تتلقى تصحيحات أمنية — مما يعني أن كل ثغرة مكتشفة حديثًا تبقى دون معالجة بشكل دائم. تشغيل Windows 7 أو Server 2012 بدون تحديثات الأمان الممتدة يُعدّ فشلًا في CE.',
        example: 'المنتجات الشائعة منتهية الصلاحية: Windows 7 (EOL يناير 2020)، Windows 10 21H2 (EOL يونيو 2023)، Windows Server 2008 (EOL يناير 2020)، Internet Explorer 11 (EOL يونيو 2022)، Office 2016 (EOL أكتوبر 2025).',
        guidance: 'يتطلب امتثال CE إزالة أو عزل الشبكة للأنظمة منتهية الصلاحية. يعني العزل عدم الوصول إلى الإنترنت وعدم الاتصال بالأنظمة التي تحتوي على بيانات حساسة.',
      },
      {
        id: 'pt4',
        text: 'هل يتم تطبيق تحديثات البرامج الثابتة على أجهزة الشبكة (أجهزة التوجيه وجدران الحماية والمحوّلات)؟',
        why: 'ثغرات البرامج الثابتة لأجهزة الشبكة تستهدف بشكل نشط — جهاز توجيه أو جدار حماية مخترق يمكنه اعتراض جميع حركة المرور. كثيرًا ما يُغفَل هذا مقارنةً بتصحيح الخوادم وسطح المكتب.',
        example: 'في عام 2024، أصدرت كل من Cisco وFortinet تصحيحات طارئة لثغرات جدار الحماية التي كانت تُستغل بشكل نشط. المنظمات التي لم تُصحِّح في غضون أيام تعرضت للاختراق.',
        guidance: 'اشترك في التنبيهات الأمنية من بائعي أجهزة الشبكة. جدوِل مراجعات ربع سنوية للبرامج الثابتة. تدعم كثير من جدران الحماية الحديثة (WatchGuard وBarracuda) تحديثات البرامج الثابتة التلقائية.',
      },
      {
        id: 'pt5',
        text: 'هل لديك عملية أو سياسة موثقة لإدارة التصحيحات؟',
        why: 'التصحيح العشوائي غير موثوق. تضمن العملية الموثقة تطبيق التصحيحات باتساق، ضمن أطر زمنية محددة، مع المساءلة. تتطلب CE+ هذا كدليل مكتوب.',
        example: 'يجب أن تتضمن سياستك: من المسؤول عن التصحيح، والأنظمة في النطاق، والأطر الزمنية المعمول بها (14 يومًا للحرجة/العالية)، وكيفية التعامل مع الاستثناءات والموافقة عليها.',
        guidance: 'بالنسبة لـ CE+، سيطلب المقيّم الميداني وثائق إدارة التصحيحات الخاصة بك. وثيقة سياسة بسيطة مع مسؤوليات ومستويات خدمة محددة كافية.',
      },
    ],
  },
];

const TOTAL_QUESTIONS = CE_SECTIONS.reduce((sum, s) => sum + s.questions.length, 0);

const RECOMMENDATIONS: Record<string, string> = {
  fw1: 'Deploy a business-grade firewall (Barracuda CloudGen Firewall or WatchGuard Firebox) to protect your internet perimeter. Broad Peak can assess, supply, and configure these for your organisation.',
  fw2: 'Review and implement a default-deny firewall ruleset. Document every permitted inbound rule with a named business owner and review date.',
  fw3: 'Establish a formal firewall rule review — minimum annually, ideally quarterly — with documented sign-off from a responsible manager.',
  fw4: 'Conduct an external port scan to identify all internet-facing services and ensure each has a corresponding, appropriately restrictive firewall rule.',
  fw5: 'Enforce software firewall requirements via MDM (Intune) or Group Policy across all work devices including BYOD.',
  sc1: 'Implement a pre-deployment checklist that mandates changing all default credentials. Use a business password manager for secure storage.',
  sc2: 'Conduct a software audit and remove or disable all applications, services, and features not required for business operations.',
  sc3: 'Implement an automated asset register using CyberSmart Active Protect, Microsoft Intune, or equivalent. Manual spreadsheets quickly become out of date.',
  sc4: 'Disable auto-run/auto-play via Group Policy (Computer Configuration > Administrative Templates > Windows Components > AutoPlay Policies).',
  sc5: 'Configure screen lock via Group Policy or MDM to activate after 10 minutes of inactivity. Require password/PIN to unlock.',
  ua1: 'Audit Active Directory/Azure AD for shared or generic accounts. Assign individual named accounts to every user — no exceptions.',
  ua2: 'Implement a dual-account policy for IT administrators: a standard account for daily use and a separate admin account for privileged tasks only.',
  ua3: 'Conduct an access rights review and revoke admin privileges from all users who do not require them. Document the justification for each admin account.',
  ua4: 'Add IT account deprovisioning as a mandatory step in your HR offboarding process, to be completed on or before the employee\'s last day.',
  ua5: 'Enable MFA for all Microsoft 365 users via the M365 Admin Center. Consider WatchGuard AuthPoint for organisation-wide MFA covering VPN and other systems.',
  ua6: 'Configure minimum 12-character passwords in your Active Directory password policy. Enable Azure AD Password Protection to block common passwords.',
  ml1: 'Deploy active endpoint protection on all in-scope devices. WatchGuard EPDR or Barracuda XDR provide business-grade endpoint detection and response.',
  ml2: 'Configure endpoint protection to update signatures automatically. Verify update status via your endpoint management console — flag devices with definitions older than 24 hours.',
  ml3: 'Remove local administrator rights from standard user accounts via Group Policy or Intune. Establish a formal software request and approval process.',
  ml4: 'Implement DNS filtering (WatchGuard DNSWatch, Barracuda DNS filtering, or Cisco Umbrella) to block access to malicious websites.',
  ml5: 'Deploy Barracuda Email Gateway Defense or upgrade to Microsoft Defender for Office 365 Plan 2 for advanced email threat protection including sandboxing.',
  pt1: 'Enable automatic security updates and implement a patch management tool (Intune, WSUS) to enforce and report on 14-day patch compliance.',
  pt2: 'Enable automatic updates for all applications. Use a software management tool to track and deploy third-party application updates across your estate.',
  pt3: 'Identify and eliminate all end-of-life software. Where removal is not immediately possible, isolate systems from the network and implement compensating controls.',
  pt4: 'Subscribe to vendor security advisories for all network devices. Schedule quarterly firmware reviews and enable automatic updates where available.',
  pt5: 'Document a patch management policy including scope, responsibilities, timeframes (14 days for critical/high), and exception handling. This is required for CE+ certification.',
};

interface Answers { [questionId: string]: boolean | null; }

function getIcon(iconName: string, color: string) {
  const cls = `w-5 h-5`;
  const style = { color };
  switch (iconName) {
    case 'wifi': return <Wifi className={cls} style={style} />;
    case 'lock': return <Lock className={cls} style={style} />;
    case 'users': return <Users className={cls} style={style} />;
    case 'bug': return <Bug className={cls} style={style} />;
    case 'refresh': return <RefreshCw className={cls} style={style} />;
    default: return <Shield className={cls} style={style} />;
  }
}

function generateCEPDF(answers: Answers, accountName: string, ceLevel: 'CE' | 'CE+') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 18;
  let y = 0;

  const pink: [number, number, number] = [198, 87, 147];
  const blue: [number, number, number] = [68, 148, 209];
  const darkBg: [number, number, number] = [26, 10, 46];
  const lightGrey: [number, number, number] = [248, 248, 252];
  const midGrey: [number, number, number] = [120, 120, 140];

  doc.setFillColor(...darkBg);
  doc.rect(0, 0, W, 297, 'F');
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

  const failedQuestions = Object.entries(answers).filter(([, v]) => v === false);
  const answeredCount = Object.values(answers).filter(v => v !== null).length;
  const passedCount = Object.values(answers).filter(v => v === true).length;
  const score = answeredCount > 0 ? Math.round((passedCount / answeredCount) * 100) : 0;
  const readiness = score >= 90 ? 'High' : score >= 70 ? 'Medium' : 'Low';
  const readinessColor: [number, number, number] = score >= 90 ? [52, 211, 153] : score >= 70 ? [251, 191, 36] : [239, 68, 68];

  y += 25;
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

  y += 55;
  doc.setFontSize(10);
  doc.setTextColor(160, 160, 185);
  doc.setFont('helvetica', 'normal');
  const coverText = [
    `Dear ${accountName},`,
    '',
    'Thank you for completing the Broad Peak Cyber Essentials Readiness Assessment. This report',
    `provides a high-level analysis of your organisation\'s current posture against the five Cyber`,
    'Essentials controls required for NCSC Cyber Essentials certification.',
    '',
    'This assessment is designed to identify areas that may require attention before undergoing',
    'formal accreditation. The recommendations contained in this report are advisory in nature and',
    'reflect best practice guidance from the NCSC Cyber Essentials scheme.',
    '',
    'Broad Peak Cyber specialises in helping organisations achieve and maintain Cyber Essentials and',
    'Cyber Essentials Plus certification. Contact your account manager to discuss next steps.',
  ];
  coverText.forEach(line => {
    doc.text(line, margin, y);
    y += 5.5;
  });

  doc.setFillColor(...pink);
  doc.rect(0, 285, W / 2, 12, 'F');
  doc.setFillColor(...blue);
  doc.rect(W / 2, 285, W / 2, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Broad Peak Cyber | broadpeakcyber.com', margin, 292);
  doc.text('CONFIDENTIAL', W - margin - 28, 292);

  CE_SECTIONS.forEach(section => {
    doc.addPage();
    doc.setFillColor(...lightGrey);
    doc.rect(0, 0, W, 297, 'F');
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, W, 22, 'F');
    doc.setFillColor(198, 87, 147);
    doc.rect(0, 0, 4, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 10, 10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text(section.control + ' · ' + section.tagline, 10, 17);

    y = 32;
    section.questions.forEach(q => {
      const ans = answers[q.id];
      const passed = ans === true;
      const failed = ans === false;

      // Layout constants
      const cardW = W - margin * 2;          // 174mm
      const leftPad = 10;                    // 10mm from card left edge
      const rightPad = 8;                    // 8mm from card right edge
      const badgeLabel = passed ? '✓ COMPLIANT' : failed ? '✗ GAP' : '– N/A';

      // Measure badge width
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      const badgeW = doc.getTextWidth(badgeLabel) + 2;
      const textAvail = cardW - leftPad - badgeW - rightPad - 4; // available for question text

      // Measure question lines
      doc.setFontSize(9); doc.setFont('helvetica', failed ? 'bold' : 'normal');
      const qLines = doc.splitTextToSize(q.text, textAvail);

      // Measure recommendation lines (full card width minus padding)
      let recLines: string[] = [];
      if (failed && RECOMMENDATIONS[q.id]) {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
        recLines = doc.splitTextToSize('↳ ' + RECOMMENDATIONS[q.id], cardW - leftPad - rightPad);
      }

      const qBlockH = Math.max(10, qLines.length * 5);
      const recBlockH = recLines.length > 0 ? recLines.length * 4.5 + 4 : 0;
      const cardH = qBlockH + recBlockH + 10; // 5mm top + 5mm bottom padding

      if (y + cardH > 272) { doc.addPage(); doc.setFillColor(...lightGrey); doc.rect(0, 0, W, 297, 'F'); y = 20; }

      // Draw card
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, cardW, cardH, 2, 2, 'F');
      doc.setDrawColor(230, 230, 240);
      doc.roundedRect(margin, y, cardW, cardH, 2, 2, 'S');

      // Left accent bar
      if (passed) doc.setFillColor(52, 211, 153);
      else if (failed) doc.setFillColor(239, 68, 68);
      else doc.setFillColor(200, 200, 220);
      doc.rect(margin, y, 3, cardH, 'F');

      // Question text
      doc.setFontSize(9); doc.setFont('helvetica', failed ? 'bold' : 'normal');
      doc.setTextColor(40, 40, 60);
      doc.text(qLines, margin + leftPad, y + 7);

      // Badge — right-aligned inside card
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      const badgeX = margin + cardW - rightPad - badgeW;
      if (passed) { doc.setTextColor(52, 211, 153); }
      else if (failed) { doc.setTextColor(239, 68, 68); }
      else { doc.setTextColor(150, 150, 170); }
      doc.text(badgeLabel, badgeX, y + 7);

      // Recommendation text (below question block)
      if (recLines.length > 0) {
        const recY = y + 5 + qBlockH + 2;
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
        doc.setTextColor(...midGrey);
        doc.text(recLines, margin + leftPad, recY);
      }

      y += cardH + 4;
    });
  });

  doc.addPage();
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, W, 297, 'F');

  y = 20;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary & Next Steps', margin, y);

  y += 15;
  CE_SECTIONS.forEach(section => {
    const sectionQs = section.questions.map(q => answers[q.id]);
    const passed = sectionQs.filter(a => a === true).length;
    const total = sectionQs.length;
    const pct = Math.round((passed / total) * 100);
    const barColor: [number, number, number] = pct === 100 ? [52, 211, 153] : pct >= 60 ? [251, 191, 36] : [239, 68, 68];

    if (y > 260) { doc.addPage(); doc.setFillColor(...darkBg); doc.rect(0, 0, W, 297, 'F'); y = 20; }

    doc.setFillColor(40, 20, 70);
    doc.roundedRect(margin, y, W - margin * 2, 16, 2, 2, 'F');
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
    y += 20;
  });

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

interface Answers { [questionId: string]: boolean | null; }

export default function CEReadiness({ accountName, domain }: { accountName: string; domain?: string }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [ceLevel, setCeLevel] = useState<'CE' | 'CE+'>('CE');
  const [started, setStarted] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; submitted_at: string; score: number; label: string }[]>([]);
  const [loadedHistoryId, setLoadedHistoryId] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    if (!domain) return;
    const token = getToken();
    fetch(`/api/assessments?domain=${encodeURIComponent(domain)}&type=ce-readiness`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(rows => { if (Array.isArray(rows)) setHistory(rows); }).catch(() => {});
  }, [domain]);

  // Auto-save when results are shown
  useEffect(() => {
    if (!showResults || !domain || savedId) return;
    const token = getToken();
    const passedCount = Object.values(answers).filter(v => v === true).length;
    const score = TOTAL_QUESTIONS > 0 ? Math.round((passedCount / TOTAL_QUESTIONS) * 100) : 0;
    fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ domain, type: 'ce-readiness', answers, score, label: `${ceLevel} · ${score}%` }),
    }).then(r => r.json()).then(data => {
      if (data.id) {
        setSavedId(data.id);
        setHistory(h => [{ id: data.id, submitted_at: data.submitted_at, score, label: `${ceLevel} · ${score}%` }, ...h]);
      }
    }).catch(() => {});
  }, [showResults]);

  function loadHistoryItem(id: string) {
    const token = getToken();
    fetch(`/api/assessments/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        if (data.answers) {
          setAnswers(data.answers);
          setLoadedHistoryId(id);
          setShowResults(true);
          setSavedId(id);
          setStarted(true);
        }
      }).catch(() => {});
  }

  const progress = Math.round((Object.keys(answers).length / TOTAL_QUESTIONS) * 100);
  const activeSections = isAr ? CE_SECTIONS_AR : CE_SECTIONS;
  const section = activeSections[currentSection];
  const question = section?.questions[currentQ];

  function answer(val: boolean) {
    const qId = activeSections[currentSection].questions[currentQ].id;
    const newAnswers = { ...answers, [qId]: val };
    setAnswers(newAnswers);
    setShowExample(false);
    const nextQ = currentQ + 1;
    if (nextQ < activeSections[currentSection].questions.length) {
      setCurrentQ(nextQ);
    } else {
      const nextSection = currentSection + 1;
      if (nextSection < activeSections.length) {
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
    setShowExample(false);
  }

  const failedIds = Object.entries(answers).filter(([, v]) => v === false).map(([k]) => k);
  const passedCount = Object.values(answers).filter(v => v === true).length;
  const score = TOTAL_QUESTIONS > 0 ? Math.round((passedCount / TOTAL_QUESTIONS) * 100) : 0;

  // ── Landing ──────────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="space-y-5" dir={dir}>
        {/* Hero */}
        <div className="rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #C65793, #7b5ea7, #4494D1)' }} />
          <div className="bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #C65793, #4494D1)' }}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#1f2937]">{isAr ? "تقييم الاستعداد لـ Cyber Essentials" : "Cyber Essentials Readiness Assessment"}</h2>
                <p className="text-[#6b7280] text-sm leading-relaxed mt-1">
                  {isAr ? "Cyber Essentials هو مخطط الاعتماد الصادر عن الحكومة البريطانية الذي يساعد المنظمات على الحماية من أكثر الهجمات الإلكترونية شيوعًا. يغطي هذا التقييم جميع الضوابط الخمسة ويُنشئ تقرير PDF مخصصًا." : "Cyber Essentials is the UK Government-backed certification scheme that helps organisations guard against the most common cyber attacks. This assessment covers all five controls and generates a personalised PDF report."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Control Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {activeSections.map((s, i) => (
            <div key={s.id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: s.color + '18' }}>
                {getIcon(s.icon, s.color)}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: s.color }}>{s.control}</div>
              <div className="text-sm font-bold text-[#1f2937] mb-1">{s.title}</div>
              <div className="text-xs text-[#9ca3af]">{s.questions.length} {isAr ? "سؤال" : "questions"}</div>
            </div>
          ))}
        </div>

        {/* What to expect */}
        <div className="bg-[#f0f6ff] border border-[#4494D130] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-[#4494D1] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-[#1f2937] mb-1">{isAr ? "ما الذي يمكن توقعه" : "What to expect"}</div>
              <div className="text-xs text-[#6b7280] leading-relaxed">
                {isAr ? `${TOTAL_QUESTIONS} سؤال بنعم/لا عبر 5 ضوابط. يتضمن كل سؤال شرحًا لـ "سبب أهميته" ومثالًا من العالم الحقيقي. يستغرق حوالي 5–7 دقائق. يُنشأ في النهاية تقرير PDF بتحليل الثغرات والتوصيات.` : `${TOTAL_QUESTIONS} yes/no questions across 5 controls. Each question includes a plain-English explanation of why it matters and a real-world example. Takes approximately 5–7 minutes. A branded PDF gap analysis report with specific recommendations is produced at the end.`}
              </div>
            </div>
          </div>
        </div>

        {/* CE / CE+ selector */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="text-sm font-semibold text-[#1f2937] mb-3">{isAr ? "ما الاعتماد الذي تستهدفه؟" : "Which certification are you aiming for?"}</div>
          <div className="grid grid-cols-2 gap-3">
            {(['CE', 'CE+'] as const).map(l => (
              <button key={l} onClick={() => setCeLevel(l)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${ceLevel === l ? 'border-[#C65793] bg-[#C6579308]' : 'border-[#e5e7eb] hover:border-[#d1d5db]'}`}>
                <div className={`text-sm font-bold mb-1 ${ceLevel === l ? 'text-[#C65793]' : 'text-[#1f2937]'}`}>{l}</div>
                <div className="text-xs text-[#9ca3af]">
                  {isAr ? (l === 'CE' ? 'استبيان تقييم ذاتي يُقدَّم إلى هيئة اعتماد. إلكتروني فقط.' : 'يتضمن CE، بالإضافة إلى تدقيق تقني ميداني من قِبَل مقيّم معتمد.') : (l === 'CE' ? 'Self-assessment questionnaire submitted to a certification body. Online only.' : 'Includes CE, plus an on-site technical audit by an accredited assessor.')}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setStarted(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-white rounded-xl font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #C65793, #4494D1)' }}>
          {isAr ? 'بدء التقييم' : 'Begin Assessment'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (showResults) {
    const sectionScores = activeSections.map(s => {
      const passed = s.questions.filter(q => answers[q.id] === true).length;
      return { ...s, passed, total: s.questions.length, pct: Math.round((passed / s.questions.length) * 100) };
    });

    return (
      <div className="space-y-5" dir={dir}>
        {/* Score */}
        <div className="bg-white border border-[#e5e7eb] shadow-[0_1px_4px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #C65793, #4494D1)' }} />
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#1f2937]">{isAr ? "اكتمل التقييم" : "Assessment Complete"}</h2>
                <p className="text-[#9ca3af] text-sm">{ceLevel} {isAr ? "تحليل الثغرات" : "Gap Analysis"} · {accountName}</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{score}%</div>
                <div className="text-xs text-[#9ca3af]">{passedCount}/{TOTAL_QUESTIONS} {isAr ? "ضابط متوافق" : "controls met"}</div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-5">
              {sectionScores.map(s => (
                <div key={s.id} className="rounded-xl p-3 border" style={{ background: s.color + '0a', borderColor: s.color + '30' }}>
                  <div className="text-[10px] font-semibold mb-1" style={{ color: s.color }}>{s.control}</div>
                  <div className="text-xs font-medium text-[#1f2937] mb-2 leading-tight">{s.title}</div>
                  <div className="text-sm font-bold" style={{ color: s.pct === 100 ? '#10b981' : s.pct >= 60 ? '#f59e0b' : '#ef4444' }}>{s.pct}%</div>
                  <div className="h-1 bg-[#f3f4f6] rounded-full mt-1.5">
                    <div className="h-1 rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.pct === 100 ? '#10b981' : s.pct >= 60 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => generateCEPDF(answers, accountName, ceLevel)}
                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #C65793, #4494D1)' }}>
                <Download className="w-4 h-4" /> {isAr ? "تحميل تقرير PDF" : "Download PDF Report"}
              </button>
              <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 bg-[#f3f4f6] text-[#6b7280] rounded-xl text-sm hover:bg-[#e5e7eb] transition-colors">
                <RotateCcw className="w-4 h-4" /> {isAr ? "إعادة البدء" : "Restart"}
              </button>
            </div>
          </div>
        </div>

        {failedIds.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1f2937] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> {failedIds.length} {isAr ? (failedIds.length !== 1 ? "ثغرات محددة" : "ثغرة محددة") : (failedIds.length !== 1 ? "Gaps Identified" : "Gap Identified")}
            </h3>
            {activeSections.map(section => {
              const fails = section.questions.filter(q => answers[q.id] === false);
              if (fails.length === 0) return null;
              return (
                <div key={section.id} className="bg-white border border-[#fca5a5] rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: section.color + '10', borderBottom: `1px solid ${section.color}30` }}>
                    {getIcon(section.icon, section.color)}
                    <span className="text-xs font-bold" style={{ color: section.color }}>{section.control} — {section.title}</span>
                  </div>
                  <div className="p-4 space-y-4">
                    {fails.map(q => (
                      <div key={q.id}>
                        <div className="flex items-start gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-[#1f2937]">{q.text}</span>
                        </div>
                        <div className="ml-6 p-3 bg-[#fff7ed] border border-[#fed7aa] rounded-lg text-xs text-[#92400e] leading-relaxed">
                          <strong>{isAr ? "التوصية:" : "Recommendation:"}</strong> {RECOMMENDATIONS[q.id]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        ) : (
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-5 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-700">{isAr ? "لا توجد ثغرات محددة" : "No gaps identified"}</div>
              <div className="text-xs text-emerald-600 mt-1">{isAr ? `تشير إجاباتك إلى أنك في وضع جيد للحصول على اعتماد ${ceLevel}. تواصل مع مدير حسابك لترتيب الاعتماد الرسمي.` : `Your responses indicate you are well-positioned for ${ceLevel} certification. Contact your account manager to arrange formal accreditation.`}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Question View ──────────────────────────────────────────────────────────
  const flatQ = activeSections.slice(0, currentSection).reduce((s, sec) => s + sec.questions.length, 0) + currentQ;

  return (
    <div className="space-y-4" dir={dir}>
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-[#9ca3af] mb-1.5">
          <span>{isAr ? `السؤال ${flatQ + 1} من ${TOTAL_QUESTIONS}` : `Question ${flatQ + 1} of ${TOTAL_QUESTIONS}`}</span>
          <span>{progress}% {isAr ? "مكتمل" : "complete"}</span>
        </div>
        <div className="h-1.5 bg-[#f3f4f6] rounded-full">
          <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #C65793, #4494D1)' }} />
        </div>
      </div>

      {/* Section pills */}
      <div className="flex gap-1.5">
        {activeSections.map((s, i) => (
          <div key={s.id} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < currentSection ? '#10b981' : i === currentSection ? s.color : '#f3f4f6' }} />
        ))}
      </div>

      {/* Section context header */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: section.color + '18' }}>
            {getIcon(section.icon, section.color)}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: section.color }}>{section.control} — {section.title}</div>
            <div className="text-xs font-semibold text-[#1f2937]">{section.tagline}</div>
          </div>
          <div className="ml-auto text-xs text-[#9ca3af]">{currentQ + 1}/{section.questions.length}</div>
        </div>
        <p className="text-xs text-[#6b7280] leading-relaxed">{section.intro}</p>
      </div>

      {/* Question card */}
      <div className="bg-white border-2 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all" style={{ borderColor: section.color + '60' }}>
        <h3 className="text-base font-bold text-[#1f2937] mb-4 leading-snug">{question.text}</h3>

        {/* Why it matters */}
        <div className="mb-3 p-3 rounded-xl border" style={{ background: section.color + '08', borderColor: section.color + '30' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: section.color }} />
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: section.color }}>{isAr ? "لماذا هذا مهم" : "Why this matters"}</span>
          </div>
          <p className="text-xs text-[#374151] leading-relaxed">{question.why}</p>
        </div>

        {/* Example toggle */}
        <button onClick={() => setShowExample(v => !v)}
          className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#6b7280] mb-4 transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
          {showExample ? (isAr ? 'إخفاء المثال' : 'Hide example') : (isAr ? 'عرض مثال من العالم الحقيقي' : 'Show a real-world example')}
        </button>

        {showExample && (
          <div className="mb-4 p-3 bg-[#f0f6ff] border border-[#4494D130] rounded-xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="w-3.5 h-3.5 text-[#4494D1]" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#4494D1]">{isAr ? "مثال" : "Example"}</span>
            </div>
            <p className="text-xs text-[#374151] leading-relaxed">{question.example}</p>
          </div>
        )}

        {/* Guidance */}
        <div className="mb-5 p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#9ca3af] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#6b7280] leading-relaxed">{question.guidance}</p>
          </div>
        </div>

        {/* Answer buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => answer(true)}
            className="flex items-center justify-center gap-2 py-4 bg-[#f0fdf4] border-2 border-[#10b981] text-[#059669] rounded-xl font-bold text-sm hover:bg-[#dcfce7] transition-all">
            <CheckCircle className="w-5 h-5" />
            <span>{isAr ? "نعم — مطبَّق" : "Yes — In place"}</span>
          </button>
          <button onClick={() => answer(false)}
            className="flex items-center justify-center gap-2 py-4 bg-[#fef2f2] border-2 border-[#ef4444] text-[#dc2626] rounded-xl font-bold text-sm hover:bg-[#fee2e2] transition-all">
            <XCircle className="w-5 h-5" />
            <span>{isAr ? "لا — غير مطبَّق" : "No — Not in place"}</span>
          </button>
        </div>
      </div>

      {/* Answered trail */}
      {currentQ > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">{isAr ? "تمت الإجابة مسبقًا في هذا القسم" : "Already answered in this section"}</div>
          {section.questions.slice(0, currentQ).map(q => (
            <div key={q.id} className="flex items-center gap-2.5 p-2.5 bg-white border border-[#e5e7eb] rounded-lg">
              {answers[q.id] === true
                ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              <span className="text-xs text-[#6b7280] truncate">{q.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
