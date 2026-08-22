// ── Broad Peak Portal — Internationalisation ──────────────────────────────────
// Two languages: English (default) and Arabic (RTL)
// Auth flow is language-independent — only UI strings change.

export type Lang = 'en' | 'ar';

export const translations = {
  en: {
    // Login
    customerPortal: 'Customer Portal',
    signInToAccess: 'Sign in to access your account',
    emailDomain: 'Your email domain',
    emailDomainPlaceholder: 'e.g. yourcompany.com',
    emailDomainHint: 'Enter the part after @ in your work email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    adminLogin: 'Admin login',
    noAccount: 'No account found for this domain. Please contact your Broad Peak account manager.',

    // Header
    signOut: 'Sign out',

    // Welcome banner
    welcomeBack: 'Welcome back',
    activeSecurityServices: 'active security services',

    // Tabs
    myProducts: 'My Products',
    technicalSupport: 'Technical Support',
    newsUpdates: 'News & Updates',
    resources: 'Resources',
    ceReadiness: 'CE Readiness',
    riskScore: 'Risk Score',

    // Products tab
    yourProducts: 'Your Products',
    yourAccountManager: 'Your Account Manager',
    askBroadPeakAI: 'Ask Broad Peak AI',
    cyberRiskScore: 'Cyber Risk Score',
    noRiskAssessment: 'No risk assessment on file for your organisation.',
    takeAssessment: 'Take Assessment',
    retake: 'Retake ↗',
    takeAssessmentLink: 'Take Assessment ↗',
    lastAssessed: 'Last assessed',
    strongPosture: '✓ Strong security posture',
    someAttention: '⚠ Some areas need attention',
    significantGaps: '⚠ Significant gaps identified',
    clickRetake: '— click Retake to reassess',
    noDataFound: 'No data found for this account',

    // Category status
    active: 'Active',
    expired: 'Expired',
    notOwned: 'Not owned',

    // Category detail modal
    supportingDocuments: 'Supporting Documents',
    vendorExpertise: 'Vendor Expertise',
    viewKnowledgeBase: 'View Knowledge Base',
    viewWebsite: 'Visit Website',

    // Account manager card
    bookMeeting: 'Book a Meeting',
    sendEmail: 'Send Email',
    callNow: 'Call Now',
    contactOurTeam: 'Contact Our Team',
    noVideoYet: 'Your account manager can add a personal welcome video via the admin panel',

    // Chat
    typeQuestion: 'Type a question…',
    send: 'Send',
    happyWithResponse: "I'm happy with this",
    speakToHuman: 'Speak to a human',
    ticketSubject: 'Subject',
    ticketSubjectPlaceholder: 'Brief description of your issue',
    ticketDescription: 'Description',
    ticketDescriptionPlaceholder: 'Please describe your issue in detail…',
    ticketPriority: 'Priority',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    logTicket: 'Log a Ticket',
    loggingTicket: 'Creating support ticket…',
    ticketRaised: 'Support ticket raised — your account manager will be in touch shortly.',
    logSupportTicket: 'Log a support ticket — our team will be in touch',
    cancel: 'Cancel',

    // Technical support tab
    selectCategory: 'Select a security category to get technical support',
    technicalSupportDescription: 'The Broad Peak Technical Support AI has been trained on the vendor documentation for your products and can provide quick, precise answers to technical support issues. And whilst we might be AI first for speed, we\'re people focussed, and at any time you can contact a real human by selecting "Log a Ticket" to get through to our technical team as well as being able to find your Account Manager\'s direct contact details on the right side of this page.',
    supportTickets: 'Support Tickets',
    newTicket: 'New Ticket',
    noTickets: 'No support tickets found for your domain.',
    viewKB: 'View Knowledge Base',
    openTicket: 'Open',
    pendingTicket: 'Pending',
    resolvedTicket: 'Resolved',
    closedTicket: 'Closed',

    // News tab
    broadPeakNewsletters: 'Broad Peak Newsletters',
    noNewsletters: 'No newsletters yet',
    noNewslettersHint: 'Broad Peak newsletters will appear here when published',
    vendorResourceLibraries: 'Vendor Resource Libraries',
    visitLibrary: 'Visit library',

    // Resources tab
    vendorDatasheets: 'Vendor Datasheets & Product Guides',
    resources_count: 'resources',

    // CE Readiness & Risk Score — headings handled by child components
  },

  ar: {
    // Login
    customerPortal: 'بوابة العملاء',
    signInToAccess: 'سجّل الدخول للوصول إلى حسابك',
    emailDomain: 'نطاق بريدك الإلكتروني',
    emailDomainPlaceholder: 'مثال: yourcompany.com',
    emailDomainHint: 'أدخل الجزء الذي يلي @ في بريدك المهني',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signingIn: 'جارٍ تسجيل الدخول…',
    adminLogin: 'دخول المشرف',
    noAccount: 'لم يتم العثور على حساب لهذا النطاق. يُرجى التواصل مع مدير حسابك في Broad Peak.',

    // Header
    signOut: 'تسجيل الخروج',

    // Welcome banner
    welcomeBack: 'مرحباً بعودتك',
    activeSecurityServices: 'خدمة أمنية نشطة',

    // Tabs
    myProducts: 'منتجاتي',
    technicalSupport: 'الدعم التقني',
    newsUpdates: 'الأخبار والتحديثات',
    resources: 'الموارد',
    ceReadiness: 'الاستعداد للامتثال',
    riskScore: 'تقييم المخاطر',

    // Products tab
    yourProducts: 'منتجاتك',
    yourAccountManager: 'مدير حسابك',
    askBroadPeakAI: 'اسأل Broad Peak AI',
    cyberRiskScore: 'تقييم المخاطر الإلكترونية',
    noRiskAssessment: 'لا يوجد تقييم للمخاطر مسجّل لمؤسستك.',
    takeAssessment: 'ابدأ التقييم',
    retake: 'إعادة التقييم ↗',
    takeAssessmentLink: 'ابدأ التقييم ↗',
    lastAssessed: 'آخر تقييم',
    strongPosture: '✓ وضع أمني قوي',
    someAttention: '⚠ بعض المجالات تحتاج اهتماماً',
    significantGaps: '⚠ ثغرات جوهرية محددة',
    clickRetake: '— انقر إعادة التقييم للمراجعة',
    noDataFound: 'لم يتم العثور على بيانات لهذا الحساب',

    // Category status
    active: 'نشط',
    expired: 'منتهي',
    notOwned: 'غير مملوك',

    // Category detail modal
    supportingDocuments: 'الوثائق الداعمة',
    vendorExpertise: 'خبرة الموردين',
    viewKnowledgeBase: 'عرض قاعدة المعرفة',
    viewWebsite: 'زيارة الموقع',

    // Account manager card
    bookMeeting: 'حجز اجتماع',
    sendEmail: 'إرسال بريد إلكتروني',
    callNow: 'اتصل الآن',
    contactOurTeam: 'تواصل مع فريقنا',
    noVideoYet: 'يمكن لمدير حسابك إضافة مقطع ترحيب شخصي عبر لوحة الإدارة',

    // Chat
    typeQuestion: 'اكتب سؤالك هنا…',
    send: 'إرسال',
    happyWithResponse: 'أنا راضٍ عن هذه الإجابة',
    speakToHuman: 'التحدث مع شخص',
    ticketSubject: 'الموضوع',
    ticketSubjectPlaceholder: 'وصف مختصر للمشكلة',
    ticketDescription: 'التفاصيل',
    ticketDescriptionPlaceholder: 'يُرجى وصف مشكلتك بالتفصيل…',
    ticketPriority: 'الأولوية',
    priorityLow: 'منخفضة',
    priorityMedium: 'متوسطة',
    priorityHigh: 'عالية',
    priorityUrgent: 'عاجلة',
    logTicket: 'تسجيل تذكرة',
    loggingTicket: 'جارٍ إنشاء تذكرة الدعم…',
    ticketRaised: 'تم تسجيل تذكرة الدعم — سيتواصل معك مدير حسابك قريباً.',
    logSupportTicket: 'سجّل تذكرة دعم — سيتواصل معك فريقنا',
    cancel: 'إلغاء',

    // Technical support tab
    selectCategory: 'اختر فئة الأمان للحصول على الدعم التقني',
    technicalSupportDescription: 'تم تدريب نظام Broad Peak للدعم التقني على وثائق الموردين الخاصة بمنتجاتك، ويمكنه تقديم إجابات دقيقة وسريعة لمشاكل الدعم التقني. ورغم أننا نُقدّم الذكاء الاصطناعي أولاً للسرعة، إلا أننا نركّز على الإنسان، ويمكنك في أي وقت التواصل مع شخص حقيقي بالنقر على "تسجيل تذكرة" للوصول إلى فريقنا التقني.',
    supportTickets: 'تذاكر الدعم',
    newTicket: 'تذكرة جديدة',
    noTickets: 'لا توجد تذاكر دعم لنطاقك.',
    viewKB: 'عرض قاعدة المعرفة',
    openTicket: 'مفتوحة',
    pendingTicket: 'معلقة',
    resolvedTicket: 'محلولة',
    closedTicket: 'مغلقة',

    // News tab
    broadPeakNewsletters: 'نشرات Broad Peak الإخبارية',
    noNewsletters: 'لا توجد نشرات بعد',
    noNewslettersHint: 'ستظهر نشرات Broad Peak هنا عند نشرها',
    vendorResourceLibraries: 'مكتبات موارد الموردين',
    visitLibrary: 'زيارة المكتبة',

    // Resources tab
    vendorDatasheets: 'ملخصات المنتجات وأدلة الموردين',
    resources_count: 'مورد',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Lang, key: TranslationKey): string {
  return (translations[lang] as any)[key] ?? (translations.en as any)[key] ?? key;
}
