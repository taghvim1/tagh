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
      items.push({ id: s.id, version: s.version, published_at: s.published_at, content: s.content, image: { url: cover.url, attribution: cover.attribution, source_url: cover.source_url, license: cover.license } })
    }
    return { items }
  })
}
