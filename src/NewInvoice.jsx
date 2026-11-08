import { useState } from 'react'
import { peekNextNumber, createInvoice, todayLocal } from './storage.js'
import { toNumber, lineTotal, invoiceTotal, formatMoney, isFilled } from './calc.js'

const MIN_ROWS = 5
const MAX_ROWS = 50
const UNITS = ['قطعة', 'متر', 'متر مربع', 'طقم', 'علبة', 'كيس', 'لفة', 'يوم', 'مقطوعية']

let nextId = 1
const newRow = () => ({ id: nextId++, name: '', unit: '', qty: '', price: '' })
const startRows = () => Array.from({ length: MIN_ROWS }, newRow)

export default function NewInvoice() {
  const [client, setClient] = useState('')
  const [rows, setRows] = useState(startRows)
  const [number, setNumber] = useState(peekNextNumber)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const total = invoiceTotal(rows)

  function change(id, field, value) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
    setDone('')
  }

  function addRow() {
    if (rows.length < MAX_ROWS) setRows((rs) => [...rs, newRow()])
  }

  function removeRow(id) {
    if (rows.length > MIN_ROWS) setRows((rs) => rs.filter((r) => r.id !== id))
  }

  function save() {
    setError('')
    const filled = rows.map((r, i) => ({ r, n: i + 1 })).filter(({ r }) => isFilled(r))
    if (filled.length === 0) return setError('اكتب صنف واحد على الأقل.')
    for (const { r, n } of filled) {
      if (!r.name.trim()) return setError(`الصف ${n}: اكتب اسم الصنف.`)
      if (toNumber(r.qty) <= 0) return setError(`الصف ${n}: اكتب العدد.`)
    }
    const items = filled.map(({ r }) => ({
      name: r.name.trim(),
      unit: r.unit.trim(),
      qty: toNumber(r.qty),
      price: toNumber(r.price),
      total: lineTotal(r),
    }))
    const saved = createInvoice({ client: client.trim(), items, total: invoiceTotal(rows) })
    if (!saved) return setError('معرفتش أحفظ الفاتورة، المساحة على الجهاز يمكن امتلت.')
    setDone(`اتحفظت فاتورة رقم ${saved.number} بإجمالي ${formatMoney(saved.total)}`)
    setClient('')
    setRows(startRows())
    setNumber(peekNextNumber())
  }

  return (
    <section className="panel invoice">
      <h2>فاتورة جديدة</h2>

      <div className="meta">
        <div className="meta-box">
          <span>رقم الفاتورة</span>
          <strong>{number}</strong>
        </div>
        <div className="meta-box">
          <span>التاريخ</span>
          <strong>{todayLocal()}</strong>
        </div>
      </div>

      <label className="field">
        <span>اسم العميل</span>
        <input value={client} onChange={(e) => { setClient(e.target.value); setDone('') }} placeholder="اختياري" />
      </label>

      <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>

      <div className="rows">
        {rows.map((r, i) => (
          <div className="row" key={r.id}>
            <div className="row-head">
              <b>صنف {i + 1}</b>
              {rows.length > MIN_ROWS && (
                <button type="button" className="link-btn" onClick={() => removeRow(r.id)}>حذف الصف</button>
              )}
            </div>
            <label className="field f-name">
              <span>الصنف</span>
              <input value={r.name} onChange={(e) => change(r.id, 'name', e.target.value)} />
            </label>
            <label className="field f-unit">
              <span>الوحدة</span>
              <input list="units" value={r.unit} onChange={(e) => change(r.id, 'unit', e.target.value)} />
            </label>
            <label className="field f-qty">
              <span>العدد</span>
              <input inputMode="decimal" value={r.qty} onChange={(e) => change(r.id, 'qty', e.target.value)} />
            </label>
            <label className="field f-price">
              <span>سعر الوحدة</span>
              <input inputMode="decimal" value={r.price} onChange={(e) => change(r.id, 'price', e.target.value)} />
            </label>
            <div className="field f-total">
              <span>الإجمالي</span>
              <output>{formatMoney(lineTotal(r))}</output>
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button type="button" className="btn ghost" onClick={addRow} disabled={rows.length >= MAX_ROWS}>
          إضافة صف ({rows.length} من {MAX_ROWS})
        </button>
      </div>

      <div className="grand">
        <span>إجمالي الفاتورة</span>
        <strong>{formatMoney(total)}</strong>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {done && <p className="msg" role="status">{done}</p>}

      <div className="actions">
        <button type="button" className="btn" onClick={save}>حفظ الفاتورة</button>
      </div>
    </section>
  )
}
