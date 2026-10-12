import { expect, it } from 'vitest'
import { BUDGETS, COMPANIONS, DURATIONS, LEVEL_LABEL, RATING_LABEL, TRAVEL_TYPES } from '../../src/data/destinations'
import * as S from '../src/domain/schema'

it('فهرست‌های مجاز سرور با کلاینت یکی است', () => {
  expect([...S.TRAVEL_TYPES]).toEqual([...TRAVEL_TYPES]); expect([...S.COMPANIONS]).toEqual([...COMPANIONS])
  expect([...S.DURATIONS]).toEqual([...DURATIONS]); expect([...S.BUDGETS]).toEqual([...BUDGETS])
  expect([...S.RATINGS].sort()).toEqual(Object.keys(RATING_LABEL).sort()); expect([...S.LEVELS].sort()).toEqual(Object.keys(LEVEL_LABEL).sort())
})
