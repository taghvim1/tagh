import type { FeedKind } from '../../feed/topics'

// نوع‌های API مدیر برای «محتوای صفحهٔ اصلی» (هم‌شکل server/src/feed/schema.ts)
export type FeedStatus = 'draft' | 'queued' | 'published' | 'rejected'
export const FEED_STATUS_LABEL: Record<FeedStatus, string> = { draft: 'پیش‌نویس', queued: 'صف انتشار', published: 'منتشرشده', rejected: 'ردشده' }
export const FEED_TABS: FeedStatus[] = ['queued', 'draft', 'published', 'rejected']

export interface FeedFact { label: string; value: string }
export interface FeedSource { title: string; url: string }
export interface FeedImage { id: number; url: string; thumb_url: string | null; provider: string; source_url: string | null; author: string | null; license: string | null; license_url: string | null; attribution: string | null }
export interface FeedContent { title: string; body: string; place?: string; facts: FeedFact[]; image_queries: string[] }
export interface AdminFeedItem {
  id: number; kind: FeedKind; status: FeedStatus; source: 'ai' | 'manual'
  content: FeedContent; sources: FeedSource[]; images: FeedImage[]
  cover_image_id: number | null; cover_auto: boolean
  ai_meta: { model?: string; used_fallback?: boolean; generated_at?: string; warnings: string[] } | null
  reject_reason: string | null
  created_at: string; updated_at: string; queued_at: string | null; published_at: string | null; published_date: string | null
  queue_position: number | null; blocking: string[]
}
export interface TopicSummary { kind: FeedKind; title: string; counts: Record<FeedStatus, number>; today: { id: number; title: string; published_date: string | null } | null }
export interface FeedGenResult { id?: number; title: string; ok: boolean; reason?: string; images_added?: number; image_errors?: string[] }
export interface FeedGenResponse { ok: true; results: FeedGenResult[]; meta: { model?: string; warnings: string[] } }

// ---- تبدیل متن فرم ⇄ داده ----
export const factsToText = (f: FeedFact[]) => f.map((x) => `${x.label}: ${x.value}`).join('\n')
export const textToFacts = (t: string): FeedFact[] => t.split('\n').flatMap((l) => {
  const i = l.search(/[:：]/); if (i < 1) return []
  const label = l.slice(0, i).trim(), value = l.slice(i + 1).trim()
  return label && value ? [{ label, value }] : []
})
export const sourcesToText = (s: FeedSource[]) => s.map((x) => `${x.title} | ${x.url}`).join('\n')
export const textToSources = (t: string): FeedSource[] => t.split('\n').flatMap((l) => {
  const line = l.trim(); if (!line) return []
  const i = line.lastIndexOf('|')
  const url = (i >= 0 ? line.slice(i + 1) : line).trim(), title = i >= 0 ? line.slice(0, i).trim() : ''
  if (!/^https?:\/\//i.test(url)) return []
  let host = url; try { host = new URL(url).hostname } catch { /* همان آدرس */ }
  return [{ title: title || host, url }]
})
