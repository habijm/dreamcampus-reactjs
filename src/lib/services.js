import { supabase } from './supabase'
import { MOCK_CAMPUSES, MOCK_MAJORS, MOCK_STATS } from './mockData'

export const USE_MOCK = !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url'

// ─── Campus ────────────────────────────────────────────────────────
export async function getCampuses() {
  if (USE_MOCK) return { data: MOCK_CAMPUSES, error: null }
  const { data, error } = await supabase.from('campuses').select('*').order('name')
  return { data, error }
}
export async function getFeaturedCampuses() {
  if (USE_MOCK) return { data: MOCK_CAMPUSES.filter(c => c.featured), error: null }
  const { data, error } = await supabase.from('campuses').select('*').eq('featured', true).limit(6)
  return { data, error }
}
export async function getCampusById(id) {
  if (USE_MOCK) {
    const campus = MOCK_CAMPUSES.find(c => c.id === id)
    return { data: campus || null, error: campus ? null : { message: 'Not found' } }
  }
  const { data, error } = await supabase.from('campuses').select('*').eq('id', id).single()
  return { data, error }
}
export async function createCampus(campusData) {
  if (USE_MOCK) return { data: { ...campusData, id: Date.now().toString() }, error: null }
  const { data, error } = await supabase.from('campuses').insert(campusData).select().single()
  return { data, error }
}
export async function updateCampus(id, campusData) {
  if (USE_MOCK) return { data: campusData, error: null }
  const { data, error } = await supabase.from('campuses').update(campusData).eq('id', id).select().single()
  return { data, error }
}
export async function deleteCampus(id) {
  if (USE_MOCK) return { error: null }
  const { error } = await supabase.from('campuses').delete().eq('id', id)
  return { error }
}

// ─── Majors ────────────────────────────────────────────────────────
export async function getMajors(campusId = null) {
  if (USE_MOCK) {
    const data = campusId ? MOCK_MAJORS.filter(m => m.campus_id === campusId) : MOCK_MAJORS
    return { data, error: null }
  }
  let query = supabase.from('majors').select('*, campuses(name, short_name)')
  if (campusId) query = query.eq('campus_id', campusId)
  const { data, error } = await query.order('name')
  return { data, error }
}
export async function createMajor(majorData) {
  if (USE_MOCK) return { data: { ...majorData, id: Date.now().toString() }, error: null }
  const { data, error } = await supabase.from('majors').insert(majorData).select().single()
  return { data, error }
}
export async function updateMajor(id, majorData) {
  if (USE_MOCK) return { data: majorData, error: null }
  const { data, error } = await supabase.from('majors').update(majorData).eq('id', id).select().single()
  return { data, error }
}
export async function deleteMajor(id) {
  if (USE_MOCK) return { error: null }
  const { error } = await supabase.from('majors').delete().eq('id', id)
  return { error }
}

// ─── Stats (real data from DB, fallback computed mock) ─────────────
export async function getDashboardStats() {
  if (USE_MOCK) return { data: MOCK_STATS, error: null }

  const [campusRes, majorRes, logRes, campuses, majors] = await Promise.all([
    supabase.from('campuses').select('id', { count: 'exact', head: true }),
    supabase.from('majors').select('id',   { count: 'exact', head: true }),
    supabase.from('recommendations_log').select('id', { count: 'exact', head: true }),
    supabase.from('campuses').select('short_name, id'),
    supabase.from('majors').select('campus_id'),
  ])

  // Top recommended dari log
  const { data: topData } = await supabase
    .from('recommendations_log')
    .select('top_campus_id')
    .not('top_campus_id', 'is', null)
    .limit(500)

  const topCount = {}
  ;(topData || []).forEach(r => { topCount[r.top_campus_id] = (topCount[r.top_campus_id] || 0) + 1 })
  const campusMap = Object.fromEntries((campuses.data || []).map(c => [c.id, c.short_name]))
  const top_recommended = Object.entries(topCount)
    .map(([id, count]) => ({ name: campusMap[id] || id, count }))
    .sort((a, b) => b.count - a.count).slice(0, 5)

  // IT interests dari log
  const { data: logDetail } = await supabase
    .from('recommendations_log').select('it_interests').limit(500)
  const itCount = {}
  ;(logDetail || []).forEach(r => (r.it_interests || []).forEach(f => { itCount[f] = (itCount[f] || 0) + 1 }))
  const it_interests = Object.entries(itCount)
    .map(([field, count]) => ({ field: field.replace(' Development', ' Dev'), count }))
    .sort((a, b) => b.count - a.count).slice(0, 7)

  // Monthly dari log
  const { data: monthly } = await supabase
    .from('recommendations_log').select('created_at').order('created_at')
  const monthMap = {}
  ;(monthly || []).forEach(r => {
    const m = new Date(r.created_at).toLocaleDateString('id-ID', { month: 'short' })
    monthMap[m] = (monthMap[m] || 0) + 1
  })
  const monthly_searches = Object.entries(monthMap).map(([month, searches]) => ({ month, searches }))

  return {
    data: {
      total_campuses: campusRes.count || 0,
      total_majors:   majorRes.count  || 0,
      total_searches: logRes.count    || 0,
      monthly_searches: monthly_searches.length ? monthly_searches : MOCK_STATS.monthly_searches,
      top_recommended:  top_recommended.length  ? top_recommended  : MOCK_STATS.top_recommended,
      it_interests:     it_interests.length     ? it_interests     : MOCK_STATS.it_interests,
    },
    error: null,
  }
}

// ─── Log recommendation ────────────────────────────────────────────
export async function logRecommendation(preferences, results) {
  if (USE_MOCK) return { error: null }
  const { error } = await supabase.from('recommendations_log').insert({
    it_interests: preferences.itInterests || [],
    location: preferences.location || null,
    accreditation: preferences.accreditation || null,
    tuition_range: preferences.tuitionRange || null,
    result_count: results.length,
    top_campus_id: results[0]?.id || null,
  })
  return { error }
}

// ─── Auth ──────────────────────────────────────────────────────────
export async function adminLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}
export async function adminLogout() {
  const { error } = await supabase.auth.signOut()
  return { error }
}
export async function getAdminSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// ─── File upload ───────────────────────────────────────────────────
export async function uploadLogo(file, campusId) {
  if (USE_MOCK) return { url: null, error: null }
  const fileExt = file.name.split('.').pop()
  const fileName = `${campusId}-logo.${fileExt}`
  const { error: uploadError } = await supabase.storage.from('campus-logos').upload(fileName, file, { upsert: true })
  if (uploadError) return { url: null, error: uploadError }
  const { data } = supabase.storage.from('campus-logos').getPublicUrl(fileName)
  return { url: data.publicUrl, error: null }
}

// ─── Feature flags (localStorage-based) ───────────────────────────
const FLAG_KEY = 'dc_feature_flags'

export function getFeatureFlags() {
  try {
    const stored = localStorage.getItem(FLAG_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { rekomendasi: true, bandingkan: true, prediksi: true }
}

export function setFeatureFlags(flags) {
  localStorage.setItem(FLAG_KEY, JSON.stringify(flags))
}

// ─── Ads & Announcements ───────────────────────────────────────────
const ADS_KEY    = 'dc_ads'
const NOTIF_KEY  = 'dc_notifications'

export function getAds() {
  try {
    const stored = localStorage.getItem(ADS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_ADS
}

export function setAds(ads) {
  localStorage.setItem(ADS_KEY, JSON.stringify(ads))
  window.dispatchEvent(new Event('dc-ads-changed'))
}

export function getNotifications() {
  try {
    const stored = localStorage.getItem(NOTIF_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_NOTIFICATIONS
}

export function setNotifications(notifs) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs))
  window.dispatchEvent(new Event('dc-notif-changed'))
}

// Cek apakah notifikasi sudah di-dismiss user
const DISMISSED_KEY = 'dc_dismissed_notifs'
export function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
}
export function dismissNotification(id) {
  const list = getDismissed()
  if (!list.includes(id)) localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]))
}

// ─── Default data ──────────────────────────────────────────────────
export const DEFAULT_ADS = [
  {
    id: 'ad-1',
    title: 'Tryout SNBT Online Gratis',
    description: 'Latihan soal UTBK lengkap dengan pembahasan. Persiapkan dirimu sekarang!',
    url: 'https://example.com',
    cta: 'Daftar Sekarang',
    type: 'banner',          // 'banner' | 'card' | 'inline'
    position: 'rekomendasi', // halaman yang ditampilkan: 'all' | 'rekomendasi' | 'kampus' | 'prediksi' | 'bandingkan'
    active: true,
    color: 'blue',           // 'blue' | 'purple' | 'emerald' | 'amber'
  },
  {
    id: 'ad-2',
    title: 'Beasiswa S1 Penuh 2025',
    description: 'Daftarkan diri untuk program beasiswa IT senilai Rp 50 juta/tahun.',
    url: 'https://example.com',
    cta: 'Pelajari',
    type: 'card',
    position: 'kampus',
    active: true,
    color: 'emerald',
  },
  {
    id: 'ad-3',
    title: 'Kursus Pemrograman Python',
    description: 'Mulai belajar coding dari nol dengan mentor berpengalaman.',
    url: 'https://example.com',
    cta: 'Mulai Belajar',
    type: 'inline',
    position: 'prediksi',
    active: false,
    color: 'purple',
  },
]

export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: '📅 Pendaftaran SNBT 2025 Dibuka',
    message: 'Pendaftaran SNBT gelombang 1 dibuka mulai 1 Maret – 15 Maret 2025. Persiapkan dokumenmu!',
    type: 'info',    // 'info' | 'warning' | 'success' | 'urgent'
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
    message: 'Data prediksi peluang bersifat estimasi. Selalu cek pengumuman resmi kampus.',
    type: 'warning',
    position: 'prediksi',
    active: true,
    dismissable: false,
    link: '',
    linkText: '',
  },
]
