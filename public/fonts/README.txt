فایل‌های فونت B Yekan را اینجا بگذارید (نام فایل‌ها دقیقاً همین باشد):

  BYekan.woff2   (ترجیحاً)
  BYekan.woff
  BYekan.ttf

سپس در src/admin/admin.css سه خط url(...) مربوط به @font-face را از حالت کامنت خارج کنید
و نام کش را در public/sw.js (مثلاً taghvim-v3 به taghvim-v4) تغییر دهید.
