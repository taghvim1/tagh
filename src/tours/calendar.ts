// اتصال تورها به تقویم: علامت روزها همیشه از روی خود تورها محاسبه می‌شود (هیچ رویداد جداگانه‌ای ذخیره نمی‌شود).
import { useMemo } from 'react'
import { useOrganizers } from '../tour-organizers/repository'
import { addDays, parseISO, publicTours, toISO } from './logic'
import { useTours } from './repository'
import type { Tour } from './types'

/** کلید = تاریخ ISO میلادی هر روز؛ مقدار = تورهای فعالی که آن روز را پوشش می‌دهند */
export type TourDayMap = ReadonlyMap<string, Tour[]>

const MAX_SPAN = 366

export function buildTourDayMap(tours: Tour[], organizers: Parameters<typeof publicTours>[1], now: Date = new Date()): TourDayMap {
  const map = new Map<string, Tour[]>()
  for (const t of publicTours(tours, organizers, now)) {
    const end = parseISO(t.endDate)
    let d = parseISO(t.startDate)
    for (let i = 0; i < MAX_SPAN && d <= end; i++, d = addDays(d, 1)) {
      const k = toISO(d)
      const arr = map.get(k)
      if (arr) arr.push(t); else map.set(k, [t])
    }
  }
  return map
}

export function useTourDays(): TourDayMap {
  const tours = useTours()
  const organizers = useOrganizers()
  return useMemo(() => buildTourDayMap(tours, organizers), [tours, organizers])
}
