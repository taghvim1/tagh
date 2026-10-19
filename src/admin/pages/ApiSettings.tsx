import { useEffect, useState } from 'react'
import { api, friendly, type AiSettings, type GenResult, type Prompt, type SecretStatus, type SetupStatus } from '../suggestions/api'
import { ErrorBox, fmtDate, ModeBanner, useLoad } from '../suggestions/shared'
import { faNum } from '../../lib/jalali'

type Name = 'gemini' | 'tavily' | 'unsplash' | 'ghasedak'
const SECRETS: { name: Name; title: string; hint: string }[] = [
  { name: 'gemini', title: 'Gemini (تولید متن)', hint: 'کلید Google AI Studio' },
  { name: 'tavily', title: 'جست‌وجوی وب (Tavily)', hint: 'کلید Tavily (tvly-…)؛ برای منبع‌یابی متن' },
  { name: 'ghasedak', title: 'پیامک قاصدک (ورود با شماره موبایل)', hint: 'کلید وب‌سرویس (apikey) از «تنظیمات/حساب کاربری» پنل قاصدک؛ «آزمون اتصال» فقط اعتبار حساب را می‌پرسد و پیامک نمی‌فرستد. ابزار تست ورود در بخش «ورود پیامکی (تست)» است' },
  { name: 'unsplash', title: 'جست‌وجوی تصویر (Unsplash)', hint: 'فقط «Access Key»؛ Secret Key لازم نیست. Wikimedia Commons بدون کلید کار می‌کند' },
]
const STORAGE_MSG: Record<SecretStatus['ui_storage'], string> = {
  available: '',
  needs_encryption_key: 'ذخیره از این صفحه فعال نیست: متغیر SECRETS_ENCRYPTION_KEY (حداقل ۱۶ نویسه) روی سرور تنظیم نشده. به‌جایش خود کلید را در متغیر محیطی بگذارید.',
  blocked_in_production_without_admin_token: 'در production ذخیرهٔ کلید از رابط فقط با ADMIN_TOKEN (یا ADMIN_OPEN=true برای تست) ممکن است. کلید را در متغیر محیطی بگذارید یا یکی از این دو را تنظیم کنید.',
}

function SetupChecklist({ setup }: { setup: SetupStatus }) {
  const items: { ok: boolean; title: string; text: string }[] = [
    setup.storage === 'postgres'
      ? { ok: true, title: 'ذخیره‌سازی ماندگار (PostgreSQL)', text: 'پیشنهادها، تنظیمات و کلیدهای واردشده از این صفحه با دیپلوی و ری‌استارت پاک نمی‌شوند.' }
      : { ok: false, title: 'ذخیره‌سازی موقت', text: 'هر چیزی که اینجا وارد یا ساخته می‌شود با دیپلوی/ری‌استارت پاک می‌شود. برای ماندگاری، متغیر DATABASE_URL (نشانی PostgreSQL، مثلاً Neon) را یک بار روی سرور بگذارید.' },
    setup.encryption_key
      ? { ok: true, title: 'کلید رمزنگاری تنظیم است', text: 'کلیدهای واردشده از این صفحه رمزنگاری‌شده ذخیره می‌شوند.' }
      : { ok: false, title: 'کلید رمزنگاری تنظیم نیست', text: 'برای ذخیرهٔ کلیدها از همین صفحه، یک بار متغیر SECRETS_ENCRYPTION_KEY (یک رشتهٔ تصادفی حداقل ۱۶ نویسه) را روی سرور بگذارید.' },
    setup.admin_token
      ? { ok: true, title: 'دسترسی مدیر با توکن', text: 'فقط با ADMIN_TOKEN وارد می‌شوید.' }
      : { ok: false, title: setup.admin_open ? 'دسترسی مدیر باز (آزمایشی)' : 'دسترسی مدیر بسته', text: setup.admin_open ? 'هر کسی که نشانی سایت را بداند به پنل دسترسی دارد. پیش از انتشار عمومی ADMIN_TOKEN بگذارید و ADMIN_OPEN را حذف کنید.' : 'ADMIN_TOKEN یا برای تست ADMIN_OPEN=true را روی سرور تنظیم کنید.' },
  ]
  return (
    <ul className="adm-checklist" aria-label="وضعیت راه‌اندازی">
      {items.map((i) => <li key={i.title}><span className={`adm-badge ${i.ok ? 'on' : 'warn'}`}>{i.ok ? 'آماده' : 'نیاز به اقدام'}</span><div><strong>{i.title}</strong><p className="adm-note">{i.text}</p></div></li>)}
    </ul>
  )
}

function SecretRow({ name, title, hint, st, onChange }: { name: Name; title: string; hint: string; st: SecretStatus; onChange: () => void }) {
  const [v, setV] = useState(''), [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null), [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<string>) => { setBusy(true); setMsg(null); try { setMsg({ ok: true, text: await fn() }) } catch (e) { setMsg({ ok: false, text: friendly(e) }) } setBusy(false); onChange() }
  return (
    <div className="adm-secret-row">
      <div className="adm-sg-meta"><strong>{title}</strong><span className={`adm-badge ${st.configured ? 'on' : 'warn'}`}>{st.configured ? `تنظیم‌شده ${st.masked} (${st.source === 'env' ? 'متغیر محیطی' : 'ذخیره‌شده در سرور'})` : 'تنظیم نشده'}</span></div>
      <span className="adm-note">{hint} · متغیر محیطی: <code dir="ltr">{st.env_var}</code></span>
      {st.ui_storage === 'available' ? (
        <form className="adm-inline" onSubmit={(e) => { e.preventDefault(); void run(async () => { await api(`/admin/settings/secrets/${name}`, { method: 'PUT', body: { value: v } }); setV(''); return 'کلید روی سرور رمزنگاری و ذخیره شد.' }) }}>
          <input type="password" dir="ltr" autoComplete="off" aria-label={`کلید ${title}`} placeholder="کلید را وارد کنید" value={v} onChange={(e) => setV(e.target.value)} />
          <button className="adm-btn primary" disabled={busy || v.trim().length < 8}>ذخیره</button>
          {st.source === 'ui' && <button type="button" className="adm-btn danger" disabled={busy} onClick={() => run(async () => { await api(`/admin/settings/secrets/${name}`, { method: 'DELETE' }); return 'کلید ذخیره‌شده حذف شد.' })}>حذف</button>}
        </form>) : <p className="adm-note">{STORAGE_MSG[st.ui_storage]}</p>}
      <div className="adm-inline"><button type="button" className="adm-btn sm" disabled={busy || !st.configured} onClick={() => run(async () => { const r = await api<{ ok: boolean; message: string; latency_ms: number }>(`/admin/settings/test/${name}`, { method: 'POST', timeoutMs: 60_000 }); if (!r.ok) throw new Error(r.message); return `${r.message} (${faNum(r.latency_ms)}ms)` })}>آزمون اتصال</button>
        {msg && <span role="status" className={msg.ok ? 'adm-result-ok' : 'adm-result-bad'}>{msg.text}</span>}</div>
    </div>
  )
}

export default function ApiSettings() {
  const secrets = useLoad(() => api<{ secrets: Record<Name, SecretStatus>; setup: SetupStatus }>('/admin/settings/secrets'), [])
  const settings = useLoad(() => api<{ settings: AiSettings }>('/admin/settings/ai'), [])
  const prompts = useLoad(() => api<{ items: Prompt[]; builtin: string; active_version: number }>('/admin/prompts'), [])
  const [s, setS] = useState<AiSettings | null>(null), [smsg, setSmsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [text, setText] = useState(''), [note, setNote] = useState(''), [pmsg, setPmsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [wm, setWm] = useState<{ ok: boolean; text: string } | null>(null), [tname, setTname] = useState(''), [tbusy, setTbusy] = useState(false), [tres, setTres] = useState<GenResult | null>(null)
  useEffect(() => { if (settings.data) setS(settings.data.settings) }, [settings.data])
  useEffect(() => { if (prompts.data && !text) setText(prompts.data.items.find((p) => p.active)?.text ?? prompts.data.builtin) }, [prompts.data, text])

  const saveSettings = async () => { try { await api('/admin/settings/ai', { method: 'PUT', body: s }); setSmsg({ ok: true, text: 'ذخیره شد.' }) } catch (e) { setSmsg({ ok: false, text: friendly(e) }) } }
  const pAct = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); setPmsg({ ok: true, text: ok }); prompts.reload() } catch (e) { setPmsg({ ok: false, text: friendly(e) }) } }
  const set = <K extends keyof AiSettings>(k: K, patch: Partial<AiSettings[K]>) => setS((x) => (x ? { ...x, [k]: { ...x[k], ...patch } } : x))
  const toggleProv = (p: 'wikimedia' | 'unsplash') => s && set('imageSearch', { providers: s.imageSearch.providers.includes(p) ? s.imageSearch.providers.filter((x) => x !== p) : [...s.imageSearch.providers, p] })

  return (
    <>
      <div className="adm-page-head"><div><h2>تنظیمات API</h2><p className="adm-note">کلیدها فقط روی سرور نگه‌داری می‌شوند؛ هرگز به مرورگر برنمی‌گردند و در فایل‌های build نیستند.</p></div></div>
      <ModeBanner />

      <section className="adm-card"><h3 className="adm-sub">کلیدها</h3>
        {secrets.error ? <ErrorBox error={secrets.error} onRetry={secrets.reload} /> : !secrets.data ? <p className="adm-note">در حال بارگذاری…</p> : <>
          <SetupChecklist setup={secrets.data.setup} />
          {SECRETS.map((x) => <SecretRow key={x.name} {...x} st={secrets.data!.secrets[x.name]} onChange={secrets.reload} />)}
          <div className="adm-secret-row"><div className="adm-sg-meta"><strong>Wikimedia Commons (تصویر)</strong><span className="adm-badge on">بدون نیاز به کلید</span></div>
            <WikimediaTest /></div></>}
      </section>

      <section className="adm-card"><h3 className="adm-sub">مدل‌ها و مسیریابی وظایف</h3>
        {settings.error ? <ErrorBox error={settings.error} onRetry={settings.reload} /> : !s ? <p className="adm-note">در حال بارگذاری…</p> : (
          <div className="adm-form" style={{ display: 'grid', gap: 10 }}>
            <label>مدل اصلی تولید متن<input dir="ltr" value={s.llm.primaryModel} onChange={(e) => set('llm', { primaryModel: e.target.value })} /></label>
            <label>مدل جایگزین (در خطای مدل اصلی؛ خالی = بدون جایگزین)<input dir="ltr" value={s.llm.fallbackModel} onChange={(e) => set('llm', { fallbackModel: e.target.value })} /></label>
            <label>دمای تولید (۰ تا ۱)<input type="number" min={0} max={1} step={0.1} value={s.llm.temperature} onChange={(e) => set('llm', { temperature: Number(e.target.value) })} /></label>
            <label className="adm-switch-row"><span>جست‌وجوی وب برای منبع‌یابی متن</span><input type="checkbox" role="switch" className="adm-switch" checked={s.webSearch.enabled} onChange={(e) => set('webSearch', { enabled: e.target.checked })} /></label>
            <label>حداکثر نتیجهٔ وب<input type="number" min={1} max={10} value={s.webSearch.maxResults} onChange={(e) => set('webSearch', { maxResults: Number(e.target.value) })} /></label>
            <fieldset><legend>منابع تصویر (به ترتیب)</legend>
              {(['wikimedia', 'unsplash'] as const).map((p) => <label key={p} className="adm-inline"><input type="checkbox" checked={s.imageSearch.providers.includes(p)} onChange={() => toggleProv(p)} />{p === 'wikimedia' ? 'Wikimedia Commons (مجوز آزاد، با اعتبار)' : 'Unsplash (نیازمند کلید)'}</label>)}</fieldset>
            <label>حداکثر تصویر از هر منبع<input type="number" min={1} max={10} value={s.imageSearch.maxPerProvider} onChange={(e) => set('imageSearch', { maxPerProvider: Number(e.target.value) })} /></label>
            <label className="adm-switch-row"><span>جست‌وجوی خودکار تصویر پس از تولید</span><input type="checkbox" role="switch" className="adm-switch" checked={s.tasks.images.autoSearchOnGenerate} onChange={(e) => set('tasks', { images: { autoSearchOnGenerate: e.target.checked } } as never)} /></label>
            <div className="adm-inline"><button type="button" className="adm-btn primary" onClick={saveSettings}>ذخیرهٔ تنظیمات</button>{smsg && <span role="status" className={smsg.ok ? 'adm-result-ok' : 'adm-result-bad'}>{smsg.text}</span>}</div>
          </div>)}
      </section>

      <section className="adm-card"><h3 className="adm-sub">قالب پرامپت (نسخه‌دار)</h3>
        {prompts.error ? <ErrorBox error={prompts.error} onRetry={prompts.reload} /> : !prompts.data ? <p className="adm-note">در حال بارگذاری…</p> : <>
          <p className="adm-note">نسخهٔ فعال: {prompts.data.active_version ? faNum(prompts.data.active_version) : 'پیش‌فرض داخلی'} · جاگذارهای ضروری: <code>{'{{names}}'}</code> و <code>{'{{schema}}'}</code> (و اختیاری <code>{'{{enums}}'}</code>، <code>{'{{sources}}'}</code>)</p>
          <textarea rows={14} dir="rtl" aria-label="متن قالب" value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%' }} />
          <div className="adm-inline"><input aria-label="یادداشت نسخه" placeholder="یادداشت این نسخه" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="button" className="adm-btn primary" onClick={() => pAct(async () => { await api('/admin/prompts', { method: 'POST', body: { text, note } }); setNote('') }, 'نسخهٔ جدید ذخیره شد (برای استفاده، فعالش کنید).')}>ذخیره به‌عنوان نسخهٔ جدید</button>
            <button type="button" className="adm-btn" onClick={() => setText(prompts.data!.builtin)}>بارگذاری پیش‌فرض داخلی</button>
            {prompts.data.active_version > 0 && <button type="button" className="adm-btn" onClick={() => pAct(() => api('/admin/prompts/reset', { method: 'POST' }), 'پیش‌فرض داخلی فعال شد.')}>استفاده از پیش‌فرض</button>}</div>
          {pmsg && <p role="status" className={pmsg.ok ? 'adm-result-ok' : 'adm-result-bad'}>{pmsg.text}</p>}
          <ul className="adm-note">{prompts.data.items.map((p) => <li key={p.id}>نسخهٔ {faNum(p.version)} — {p.note || 'بدون یادداشت'} — {fmtDate(p.created_at)} {p.active ? <span className="adm-badge on">فعال</span> : <><button className="adm-btn sm" onClick={() => pAct(() => api(`/admin/prompts/${p.id}/activate`, { method: 'POST' }), `نسخهٔ ${p.version} فعال شد.`)}>فعال‌سازی</button> <button className="adm-btn sm" onClick={() => setText(p.text)}>نمایش در ویرایشگر</button></>}</li>)}</ul></>}
      </section>

      <section className="adm-card"><h3 className="adm-sub">تولید آزمایشی</h3>
        <p className="adm-note">یک مقصد را با تنظیمات فعلی تولید و فقط نتیجه را نشان می‌دهد؛ چیزی ذخیره نمی‌شود (ولی از سهمیهٔ API مصرف می‌کند).</p>
        <div className="adm-inline"><input aria-label="نام مقصد" placeholder="نام مقصد، مثلاً سنندج" value={tname} onChange={(e) => setTname(e.target.value)} />
          <button type="button" className="adm-btn primary" disabled={tbusy || !tname.trim()} onClick={async () => { setTbusy(true); setTres(null); setWm(null); try { setTres(await api<GenResult>('/admin/ai/test-generation', { method: 'POST', body: { name: tname.trim() }, timeoutMs: 120_000 })) } catch (e) { setWm({ ok: false, text: friendly(e) }) } setTbusy(false) }}>{tbusy ? 'در حال تولید…' : 'تولید آزمایشی'}</button></div>
        {wm && <p role="alert" className="adm-result-bad">{wm.text}</p>}
        {tres && (tres.ok ? <><p className="adm-result-ok">خروجی معتبر بود (مدل {tres.meta?.model}{tres.meta?.used_fallback ? '، جایگزین' : ''}، {faNum(tres.meta?.sources.length ?? 0)} منبع وب).</p><pre className="adm-pre" dir="ltr">{JSON.stringify(tres.content, null, 2)}</pre></> : <ul className="adm-error-list" role="alert">{tres.errors?.map((e) => <li key={e}>{e}</li>)}</ul>)}
      </section>
    </>
  )
}

function WikimediaTest() {
  const [m, setM] = useState<{ ok: boolean; text: string } | null>(null), [b, setB] = useState(false)
  return <div className="adm-inline"><button type="button" className="adm-btn sm" disabled={b} onClick={async () => { setB(true); try { const r = await api<{ ok: boolean; message: string }>('/admin/settings/test/wikimedia', { method: 'POST', timeoutMs: 60_000 }); setM({ ok: r.ok, text: r.message }) } catch (e) { setM({ ok: false, text: friendly(e) }) } setB(false) }}>آزمون اتصال</button>{m && <span role="status" className={m.ok ? 'adm-result-ok' : 'adm-result-bad'}>{m.text}</span>}</div>
}
