import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Star, AlertTriangle, XCircle, ChevronRight,
  BookOpen, Target, GraduationCap, Info, RotateCcw, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/misc'
import { Separator } from '@/components/ui/misc'
import { MAJOR_ADMISSION } from '@/lib/mockData'
import { cn } from '@/lib/utils'

// ── Jalur masuk & bobotnya ─────────────────────────────────────────
const JALUR_BOBOT = {
  'SNBP':               { label: 'SNBP (Seleksi Nasional Berbasis Prestasi)', bonus: 2  },
  'SNBT':               { label: 'SNBT (Seleksi Nasional Berbasis Tes)',      bonus: 0  },
  'Mandiri':            { label: 'Mandiri',                                    bonus: -3 },
  'Beasiswa':           { label: 'Beasiswa Prestasi',                         bonus: 5  },
  'SIMAK UI':           { label: 'SIMAK UI',                                  bonus: -2 },
  'UM UGM':             { label: 'UM UGM',                                    bonus: -2 },
  'Mandiri ITS':        { label: 'Mandiri ITS',                               bonus: -2 },
  'Beasiswa Prestasi':  { label: 'Beasiswa Prestasi Telkom',                  bonus: 5  },
  'Mandiri ITC':        { label: 'Mandiri',                                   bonus: -3 },
}

const SEMUA_JALUR = ['SNBP', 'SNBT', 'Mandiri', 'Beasiswa', 'SIMAK UI', 'UM UGM', 'Mandiri ITS', 'Beasiswa Prestasi']

// ── Hitung peluang ─────────────────────────────────────────────────
function calculateChance(score, jalur, majorData) {
  if (!majorData) return null

  const bonus = JALUR_BOBOT[jalur]?.bonus ?? 0
  const adjustedScore = Number(score) + bonus
  const { min_score, high_score, kompetisi } = majorData

  // Skor mentah
  let raw = 0
  if (adjustedScore >= high_score) {
    raw = 85 + Math.min((adjustedScore - high_score) * 1.2, 15)
  } else if (adjustedScore >= min_score) {
    raw = 45 + ((adjustedScore - min_score) / (high_score - min_score)) * 40
  } else if (adjustedScore >= min_score - 5) {
    raw = 15 + ((adjustedScore - (min_score - 5)) / 5) * 30
  } else {
    raw = Math.max(0, 5 + (adjustedScore - (min_score - 10)) * 1.5)
  }

  // Faktor kompetisi (semakin ketat, semakin sulit)
  const competitionFactor = 1 - (kompetisi - 1) * 0.02
  const final = Math.min(98, Math.max(1, Math.round(raw * competitionFactor)))

  let level, color, bg, icon, desc
  if (final >= 70) {
    level = 'Tinggi';  color = 'text-emerald-700'; bg = 'bg-emerald-50 border-emerald-200'
    icon  = Star;      desc  = 'Nilai kamu sangat kompetitif untuk jurusan ini. Tetap persiapkan diri dengan baik!'
  } else if (final >= 40) {
    level = 'Sedang';  color = 'text-amber-700';   bg = 'bg-amber-50 border-amber-200'
    icon  = AlertTriangle; desc = 'Peluang cukup ada, namun perlu persiapan lebih matang dan strategi jalur yang tepat.'
  } else {
    level = 'Rendah';  color = 'text-red-700';     bg = 'bg-red-50 border-red-200'
    icon  = XCircle;   desc  = 'Nilai perlu ditingkatkan atau pertimbangkan jalur/jurusan alternatif.'
  }

  return { pct: final, level, color, bg, icon, desc, adjustedScore, bonus }
}

// ── Komponen progress bar peluang ─────────────────────────────────
function ChanceBar({ pct, level }) {
  const barColor = level === 'Tinggi' ? 'bg-emerald-500' : level === 'Sedang' ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-semibold">
        <span>Estimasi Peluang</span>
        <span>{pct}%</span>
      </div>
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Rendah</span><span>Sedang</span><span>Tinggi</span>
      </div>
    </div>
  )
}

// ── Kartu hasil ────────────────────────────────────────────────────
function ResultCard({ result, major }) {
  const IconComp = result.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn("border-2", result.bg)}>
        <CardContent className="p-6 space-y-5">
          {/* Level badge */}
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm", result.bg, result.color)}>
              <IconComp className="w-4 h-4" />
              Peluang {result.level}
            </div>
            <div className={cn("text-4xl font-display font-extrabold", result.color)}>
              {result.pct}%
            </div>
          </div>

          {/* Progress bar */}
          <ChanceBar pct={result.pct} level={result.level} />

          {/* Description */}
          <p className={cn("text-sm leading-relaxed font-medium", result.color)}>
            {result.desc}
          </p>

          <Separator />

          {/* Detail breakdown */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Nilai Input</p>
              <p className="font-bold text-lg">{result.adjustedScore - result.bonus}</p>
            </div>
            {result.bonus !== 0 && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Penyesuaian Jalur</p>
                <p className={cn("font-bold text-lg", result.bonus > 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {result.bonus > 0 ? '+' : ''}{result.bonus}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs mb-1">Nilai Minimum</p>
              <p className="font-semibold">{major.min_score}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Nilai Ideal</p>
              <p className="font-semibold">{major.high_score}</p>
            </div>
          </div>

          {/* Kompetisi */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tingkat Kompetisi</span>
              <span className="font-semibold">{major.kompetisi}/10</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all",
                  major.kompetisi >= 8 ? 'bg-red-400' : major.kompetisi >= 5 ? 'bg-amber-400' : 'bg-emerald-400'
                )}
                style={{ width: `${major.kompetisi * 10}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function PredictionPage() {
  const [score, setScore]   = useState('')
  const [jalur, setJalur]   = useState('')
  const [majorId, setMajorId] = useState('')
  const [result, setResult] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Unique jurusan options
  const majorOptions = MAJOR_ADMISSION.map(m => ({
    id: m.major_id,
    label: `${m.major_name} — ${m.campus_short}`,
    data: m,
  }))

  const selectedMajor = MAJOR_ADMISSION.find(m => m.major_id === majorId)

  // Jalur available for selected major
  const availableJalur = selectedMajor
    ? SEMUA_JALUR.filter(j => selectedMajor.jalur.includes(j))
    : SEMUA_JALUR

  function handlePredict() {
    if (!score || !jalur || !majorId) return
    const major = MAJOR_ADMISSION.find(m => m.major_id === majorId)
    const res = calculateChance(score, jalur, major)
    setResult(res)
    setHasSearched(true)
  }

  function handleReset() {
    setScore(''); setJalur(''); setMajorId(''); setResult(null); setHasSearched(false)
  }

  // Multi-jurusan comparison
  const [compareMode, setCompareMode] = useState(false)
  const [compareMajors, setCompareMajors] = useState([])

  function addCompare(mid) {
    if (compareMajors.includes(mid) || compareMajors.length >= 5) return
    setCompareMajors(p => [...p, mid])
  }
  function removeCompare(mid) { setCompareMajors(p => p.filter(x => x !== mid)) }

  const compareResults = compareMajors.map(mid => {
    const major = MAJOR_ADMISSION.find(m => m.major_id === mid)
    if (!major || !score || !jalur) return null
    return { major, result: calculateChance(score, jalur, major) }
  }).filter(Boolean)

  const isFormValid = score && jalur && majorId && Number(score) > 0 && Number(score) <= 100

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      {/* Header */}
      <div className="gradient-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-4">
            <TrendingUp className="w-4 h-4" />Prediksi Peluang Diterima
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3">
            Cek Peluang Kamu Diterima
          </h1>
          <p className="text-blue-100 max-w-xl mx-auto">
            Masukkan nilai rata-rata, jalur masuk, dan jurusan tujuan untuk melihat estimasi peluang diterima
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Form Input ─────────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <Card className="sticky top-20 border-blue-100/60 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-primary" />
                  Data Kamu
                </CardTitle>
                <CardDescription>Isi data untuk mendapatkan prediksi akurat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Nilai rata-rata */}
                <div className="space-y-2">
                  <Label htmlFor="score">Nilai Rata-Rata <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="score"
                      type="number"
                      min="0" max="100" step="0.1"
                      placeholder="Contoh: 85.5"
                      value={score}
                      onChange={e => { setScore(e.target.value); setResult(null) }}
                      className="pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">
                      / 100
                    </span>
                  </div>
                  {score && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all",
                            Number(score) >= 85 ? 'bg-emerald-500' :
                            Number(score) >= 70 ? 'bg-amber-500' : 'bg-red-400'
                          )}
                          style={{ width: `${Math.min(100, score)}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-semibold",
                        Number(score) >= 85 ? 'text-emerald-600' :
                        Number(score) >= 70 ? 'text-amber-600' : 'text-red-500'
                      )}>
                        {Number(score) >= 85 ? 'Sangat Baik' : Number(score) >= 70 ? 'Baik' : 'Perlu Ditingkatkan'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Jurusan tujuan */}
                <div className="space-y-2">
                  <Label>Jurusan Tujuan <span className="text-red-500">*</span></Label>
                  <Select value={majorId} onValueChange={v => { setMajorId(v); setJalur(''); setResult(null) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jurusan & kampus..." />
                    </SelectTrigger>
                    <SelectContent>
                      {majorOptions.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Jalur masuk */}
                <div className="space-y-2">
                  <Label>Jalur Masuk <span className="text-red-500">*</span></Label>
                  <Select value={jalur} onValueChange={v => { setJalur(v); setResult(null) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jalur masuk..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedMajor ? selectedMajor.jalur : SEMUA_JALUR).map(j => (
                        <SelectItem key={j} value={j}>
                          {JALUR_BOBOT[j]?.label || j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {jalur && JALUR_BOBOT[jalur] && (
                    <p className={cn("text-xs font-medium",
                      JALUR_BOBOT[jalur].bonus > 0 ? 'text-emerald-600' :
                      JALUR_BOBOT[jalur].bonus < 0 ? 'text-red-500' : 'text-muted-foreground'
                    )}>
                      {JALUR_BOBOT[jalur].bonus > 0
                        ? `✓ Bonus +${JALUR_BOBOT[jalur].bonus} poin (prestasi dinilai lebih)`
                        : JALUR_BOBOT[jalur].bonus < 0
                        ? `⚠ Penyesuaian ${JALUR_BOBOT[jalur].bonus} poin (lebih kompetitif)`
                        : 'Jalur standar tanpa bonus/penalti'}
                    </p>
                  )}
                </div>

                {/* Info box */}
                <div className="flex gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Prediksi bersifat estimasi berdasarkan data historis. Bukan jaminan resmi dari pihak kampus.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handlePredict}
                    variant="gradient"
                    className="flex-1 gap-2"
                    disabled={!isFormValid}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Prediksi
                  </Button>
                  {hasSearched && (
                    <Button onClick={handleReset} variant="outline" size="icon">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Result ─────────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Empty state */}
            {!hasSearched && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-float">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-display font-bold text-2xl mb-3">Cek Peluangmu Sekarang</h2>
                <p className="text-muted-foreground max-w-sm">
                  Isi data di sebelah kiri untuk mendapatkan estimasi peluang diterimamu di jurusan IT pilihan.
                </p>
              </div>
            )}

            {/* Main result */}
            {result && selectedMajor && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display font-bold text-xl">Hasil Prediksi</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedMajor.major_name} — {selectedMajor.campus_short}
                  </p>
                </div>

                <ResultCard result={result} major={selectedMajor} />

                {/* Saran tindak lanjut */}
                <Card className="border-blue-100/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Saran untuk Kamu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.level === 'Rendah' && (
                      <>
                        <p className="text-sm text-muted-foreground">• Tingkatkan nilai rata-rata minimal ke <strong>{selectedMajor.min_score}</strong></p>
                        <p className="text-sm text-muted-foreground">• Pertimbangkan jalur SNBP jika memiliki prestasi akademik</p>
                        <p className="text-sm text-muted-foreground">• Coba jurusan alternatif dengan persaingan lebih rendah</p>
                      </>
                    )}
                    {result.level === 'Sedang' && (
                      <>
                        <p className="text-sm text-muted-foreground">• Targetkan nilai di atas <strong>{selectedMajor.high_score}</strong> untuk peluang tinggi</p>
                        <p className="text-sm text-muted-foreground">• Optimalkan persiapan ujian sesuai jalur masuk yang dipilih</p>
                        <p className="text-sm text-muted-foreground">• Daftarkan beberapa pilihan jurusan sebagai cadangan</p>
                      </>
                    )}
                    {result.level === 'Tinggi' && (
                      <>
                        <p className="text-sm text-muted-foreground">• Pertahankan dan tingkatkan performa akademik</p>
                        <p className="text-sm text-muted-foreground">• Siapkan berkas pendaftaran dari sekarang</p>
                        <p className="text-sm text-muted-foreground">• Ikuti simulasi SNBT / tryout untuk memantapkan persiapan</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Bandingkan dengan jurusan lain */}
                <Card className="border-blue-100/60">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Bandingkan dengan Jurusan Lain</CardTitle>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setCompareMode(!compareMode)}
                        className="text-primary text-xs gap-1"
                      >
                        {compareMode ? 'Tutup' : 'Tambah Perbandingan'}
                        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", compareMode && 'rotate-90')} />
                      </Button>
                    </div>
                  </CardHeader>
                  {compareMode && (
                    <CardContent className="space-y-3">
                      <Select onValueChange={addCompare}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tambah jurusan untuk dibandingkan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {majorOptions.filter(m => m.id !== majorId && !compareMajors.includes(m.id)).map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {compareResults.length > 0 && (
                        <div className="space-y-3 mt-2">
                          {/* Main result row */}
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{selectedMajor.major_name} — {selectedMajor.campus_short}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                                  <div className={cn("h-full rounded-full",
                                    result.level === 'Tinggi' ? 'bg-emerald-500' :
                                    result.level === 'Sedang' ? 'bg-amber-500' : 'bg-red-400'
                                  )} style={{ width: `${result.pct}%` }} />
                                </div>
                                <span className="text-xs font-bold w-10 text-right">{result.pct}%</span>
                              </div>
                            </div>
                            <Badge className={cn("text-xs flex-shrink-0",
                              result.level === 'Tinggi' ? 'bg-emerald-100 text-emerald-800' :
                              result.level === 'Sedang' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            )}>{result.level}</Badge>
                          </div>

                          {compareResults.map(({ major, result: r }, i) => (
                            <div key={major.major_id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                              <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{major.major_name} — {major.campus_short}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full",
                                      r.level === 'Tinggi' ? 'bg-emerald-500' :
                                      r.level === 'Sedang' ? 'bg-amber-500' : 'bg-red-400'
                                    )} style={{ width: `${r.pct}%` }} />
                                  </div>
                                  <span className="text-xs font-bold w-10 text-right">{r.pct}%</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge className={cn("text-xs",
                                  r.level === 'Tinggi' ? 'bg-emerald-100 text-emerald-800' :
                                  r.level === 'Sedang' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                )}>{r.level}</Badge>
                                <button onClick={() => removeCompare(major.major_id)} className="text-muted-foreground hover:text-red-500 ml-1">
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
