import { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import UserTable from '../components/UserTable'
import { DEFAULT_USER_FILTERS, MOCK_USERS, USER_STATUSES, filterUsers, type UserFilters, type UserItem } from '../data/users'
import { faNum } from '../../lib/jalali'

export default function Users() {
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_USER_FILTERS)
  const [selected, setSelected] = useState<UserItem | null>(null)

  const visible = useMemo(() => filterUsers(MOCK_USERS, filters), [filters])
  const hasFilters = filters.query !== '' || filters.status !== 'همه'

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>کاربران</h2>
          <p className="adm-note">مشاهدهٔ کاربران مهمان و عضو تقویم</p>
        </div>
      </div>

      <div className="adm-filters two" role="search">
        <input type="search" value={filters.query} onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))} placeholder="جستجوی کاربر..." aria-label="جستجوی کاربر" />
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as UserFilters['status'] }))} aria-label="فیلتر وضعیت">
          <option value="همه">وضعیت: همه</option>
          {USER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <p className="adm-note" aria-live="polite">{faNum(visible.length)} کاربر از {faNum(MOCK_USERS.length)}</p>

      {visible.length > 0 ? (
        <UserTable users={visible} onDetails={setSelected} />
      ) : (
        <div className="adm-card adm-empty">
          <strong>کاربری پیدا نشد</strong>
          <p>جستجو یا فیلتر را تغییر دهید.</p>
          {hasFilters && <button className="adm-btn" onClick={() => setFilters(DEFAULT_USER_FILTERS)}>پاک‌کردن فیلترها</button>}
        </div>
      )}

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <p className="adm-note">جزئیات کاربر در مراحل بعد اضافه می‌شود.</p>
          <div className="adm-form-actions">
            <button className="adm-btn" onClick={() => setSelected(null)}>بستن</button>
          </div>
        </Modal>
      )}
    </>
  )
}
