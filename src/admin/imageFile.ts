// تصویر انتخابی مدیر → JPEG کوچک‌شده (data URL) برای ذخیرهٔ محلی. محدودیت اندازه برای localStorage.
export const MAX_IMAGE_BYTES = 150 * 1024
export async function fileToDataUrl(file: File, maxSide = 900): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('فایل انتخاب‌شده تصویر نیست.')
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  for (const q of [0.82, 0.7, 0.55, 0.4]) {
    const url = c.toDataURL('image/jpeg', q)
    if (url.length * 0.75 <= MAX_IMAGE_BYTES) return url
  }
  throw new Error('حجم تصویر بعد از کوچک‌کردن هم زیاد است؛ تصویر کوچک‌تری انتخاب کنید.')
}
