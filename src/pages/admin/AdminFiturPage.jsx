import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, GitCompare, TrendingUp, RefreshCw,
  Globe, Info, CheckCircle2, XCircle, AlertTriangle,
  Shield, Wifi, WifiOff, Eye, EyeOff, Save
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/misc'
import { toast } from '@/components/ui/toast'
import {
  getFeatureFlags, setFeatureFlags,
  subscribeFlags, isFlagsGlobal, DEFAULT_FLAGS
} from '@/lib/featureFlags'
import { cn } from '@/lib/utils'

// ─── Feature definitions ───────────────────────────────────────────
const FEATURES = [
  {
    key:         'rekomendasi',
    label:       'Sistem Rekomendasi',
    description: 'Halaman rekomendasi kampus berbasis Content Based Filtering. Siswa mengisi preferensi dan mendapatkan daftar kampus yang cocok.',
    icon:        Sparkles,
    color:       'text-blue-600',
    bg:          'bg-blue-50',
    border:      'border-blue-200',
    activeBg:    'bg-blue-600',
    route:       '/rekomendasi',
    impact:      'Tinggi — fitur utama platform',
  },
  {
    key:         'bandingkan',
    label:       'Bandingkan Kampus',
    description: 'Fitur perbandingan kampus side-by-side. Pengguna bisa memilih 2–4 kampus dan melihat perbedaan detail secara visual.',
    icon:        GitCompare,
    color:       'text-purple-600',
    bg:          'bg-purple-50',
    border:      'border-purple-200',
    activeBg:    'bg-purple-600',
    route:       '/bandingkan',
    impact:      'Sedang — fitur pendukung',
  },
  {
    key:         'prediksi',
    label:       'Prediksi Peluang',
    description: 'Halaman prediksi peluang masuk berdasarkan nilai dan statistik historis. Data bersifat estimasi, bukan jaminan.',
    icon:        TrendingUp,
    color:       'text-emerald-600',
    bg:          'bg-emerald-50',
    border:      'border-emerald-200',
    activeBg:    'bg-emerald-600',
    route:       '/prediksi',
    impact:      'Sedang — fitur eksperimental',
  },
]

// ─── Toggle Switch ─────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        checked  ? 'bg-emerald-500'  : 'bg-slate-300',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <span className={cn(
        'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300',
        checked ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}

// ─── Feature Card ──────────────────────────────────────────────────
function FeatureCard({ feature, enabled, onChange, saving, pendingKey }) {
  const Icon      = feature.icon
  const isSaving  = saving && pendingKey === feature.key

  return (
    <div className={cn(
      'rounded-2xl border-2 p-5 transition-all duration-300',
      enabled
        ? `${feature.border} bg-white shadow-sm`
        : 'border-slate-200 bg-slate-50/60'
    )}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
          enabled ? feature.bg : 'bg-slate-100'
        )}>
          <Icon className={cn('w-5 h-5 transition-colors duration-300', enabled ? feature.color : 'text-slate-400')} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={cn(
              'font-display font-bold text-base transition-colors duration-200',
              enabled ? 'text-foreground' : 'text-slate-400'
            )}>
              {feature.label}
            </h3>
            {enabled
              ? <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">Aktif</Badge>
              : <Badge variant="secondary" className="text-xs text-slate-500">Nonaktif</Badge>
            }
          </div>
          <p className={cn(
            'text-sm leading-relaxed transition-colors duration-200',
            enabled ? 'text-muted-foreground' : 'text-slate-400'
          )}>
            {feature.description}
          </p>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <a
              href={feature.route}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium transition-colors',
                enabled ? 'text-blue-600 hover:text-blue-800' : 'text-slate-400 cursor-not-allowed pointer-events-none'
              )}
            >
              <Eye className="w-3 h-3" />
              Lihat halaman
            </a>
            <span className="text-slate-300">·</span>
            <span className={cn(
              'text-xs',
              enabled ? 'text-muted-foreground' : 'text-slate-400'
            )}>
              {feature.impact}
            </span>
            <span className={cn(
              'text-xs font-medium',
              enabled ? 'text-slate-500' : 'text-slate-400'
            )}>
              Rute: <code className="font-mono bg-slate-100 px-1 rounded">{feature.route}</code>
            </span>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          {isSaving
            ? <div className="w-7 h-7 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            : <ToggleSwitch
                checked={enabled}
                onChange={v => onChange(feature.key, v)}
                disabled={saving}
              />
          }
          <span className={cn(
            'text-xs font-semibold',
            enabled ? 'text-emerald-600' : 'text-slate-400'
          )}>
            {enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Warning saat dinonaktifkan */}
      {!enabled && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Halaman <code className="font-mono bg-amber-100 px-1 rounded">{feature.route}</code> akan
            menampilkan pesan "Fitur Sedang Tidak Tersedia" untuk semua pengunjung.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Storage Mode Banner ───────────────────────────────────────────
function StorageModeBanner({ isGlobal }) {
  if (isGlobal) {
    return (
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <Wifi className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-800">
          <p className="font-semibold mb-0.5">Mode Global — Terhubung ke Supabase</p>
          <p className="text-emerald-700">
            Perubahan flag akan tersimpan di database dan berlaku di <strong>semua browser dan pengguna</strong> secara real-time.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
      <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800">
        <p className="font-semibold mb-0.5">Mode Demo — Tanpa Database</p>
        <p className="text-amber-700 mb-2">
          Karena tidak terhubung ke Supabase, perubahan flag hanya berlaku di <strong>tab yang sama</strong> (in-memory) dan tab lain di browser yang sama (BroadcastChannel). Browser berbeda tidak akan terpengaruh.
        </p>
        <p className="text-amber-600 text-xs">
          Untuk flag yang berlaku global, hubungkan ke Supabase dan buat tabel <code className="font-mono bg-amber-100 px-1 rounded">feature_flags</code>.
          Lihat console browser untuk SQL yang perlu dijalankan.
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function AdminFiturPage() {
  const [flags, setFlags]       = useState(null)   // null = loading
  const [saving, setSaving]     = useState(false)
  const [pendingKey, setPendingKey] = useState(null)
  const [lastSaved, setLastSaved]   = useState(null)
  const [liveUpdate, setLiveUpdate] = useState(false) // indikator real-time update
  const isGlobal = isFlagsGlobal()
  const liveTimer = useRef(null)

  // ── Load flags on mount ──
  async function loadFlags() {
    const f = await getFeatureFlags()
    setFlags(f)
  }

  useEffect(() => {
    loadFlags()

    // Subscribe perubahan real-time (Supabase) atau BroadcastChannel (mock)
    const unsub = subscribeFlags(newFlags => {
      setFlags({ ...newFlags })
      // Flash indikator "diperbarui dari luar"
      setLiveUpdate(true)
      clearTimeout(liveTimer.current)
      liveTimer.current = setTimeout(() => setLiveUpdate(false), 3000)
      toast({
        title: '🔄 Flag Diperbarui',
        description: 'Perubahan dari browser/sesi lain sudah diterapkan.',
        variant: 'default',
      })
    })

    return () => {
      unsub()
      clearTimeout(liveTimer.current)
    }
  }, [])

  // ── Toggle single feature ──
  async function handleToggle(key, value) {
    if (saving) return
    const prev = { ...flags }
    const next = { ...flags, [key]: value }

    // Optimistic update
    setFlags(next)
    setSaving(true)
    setPendingKey(key)

    const result = await setFeatureFlags(next)

    if (!result.success) {
      // Rollback
      setFlags(prev)
      toast({
        title: 'Gagal Menyimpan',
        description: result.error || 'Terjadi kesalahan. Coba lagi.',
        variant: 'destructive',
      })
    } else {
      setLastSaved(new Date())
      const featureName = FEATURES.find(f => f.key === key)?.label || key
      toast({
        title: value ? `✅ ${featureName} Diaktifkan` : `🚫 ${featureName} Dinonaktifkan`,
        description: isGlobal
          ? 'Perubahan berlaku global untuk semua pengguna.'
          : result.warning || 'Perubahan tersimpan.',
        variant: value ? 'success' : 'default',
      })

      // Jika mode demo, tampilkan peringatan scope
      if (!isGlobal && result.warning) {
        setTimeout(() => {
          toast({
            title: '⚠️ Catatan Mode Demo',
            description: 'Flag hanya berlaku di browser ini. Hubungkan Supabase untuk flag global.',
            variant: 'default',
          })
        }, 1500)
      }
    }

    setSaving(false)
    setPendingKey(null)
  }

  // ── Reset semua ke default ──
  async function handleReset() {
    if (saving) return
    const prev = { ...flags }
    setFlags({ ...DEFAULT_FLAGS })
    setSaving(true)

    const result = await setFeatureFlags(DEFAULT_FLAGS)
    if (!result.success) {
      setFlags(prev)
      toast({ title: 'Gagal Reset', description: result.error, variant: 'destructive' })
    } else {
      setLastSaved(new Date())
      toast({ title: 'Berhasil direset ke default', description: 'Semua fitur aktif kembali.', variant: 'success' })
    }
    setSaving(false)
  }

  // ── Refresh manual ──
  async function handleRefresh() {
    const { invalidateFlagsCache } = await import('@/lib/featureFlags')
    invalidateFlagsCache()
    await loadFlags()
    toast({ title: 'Flag diperbarui dari server', variant: 'success' })
  }

  const allActive   = flags && Object.values(flags).every(Boolean)
  const allInactive = flags && Object.values(flags).every(v => !v)

  return (
    <div className="space-y-6 w-full min-w-0 max-w-3xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl">Manajemen Fitur</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aktifkan atau nonaktifkan fitur halaman untuk semua pengguna
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live update indicator */}
          {liveUpdate && (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Diperbarui
            </span>
          )}
          <Button
            variant="outline" size="sm"
            className="gap-2" onClick={handleRefresh}
            disabled={saving}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', saving && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Storage mode banner ── */}
      <StorageModeBanner isGlobal={isGlobal} />

      {/* ── Loading ── */}
      {flags === null ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-slate-100 p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="w-12 h-7 rounded-full flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── Status summary ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Aktif',
                val:   Object.values(flags).filter(Boolean).length,
                icon:  CheckCircle2,
                color: 'text-emerald-600',
                bg:    'bg-emerald-50',
              },
              {
                label: 'Nonaktif',
                val:   Object.values(flags).filter(v => !v).length,
                icon:  XCircle,
                color: 'text-red-500',
                bg:    'bg-red-50',
              },
              {
                label: 'Total',
                val:   Object.values(flags).length,
                icon:  Shield,
                color: 'text-blue-600',
                bg:    'bg-blue-50',
              },
            ].map(s => (
              <Card key={s.label} className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                    <s.icon className={cn('w-4 h-4', s.color)} />
                  </div>
                  <div>
                    <p className="font-display font-extrabold text-xl leading-none">{s.val}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Feature cards ── */}
          <div className="space-y-4">
            {FEATURES.map(feature => (
              <FeatureCard
                key={feature.key}
                feature={feature}
                enabled={!!flags[feature.key]}
                onChange={handleToggle}
                saving={saving}
                pendingKey={pendingKey}
              />
            ))}
          </div>

          {/* ── Bulk actions ── */}
          <Card className="border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Aksi Massal</CardTitle>
              <CardDescription className="text-xs">
                Aktifkan atau nonaktifkan semua fitur sekaligus
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline" size="sm"
                disabled={saving || allActive}
                className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={() => {
                  const all = Object.fromEntries(FEATURES.map(f => [f.key, true]))
                  Object.entries(all).forEach(([k, v], i) => {
                    setTimeout(() => handleToggle(k, v), i * 200)
                  })
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Aktifkan Semua
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={saving || allInactive}
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  const all = Object.fromEntries(FEATURES.map(f => [f.key, false]))
                  Object.entries(all).forEach(([k, v], i) => {
                    setTimeout(() => handleToggle(k, v), i * 200)
                  })
                }}
              >
                <XCircle className="w-3.5 h-3.5" /> Nonaktifkan Semua
              </Button>
              <Button
                variant="ghost" size="sm"
                disabled={saving}
                className="gap-2 text-slate-600 hover:bg-slate-100 ml-auto"
                onClick={handleReset}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset ke Default
              </Button>
            </CardContent>
          </Card>

          {/* ── Last saved info ── */}
          {lastSaved && (
            <p className="text-xs text-center text-muted-foreground">
              Terakhir disimpan: {lastSaved.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {isGlobal && ' · Berlaku global'}
            </p>
          )}

          {/* ── Info box ── */}
          <Card className="border-blue-100 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 space-y-1.5">
                  <p className="font-semibold">Cara Kerja Feature Flag:</p>
                  <ul className="list-disc ml-4 space-y-1 text-blue-700">
                    <li>
                      <strong>Mode Supabase (Global)</strong> — flag disimpan di tabel{' '}
                      <code className="font-mono bg-blue-100 px-1 rounded">feature_flags</code>{' '}
                      dan dibaca setiap pengguna membuka halaman. Perubahan langsung berlaku untuk semua.
                    </li>
                    <li>
                      <strong>Mode Demo</strong> — flag disimpan di memori tab ini.
                      Tab lain di browser yang sama akan sync via BroadcastChannel.
                      Browser berbeda tidak terpengaruh.
                    </li>
                    <li>
                      Halaman yang dinonaktifkan menampilkan pesan "Fitur Sedang Tidak Tersedia".
                    </li>
                    <li>
                      Flag dibaca ulang tiap kali halaman publik dimuat (cache 10 detik).
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Supabase SQL setup helper (only in mock mode) ── */}
          {!isGlobal && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  Cara Membuat Flag Global (Supabase)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Jalankan SQL berikut di Supabase SQL Editor, lalu isi{' '}
                  <code className="font-mono bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> dan{' '}
                  <code className="font-mono bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>{' '}
                  di file <code className="font-mono bg-slate-100 px-1 rounded">.env</code>:
                </p>
                <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed font-mono">
{`CREATE TABLE feature_flags (
  id          integer PRIMARY KEY DEFAULT 1,
  flags       jsonb   NOT NULL
              DEFAULT '{"rekomendasi":true,
                        "bandingkan":true,
                        "prediksi":true}'::jsonb,
  updated_at  timestamptz DEFAULT now()
);

INSERT INTO feature_flags (id, flags)
VALUES (1, '{"rekomendasi":true,
             "bandingkan":true,
             "prediksi":true}')
ON CONFLICT (id) DO NOTHING;

-- Aktifkan RLS
ALTER TABLE feature_flags
  ENABLE ROW LEVEL SECURITY;

-- Izinkan semua operasi (admin sudah auth)
CREATE POLICY "allow_all" ON feature_flags
  FOR ALL USING (true) WITH CHECK (true);

-- Aktifkan Realtime
ALTER PUBLICATION supabase_realtime
  ADD TABLE feature_flags;`}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
