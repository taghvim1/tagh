import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { issuesOf } from '../domain/schema.js'
import type { ConsentRow, EventRow, Store } from '../store/types.js'

const EVENT_TYPES = ['app_open', 'view_calendar', 'view_season', 'select_season', 'view_suggestions', 'view_destination', 'destination_dwell', 'favorite_add', 'favorite_remove', 'search', 'use_filter', 'select_budget', 'select_travel_style', 'select_scope', 'view_tours', 'view_tour', 'view_organizer', 'offer_click', 'notification_open', 'feature_use', 'settings_change', 'technical_error'] as const
const iso = z.string().max(40).refine((v) => !Number.isNaN(Date.parse(v)), 'تاریخ نامعتبر')
const short = z.string().max(80)
const consentCtx = z.object({ analytics: z.boolean(), marketing: z.boolean(), notifications: z.boolean().default(false), location: z.boolean().default(false) })
const int = z.number().int().min(0).max(1e9)

const eventSchema = z.object({
  event_id: z.string().min(1).max(80), anonymous_id: short, event_type: z.enum(EVENT_TYPES), occurred_at: iso, session_id: short,
  destination_id: int.optional(), tour_id: int.optional(), organizer_id: int.optional(),
  season: short.optional(), category: short.optional(), budget_range: short.optional(), travel_style: short.optional(),
  domestic_or_international: z.enum(['domestic', 'international']).optional(), filters: z.array(z.string().max(30)).max(20).optional(),
  duration_sec: z.number().min(0).max(3600).optional(), query_length: z.number().min(0).max(200).optional(), error_code: z.string().max(60).optional(),
  app_version: z.string().max(20), platform: z.enum(['web', 'pwa']), consent_context: consentCtx,
}) // user_id عمداً نادیده گرفته می‌شود: پیش از احراز هویت قابل‌اعتماد نیست
const consentSchema = z.object({ consent_id: z.string().min(1).max(80), subject_id: short, kind: z.enum(['analytics', 'marketing', 'notifications', 'location']), granted: z.boolean(), recorded_at: iso, policy_version: z.string().max(30), source: z.enum(['default', 'settings', 'prompt', 'privacy_page', 'server', 'permission']) })
const envelope = z.object({ anonymous_id: short.min(1), platform: z.enum(['web', 'pwa']), app_version: z.string().max(20), consents: z.array(z.unknown()).max(100).default([]), events: z.array(z.unknown()).max(100).default([]) })

/** دریافت دسته‌ای رویدادها و رضایت‌ها از برنامه. عمومی (بدون ورود) اما با محدودیت اندازه/نرخ و اعتبارسنجی. */
export function eventRoutes(app: FastifyInstance, store: Store, now: () => Date = () => new Date()) {
  app.post('/events', { bodyLimit: 256 * 1024, config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req, reply) => {
    const env = envelope.safeParse(req.body)
    if (!env.success) return reply.code(400).send({ error: 'validation', errors: issuesOf(env.error).slice(0, 5) })
    const t = now().toISOString(), { anonymous_id } = env.data
    const consents: ConsentRow[] = [], rejected: string[] = []
    for (const c of env.data.consents) {
      const p = consentSchema.safeParse(c)
      if (p.success && p.data.subject_id === anonymous_id) consents.push({ ...p.data, received_at: t }); else rejected.push('consent')
    }
    const savedConsents = await store.addConsents(consents)
    const latest = await store.latestConsents(anonymous_id)
    const rows: EventRow[] = []
    let noConsent = 0
    for (const e of env.data.events) {
      const p = eventSchema.safeParse(e)
      if (!p.success || p.data.anonymous_id !== anonymous_id) { rejected.push('event'); continue }
      // رضایت تحلیل باید هم روی رویداد و هم در آخرین رکورد سرور برقرار باشد؛ لغو بر ارسال دیررسیده غالب است
      if (!p.data.consent_context.analytics || latest.analytics === false) { noConsent++; continue }
      const { event_id, anonymous_id: _a, event_type, occurred_at, session_id, app_version, platform, consent_context, ...props } = p.data
      void _a
      rows.push({ event_id, anonymous_id, event_type, occurred_at, session_id, props, app_version, platform, consent_context, received_at: t })
    }
    const r = await store.addEvents(rows)
    return { accepted: r.inserted, duplicates: r.duplicates, dropped_no_consent: noConsent, rejected: rejected.length, consents_saved: savedConsents }
  })
}
