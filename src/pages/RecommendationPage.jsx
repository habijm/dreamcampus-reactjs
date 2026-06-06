import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sparkles, Filter, RotateCcw, Search, Info, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/misc'
import { Progress } from '@/components/ui/misc'
import { Separator } from '@/components/ui/misc'
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

// ─── RecommendationResults with per-page filter ───────────────────
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
      {/* Header + per-page */}
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

      {/* Ad inline */}
      <AdInline page="rekomendasi" />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {pageData.slice(0, Math.ceil(perPage / 2)).map((campus, i) => (
          <RecommendationResultCard key={campus.id} campus={campus} rank={start + i + 1} />
        ))}
      </div>

      {/* Ad card midway */}
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

      {/* Pagination */}
      <PaginationBar page={page} setPage={setPage} totalPages={totalPages}
        totalItems={totalItems} start={start} end={end} />
    </div>
  )
}

export default function RecommendationPage() {
  const [searchParams] = useSearchParams()
  const [campuses, setCampuses] = useState([])
  const [majors, setMajors]     = useState([])
  const [results, setResults]   = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [validationError, setValidationError] = useState('')
  const [rateLimited, setRateLimited] = useState(false)

  const [prefs, setPrefs] = useState({
    majorInterest: '',
    itInterests: searchParams.get('field') ? [searchParams.get('field')] : [],
    location: 'Semua Provinsi',
    accreditation: 'any',
    tuitionRange: 'any',
  })

  useEffect(() => {
    Promise.all([getCampuses(), getMajors()]).then(([c, m]) => {
      setCampuses(c.data || [])
      setMajors(m.data || [])
    })
  }, [])

  useEffect(() => {
    if (searchParams.get('field') && campuses.length > 0) handleSearch()
  }, [campuses.length])

  // Cek apakah minimal ada satu preferensi yang diisi
  function isFormValid() {
    return (
      prefs.majorInterest !== '' ||
      prefs.itInterests.length > 0 ||
      prefs.location !== 'Semua Provinsi' ||
      prefs.accreditation !== 'any' ||
      prefs.tuitionRange !== 'any'
    )
  }

  // Hitung berapa preferensi yang aktif (untuk UX feedback)
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
    // ── Validation ──
    if (!isFormValid()) {
      setValidationError('Pilih minimal satu preferensi terlebih dahulu untuk mendapatkan rekomendasi.')
      return
    }
    // ── Rate limiting ──
    if (!checkRateLimit('recommendation', 15, 60000)) {
      setRateLimited(true)
      setTimeout(() => setRateLimited(false), 10000)
      return
    }
    setValidationError('')
    setRateLimited(false)

    // ── Sanitize sebelum proses ──
    const safe = sanitizePreferences(prefs)

    setLoading(true)
    setTimeout(() => {
      const recs = getRecommendations(safe, campuses, majors)
      setResults(recs)
      setHasSearched(true)
      setLoading(false)
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
      {/* Notification bar */}
      <NotificationBar page="rekomendasi" />
      {/* Ad banner */}
      <AdBanner page="rekomendasi" />

      {/* Header */}
      <div className="gradient-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-4">
            <Sparkles className="w-4 h-4" />Content Based Filtering
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3">Rekomendasi Kampus IT</h1>
          <p className="text-blue-100 max-w-xl mx-auto">
            Isi <strong>minimal satu preferensi</strong> untuk mendapatkan rekomendasi kampus yang paling cocok
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Preference Form ─────────────────────────────────── */}
          <div className="lg:col-span-4">
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

                {/* Progress bar preferensi */}
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
                    disabled={loading || rateLimited}
                    title={!isFormValid() ? 'Pilih minimal satu preferensi terlebih dahulu' : ''}
                  >
                    {loading ? (
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

                {/* Helper text saat form kosong */}
                {!isFormValid() && (
                  <p className="text-xs text-center text-muted-foreground">
                    ☝️ Pilih minimal satu preferensi di atas
                  </p>
                )}

                {/* Rate limit info */}
                {remaining < 5 && remaining > 0 && (
                  <p className="text-xs text-center text-amber-600">
                    Sisa {remaining} pencarian dalam 1 menit
                  </p>
                )}

                {/* Info box */}
                <div className="flex gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Semakin banyak preferensi yang diisi, semakin akurat rekomendasinya.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Results ──────────────────────────────────────────── */}
          <div className="lg:col-span-8">
            {/* Empty state */}
            {!hasSearched && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-float">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-display font-bold text-2xl mb-3">Siap Mencari Kampusmu?</h2>
                <p className="text-muted-foreground max-w-sm mb-2">
                  Isi minimal satu preferensi di sebelah kiri, lalu klik "Cari Kampus".
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {['Bidang IT', 'Lokasi', 'Akreditasi', 'Jurusan', 'Biaya'].map(hint => (
                    <span key={hint} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-primary rounded-full animate-spin mb-6" />
                <h3 className="font-display font-semibold text-lg mb-2">Menganalisis Preferensimu...</h3>
                <p className="text-muted-foreground text-sm">Sistem sedang mencocokkan profilmu dengan data kampus</p>
              </div>
            )}

            {/* Results */}
            {hasSearched && !loading && (
              <RecommendationResults results={results} prefs={prefs} />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
