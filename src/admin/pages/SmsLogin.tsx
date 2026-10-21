import { useEffect, useState } from 'react'
import { api, friendly } from '../suggestions/api'
import { ErrorBox, fmtDate, ModeBanner, useLoad } from '../suggestions/shared'

interface LogEntry { at: string; phone_masked: string; kind: 'login' | 'reset' | 'other' | 'test'; ok: boolean; error?: string }
type Purpose = 'login' | 'reset' | 'other'
interface Tpl { id?: string; name: string; purpose: Purpose; label?: string }
interface SmsInfo {
  configured: boolean; available: boolean; settings: { enabled: boolean; templates: (Tpl & { id: string })[] }
  base_host: string; https: boolean; default_template: string; purposes: { id: Purpose; label: string }[]; log: LogEntry[]
}
const PURPOSE_FA: Record<Purpose, string> = { login: 'ثبت‌نام و ورود', reset: 'بازیابی / ریست', other: 'سایر' }
const KIND_FA: Record<string, string> = { login: 'ورود کاربر', reset: 'بازیابی', other: 'سایر', test: 'آزمایشی' }
const NAME_OK = /^[A-Za-z0-9_-]{3,40}$/
type Msg = { ok: boolean; text: string } | null
const ERR_FA: Record<string, string> = { not_configured: 'کلید تنظیم نشده', invalid_key: 'کلید نامعتبر', ip_not_allowed: 'آی‌پی مجاز نیست', invalid_number: 'شمارهٔ نامعتبر', filtered_number: 'شماره فیلتر', no_credit: 'اعتبار کم', template_invalid: 'قالب نامعتبر', unavailable: 'سرویس در دسترس نیست', bad_response: 'پاسخ نامعتبر', network: 'خطای شبکه', unknown: 'ناموفق' }
const rial = (n: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(n))} ریال (${new Intl.NumberFormat('fa-IR').format(Math.round(n / 10))} تومان)`

function Result({ m }: { m: Msg }) { return m ? <p role="status" className={m.ok ? 'adm-result-ok' : 'adm-result-bad'}>{m.text}</p> : null }

// ابزار تست اولیهٔ ورود با کد پیامکی (قاصدک). کلید در «تنظیمات API» وارد می‌شود؛ اینجا فقط وضعیت، قالب، اعتبار و ارسال آزمایشی است.
export default function SmsLogin() {
  const info = useLoad(() => api<SmsInfo>('/admin/sms'), [])
  const [tpls, setTpls] = useState<Tpl[]>([]), [enabled, setEnabled] = useState(true), [testTpl, setTestTpl] = useState('')
  const [phone, setPhone] = useState(''), [busy, setBusy] = useState<string | null>(null)
  const [mSave, setMSave] = useState<Msg>(null), [mCredit, setMCredit] = useState<Msg>(null), [mSend, setMSend] = useState<Msg>(null)
  useEffect(() => {
    if (!info.data) return
    setTpls(info.data.settings.templates.map((t) => ({ ...t }))); setEnabled(info.data.settings.enabled)
  }, [info.data])

  const run = async (id: string, set: (m: Msg) => void, fn: () => Promise<string>) => {
    setBusy(id); set(null)
    try { set({ ok: true, text: await fn() }) } catch (e) { set({ ok: false, text: friendly(e) }) }
    setBusy(null); info.reload()
  }
  const d = info.data

  return (
    <>
      <div className="adm-page-head"><div><h2>ورود پیامکی (تست)</h2><p className="adm-note">ورود و ثبت‌نام با کد یک‌بارمصرف پیامکی از طریق قاصدک. کلید وب‌سرویس را در «تنظیمات API» وارد کنید؛ هر ارسال آزمایشی یک پیامک واقعی است و از اعتبار حساب کم می‌شود.</p></div></div>
      <ModeBanner />

      {info.error ? <ErrorBox error={info.error} onRetry={info.reload} /> : !d ? <p className="adm-note">در حال بارگذاری…</p> : <>
        <section className="adm-card"><h3 className="adm-sub">وضعیت</h3>
          <ul className="adm-checklist" aria-label="وضعیت ورود پیامکی">
            <li><span className={`adm-badge ${d.configured ? 'on' : 'warn'}`}>{d.configured ? 'آماده' : 'نیاز به اقدام'}</span><div><strong>کلید قاصدک</strong><p className="adm-note">{d.configured ? 'تنظیم شده است.' : <>هنوز وارد نشده؛ از <a href="/admin/api-settings">تنظیمات API</a> وارد کنید.</>}</p></div></li>
            <li><span className={`adm-badge ${d.settings.enabled ? 'on' : 'warn'}`}>{d.settings.enabled ? 'روشن' : 'خاموش'}</span><div><strong>ورود پیامکی برای کاربران</strong><p className="adm-note">قالب‌ها: {d.settings.templates.map((t) => <span key={t.id}><code dir="ltr">{t.name}</code> ({t.label || PURPOSE_FA[t.purpose]}) </span>)}</p></div></li>
            <li><span className={`adm-badge ${d.https ? 'on' : 'warn'}`}>{d.https ? 'امن' : 'ناامن'}</span><div><strong>نشانی وب‌سرویس: <code dir="ltr">{d.base_host}</code></strong><p className="adm-note">{d.https ? 'ارتباط با قاصدک با HTTPS است.' : 'ارتباط بدون رمزنگاری است و کلید در شبکه دیده می‌شود. متغیر GHASEDAK_BASE_URL را روی نشانی https بگذارید.'}</p></div></li>
            <li><span className={`adm-badge ${d.available ? 'on' : 'warn'}`}>{d.available ? 'فعال' : 'غیرفعال'}</span><div><strong>در دسترس کاربران</strong><p className="adm-note">{d.available ? 'ردیف «ورود با شماره موبایل» در تنظیمات برنامه دیده می‌شود.' : 'تا کلید و قالب آماده و ورود روشن نباشد، کاربران گزینهٔ ورود را نمی‌بینند.'}</p></div></li>
          </ul>
        </section>

        <section className="adm-card"><h3 className="adm-sub">قالب‌های پیامک</h3>
          <p className="adm-note">قالب (متن پیامک) را فقط در پنل قاصدک می‌سازید و تأیید می‌گیرید؛ اینجا فقط «نام قالب تأییدشده» را ثبت می‌کنید و مشخص می‌کنید هر قالب برای چه کاری است. نام قالب فقط حروف انگلیسی، عدد، «-» و «_». برای «ثبت‌نام و ورود» یک قالب لازم است؛ اگر برای «بازیابی / ریست» قالب جدا نگذارید، از قالب ورود استفاده می‌شود.</p>
          <form className="adm-form" style={{ display: 'grid', gap: 10 }} onSubmit={(e) => { e.preventDefault(); void run('save', setMSave, async () => { await api('/admin/sms/settings', { method: 'PUT', body: { enabled, templates: tpls.map((t) => ({ name: t.name.trim(), purpose: t.purpose, ...(t.purpose === 'other' && t.label?.trim() ? { label: t.label.trim() } : {}) })) } }); return 'ذخیره شد.' }) }}>
            {tpls.map((t, i) => (
              <div key={i} style={{ display: 'grid', gap: 8, padding: 10, border: '1px solid var(--adm-line, #dde3ea)', borderRadius: 12 }}>
                <label style={{ width: '100%' }}>نام قالب در قاصدک<input dir="ltr" value={t.name} maxLength={40} aria-invalid={!!t.name && !NAME_OK.test(t.name.trim())} onChange={(e) => setTpls(tpls.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></label>
                <label>وظیفه<select value={t.purpose} onChange={(e) => setTpls(tpls.map((x, j) => (j === i ? { ...x, purpose: e.target.value as Purpose } : x)))}>{(Object.keys(PURPOSE_FA) as Purpose[]).map((p) => <option key={p} value={p}>{PURPOSE_FA[p]}</option>)}</select></label>
                {t.purpose === 'other' && <label style={{ width: '100%' }}>عنوان<input value={t.label ?? ''} maxLength={40} placeholder="مثلاً تبلیغات" onChange={(e) => setTpls(tpls.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></label>}
                <button type="button" className="adm-btn" disabled={tpls.length <= 1} onClick={() => setTpls(tpls.filter((_, j) => j !== i))} aria-label="حذف این قالب">حذف</button>
              </div>
            ))}
            <div><button type="button" className="adm-btn" disabled={tpls.length >= 20} onClick={() => setTpls([...tpls, { name: '', purpose: tpls.some((t) => t.purpose === 'reset') ? 'other' : 'reset' }])}>+ افزودن قالب</button></div>
            <label className="adm-switch-row"><span>روشن‌بودن ورود پیامکی برای کاربران</span><input type="checkbox" role="switch" className="adm-switch" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /></label>
            <div className="adm-inline"><button className="adm-btn primary" disabled={busy !== null || tpls.length === 0 || tpls.some((t) => !NAME_OK.test(t.name.trim()))}>ذخیره</button><Result m={mSave} /></div>
          </form>
        </section>

        <section className="adm-card"><h3 className="adm-sub">اعتبار حساب</h3>
          <div className="adm-inline"><button type="button" className="adm-btn" disabled={busy !== null || !d.configured} onClick={() => void run('credit', setMCredit, async () => rial((await api<{ credit_rial: number }>('/admin/sms/credit', { method: 'POST' })).credit_rial))}>دریافت اعتبار</button><Result m={mCredit} /></div>
        </section>

        <section className="adm-card"><h3 className="adm-sub">ارسال آزمایشی</h3>
          <p className="adm-note">یک کد تصادفی با قالبِ انتخاب‌شده به شمارهٔ شما پیامک می‌شود (ابتدا تنظیمات را ذخیره کنید). این کد ذخیره نمی‌شود و برای ورود معتبر نیست. برای تست کامل ورود، از خود برنامه (منو ← پروفایل) استفاده کنید.</p>
          <form className="adm-inline" onSubmit={(e) => { e.preventDefault(); void run('send', setMSend, async () => (await api<{ message: string }>('/admin/sms/test-send', { method: 'POST', body: { phone, ...(testTpl ? { template_id: testTpl } : {}) } })).message) }}>
            <select aria-label="قالب" value={testTpl} onChange={(e) => setTestTpl(e.target.value)}><option value="">قالب ورود (پیش‌فرض)</option>{d.settings.templates.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.label || PURPOSE_FA[t.purpose]}</option>)}</select>
            <input dir="ltr" type="tel" inputMode="tel" autoComplete="off" aria-label="شمارهٔ موبایل" placeholder="09123456789" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className="adm-btn primary" disabled={busy !== null || !d.configured || phone.trim().length < 10}>{busy === 'send' ? 'در حال ارسال…' : 'ارسال کد آزمایشی'}</button>
          </form>
          <Result m={mSend} />
        </section>

        <section className="adm-card"><h3 className="adm-sub">آخرین ارسال‌ها</h3>
          {d.log.length === 0 ? <p className="adm-note">هنوز ارسالی ثبت نشده است. (فقط شمارهٔ ماسک‌شده نگه‌داری می‌شود و هرگز کد.)</p> : (
            <div className="adm-table-wrap"><table className="adm-table">
              <thead><tr><th>زمان</th><th>شماره</th><th>نوع</th><th>نتیجه</th></tr></thead>
              <tbody>{d.log.map((l, i) => <tr key={`${l.at}-${i}`}><td>{fmtDate(l.at)}</td><td dir="ltr">{l.phone_masked}</td><td>{KIND_FA[l.kind] ?? l.kind}</td><td><span className={`adm-badge ${l.ok ? 'on' : 'warn'}`}>{l.ok ? 'ارسال شد' : ERR_FA[l.error ?? 'unknown'] ?? 'ناموفق'}</span></td></tr>)}</tbody>
            </table></div>)}
        </section>
      </>}
    </>
  )
}
