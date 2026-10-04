# تقویم سفری (PWA)

تقویم شمسی ساده با React + Vite + TypeScript. بدون بک‌اند و دیتابیس.

## اجرا
```bash
npm install
npm run dev        # توسعه
npm run build      # ساخت نسخه نهایی در dist/
npm run preview    # اجرای نسخه نهایی (برای تست PWA)
```

## تست PWA
Service Worker فقط در نسخه build فعال می‌شود:
1. `npm run build && npm run preview` و باز کردن آدرس نمایش‌داده‌شده در Chrome.
2. DevTools ← Application ← Manifest: بدون خطا و آیکون‌ها نمایش داده شوند.
3. Application ← Service Workers: وضعیت activated.
4. آیکون نصب در نوار آدرس (یا منوی Install app) را بزنید.
5. گزینهٔ Offline را فعال کنید و صفحه را رفرش کنید؛ باید بالا بیاید.

نکته: نصب روی دامنهٔ واقعی نیازمند HTTPS است (localhost مستثناست).

## دیپلوی روی Railway
1. پروژه را در GitHub بگذارید (`node_modules` و `dist` در `.gitignore` هستند).
2. در Railway: New Project ← Deploy from GitHub repo.
3. تنظیمات Build و Start از `railway.json` خوانده می‌شود (`npm run build` و `npm start`).
4. Settings ← Networking ← Generate Domain.
5. آدرس https را در Chrome باز کنید و تست PWA را انجام دهید.

## مسیرها
- `/` تقویم
- `/admin`، `/admin/calendar`، `/admin/events`، `/admin/settings`: اسکلت پنل مدیریت (فعلاً بدون قابلیت واقعی)

مسیرها سمت کلاینت هستند؛ `serve -s` همهٔ مسیرها را به `index.html` برمی‌گرداند.
