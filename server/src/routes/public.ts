import type { FastifyInstance } from 'fastify'
import type { Store } from '../store/types.js'

/** فقط پیشنهادهای «منتشرشده» با تصویر تأییدشده؛ بدون هیچ فیلد داخلی (دلیل رد، منبع هوش مصنوعی، …) */
export function publicRoutes(app: FastifyInstance, store: Store) {
  app.get('/travel-suggestions', async () => {
    const all = (await store.allSuggestions()).filter((s) => s.status === 'published')
    const items = []
    for (const s of all) {
      const cover = s.cover_image_id ? await store.getImage(s.cover_image_id) : null
      if (!cover || cover.status !== 'approved') continue
      // همهٔ تصاویر تأییدشده برای ورق‌زدن: اول تصویر اصلی، بعد بقیه به ترتیب ثبت (حداکثر ۸)
      const extra = (await store.listImages(s.id)).filter((i) => i.status === 'approved' && i.id !== cover.id && i.license?.trim()).sort((a, b) => a.id - b.id)
      const pick = (i: typeof cover) => ({ url: i.url, attribution: i.attribution, source_url: i.source_url, license: i.license })
      items.push({ id: s.id, version: s.version, published_at: s.published_at, content: s.content, image: pick(cover), images: [cover, ...extra].slice(0, 8).map(pick) })
    }
    return { items }
  })
}
