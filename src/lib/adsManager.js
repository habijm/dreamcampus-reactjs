/**
 * adsManager.js
 * ─────────────────────────────────────────────────────────────────
 * Manajemen Iklan & Notifikasi secara global — mirip featureFlags.js
 *
 * Prioritas penyimpanan:
 *   Supabase (global, real-time) → localStorage (cache/fallback) → DEFAULT
 *
 * Mode mock (tanpa Supabase):
 *   localStorage + BroadcastChannel (berlaku antar tab browser yang sama)
 *
 * Tabel Supabase yang dibutuhkan:
 *   ads_config  { id: 1, ads: jsonb, notifications: jsonb, updated_at: timestamptz }
 */

import { supabase } from './supabase'

const USE_SUPABASE = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url'
)

const TABLE        = 'ads_config'
const ROW_ID       = 1
const BC_CHANNEL   = 'dc_ads_config'
const LS_ADS_KEY   = 'dc_ads_v4'
const LS_NOTIF_KEY = 'dc_notifications_v4'
const CACHE_TTL    = 15_000 // 15 detik

// ─── Default data ──────────────────────────────────────────────────
export const DEFAULT_ADS = [
  {
    id: 'ad-1',
    title: 'Tryout SNBT Online Gratis',
    description: 'Latihan soal UTBK lengkap dengan pembahasan. Persiapkan dirimu!',
    url: 'https://example.com',
    cta: 'Daftar Sekarang',
    type: 'banner',
    position: 'all',
    active: true,
    color: 'blue',
  },
  {
    id: 'ad-2',
    title: 'Beasiswa S1 Penuh 2025',
    description: 'Program beasiswa IT senilai Rp 50 juta/tahun. Daftar sekarang!',
    url: 'https://example.com',
    cta: 'Pelajari',
    type: 'card',
    position: 'all',
    active: true,
    color: 'emerald',
  },
  {
    id: 'ad-3',
    title: 'Kursus Pemrograman Python',
    description: 'Belajar coding dari nol dengan mentor berpengalaman.',
    url: 'https://example.com',
    cta: 'Mulai Belajar',
    type: 'inline',
    position: 'all',
    active: true,
    color: 'purple',
  },
]

export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: '📅 Pendaftaran SNBT 2025 Dibuka',
    message:
      'Pendaftaran SNBT gelombang 1 dibuka mulai 1 Maret – 15 Maret 2025. Persiapkan dokumenmu!',
    type: 'info',
    position: 'all',
    active: true,
    dismissable: true,
    link: '',
    linkText: '',
  },
  {
    id: 'notif-2',
    title: '🎉 Database Kampus Diperbarui',
    message: 'Kami baru menambahkan 3 kampus baru dengan program IT terkini.',
    type: 'success',
    position: 'kampus',
    active: true,
    dismissable: true,
    link: '/kampus',
    linkText: 'Lihat Kampus Baru',
  },
  {
    id: 'notif-3',
    title: '⚠️ Perhatian: Data Prediksi',
    message:
      'Data prediksi peluang bersifat estimasi. Selalu cek pengumuman resmi kampus.',
    type: 'warning',
    position: 'prediksi',
    active: true,
    dismissable: false,
    link: '',
    linkText: '',
  },
]

// ─── In-memory cache ───────────────────────────────────────────────
let _adsCache     = null
let _notifsCache  = null
let _cacheTime    = 0

// ─── BroadcastChannel ─────────────────────────────────────────────
let _bc = null
function getBC() {
  if (!_bc && typeof BroadcastChannel !== 'undefined') {
    try { _bc = new BroadcastChannel(BC_CHANNEL) } catch { /* ignore */ }
  }
  return _bc
}

// ─── localStorage helpers ──────────────────────────────────────────
function readLS() {
  try {
    const ads    = JSON.parse(localStorage.getItem(LS_ADS_KEY)   || 'null')
    const notifs = JSON.parse(localStorage.getItem(LS_NOTIF_KEY) || 'null')
    return { ads, notifs }
  } catch { return { ads: null, notifs: null } }
}

function writeLS(ads, notifs) {
  try {
    if (ads)   localStorage.setItem(LS_ADS_KEY,   JSON.stringify(ads))
    if (notifs) localStorage.setItem(LS_NOTIF_KEY, JSON.stringify(notifs))
  } catch { /* ignore */ }
}

// ─── Error classifier ──────────────────────────────────────────────
function isRLSError(err) {
  if (!err) return false
  const msg = (err.message || err.hint || err.code || '').toLowerCase()
  return (
    msg.includes('row-level security') ||
    msg.includes('rls') ||
    msg.includes('violates row') ||
    err.code === '42501' ||
    err.code === 'PGRST301'
  )
}

function isSchemaCacheError(err) {
  if (!err) return false
  const msg = (err.message || err.hint || '').toLowerCase()
  return (
    msg.includes('schema cache') ||
    msg.includes('could not find') ||
    err.code === 'PGRST204' ||
    err.code === '42P01'
  )
}

function isTableNotFoundError(err) {
  if (!err) return false
  const msg = (err.message || '').toLowerCase()
  return msg.includes('does not exist') || err.code === '42P01'
}

// ─── Friendly error messages ───────────────────────────────────────
function getFriendlyError(err) {
  if (!err) return 'Terjadi kesalahan tidak dikenal'
  if (isRLSError(err)) {
    return (
      'Gagal karena kebijakan keamanan Supabase (RLS). ' +
      'Jalankan SQL fix_ads_config_rls.sql di Supabase SQL Editor.'
    )
  }
  if (isTableNotFoundError(err)) {
    return (
      'Tabel ads_config belum dibuat. ' +
      'Jalankan SQL setup di halaman Iklan & Notifikasi.'
    )
  }
  if (isSchemaCacheError(err)) {
    return 'Schema cache error. Coba refresh halaman.'
  }
  return err.message || 'Gagal menyimpan ke Supabase'
}

// ─── Supabase fetch ────────────────────────────────────────────────
async function fetchFromSupabase() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('ads, notifications')
    .eq('id', ROW_ID)
    .single()

  if (!error && data) {
    return { ads: data.ads, notifs: data.notifications, error: null }
  }

  // Schema cache error → retry
  if (isSchemaCacheError(error)) {
    await new Promise(r => setTimeout(r, 1000))
    const retry = await supabase
      .from(TABLE)
      .select('ads, notifications')
      .eq('id', ROW_ID)
      .single()
    if (!retry.error && retry.data) {
      return { ads: retry.data.ads, notifs: retry.data.notifications, error: null }
    }
    return { ads: null, notifs: null, error: retry.error }
  }

  return { ads: null, notifs: null, error }
}

// ─── Supabase upsert ───────────────────────────────────────────────
async function upsertToSupabase(ads, notifs) {
  const payload = {
    id: ROW_ID,
    ads,
    notifications: notifs,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'id' })

  if (!error) return { error: null }

  // Schema cache error → retry
  if (isSchemaCacheError(error)) {
    await new Promise(r => setTimeout(r, 1500))
    const retry = await supabase
      .from(TABLE)
      .upsert(payload, { onConflict: 'id' })
    return { error: retry.error }
  }

  return { error }
}

// ─── Dismissed notifications (per browser, bukan global) ──────────
const DISMISSED_KEY = 'dc_dismissed_notifs_v4'

export function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
}

export function dismissNotification(id) {
  const list = getDismissed()
  if (!list.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]))
  }
}

// ══════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════

/**
 * Baca ads & notifications
 */
export async function getAdsConfig() {
  // Memory cache masih fresh
  if (_adsCache && _notifsCache && Date.now() - _cacheTime < CACHE_TTL) {
    return { ads: [..._adsCache], notifs: [..._notifsCache] }
  }

  if (USE_SUPABASE) {
    const { ads, notifs, error } = await fetchFromSupabase()
    if (ads && notifs) {
      _adsCache    = ads
      _notifsCache = notifs
      _cacheTime   = Date.now()
      writeLS(ads, notifs)
      return { ads: [...ads], notifs: [...notifs] }
    }
    if (error) {
      console.warn('[adsManager] Supabase fetch error:', error)
    }
  }

  // localStorage fallback
  const { ads: lsAds, notifs: lsNotifs } = readLS()
  if (lsAds && lsNotifs) {
    _adsCache    = lsAds
    _notifsCache = lsNotifs
    _cacheTime   = Date.now()
    return { ads: [...lsAds], notifs: [...lsNotifs] }
  }

  // Absolute default
  return { ads: [...DEFAULT_ADS], notifs: [...DEFAULT_NOTIFICATIONS] }
}

/**
 * Simpan ads & notifications
 * @returns {{ success: boolean, error?: string, warning?: string }}
 */
export async function setAdsConfig(ads, notifs) {
  // Optimistic update cache & localStorage
  _adsCache    = ads
  _notifsCache = notifs
  _cacheTime   = Date.now()
  writeLS(ads, notifs)

  if (USE_SUPABASE) {
    const { error } = await upsertToSupabase(ads, notifs)
    if (error) {
      // Rollback cache
      _adsCache    = null
      _notifsCache = null
      _cacheTime   = 0
      const friendlyMsg = getFriendlyError(error)
      console.error('[adsManager] Upsert error:', error)
      return { success: false, error: friendlyMsg }
    }
    // Broadcast ke tab lain
    getBC()?.postMessage({ type: 'ads_updated', ads, notifs })
    return { success: true }
  }

  // Mock mode
  getBC()?.postMessage({ type: 'ads_updated', ads, notifs })
  return {
    success: true,
    warning:
      'Mode demo: perubahan hanya berlaku di browser ini. ' +
      'Hubungkan Supabase agar berlaku global.',
  }
}

/**
 * Subscribe perubahan real-time
 */
export function subscribeAdsConfig(callback) {
  if (USE_SUPABASE) {
    const channelName = `${BC_CHANNEL}_rt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        payload => {
          const newAds   = payload.new?.ads
          const newNotifs = payload.new?.notifications
          if (newAds && newNotifs) {
            _adsCache    = newAds
            _notifsCache = newNotifs
            _cacheTime   = Date.now()
            writeLS(newAds, newNotifs)
            callback({ ads: [...newAds], notifs: [...newNotifs] })
          }
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('[adsManager] Realtime connected')
        }
      })

    return () => supabase.removeChannel(channel)
  }

  // Mock: BroadcastChannel
  const bc = getBC()
  if (!bc) return () => {}

  function handler(event) {
    if (event.data?.type === 'ads_updated') {
      const { ads, notifs } = event.data
      _adsCache    = ads
      _notifsCache = notifs
      _cacheTime   = Date.now()
      writeLS(ads, notifs)
      callback({ ads: [...ads], notifs: [...notifs] })
    }
  }

  bc.addEventListener('message', handler)
  return () => bc.removeEventListener('message', handler)
}

/** Paksa re-fetch */
export function invalidateAdsCache() {
  _adsCache    = null
  _notifsCache = null
  _cacheTime   = 0
}

export function isAdsGlobal() {
  return USE_SUPABASE
}
