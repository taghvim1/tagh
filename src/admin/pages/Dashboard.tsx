import Icon from '../components/Icon'
import QuickAction from '../components/QuickAction'
import Section from '../components/Section'
import StatCard, { type StatTone } from '../components/StatCard'
import type { IconName } from '../components/Icon'
import bundled from '../../../public/data/calendar-data.json'
import { INITIAL_EVENTS } from '../data/events'
import { faNum } from '../../lib/jalali'

// آمار از داده‌ی واقعی تقویم (همان فایلی که اپ کاربران با خودش دارد) ساخته می‌شود؛ مقدارهای اندازه‌گیرینشده (مثل «سلامت سرویس») نمایش داده نمی‌شوند.
const holidays = INITIAL_EVENTS.filter((e) => e.description === 'تعطیل رسمی').length
const year = INITIAL_EVENTS[0]?.calendar_date.slice(0, 4) ?? ''

const STATS: { title: string; value: string; description: string; icon: IconName; tone: StatTone }[] = [
  { title: 'مناسبت‌ها', value: faNum(INITIAL_EVENTS.length), description: `ثبت‌شده در داده‌ی تقویم سال ${year}`, icon: 'event', tone: 'teal' },
  { title: 'تعطیلات رسمی', value: faNum(holidays), description: `روز تعطیل رسمی در سال ${year}`, icon: 'calendar', tone: 'green' },
  { title: 'نسخه‌ی داده', value: faNum(bundled.version), description: 'مناسبت‌های همراه برنامه', icon: 'system', tone: 'blue' },
  { title: 'وضعیت PWA', value: 'فعال', description: 'قابل نصب روی گوشی', icon: 'mobile', tone: 'amber' },
]

const ACTIONS: { title: string; description: string; path: string; icon: IconName }[] = [
  { title: 'مناسبت‌ها', description: 'افزودن و ویرایش مناسبت‌های تقویم', path: '/admin/events', icon: 'event' },
  { title: 'مدیریت پیشنهادها', description: 'چرخهٔ پیش‌نویس تا انتشار مقصدها', path: '/admin/suggestions', icon: 'compass' },
  { title: 'تولید با هوش مصنوعی', description: 'ساخت پیش‌نویس محتوا با Gemini', path: '/admin/ai-suggestions', icon: 'spark' },
  { title: 'تورها', description: 'مدیریت تورها و برگزارکنندگان', path: '/admin/tours', icon: 'ticket' },
  { title: 'کاربران', description: 'مشاهده کاربران و تحلیل رفتار', path: '/admin/users', icon: 'chart' },
  { title: 'تنظیمات API', description: 'کلیدهای Gemini و منابع تصویر', path: '/admin/api-settings', icon: 'key' },
]

const SYSTEM_INFO = [
  { label: 'نسخه', value: '۱٫۰٫۰' },
  { label: 'تقویم', value: 'جلالی' },
  { label: 'زبان', value: 'فارسی' },
  { label: 'نسخه‌ی داده‌ی مناسبت‌ها', value: faNum(bundled.version) },
]

export default function Dashboard() {
  return (
    <>
      <section className="adm-welcome">
        <h2>مدیریت تقویم سفری</h2>
        <p>مدیریت محتوای تقویم، پیشنهادهای سفر و کاربران در یک نگاه. برای شروع از دسترسی سریع زیر استفاده کنید.</p>
      </section>

      <Section title="نمای کلی" desc="خلاصه‌ای از وضعیت فعلی سیستم">
        <div className="adm-stats">
          {STATS.map((s) => <StatCard key={s.title} {...s} />)}
        </div>
      </Section>

      <Section title="دسترسی سریع" desc="پرکاربردترین بخش‌های پنل">
        <div className="adm-actions">
          {ACTIONS.map((a) => <QuickAction key={a.path} {...a} />)}
        </div>
      </Section>

      <div className="adm-split">
        <Section title="فعالیت‌های اخیر" desc="آخرین تغییرات مدیریت">
          <div className="adm-card adm-empty">
            <span className="adm-empty-icon" aria-hidden="true"><Icon name="clock" size={24} /></span>
            <strong>هنوز فعالیتی ثبت نشده است</strong>
            <p>پس از اتصال پنل به سیستم، فعالیت‌های مدیریتی (ایجاد، ویرایش و انتشار) اینجا نمایش داده می‌شوند.</p>
          </div>
        </Section>

        <Section title="اطلاعات سیستم" desc="مشخصات نسخهٔ جاری">
          <dl className="adm-card adm-info">
            {SYSTEM_INFO.map((i) => (
              <div key={i.label}>
                <dt>{i.label}</dt>
                <dd>{i.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </>
  )
}
