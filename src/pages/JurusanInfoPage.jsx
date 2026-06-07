import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Globe, Smartphone, BarChart3, Brain, Shield, Palette, Network,
  Gamepad2, Cpu, ChevronDown, ChevronUp, ArrowRight, Sparkles,
  BookOpen, Clock, Briefcase, TrendingUp, Code2, Database,
  CheckCircle2, XCircle, GitCompare, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/misc'
import { cn } from '@/lib/utils'

// ── Data Jurusan ──────────────────────────────────────────────────
const JURUSAN_LIST = [
  {
    id: 'ti',
    nama: 'Teknik Informatika',
    singkatan: 'TI',
    icon: Code2,
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    deskripsi:
      'Jurusan paling luas di bidang IT. Mempelajari dasar-dasar ilmu komputer, algoritma, pemrograman, hingga pengembangan sistem dan software.',
    fokus: ['Algoritma & Struktur Data', 'Pemrograman (OOP, Fungsional)', 'Pengembangan Software', 'Kecerdasan Buatan', 'Jaringan Komputer', 'Basis Data'],
    karir: ['Software Engineer', 'Full-Stack Developer', 'AI Engineer', 'DevOps Engineer', 'Tech Lead', 'CTO'],
    durasi: '4 tahun (S1)',
    prospek: 95,
    sulitnya: 80,
    matematika: 85,
    coding: 90,
    cocokUntuk: ['Suka logika & problem solving', 'Tertarik semua bidang IT', 'Ingin fleksibilitas karir luas'],
    tidakCocok: ['Tidak suka matematika diskrit', 'Hanya ingin belajar satu tools saja'],
    gajiAwal: 'Rp 6–12 juta/bulan',
    kampusUnggulan: ['ITB', 'UI', 'UGM', 'ITS', 'BINUS'],
  },
  {
    id: 'si',
    nama: 'Sistem Informasi',
    singkatan: 'SI',
    icon: Database,
    color: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800',
    deskripsi:
      'Jembatan antara teknologi dan bisnis. Berfokus pada bagaimana sistem informasi dapat mendukung dan meningkatkan proses bisnis organisasi.',
    fokus: ['Analisis & Perancangan Sistem', 'Manajemen Database', 'ERP & Business Intelligence', 'Audit Sistem', 'Manajemen Proyek IT', 'E-Business'],
    karir: ['Business Analyst', 'System Analyst', 'IT Consultant', 'Project Manager', 'Data Analyst', 'ERP Specialist'],
    durasi: '4 tahun (S1)',
    prospek: 88,
    sulitnya: 65,
    matematika: 65,
    coding: 70,
    cocokUntuk: ['Suka bisnis & teknologi sekaligus', 'Senang analisis & komunikasi', 'Tertarik manajemen proyek'],
    tidakCocok: ['Ingin pure coding', 'Tidak suka aspek bisnis/manajemen'],
    gajiAwal: 'Rp 5–10 juta/bulan',
    kampusUnggulan: ['UI', 'ITS', 'UGM', 'BINUS', 'Tel-U'],
  },
  {
    id: 'ik',
    nama: 'Ilmu Komputer',
    singkatan: 'IK',
    icon: Brain,
    color: 'from-emerald-500 to-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
    deskripsi:
      'Lebih teoritis dan saintifik dibanding Teknik Informatika. Mendalami fondasi matematis komputasi, teori bahasa, dan riset ilmiah di bidang komputer.',
    fokus: ['Teori Bahasa & Automata', 'Machine Learning & AI', 'Komputasi Numerik', 'Riset Algoritma', 'Computer Vision', 'NLP'],
    karir: ['Research Scientist', 'ML Engineer', 'Data Scientist', 'Akademisi/Dosen', 'Quantum Computing', 'AI Researcher'],
    durasi: '4 tahun (S1)',
    prospek: 90,
    sulitnya: 90,
    matematika: 95,
    coding: 85,
    cocokUntuk: ['Suka riset & teori mendalam', 'Kuat matematika (kalkulus, statistik)', 'Ingin karir di AI/ML/Research'],
    tidakCocok: ['Tidak suka pelajaran teori abstrak', 'Ingin langsung kerja tanpa riset'],
    gajiAwal: 'Rp 8–15 juta/bulan',
    kampusUnggulan: ['ITB', 'UI', 'UGM', 'ITS'],
  },
  {
    id: 'sk',
    nama: 'Sistem Komputer',
    singkatan: 'SK',
    icon: Cpu,
    color: 'from-orange-500 to-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800',
    deskripsi:
      'Menggabungkan hardware dan software. Mempelajari arsitektur komputer, embedded system, IoT, hingga robotika dan sistem real-time.',
    fokus: ['Arsitektur Komputer', 'Embedded Systems', 'FPGA & Mikrokontroler', 'IoT', 'Sistem Operasi', 'Robotika'],
    karir: ['Embedded Engineer', 'IoT Developer', 'Hardware Engineer', 'Firmware Developer', 'Robotics Engineer'],
    durasi: '4 tahun (S1)',
    prospek: 82,
    sulitnya: 85,
    matematika: 80,
    coding: 80,
    cocokUntuk: ['Suka hardware & elektronika', 'Tertarik IoT & robotika', 'Suka tantangan sistem low-level'],
    tidakCocok: ['Hanya suka software/web', 'Tidak tertarik fisika & elektronika'],
    gajiAwal: 'Rp 6–11 juta/bulan',
    kampusUnggulan: ['ITB', 'ITS', 'Tel-U', 'UGM'],
  },
  {
    id: 'rpl',
    nama: 'Rekayasa Perangkat Lunak',
    singkatan: 'RPL',
    icon: Code2,
    color: 'from-cyan-500 to-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-800',
    deskripsi:
      'Khusus fokus pada pengembangan software secara profesional: dari analisis kebutuhan, desain, coding, testing, hingga deployment dan maintenance.',
    fokus: ['Software Development Lifecycle', 'Agile & Scrum', 'Software Testing & QA', 'DevOps & CI/CD', 'Clean Code & Design Pattern', 'Mobile & Web Dev'],
    karir: ['Software Engineer', 'QA Engineer', 'DevOps Engineer', 'Scrum Master', 'Mobile Developer'],
    durasi: '4 tahun (S1)',
    prospek: 92,
    sulitnya: 70,
    matematika: 70,
    coding: 95,
    cocokUntuk: ['Suka coding & build produk', 'Tertarik proses pengembangan software', 'Ingin karir di startup/tech company'],
    tidakCocok: ['Tidak suka coding panjang', 'Tidak tertarik proses engineering'],
    gajiAwal: 'Rp 6–13 juta/bulan',
    kampusUnggulan: ['BINUS', 'Tel-U', 'ITS', 'UI'],
  },
  {
    id: 'ds',
    nama: 'Data Science / Sains Data',
    singkatan: 'DS',
    icon: BarChart3,
    color: 'from-yellow-500 to-amber-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800',
    deskripsi:
      'Jurusan baru yang sangat diminati. Gabungan statistik, matematika, dan pemrograman untuk mengekstrak insight dari data besar.',
    fokus: ['Statistika & Probabilitas', 'Machine Learning', 'Big Data & Cloud', 'Visualisasi Data', 'Python & R', 'SQL & NoSQL'],
    karir: ['Data Scientist', 'Data Analyst', 'ML Engineer', 'Business Intelligence', 'Data Engineer'],
    durasi: '4 tahun (S1)',
    prospek: 96,
    sulitnya: 75,
    matematika: 90,
    coding: 75,
    cocokUntuk: ['Suka statistik & matematika', 'Tertarik insight dari data', 'Ingin karir di perusahaan besar'],
    tidakCocok: ['Tidak suka statistik', 'Tidak tertarik angka & pattern'],
    gajiAwal: 'Rp 7–14 juta/bulan',
    kampusUnggulan: ['ITB', 'UI', 'UGM', 'ITS', 'BINUS'],
  },
  {
    id: 'mi',
    nama: 'Manajemen Informatika',
    singkatan: 'MI',
    icon: Briefcase,
    color: 'from-rose-500 to-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800',
    deskripsi:
      'Lebih ringan secara teknis, menggabungkan manajemen dengan informatika. Cocok untuk jenjang D3 atau yang ingin cepat kerja di bidang IT support dan administrasi.',
    fokus: ['Aplikasi Perkantoran', 'Manajemen Database', 'Desain Web Dasar', 'Akuntansi Komputer', 'Administrasi Jaringan', 'E-Commerce'],
    karir: ['IT Support', 'Web Administrator', 'Database Operator', 'IT Staff', 'Technical Support'],
    durasi: '3 tahun (D3) / 4 tahun (S1)',
    prospek: 72,
    sulitnya: 45,
    matematika: 50,
    coding: 55,
    cocokUntuk: ['Ingin cepat kerja di bidang IT', 'Tidak suka coding berat', 'Tertarik administrasi sistem'],
    tidakCocok: ['Ingin jadi software engineer senior', 'Ingin riset atau AI'],
    gajiAwal: 'Rp 4–7 juta/bulan',
    kampusUnggulan: ['UDINUS', 'Tel-U', 'BINUS D3', 'Politeknik'],
  },
]

// ── Perbandingan Side-by-Side ─────────────────────────────────────
const COMPARE_CRITERIA = [
  { key: 'matematika', label: 'Intensitas Matematika', icon: '🔢' },
  { key: 'coding',     label: 'Intensitas Coding',     icon: '💻' },
  { key: 'sulitnya',   label: 'Tingkat Kesulitan',     icon: '🧠' },
  { key: 'prospek',    label: 'Prospek Karir',         icon: '📈' },
]

// ── Komponen ──────────────────────────────────────────────────────
function ScoreBar({ value, color = 'bg-blue-500' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right">{value}%</span>
    </div>
  )
}

function JurusanCard({ jurusan, isSelected, onClick }) {
  const Icon = jurusan.icon
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left rounded-2xl border-2 p-4 transition-all duration-200',
        isSelected
          ? `${jurusan.border} ${jurusan.bg} shadow-lg`
          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br text-white', jurusan.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-display font-bold text-sm leading-tight', isSelected && jurusan.text)}>
            {jurusan.nama}
          </p>
          <Badge className={cn('text-xs mt-1', isSelected ? jurusan.badge : 'bg-slate-100 text-slate-600')}>
            {jurusan.singkatan}
          </Badge>
        </div>
      </div>
    </motion.button>
  )
}

function DetailPanel({ jurusan }) {
  const Icon = jurusan.icon
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      key={jurusan.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className={cn('rounded-2xl p-6 border-2', jurusan.bg, jurusan.border)}>
        <div className="flex items-start gap-4">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg flex-shrink-0', jurusan.color)}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h2 className={cn('font-display font-extrabold text-2xl', jurusan.text)}>{jurusan.nama}</h2>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{jurusan.deskripsi}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" />{jurusan.durasi}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" />Gaji awal: {jurusan.gajiAwal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Skill bars */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Profil Jurusan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {COMPARE_CRITERIA.map(c => (
            <div key={c.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{c.icon} {c.label}</span>
              </div>
              <ScoreBar
                value={jurusan[c.key]}
                color={
                  c.key === 'prospek' ? 'bg-emerald-500' :
                  c.key === 'sulitnya' ? 'bg-red-400' :
                  c.key === 'matematika' ? 'bg-blue-500' : 'bg-purple-500'
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Fokus & Karir */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Yang Dipelajari</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {jurusan.fokus.map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-gradient-to-br', jurusan.color)} />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Prospek Karir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {jurusan.karir.map(k => (
                <span key={k} className={cn('text-xs px-2 py-1 rounded-lg font-medium border', jurusan.badge, jurusan.border)}>
                  {k}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cocok / Tidak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />Cocok untukmu jika...
          </p>
          <ul className="space-y-1.5">
            {jurusan.cocokUntuk.map(p => (
              <li key={p} className="text-xs text-emerald-700 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1.5">
            <XCircle className="w-4 h-4" />Kurang cocok jika...
          </p>
          <ul className="space-y-1.5">
            {jurusan.tidakCocok.map(p => (
              <li key={p} className="text-xs text-red-700 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>{p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Kampus */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Kampus unggulan:</span>
        {jurusan.kampusUnggulan.map(k => (
          <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
        ))}
      </div>

      <Button asChild variant="gradient" className="gap-2 w-full sm:w-auto">
        <Link to="/rekomendasi">
          <Sparkles className="w-4 h-4" />Cari Kampus dengan Jurusan Ini
        </Link>
      </Button>
    </motion.div>
  )
}

// ── Tabel Perbandingan ────────────────────────────────────────────
function TabelPerbandingan() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left p-4 font-semibold text-muted-foreground w-40">Jurusan</th>
            {COMPARE_CRITERIA.map(c => (
              <th key={c.key} className="text-center p-4 font-semibold text-muted-foreground whitespace-nowrap">
                {c.icon} {c.label}
              </th>
            ))}
            <th className="text-center p-4 font-semibold text-muted-foreground">Gaji Awal</th>
          </tr>
        </thead>
        <tbody>
          {JURUSAN_LIST.map((j, idx) => {
            const Icon = j.icon
            return (
              <tr key={j.id} className={cn('border-b border-slate-100 hover:bg-slate-50 transition-colors', idx % 2 === 0 && 'bg-white')}>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0', j.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs leading-tight">{j.singkatan}</p>
                      <p className="text-xs text-muted-foreground">{j.nama.split(' ')[0]}</p>
                    </div>
                  </div>
                </td>
                {COMPARE_CRITERIA.map(c => (
                  <td key={c.key} className="p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full max-w-[80px] h-2 bg-slate-100 rounded-full overflow-hidden mx-auto">
                        <motion.div
                          className={cn('h-full rounded-full',
                            c.key === 'prospek' ? 'bg-emerald-500' :
                            c.key === 'sulitnya' ? 'bg-red-400' :
                            c.key === 'matematika' ? 'bg-blue-500' : 'bg-purple-500'
                          )}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${j[c.key]}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: idx * 0.05 }}
                        />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">{j[c.key]}%</span>
                    </div>
                  </td>
                ))}
                <td className="p-4 text-center">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 whitespace-nowrap">
                    {j.gajiAwal}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function JurusanInfoPage() {
  const [selectedId, setSelectedId] = useState('ti')
  const selected = JURUSAN_LIST.find(j => j.id === selectedId)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="gradient-primary text-white py-14">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-4">
              <BookOpen className="w-4 h-4" />Panduan Jurusan IT
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl mb-4 leading-tight">
              Kenali Jurusan IT<br className="hidden md:block" /> Sebelum Memilih
            </h1>
            <p className="text-blue-100 max-w-2xl mx-auto text-base leading-relaxed">
              Bingung bedanya Teknik Informatika, Ilmu Komputer, dan Sistem Informasi? Panduan lengkap ini membantu kamu memilih jurusan yang paling tepat.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Button asChild size="sm" className="bg-white text-primary hover:bg-blue-50 gap-1.5">
                <a href="#bandingkan"><GitCompare className="w-4 h-4" />Bandingkan Semua</a>
              </Button>
              <Button asChild size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5">
                <Link to="/rekomendasi"><Sparkles className="w-4 h-4" />Cari Kampus Cocok</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="container mx-auto px-4 -mt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Jurusan IT', value: `${JURUSAN_LIST.length}+`, icon: '🎓' },
            { label: 'Pilihan Karir', value: '30+', icon: '💼' },
            { label: 'Kampus IT di Indonesia', value: '200+', icon: '🏛' },
            { label: 'Gaji rata-rata fresh grad', value: '8 Jt', icon: '💰' },
          ].map(s => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm"
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display font-extrabold text-xl text-gradient">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main: selector + detail */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">Pilih Jurusan untuk Detail Lengkap</h2>
          <p className="text-muted-foreground text-sm">Klik salah satu jurusan untuk melihat kurikulum, karir, dan apakah cocok untukmu</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar pilihan jurusan */}
          <div className="lg:col-span-4 space-y-2">
            {JURUSAN_LIST.map(j => (
              <JurusanCard
                key={j.id}
                jurusan={j}
                isSelected={selectedId === j.id}
                onClick={() => setSelectedId(j.id)}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selected && <DetailPanel key={selected.id} jurusan={selected} />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tabel Perbandingan */}
      <div id="bandingkan" className="container mx-auto px-4 pb-16">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-4 py-1.5 text-sm font-semibold mb-3">
            <GitCompare className="w-4 h-4" />Perbandingan Lengkap
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">Semua Jurusan Sekilas</h2>
          <p className="text-muted-foreground text-sm">Lihat dan bandingkan semua jurusan IT secara berdampingan</p>
        </div>
        <TabelPerbandingan />

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />Prospek Karir</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" />Tingkat Kesulitan</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" />Intensitas Matematika</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500" />Intensitas Coding</span>
        </div>
      </div>

      {/* CTA Bottom */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-600 py-14 text-white text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Star className="w-10 h-10 mx-auto mb-4 text-yellow-300" />
            <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-3">Sudah Tahu Jurusan Pilihanmu?</h2>
            <p className="text-blue-100 mb-6 max-w-md mx-auto">
              Temukan kampus terbaik yang menawarkan jurusan tersebut sesuai lokasi, akreditasi, dan budget-mu.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-blue-50 gap-2 font-bold">
                <Link to="/rekomendasi">
                  <Sparkles className="w-5 h-5" />Cari Kampus Rekomendasi
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2">
                <Link to="/kampus">
                  <ArrowRight className="w-5 h-5" />Lihat Semua Kampus
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
