import { z } from 'zod'
import type { Store } from '../store/types.js'

export const aiSettingsSchema = z.object({
  llm: z.object({ primaryModel: z.string().trim().min(1).max(80), fallbackModel: z.string().trim().max(80).default(''), temperature: z.number().min(0).max(1).default(0.3) }),
  webSearch: z.object({ enabled: z.boolean(), provider: z.literal('tavily'), maxResults: z.number().int().min(1).max(10) }),
  imageSearch: z.object({ providers: z.array(z.enum(['wikimedia', 'unsplash'])).max(2), maxPerProvider: z.number().int().min(1).max(10) }),
  tasks: z.object({ generate: z.object({ useWebSearch: z.boolean() }), images: z.object({ autoSearchOnGenerate: z.boolean() }) }),
})
export type AiSettings = z.infer<typeof aiSettingsSchema>
export const DEFAULT_AI_SETTINGS: AiSettings = {
  llm: { primaryModel: 'gemini-3.8-flash', fallbackModel: 'gemini-3.5-flash-lite', temperature: 0.3 },
  webSearch: { enabled: false, provider: 'tavily', maxResults: 5 },
  imageSearch: { providers: ['wikimedia', 'unsplash'], maxPerProvider: 6 },
  tasks: { generate: { useWebSearch: true }, images: { autoSearchOnGenerate: true } },
}
export async function loadAiSettings(store: Store): Promise<AiSettings> {
  const raw = await store.getKV('ai_settings')
  if (!raw) return DEFAULT_AI_SETTINGS
  const p = aiSettingsSchema.safeParse(JSON.parse(raw)); return p.success ? p.data : DEFAULT_AI_SETTINGS
}
export const saveAiSettings = (store: Store, s: AiSettings) => store.setKV('ai_settings', JSON.stringify(s))
