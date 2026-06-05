import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  GitCompare, Plus, X, Search, CheckCircle2, XCircle,
  ArrowRight, BarChart3, Sparkles, Info, MapPin,
  Award, Banknote, Users, Calendar, Globe, BookOpen,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import { Progress } from '@/components/ui/misc'
import { getCampuses, getMajors } from '@/lib/services'
import { NotificationBar, AdBanner, AdInline } from '@/components/ads/AdsComponents'
import { formatCurrency, getAccreditationColor, cn } from '@/lib/utils'

const MAX_CAMPUSES = 4
const ACCREDITATION_RANK = { 'Unggul': 5, 'A': 5, 'Baik Sekali': 4, 'B': 3, 'Baik': 2, 'C': 1 }

// ── Criteria rows config ──────────────────────────────────────────
const CRITERIA_GROUPS = [
  {
    label: 'Informasi Umum',
    rows: [
      { key: 'type',             label: 'Jenis Kampus',      type: 'text' },
      { key: 'location',         label: 'Kota',              type: 'text' },
      { key: 'province',         label: 'Provinsi',          type: 'text' },
      { key: 'established_year', label: 'Tahun Berdiri',     type: 'text' },
      { key: 'student_count',    label: 'Jumlah Mahasiswa',  type: 'number_fmt' },
    ]
  },
  {
    label: 'Akademik',
    rows: [
      { key: 'accreditation',  label: 'Akreditasi Kampus', type: 'accreditation' },
      { key: 'major_count',    label: 'Jumlah Jurusan IT', type: 'number' },
      { key: 'it_focus_count', label: 'Bidang IT',         type: 'number' },
      { key: 'it_focus',       label: 'Fokus IT',          type: 'tags' },
    ]
  },
  {
    label: 'Keuangan',
    rows: [
      { key: 'min_tuition', label: 'UKT / Biaya Min', type: 'currency' },
      { key: 'max_tuition', label: 'Biaya Maks',      type: 'currency' },
      { key: 'beasiswa',    label: 'Beasiswa',        type: 'boolean' },
    ]
  },
  {
    label: 'Lainnya',
    rows: [
      { key: 'website', label: 'Website',  type: 'link' },
    ]
  },
]

function CampusLogo({ campus, size = 'md' }) {
  const s = { sm: 'w-10 h-10 text-xs', md: 'w-14 h-14 text-sm', lg: 'w-16 h-16 text-base' }
  if (campus.logo_url) return (
    <img src={campus.logo_url} alt={campus.name}
      className={cn("rounded-xl object-contain bg-white border", s[size])} />
  )
  return (
    <div className={cn("rounded-xl gradient-primary text-white font-bold font-display flex items-center justify-center flex-shrink-0", s[size])}>
      {campus.short_name?.slice(0, 3) || campus.name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function CellValue({ row, campus, majors }) {
  const campusMajors = majors.filter(m => m.campus_id === campus.id)
  const value = row.key === 'major_count'    ? campusMajors.length
              : row.key === 'it_focus_count' ? (campus.it_focus || []).length
              : row.key === 'beasiswa'        ? (campus.type === 'Negeri')
              : campus[row.key]

  if (value === null || value === undefined || value === '')
    return <span className="text-muted-foreground text-sm">—</span>

  switch (row.type) {
    case 'accreditation':
      return (
        <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold border", getAccreditationColor(value))}>
          {value}
        </span>
      )
    case 'currency':
      return (
        <span className="text-sm font-semibold text-foreground">
          {value === 0 ? <span className="text-emerald-600 font-bold">Gratis</span> : formatCurrency(value)}
        </span>
      )
    case 'number_fmt':
      return <span className="text-sm font-medium">{Number(value).toLocaleString('id-ID')}</span>
    case 'number':
      return (
        <div className="flex items-center gap-2">
          <span className="text-xl font-display font-extrabold text-primary">{value}</span>
        </div>
      )
    case 'tags':
      return (
        <div className="flex flex-wrap gap-1">
          {(value || []).map(t => (
            <span key={t} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100">{t}</span>
          ))}
        </div>
      )
    case 'boolean':
      return value
        ? <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold"><CheckCircle2 className="w-4 h-4" />Ya</span>
        : <span className="flex items-center gap-1 text-muted-foreground text-sm"><XCircle className="w-4 h-4" />Tidak</span>
    case 'link':
      return value
        ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline flex items-center gap-1 truncate max-w-[120px]">
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            {value.replace(/https?:\/\//, '')}
          </a>
        : <span className="text-muted-foreground text-sm">—</span>
    default:
      return <span className="text-sm text-foreground">{value}</span>
  }
}

// Highlight best value in a row
function isBest(row, campus, allCampuses, majors) {
  if (!['accreditation', 'major_count', 'it_focus_count', 'min_tuition'].includes(row.key)) return false

  const getValue = (c) => {
    const campusMajors = majors.filter(m => m.campus_id === c.id)
    if (row.key === 'major_count') return campusMajors.length
    if (row.key === 'it_focus_count') return (c.it_focus || []).length
    if (row.key === 'accreditation') return ACCREDITATION_RANK[c.accreditation] || 0
    if (row.key === 'min_tuition') return c.min_tuition
    return 0
  }

  const myVal = getValue(campus)
  const allVals = allCampuses.map(getValue)

  if (row.key === 'min_tuition') {
    // Lowest is best
    return myVal === Math.min(...allVals)
  }
  // Highest is best
  return myVal === Math.max(...allVals) && myVal > 0
}

// ── Campus Picker ─────────────────────────────────────────────────
function CampusPicker({ allCampuses, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = allCampuses.filter(c =>
    !selected.some(s => s.id === c.id) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
     c.short_name?.toLowerCase().includes(search.toLowerCase()) ||
     c.location.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Cari nama kampus..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-6">Tidak ada kampus ditemukan</p>
        )}
        {filtered.map(campus => (
          <button
            key={campus.id}
            onClick={() => { onSelect(campus); onClose() }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all text-left group"
          >
            <CampusLogo campus={campus} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{campus.name}</p>
              <p className="text-xs text-muted-foreground">{campus.location} · {campus.accreditation}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function ComparePage() {
  const [allCampuses, setAllCampuses]   = useState([])
  const [allMajors, setAllMajors]       = useState([])
  const [selected, setSelected]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState({})

  useEffect(() => {
    Promise.all([getCampuses(), getMajors()]).then(([c, m]) => {
      setAllCampuses(c.data || [])
      setAllMajors(m.data || [])
      setLoading(false)
    })
  }, [])

  function addCampus(campus) {
    if (selected.length < MAX_CAMPUSES) setSelected(p => [...p, campus])
  }

  function removeCampus(id) {
    setSelected(p => p.filter(c => c.id !== id))
  }

  function toggleGroup(label) {
    setCollapsedGroups(p => ({ ...p, [label]: !p[label] }))
  }

  const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500']
  const LIGHT   = ['bg-blue-50 border-blue-200', 'bg-purple-50 border-purple-200', 'bg-emerald-50 border-emerald-200', 'bg-amber-50 border-amber-200']
  const HEADER  = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500']

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      <NotificationBar page="bandingkan" />
      <AdBanner page="bandingkan" />
      {/* Hero */}
      <div className="gradient-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-4">
            <GitCompare className="w-4 h-4" />
            Bandingkan Kampus
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3">
            Perbandingan Kampus IT
          </h1>
          <p className="text-blue-100 max-w-xl mx-auto">
            Pilih 2–4 kampus dan bandingkan secara berdampingan untuk membantu keputusanmu
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">

        {/* Campus selector bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-display font-semibold text-lg">Pilih Kampus</h2>
            <Badge variant="secondary">{selected.length}/{MAX_CAMPUSES}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {selected.map((campus, i) => (
              <div key={campus.id} className={cn("rounded-2xl border-2 p-4 relative", LIGHT[i])}>
                <button
                  onClick={() => removeCampus(campus.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors z-10"
                >
                  <X className="w-3 h-3 text-red-500" />
                </button>
                <div className="flex flex-col items-center text-center gap-2">
                  <CampusLogo campus={campus} size="md" />
                  <div>
                    <p className="font-display font-bold text-sm leading-tight">{campus.short_name || campus.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{campus.location}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold text-white", COLORS[i])}>
                    Kampus {String.fromCharCode(65 + i)}
                  </span>
                </div>
              </div>
            ))}

            {/* Add button slots */}
            {Array.from({ length: MAX_CAMPUSES - selected.length }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPickerOpen(true)}
                disabled={loading}
                className="rounded-2xl border-2 border-dashed border-blue-200 p-4 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-blue-50 transition-all min-h-[120px] group"
              >
                <div className="w-10 h-10 rounded-xl border-2 border-dashed border-blue-300 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                  <Plus className="w-5 h-5 text-blue-300 group-hover:text-primary" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-primary font-medium">Tambah Kampus</span>
              </button>
            ))}
          </div>
        </div>

        {/* Picker dropdown */}
        {pickerOpen && (
          <Card className="mb-6 border-blue-200 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pilih Kampus untuk Dibandingkan</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setPickerOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CampusPicker
                allCampuses={allCampuses}
                selected={selected}
                onSelect={addCampus}
                onClose={() => setPickerOpen(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {selected.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl animate-float">
              <GitCompare className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-3">Belum Ada Kampus Dipilih</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              Pilih minimal 2 kampus di atas untuk mulai membandingkan secara detail
            </p>
            <Button variant="gradient" className="gap-2" onClick={() => setPickerOpen(true)}>
              <Plus className="w-4 h-4" /> Mulai Pilih Kampus
            </Button>
          </div>
        )}

        {selected.length === 1 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tambahkan minimal 1 kampus lagi untuk memulai perbandingan</p>
          </div>
        )}

        {/* Comparison Table */}
        {selected.length >= 2 && (
          <div className="space-y-4">
            {/* Ad inline di atas tabel perbandingan */}
            <AdInline page="bandingkan" />

            {/* Score bar summary */}
            <Card className="border-blue-100/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Skor Kekuatan Kampus</h3>
                  <span className="text-xs text-muted-foreground">(berdasarkan akreditasi, jurusan IT, dan bidang IT)</span>
                </div>
                <div className="space-y-3">
                  {selected.map((campus, i) => {
                    const campusMajors = allMajors.filter(m => m.campus_id === campus.id)
                    const accScore = (ACCREDITATION_RANK[campus.accreditation] || 1) / 5
                    const majorScore = Math.min(campusMajors.length / 10, 1)
                    const itScore = Math.min((campus.it_focus || []).length / 7, 1)
                    const totalScore = Math.round(((accScore * 0.4 + majorScore * 0.35 + itScore * 0.25)) * 100)
                    return (
                      <div key={campus.id} className="flex items-center gap-3">
                        <span className={cn("text-xs font-bold text-white px-2 py-0.5 rounded-full flex-shrink-0", COLORS[i])}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm font-medium w-32 truncate flex-shrink-0">{campus.short_name || campus.name}</span>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", COLORS[i])}
                            style={{ width: `${totalScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-10 text-right flex-shrink-0">{totalScore}%</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Main comparison table */}
            <div className="rounded-2xl border border-blue-100/60 overflow-hidden shadow-sm">
              {/* Sticky header */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="bg-muted/30 p-4 text-left text-sm font-semibold text-muted-foreground w-40 border-b border-blue-100">
                        Kriteria
                      </th>
                      {selected.map((campus, i) => (
                        <th key={campus.id} className="border-b border-blue-100 p-0">
                          <div className={cn("p-4 text-white", HEADER[i])}>
                            <div className="flex flex-col items-center gap-2 text-center">
                              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xs font-bold">
                                {campus.short_name?.slice(0, 3) || campus.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-display font-bold text-sm leading-tight">{campus.short_name || campus.name}</p>
                                <p className="text-xs opacity-80">{campus.location}</p>
                              </div>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {CRITERIA_GROUPS.map(group => (
                      <>
                        {/* Group header row */}
                        <tr
                          key={`group-${group.label}`}
                          className="cursor-pointer select-none"
                          onClick={() => toggleGroup(group.label)}
                        >
                          <td
                            colSpan={selected.length + 1}
                            className="bg-blue-50/70 border-y border-blue-100 px-4 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-primary uppercase tracking-wide">{group.label}</span>
                              {collapsedGroups[group.label]
                                ? <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                                : <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                              }
                            </div>
                          </td>
                        </tr>

                        {/* Data rows */}
                        {!collapsedGroups[group.label] && group.rows.map(row => (
                          <tr key={row.key} className="border-b border-blue-50 hover:bg-blue-50/30 transition-colors">
                            <td className="p-4 text-sm font-medium text-muted-foreground bg-muted/10 border-r border-blue-50">
                              {row.label}
                            </td>
                            {selected.map((campus, i) => {
                              const best = isBest(row, campus, selected, allMajors)
                              return (
                                <td
                                  key={campus.id}
                                  className={cn(
                                    "p-4 border-r border-blue-50 last:border-r-0 transition-colors",
                                    best && 'bg-emerald-50/50'
                                  )}
                                >
                                  <div className="flex items-start gap-1.5">
                                    <CellValue row={row} campus={campus} majors={allMajors} />
                                    {best && (
                                      <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5">
                                        ✓ Terbaik
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="gradient" className="gap-2">
                <Link to="/rekomendasi">
                  <Sparkles className="w-4 h-4" /> Cari Rekomendasi Personal
                </Link>
              </Button>
              {selected.map(campus => (
                <Button key={campus.id} asChild variant="outline" size="sm" className="gap-1.5">
                  <Link to={`/kampus/${campus.id}`}>
                    <BookOpen className="w-3.5 h-3.5" /> Detail {campus.short_name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
