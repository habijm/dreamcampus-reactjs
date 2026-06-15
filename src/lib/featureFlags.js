/**
 * featureFlags.js v2
 * ──────────────────────────────────────────────────────────────────
 * Perbaikan:
 * - Handle error "schema cache" dengan graceful fallback
 * - Retry sekali jika dapat schema cache error
 * - Fallback ke localStorage jika Supabase tidak tersedia
 * - Tidak lempar error ke UI — selalu return flags yang valid
 */

import { supabase } from './supabase'

const USE_SUPABASE = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url'
)

const FLAG_TABLE   = 'feature_flags'
const FLAG_ROW_ID  = 1
const BC_CHANNEL   = 'dc_feature_flags'
const LS_KEY       = 'dc_feature_flags_cache'  // localStorage fallback
const CACHE_TTL    = 15_000 // 15 detik

export const DEFAULT_FLAGS = {
  rekomendasi: true,
  bandingkan:  true,
  prediksi:    true,
}

// ─── In-memory cache ───────────────────────────────────────────────
let _cache     = null
let _cacheTime = 0

// ─── BroadcastChannel ─────────────────────────────────────────────
let _bc = null
function getBC() {
  if (!_bc && typeof BroadcastChannel !== 'undefined') {
    try { _bc = new BroadcastChannel(BC_CHANNEL) } catch { /* ignore */ }
  }
  return _bc
}

// ─── Error classifier ─────────────────────────────────────────────
function isSchemaCacheError(error) {
  if (!error) return false
  const msg = (error.message || error.hint || '').toLowerCase()
  return (
    msg.includes('schema cache') ||
    msg.includes('could not find') ||
    msg.includes('relation') ||
    error.code === 'PGRST204' ||
    error.code === '42P01'
  )
}

function isTableNotFoundError(error) {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  return msg.includes('does not exist') || error.code === '42P01'
}

// ─── localStorage helpers ──────────────────────────────────────────
function readLS() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const { flags, ts } = JSON.parse(raw)
    // Cache LS valid 5 menit
    if (Date.now() - ts < 300_000) return flags
    return null
  } catch { return null }
}

function writeLS(flags) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ flags, ts: Date.now() }))
  } catch { /* ignore */ }
}

// ─── Supabase fetch dengan retry ──────────────────────────────────
async function fetchFromSupabase() {
  // Percobaan pertama
  const { data, error } = await supabase
    .from(FLAG_TABLE)
    .select('flags')
    .eq('id', FLAG_ROW_ID)
    .single()

  if (!error && data?.flags) {
    return { flags: data.flags, error: null }
  }

  // Jika schema cache error → tunggu sebentar lalu retry
  if (isSchemaCacheError(error)) {
    console.warn('[featureFlags] Schema cache error, retrying in 1s...', error)
    await new Promise(r => setTimeout(r, 1000))

    const retry = await supabase
      .from(FLAG_TABLE)
      .select('flags')
      .eq('id', FLAG_ROW_ID)
      .single()

    if (!retry.error && retry.data?.flags) {
      return { flags: retry.data.flags, error: null }
    }
    return { flags: null, error: retry.error }
  }

  // Jika tabel tidak ada
  if (isTableNotFoundError(error)) {
    console.error(
      '[featureFlags] Tabel feature_flags tidak ditemukan!\n' +
      'Jalankan file fix_feature_flags.sql di Supabase SQL Editor.'
    )
    return { flags: null, error }
  }

  return { flags: null, error }
}

// ─── Supabase upsert dengan retry ─────────────────────────────────
async function upsertToSupabase(flags) {
  const payload = {
    id: FLAG_ROW_ID,
    flags,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from(FLAG_TABLE)
    .upsert(payload, { onConflict: 'id' })

  if (!error) return { error: null }

  // Schema cache error → reload schema lalu retry
  if (isSchemaCacheError(error)) {
    console.warn('[featureFlags] Schema cache error pada upsert, retrying...', error)
    await new Promise(r => setTimeout(r, 1500))

    const retry = await supabase
      .from(FLAG_TABLE)
      .upsert(payload, { onConflict: 'id' })

    return { error: retry.error }
  }

  // Tabel tidak ada → tunjukkan pesan jelas
  if (isTableNotFoundError(error)) {
    return {
      error: {
        ...error,
        message:
          'Tabel feature_flags belum dibuat di Supabase. ' +
          'Jalankan fix_feature_flags.sql di SQL Editor.',
      },
    }
  }

  return { error }
}

// ══════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════

/**
 * Baca feature flags.
 * Prioritas: memory cache → Supabase → localStorage → DEFAULT
 */
export async function getFeatureFlags() {
  // 1. Memory cache masih fresh
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
    return { ..._cache }
  }

  if (USE_SUPABASE) {
    const { flags, error } = await fetchFromSupabase()

    if (flags) {
      _cache     = { ...DEFAULT_FLAGS, ...flags }
      _cacheTime = Date.now()
      writeLS(_cache) // update localStorage sebagai backup
      return { ..._cache }
    }

    // Supabase gagal → coba localStorage
    console.warn('[featureFlags] Supabase gagal, fallback ke localStorage', error)
  }

  // 2. localStorage cache
  const lsFlags = readLS()
  if (lsFlags) {
    _cache     = { ...DEFAULT_FLAGS, ...lsFlags }
    _cacheTime = Date.now()
    return { ..._cache }
  }

  // 3. Window global (mode mock)
  if (typeof window !== 'undefined' && window.__DC_FLAGS__) {
    _cache     = { ...DEFAULT_FLAGS, ...window.__DC_FLAGS__ }
    _cacheTime = Date.now()
    return { ..._cache }
  }

  // 4. Absolute fallback
  return { ...DEFAULT_FLAGS }
}

/**
 * Simpan feature flags.
 * @returns {{ success: boolean, error?: string, warning?: string }}
 */
export async function setFeatureFlags(flags) {
  const merged = { ...DEFAULT_FLAGS, ...flags }

  // Update cache & localStorage segera (optimistic)
  _cache     = merged
  _cacheTime = Date.now()
  writeLS(merged)

  if (USE_SUPABASE) {
    const { error } = await upsertToSupabase(merged)

    if (error) {
      // Rollback cache jika gagal
      _cache     = null
      _cacheTime = 0
      return {
        success: false,
        error:   error.message || 'Gagal menyimpan ke Supabase',
      }
    }

    // Broadcast ke tab lain
    getBC()?.postMessage({ type: 'flags_updated', flags: merged })
    return { success: true }
  }

  // Mode mock — simpan ke window + broadcast
  if (typeof window !== 'undefined') {
    window.__DC_FLAGS__ = merged
  }
  getBC()?.postMessage({ type: 'flags_updated', flags: merged })

  return {
    success: true,
    warning:
      'Mode demo: flag tersimpan di browser ini saja. ' +
      'Hubungkan Supabase agar berlaku global.',
  }
}

/**
 * Subscribe perubahan real-time.
 * @param {(flags: object) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeFlags(callback) {
  if (USE_SUPABASE) {
    const channelName = `${BC_CHANNEL}_rt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: FLAG_TABLE },
        payload => {
          const newFlags = payload.new?.flags
          if (newFlags) {
            _cache     = { ...DEFAULT_FLAGS, ...newFlags }
            _cacheTime = Date.now()
            writeLS(_cache)
            callback({ ..._cache })
          }
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('[featureFlags] Realtime connected')
        }
      })

    return () => supabase.removeChannel(channel)
  }

  // Mock: BroadcastChannel
  const bc = getBC()
  if (!bc) return () => {}

  function handler(event) {
    if (event.data?.type === 'flags_updated' && event.data?.flags) {
      _cache     = { ...DEFAULT_FLAGS, ...event.data.flags }
      _cacheTime = Date.now()
      writeLS(_cache)
      if (typeof window !== 'undefined') window.__DC_FLAGS__ = _cache
      callback({ ..._cache })
    }
  }

  bc.addEventListener('message', handler)
  return () => bc.removeEventListener('message', handler)
}

/** Paksa re-fetch dari Supabase */
export function invalidateFlagsCache() {
  _cache     = null
  _cacheTime = 0
}

/** Apakah flag disimpan secara global di Supabase */
export function isFlagsGlobal() {
  return USE_SUPABASE
}