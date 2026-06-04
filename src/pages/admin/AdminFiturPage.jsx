import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Sparkles, GitCompare, TrendingUp,
  Eye, EyeOff, CheckCircle2, AlertTriangle, Info, Save
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/misc'
import { toast } from '@/components/ui/toast'
import { getFeatureFlags, setFeatureFlags } from '@/lib/services'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    key: 'rekomendasi',
    label: 'Rekomendasi Kampus',
    description: 'Fitur rekomendasi kampus IT menggunakan Content Based Filtering. Pengguna dapat mencari kampus sesuai preferensi minat, lokasi, akreditasi, dan biaya.',
    icon: Sparkles,
    route: '/rekomendasi',
    color: 'blue',
    impact: 'Fitur utama — nonaktifkan hanya jika diperlukan maintenance',
  },
  {
    key: 'bandingkan',
    label: 'Perbandingan Kampus',
    description: 'Fitur untuk membandingkan 2–4 kampus secara berdampingan. Menampilkan akreditasi, biaya, jurusan IT, beasiswa, dan skor kekuatan kampus.',
    icon: GitCompare,
    route: '/bandingkan',
    color: 'purple',
    impact: 'Membantu pengambilan keputusan — bisa dinonaktifkan sementara',
  },
  {
    key: 'prediksi',
    label: 'Prediksi Peluang Diterima',
    description: 'Fitur estimasi peluang diterima berdasarkan nilai rata-rata, jalur masuk (SNBP/SNBT/Mandiri), dan jurusan tujuan. Dilengkapi perbandingan multi-jurusan.',
    icon: TrendingUp,
    route: '/prediksi',
    color: 'emerald',
    impact: 'Fitur tambahan — aman dinonaktifkan kapan saja',
  },
]

const COLOR_MAP = {
  blue:   { active: 'bg-blue-50 border-blue-200',    icon: 'bg-blue-100 text-blue-600',    badge: 'bg-blue-100 text-blue-700',    toggle: 'bg-blue-500'   },
  purple: { active: 'bg-purple-50 border-purple-200', icon: 'bg-purple-100 text-purple-600', badge: 'bg-purple-100 text-purple-700', toggle: 'bg-purple-500' },
  emerald:{ active: 'bg-emerald-50 border-emerald-200',icon:'bg-emerald-100 text-emerald-600',badge:'bg-emerald-100 text-emerald-700',toggle:'bg-emerald-500'},
}

function ToggleSwitch({ enabled, onChange, color }) {
  const c = COLOR_MAP[color]
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
        enabled ? c.toggle : 'bg-slate-300'
      )}
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
        animate={{ x: enabled ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

function FeatureCard({ feature, enabled, onChange }) {
  const c = COLOR_MAP[feature.color]
  const Icon = feature.icon
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn(
        "border-2 transition-all duration-300",
        enabled ? c.active : 'bg-white border-slate-200 opacity-75'
      )}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors", enabled ? c.icon : 'bg-slate-100 text-slate-400')}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-display font-bold text-base">{feature.label}</h3>
                <AnimatePresence mode="wait">
                  {enabled ? (
                    <motion.div key="active" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                      <Badge className={cn("text-xs gap-1", c.badge)}>
                        <CheckCircle2 className="w-3 h-3" />Aktif
                      </Badge>
                    </motion.div>
                  ) : (
                    <motion.div key="inactive" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                      <Badge variant="secondary" className="text-xs gap-1 text-slate-500">
                        <EyeOff className="w-3 h-3" />Nonaktif
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">{feature.description}</p>
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{feature.impact}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">{feature.route}</code>
              </div>
            </div>

            {/* Toggle */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <ToggleSwitch enabled={enabled} onChange={onChange} color={feature.color} />
              <span className={cn("text-xs font-semibold", enabled ? 'text-emerald-600' : 'text-slate-400')}>
                {enabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AdminFiturPage() {
  const [flags, setFlags]     = useState({ rekomendasi: true, bandingkan: true, prediksi: true })
  const [saved, setSaved]     = useState(true)
  const [original, setOriginal] = useState(null)

  useEffect(() => {
    const f = getFeatureFlags()
    setFlags(f)
    setOriginal(JSON.stringify(f))
    setSaved(true)
  }, [])

  function handleChange(key, val) {
    setFlags(p => {
      const next = { ...p, [key]: val }
      setSaved(JSON.stringify(next) === original)
      return next
    })
  }

  function handleSave() {
    setFeatureFlags(flags)
    setOriginal(JSON.stringify(flags))
    setSaved(true)
    toast({ title: 'Tersimpan', description: 'Pengaturan fitur berhasil disimpan', variant: 'success' })
    // Dispatch event so Navbar/App can react immediately
    window.dispatchEvent(new Event('feature-flags-changed'))
  }

  function handleReset() {
    const def = { rekomendasi: true, bandingkan: true, prediksi: true }
    setFlags(def)
    setSaved(JSON.stringify(def) === original)
  }

  const activeCount = Object.values(flags).filter(Boolean).length

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Pengaturan Fitur
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aktifkan atau nonaktifkan fitur publik secara real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!saved && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Badge className="bg-amber-100 text-amber-800 gap-1 text-xs">
                <AlertTriangle className="w-3 h-3" />Ada perubahan belum disimpan
              </Badge>
            </motion.div>
          )}
          <Button variant="outline" size="sm" onClick={handleReset}>Reset Default</Button>
          <Button variant="gradient" size="sm" className="gap-2" onClick={handleSave} disabled={saved}>
            <Save className="w-4 h-4" />
            {saved ? 'Tersimpan' : 'Simpan'}
          </Button>
        </div>
      </div>

      {/* Status summary */}
      <Card className="border-blue-100/60 bg-gradient-to-r from-blue-50/40 to-white">
        <CardContent className="p-5">
          <div className="grid grid-cols-3 divide-x divide-blue-100">
            <div className="text-center pr-4">
              <div className="text-3xl font-display font-extrabold text-primary">{activeCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Fitur Aktif</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl font-display font-extrabold text-slate-400">{3 - activeCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Fitur Nonaktif</div>
            </div>
            <div className="text-center pl-4">
              <div className="text-3xl font-display font-extrabold text-emerald-600">3</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total Fitur</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning if all disabled */}
      <AnimatePresence>
        {activeCount === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">Semua fitur dinonaktifkan! Pengguna tidak bisa mengakses fungsi utama website.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature cards */}
      <div className="space-y-4">
        {FEATURES.map(feature => (
          <FeatureCard
            key={feature.key}
            feature={feature}
            enabled={flags[feature.key]}
            onChange={val => handleChange(feature.key, val)}
          />
        ))}
      </div>

      {/* Info box */}
      <Card className="border-blue-100/60 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-semibold">Cara kerja pengaturan fitur:</p>
              <ul className="list-disc ml-4 space-y-0.5 text-blue-700 text-xs">
                <li>Perubahan tersimpan di browser (localStorage) dan langsung berlaku</li>
                <li>Fitur yang dinonaktifkan tidak tampil di navbar dan tidak bisa diakses pengguna</li>
                <li>Untuk kontrol server-side, hubungkan ke tabel <code className="bg-blue-100 px-1 rounded">feature_flags</code> di Supabase</li>
                <li>Klik <strong>Simpan</strong> setelah melakukan perubahan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
