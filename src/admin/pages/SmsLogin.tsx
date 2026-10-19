import { useEffect, useState } from 'react'
import { api, friendly } from '../suggestions/api'
import { ErrorBox, fmtDate, ModeBanner, useLoad } from '../suggestions/shared'
import { faNum } from '../../lib/jalali'

interface LogEntry { at: string; phone_masked: string; kind: 'login' | 'test'; ok: boolean; error?: string }
interface SmsInfo {
  configured: boolean; available: boolean; settings: { template: string; enabled: boolean }
  base_host: string; https: boolean; default_template: { name: string; text: string }; log: LogEntry[]
}
type Msg = { ok: boolean; text: string } | null
const ERR_FA: Record<string, string> = { not_configured: 'کلید تنظیم نشده', invalid_key: 'کلید نامعتبر', ip_not_allowed: 'آی‌پی مجاز نیست', invalid_number: 'شمارهٔ نامعتبر', filtered_number: 'شماره فیلتر', no_credit: 'اعتبار کم', template_invalid: 'قالب نامعتبر', unavailable: 'سرویس در دسترس نیست', bad_response: 'پاسخ نامعتبر', network: 'خطای شبکه', unknown: 'ناموفق' }
const rial = (n: number) => `${new Intl.NumberFormat('fa-IR').format(Math.round(n))} ریال (${new Intl.NumberFormat('fa-IR').format(Math.round(n / 10))} تومان)`

function Result({ m }: { m: Msg }) { return m ? <p role="status" className={m.ok ? 'adm-result-ok' : 'adm-result-bad'}>{m.text}</p> : null }

// ابزار تست اولیهٔ ورود با کد پیامکی (قاصدک). کلید در «تنظیمات API» وارد می‌شود؛ اینجا فقط وضعیت، قالب، اعتبار و ارسال آزمایشی است.
export default function SmsLogin() {
  const info = useLoad(() => api<SmsInfo>('/admin/sms'), [])
  const [tpl, setTpl] = useState(''), [enabled, setEnabled] = useState(true)
  const [newName, setNewName] = useState(''), [newText, setNewText] = useState(''), [tid, setTid] = useState('')
  const [phone, setPhone] = useState(''), [busy, setBusy] = useState<string | null>(null)
  const [mSave, setMSave] = useState<Msg>(null), [mTpl, setMTpl] = useState<Msg>(null), [mCredit, setMCredit] = useState<Msg>(null), [mSend, setMSend] = useState<Msg>(null)
  useEffect(() => {
    if (!info.data) return
    setTpl(info.data.settings.template); setEnabled(info.data.settings.enabled)
    setNewName((x) => x || info.data!.default_template.name); setNewText((x) => x || info.data!.default_template.text)
  }, [info.data])

  const run = async (id: string, set: (m: Msg) => void, fn: () => Promise<string>) => {
    setBusy(id); set(null)
    try { set({ ok: true, text: await fn() }) } catch (e) { set({ ok: false, text: friendly(e) }) }
    setBusy(null); info.reload()
  }
  const d = info.data

  return (
    <>
      <div className="adm-page-head"><div><h2>ورود پیامکی (تست)</h2><p className="adm-note">ابزار آزمایشی ورود با کد یک‌بارمصرف پیامکی از طریق قاصدک. کلید وب‌سرویس را در «تنظیمات API» وارد کنید؛ هر ارسال آزمایشی یک پیامک واقعی است و از اعتبار حساب کم می‌شود.</p></div></div>
      <ModeBanner />

      {info.error ? <ErrorBox error={info.error} onRetry={info.reload} /> : !d ? <p className="adm-note">در حال بارگذاری…</p> : <>
        <section className="adm-card"><h3 className="adm-sub">وضعیت</h3>
          <ul className="adm-checklist" aria-label="وضعیت ورود پیامکی">
            <li><span className={`adm-badge ${d.configured ? 'on' : 'warn'}`}>{d.configured ? 'آماده' : 'نیاز به اقدام'}</span><div><strong>کلید قاصدک</strong><p className="adm-note">{d.configured ? 'تنظیم شده است.' : <>هنوز وارد نشده؛ از <a href="/admin/api-settings">تنظیمات API</a> وارد کنید.</>}</p></div></li>
            <li><span className={`adm-badge ${d.settings.enabled ? 'on' : 'warn'}`}>{d.settings.enabled ? 'روشن' : 'خاموش'}</span><div><strong>ورود پیامکی برای کاربران</strong><p className="adm-note">قالب فعلی: <code dir="ltr">{d.settings.template}</code></p></div></li>
            <li><span className={`adm-badge ${d.https ? 'on' : 'warn'}`}>{d.https ? 'امن' : 'ناامن'}</span><div><strong>نشانی وب‌سرویس: <code dir="ltr">{d.base_host}</code></strong><p className="adm-note">{d.https ? 'ارتباط با قاصدک با HTTPS است.' : 'ارتباط بدون رمزنگاری است و کلید در شبکه دیده می‌شود. متغیر GHASEDAK_BASE_URL را روی نشانی https بگذارید.'}</p></div></li>
            <li><span className={`adm-badge ${d.available ? 'on' : 'warn'}`}>{d.available ? 'فعال' : 'غیرفعال'}</span><div><strong>در دسترس کاربران</strong><p className="adm-note">{d.available ? 'ردیف «ورود با شماره موبایل» در تنظیمات برنامه دیده می‌شود.' : 'تا کلید و قالب آماده و ورود روشن نباشد، کاربران گزینهٔ ورود را نمی‌بینند.'}</p></div></li>
          </ul>
        </section>

        <section className="adm-card"><h3 className="adm-sub">تنظیمات</h3>
          <form className="adm-form" style={{ display: 'grid', gap: 10 }} onSubmit={(e) => { e.preventDefault(); void run('save', setMSave, async () => { await api('/admin/sms/settings', { method: 'PUT', body: { template: tpl.trim(), enabled } }); return 'ذخیره شد.' }) }}>
            <label>نام قالب در قاصدک (فقط حروف انگلیسی، عدد، «-» و «_»)<input dir="ltr" value={tpl} onChange={(e) => setTpl(e.target.value)} maxLength={40} /></label>
            <label className="adm-switch-row"><span>روشن‌بودن ورود پیامکی برای کاربران</span><input type="checkbox" role="switch" className="adm-switch" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /></label>
            <div className="adm-inline"><button className="adm-btn primary" disabled={busy !== null || !tpl.trim()}>ذخیره</button><Result m={mSave} /></div>
          </form>
        </section>

        <section className="adm-card"><h3 className="adm-sub">قالب پیامک</h3>
          <p className="adm-note">قاصدک کد را فقط با «قالب آماده» می‌فرستد. نام قالب نباید فارسی باشد و متن باید <code dir="ltr">%param1%</code> (جای کد) را داشته باشد. برند یا نام برنامه را در متن بیاورید. قالب ممکن است تا تأیید قاصدک آماده ارسال نباشد.</p>
          <div className="adm-form" style={{ display: 'grid', gap: 10 }}>
            <label>نام قالب<input dir="ltr" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} /></label>
            <label>متن قالب<textarea rows={3} value={newText} onChange={(e) => setNewText(e.target.value)} maxLength={300} /></label>
            <div className="adm-inline">
              <button type="button" className="adm-btn primary" disabled={busy !== null || !newName.trim() || !newText.includes('%param1%')} onClick={() => void run('tpl', setMTpl, async () => { const r = await api<{ template_id: number; message: string }>('/admin/sms/template', { method: 'POST', body: { name: newName.trim(), message: newText.trim(), apply: true } }); setTid(String(r.template_id)); return `شناسهٔ قالب ${faNum(r.template_id)} — ${r.message}` })}>ساخت قالب و استفاده از آن</button>
              <input dir="ltr" inputMode="numeric" aria-label="شناسهٔ قالب" placeholder="شناسهٔ قالب" value={tid} onChange={(e) => setTid(e.target.value.replace(/\D/g, ''))} style={{ maxWidth: 140 }} />
              <button type="button" className="adm-btn" disabled={busy !== null || !tid} onClick={() => void run('tplst', setMTpl, async () => { const r = await api<{ status: number }>('/admin/sms/template/status', { method: 'POST', body: { template_id: Number(tid) } }); return `وضعیت قالب (کد قاصدک): ${faNum(r.status)}` })}>وضعیت قالب</button>
            </div>
            <Result m={mTpl} />
          </div>
        </section>

        <section className="adm-card"><h3 className="adm-sub">اعتبار حساب</h3>
          <div className="adm-inline"><button type="button" className="adm-btn" disabled={busy !== null || !d.configured} onClick={() => void run('credit', setMCredit, async () => rial((await api<{ credit_rial: number }>('/admin/sms/credit', { method: 'POST' })).credit_rial))}>دریافت اعتبار</button><Result m={mCredit} /></div>
        </section>

        <section className="adm-card"><h3 className="adm-sub">ارسال آزمایشی</h3>
          <p className="adm-note">یک کد تصادفی با قالب فعلی به شمارهٔ شما پیامک می‌شود. این کد ذخیره نمی‌شود و برای ورود معتبر نیست. برای تست کامل ورود، از خود برنامه (تنظیمات ← ورود با شماره موبایل) استفاده کنید.</p>
          <form className="adm-inline" onSubmit={(e) => { e.preventDefault(); void run('send', setMSend, async () => (await api<{ message: string }>('/admin/sms/test-send', { method: 'POST', body: { phone } })).message) }}>
            <input dir="ltr" type="tel" inputMode="tel" autoComplete="off" aria-label="شمارهٔ موبایل" placeholder="09123456789" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className="adm-btn primary" disabled={busy !== null || !d.configured || phone.trim().length < 10}>{busy === 'send' ? 'در حال ارسال…' : 'ارسال کد آزمایشی'}</button>
          </form>
          <Result m={mSend} />
        </section>

        <section className="adm-card"><h3 className="adm-sub">آخرین ارسال‌ها</h3>
          {d.log.length === 0 ? <p className="adm-note">هنوز ارسالی ثبت نشده است. (فقط شمارهٔ ماسک‌شده نگه‌داری می‌شود و هرگز کد.)</p> : (
            <div className="adm-table-wrap"><table className="adm-table">
              <thead><tr><th>زمان</th><th>شماره</th><th>نوع</th><th>نتیجه</th></tr></thead>
              <tbody>{d.log.map((l, i) => <tr key={`${l.at}-${i}`}><td>{fmtDate(l.at)}</td><td dir="ltr">{l.phone_masked}</td><td>{l.kind === 'login' ? 'ورود کاربر' : 'آزمایشی'}</td><td><span className={`adm-badge ${l.ok ? 'on' : 'warn'}`}>{l.ok ? 'ارسال شد' : ERR_FA[l.error ?? 'unknown'] ?? 'ناموفق'}</span></td></tr>)}</tbody>
            </table></div>)}
        </section>
      </>}
    </>
  )
}
