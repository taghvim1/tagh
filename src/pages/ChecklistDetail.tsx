import { useEffect, useMemo, useState } from 'react'
import AppChrome from '../components/AppChrome'
import CenterModal from '../components/CenterModal'
import TripIcon from '../checklist/TripIcon'
import type { TripType } from '../checklist/templates'
import { addItem, categoriesOf, deleteType, findType, progressOf, removeItem, resetChecks, toggleItem, useChecklists } from '../lib/checklists'
import { faNum } from '../lib/jalali'
import { goBack } from '../lib/router'
import { useOverlay } from '../lib/overlay'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

const NEW = '__new'

function AddForm({ type, onDone, defaultCat }: { type: TripType; onDone: () => void; defaultCat?: string }) {
  const s = useChecklists()
  const cats = categoriesOf(s, type)
  const [text, setText] = useState(''), [cat, setCat] = useState(defaultCat && cats.some((c) => c.id === defaultCat) ? defaultCat : cats[0]?.id ?? NEW), [title, setTitle] = useState('')
  const newCat = cat === NEW
  const ok = text.trim() !== '' && (!newCat || title.trim() !== '')
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!ok) return; addItem(type, text, newCat ? { newTitle: title } : { catId: cat }); onDone() }
  return (
    <form className="ck-form" onSubmit={submit}>
      <h2>افزودن به چک‌لیست</h2>
      <label className="ck-field"><span>چه چیزی؟</span><input className="tp-input" value={text} maxLength={200} onChange={(e) => setText(e.target.value)} placeholder="مثلاً چای کیسه‌ای" autoFocus /></label>
      <label className="ck-field"><span>در کدام دسته؟</span>
        <select className="tp-input" value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          <option value={NEW}>＋ دستهٔ تازه…</option>
        </select>
      </label>
      {newCat && <label className="ck-field"><span>نام دستهٔ تازه</span><input className="tp-input" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً خوراکی" /></label>}
      <div className="nt-actions"><button type="button" className="tp-btn" onClick={onDone}>انصراف</button><button type="submit" className="tp-btn primary" disabled={!ok}>افزودن</button></div>
    </form>
  )
}

// چک‌لیست یک نوع سفر: دسته‌های بازشونده + تیک + دکمهٔ افزودن
export default function ChecklistDetail({ id }: { id: string }) {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const s = useChecklists()
  const type = findType(s, id)
  const cats = useMemo(() => (type ? categoriesOf(s, type) : []), [s, type])
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [openInit, setOpenInit] = useState(false)
  useEffect(() => { if (!openInit && cats.length) { setOpen({ [cats[0].id]: true }); setOpenInit(true) } }, [cats, openInit])
  const add = useOverlay('ck-add')
  const [target, setTarget] = useState<string | undefined>()
  const [ask, setAsk] = useState<null | 'reset' | 'delete'>(null)

  if (!type) {
    return (
      <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
        <AppChrome title="تقویم سفر" backFallback="/checklist" />
        <main className="tp-main"><div className="tp-placeholder"><strong>این چک‌لیست پیدا نشد</strong><button type="button" className="tp-btn" onClick={() => goBack('/checklist')}>بازگشت</button></div></main>
      </div>
    )
  }
  const p = progressOf(s, type)
  const done = s.checked[type.id] ?? {}
  return (
    <div className="tp-page ck-page" data-theme={dark ? 'dark' : 'light'} style={{ '--h': type.hue } as React.CSSProperties}>
      <AppChrome title="تقویم سفر" backFallback="/checklist" />
      <main className="tp-main">
        <header className="ck-head">
          <span className="ck-ico"><TripIcon name={type.icon} /></span>
          <div className="ck-head-text">
            <h1>{type.title}</h1>
            <p className="ck-meta" aria-live="polite">{p.total ? `${faNum(p.done)} از ${faNum(p.total)} آماده` : 'هنوز موردی نیست؛ با دکمهٔ + اضافه کن'}</p>
          </div>
        </header>
        {p.total > 0 && <div className="ck-progress" role="progressbar" aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.done} aria-label="پیشرفت"><i style={{ width: `${(p.done / p.total) * 100}%` }} /></div>}

        <div className="ck-cats">
          {cats.map((c) => {
            const n = c.items.filter((i) => done[i.id]).length, isOpen = !!open[c.id]
            return (
              <section key={c.id} className={`ck-cat${isOpen ? ' open' : ''}`}>
                <button type="button" className="ck-cat-head" aria-expanded={isOpen} aria-controls={`ck-${c.id}`} onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}>
                  <span className="ck-cat-title">{c.title}</span>
                  <span className={`ck-count${n === c.items.length ? ' all' : ''}`}>{faNum(n)}/{faNum(c.items.length)}</span>
                  <svg className="ck-chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {isOpen && (
                  <ul className="ck-items" id={`ck-${c.id}`}>
                    {c.items.map((i) => (
                      <li key={i.id} className={`ck-item${done[i.id] ? ' done' : ''}`}>
                        <label>
                          <input type="checkbox" checked={!!done[i.id]} onChange={() => toggleItem(type.id, i.id)} />
                          <span className="ck-box" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                          <span className="ck-text">{i.text}</span>
                        </label>
                        {i.mine && <button type="button" className="ck-del" aria-label={`حذف «${i.text}»`} onClick={() => removeItem(type.id, i.id)}>×</button>}
                      </li>
                    ))}
                    <li className="ck-more"><button type="button" onClick={() => { setTarget(c.id); add.show() }}>＋ افزودن به «{c.title}»</button></li>
                  </ul>
                )}
              </section>
            )
          })}
        </div>

        <div className="ck-tools">
          {ask ? (
            <div className="nt-confirm" role="alertdialog" aria-label="تأیید">
              <p className="nt-confirm-q">{ask === 'reset' ? 'همهٔ تیک‌ها برداشته شود؟' : 'این نوع سفر با همهٔ موارد پاک شود؟'}</p>
              <div className="nt-actions">
                <button type="button" className="tp-btn danger" onClick={() => { if (ask === 'reset') resetChecks(type.id); else { deleteType(type.id); goBack('/checklist') } setAsk(null) }}>بله</button>
                <button type="button" className="tp-btn" autoFocus onClick={() => setAsk(null)}>خیر</button>
              </div>
            </div>
          ) : (
            <div className="nt-actions">
              {p.done > 0 && <button type="button" className="tp-btn" onClick={() => setAsk('reset')}>برداشتن همهٔ تیک‌ها</button>}
              {type.custom && <button type="button" className="tp-btn" onClick={() => setAsk('delete')}>حذف این نوع سفر</button>}
            </div>
          )}
        </div>
      </main>

      <button type="button" className="ck-fab" aria-label="افزودن آیتم به چک‌لیست" aria-haspopup="dialog" onClick={() => { setTarget(undefined); add.show() }}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <CenterModal open={add.open} onClose={add.hide} label="افزودن آیتم" className="cm-sm"><AddForm type={type} onDone={add.hide} defaultCat={target} /></CenterModal>
    </div>
  )
}
