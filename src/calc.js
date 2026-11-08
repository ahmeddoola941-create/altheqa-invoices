// حسابات الفاتورة

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'

// يقبل أرقام عربي أو إنجليزي، وفاصلة أو نقطة
export function toNumber(v) {
  if (v === null || v === undefined) return 0
  const raw = String(v).trim()
  if (raw.startsWith('-') || raw.startsWith('−')) return 0 // السالب مرفوض
  const s = raw
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[٫,،]/g, '.')
    .replace(/[^\d.]/g, '')
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : 0
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export function lineTotal(item) {
  return round2(toNumber(item.qty) * toNumber(item.price))
}

export function invoiceTotal(items) {
  return round2(items.reduce((sum, it) => sum + lineTotal(it), 0))
}

export function formatMoney(n) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// الصف اتكتب فيه أي حاجة؟
export function isFilled(item) {
  return [item.name, item.unit, item.qty, item.price].some((v) => String(v ?? '').trim() !== '')
}
