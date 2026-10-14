import { describe, expect, it } from 'vitest'
import { imageQueriesFor, normalizeScope, parseModelOutput } from '../src/ai/service.js'
import { renderPrompt, DEFAULT_TEMPLATE } from '../src/ai/prompt.js'

const season = { rating: 'good', average_temperature: 20, temperature_min: 10, temperature_max: 30, weather_condition: 'معتدل', rainfall: 'low', humidity: 'low', priority: 0, description: 'خوب' }
const base = (o: Record<string, unknown>) => JSON.stringify({ name: 'باتومی', country: 'گرجستان', province_or_city: 'آجارا', scope: 'domestic', type: ['طبیعت'], description: 'متن', duration: '۲ تا ۳ روز', budget: 'متوسط', companions: [], recommended_for: [], attractions: [], visa_required: true, seasons: { spring: season, summer: season, autumn: season, winter: season }, ...o })

describe('تشخیص داخلی/خارجی', () => {
  it('کشور تعیین‌کننده است نه حدس مدل', () => {
    const a = parseModelOutput(base({}))
    if (!a.ok) throw new Error(a.errors.join()); expect(a.value.scope).toBe('international'); expect(a.value.visa_required).toBe(true)
    for (const country of ['ایران', 'Iran', 'جمهوری اسلامی ایران']) {
      const b = parseModelOutput(base({ name: 'ماسال', country, scope: 'international', visa_required: true }))
      if (!b.ok) throw new Error(b.errors.join()); expect(b.value).toMatchObject({ scope: 'domestic', country: 'ایران', visa_required: null })
    }
    expect(normalizeScope({ country: 'ترکیه', scope: 'domestic', visa_required: null } as never)).toMatchObject({ scope: 'international', visa_required: false })
  })
})
describe('تنوع تصویر', () => {
  it('بدون عبارت‌های مدل، زاویه‌های شهر/معماری/بازار هم جست‌وجو می‌شود', () => {
    const q = imageQueriesFor({ name: 'یزد', country: 'ایران', image_query: 'Yazd Iran' })
    expect(q[0]).toBe('Yazd Iran'); expect(q.join('|')).toMatch(/architecture/); expect(q.join('|')).toMatch(/bazaar/); expect(q.length).toBeLessThanOrEqual(5)
  })
  it('عبارت‌های مدل بدون تکرار استفاده می‌شوند', () => {
    expect(imageQueriesFor({ name: 'x', country: 'y', image_query: 'A', image_queries: ['A', 'B', 'C'] })).toEqual(['A', 'B', 'C'])
  })
  it('قواعد تکمیلی همیشه به پرامپت (حتی سفارشی) اضافه می‌شود', () => {
    expect(renderPrompt('{{names}} {{schema}}', 'یزد', [])).toMatch(/image_queries/)
    expect(renderPrompt(DEFAULT_TEMPLATE, 'یزد', [])).toMatch(/domestic/)
  })
})
