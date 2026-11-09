// حفظ الفواتير على الجهاز (localStorage). مفيش إنترنت ولا Supabase.
const KEY = 'altheqa:v1'
export const SOFT_LIMIT = 100 // الحد المتوقع: حوالي 100 فاتورة

function emptyDb() {
  return { version: 1, counter: 0, invoices: [] }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyDb()
    const db = JSON.parse(raw)
    if (!db || !Array.isArray(db.invoices)) return emptyDb()
    return { ...emptyDb(), ...db }
  } catch {
    return emptyDb()
  }
}

function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
    return true
  } catch {
    return false // المساحة امتلت أو التخزين مقفول
  }
}

const pad = (n) => String(n).padStart(4, '0')

// تاريخ النهاردة بتوقيت الجهاز (مش UTC)، عشان بعد 12 بالليل ما يطلعش تاريخ امبارح
export function todayLocal() {
  const d = new Date()
  const p2 = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
}

// الرقم بيزيد دايمًا ومبيتكررش حتى لو مسحت فاتورة
export function peekNextNumber() {
  return pad(load().counter + 1)
}

export function listInvoices() {
  return load().invoices.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getInvoice(id) {
  return load().invoices.find((i) => i.id === id) || null
}

export function createInvoice(data) {
  const db = load()
  db.counter += 1
  const now = new Date().toISOString()
  const invoice = {
    ...data,
    id: `${Date.now()}-${db.counter}`,
    number: pad(db.counter),
    date: todayLocal(), // تاريخ تلقائي
    createdAt: now,
    updatedAt: now,
  }
  db.invoices.push(invoice)
  return save(db) ? invoice : null
}

export function updateInvoice(id, changes) {
  const db = load()
  const i = db.invoices.findIndex((x) => x.id === id)
  if (i < 0) return null
  // الرقم والتاريخ ما بيتغيروش في التعديل
  const { number, date, id: _id, createdAt, ...safe } = changes
  db.invoices[i] = { ...db.invoices[i], ...safe, updatedAt: new Date().toISOString() }
  return save(db) ? db.invoices[i] : null
}

export function deleteInvoice(id) {
  const db = load()
  const before = db.invoices.length
  db.invoices = db.invoices.filter((x) => x.id !== id)
  if (db.invoices.length === before) return false
  return save(db)
}

export function searchInvoices(q) {
  const s = (q || '').trim().toLowerCase()
  const all = listInvoices()
  if (!s) return all
  return all.filter((inv) =>
    [inv.number, inv.client, inv.phone, ...(inv.items || []).map((it) => it.name)]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(s))
  )
}

export function countInvoices() {
  return load().invoices.length
}

// ---- النسخة الاحتياطية ----
export function backupText() {
  return JSON.stringify(load(), null, 2)
}

export function restoreFromText(text) {
  let db
  try {
    db = JSON.parse(text)
  } catch {
    return { ok: false, error: 'الملف مش نسخة احتياطية صالحة.' }
  }
  if (!db || !Array.isArray(db.invoices) || typeof db.counter !== 'number') {
    return { ok: false, error: 'الملف مش نسخة احتياطية صالحة.' }
  }
  const maxNum = db.invoices.reduce((m, i) => Math.max(m, parseInt(i.number, 10) || 0), 0)
  db.counter = Math.max(db.counter, maxNum, load().counter) // مفيش رقم يتكرر حتى لو النسخة قديمة
  return save(db) ? { ok: true, count: db.invoices.length } : { ok: false, error: 'مفيش مساحة كفاية للحفظ.' }
}

// يطلب من المتصفح ما يمسحش البيانات لوحده
export async function requestPersist() {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist()
  } catch {}
  return false
}
