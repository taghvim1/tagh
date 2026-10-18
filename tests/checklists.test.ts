import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TRIP_TYPES } from '../src/checklist/templates'
import { allTypes, categoriesOf, findType, progressOf, sanitize, toggled, withItem, withType, withoutChecks, withoutItem, withoutType, type ChecklistState } from '../src/lib/checklists'

const S0: ChecklistState = { custom: [], checked: {}, extra: {} }
const adv = TRIP_TYPES.find((t) => t.id === 'adventure')!

test('قالب‌ها: شناسهٔ یکتا، هر نوع دسته‌های مشترک و مخصوص دارد', () => {
  assert.ok(TRIP_TYPES.length >= 8)
  assert.equal(new Set(TRIP_TYPES.map((t) => t.id)).size, TRIP_TYPES.length)
  for (const t of TRIP_TYPES) {
    const ids = t.categories.flatMap((c) => c.items.map((i) => `${t.id}:${i.id}`)); assert.equal(new Set(ids).size, ids.length, t.id)
    assert.ok(t.categories.some((c) => c.id === 'docs'), t.id); assert.ok(t.categories.length >= 4, t.id)
    assert.ok(t.categories.every((c) => c.items.length > 0))
  }
})
test('تیک‌زدن و برداشتن؛ شمارش پیشرفت', () => {
  const id = adv.categories[0].items[0].id
  let s = toggled(S0, 'adventure', id)
  assert.equal(progressOf(s, adv).done, 1)
  s = toggled(s, 'adventure', id); assert.equal(progressOf(s, adv).done, 0)
  s = toggled(toggled(s, 'adventure', id), 'adventure', adv.categories[1].items[0].id)
  assert.equal(progressOf(withoutChecks(s, 'adventure'), adv).done, 0)
  assert.ok(progressOf(S0, adv).total > 15)
})
test('افزودن آیتم به دستهٔ موجود، دستهٔ تازه و دستهٔ هم‌نام؛ متن خالی نادیده', () => {
  let s = withItem(S0, adv, '  چای   کیسه‌ای ', { catId: 'food' })
  const food = categoriesOf(s, adv).find((c) => c.id === 'food')!
  assert.equal(food.items.at(-1)!.text, 'چای کیسه‌ای'); assert.ok(food.items.at(-1)!.mine)
  s = withItem(s, adv, 'عکس', { newTitle: 'سرگرمی' })
  const cats = categoriesOf(s, adv); assert.equal(cats.at(-1)!.title, 'سرگرمی'); assert.equal(cats.length, adv.categories.length + 1)
  s = withItem(s, adv, 'کارت بازی', { newTitle: 'سرگرمی' }); assert.equal(categoriesOf(s, adv).at(-1)!.items.length, 2) // دستهٔ هم‌نام ساخته نمی‌شود
  assert.equal(withItem(s, adv, '   ', { catId: 'food' }), s)
  assert.equal(withItem(s, adv, 'x', { catId: 'نبود' }), s)
})
test('حذف آیتم افزوده تیکش را هم پاک می‌کند و دستهٔ خالیِ افزوده می‌رود', () => {
  let s = withItem(S0, adv, 'عکس', { newTitle: 'سرگرمی' })
  const item = categoriesOf(s, adv).at(-1)!.items[0]
  s = toggled(s, 'adventure', item.id); s = withoutItem(s, 'adventure', item.id)
  assert.equal(categoriesOf(s, adv).length, adv.categories.length); assert.equal(s.checked.adventure[item.id], undefined)
})
test('نوع سفر شخصی: خالی، یا کپی از قالب؛ حذف همه‌چیز را پاک می‌کند', () => {
  const a = withType(S0, '  دوچرخه‌سواری ', 140)
  const t = findType(a.state, a.id)!; assert.equal(t.title, 'دوچرخه‌سواری'); assert.ok(t.custom); assert.equal(progressOf(a.state, t).total, 0)
  let s = withItem(a.state, t, 'کلاه ایمنی', { newTitle: 'ایمنی' }); assert.equal(progressOf(s, t).total, 1)
  const b = withType(s, 'کپی', 10, 'camping'); const t2 = findType(b.state, b.id)!
  assert.equal(progressOf(b.state, t2).total, progressOf(S0, TRIP_TYPES.find((x) => x.id === 'camping')!).total)
  assert.equal(allTypes(b.state).length, TRIP_TYPES.length + 2)
  const gone = withoutType(b.state, a.id); assert.equal(findType(gone, a.id), undefined); assert.equal(gone.extra[a.id], undefined)
})
test('داده‌ی ذخیره‌شدهٔ خراب یا ناقص امن خوانده می‌شود', () => {
  assert.deepEqual(sanitize(null), S0); assert.deepEqual(sanitize('x'), S0)
  const r = sanitize({ custom: [{ id: 'c1', title: ' سفر ', hue: 'x' }, { title: 'بی‌شناسه' }, 5], checked: { adventure: { a: 1, b: 0 }, bad: 7 }, extra: { c1: [{ id: 'x1', title: 'د', items: [{ id: 'u1', text: 'الف' }, { id: '', text: 'ب' }] }, { id: '', title: 'x', items: [] }] } })
  assert.equal(r.custom.length, 1); assert.equal(r.custom[0].title, 'سفر'); assert.equal(r.custom[0].hue, 200)
  assert.deepEqual(Object.keys(r.checked.adventure).sort(), ['a', 'b']); assert.equal(r.checked.bad, undefined)
  assert.equal(r.extra.c1.length, 1); assert.equal(r.extra.c1[0].items.length, 1)
})
