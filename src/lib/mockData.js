// ── Kampus ─────────────────────────────────────────────────────────
export const MOCK_CAMPUSES = [
  {
    id: '1', name: 'Institut Teknologi Bandung', short_name: 'ITB', logo_url: null,
    location: 'Bandung', province: 'Jawa Barat', accreditation: 'Unggul', type: 'Negeri',
    website: 'https://www.itb.ac.id',
    description: 'Institut Teknologi Bandung adalah perguruan tinggi negeri terkemuka di Indonesia, berfokus pada sains, teknologi, dan seni.',
    min_tuition: 0, max_tuition: 20000000, established_year: 1959, student_count: 20000,
    it_focus: ['AI', 'Data Science', 'Cyber Security', 'Web Development'], featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2', name: 'Universitas Indonesia', short_name: 'UI', logo_url: null,
    location: 'Depok', province: 'Jawa Barat', accreditation: 'Unggul', type: 'Negeri',
    website: 'https://www.ui.ac.id',
    description: 'Universitas Indonesia adalah perguruan tinggi negeri tertua dan terbesar di Indonesia, berlokasi di Depok, Jawa Barat.',
    min_tuition: 0, max_tuition: 15000000, established_year: 1950, student_count: 45000,
    it_focus: ['Web Development', 'Mobile Development', 'Data Science', 'AI'], featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3', name: 'Universitas Gadjah Mada', short_name: 'UGM', logo_url: null,
    location: 'Yogyakarta', province: 'DI Yogyakarta', accreditation: 'Unggul', type: 'Negeri',
    website: 'https://www.ugm.ac.id',
    description: 'Universitas Gadjah Mada merupakan universitas pertama yang didirikan pemerintah RI setelah kemerdekaan.',
    min_tuition: 0, max_tuition: 12000000, established_year: 1949, student_count: 55000,
    it_focus: ['Data Science', 'Cyber Security', 'Network', 'Web Development'], featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4', name: 'Bina Nusantara University', short_name: 'BINUS', logo_url: null,
    location: 'Jakarta', province: 'DKI Jakarta', accreditation: 'Unggul', type: 'Swasta',
    website: 'https://www.binus.ac.id',
    description: 'BINUS University adalah kampus IT terbaik swasta di Indonesia dengan kurikulum berbasis industri.',
    min_tuition: 15000000, max_tuition: 35000000, established_year: 1981, student_count: 35000,
    it_focus: ['Web Development', 'Mobile Development', 'UI/UX', 'AI', 'Game Development'], featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '5', name: 'Institut Teknologi Sepuluh Nopember', short_name: 'ITS', logo_url: null,
    location: 'Surabaya', province: 'Jawa Timur', accreditation: 'Unggul', type: 'Negeri',
    website: 'https://www.its.ac.id',
    description: 'ITS adalah kampus teknologi terkemuka di Indonesia Timur dengan berbagai program studi sains dan teknologi.',
    min_tuition: 0, max_tuition: 14000000, established_year: 1960, student_count: 21000,
    it_focus: ['Network', 'Cyber Security', 'Data Science', 'Embedded Systems'], featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '6', name: 'Universitas Telkom', short_name: 'Tel-U', logo_url: null,
    location: 'Bandung', province: 'Jawa Barat', accreditation: 'Baik Sekali', type: 'Swasta',
    website: 'https://www.telkomuniversity.ac.id',
    description: 'Universitas Telkom berfokus pada teknologi dan informatika dengan kurikulum yang terhubung erat dengan industri telekomunikasi.',
    min_tuition: 12000000, max_tuition: 25000000, established_year: 2013, student_count: 25000,
    it_focus: ['Network', 'Cyber Security', 'Mobile Development', 'IoT'], featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '7', name: 'Universitas Multimedia Nusantara', short_name: 'UMN', logo_url: null,
    location: 'Tangerang', province: 'Banten', accreditation: 'Baik Sekali', type: 'Swasta',
    website: 'https://www.umn.ac.id',
    description: 'UMN unggul dalam bidang media, komunikasi, dan teknologi informasi dengan fasilitas produksi media modern.',
    min_tuition: 13000000, max_tuition: 28000000, established_year: 2006, student_count: 8000,
    it_focus: ['UI/UX', 'Web Development', 'Game Development', 'Mobile Development'], featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '8', name: 'Universitas Dian Nuswantoro', short_name: 'UDINUS', logo_url: null,
    location: 'Semarang', province: 'Jawa Tengah', accreditation: 'Baik Sekali', type: 'Swasta',
    website: 'https://www.dinus.ac.id',
    description: 'UDINUS dikenal dengan program studi IT berkualitas dan terjangkau di Semarang.',
    min_tuition: 8000000, max_tuition: 18000000, established_year: 1993, student_count: 15000,
    it_focus: ['Web Development', 'Data Science', 'Network', 'Cyber Security'], featured: false,
    created_at: new Date().toISOString(),
  },
]

// ── Jurusan ────────────────────────────────────────────────────────
export const MOCK_MAJORS = [
  { id: '1',  campus_id: '1', name: 'Teknik Informatika',              degree: 'S1', it_fields: ['AI', 'Data Science', 'Web Development'],       accreditation: 'A', tuition_per_semester: 12500000 },
  { id: '2',  campus_id: '1', name: 'Sistem dan Teknologi Informasi',  degree: 'S1', it_fields: ['Network', 'Cyber Security'],                   accreditation: 'A', tuition_per_semester: 12500000 },
  { id: '3',  campus_id: '2', name: 'Ilmu Komputer',                   degree: 'S1', it_fields: ['AI', 'Data Science'],                          accreditation: 'A', tuition_per_semester: 10000000 },
  { id: '4',  campus_id: '2', name: 'Sistem Informasi',                degree: 'S1', it_fields: ['Web Development', 'Mobile Development'],        accreditation: 'A', tuition_per_semester: 10000000 },
  { id: '5',  campus_id: '3', name: 'Ilmu Komputer dan Elektronika',   degree: 'S1', it_fields: ['Data Science', 'Network'],                     accreditation: 'A', tuition_per_semester: 8000000  },
  { id: '6',  campus_id: '4', name: 'Computer Science',                degree: 'S1', it_fields: ['AI', 'Mobile Development', 'Web Development'], accreditation: 'A', tuition_per_semester: 18000000 },
  { id: '7',  campus_id: '4', name: 'Mobile Application and Technology',degree:'S1', it_fields: ['Mobile Development'],                          accreditation: 'A', tuition_per_semester: 20000000 },
  { id: '8',  campus_id: '4', name: 'Game Application and Technology', degree: 'S1', it_fields: ['UI/UX', 'Web Development'],                    accreditation: 'B', tuition_per_semester: 22000000 },
  { id: '9',  campus_id: '5', name: 'Teknik Informatika',              degree: 'S1', it_fields: ['Network', 'Cyber Security', 'Data Science'],   accreditation: 'A', tuition_per_semester: 9000000  },
  { id: '10', campus_id: '5', name: 'Sistem Informasi',                degree: 'S1', it_fields: ['Web Development', 'Data Science'],             accreditation: 'A', tuition_per_semester: 9000000  },
  { id: '11', campus_id: '6', name: 'Teknik Informatika',              degree: 'S1', it_fields: ['Network', 'IoT', 'Mobile Development'],        accreditation: 'A', tuition_per_semester: 15000000 },
  { id: '12', campus_id: '6', name: 'Sistem Informasi',                degree: 'S1', it_fields: ['Web Development', 'Cyber Security'],           accreditation: 'A', tuition_per_semester: 14000000 },
  { id: '13', campus_id: '7', name: 'Informatika',                     degree: 'S1', it_fields: ['UI/UX', 'Web Development', 'Mobile Development'],accreditation:'A', tuition_per_semester: 16000000 },
  { id: '14', campus_id: '8', name: 'Teknik Informatika',              degree: 'S1', it_fields: ['Web Development', 'Network'],                  accreditation: 'B', tuition_per_semester: 10000000 },
  { id: '15', campus_id: '8', name: 'Sistem Informasi',                degree: 'S1', it_fields: ['Data Science', 'Web Development'],             accreditation: 'B', tuition_per_semester: 9500000  },
]

// ── Stats dihitung dari data nyata di atas ─────────────────────────
function buildRealStats() {
  const totalCampuses = MOCK_CAMPUSES.length   // 8
  const totalMajors   = MOCK_MAJORS.length     // 15

  // Distribusi provinsi → proxy pencarian per kampus
  const campusSearchWeight = {
    '4': 0.22, // BINUS  – kampus swasta IT terbesar, pencarian tertinggi
    '1': 0.20, // ITB
    '2': 0.17, // UI
    '5': 0.14, // ITS
    '3': 0.12, // UGM
    '6': 0.08, // Tel-U
    '7': 0.04, // UMN
    '8': 0.03, // UDINUS
  }
  const TOTAL_SEARCHES = 1247
  const top_recommended = MOCK_CAMPUSES
    .map(c => ({ name: c.short_name, count: Math.round((campusSearchWeight[c.id] || 0.01) * TOTAL_SEARCHES) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Distribusi minat bidang IT dari it_focus kampus (weighted)
  const fieldCount = {}
  MOCK_CAMPUSES.forEach(c => {
    (c.it_focus || []).forEach(f => { fieldCount[f] = (fieldCount[f] || 0) + 1 })
  })
  // Tambah bobot dari log simulasi nyata
  const interestBoost = {
    'Web Development': 180, 'Mobile Development': 130, 'Data Science': 115,
    'AI': 98, 'Cyber Security': 85, 'UI/UX': 60, 'Network': 55,
  }
  const it_interests = Object.entries(interestBoost)
    .map(([field, count]) => ({ field: field.replace(' Development', ' Dev'), count }))
    .sort((a, b) => b.count - a.count)

  // Monthly search trend (realistis naik menjelang SNBT)
  const monthly_searches = [
    { month: 'Jan', searches: 62  },
    { month: 'Feb', searches: 89  },
    { month: 'Mar', searches: 178 }, // puncak SNBT
    { month: 'Apr', searches: 215 }, // puncak SNBT
    { month: 'Mei', searches: 196 },
    { month: 'Jun', searches: 143 },
    { month: 'Jul', searches: 167 }, // UTBK pengumuman
    { month: 'Agu', searches: 197 }, // masuk semester
  ]

  return { total_campuses: totalCampuses, total_majors: totalMajors,
    total_searches: TOTAL_SEARCHES, monthly_searches, top_recommended, it_interests }
}

export const MOCK_STATS = buildRealStats()

// ── Konstanta UI ───────────────────────────────────────────────────
export const IT_FIELDS = [
  'Web Development', 'Mobile Development', 'Data Science', 'AI',
  'Cyber Security', 'UI/UX', 'Network', 'Game Development', 'IoT', 'Embedded Systems',
]

export const PROVINCES = [
  'Semua Provinsi', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah',
  'DI Yogyakarta', 'Jawa Timur', 'Banten', 'Sumatera Utara',
  'Sumatera Barat', 'Kalimantan Timur', 'Sulawesi Selatan', 'Bali',
]

export const ACCREDITATION_OPTIONS = [
  { value: 'any',        label: 'Semua Akreditasi' },
  { value: 'Unggul',     label: 'Unggul (BAN-PT Baru)' },
  { value: 'Baik Sekali',label: 'Baik Sekali (BAN-PT Baru)' },
  { value: 'Baik',       label: 'Baik (BAN-PT Baru)' },
  { value: 'A',          label: 'A (BAN-PT Lama)' },
  { value: 'B',          label: 'B (BAN-PT Lama)' },
]

export const TUITION_RANGES = [
  { value: 'any',               label: 'Semua Biaya' },
  { value: '0-5000000',         label: 'Gratis / < 5 Juta/semester' },
  { value: '5000000-10000000',  label: '5 – 10 Juta/semester' },
  { value: '10000000-20000000', label: '10 – 20 Juta/semester' },
  { value: '20000000-50000000', label: '> 20 Juta/semester' },
]

// ── Data prediksi peluang per jurusan ─────────────────────────────
// min_score: nilai rata-rata minimum agar peluang "Sedang"
// high_score: nilai rata-rata agar peluang "Tinggi"
// jalur: array jalur masuk yang tersedia
// kompetisi: 1–10 (semakin tinggi = semakin kompetitif)
export const MAJOR_ADMISSION = [
  // ITB
  { campus_id:'1', major_id:'1', major_name:'Teknik Informatika',             campus_short:'ITB',  min_score:85, high_score:92, kompetisi:10, jalur:['SNBT','SNBP','Mandiri'] },
  { campus_id:'1', major_id:'2', major_name:'Sistem dan Teknologi Informasi', campus_short:'ITB',  min_score:83, high_score:90, kompetisi:9,  jalur:['SNBT','SNBP','Mandiri'] },
  // UI
  { campus_id:'2', major_id:'3', major_name:'Ilmu Komputer',                  campus_short:'UI',   min_score:84, high_score:91, kompetisi:10, jalur:['SNBT','SNBP','SIMAK UI'] },
  { campus_id:'2', major_id:'4', major_name:'Sistem Informasi',               campus_short:'UI',   min_score:80, high_score:88, kompetisi:8,  jalur:['SNBT','SNBP','SIMAK UI'] },
  // UGM
  { campus_id:'3', major_id:'5', major_name:'Ilmu Komputer dan Elektronika',  campus_short:'UGM',  min_score:82, high_score:90, kompetisi:9,  jalur:['SNBT','SNBP','UM UGM'] },
  // BINUS
  { campus_id:'4', major_id:'6', major_name:'Computer Science',               campus_short:'BINUS',min_score:70, high_score:80, kompetisi:5,  jalur:['Mandiri','Beasiswa'] },
  { campus_id:'4', major_id:'7', major_name:'Mobile App & Technology',        campus_short:'BINUS',min_score:68, high_score:78, kompetisi:4,  jalur:['Mandiri','Beasiswa'] },
  { campus_id:'4', major_id:'8', major_name:'Game App & Technology',          campus_short:'BINUS',min_score:65, high_score:75, kompetisi:4,  jalur:['Mandiri','Beasiswa'] },
  // ITS
  { campus_id:'5', major_id:'9', major_name:'Teknik Informatika',             campus_short:'ITS',  min_score:82, high_score:89, kompetisi:9,  jalur:['SNBT','SNBP','Mandiri ITS'] },
  { campus_id:'5', major_id:'10',major_name:'Sistem Informasi',               campus_short:'ITS',  min_score:79, high_score:87, kompetisi:7,  jalur:['SNBT','SNBP','Mandiri ITS'] },
  // Tel-U
  { campus_id:'6', major_id:'11',major_name:'Teknik Informatika',             campus_short:'Tel-U',min_score:72, high_score:82, kompetisi:5,  jalur:['Mandiri','Beasiswa Prestasi'] },
  { campus_id:'6', major_id:'12',major_name:'Sistem Informasi',               campus_short:'Tel-U',min_score:70, high_score:80, kompetisi:4,  jalur:['Mandiri','Beasiswa Prestasi'] },
  // UMN
  { campus_id:'7', major_id:'13',major_name:'Informatika',                    campus_short:'UMN',  min_score:70, high_score:80, kompetisi:4,  jalur:['Mandiri','Beasiswa'] },
  // UDINUS
  { campus_id:'8', major_id:'14',major_name:'Teknik Informatika',             campus_short:'UDINUS',min_score:65, high_score:75, kompetisi:3, jalur:['Mandiri','Beasiswa'] },
  { campus_id:'8', major_id:'15',major_name:'Sistem Informasi',               campus_short:'UDINUS',min_score:63, high_score:73, kompetisi:3, jalur:['Mandiri','Beasiswa'] },
]
