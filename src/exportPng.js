// رسم الفاتورة كصورة PNG بجودة عالية (من غير أي مكتبة خارجية)
import { formatMoney } from './calc.js'

const W = 800 // العرض المنطقي
const PAD = 40
const GOLD = '#c9a24b'
const GOLD_SOFT = '#e3c77f'
const BLACK = '#000000'
const SURFACE = '#121212'
const LINE = '#2a2418'
const TEXT = '#f3ecda'
const MUTED = '#a39a82'
const FONT = "Cairo, 'Segoe UI', Tahoma, sans-serif"
const f = (weight, size) => `${weight} ${size}px ${FONT}`

// أعمدة الجدول من اليمين لليسار (مجموعها 720)
const COLS = [
  { key: 'name', label: 'الصنف', w: 290 },
  { key: 'unit', label: 'الوحدة', w: 100 },
  { key: 'qty', label: 'العدد', w: 80 },
  { key: 'price', label: 'سعر الوحدة', w: 120 },
  { key: 'total', label: 'الإجمالي', w: 130 },
]

function splitLongWord(ctx, word, maxW) {
  const parts = []
  let cur = ''
  for (const ch of word) {
    if (cur && ctx.measureText(cur + ch).width > maxW) { parts.push(cur); cur = ch } else cur += ch
  }
  if (cur) parts.push(cur)
  return parts
}

function wrap(ctx, text, maxW, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let cur = ''
  for (const w0 of words) {
    const pieces = ctx.measureText(w0).width > maxW ? splitLongWord(ctx, w0, maxW) : [w0]
    for (const w of pieces) {
      const t = cur ? `${cur} ${w}` : w
      if (!cur || ctx.measureText(t).width <= maxW) cur = t
      else { lines.push(cur); cur = w }
    }
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] += '…' }
  return lines.length ? lines : ['']
}

function fit(ctx, text, maxW) {
  let t = String(text)
  if (ctx.measureText(t).width <= maxW) return t
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t + '…'
}

function chooseScale(h) {
  let s = 3
  while (s > 1.5 && (W * s * h * s > 14_000_000 || h * s > 16000)) s -= 0.25
  return s
}

function hexagon(ctx, cx, cy, r) {
  ctx.beginPath()
  for (let k = 0; k < 6; k++) {
    const a = ((-90 + 60 * k) * Math.PI) / 180
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
}

// makeCanvas(width, height) بترجع canvas (في المتصفح أو في الاختبار)
export function renderInvoice(inv, makeCanvas) {
  const items = inv.items || []

  // مرحلة القياس: نحسب أسطر كل صنف وارتفاع الصفوف
  const probe = makeCanvas(10, 10).getContext('2d')
  probe.font = f(600, 18)
  const nameW = COLS[0].w - 24
  const rows = items.map((it) => {
    const lines = wrap(probe, it.name || '', nameW, 3)
    return { it, lines, h: Math.max(52, lines.length * 26 + 18) }
  })

  const HEADER_H = 110
  const META_H = 66
  const TH_H = 44
  const TOTAL_H = 84
  const FOOT_H = 70
  const top = 40
  const H = top + HEADER_H + 14 + META_H + 18 + TH_H + rows.reduce((s, r) => s + r.h, 0) + 18 + TOTAL_H + FOOT_H

  const scale = chooseScale(H)
  const canvas = makeCanvas(Math.round(W * scale), Math.round(H * scale))
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)
  ctx.direction = 'rtl'
  ctx.textBaseline = 'middle'

  const R = W - PAD // الحافة اليمنى
  const L = PAD // الحافة الشمال

  // الخلفية والإطار
  ctx.fillStyle = BLACK
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.strokeRect(14, 14, W - 28, H - 28)

  // الهيدر: اللوجو واسم الشركة
  let y = top
  const logoR = 38
  const logoCx = R - logoR
  const logoCy = y + HEADER_H / 2 - 4
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 4
  hexagon(ctx, logoCx, logoCy, logoR)
  ctx.stroke()
  ctx.fillStyle = GOLD
  ctx.textAlign = 'center'
  ctx.font = f(900, 44)
  ctx.fillText('ث', logoCx, logoCy + 3)

  ctx.textAlign = 'right'
  ctx.font = f(900, 30)
  ctx.fillText('الثقة للتشطيبات والمقاولات', R - logoR * 2 - 16, logoCy - 14)
  ctx.fillStyle = MUTED
  ctx.font = f(600, 20)
  ctx.fillText('فاتورة', R - logoR * 2 - 16, logoCy + 22)

  ctx.strokeStyle = GOLD
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(L, y + HEADER_H)
  ctx.lineTo(R, y + HEADER_H)
  ctx.stroke()
  y += HEADER_H + 14

  // بيانات الفاتورة: رقم، تاريخ، عميل (من اليمين)
  const boxes = [
    { label: 'رقم الفاتورة', value: String(inv.number || ''), w: 150, color: GOLD_SOFT },
    { label: 'التاريخ', value: String(inv.date || ''), w: 170, color: GOLD_SOFT },
    { label: 'العميل', value: inv.client || '—', w: 380, color: TEXT },
  ]
  let bx = R
  for (const b of boxes) {
    ctx.fillStyle = SURFACE
    ctx.fillRect(bx - b.w, y, b.w, META_H)
    ctx.strokeStyle = LINE
    ctx.lineWidth = 1
    ctx.strokeRect(bx - b.w, y, b.w, META_H)
    ctx.textAlign = 'right'
    ctx.fillStyle = MUTED
    ctx.font = f(600, 14)
    ctx.fillText(b.label, bx - 12, y + 18)
    ctx.fillStyle = b.color
    ctx.font = f(700, 20)
    ctx.fillText(fit(ctx, b.value, b.w - 24), bx - 12, y + 43)
    bx -= b.w + 10
  }
  y += META_H + 18

  // رأس الجدول
  ctx.fillStyle = GOLD
  ctx.fillRect(L, y, R - L, TH_H)
  ctx.fillStyle = BLACK
  ctx.font = f(700, 17)
  let cx = R
  COLS.forEach((c, i) => {
    ctx.textAlign = i === 0 ? 'right' : 'center'
    ctx.fillText(c.label, i === 0 ? cx - 12 : cx - c.w / 2, y + TH_H / 2 + 1)
    cx -= c.w
  })
  y += TH_H

  // الصفوف
  rows.forEach((r, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? SURFACE : BLACK
    ctx.fillRect(L, y, R - L, r.h)
    ctx.strokeStyle = LINE
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(L, y + r.h)
    ctx.lineTo(R, y + r.h)
    ctx.stroke()

    let x = R
    COLS.forEach((c, i) => {
      ctx.fillStyle = c.key === 'total' ? GOLD_SOFT : TEXT
      ctx.font = f(c.key === 'total' ? 700 : 600, 18)
      if (c.key === 'name') {
        ctx.textAlign = 'right'
        const startY = y + r.h / 2 - ((r.lines.length - 1) * 26) / 2
        r.lines.forEach((ln, k) => ctx.fillText(ln, x - 12, startY + k * 26 + 1))
      } else {
        ctx.textAlign = 'center'
        let v = ''
        if (c.key === 'unit') v = r.it.unit || ''
        if (c.key === 'qty') v = formatMoney(r.it.qty || 0)
        if (c.key === 'price') v = formatMoney(r.it.price || 0)
        if (c.key === 'total') v = formatMoney(r.it.total ?? (r.it.qty || 0) * (r.it.price || 0))
        ctx.fillText(fit(ctx, v, c.w - 12), x - c.w / 2, y + r.h / 2 + 1)
      }
      x -= c.w
    })
    y += r.h
  })
  y += 18

  // الإجمالي
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.strokeRect(L, y, R - L, TOTAL_H)
  ctx.fillStyle = TEXT
  ctx.textAlign = 'right'
  ctx.font = f(700, 24)
  ctx.fillText('إجمالي
