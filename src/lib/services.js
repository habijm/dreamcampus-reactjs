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
