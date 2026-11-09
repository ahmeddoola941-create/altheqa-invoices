import { useState, useEffect } from 'react'
import { downloadInvoicePng, shareInvoicePng, canShareFiles, invoiceToBlob } from './exportPng.js'

export default function ExportButtons({ invoice, autoShow = false }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [imgUrl, setImgUrl] = useState('')

  // نمسح رابط الصورة المؤقت لما يتغير أو الشاشة تتقفل
  useEffect(() => () => { if (imgUrl) URL.revokeObjectURL(imgUrl) }, [imgUrl])

  // بعد حفظ فاتورة جديدة: نعرض صورتها فورًا من غير ما يدوس حاجة
  useEffect(() => { if (autoShow) showImage() }, [])

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

  // بديل لو التحميل ممنوع: نعرض الصورة وتحفظها بالضغط المطوّل
  async function showImage() {
    setBusy(true)
    setMsg('')
    try {
      const blob = await invoiceToBlob(invoice)
      if (blob) setImgUrl(URL.createObjectURL(blob))
      else setMsg('معرفتش أعمل الصورة على الجهاز ده.')
    } catch {
      setMsg('حصلت مشكلة وأنا بعمل الصورة، جرّب تاني.')
    }
    setBusy(false)
  }

  return (
    <div className="export">
      <div className="actions">
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={() => run(downloadInvoicePng, 'بدأ تحميل الصورة. لو مظهرتش في التنزيلات، اضغط "عرض الصورة" واحفظها منها.')}
        >
          {busy ? 'بجهّز الصورة...' : 'تحميل صورة PNG'}
        </button>
        <button type="button" className="btn ghost" disabled={busy} onClick={showImage}>
          عرض الصورة
        </button>
        {canShareFiles() && (
          <button type="button" className="btn ghost" disabled={busy} onClick={() => run(shareInvoicePng, '')}>
            مشاركة
          </button>
        )}
      </div>
      {msg && <p className="msg" role="status">{msg}</p>}
      {imgUrl && (
        <div className="preview">
          <p className="msg">اضغط على الصورة واستمر لحد ما تظهر "حفظ الصورة"، أو خدها لقطة شاشة.</p>
          <img src={imgUrl} alt={`فاتورة ${invoice.number}`} />
          <button type="button" className="btn ghost" onClick={() => setImgUrl('')}>إغلاق الصورة</button>
        </div>
      )}
    </div>
  )
}
