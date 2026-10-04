import { Link } from '../lib/router'
import { MONTHS, faNum, fromGregorian } from '../lib/jalali'
import { getSelectedDate } from '../lib/selection'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

// صفحهٔ اولیهٔ پیشنهاد سفر؛ فیلترها و موتور پیشنهاد در مراحل بعد اضافه می‌شوند.
export default function TravelSuggestions() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const date = getSelectedDate() ?? fromGregorian(new Date())

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <main className="tp-main">
        <Link to="/" className="tp-back"><span aria-hidden="true">›</span> بازگشت به تقویم</Link>

        <header className="tp-head">
          <h1>پیشنهاد سفر</h1>
          <p className="tp-lead">مقصد مناسب خودت را برای این تاریخ پیدا کن.</p>
          <p className="tp-sub">برای شروع، تاریخ و شرایط سفر خودت را انتخاب کن.</p>
        </header>

        <section className="tp-date" aria-label="تاریخ انتخاب‌شده">
          <span className="tp-label">تاریخ انتخاب‌شده</span>
          <strong>{faNum(date.day)} {MONTHS[date.month - 1]}</strong>
        </section>

        <section className="tp-placeholder">
          <h2>پیشنهادهای سفر</h2>
          <p>پیشنهادهای مناسب برای این تاریخ در این بخش نمایش داده می‌شوند.</p>
        </section>
      </main>
    </div>
  )
}
