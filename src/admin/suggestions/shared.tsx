import { useCallback, useEffect, useState } from 'react'
import { api, friendly, getToken, setToken } from './api'

/** بارگذاری با وضعیت loading/خطا و تلاش مجدد؛ هرگز لودینگ بی‌پایان نمی‌ماند (timeout در api) */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: string; loading: boolean }>({ data: null, error: '', loading: true })
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    loader().then((data) => setState({ data, error: '', loading: false }), (e) => setState((s) => ({ ...s, error: friendly(e), loading: false })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(run, [run])
  return { ...state, reload: run }
}

export const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return iso } }

export function ErrorBox({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return <div className="adm-card adm-callout err" role="alert"><strong>خطا</strong><p className="adm-note">{error}</p>{onRetry && <button type="button" className="adm-btn" onClick={onRetry}>تلاش مجدد</button>}</div>
}

/** نوار هشدار حالت آزمایشی/غیرفعال + ورود توکن (در صورت فعال‌بودن ADMIN_TOKEN) */
export function ModeBanner() {
  const { data } = useLoad(() => api<{ mode: 'token' | 'open_test' | 'disabled'; note: string }>('/admin/mode'), [])
  const [tok, setTok] = useState(getToken())
  if (!data || data.mode === 'open_test') return data ? <div className="adm-card adm-callout warn" role="note"><strong>حالت آزمایشی</strong><p className="adm-note">{data.note}</p></div> : null
  return (
    <div className={`adm-card adm-callout ${data.mode === 'disabled' ? 'err' : 'warn'}`}>
      <strong>{data.mode === 'disabled' ? 'API مدیر غیرفعال است' : 'توکن مدیر'}</strong><p className="adm-note">{data.note}</p>
      {data.mode === 'token' && <form className="adm-form-actions" onSubmit={(e) => { e.preventDefault(); setToken(tok); location.reload() }}>
        <input type="password" dir="ltr" aria-label="توکن مدیر" value={tok} onChange={(e) => setTok(e.target.value)} autoComplete="off" /><button className="adm-btn primary">ذخیره</button></form>}
    </div>
  )
}
