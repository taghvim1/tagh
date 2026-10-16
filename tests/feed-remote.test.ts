import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sanitizeFeed } from '../src/feed/remote'

const good = { id: 1, kind: 'dyk', title: 'ت', body: 'متن', image: { url: 'https://a.test/x.jpg', attribution: 'ا', license: 'CC', source_url: null, author: null }, facts: [], sources: [{ title: 'م', url: 'https://s.test' }, { title: 'بد', url: 'javascript:alert(1)' }], published_date: '2026-10-16' }

test('sanitizeFeed: فقط شکل معتبر پذیرفته می‌شود', () => {
  const r = sanitizeFeed({ date: '2026-10-16', items: { dyk: good, mood: { ...good, kind: 'mood', image: { url: 'http://insecure.test/x.jpg' } }, nope: good, week: { ...good, title: '' } } })
  assert.deepEqual(Object.keys(r.items), ['dyk'])
  assert.equal(r.items.dyk?.sources.length, 1) // آدرس javascript: حذف می‌شود
})
test('sanitizeFeed: ورودی خراب خالی می‌دهد', () => {
  assert.deepEqual(sanitizeFeed(null).items, {}); assert.deepEqual(sanitizeFeed('x').items, {})
})
