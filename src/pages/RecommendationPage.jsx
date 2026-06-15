import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  Sparkles, Filter, RotateCcw, Search, Info, ChevronDown,
  ChevronUp, AlertCircle, Building2, RefreshCw, Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/misc'
import { Progress } from '@/components/ui/misc'
import { Separator } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/misc'
import { CampusCard } from '@/components/campus/CampusCard'
import { NotificationBar, AdBanner, AdCard, AdInline } from '@/components/ads/AdsComponents'
import { getCampuses, getMajors, logRecommendation } from '@/lib/services'
import { getRecommendations, getRecommendationLabel } from '@/lib/recommendation'
import { IT_FIELDS, PROVINCES, ACCREDITATION_OPTIONS, TUITION_RANGES } from '@/lib/mockData'
import { sanitizePreferences, checkRateLimit, getRateLimitRemaining } from '@/lib/security'
import { usePagination, GridPerPageSelector, PaginationBar } from '@/hooks/usePagination'
import { cn, getAccreditationColor } from '@/lib/utils'

const DEGREE_OPTIONS = [
  'Teknik Informatika','Ilmu Komputer','Sistem Informasi',
  'Sistem Komputer','Teknologi Informasi','Informatika',
  'Rekayasa Perangkat Lunak','Manajemen Informatika',
]

// ─── Score detail bar ──────────────────────────────────────────────
function ScoreDetailBar({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  )
}

// ─── Single recommendation card ────────────────────────────────────
function RecommendationResultCard({ campus, rank }) {
  const [expanded, setExpanded] = useState(false)
  const label = getRecommendationLabel(campus.score)

  return (
    <Card className={cn("border-2 transition-all duration-300",
      campus.score >= 80 ? 'border-emerald-200' :
      campus.score >= 60 ? 'border-blue-200' : 'border-gray-200'
    )}>
      <CardContent className="p-0">
        <div className="h-1.5 w-full rounded-t-2xl overflow-hidden bg-gray-100">
          <div className={cn("h-full transition-all duration-700",
            campus.score >= 80 ? 'bg-emerald-500' :
            campus.score >= 60 ? 'bg-blue-500' :
            campus.score >= 40 ? 'bg-amber-500' : 'bg-red-400'
          )} style={{ width: `${campus.score}%` }} />
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white",
                rank === 1 ? 'bg-amber-500' : rank === 2 ? 'bg-gray-400' : rank === 3 ? 'bg-amber-700' : 'bg-blue-400'
              )}>#{rank}</div>
              <Badge className={cn("text-xs", label.bg, label.color)}>{label.label}</Badge>
            </div>
            <div className={cn("text-2xl font-display font-extrabold", label.color)}>{campus.score}%</div>
          </div>
          <CampusCard campus={campus} showScore={false} />
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-3 font-medium"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Sembunyikan' : 'Lihat'} Detail Skor
          </button>
          {expanded && campus.scoreDetails && (
            <div className="mt-3 space-y-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Breakdown Kecocokan:</p>
              <ScoreDetailBar label="Bidang IT"    value={campus.scoreDetails.itField} />
              <ScoreDetailBar label="Jurusan"      value={campus.scoreDetails.major} />
              <ScoreDetailBar label="Lokasi"       value={campus.scoreDetails.location} />
              <ScoreDetailBar label="Akreditasi"   value={campus.scoreDetails.accreditation} />
              <ScoreDetailBar label="Biaya Kuliah" value={campus.scoreDetails.tuition} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Recommendation results grid with pagination ───────────────────
function RecommendationResults({ results, prefs }) {
  const {
    page, setPage, perPage, changePerPage,
    totalItems, totalPages, pageData, start, end,
  } = usePagination({ data: results, defaultPerPage: 6, storageKey: 'rekom-results' })

  if (results.length === 0) {
    return (
      <Card className="border-dashed border-2 border-blue-200">
        <CardContent className="py-16 text-center">
          <Search className="w-12 h-12 text-blue-200 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">Tidak Ada Hasil</h3>
          <p className="text-muted-foreground text-sm">Coba perluas preferensimu untuk mendapatkan lebih banyak rekomendasi.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-xl">{results.length} Kampus Ditemukan</h2>
          <p className="text-muted-foreground text-sm">Halaman {page}/{totalPages} · diurutkan skor tertinggi</p>
        </div>
        <div className="flex items-center gap-3">
          {prefs.itInterests?.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-1">
              {prefs.itInterests.slice(0, 2).map(f => <Badge key={f} variant="info" className="text-xs">{f}</Badge>)}
              {prefs.itInterests.length > 2 && <Badge variant="secondary" className="text-xs">+{prefs.itInterests.length - 2}</Badge>}
            </div>
          )}
          <GridPerPageSelector value={perPage} onChange={changePerPage} />
        </div>
      </div>

      <AdInline page="rekomendasi" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {pageData.slice(0, Math.ceil(perPage / 2)).map((campus, i) => (
          <RecommendationResultCard key={campus.id} campus={campus} rank={start + i + 1} />
        ))}
      </div>

      {pageData.length > Math.ceil(perPage / 2) && (
        <>
          <AdCard page="rekomendasi" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pageData.slice(Math.ceil(perPage / 2)).map((campus, i) => (
              <RecommendationResultCard key={campus.id} campus={campus} rank={start + Math.ceil(perPage / 2) + i + 1} />
            ))}
          </div>
        </>
      )}

      <PaginationBar page={page} setPage={setPage} totalPages={totalPages}
        totalItems={totalItems} start={start} end={end} />
    </div>
  )
}

// ─── Empty state: database kampus kosong ───────────────────────────
function NoCampusDataState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-blue-100/40 blur-2xl scale-150 pointer-events-none" />
        <motion.div
          className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-200/60 flex items-center justify-center shadow-lg"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Building2 className="w-16 h-16 text-blue-200" />
        </motion.div>
        {/* Floating dots */}
        {[
          { top: '0%',  left: '-15%', delay: 0   },
          { top: '60%', left: '108%', delay: 0.6 },
          { top: '90%', left: '15%',  delay: 1.2 },
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-blue-200/70"
            style={{ top: pos.top, left: pos.left }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: pos.delay }}
          />
        ))}
      </div>

      <h2 className="font-display font-extrabold text-2xl text-foreground mb-3">
        Data Kampus Belum Tersedia
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-2">
        Sistem rekomendasi membutuhkan data kampus untuk bekerja. Database kampus masih kosong atau sedang dimuat.
      </p>
      <p className="text-xs text-muted-foreground/60 mb-8">
        Jika kamu admin, tambahkan data kampus terlebih dahulu melalui dashboard.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4" /> Muat Ulang
        </Button>
        <Button asChild variant="gradient" className="gap-2">
          <Link to="/kampus">
            <Building2 className="w-4 h-4" /> Lihat Halaman Kampus
          </Link>
        </Button>
      </div>

      {/* Tip cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg text-left">
        {[
          { emoji: '⏳', title: 'Sedang Dipersiapkan', desc: 'Admin sedang menambahkan data kampus ke dalam sistem.' },
          { emoji: '🔄', title: 'Coba Lagi', desc: 'Muat ulang halaman beberapa saat lagi untuk mengecek kembali.' },
          { emoji: '📬', title: 'Hubungi Admin', desc: 'Jika kamu admin, login ke dashboard untuk menambah data kampus.' },
        ].map(tip => (
          <div key={tip.title} className="bg-white/80 rounded-2xl p-4 border border-blue-100/60 shadow-sm">
            <div className="text-2xl mb-2">{tip.emoji}</div>
            <p className="font-semibold text-xs text-foreground mb-1">{tip.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Loading skeleton for the form panel ──────────────────────────
function FormSkeleton() {
  return (
    <Card className="sticky top-20 border-blue-100/60 shadow-lg">
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function RecommendationPage() {
  const [searchParams] = useSearchParams()
  const [campuses, setCampuses] = useState([])
  const [majors, setMajors]     = useState([])
  const [results, setResults]   = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading]   = useState(true)   // initial data load
  const [searching, setSearching] = useState(false) // recommendation search
  const [validationError, setValidationError] = useState('')
  const [rateLimited, setRateLimited] = useState(false)

  const [prefs, setPrefs] = useState({
    majorInterest: '',
    itInterests: searchParams.get('field') ? [searchParams.get('field')] : [],
    location: 'Semua Provinsi',
    accreditation: 'any',
    tuitionRange: 'any',
  })

  // Load campus + major data on mount
  useEffect(() => {
    setLoading(true)
    Promise.all([getCampuses(), getMajors()]).then(([c, m]) => {
      setCampuses(c.data || [])
      setMajors(m.data || [])
      setLoading(false)
    })
  }, [])

  // Auto-search if field param is present and data is loaded
  useEffect(() => {
    if (searchParams.get('field') && campuses.length > 0 && !hasSearched) {
      handleSearch()
    }
  }, [campuses.length])

  const isDatabaseEmpty = !loading && campuses.length === 0

  function isFormValid() {
    return (
      prefs.majorInterest !== '' ||
      prefs.itInterests.length > 0 ||
      prefs.location !== 'Semua Provinsi' ||
      prefs.accreditation !== 'any' ||
      prefs.tuitionRange !== 'any'
    )
  }

  function countFilledPrefs() {
    let count = 0
    if (prefs.majorInterest) count++
    if (prefs.itInterests.length > 0) count++
    if (prefs.location !== 'Semua Provinsi') count++
    if (prefs.accreditation !== 'any') count++
    if (prefs.tuitionRange !== 'any') count++
    return count
  }

  function toggleItField(field) {
    setValidationError('')
    setPrefs(p => ({
      ...p,
      itInterests: p.itInterests.includes(field)
        ? p.itInterests.filter(f => f !== field)
        : [...p.itInterests, field],
    }))
  }

  function handleSearch() {
    if (!isFormValid()) {
      setValidationError('Pilih minimal satu preferensi terlebih dahulu untuk mendapatkan rekomendasi.')
      return
    }
    if (!checkRateLimit('recommendation', 15, 60000)) {
      setRateLimited(true)
      setTimeout(() => setRateLimited(false), 10000)
      return
    }
    setValidationError('')
    setRateLimited(false)

    const safe = sanitizePreferences(prefs)
    setSearching(true)
    setTimeout(() => {
      const recs = getRecommendations(safe, campuses, majors)
      setResults(recs)
      setHasSearched(true)
      setSearching(false)
      logRecommendation(safe, recs)
    }, 600)
  }

  function handleReset() {
    setPrefs({ majorInterest: '', itInterests: [], location: 'Semua Provinsi', accreditation: 'any', tuitionRange: 'any' })
    setResults([])
    setHasSearched(false)
    setValidationError('')
    setRateLimited(false)
  }

  const filled = countFilledPrefs()
  const remaining = getRateLimitRemaining('recommendation', 15, 60000)

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      <NotificationBar page="rekomendasi" />
      <AdBanner page="rekomendasi" />

      {/* ── Header ── */}
      <div className="gradient-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-4">
            <Sparkles className="w-4 h-4" />Content Based Filtering
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3">Rekomendasi Kampus IT</h1>
          <p className="text-blue-100 max-w-xl mx-auto">
            {isDatabaseEmpty
              ? 'Database kampus sedang dipersiapkan oleh administrator'
              : 'Isi minimal satu preferensi untuk mendapatkan rekomendasi kampus yang paling cocok'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">

        {/* ── Database empty: full-width state ── */}
        {isDatabaseEmpty ? (
          <NoCampusDataState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── Preference Form (left panel) ── */}
            <div className="lg:col-span-4">
              {loading ? (
                <FormSkeleton />
              ) : (
                <Card className="sticky top-20 border-blue-100/60 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Filter className="w-5 h-5 text-primary" />Preferensi Kamu
                    </CardTitle>
                    <CardDescription>
                      {filled === 0
                        ? 'Isi minimal satu preferensi untuk mulai'
                        : `${filled} preferensi dipilih — semakin banyak semakin akurat`}
                    </CardDescription>

                    {/* Progress bar kelengkapan preferensi */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Kelengkapan preferensi</span>
                        <span>{filled}/5</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500",
                            filled >= 4 ? 'bg-emerald-500' : filled >= 2 ? 'bg-blue-500' : 'bg-amber-400'
                          )}
                          style={{ width: `${(filled / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Validation error */}
                    {validationError && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Rate limit warning */}
                    {rateLimited && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Terlalu banyak pencarian. Tunggu sebentar dan coba lagi.</span>
                      </div>
                    )}

                    {/* Major */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        Jurusan yang Diminati
                        <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
                      </Label>
                      <Select value={prefs.majorInterest} onValueChange={v => { setPrefs(p => ({ ...p, majorInterest: v })); setValidationError('') }}>
                        <SelectTrigger><SelectValue placeholder="Pilih jurusan..." /></SelectTrigger>
                        <SelectContent>
                          {DEGREE_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* IT Fields */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-1.5">
                        Minat Bidang IT
                        {prefs.itInterests.length > 0 && (
                          <Badge variant="info" className="text-xs">{prefs.itInterests.length} dipilih</Badge>
                        )}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {IT_FIELDS.map(field => (
                          <label key={field} className={cn(
                            "flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all text-xs font-medium select-none",
                            prefs.itInterests.includes(field)
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-blue-200 text-muted-foreground hover:bg-muted/50'
                          )}>
                            <Checkbox checked={prefs.itInterests.includes(field)} onCheckedChange={() => toggleItField(field)} />
                            <span className="truncate">{field}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Location */}
                    <div className="space-y-2">
                      <Label>Lokasi Kampus</Label>
                      <Select value={prefs.location} onValueChange={v => { setPrefs(p => ({ ...p, location: v })); setValidationError('') }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Accreditation */}
                    <div className="space-y-2">
                      <Label>Akreditasi Minimum</Label>
                      <Select value={prefs.accreditation} onValueChange={v => { setPrefs(p => ({ ...p, accreditation: v })); setValidationError('') }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACCREDITATION_OPTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tuition */}
                    <div className="space-y-2">
                      <Label>Biaya Kuliah per Semester</Label>
                      <Select value={prefs.tuitionRange} onValueChange={v => { setPrefs(p => ({ ...p, tuitionRange: v })); setValidationError('') }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TUITION_RANGES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSearch}
                        variant={isFormValid() ? 'gradient' : 'secondary'}
                        className="flex-1 gap-2 relative"
                        disabled={searching || rateLimited}
                        title={!isFormValid() ? 'Pilih minimal satu preferensi terlebih dahulu' : ''}
                      >
                        {searching ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menganalisis...</>
                        ) : (
                          <><Search className="w-4 h-4" />Cari Kampus</>
                        )}
                      </Button>
                      {hasSearched && (
                        <Button onClick={handleReset} variant="outline" size="icon">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {!isFormValid() && (
                      <p className="text-xs text-center text-muted-foreground">
                        ☝️ Pilih minimal satu preferensi di atas
                      </p>
                    )}

                    {remaining < 5 && remaining > 0 && (
                      <p className="text-xs text-center text-amber-600">
                        Sisa {remaining} pencarian dalam 1 menit
                      </p>
                    )}

                    <div className="flex gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Semakin banyak preferensi yang diisi, semakin akurat rekomendasinya.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ── Results (right panel) ── */}
            <div className="lg:col-span-8">
              {/* Initial idle state */}
              {!hasSearched && !searching && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-float">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="font-display font-bold text-2xl mb-3">Siap Mencari Kampusmu?</h2>
                  <p className="text-muted-foreground max-w-sm mb-2">
                    Isi minimal satu preferensi di sebelah kiri, lalu klik "Cari Kampus".
                  </p>

                  {/* Jumlah kampus tersedia */}
                  {!loading && campuses.length > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-4 py-2 text-sm font-medium">
                      <Building2 className="w-4 h-4" />
                      {campuses.length} kampus tersedia untuk direkomendasikan
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {['Bidang IT', 'Lokasi', 'Akreditasi', 'Jurusan', 'Biaya'].map(hint => (
                      <span key={hint} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                        {hint}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Searching/loading state */}
              {searching && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-primary rounded-full animate-spin mb-6" />
                  <h3 className="font-display font-semibold text-lg mb-2">Menganalisis Preferensimu...</h3>
                  <p className="text-muted-foreground text-sm">Sistem sedang mencocokkan profilmu dengan data kampus</p>

                  {/* Progress indicator */}
                  <div className="mt-6 flex gap-2">
                    {['Bidang IT', 'Lokasi', 'Akreditasi', 'Biaya'].map((label, i) => (
                      <motion.div
                        key={label}
                        className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.15 }}
                      >
                        ✓ {label}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {hasSearched && !searching && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <RecommendationResults results={results} prefs={prefs} />
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
