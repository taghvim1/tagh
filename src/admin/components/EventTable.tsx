import type { EventItem } from '../data/events'

interface Props {
  events: EventItem[]
  onEdit: (event: EventItem) => void
  onDelete: (event: EventItem) => void
}

const Badge = ({ status }: { status: EventItem['status'] }) => (
  <span className={`adm-badge ${status === 'فعال' ? 'on' : 'off'}`}>{status}</span>
)

function Actions({ event, onEdit, onDelete }: { event: EventItem } & Pick<Props, 'onEdit' | 'onDelete'>) {
  return (
    <div className="adm-row-actions">
      <button className="adm-btn" onClick={() => onEdit(event)} aria-label={`ویرایش ${event.title}`}>ویرایش</button>
      <button className="adm-btn danger" onClick={() => onDelete(event)} aria-label={`حذف ${event.title}`}>حذف</button>
    </div>
  )
}

// دسکتاپ/تبلت: جدول؛ موبایل: کارت (با CSS جابه‌جا می‌شود)
export default function EventTable({ events, onEdit, onDelete }: Props) {
  return (
    <>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>عنوان</th><th>تاریخ</th><th>نوع</th><th>وضعیت</th><th>عملیات</th></tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td><strong>{e.title}</strong><span className="adm-note adm-desc">{e.description}</span></td>
                <td>{e.date}<span className="adm-note adm-desc">{e.calendar_date}</span></td>
                <td><span className="adm-badge">{e.type}</span></td>
                <td><Badge status={e.status} /></td>
                <td><Actions event={e} onEdit={onEdit} onDelete={onDelete} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="adm-event-cards">
        {events.map((e) => (
          <li key={e.id} className="adm-card">
            <div className="adm-event-head">
              <strong>{e.title}</strong>
              <Badge status={e.status} />
            </div>
            <p className="adm-note">{e.description}</p>
            <div className="adm-event-meta">
              <span>{e.date} <span className="adm-note">({e.calendar_date})</span></span>
              <span className="adm-badge">{e.type}</span>
            </div>
            <Actions event={e} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </>
  )
}
