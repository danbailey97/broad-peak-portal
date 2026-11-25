import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, CheckCircle, CheckCircle2, ChevronDown, ChevronUp, Clipboard, Cpu, ExternalLink, Info, ListChecks, Loader2, Rocket, Ticket, UserRound, Circle, MonitorSmartphone } from 'lucide-react';
import { apiFetch, track } from '../lib/api';
import { useLang } from '../lib/LanguageContext';
import { KEEPIT_MODULES, KEEPIT_DATACENTRES, buildKeepitPlan, buildCoworkPrompt, type ImplOptions, type ImplPhase, type ImplStep } from '../lib/keepitImplementation';

interface Saved { opts: ImplOptions; built: boolean; done: string[] }
const DEFAULT_OPTS: ImplOptions = { modules: [], dc: 'uk-ld', teamsChats: true, largeTenant: false, keyVault: false };
const SUPPORT_LINE = 'We can help you to find the answer to this question that is specific to your implementation, please contact our support team';

export function Bubble({ role, children }: { role: 'assistant' | 'user'; children: React.ReactNode }) {
  if (role === 'user') return (
    <div className="flex justify-end gap-2">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white" style={{ background: 'linear-gradient(135deg,#C65793,#4494D1)' }}>{children}</div>
      <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center flex-shrink-0"><UserRound className="w-4 h-4 text-[#6b7280]" /></div>
    </div>
  );
  return (
    <div className="flex gap-2">
      <div className="w-8 h-8 rounded-full gradient-cta flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-white" /></div>
      <div className="flex-1 min-w-0 bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-sm shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">{children}</div>
    </div>
  );
}

export function PromptBlock({ step, prompt, isAr, vendor = 'Keepit' }: { step: ImplStep; prompt: string; isAr: boolean; vendor?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (step.infoOnly) return null;
  const copy = () => navigator.clipboard.writeText(prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  return (
    <div className="mt-3">
      {!open ? (
        <button data-testid={`impl-prompt-${step.id}`} onClick={() => { setOpen(true); track('implementation_prompt', `${vendor}: ${step.id}`); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors shadow-sm">
          <Cpu className="w-3 h-3" /> {isAr ? 'أمر Claude CoWork لهذه الخطوة' : 'Claude CoWork prompt for this step'}
        </button>
      ) : (
        <div className="space-y-2 border border-[#d8b4fe] bg-[#faf7ff] rounded-xl p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5b21b6] flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> {isAr ? 'أمر Claude CoWork جاهز' : 'Claude CoWork prompt ready'}</span>
            <div className="flex gap-1.5">
              <button onClick={copy} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-[#d8b4fe] text-[#7c3aed] hover:bg-[#ede9fe]">
                {copied ? <><CheckCircle className="w-3 h-3 text-[#10b981]" /> {isAr ? 'تم النسخ' : 'Copied'}</> : <><Clipboard className="w-3 h-3" /> {isAr ? 'نسخ' : 'Copy'}</>}
              </button>
              <button onClick={() => setOpen(false)} className="px-2 py-1 rounded-lg text-xs text-[#6b7280] hover:bg-white"><ChevronUp className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <pre className="text-[11px] text-[#374151] bg-white border border-[#e5e7eb] rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-mono">{prompt}</pre>
          <p className="text-[11px] text-[#6b7280]">{isAr ? 'الصق هذا الأمر في Claude CoWork مع تفعيل التحكم في المتصفح. سجّل الدخول إلى بوابات الإدارة بنفسك أولاً.' : 'Paste into Claude CoWork (or a similar browser-controlling AI tool). Sign in to the admin portals yourself first — the AI will stop and hand back to you at sign-ins and consent screens.'}</p>
        </div>
      )}
    </div>
  );
}

export default function ImplementationWizard({ domain, accountName, onBack }: { domain: string; accountName: string; onBack: () => void }) {
  const { isAr } = useLang();
  const storeKey = `bp_impl_keepit_${domain}`;
  const [saved, setSaved] = useState<Saved>(() => {
    try { const s = JSON.parse(localStorage.getItem(storeKey) || ''); if (s?.opts) return s; } catch {}
    return { opts: DEFAULT_OPTS, built: false, done: [] };
  });
  const [draft, setDraft] = useState<ImplOptions>(saved.opts);
  const [howOpen, setHowOpen] = useState(!saved.built);
  const [ticket, setTicket] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  useEffect(() => { try { localStorage.setItem(storeKey, JSON.stringify(saved)); } catch {} }, [saved, storeKey]);

  const opts = saved.opts;
  const phases: ImplPhase[] = useMemo(() => saved.built ? buildKeepitPlan(opts) : [], [saved.built, opts]);
  const allSteps = phases.flatMap(p => p.steps.map(s => ({ s, p })));
  const total = allSteps.length;
  const doneCount = allSteps.filter(x => saved.done.includes(x.s.id)).length;
  const moduleNames = opts.modules.map(id => KEEPIT_MODULES.find(m => m.id === id)?.name || id);
  const dcLabel = KEEPIT_DATACENTRES.find(d => d.id === opts.dc)?.label;

  const toggleModule = (id: string) => setDraft(d => ({ ...d, modules: d.modules.includes(id) ? d.modules.filter(m => m !== id) : [...d.modules, id] }));
  const build = () => {
    const ordered = KEEPIT_MODULES.map(m => m.id).filter(id => draft.modules.includes(id));
    const o = { ...draft, modules: ordered };
    setSaved(s => ({ ...s, opts: o, built: true }));
    setHowOpen(false);
    track('implementation_plan', `Keepit: ${ordered.join(', ')} (${o.dc})`);
  };
  const reset = () => { setSaved(s => ({ ...s, built: false })); setDraft(saved.opts); };
  const toggleDone = (id: string) => setSaved(s => ({ ...s, done: s.done.includes(id) ? s.done.filter(d => d !== id) : [...s.done, id] }));
  const jump = (id: string) => document.getElementById(`impl-step-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const logTicket = async () => {
    setTicket('loading');
    try {
      const progress = allSteps.map(({ s }, i) => `${saved.done.includes(s.id) ? '[x]' : '[ ]'} ${i + 1}. ${s.title}`).join('\n');
      const r = await apiFetch('/api/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: `Implementation Help — Keepit — ${accountName}`, description: `Implementation help requested via the portal Implementation wizard.\n\nModules: ${moduleNames.join(', ')}\nData centre: ${dcLabel}\n\nProgress:\n${progress}`, domain, customerName: accountName, priority: 2, type: 'Technical Issue', lang: isAr ? 'ar' : 'en' }),
      });
      const d = await r.json(); setTicket(d.ok ? 'done' : 'error');
    } catch { setTicket('error'); }
  };

  const groups = Array.from(new Set(KEEPIT_MODULES.map(m => m.group)));
  let stepCounter = 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} data-testid="impl-back" className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#1f2937]"><ArrowLeft className="w-4 h-4" /> {isAr ? 'رجوع' : 'Back'}</button>
          <div className="h-5 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-cta flex items-center justify-center"><Rocket className="w-4 h-4 text-white" /></div>
            <div>
              <div className="text-sm font-bold text-[#1f2937]">{isAr ? 'معالج تنفيذ Keepit' : 'Keepit Implementation Wizard'}</div>
              <div className="text-xs text-[#6b7280]">{isAr ? 'مبني على مركز مساعدة Keepit' : 'Built from the Keepit Help Center'}</div>
            </div>
          </div>
        </div>
        {saved.built && <button onClick={reset} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#4b5563] hover:border-[#4494D1] hover:text-[#4494D1]">{isAr ? 'تغيير الوحدات' : 'Change modules'}</button>}
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
                  ['اختر وحداتك', 'حدد وحدات Keepit التي تقوم بتثبيتها. نبني خطة مرتبة وفق أفضل الممارسات من وثائق Keepit الرسمية.'],
                  ['اتبع الخطة خطوة بخطوة', 'كل خطوة قصيرة ومستقلة، مع ملخص وروابط إلى مقالة Keepit ذات الصلة. تبقى خريطة الطريق الكاملة ظاهرة على الجانب.'],
                  ['دع أداة ذكاء اصطناعي تنفّذ كل خطوة', 'كل خطوة لها زر لإنشاء أمر Claude CoWork. ستحتاج إلى اشتراك Claude يتضمن CoWork (أو أداة مماثلة يمكنها التحكم في متصفحك والوصول إليه). سجّل الدخول إلى بوابات الإدارة بنفسك أولاً.'],
                  ['راجع وأكمل', 'راقب الأداة أثناء العمل ووافق على شاشات الأذونات بنفسك، ثم اقرأ تقرير الملخص وضع علامة على الخطوة كمكتملة. يتم حفظ التقدم على هذا الجهاز.'],
                ] : [
                  ['Choose your modules', 'Tell us which Keepit modules you are installing. We build a plan in the recommended order from Keepit\'s official documentation.'],
                  ['Work through it one step at a time', 'Each step is small and self-contained, with a short summary and links to the matching Keepit article. The full roadmap stays visible alongside so you can follow the overall flow.'],
                  ['Let an AI tool carry out each step', 'Every step has a button to generate a Claude CoWork prompt. You will need a Claude subscription that includes CoWork (or a similar AI tool that can control and access your browser). Sign in to the admin portals yourself first, then paste in one prompt at a time.'],
                  ['Review and tick off', 'Watch the AI as it works and approve sign-ins and permission screens yourself. Read its Summary Report, then mark the step complete — progress is saved on this device.'],
                ]).map(([h, b], i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl bg-[#f9fafb] border border-[#f3f4f6]">
                    <span className="w-6 h-6 rounded-full gradient-cta text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div><div className="font-semibold text-[#1f2937] text-sm mb-0.5">{h}</div><div className="text-xs leading-relaxed">{b}</div></div>
                  </li>
                ))}
              </ol>
              <div className="flex gap-2.5 p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-xs text-[#92400e] leading-relaxed">
                <MonitorSmartphone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{isAr
                  ? 'تعمل الأوامر بحيث تتوقف الأداة عند شاشات تسجيل الدخول والموافقة ولا تتعامل أبداً مع كلمات المرور أو الأسرار. يمكن لأدوات الذكاء الاصطناعي أن تخطئ، لذا تبقى أنت المسؤول عن الموافقة على كل تغيير. تفضّل ألا تستخدم الذكاء الاصطناعي؟ اتبع الخطوات المختصرة يدوياً، أو تواصل معنا وسنساعدك.'
                  : 'Prompts tell the AI to pause at sign-in and consent screens and never handle passwords, secrets or keys. AI tools can make mistakes, so you stay in control of approving every change. Prefer not to use AI? Follow the short steps manually, or contact us and we can help.'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Conversation */}
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          <Bubble role="assistant">
            <div className="p-4 space-y-4">
              <p className="text-sm text-[#374151] leading-relaxed">
                {isAr
                  ? `مرحباً ${accountName}! سأرشدك خلال تنفيذ Keepit. ما هي الوحدات التي تريد تثبيتها؟ اختر كل ما ينطبق وسأبني خطة تنفيذ مرتبة مع أمر Claude CoWork لكل خطوة.`
                  : `Hi ${accountName} — let's get your Keepit backup implemented. Which modules would you like to install? Pick everything that applies and I'll build an ordered implementation plan, with a Claude CoWork prompt for each step.`}
              </p>
              {!saved.built ? (
                <>
                  {groups.map(g => (
                    <div key={g}>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1.5">{g}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {KEEPIT_MODULES.filter(m => m.group === g).map(m => {
                          const on = draft.modules.includes(m.id);
                          return (
                            <button key={m.id} data-testid={`impl-module-${m.id}`} title={m.hint} onClick={() => toggleModule(m.id)}
                              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${on ? 'bg-[#4494D1] border-[#4494D1] text-white' : 'bg-white border-[#e5e7eb] text-[#4b5563] hover:border-[#4494D1]'}`}>
                              {on && <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}{m.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className="text-xs text-[#4b5563] space-y-1">
                      <span className="font-semibold">{isAr ? 'مركز بيانات Keepit' : 'Keepit data centre'}</span>
                      <select value={draft.dc} onChange={e => setDraft(d => ({ ...d, dc: e.target.value }))} className="w-full border border-[#e5e7eb] rounded-lg px-2.5 py-2 text-sm bg-white" data-testid="impl-dc">
                        {KEEPIT_DATACENTRES.map(d => <option key={d.id} value={d.id}>{d.label} — {d.id}.keepit.com</option>)}
                      </select>
                    </label>
                    {(draft.modules.includes('m365') || draft.modules.includes('entra')) && (
                      <div className="text-xs text-[#4b5563] space-y-1.5">
                        <span className="font-semibold block">{isAr ? 'خيارات Microsoft' : 'Microsoft options'}</span>
                        {draft.modules.includes('m365') && <>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={draft.teamsChats} onChange={e => setDraft(d => ({ ...d, teamsChats: e.target.checked }))} /> {isAr ? 'نسخ محادثات Teams احتياطياً' : 'Back up Teams Chats (1:1 & group chats)'}</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={draft.largeTenant} onChange={e => setDraft(d => ({ ...d, largeTenant: e.target.checked }))} /> {isAr ? 'أكثر من 500 مستخدم' : 'More than 500 users'}</label>
                        </>}
                        {draft.modules.includes('entra') && <label className="flex items-center gap-2"><input type="checkbox" checked={draft.keyVault} onChange={e => setDraft(d => ({ ...d, keyVault: e.target.checked }))} /> {isAr ? 'ربط Azure Key Vault' : 'Connect Azure Key Vault (app restores)'}</label>}
                      </div>
                    )}
                  </div>
                  <button onClick={build} disabled={!draft.modules.length} data-testid="impl-build"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#C65793,#4494D1)' }}>
                    <ListChecks className="w-4 h-4" /> {isAr ? 'إنشاء خطة التنفيذ' : 'Build my implementation plan'}
                  </button>
                </>
              ) : null}
            </div>
          </Bubble>

          {saved.built && <>
            <Bubble role="user">{isAr ? 'أقوم بتثبيت: ' : "I'm installing: "}{moduleNames.join(', ')} · {dcLabel}{opts.modules.includes('m365') ? ` · ${opts.teamsChats ? 'Teams Chats' : (isAr ? 'بدون محادثات Teams' : 'no Teams Chats')}${opts.largeTenant ? ' · 500+ users' : ''}` : ''}</Bubble>

            <Bubble role="assistant">
              <div className="p-4 border-b border-[#f3f4f6]">
                <p className="text-sm text-[#374151] leading-relaxed">
                  {isAr
                    ? `إليك خطة التنفيذ: ${phases.length} مراحل و${total} خطوة. أكمل كل خطوة بالترتيب — استخدم زر Claude CoWork لكل خطوة لتنفيذها تلقائياً، أو اتبع الإجراءات المختصرة يدوياً. التفاصيل التقنية معروضة بالإنجليزية لتطابق واجهات المنتجات.`
                    : `Here's your implementation plan — ${phases.length} sections and ${total} steps, in the order Keepit recommends. Work through them in sequence: use the Claude CoWork button on each step to have the AI carry it out, or follow the short actions yourself.`}
                </p>
              </div>
              {phases.map((p, pi) => (
                <div key={p.id} className="border-b border-[#f3f4f6] last:border-b-0">
                  <div className="px-4 pt-4 pb-2 flex items-baseline justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9b4da8]">{isAr ? 'القسم' : 'Section'} {pi + 1}</div>
                      <h3 className="text-base font-bold text-[#1f2937]">{p.title}</h3>
                    </div>
                    <span className="text-xs text-[#9ca3af]">{p.subtitle}</span>
                  </div>
                  {p.note && <p className="mx-4 mb-2 text-xs text-[#6b7280] bg-[#f9fafb] border border-[#f3f4f6] rounded-lg px-3 py-2">{p.note}</p>}
                  <div className="px-4 pb-4 space-y-3">
                    {p.steps.map(s => {
                      stepCounter += 1; const n = stepCounter;
                      const idx = allSteps.findIndex(x => x.s.id === s.id);
                      const next = allSteps[idx + 1]?.s;
                      const done = saved.done.includes(s.id);
                      const prompt = buildCoworkPrompt(s, { accountName, phase: p, stepNo: n, total, next, opts, moduleNames });
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
                              <ul className="mt-2 space-y-1">
                                {s.actions.map((a, i) => <li key={i} className="text-xs text-[#374151] flex gap-1.5"><span className="text-[#C65793] mt-px">›</span><span>{a}</span></li>)}
                              </ul>
                              {s.needs?.length ? <p className="text-[11px] text-[#6b7280] mt-2"><span className="font-semibold">{isAr ? 'تحتاج إلى: ' : 'You will need: '}</span>{s.needs.join(' · ')}</p> : null}
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                {s.links.map(l => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#4494D1] hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />{l.label}</a>)}
                              </div>
                              <div className="flex items-end justify-between gap-2 flex-wrap">
                                <PromptBlock step={s} prompt={prompt} isAr={isAr} />
                                <button onClick={() => toggleDone(s.id)} data-testid={`impl-done-${s.id}`} className={`mt-3 text-xs font-medium inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${done ? 'border-[#10b981] text-[#047857] bg-white' : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#10b981] hover:text-[#047857]'}`}>
                                  {done ? <><CheckCircle className="w-3.5 h-3.5" /> {isAr ? 'مكتملة' : 'Completed'}</> : <><Circle className="w-3.5 h-3.5" /> {isAr ? 'وضع علامة كمكتملة' : 'Mark complete'}</>}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {p.coverage && <a href={p.coverage.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#6b7280] hover:text-[#4494D1] inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />{isAr ? 'ما الذي تتم تغطيته: ' : 'What is covered: '}{p.coverage.label}</a>}
                  </div>
                </div>
              ))}
              <div className="p-4 bg-[#f9fafb] space-y-3">
                <p className="text-sm text-[#374151]">{isAr ? 'يمكننا مساعدتك في العثور على إجابة خاصة بتنفيذك، يرجى التواصل مع فريق الدعم لدينا' : SUPPORT_LINE}</p>
                {ticket === 'done' ? (
                  <div className="text-xs text-[#047857] flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {isAr ? 'تم إنشاء التذكرة — سيتواصل فريقنا معك.' : 'Ticket logged — our team will be in touch.'}</div>
                ) : (
                  <button onClick={logTicket} disabled={ticket === 'loading'} data-testid="impl-ticket" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#C65793,#4494D1)' }}>
                    {ticket === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ticket className="w-3.5 h-3.5" />} {isAr ? 'اطلب المساعدة في التنفيذ' : 'Ask us for implementation help'}
                  </button>
                )}
                {ticket === 'error' && <p className="text-xs text-[#b91c1c]">{isAr ? 'تعذّر إنشاء التذكرة. راسل support@broadpeakcyber.com' : 'Could not log the ticket — please email support@broadpeakcyber.com'}</p>}
              </div>
            </Bubble>
          </>}
        </div>

        {/* Roadmap */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-4">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg,#C65793,#9b4da8,#4494D1)' }} />
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-3">{isAr ? 'خريطة التنفيذ' : 'Implementation roadmap'}</h3>
              {!saved.built ? (
                <p className="text-xs text-[#9ca3af]">{isAr ? 'اختر وحداتك لعرض الخطة الكاملة هنا.' : 'Choose your modules to see the full plan here.'}</p>
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
