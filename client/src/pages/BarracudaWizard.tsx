import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, CheckCircle2, ChevronDown, ChevronUp, Circle, ExternalLink, Info, ListChecks, Loader2, MonitorSmartphone, Pencil, Rocket, ShieldCheck, Sparkles, Ticket, Lightbulb, SlidersHorizontal, Feather, Layers } from 'lucide-react';
import { apiFetch, track } from '../lib/api';
import { useLang } from '../lib/LanguageContext';
import { Bubble, PromptBlock } from './ImplementationWizard';
import {
  BARRACUDA_PRODUCTS, BARRACUDA_PLANS, EGD_REGIONS, DEPTHS, CFG_QUESTIONS,
  buildBarracudaPlan, buildBarracudaPrompt, askedQuestions, questionsFor, defaultAnswers, describeAnswer, isRecommended, resolveDeployment, splitList,
  type Answers, type BarracudaBasics, type BarracudaProductId, type CfgQuestion, type Depth,
} from '../lib/barracudaImplementation';
import type { ImplPhase } from '../lib/keepitImplementation';

type Stage = 'products' | 'basics' | 'depth' | 'questions' | 'plan';
interface Saved { stage: Stage; basics: BarracudaBasics; answers: Answers; done: string[] }
const DEFAULT_BASICS: BarracudaBasics = { plan: '', products: [], region: 'UK', domains: '', alertEmail: '', deployment: 'recommend', depth: 'light' };
const SUPPORT_LINE = 'We can help you to find the answer to this question that is specific to your implementation, please contact our support team';
const GRAD = 'linear-gradient(135deg,#C65793,#4494D1)';
const ORDER: Stage[] = ['products', 'basics', 'depth', 'questions', 'plan'];

function Pill({ on, onClick, children, testid, title }: { on: boolean; onClick: () => void; children: React.ReactNode; testid?: string; title?: string }) {
  return (
    <button type="button" data-testid={testid} title={title} onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors text-left ${on ? 'bg-[#4494D1] border-[#4494D1] text-white' : 'bg-white border-[#e5e7eb] text-[#4b5563] hover:border-[#4494D1]'}`}>
      {on && <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}{children}
    </button>
  );
}

function QuestionCard({ q, answers, setAnswers, n }: { q: CfgQuestion; answers: Answers; setAnswers: (f: (a: Answers) => Answers) => void; n: number }) {
  const v = answers[q.id];
  const rec = isRecommended(q, answers);
  const set = (val: string) => setAnswers(a => {
    if (q.kind === 'single') return { ...a, [q.id]: val };
    const cur = Array.isArray(a[q.id]) ? (a[q.id] as string[]) : [];
    let nxt = cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val];
    if (q.id === 'trusted') nxt = nxt.filter(x => x === val);
    return { ...a, [q.id]: nxt };
  });
  const reset = () => setAnswers(a => { const c = { ...a }; c[q.id] = Array.isArray(q.recommended) ? [...q.recommended] : q.recommended; delete c[q.id + '_text']; return c; });
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 space-y-3" data-testid={`bq-${q.id}`}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#1f2937]"><span className="text-[#9b4da8] mr-1.5">{n}.</span>{q.title}</h4>
        {rec ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] whitespace-nowrap">Best practice</span>
          : <button onClick={reset} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280] hover:text-[#4494D1] whitespace-nowrap">Reset to recommended</button>}
      </div>
      <p className="text-xs text-[#4b5563] leading-relaxed">{q.explain}</p>
      <div className="flex gap-2 p-2.5 rounded-lg bg-[#f5f3ff] border border-[#ede9fe] text-xs text-[#5b21b6] leading-relaxed">
        <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span><span className="font-semibold">Our recommendation: </span>{q.bestPractice}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {q.options.map(o => {
          const on = q.kind === 'single' ? v === o.value : Array.isArray(v) && v.includes(o.value);
          return <Pill key={o.value} on={on} onClick={() => set(o.value)} testid={`bq-${q.id}-${o.value}`} title={o.desc}>{o.label}</Pill>;
        })}
      </div>
      {q.textLabel && (
        <label className="block text-xs text-[#4b5563] space-y-1">
          <span className="font-medium">{q.textLabel}</span>
          <input value={(answers[q.id + '_text'] as string) || ''} onChange={e => setAnswers(a => ({ ...a, [q.id + '_text']: e.target.value }))} placeholder={q.textPlaceholder}
            data-testid={`bq-${q.id}-text`} className="w-full border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[#4494D1]" />
        </label>
      )}
      <a href={q.link.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#4494D1] hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />Barracuda Campus: {q.link.label}</a>
    </div>
  );
}

export default function BarracudaWizard({ domain, accountName, onBack }: { domain: string; accountName: string; onBack: () => void }) {
  const { isAr } = useLang();
  const storeKey = `bp_impl_barracuda_${domain}`;
  const [saved, setSaved] = useState<Saved>(() => {
    try { const s = JSON.parse(localStorage.getItem(storeKey) || ''); if (s?.basics) return { ...s, answers: { ...defaultAnswers(), ...s.answers } }; } catch {}
    return { stage: 'products', basics: { ...DEFAULT_BASICS, domains: domain || '' }, answers: defaultAnswers(), done: [] };
  });
  const [howOpen, setHowOpen] = useState(saved.stage !== 'plan');
  const [ticket, setTicket] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  useEffect(() => { try { localStorage.setItem(storeKey, JSON.stringify(saved)); } catch {} }, [saved, storeKey]);

  const { stage, basics: b, answers } = saved;
  const at = (s: Stage) => ORDER.indexOf(stage) >= ORDER.indexOf(s);
  const setB = (p: Partial<BarracudaBasics>) => setSaved(s => ({ ...s, basics: { ...s.basics, ...p } }));
  const setAnswers = (f: (a: Answers) => Answers) => setSaved(s => ({ ...s, answers: f(s.answers) }));
  const go = (st: Stage) => { setSaved(s => ({ ...s, stage: st })); setTimeout(() => document.getElementById(`bw-stage-${st}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); };

  const productNames = b.products.map(p => BARRACUDA_PRODUCTS.find(x => x.id === p)?.name || p);
  const hasEgd = b.products.includes('egd');
  const hasIpIr = b.products.includes('ip') || b.products.includes('ir');
  const reg = EGD_REGIONS.find(r => r.id === b.region);
  const dep = resolveDeployment(b);
  const asked = askedQuestions(b, answers);
  const allQs = questionsFor(b, answers);

  const phases: ImplPhase[] = useMemo(() => stage === 'plan' ? buildBarracudaPlan(b, answers) : [], [stage, b, answers]);
  const allSteps = phases.flatMap(p => p.steps.map(s => ({ s, p })));
  const total = allSteps.length;
  const doneCount = allSteps.filter(x => saved.done.includes(x.s.id)).length;

  const choosePlan = (id: string) => {
    const pl = BARRACUDA_PLANS.find(p => p.id === id)!;
    const extras = b.products.filter(p => ['se', 'waas', 'xdr'].includes(p));
    setB({ plan: id, products: id === 'custom' ? b.products : Array.from(new Set([...pl.products, ...extras])) });
  };
  const toggleProduct = (id: BarracudaProductId) => setB({ products: b.products.includes(id) ? b.products.filter(p => p !== id) : [...b.products, id] });
  const orderedProducts = () => BARRACUDA_PRODUCTS.map(p => p.id).filter(id => b.products.includes(id));
  const chooseDepth = (d: Depth) => {
    setSaved(s => ({ ...s, basics: { ...s.basics, depth: d }, answers: d === 'light' ? defaultAnswers() : s.answers, stage: d === 'light' ? 'plan' : 'questions' }));
    track('implementation_depth', `Barracuda: ${d}`);
    setTimeout(() => document.getElementById(d === 'light' ? 'bw-stage-plan' : 'bw-stage-questions')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    if (d === 'light') { setHowOpen(false); track('implementation_plan', `Barracuda: ${orderedProducts().join(', ')} (light)`); }
  };
  const buildPlan = () => { go('plan'); setHowOpen(false); track('implementation_plan', `Barracuda: ${orderedProducts().join(', ')} (${b.depth})`); };
  const toggleDone = (id: string) => setSaved(s => ({ ...s, done: s.done.includes(id) ? s.done.filter(d => d !== id) : [...s.done, id] }));
  const jump = (id: string) => document.getElementById(`impl-step-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const startOver = () => setSaved({ stage: 'products', basics: { ...DEFAULT_BASICS, domains: domain || '' }, answers: defaultAnswers(), done: [] });

  const logTicket = async () => {
    setTicket('loading');
    try {
      const progress = allSteps.map(({ s }, i) => `${saved.done.includes(s.id) ? '[x]' : '[ ]'} ${i + 1}. ${s.title}`).join('\n');
      const choices = allQs.map(q => `- ${q.title}: ${describeAnswer(q, answers)}${isRecommended(q, answers) ? '' : ' (custom)'}`).join('\n');
      const r = await apiFetch('/api/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: `Implementation Help — Barracuda — ${accountName}`, description: `Implementation help requested via the portal Implementation wizard.\n\nPlan: ${BARRACUDA_PLANS.find(p => p.id === b.plan)?.name || 'Individual products'}\nProducts: ${productNames.join(', ')}\nRegion: ${reg?.label}\nDeployment: ${hasEgd ? dep.toUpperCase() : 'n/a'}\nDomains: ${b.domains}\nAlert email: ${b.alertEmail}\nDepth: ${b.depth}\n\nConfiguration choices:\n${choices}\n\nProgress:\n${progress}`, domain, customerName: accountName, priority: 2, type: 'Technical Issue', lang: isAr ? 'ar' : 'en' }),
      });
      const d = await r.json(); setTicket(d.ok ? 'done' : 'error');
    } catch { setTicket('error'); }
  };

  const groups = Array.from(new Set(BARRACUDA_PRODUCTS.map(m => m.group)));
  const basicsValid = b.alertEmail.includes('@') && splitList(b.domains).length > 0;
  const EditBtn = ({ to }: { to: Stage }) => stage !== to ? <button onClick={() => go(to)} className="ml-2 inline-flex items-center gap-1 text-[11px] text-white/85 hover:text-white underline-offset-2 hover:underline"><Pencil className="w-3 h-3" />{isAr ? 'تعديل' : 'Edit'}</button> : null;
  let stepCounter = 0;

  return (
    <div className="space-y-5" data-testid="barracuda-wizard">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} data-testid="impl-back" className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#1f2937]"><ArrowLeft className="w-4 h-4" /> {isAr ? 'رجوع' : 'Back'}</button>
          <div className="h-5 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-cta flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-white" /></div>
            <div>
              <div className="text-sm font-bold text-[#1f2937]">{isAr ? 'معالج تنفيذ Barracuda' : 'Barracuda Implementation Wizard'}</div>
              <div className="text-xs text-[#6b7280]">{isAr ? 'مبني على وثائق Barracuda Campus' : 'Built from Barracuda Campus documentation'}</div>
            </div>
          </div>
        </div>
        {stage !== 'products' && <button onClick={startOver} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#4b5563] hover:border-[#4494D1] hover:text-[#4494D1]">{isAr ? 'البدء من جديد' : 'Start over'}</button>}
      </div>

      {/* How to use */}
      <div className="rounded-2xl p-[1.5px]" style={{ background: 'linear-gradient(135deg,#C65793 0%,#9b4da8 40%,#5a6bbf 70%,#4494D1 100%)' }}>
        <div className="bg-white rounded-[15px]">
          <button onClick={() => setHowOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-3.5 text-left" data-testid="impl-howto-toggle">
            <span className="flex items-center gap-2 text-sm font-semibold text-[#1f2937]"><Info className="w-4 h-4 text-[#9b4da8]" /> {isAr ? 'كيف نقترح استخدام هذا القسم' : 'How we suggest you use this section'}</span>
            {howOpen ? <ChevronUp className="w-4 h-4 text-[#9ca3af]" /> : <ChevronDown className="w-4 h-4 text-[#9ca3af]" />}
          </button>
          {howOpen && (
            <div className="px-5 pb-5 space-y-4">
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#4b5563]">
                {(isAr ? [
                  ['أخبرنا بما اشتريته', 'اختر خطة Barracuda أو المنتجات الفردية، ثم المنطقة والنطاقات وعنوان التنبيهات.'],
                  ['اختر مستوى التفاصيل', 'لمسة خفيفة تطبق أفضل الممارسات تلقائياً؛ المتوسط يسأل عن أهم الخيارات؛ المخصص يتيح لك ضبط مجموعة واسعة من الإعدادات. كل خيار مشروح بلغة بسيطة مع توصيتنا.'],
                  ['دع أداة ذكاء اصطناعي تنفّذ كل خطوة', 'كل خطوة لها زر لإنشاء أمر Claude CoWork يتضمن اختياراتك. ستحتاج إلى اشتراك Claude يتضمن CoWork (أو أداة مماثلة يمكنها التحكم في متصفحك والوصول إليه). سجّل الدخول إلى بوابات الإدارة بنفسك أولاً.'],
                  ['راجع وأكمل', 'راقب الأداة ووافق على كل تغيير بنفسك، ثم احفظ تقرير الملخص وضع علامة على الخطوة كمكتملة. يتم حفظ التقدم على هذا الجهاز.'],
                ] : [
                  ['Tell us what you bought', 'Pick your Barracuda plan (or individual products), then your region, email domains and the address security alerts should go to.'],
                  ['Choose how hands-on you want to be', 'Light touch applies our best practice automatically. Intermediate asks about the most important options. Bespoke lets you shape a wide range of settings. Every option is explained in plain English with our recommendation.'],
                  ['Let an AI tool carry out each step', 'Every step has a button to generate a Claude CoWork prompt with your choices built in. You will need a Claude subscription that includes CoWork (or a similar AI tool that can control and access your browser). Sign in to the admin portals yourself first, then paste in one prompt at a time.'],
                  ['Review and tick off', 'Watch the AI as it works and approve sign-ins, consent screens and every change yourself. Save its Summary Report as your runbook, then mark the step complete — progress is saved on this device.'],
                ]).map(([h, body], i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl bg-[#f9fafb] border border-[#f3f4f6]">
                    <span className="w-6 h-6 rounded-full gradient-cta text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div><div className="font-semibold text-[#1f2937] text-sm mb-0.5">{h}</div><div className="text-xs leading-relaxed">{body}</div></div>
                  </li>
                ))}
              </ol>
              <div className="flex gap-2.5 p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-xs text-[#92400e] leading-relaxed">
                <MonitorSmartphone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{isAr
                  ? 'تطلب الأوامر من الأداة التوقف عند شاشات تسجيل الدخول والموافقة، وتسجيل القيم الحالية قبل أي تغيير، وعدم التعامل مع كلمات المرور. تغييرات تدفق البريد وDNS تؤثر على جميع المستخدمين — خطط لها خارج ساعات العمل إن أمكن.'
                  : 'Prompts tell the AI to pause at sign-in and consent screens, record current values before changing anything, and never handle passwords or secrets. Mail-flow and DNS changes affect every user, so plan those for a quiet period. Prefer not to use AI? Follow the short steps manually, or contact us and we can help.'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          {/* Stage 1: products */}
          <div id="bw-stage-products" className="scroll-mt-24">
            <Bubble role="assistant">
              <div className="p-4 space-y-4">
                <p className="text-sm text-[#374151] leading-relaxed">
                  {isAr
                    ? `مرحباً ${accountName}! سأرشدك خلال تنفيذ Barracuda. أي خطة أو منتجات اشتريت؟ اختيار خطة يحدد المنتجات المضمنة تلقائياً، ويمكنك إضافة منتجات أخرى.`
                    : `Hi ${accountName} — let's get Barracuda implemented. Which plan or products have you bought? Choosing a plan ticks the products it includes; you can add others such as SecureEdge, WAF-as-a-Service or XDR.`}
                </p>
                {stage === 'products' ? <>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1.5">{isAr ? 'خطة Email Protection' : 'Email Protection plan'}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {BARRACUDA_PLANS.map(p => <Pill key={p.id} on={b.plan === p.id} onClick={() => choosePlan(p.id)} testid={`bw-plan-${p.id}`} title={p.note}>{p.name}</Pill>)}
                    </div>
                  </div>
                  {groups.map(g => (
                    <div key={g}>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1.5">{g}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {BARRACUDA_PRODUCTS.filter(m => m.group === g).map(m => <Pill key={m.id} on={b.products.includes(m.id)} onClick={() => toggleProduct(m.id)} testid={`bw-product-${m.id}`} title={m.hint}>{m.name}</Pill>)}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setB({ products: orderedProducts() }); go('basics'); }} disabled={!b.products.length} data-testid="bw-next-products"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ background: GRAD }}>{isAr ? 'التالي' : 'Next'}</button>
                </> : null}
              </div>
            </Bubble>
          </div>
          {at('basics') && <Bubble role="user">{BARRACUDA_PLANS.find(p => p.id === b.plan && p.id !== 'custom')?.name ? `${BARRACUDA_PLANS.find(p => p.id === b.plan)?.name}: ` : ''}{productNames.join(', ')}<EditBtn to="products" /></Bubble>}

          {/* Stage 2: basics */}
          {at('basics') && <div id="bw-stage-basics" className="scroll-mt-24"><Bubble role="assistant">
            <div className="p-4 space-y-4">
              <p className="text-sm text-[#374151] leading-relaxed">{isAr ? 'رائع. بعض الأساسيات التي نحتاجها لكل مستوى:' : 'Great. A few essentials we need whichever level of detail you choose:'}</p>
              {stage === 'basics' ? <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(hasEgd || b.products.includes('di') || b.products.includes('se')) && <label className="text-xs text-[#4b5563] space-y-1">
                    <span className="font-semibold">{isAr ? 'منطقة مركز البيانات' : 'Data centre region'}</span>
                    <select value={b.region} onChange={e => setB({ region: e.target.value })} className="w-full border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-sm bg-white" data-testid="bw-region">
                      {EGD_REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                    <span className="block text-[11px] text-[#9ca3af]">{isAr ? 'لا يمكن تغيير منطقة Email Gateway Defense لاحقاً.' : 'The Email Gateway Defense region cannot be changed later — choose where your data must live.'}</span>
                  </label>}
                  <label className="text-xs text-[#4b5563] space-y-1">
                    <span className="font-semibold">{isAr ? 'عنوان تنبيهات فريق الأمن' : 'Security alert email (ideally a distribution list)'}</span>
                    <input value={b.alertEmail} onChange={e => setB({ alertEmail: e.target.value })} placeholder="security@yourco.com" data-testid="bw-alert" className="w-full border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-sm bg-white" />
                  </label>
                  <label className="text-xs text-[#4b5563] space-y-1 sm:col-span-2">
                    <span className="font-semibold">{isAr ? 'نطاقات البريد الإلكتروني (الأساسي أولاً)' : 'Email domains to protect (primary first, comma separated)'}</span>
                    <input value={b.domains} onChange={e => setB({ domains: e.target.value })} placeholder="yourco.com, yourco.co.uk" data-testid="bw-domains" className="w-full border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-sm bg-white" />
                  </label>
                </div>
                {hasEgd && <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#4b5563]">{isAr ? 'طريقة النشر' : 'How should email reach Barracuda?'}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([
                      ['recommend', 'Recommend for me', `We will choose. For you that means ${resolveDeployment({ ...b, deployment: 'recommend' }) === 'mx' ? 'MX' : 'Inline'}.`],
                      ['mx', 'MX records', 'Barracuda receives mail first. Enables Email Continuity and lets you lock Microsoft 365 to Barracuda only. Needs DNS changes.'],
                      ['inline', 'Inline', hasIpIr ? 'Microsoft 365 receives mail first; the wizard builds connectors for you. No Email Continuity; duplicates in Cloud Archiving.' : 'Needs Impersonation Protection / Incident Response in your plan — standalone EGD must use MX.'],
                    ] as const).map(([id, t, d]) => {
                      const disabled = id === 'inline' && !hasIpIr;
                      const on = b.deployment === id;
                      return (
                        <button key={id} disabled={disabled} onClick={() => setB({ deployment: id })} data-testid={`bw-dep-${id}`}
                          className={`text-left p-3 rounded-xl border text-xs transition-colors ${disabled ? 'opacity-40 cursor-not-allowed border-[#e5e7eb]' : on ? 'border-[#4494D1] bg-[#4494D10d]' : 'border-[#e5e7eb] hover:border-[#4494D1]'}`}>
                          <div className="font-semibold text-[#1f2937] mb-1 flex items-center gap-1">{on && <CheckCircle2 className="w-3.5 h-3.5 text-[#4494D1]" />}{t}</div>
                          <div className="text-[#6b7280] leading-relaxed">{d}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 p-2.5 rounded-lg bg-[#f5f3ff] border border-[#ede9fe] text-xs text-[#5b21b6] leading-relaxed">
                    <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span><span className="font-semibold">Our recommendation: </span>MX deployment for most organisations — it is the only option with Email Continuity and spooling, lets you restrict Microsoft 365 to accept mail only from Barracuda, and avoids duplicate records in Cloud Archiving. Inline suits Microsoft 365-only tenants with several domains that want Microsoft to stay the first hop. Switching later needs a Barracuda Support reset.</span>
                  </div>
                </div>}
                <button onClick={() => go('depth')} disabled={!basicsValid} data-testid="bw-next-basics" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ background: GRAD }}>{isAr ? 'التالي' : 'Next'}</button>
                {!basicsValid && <p className="text-[11px] text-[#9ca3af]">{isAr ? 'أدخل نطاقاً واحداً على الأقل وعنوان بريد للتنبيهات.' : 'Enter at least one domain and an alert email address.'}</p>}
              </> : null}
            </div>
          </Bubble></div>}
          {at('depth') && <Bubble role="user">{[hasEgd || b.products.includes('di') ? reg?.label : '', splitList(b.domains).join(', '), b.alertEmail, hasEgd ? (dep === 'mx' ? 'MX deployment' : 'Inline deployment') : ''].filter(Boolean).join(' · ')}<EditBtn to="basics" /></Bubble>}

          {/* Stage 3: depth */}
          {at('depth') && <div id="bw-stage-depth" className="scroll-mt-24"><Bubble role="assistant">
            <div className="p-4 space-y-3">
              <p className="text-sm text-[#374151] leading-relaxed">{isAr ? 'ما مدى مشاركتك في قرارات الإعداد؟' : 'How involved would you like to be in the configuration decisions?'}</p>
              {stage === 'depth' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DEPTHS.map((d, i) => {
                    const Icon = [Feather, SlidersHorizontal, Layers][i];
                    const count = d.id === 'light' ? 0 : questionsFor(b, answers).filter(q => d.id === 'bespoke' || q.level === 'intermediate').length;
                    return (
                      <button key={d.id} onClick={() => chooseDepth(d.id)} data-testid={`bw-depth-${d.id}`} className="text-left p-3.5 rounded-xl border border-[#e5e7eb] hover:border-[#4494D1] hover:shadow-sm transition-all space-y-1.5">
                        <div className="flex items-center gap-2"><span className="w-7 h-7 rounded-lg gradient-cta flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-white" /></span><span className="text-sm font-bold text-[#1f2937]">{isAr ? d.titleAr : d.title}</span></div>
                        <p className="text-xs text-[#6b7280] leading-relaxed">{isAr ? d.descAr : d.desc}</p>
                        <p className="text-[11px] font-medium text-[#9b4da8]">{d.id === 'light' ? (isAr ? 'بدون أسئلة إضافية' : 'No extra questions') : `${count} ${isAr ? 'سؤال' : 'questions'}`}</p>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </Bubble></div>}
          {at('questions') && <Bubble role="user">{DEPTHS.find(d => d.id === b.depth)?.[isAr ? 'titleAr' : 'title']}<EditBtn to="depth" /></Bubble>}

          {/* Stage 4: questions */}
          {at('questions') && b.depth !== 'light' && <div id="bw-stage-questions" className="scroll-mt-24"><Bubble role="assistant">
            <div className="p-4 space-y-4">
              <p className="text-sm text-[#374151] leading-relaxed">{isAr
                ? `إليك ${asked.length} خياراً مهماً. كل خيار محدد مسبقاً بتوصيتنا — غيّر ما تريد فقط. أي شيء لا نسأل عنه يتبع أفضل الممارسات.`
                : `Here are ${asked.length} decisions that matter most for your setup. Each one is pre-set to our recommendation — only change what you want to. Anything we don't ask about follows best practice.`}</p>
              {stage === 'questions' ? <>
                {b.products.filter(p => asked.some(q => q.product === p)).map(p => (
                  <div key={p} className="space-y-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9b4da8] pt-1">{BARRACUDA_PRODUCTS.find(x => x.id === p)?.name}</div>
                    {asked.filter(q => q.product === p).map(q => <QuestionCard key={q.id} q={q} answers={answers} setAnswers={setAnswers} n={asked.indexOf(q) + 1} />)}
                  </div>
                ))}
                <button onClick={buildPlan} data-testid="bw-build" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: GRAD }}>
                  <ListChecks className="w-4 h-4" /> {isAr ? 'إنشاء خطة التنفيذ' : 'Build my implementation plan'}
                </button>
              </> : null}
            </div>
          </Bubble></div>}
          {stage === 'plan' && b.depth !== 'light' && <Bubble role="user">{(() => { const c = asked.filter(q => !isRecommended(q, answers)).length; return isAr ? `اخترت ${asked.length - c} توصية و${c} تغييراً مخصصاً` : `${asked.length - c} recommended, ${c} customised`; })()}<EditBtn to="questions" /></Bubble>}

          {/* Stage 5: plan */}
          {stage === 'plan' && <div id="bw-stage-plan" className="scroll-mt-24 space-y-4">
            <Bubble role="assistant">
              <div className="p-4 space-y-3">
                <p className="text-sm text-[#374151] leading-relaxed flex gap-2"><Sparkles className="w-4 h-4 text-[#9b4da8] flex-shrink-0 mt-0.5" />{isAr ? 'هذه هي الإعدادات التي سنطبقها. كل منها مضمّن في أوامر CoWork للخطوات المعنية.' : 'Here is the configuration we will apply. Each choice is built into the CoWork prompts for the relevant steps.'}</p>
                <div className="rounded-xl border border-[#f3f4f6] divide-y divide-[#f3f4f6]" data-testid="bw-summary">
                  {allQs.map(q => {
                    const rec = isRecommended(q, answers);
                    return (
                      <div key={q.id} className="flex items-start justify-between gap-3 px-3 py-2">
                        <div className="min-w-0"><div className="text-[11px] text-[#9ca3af]">{BARRACUDA_PRODUCTS.find(x => x.id === q.product)?.name}</div><div className="text-xs font-medium text-[#1f2937]">{q.title}</div><div className="text-xs text-[#4b5563]">{describeAnswer(q, answers)}</div></div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${rec ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#e0f2fe] text-[#075985]'}`}>{rec ? (asked.includes(q) ? 'Best practice' : 'Best practice applied') : 'Your choice'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Bubble>
            <Bubble role="assistant">
              <div className="p-4 border-b border-[#f3f4f6]">
                <p className="text-sm text-[#374151] leading-relaxed">{isAr
                  ? `إليك خطة التنفيذ: ${phases.length} أقسام و${total} خطوة بالترتيب الذي توصي به Barracuda. استخدم زر Claude CoWork لكل خطوة، أو اتبع الإجراءات المختصرة يدوياً. التفاصيل التقنية معروضة بالإنجليزية لتطابق واجهات المنتجات.`
                  : `Here's your implementation plan — ${phases.length} sections and ${total} steps, in the order Barracuda recommends. Work through them in sequence: use the Claude CoWork button on each step to have the AI carry it out, or follow the short actions yourself.`}</p>
              </div>
              {phases.map((p, pi) => (
                <div key={p.id} className="border-b border-[#f3f4f6] last:border-b-0">
                  <div className="px-4 pt-4 pb-2 flex items-baseline justify-between gap-2">
                    <div><div className="text-[11px] font-semibold uppercase tracking-wide text-[#9b4da8]">{isAr ? 'القسم' : 'Section'} {pi + 1}</div><h3 className="text-base font-bold text-[#1f2937]">{p.title}</h3></div>
                    <span className="text-xs text-[#9ca3af] text-right">{p.subtitle}</span>
                  </div>
                  {p.note && <p className="mx-4 mb-2 text-xs text-[#6b7280] bg-[#f9fafb] border border-[#f3f4f6] rounded-lg px-3 py-2">{p.note}</p>}
                  <div className="px-4 pb-4 space-y-3">
                    {p.steps.map(s => {
                      stepCounter += 1; const n = stepCounter;
                      const idx = allSteps.findIndex(x => x.s.id === s.id);
                      const next = allSteps[idx + 1]?.s;
                      const done = saved.done.includes(s.id);
                      const prompt = buildBarracudaPrompt(s, { accountName, phase: p, stepNo: n, total, next, basics: b, answers });
                      return (
                        <div key={s.id} id={`impl-step-${s.id}`} className={`scroll-mt-24 rounded-xl border p-3.5 ${done ? 'border-[#bbf7d0] bg-[#f0fdf4]' : 'border-[#e5e7eb] bg-white'}`}>
                          <div className="flex items-start gap-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-[#10b981] text-white' : 'bg-[#4494D112] text-[#4494D1]'}`}>{done ? <CheckCircle className="w-4 h-4" /> : n}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <h4 className="text-sm font-semibold text-[#1f2937]">{s.title}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280] whitespace-nowrap">{s.portal}</span>
                              </div>
                              <p className="text-xs text-[#4b5563] leading-relaxed mt-1">{s.summary}</p>
                              <ul className="mt-2 space-y-1">{s.actions.map((x, i) => <li key={i} className="text-xs text-[#374151] flex gap-1.5"><span className="text-[#C65793] mt-px">›</span><span className="break-words min-w-0">{x}</span></li>)}</ul>
                              {s.needs?.length ? <p className="text-[11px] text-[#6b7280] mt-2"><span className="font-semibold">{isAr ? 'تحتاج إلى: ' : 'You will need: '}</span>{s.needs.join(' · ')}</p> : null}
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">{s.links.map(l => <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#4494D1] hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />{l.label}</a>)}</div>
                              <div className="flex items-end justify-between gap-2 flex-wrap">
                                <PromptBlock step={s} prompt={prompt} isAr={isAr} vendor="Barracuda" />
                                <button onClick={() => toggleDone(s.id)} data-testid={`impl-done-${s.id}`} className={`mt-3 text-xs font-medium inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${done ? 'border-[#10b981] text-[#047857] bg-white' : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#10b981] hover:text-[#047857]'}`}>
                                  {done ? <><CheckCircle className="w-3.5 h-3.5" /> {isAr ? 'مكتملة' : 'Completed'}</> : <><Circle className="w-3.5 h-3.5" /> {isAr ? 'وضع علامة كمكتملة' : 'Mark complete'}</>}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="p-4 bg-[#f9fafb] space-y-3">
                <p className="text-sm text-[#374151]">{isAr ? 'يمكننا مساعدتك في العثور على إجابة خاصة بتنفيذك، يرجى التواصل مع فريق الدعم لدينا' : SUPPORT_LINE}</p>
                {ticket === 'done' ? <div className="text-xs text-[#047857] flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {isAr ? 'تم إنشاء التذكرة — سيتواصل فريقنا معك.' : 'Ticket logged — our team will be in touch.'}</div> : (
                  <button onClick={logTicket} disabled={ticket === 'loading'} data-testid="impl-ticket" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white disabled:opacity-60" style={{ background: GRAD }}>
                    {ticket === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ticket className="w-3.5 h-3.5" />} {isAr ? 'اطلب المساعدة في التنفيذ' : 'Ask us for implementation help'}
                  </button>
                )}
                {ticket === 'error' && <p className="text-xs text-[#b91c1c]">{isAr ? 'تعذّر إنشاء التذكرة. راسل support@broadpeakcyber.com' : 'Could not log the ticket — please email support@broadpeakcyber.com'}</p>}
              </div>
            </Bubble>
          </div>}
        </div>

        {/* Roadmap */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-4">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg,#C65793,#9b4da8,#4494D1)' }} />
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-3">{isAr ? 'خريطة التنفيذ' : 'Implementation roadmap'}</h3>
              {stage !== 'plan' ? (
                <ol className="space-y-2">
                  {[['products', isAr ? 'المنتجات' : 'Products'], ['basics', isAr ? 'الأساسيات' : 'Essentials'], ['depth', isAr ? 'مستوى التفاصيل' : 'Level of detail'], ['questions', isAr ? 'خيارات الإعداد' : 'Configuration choices'], ['plan', isAr ? 'خطتك' : 'Your plan']].map(([id, label], i) => {
                    const cur = stage === id; const past = ORDER.indexOf(stage) > ORDER.indexOf(id as Stage);
                    return <li key={id} className={`flex items-center gap-2 text-xs ${cur ? 'text-[#1f2937] font-semibold' : past ? 'text-[#10b981]' : 'text-[#9ca3af]'}`}>{past ? <CheckCircle className="w-3.5 h-3.5" /> : <span className={`w-3.5 h-3.5 rounded-full border text-[9px] flex items-center justify-center ${cur ? 'border-[#4494D1] text-[#4494D1]' : 'border-[#d1d5db]'}`}>{i + 1}</span>}{label}</li>;
                  })}
                </ol>
              ) : <>
                <div className="flex items-center justify-between text-xs text-[#6b7280] mb-1.5"><span>{doneCount} / {total} {isAr ? 'خطوات مكتملة' : 'steps complete'}</span><span>{total ? Math.round(doneCount / total * 100) : 0}%</span></div>
                <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden mb-4"><div className="h-full rounded-full transition-all" style={{ width: `${total ? doneCount / total * 100 : 0}%`, background: 'linear-gradient(90deg,#C65793,#4494D1)' }} /></div>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {(() => { let k = 0; return phases.map((p, pi) => (
                    <div key={p.id}>
                      <div className="text-xs font-bold text-[#1f2937] mb-1">{pi + 1}. {p.title}</div>
                      <div className="space-y-0.5 border-l-2 border-[#f3f4f6] ml-1.5 pl-3">
                        {p.steps.map(s => { k += 1; const d = saved.done.includes(s.id); return (
                          <button key={s.id} onClick={() => jump(s.id)} className="w-full text-left flex items-start gap-1.5 py-1 text-xs hover:text-[#4494D1]">
                            {d ? <CheckCircle className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0 mt-px" /> : <span className="w-3.5 text-[10px] text-[#9ca3af] flex-shrink-0 mt-px text-center">{k}</span>}
                            <span className={d ? 'text-[#9ca3af] line-through' : 'text-[#4b5563]'}>{s.title}</span>
                          </button>
                        ); })}
                      </div>
                    </div>
                  )); })()}
                </div>
              </>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// keep tree-shaking happy for unused icon import in some builds
void Rocket; void CFG_QUESTIONS;
