import { useEffect, useState } from 'react'
import { tracker, useAnalytics } from '../analytics'
import { ASKED_KINDS } from '../analytics/consent'
import type { ConsentKind } from '../analytics/types'
import CenterModal from './CenterModal'

export const CONSENT_TEXT: Record<'analytics' | 'marketing' | 'notifications', { title: string; text: string }> = {
  analytics: { title: 'تحلیل ناشناس استفاده', text: 'فقط رویدادهای کلی (مثل مشاهدهٔ مقصد یا فصل) با یک شناسهٔ تصادفی؛ بدون نام، موقعیت و متن جست‌وجو.' },
  marketing: { title: 'تبلیغات شخصی‌سازی‌شده', text: 'اجازه می‌دهید پیشنهادها و تبلیغات بر اساس علایق شما نمایش داده شود.' },
  notifications: { title: 'اعلان‌ها', text: 'اجازه می‌دهید برنامه اعلان‌های مفید (مثل یادآوری‌ها) را برای شما آماده کند. اجازهٔ اعلان مرورگر جداگانه و فقط با اقدام شما پرسیده می‌شود.' },
}
const SESSION_FLAG = 'taghvim-consent-prompted'
const flagged = () => { try { return sessionStorage.getItem(SESSION_FLAG) === '1' } catch { return false } }
const setFlag = () => { try { sessionStorage.setItem(SESSION_FLAG, '1') } catch { /* فقط حافظه */ } }

/** پنجرهٔ رضایت: هیچ گزینه‌ای از پیش انتخاب نیست؛ فقط رضایت‌های نپذیرفته نمایش داده می‌شوند و برنامه را مسدود نمی‌کند. */
export function ConsentGate() {
  const an = useAnalytics()
  const [open, setOpen] = useState(false)
  const [asked, setAsked] = useState<ConsentKind[]>([])
  const [first, setFirst] = useState(true)
  const [picked, setPicked] = useState<Partial<Record<ConsentKind, boolean>>>({})

  useEffect(() => {
    if (flagged()) return
    const toAsk = tracker.toAsk()
    if (!toAsk.length) return
    const d = tracker.decisions()
    setFirst(ASKED_KINDS.every((k) => d[k] === 'undecided'))
    setAsked(toAsk); setFlag()
    const t = window.setTimeout(() => setOpen(true), 600) // اول برنامه دیده شود، سپس پنجره
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  void an

  const close = () => setOpen(false)
  const save = () => { tracker.setConsents(Object.fromEntries(asked.map((k) => [k, !!picked[k]])), 'prompt'); close() }
  const decline = () => { tracker.setConsents(Object.fromEntries(asked.map((k) => [k, false])), 'prompt'); close() }

  return (
    <CenterModal open={open && asked.length > 0} onClose={close} label="رضایت حریم خصوصی">
      <div className="cs-dialog" dir="rtl">
        <h2>{first ? 'حریم خصوصی شما' : 'مرور انتخاب‌های حریم خصوصی'}</h2>
        <p className="cs-lead">{first ? 'هر مورد جداگانه است و هیچ‌کدام پیش‌فرض روشن نیست. برنامه بدون پذیرش هم کامل کار می‌کند و بعداً از «تنظیمات ← حریم خصوصی» می‌توانید تغییر دهید.' : 'این موارد را هنوز نپذیرفته‌اید. اگر مایلید می‌توانید اکنون فعال کنید؛ در غیر این صورت ادامه دهید.'}</p>
        <div className="st-list">
          {asked.map((k) => k !== 'location' && (
            <label key={k} className="cs-row">
              <span><strong>{CONSENT_TEXT[k].title}</strong><small>{CONSENT_TEXT[k].text}</small></span>
              <input type="checkbox" role="switch" className="cal-switch" checked={!!picked[k]} onChange={(e) => setPicked((p) => ({ ...p, [k]: e.target.checked }))} />
            </label>
          ))}
        </div>
        <div className="cs-actions">
          <button type="button" className="tp-btn cs-primary" onClick={save}>ذخیرهٔ انتخاب‌ها</button>
          <button type="button" className="tp-btn" onClick={decline}>ادامه بدون پذیرش</button>
        </div>
      </div>
    </CenterModal>
  )
}
