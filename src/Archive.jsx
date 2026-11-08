import { useState } from 'react'
import { searchInvoices, deleteInvoice, countInvoices } from './storage.js'
import { formatMoney } from './calc.js'
import NewInvoice from './NewInvoice.jsx'
import ExportButtons from './ExportButtons.jsx'

export default function Archive() {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [msg, setMsg] = useState('')

  if (editing) {
    return (
      <NewInvoice
        key={editing.id}
        invoice={editing}
        onSaved={() => { setEditing(null); setMsg('اتحفظ التعديل.') }}
        onCancel={() => setEditing(null)}
      />
    )
  }

  const total = countInvoices()
  const list = searchInvoices(q)

  function remove(id) {
    setMsg(deleteInvoice(id) ? 'اتحذفت الفاتورة.' : 'معرفتش أحذف الفاتورة.')
    setConfirmId(null)
  }

  return (
    <section className="panel">
      <h2>الأرشيف</h2>
      <label className="field">
        <span>بحث بالرقم أو اسم العميل أو الصنف</span>
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setMsg('') }} placeholder="اكتب للبحث" />
      </label>
      <p className="count">{q.trim() ? `${list.length} نتيجة من ${total}` : `${total} فاتورة`}</p>
      {msg && <p className="msg" role="status">{msg}</p>}

      {total === 0 && <p>مفيش فواتير لسه. اعمل أول فاتورة من تبويب "فاتورة جديدة".</p>}
      {total > 0 && list.length === 0 && <p>مفيش نتيجة للبحث ده.</p>}

      <div className="inv-list">
        {list.map((inv) => (
          <article className="inv-card" key={inv.id}>
            <div className="inv-top">
              <b className="inv-num">#{inv.number}</b>
              <span className="inv-date">{inv.date}</span>
            </div>
            <div className="inv-client">{inv.client || 'من غير اسم عميل'}</div>
            <div className="inv-sum">
              <span>{(inv.items || []).length} صنف</span>
              <strong>{formatMoney(inv.total || 0)}</strong>
            </div>
            {confirmId === inv.id ? (
              <div className="confirm">
                <span>متأكد إنك عايز تحذف فاتورة {inv.number}؟</span>
                <div className="actions">
                  <button type="button" className="btn danger" onClick={() => remove(inv.id)}>أيوه، احذف</button>
                  <button type="button" className="btn ghost" onClick={() => setConfirmId(null)}>إلغاء</button>
                </div>
              </div>
            ) : (
              <div className="actions">
                <button type="button" className="btn" onClick={() => { setEditing(inv); setMsg('') }}>فتح وتعديل</button>
                <button type="button" className="btn ghost" onClick={() => setConfirmId(inv.id)}>حذف</button>
              </div>
            )}
            <ExportButtons invoice={inv} />
          </article>
        ))}
      </div>
    </section>
  )
}
