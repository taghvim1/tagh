// عنوان تاریخ شمسی برای اعلان (هم در صفحه و هم در Service Worker، بدون وابستگی). با src/lib/jalali.ts هم‌خوانی آن در tests/date-notification.test.ts بررسی می‌شود.
;(function (g) {
  var MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
  var WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
  var fmt = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' })
  var fa = function (n) { return Number(n).toLocaleString('fa-IR', { useGrouping: false }) }
  function parts(d) {
    var o = {}
    fmt.formatToParts(d).forEach(function (p) { if (p.type === 'year' || p.type === 'month' || p.type === 'day') o[p.type] = parseInt(p.value, 10) })
    return o
  }
  g.taghvimDateTitle = function (d) {
    d = d || new Date()
    var p = parts(d)
    return { year: p.year, month: p.month, day: p.day, title: WEEKDAYS[(d.getDay() + 1) % 7] + ' ' + fa(p.day) + ' ' + MONTHS[p.month - 1] + ' ماه' }
  }
  // عنوان کامل اعلان: «سه‌شنبه ۲۱ مهر ماه   ·   دما °۲۲» (اگر دمای همین ساعت نبود فقط تاریخ)
  g.taghvimNotifTitle = function (d, temp) {
    var t = g.taghvimDateTitle(d).title
    if (temp === null || temp === undefined) return t
    return t + '   ·   دما ' + (temp < 0 ? '\u2212' : '') + '\u00b0' + fa(Math.abs(temp))
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = g.taghvimDateTitle
})(typeof self !== 'undefined' ? self : globalThis)
