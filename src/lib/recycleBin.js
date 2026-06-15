/**
 * recycleBin.js
 * ─────────────────────────────────────────────────────────────────
 * Recycle Bin — soft-delete system berbasis localStorage.
 * Mendukung dua jenis item: 'campus' dan 'major'.
 * 
 * Struktur item di recycle bin:
 * {
 *   id:          string  — ID asli item
 *   type:        'campus' | 'major'
 *   data:        object  — snapshot data lengkap saat dihapus
 *   deletedAt:   string  — ISO timestamp saat dihapus
 *   label:       string  — nama tampilan (name)
 *   meta:        string  — info tambahan (kota, kampus terkait, dsb)
 * }
 */

const BIN_KEY     = 'dc_recycle_bin'
const MAX_ITEMS   = 100          // batas maksimal item di bin
const EXPIRE_DAYS = 30           // item kedaluwarsa setelah 30 hari

// ─── Helpers ───────────────────────────────────────────────────────
function readBin() {
  try {
    const raw = localStorage.getItem(BIN_KEY)
    if (!raw) return []
    const items = JSON.parse(raw)
    // Buang item yang sudah kedaluwarsa
    const cutoff = Date.now() - EXPIRE_DAYS * 24 * 60 * 60 * 1000
    return items.filter(item => new Date(item.deletedAt).getTime() > cutoff)
  } catch {
    return []
  }
}

function writeBin(items) {
  try {
    // Batasi jumlah item (ambil yang terbaru)
    const limited = items.slice(-MAX_ITEMS)
    localStorage.setItem(BIN_KEY, JSON.stringify(limited))
    // Broadcast ke komponen lain yang mendengarkan
    window.dispatchEvent(new Event('dc-recycle-bin-changed'))
  } catch {
    // localStorage penuh — coba hapus item terlama
    try {
      const trimmed = items.slice(-Math.floor(MAX_ITEMS / 2))
      localStorage.setItem(BIN_KEY, JSON.stringify(trimmed))
      window.dispatchEvent(new Event('dc-recycle-bin-changed'))
    } catch { /* ignore */ }
  }
}

// ─── Public API ────────────────────────────────────────────────────

/** Ambil semua item di recycle bin */
export function getBinItems() {
  return readBin().reverse() // terbaru di atas
}

/** Ambil jumlah item di recycle bin */
export function getBinCount() {
  return readBin().length
}

/** Ambil item berdasarkan type */
export function getBinItemsByType(type) {
  return readBin()
    .filter(item => item.type === type)
    .reverse()
}

/**
 * Pindahkan item ke recycle bin (soft delete).
 * @param {'campus'|'major'} type
 * @param {object} data   — data lengkap item
 * @param {string} label  — nama tampilan
 * @param {string} meta   — info konteks (kota, kampus, dsb)
 */
export function moveToRecycleBin(type, data, label, meta = '') {
  const bin = readBin()
  // Cegah duplikat ID + type
  const existing = bin.findIndex(i => i.id === data.id && i.type === type)
  if (existing !== -1) bin.splice(existing, 1)

  bin.push({
    id:        data.id,
    type,
    data:      { ...data },
    deletedAt: new Date().toISOString(),
    label,
    meta,
  })
  writeBin(bin)
}

/**
 * Pindahkan banyak item ke recycle bin sekaligus (bulk soft delete).
 * @param {'campus'|'major'} type
 * @param {Array<{data, label, meta}>} items
 */
export function bulkMoveToRecycleBin(type, items) {
  const bin = readBin()
  const now = new Date().toISOString()

  for (const { data, label, meta } of items) {
    const existing = bin.findIndex(i => i.id === data.id && i.type === type)
    if (existing !== -1) bin.splice(existing, 1)
    bin.push({ id: data.id, type, data: { ...data }, deletedAt: now, label, meta: meta || '' })
  }
  writeBin(bin)
}

/**
 * Pulihkan item dari recycle bin.
 * Mengembalikan data lengkap item yang dipulihkan.
 * @param {string} id
 * @param {'campus'|'major'} type
 * @returns {object|null}
 */
export function restoreFromBin(id, type) {
  const bin = readBin()
  const idx = bin.findIndex(i => i.id === id && i.type === type)
  if (idx === -1) return null
  const [item] = bin.splice(idx, 1)
  writeBin(bin)
  return item.data
}

/**
 * Hapus permanen satu item dari recycle bin.
 */
export function permanentDeleteFromBin(id, type) {
  const bin = readBin().filter(i => !(i.id === id && i.type === type))
  writeBin(bin)
}

/**
 * Hapus permanen semua item dari recycle bin (kosongkan).
 */
export function emptyRecycleBin() {
  writeBin([])
}

/**
 * Hapus permanen semua item dengan type tertentu.
 */
export function emptyBinByType(type) {
  const bin = readBin().filter(i => i.type !== type)
  writeBin(bin)
}

/**
 * Format waktu relatif untuk tampilan "dihapus X hari lalu".
 */
export function formatDeletedAt(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins  < 1)  return 'Baru saja'
  if (mins  < 60) return `${mins} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days  < 30) return `${days} hari lalu`
  return `${Math.floor(days / 30)} bulan lalu`
}

/**
 * Hitung hari sampai item kedaluwarsa.
 */
export function daysUntilExpiry(isoString) {
  const deleted = new Date(isoString).getTime()
  const expiry  = deleted + EXPIRE_DAYS * 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86400000))
}

export const EXPIRE_DAYS_CONST = EXPIRE_DAYS
