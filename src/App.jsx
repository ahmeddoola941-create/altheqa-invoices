import { useState, useEffect } from 'react'
import NewInvoice from './NewInvoice.jsx'
import { countInvoices, backupText, restoreFromText, requestPersist, SOFT_LIMIT } from './storage.js'

const TABS = [
  { id: 'new', label: 'فاتورة جديدة', hint: '' },
  { id: 'archive', label: 'الأرشيف', hint: 'المرحلة 4' },
  { id: 'settings', label: 'الإعدادات', hint: 'المرحلة 6' },
]

function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <polygon points="50,6 87,28 87,72 50,94 13,72 13,28" fill="none" stroke="var(--gold)" strokeWidth="5" />
      <text x="50" y="67" textAnchor="middle" fontSize="46" fontWeight="900" fill="var(--gold)">ث</text>
    </svg>
  )
}

function Settings() {
  const [count, setCount] = useState(countInvoices())
  const [msg, setMsg] = useState('')

  function download() {
    const blob = new Blob([backupText()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `نسخة-الثقة-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('اتحملت النسخة الاحتياطية.')
  }

  async function restore(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const r = restoreFromText(await file.text())
    setMsg(r.ok ? `اتسترجع ${r.count} فاتورة.` : r.error)
    setCount(countInvoices())
    e.target.value = ''
  }

  return (
    <section className="panel">
      <h2>الإعدادات</h2>
      <p>الفواتير المحفوظة على الجهاز: {count} من حوالي {SOFT_LIMIT}</p>
      <div className="actions">
        <button className="btn" onClick={download}>تحميل نسخة احتياطية</button>
        <label className="btn ghost">
          استرجاع نسخة
          <input type="file" accept="application/json,.json" onChange={restore} hidden />
        </label>
      </div>
      {msg && <p className="msg" role="status">{msg}</p>}
      <p className="note">الفواتير بتتحفظ على الجهاز ده بس. لو مسحت بيانات المتصفح هتضيع، فخد نسخة احتياطية كل فترة.</p>
    </section>
  )
}

export default function App() {
  useEffect(() => { requestPersist() }, [])
  const [tab, setTab] = useState('new')
  const current = TABS.find((t) => t.id === tab)

  return (
    <div className="app">
      <header className="topbar">
        <Logo />
        <div>
          <h1>الثقة للتشطيبات والمقاولات</h1>
          <p>نظام الفواتير</p>
        </div>
      </header>

      <nav className="nav" aria-label="التنقل">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'settings' ? (
          <Settings />
        ) : tab === 'new' ? (
          <NewInvoice />
        ) : (
          <section className="panel">
            <h2>{current.label}</h2>
            <p>الشاشة دي لسه فاضية، هتتبني في {current.hint}.</p>
          </section>
        )}
      </main>
    </div>
  )
}
