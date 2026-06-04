/**
 * Security utilities untuk DreamCampus
 * - Input sanitization
 * - XSS prevention
 * - Rate limiting (client-side)
 * - URL validation
 * - Content Security Policy helpers
 */

// ─── Sanitize string input (strip HTML tags & dangerous chars) ────
export function sanitizeText(input) {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')              // strip HTML tags
    .replace(/javascript:/gi, '')         // strip js: protocol
    .replace(/on\w+\s*=/gi, '')           // strip event handlers
    .replace(/[<>"'`]/g, c => ({          // encode dangerous chars
      '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#x27;', '`': '&#x60;'
    })[c])
    .trim()
    .slice(0, 500)                        // max length cap
}

// ─── Validate URL — only allow http/https ─────────────────────────
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const u = new URL(url)
    return ['https:', 'http:'].includes(u.protocol)
  } catch { return false }
}

// ─── Sanitize URL for use in href ─────────────────────────────────
export function sanitizeUrl(url) {
  if (!isSafeUrl(url)) return '#'
  return url
}

// ─── Validate numeric input ───────────────────────────────────────
export function sanitizeNumber(val, min = 0, max = 100) {
  const n = parseFloat(val)
  if (isNaN(n)) return null
  return Math.min(max, Math.max(min, n))
}

// ─── Client-side rate limiter ─────────────────────────────────────
const rateLimitMap = new Map()

/**
 * @param {string} key  Unique action key (e.g. 'search', 'prediction')
 * @param {number} maxCalls  Max calls allowed in window
 * @param {number} windowMs  Time window in ms
 * @returns {boolean} true = allowed, false = rate limited
 */
export function checkRateLimit(key, maxCalls = 10, windowMs = 60000) {
  const now = Date.now()
  const entry = rateLimitMap.get(key) || { calls: [], blocked: false }

  // Clean old calls outside window
  entry.calls = entry.calls.filter(t => now - t < windowMs)

  if (entry.calls.length >= maxCalls) {
    entry.blocked = true
    rateLimitMap.set(key, entry)
    return false
  }

  entry.calls.push(now)
  entry.blocked = false
  rateLimitMap.set(key, entry)
  return true
}

export function getRateLimitRemaining(key, maxCalls = 10, windowMs = 60000) {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry) return maxCalls
  const active = entry.calls.filter(t => now - t < windowMs)
  return Math.max(0, maxCalls - active.length)
}

// ─── DOMPurify-lite: sanitize for safe innerHTML ──────────────────
// Hanya izinkan tag & atribut yang aman
const ALLOWED_TAGS  = new Set(['b','i','em','strong','u','br','p','span'])
const ALLOWED_ATTRS = new Set(['class','id'])

export function sanitizeHTML(dirty) {
  if (!dirty) return ''
  return dirty
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tag) => {
      if (ALLOWED_TAGS.has(tag.toLowerCase())) return match.replace(/\s+on\w+="[^"]*"/g, '')
      return ''
    })
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
}

// ─── CSRF-like nonce generator (untuk form submissions) ───────────
export function generateNonce() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Validate admin input fields sebelum ke Supabase ─────────────
export function validateCampusInput(data) {
  const errors = []
  if (!data.name || sanitizeText(data.name).length < 3)
    errors.push('Nama kampus minimal 3 karakter')
  if (!data.location || sanitizeText(data.location).length < 2)
    errors.push('Kota wajib diisi')
  if (!data.province)
    errors.push('Provinsi wajib dipilih')
  if (data.website && !isSafeUrl(data.website))
    errors.push('Format URL website tidak valid (harus https://...)')
  if (data.min_tuition < 0 || data.max_tuition < 0)
    errors.push('Biaya kuliah tidak boleh negatif')
  if (data.max_tuition > 0 && data.max_tuition < data.min_tuition)
    errors.push('Biaya maksimum harus lebih besar dari minimum')
  if (data.established_year && (data.established_year < 1900 || data.established_year > new Date().getFullYear()))
    errors.push('Tahun berdiri tidak valid')
  return errors
}

export function validateMajorInput(data) {
  const errors = []
  if (!data.name || sanitizeText(data.name).length < 2)
    errors.push('Nama jurusan minimal 2 karakter')
  if (!data.campus_id)
    errors.push('Kampus wajib dipilih')
  if (!['D3','S1','S2','S3'].includes(data.degree))
    errors.push('Jenjang tidak valid')
  if (data.tuition_per_semester && data.tuition_per_semester < 0)
    errors.push('Biaya tidak boleh negatif')
  return errors
}

// ─── Sanitize recommendation preferences ─────────────────────────
export function sanitizePreferences(prefs) {
  return {
    majorInterest:  sanitizeText(prefs.majorInterest || ''),
    itInterests:    (prefs.itInterests || []).filter(f => typeof f === 'string').map(sanitizeText).slice(0, 10),
    location:       sanitizeText(prefs.location || ''),
    accreditation:  sanitizeText(prefs.accreditation || ''),
    tuitionRange:   sanitizeText(prefs.tuitionRange || ''),
  }
}

// ─── Detect suspicious input patterns ────────────────────────────
const SUSPICIOUS_PATTERNS = [
  /script/i, /onclick/i, /onerror/i, /onload/i,
  /eval\s*\(/i, /document\./i, /window\./i,
  /fetch\s*\(/i, /xmlhttprequest/i, /base64/i,
  /<[^>]+>/,  // Any HTML tag
  /union\s+select/i, /drop\s+table/i, /insert\s+into/i,  // SQL injection
]

export function containsSuspiciousContent(input) {
  if (typeof input !== 'string') return false
  return SUSPICIOUS_PATTERNS.some(p => p.test(input))
}
