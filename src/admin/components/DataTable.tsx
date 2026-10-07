import type { ReactNode } from 'react'

interface Column<T> { label: string; render: (row: T) => ReactNode }

// جدول در دسکتاپ و کارت در موبایل (بدون اسکرول افقی)
export default function DataTable<T>({ rows, columns, keyOf }: { rows: T[]; columns: Column<T>[]; keyOf: (row: T) => number }) {
  return (
    <>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={keyOf(r)}>{columns.map((c) => <td key={c.label}>{c.render(r)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <ul className="adm-event-cards">
        {rows.map((r) => (
          <li key={keyOf(r)} className="adm-card">
            {columns.map((c) => <div key={c.label} className="adm-kv"><span className="adm-note">{c.label}</span><div>{c.render(r)}</div></div>)}
          </li>
        ))}
      </ul>
    </>
  )
}
