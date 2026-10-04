interface Props {
  title: string
  menuOpen: boolean
  onMenu: () => void
}

export default function Topbar({ title, menuOpen, onMenu }: Props) {
  return (
    <header className="adm-topbar">
      <button className="adm-menu-btn" onClick={onMenu} aria-label="باز و بسته کردن منو" aria-expanded={menuOpen} aria-controls="adm-sidebar">
        ☰
      </button>
      <h1>{title}</h1>
      <div className="adm-user">
        <span className="adm-avatar" aria-hidden="true">م</span>
        <span className="adm-user-name">کاربر مدیر</span>
      </div>
    </header>
  )
}
