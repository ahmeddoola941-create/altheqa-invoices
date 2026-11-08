import { useState } from 'react'
import { downloadInvoicePng, shareInvoicePng, canShareFiles } from './exportPng.js'

export default function ExportButtons({ invoice }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function run(fn, okMsg) {
    setBusy(true)
    setMsg('')
    try {
      const ok = await fn(invoice)
      setMsg(ok ? okMsg : 'معرفتش أعمل الصورة على الجهاز ده.')
    } catch {
      setMsg('حصلت مشكلة وأنا بعمل الصورة، جرّب تاني.')
    }
    setBusy(false)
  }

  return (
    <div className="export">
      <div className="actions">
        <button type="button" className="btn ghost" disabled={busy} onClick={() => run(downloadInvoicePng, 'اتحملت صورة الفاتورة.')}>
          {busy ? 'بجهّز الصورة...' : 'تحميل صورة PNG'}
        </button>
        {canShareFiles() && (
          <button type="button" className="btn ghost" disabled={busy} onClick={() => run(shareInvoicePng, '')}>
            مشاركة
          </button>
        )}
      </div>
      {msg && <p className="msg" role="status">{msg}</p>}
    </div>
  )
}
