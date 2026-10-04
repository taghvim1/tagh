import type { UserItem } from '../data/users'

interface Props {
  users: UserItem[]
  onDetails: (user: UserItem) => void
}

const Badge = ({ status }: { status: UserItem['status'] }) => (
  <span className={`adm-badge ${status === 'عضو' ? 'on' : 'off'}`}>{status}</span>
)

function DetailsButton({ user, onDetails }: { user: UserItem; onDetails: Props['onDetails'] }) {
  return (
    <button className="adm-btn" onClick={() => onDetails(user)} aria-label={`مشاهده جزئیات ${user.name}`}>
      مشاهده جزئیات
    </button>
  )
}

// دسکتاپ/تبلت: جدول؛ موبایل: کارت (با CSS جابه‌جا می‌شود)
export default function UserTable({ users, onDetails }: Props) {
  return (
    <>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>نام</th><th>وضعیت</th><th>شهر</th><th>آخرین فعالیت</th><th>عملیات</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td><Badge status={u.status} /></td>
                <td>{u.city}</td>
                <td>{u.last_activity}</td>
                <td><DetailsButton user={u} onDetails={onDetails} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="adm-event-cards">
        {users.map((u) => (
          <li key={u.id} className="adm-card">
            <div className="adm-event-head">
              <strong>{u.name}</strong>
              <Badge status={u.status} />
            </div>
            <div className="adm-event-meta">
              <span>{u.city}</span>
              <span className="adm-note">{u.last_activity}</span>
            </div>
            <DetailsButton user={u} onDetails={onDetails} />
          </li>
        ))}
      </ul>
    </>
  )
}
