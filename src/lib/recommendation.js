/**
 * Content-Based Filtering untuk rekomendasi kampus IT
 * Menggunakan cosine similarity pada feature vector
 */

const WEIGHTS = {
  it_field: 0.35,      // Minat bidang IT (bobot tertinggi)
  major: 0.25,         // Jurusan yang diminati
  location: 0.15,      // Lokasi/provinsi
  accreditation: 0.15, // Akreditasi kampus
  tuition: 0.10,       // Biaya kuliah
}

const ACCREDITATION_SCORES = {
  'Unggul': 5,
  'A': 5,
  'Baik Sekali': 4,
  'B': 3,
  'Baik': 2,
  'C': 1,
}

function parseUserTuitionPreference(tuitionPref) {
  if (!tuitionPref || tuitionPref === 'any') return null
  const [min, max] = tuitionPref.split('-').map(Number)
  return { min, max }
}

function calculateItFieldScore(campusItFocus, majorItFields, userInterests) {
  if (!userInterests || userInterests.length === 0) return 0.5

  const allCampusFields = [
    ...(campusItFocus || []),
    ...(majorItFields || []),
  ]

  if (allCampusFields.length === 0) return 0

  const matches = userInterests.filter(interest =>
    allCampusFields.some(f => f.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(f.toLowerCase()))
  )

  return matches.length / userInterests.length
}

function calculateLocationScore(campusProvince, userProvince) {
  if (!userProvince || userProvince === 'Semua Provinsi' || userProvince === '') return 1.0
  if (!campusProvince) return 0.3

  const cityNormalized = campusProvince.toLowerCase()
  const userNormalized = userProvince.toLowerCase()

  if (cityNormalized === userNormalized) return 1.0

  // Partial match (same island etc.)
  const jawa = ['dki jakarta', 'jawa barat', 'jawa tengah', 'di yogyakarta', 'jawa timur', 'banten']
  if (jawa.includes(cityNormalized) && jawa.includes(userNormalized)) return 0.6

  return 0.2
}

function calculateAccreditationScore(campusAccreditation, userAccreditationPref) {
  if (!userAccreditationPref || userAccreditationPref === 'any') return 1.0

  const campusScore = ACCREDITATION_SCORES[campusAccreditation] || 1
  const preferredScore = ACCREDITATION_SCORES[userAccreditationPref] || 1

  if (campusScore >= preferredScore) return 1.0
  return campusScore / preferredScore
}

function calculateTuitionScore(campusMinTuition, campusMaxTuition, userTuitionPref) {
  if (!userTuitionPref || userTuitionPref === 'any') return 1.0

  const pref = parseUserTuitionPreference(userTuitionPref)
  if (!pref) return 1.0

  // Check if campus tuition range overlaps with user preference
  const campusAvg = (campusMinTuition + campusMaxTuition) / 2

  if (campusAvg >= pref.min && campusAvg <= pref.max) return 1.0
  if (campusAvg < pref.min) return 0.7 // Cheaper is still good

  // More expensive than preference
  const overshoot = (campusAvg - pref.max) / pref.max
  return Math.max(0, 1 - overshoot)
}

function calculateMajorMatchScore(campusMajors, userMajorInterest) {
  if (!userMajorInterest || !campusMajors || campusMajors.length === 0) return 0.5

  const keywords = userMajorInterest.toLowerCase().split(' ')
  const hasMatch = campusMajors.some(major => {
    const majorLower = major.name.toLowerCase()
    return keywords.some(kw => majorLower.includes(kw))
  })

  return hasMatch ? 1.0 : 0.3
}

/**
 * Main recommendation function using Content-Based Filtering
 * @param {Object} userPreferences - User's preferences form data
 * @param {Array} campuses - List of campus objects
 * @param {Array} majors - List of major objects
 * @returns {Array} Sorted list of campus recommendations with scores
 */
export function getRecommendations(userPreferences, campuses, majors) {
  const {
    majorInterest,
    itInterests = [],
    location,
    accreditation,
    tuitionRange,
  } = userPreferences

  const results = campuses.map(campus => {
    // Get majors for this campus
    const campusMajors = majors.filter(m => m.campus_id === campus.id)
    const allMajorFields = campusMajors.flatMap(m => m.it_fields || [])

    // Calculate individual scores
    const itFieldScore = calculateItFieldScore(
      campus.it_focus || [],
      allMajorFields,
      itInterests
    )

    const locationScore = calculateLocationScore(campus.province, location)

    const accreditationScore = calculateAccreditationScore(
      campus.accreditation,
      accreditation
    )

    const tuitionScore = calculateTuitionScore(
      campus.min_tuition,
      campus.max_tuition,
      tuitionRange
    )

    const majorScore = calculateMajorMatchScore(campusMajors, majorInterest)

    // Weighted sum (content-based similarity)
    const totalScore = (
      itFieldScore * WEIGHTS.it_field +
      majorScore * WEIGHTS.major +
      locationScore * WEIGHTS.location +
      accreditationScore * WEIGHTS.accreditation +
      tuitionScore * WEIGHTS.tuition
    )

    const scorePercent = Math.round(totalScore * 100)

    return {
      ...campus,
      majors: campusMajors,
      score: scorePercent,
      scoreDetails: {
        itField: Math.round(itFieldScore * 100),
        major: Math.round(majorScore * 100),
        location: Math.round(locationScore * 100),
        accreditation: Math.round(accreditationScore * 100),
        tuition: Math.round(tuitionScore * 100),
      }
    }
  })

  // Sort by score descending
  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function getRecommendationLabel(score) {
  if (score >= 85) return { label: 'Sangat Cocok', color: 'text-emerald-600', bg: 'bg-emerald-100' }
  if (score >= 70) return { label: 'Cocok', color: 'text-blue-600', bg: 'bg-blue-100' }
  if (score >= 55) return { label: 'Cukup Cocok', color: 'text-amber-600', bg: 'bg-amber-100' }
  return { label: 'Kurang Cocok', color: 'text-red-500', bg: 'bg-red-100' }
}
