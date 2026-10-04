import QuickAction from '../components/QuickAction'
import Section from '../components/Section'
import StatCard from '../components/StatCard'
import type { IconName } from '../components/Icon'

// داده‌های Static/Mock؛ در مراحل بعد با داده‌های واقعی جایگزین می‌شوند.
const STATS: { title: string; value: string; description: string; icon: IconName }[] = [
  { title: 'وضعیت تقویم', value: 'فعال', description: 'تقویم شمسی', icon: 'calendar' },
  { title: 'مناسبت‌ها', value: '۰', description: 'مناسبت ثبت‌شده', icon: 'event' },
  { title: 'وضعیت PWA', value: 'فعال', description: 'قابل نصب', icon: 'mobile' },
  { title: 'وضعیت سیستم', value: 'سالم', description: 'نسخه فعلی', icon: 'system' },
]

const ACTIONS: { title: string; description: string; path: string; icon: IconName }[] = [
  { title: 'تقویم', description: 'مشاهده و بررسی تقویم', path: '/admin/calendar', icon: 'calendar' },
  { title: 'مناسبت‌ها', description: 'مدیریت مناسبت‌ها', path: '/admin/events', icon: 'event' },
  { title: 'تنظیمات', description: 'تنظیمات سیستم', path: '/admin/settings', icon: 'settings' },
]

const SYSTEM_INFO = [
  { label: 'نسخه', value: '۱٫۰٫۰' },
  { label: 'تقویم', value: 'جلالی' },
  { label: 'زبان', value: 'فارسی' },
  { label: 'وضعیت', value: 'فعال' },
]

export default function Dashboard() {
  return (
    <>
      <section className="adm-welcome">
        <h2>مدیریت تقویم سفری</h2>
        <p>مدیریت و کنترل محتوای تقویم در یک نگاه</p>
      </section>

      <Section title="نمای کلی">
        <div className="adm-stats">
          {STATS.map((s) => <StatCard key={s.title} {...s} />)}
        </div>
      </Section>

      <Section title="دسترسی سریع">
        <div className="adm-actions">
          {ACTIONS.map((a) => <QuickAction key={a.path} {...a} />)}
        </div>
      </Section>

      <div className="adm-split">
        <Section title="فعالیت‌های اخیر">
          <div className="adm-card adm-empty">
            <strong>هنوز فعالیتی ثبت نشده است</strong>
            <p>پس از اتصال پنل به سیستم، فعالیت‌های مدیریتی اینجا نمایش داده می‌شوند.</p>
          </div>
        </Section>

        <Section title="اطلاعات سیستم">
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
