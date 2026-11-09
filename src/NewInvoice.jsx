import { useState } from 'react'
import { peekNextNumber, createInvoice, updateInvoice, todayLocal } from './storage.js'
import ExportButtons from './ExportButtons.jsx'
import { toNumber, lineTotal, invoiceTotal, formatMoney, isFilled } from './calc.js'

const MIN_ROWS = 5
const MAX_ROWS = 50
const UNITS = ['قطعة', 'متر', 'متر مربع', 'طقم', 'علبة', 'كيس', 'لفة', 'يوم', 'مقطوعية']

let nextId = 1
const newRow = () => ({ id: nextId++, name: '', unit: '', qty: '', price: '' })
const startRows = () => Array.from({ length: MIN_ROWS }, newRow)
const rowsFrom = (items) => {
  const rs = (items || []).map((it) => ({
    id: nextId++, name: it.name || '', unit: it.unit || '', qty: String(it.qty ?? ''), price: String(it.price ?? ''),
  }))
  while (rs.length < MIN_ROWS) rs.push(newRow())
  return rs
}

export default function NewInvoice({ invoice, onSaved, onCancel }) {
  const editing = Boolean(invoice)
  const [client, setClient] = useState(invoice?.client || '')
  const [rows, setRows] = useState(() => (invoice ? rowsFrom(invoice.items) : startRows()))
  const [number, setNumber] = useState(() => (invoice ? invoice.number : peekNextNumber()))
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [lastSaved, setLastSaved] = useState(null)

  const total = invoiceTotal(rows)

  function change(id, field, value) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
    setDone('')
    setLastSaved(null)
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
      if (String(r.price).trim() === '') return setError(`الصف ${n}: اكتب سعر الوحدة (اكتب 0 لو من غير سعر).`)
    }
    const items = filled.map(({ r }) => ({
      name: r.name.trim(),
      unit: r.unit.trim(),
      qty: toNumber(r.qty),
      price: toNumber(r.price),
      total: lineTotal(r),
    }))
    const data = { client: client.trim(), items, total: invoiceTotal(rows) }
    const saved = editing ? updateInvoice(invoice.id, data) : createInvoice(data)
    if (!saved) return setError('معرفتش أحفظ الفاتورة، المساحة على الجهاز يمكن امتلت.')
    if (editing) return onSaved?.(saved)
    setDone(`اتحفظت فاتورة رقم ${saved.number} بإجمالي ${formatMoney(saved.total)}`)
    setLastSaved(saved)
    setClient('')
    setRows(startRows())
    setNumber(peekNextNumber())
  }

  return (
    <section className="panel invoice">
      <h2>{editing ? `تعديل فاتورة ${number}` : 'فاتورة جديدة'}</h2>

      <div className="meta">
        <div className="meta-box">
          <span>رقم الفاتورة</span>
          <strong>{number}</strong>
        </div>
        <div className="meta-box">
          <span>التاريخ</span>
          <strong>{editing ? invoice.date : todayLocal()}</strong>
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
      {done && lastSaved && <ExportButtons key={lastSaved.id} invoice={lastSaved} autoShow />}

      <div className="actions">
        <button type="button" className="btn" onClick={save}>{editing ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</button>
        {editing && <button type="button" className="btn ghost" onClick={onCancel}>إلغاء</button>}
      </div>
    </section>
  )
}
