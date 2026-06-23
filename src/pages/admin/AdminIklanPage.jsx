import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Bell, Plus, Pencil, Trash2, Eye, EyeOff,
  Save, X, Info, AlertTriangle, CheckCircle2, Zap,
  ExternalLink, RotateCcw, Wifi, WifiOff, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/misc'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/misc'
import { Checkbox } from '@/components/ui/misc'
import { Separator } from '@/components/ui/misc'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/misc'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import {
  getAdsConfig, setAdsConfig,
  subscribeAdsConfig, invalidateAdsCache, isAdsGlobal,
  DEFAULT_ADS, DEFAULT_NOTIFICATIONS,
} from '@/lib/adsManager'
import { cn } from '@/lib/utils'

const PAGE_OPTIONS = [
  { value: 'all',        label: 'Semua Halaman' },
  { value: 'rekomendasi',label: 'Rekomendasi' },
  { value: 'kampus',     label: 'Kampus' },
  { value: 'prediksi',   label: 'Prediksi Peluang' },
  { value: 'bandingkan', label: 'Bandingkan' },
]
const AD_TYPE_OPTIONS = [
  { value: 'banner', label: 'Banner (atas halaman, bisa ditutup)' },
  { value: 'card',   label: 'Card (dalam konten, sidebar)' },
  { value: 'inline', label: 'Inline (antar konten)' },
]
const COLOR_OPTIONS = ['blue','purple','emerald','amber']
const NOTIF_TYPES   = ['info','warning','success','urgent']

const NOTIF_STYLE = {
  info:    { icon: Info,          color: 'text-blue-600',   bg: 'bg-blue-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50' },
  success: { icon: CheckCircle2,  color: 'text-emerald-600',bg: 'bg-emerald-50' },
  urgent:  { icon: Zap,           color: 'text-red-600',    bg: 'bg-red-50' },
}

const AD_COLORS_CSS = {
  blue:    'bg-blue-50 border-blue-200 text-blue-900',
  purple:  'bg-purple-50 border-purple-200 text-purple-900',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  amber:   'bg-amber-50 border-amber-200 text-amber-900',
}

function genId(prefix) { return `${prefix}-${Date.now()}` }

// ─── Storage Mode Banner ───────────────────────────────────────────
function StorageModeBanner({ isGlobal, liveUpdate }) {
  if (isGlobal) {
    return (
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <Wifi className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-800">
          <p className="font-semibold mb-0.5">Mode Global — Terhubung ke Supabase</p>
          <p className="text-emerald-700">
            Perubahan iklan & notifikasi akan tersimpan di database dan berlaku di{' '}
            <strong>semua browser dan pengguna</strong> secara real-time.
          </p>
        </div>
        {liveUpdate && (
          <span className="ml-auto flex-shrink-0 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Diperbarui
          </span>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
      <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800">
        <p className="font-semibold mb-0.5">Mode Demo — Tanpa Database</p>
        <p className="text-amber-700 mb-2">
          Perubahan hanya berlaku di <strong>tab yang sama</strong>. Tab lain di browser yang
          sama akan sync via BroadcastChannel. Browser lain tidak terpengaruh.
        </p>
        <p className="text-amber-600 text-xs">
          Untuk perubahan global, hubungkan Supabase dan buat tabel{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">ads_config</code>.
        </p>
      </div>
    </div>
  )
}

// ─── Ad Form Dialog ────────────────────────────────────────────────
const EMPTY_AD = { id: '', title: '', description: '', url: '', cta: 'Pelajari', type: 'banner', position: 'all', active: true, color: 'blue' }

function AdDialog({ open, onClose, initial, onSave }) {
  const [form, setForm] = useState(EMPTY_AD)
  useEffect(() => { setForm(initial ? { ...initial } : { ...EMPTY_AD, id: genId('ad') }) }, [initial, open])
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Iklan' : 'Tambah Iklan Baru'}</DialogTitle>
          <DialogDescription>Iklan ditampilkan secara tidak mengganggu dan bisa ditutup pengguna</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Judul Iklan *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Tryout SNBT Gratis" required />
          </div>
          <div className="space-y-1.5">
            <Label>Deskripsi</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Deskripsi singkat iklan..." />
          </div>
          <div className="space-y-1.5">
            <Label>URL Tujuan *</Label>
            <Input type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://example.com" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Teks Tombol</Label>
              <Input value={form.cta} onChange={e => set('cta', e.target.value)} placeholder="Daftar Sekarang" />
            </div>
            <div className="space-y-1.5">
              <Label>Warna</Label>
              <Select value={form.color} onValueChange={v => set('color', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipe Tampilan</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AD_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Halaman Tampil</Label>
              <Select value={form.position} onValueChange={v => set('position', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.active} onCheckedChange={v => set('active', v)} />
            <span className="text-sm font-medium">Aktifkan iklan ini</span>
          </label>

          {/* Preview */}
          {form.title && (
            <div className={cn("rounded-xl border-2 p-3 text-xs", AD_COLORS_CSS[form.color])}>
              <div className="flex items-center gap-2">
                <span className="opacity-40 text-[9px] font-bold uppercase tracking-wider">Iklan</span>
                <span className="font-semibold flex-1 truncate">{form.title}</span>
                {form.description && <span className="opacity-70 hidden sm:block truncate max-w-[120px]">{form.description}</span>}
                <span className="bg-current/20 text-current px-2 py-0.5 rounded font-semibold">{form.cta || 'CTA'}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="gradient" onClick={() => { if (form.title && form.url) { onSave(form); onClose() } }}
            disabled={!form.title || !form.url}>
            <Save className="w-4 h-4 mr-2" />{initial ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Notification Form Dialog ──────────────────────────────────────
const EMPTY_NOTIF = { id: '', title: '', message: '', type: 'info', position: 'all', active: true, dismissable: true, link: '', linkText: '' }

function NotifDialog({ open, onClose, initial, onSave }) {
  const [form, setForm] = useState(EMPTY_NOTIF)
  useEffect(() => { setForm(initial ? { ...initial } : { ...EMPTY_NOTIF, id: genId('notif') }) }, [initial, open])
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const s = NOTIF_STYLE[form.type] || NOTIF_STYLE.info
  const Icon = s.icon

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Notifikasi' : 'Tambah Notifikasi'}</DialogTitle>
          <DialogDescription>Notifikasi tampil sebagai bar tipis di atas halaman</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Judul *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="📅 Pengumuman Penting" required />
          </div>
          <div className="space-y-1.5">
            <Label>Pesan *</Label>
            <Textarea value={form.message} onChange={e => set('message', e.target.value)} rows={2} placeholder="Isi pesan notifikasi..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NOTIF_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Halaman</Label>
              <Select value={form.position} onValueChange={v => set('position', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Link (opsional)</Label>
              <Input value={form.link} onChange={e => set('link', e.target.value)} placeholder="/kampus" />
            </div>
            <div className="space-y-1.5">
              <Label>Teks Link</Label>
              <Input value={form.linkText} onChange={e => set('linkText', e.target.value)} placeholder="Lihat Selengkapnya" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.active} onCheckedChange={v => set('active', v)} />
              <span className="text-sm font-medium">Aktif</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.dismissable} onCheckedChange={v => set('dismissable', v)} />
              <span className="text-sm font-medium">Bisa ditutup user</span>
            </label>
          </div>

          {/* Preview */}
          {form.title && (
            <div className={cn("flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs", s.bg)}>
              <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", s.color)} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold">{form.title} </span>
                <span className="opacity-80">{form.message}</span>
              </div>
              {form.dismissable && <X className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button variant="gradient" onClick={() => { if (form.title && form.message) { onSave(form); onClose() } }}
            disabled={!form.title || !form.message}>
            <Save className="w-4 h-4 mr-2" />{initial ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Supabase SQL setup helper ─────────────────────────────────────
function SupabaseSQLHelper() {
  return (
    <Card className="border-slate-200 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          Cara Membuat Tabel Global (Supabase)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Jalankan SQL berikut di Supabase SQL Editor agar perubahan iklan & notifikasi berlaku global:
        </p>
        <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed font-mono">
{`CREATE TABLE ads_config (
  id            integer PRIMARY KEY DEFAULT 1,
  ads           jsonb   NOT NULL DEFAULT '[]'::jsonb,
  notifications jsonb   NOT NULL DEFAULT '[]'::jsonb,
  updated_at    timestamptz DEFAULT now()
);

INSERT INTO ads_config (id, ads, notifications)
VALUES (1, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Aktifkan RLS
ALTER TABLE ads_config
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON ads_config
  FOR ALL USING (true) WITH CHECK (true);

-- Aktifkan Realtime
ALTER PUBLICATION supabase_realtime
  ADD TABLE ads_config;`}
        </pre>
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function AdminIklanPage() {
  const [ads, setAdsState]           = useState([])
  const [notifs, setNotifsState]     = useState([])
  const [loading, setLoading]        = useState(true)
  const [saving, setSaving]          = useState(false)
  const [liveUpdate, setLiveUpdate]  = useState(false)
  const [adDialog, setAdDialog]      = useState({ open: false, item: null })
  const [notifDialog, setNotifDialog] = useState({ open: false, item: null })
  const liveTimer = useRef(null)

  const global = isAdsGlobal()

  // ── Load & subscribe ──
  async function loadConfig() {
    setLoading(true)
    const { ads: a, notifs: n } = await getAdsConfig()
    setAdsState(a)
    setNotifsState(n)
    setLoading(false)
  }

  useEffect(() => {
    loadConfig()

    const unsub = subscribeAdsConfig(({ ads: newAds, notifs: newNotifs }) => {
      setAdsState(newAds)
      setNotifsState(newNotifs)
      setLiveUpdate(true)
      clearTimeout(liveTimer.current)
      liveTimer.current = setTimeout(() => setLiveUpdate(false), 3000)
      toast({
        title: '🔄 Iklan/Notifikasi Diperbarui',
        description: 'Perubahan dari sesi lain sudah diterapkan.',
      })
    })

    return () => {
      unsub()
      clearTimeout(liveTimer.current)
    }
  }, [])

  // ── Generic save helper ──
  async function persist(newAds, newNotifs) {
    setSaving(true)
    const result = await setAdsConfig(newAds, newNotifs)
    setSaving(false)
    if (!result.success) {
      toast({ title: 'Gagal Menyimpan', description: result.error, variant: 'destructive' })
      return false
    }
    if (result.warning) {
      toast({ title: '⚠️ Mode Demo', description: result.warning })
    }
    return true
  }

  // ── Ads CRUD ──
  async function saveAd(ad) {
    const next = ads.find(a => a.id === ad.id)
      ? ads.map(a => a.id === ad.id ? ad : a)
      : [...ads, ad]
    const ok = await persist(next, notifs)
    if (ok) {
      setAdsState(next)
      toast({ title: 'Tersimpan', description: 'Iklan berhasil disimpan', variant: 'success' })
    }
  }

  async function deleteAd(id) {
    const next = ads.filter(a => a.id !== id)
    const ok = await persist(next, notifs)
    if (ok) {
      setAdsState(next)
      toast({ title: 'Dihapus', description: 'Iklan berhasil dihapus' })
    }
  }

  async function toggleAd(id) {
    const next = ads.map(a => a.id === id ? { ...a, active: !a.active } : a)
    const ok = await persist(next, notifs)
    if (ok) {
      setAdsState(next)
      const ad = next.find(a => a.id === id)
      toast({
        title: ad?.active ? '✅ Iklan Diaktifkan' : '🚫 Iklan Dinonaktifkan',
        description: global ? 'Berlaku untuk semua pengguna.' : 'Berlaku di browser ini.',
        variant: ad?.active ? 'success' : 'default',
      })
    }
  }

  // ── Notifs CRUD ──
  async function saveNotif(n) {
    const next = notifs.find(x => x.id === n.id)
      ? notifs.map(x => x.id === n.id ? n : x)
      : [...notifs, n]
    const ok = await persist(ads, next)
    if (ok) {
      setNotifsState(next)
      toast({ title: 'Tersimpan', description: 'Notifikasi berhasil disimpan', variant: 'success' })
    }
  }

  async function deleteNotif(id) {
    const next = notifs.filter(n => n.id !== id)
    const ok = await persist(ads, next)
    if (ok) {
      setNotifsState(next)
      toast({ title: 'Dihapus', description: 'Notifikasi berhasil dihapus' })
    }
  }

  async function toggleNotif(id) {
    const next = notifs.map(n => n.id === id ? { ...n, active: !n.active } : n)
    const ok = await persist(ads, next)
    if (ok) {
      setNotifsState(next)
      const n = next.find(x => x.id === id)
      toast({
        title: n?.active ? '✅ Notifikasi Diaktifkan' : '🚫 Notifikasi Dinonaktifkan',
        description: global ? 'Berlaku untuk semua pengguna.' : 'Berlaku di browser ini.',
        variant: n?.active ? 'success' : 'default',
      })
    }
  }

  // ── Reset to default ──
  async function resetDefaults() {
    const ok = await persist(DEFAULT_ADS, DEFAULT_NOTIFICATIONS)
    if (ok) {
      setAdsState(DEFAULT_ADS)
      setNotifsState(DEFAULT_NOTIFICATIONS)
      invalidateAdsCache()
      toast({ title: 'Reset ke Default', description: 'Iklan & notifikasi dikembalikan ke bawaan.', variant: 'success' })
    }
  }

  // ── Refresh manual ──
  async function handleRefresh() {
    invalidateAdsCache()
    await loadConfig()
    toast({ title: 'Data diperbarui dari server', variant: 'success' })
  }

  const activeAds   = ads.filter(a => a.active).length
  const activeNotif = notifs.filter(n => n.active).length

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />Iklan & Notifikasi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola iklan dan notifikasi yang tampil di halaman publik
          </p>
        </div>
        <div className="flex items-center gap-2">
          {liveUpdate && (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Diperbarui
            </span>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={loading || saving}>
            <RefreshCw className={cn("w-3.5 h-3.5", (loading || saving) && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={resetDefaults} disabled={saving}>
            <RotateCcw className="w-4 h-4" />Reset Default
          </Button>
        </div>
      </div>

      {/* Storage mode banner */}
      <StorageModeBanner isGlobal={global} liveUpdate={liveUpdate} />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Iklan',    val: ads.length,    icon: Megaphone,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Iklan Aktif',    val: activeAds,     icon: Eye,          color: 'text-emerald-600',bg: 'bg-emerald-50'},
          { label: 'Total Notif',    val: notifs.length, icon: Bell,         color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Notif Aktif',    val: activeNotif,   icon: CheckCircle2, color: 'text-amber-600',  bg: 'bg-amber-50'  },
        ].map(s => (
          <Card key={s.label} className="border-blue-100/60">
            <CardContent className="p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <p className="font-display font-extrabold text-2xl">{loading ? '—' : s.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
          Menyimpan perubahan{global ? ' ke Supabase...' : '...'}
        </div>
      )}

      <Tabs defaultValue="iklan">
        <TabsList className="mb-5">
          <TabsTrigger value="iklan" className="gap-2">
            <Megaphone className="w-4 h-4" />Iklan ({loading ? '…' : ads.length})
          </TabsTrigger>
          <TabsTrigger value="notifikasi" className="gap-2">
            <Bell className="w-4 h-4" />Notifikasi ({loading ? '…' : notifs.length})
          </TabsTrigger>
        </TabsList>

        {/* ── ADS TAB ─────────────────────────────────────────────── */}
        <TabsContent value="iklan">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Iklan tampil secara halus dan bisa ditutup oleh pengguna.
                {global && ' Aktif/nonaktif berlaku global.'}
              </p>
              <Button variant="gradient" size="sm" className="gap-2" onClick={() => setAdDialog({ open: true, item: null })}>
                <Plus className="w-4 h-4" />Tambah Iklan
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <AnimatePresence>
                {ads.map(ad => {
                  const typeLabel = { banner: 'Banner', card: 'Card', inline: 'Inline' }[ad.type] || ad.type
                  const pageLabel = PAGE_OPTIONS.find(p => p.value === ad.position)?.label || ad.position
                  return (
                    <motion.div key={ad.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <Card className={cn("border transition-all", !ad.active && 'opacity-60 bg-muted/20')}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white",
                              { blue:'bg-blue-500', purple:'bg-purple-500', emerald:'bg-emerald-500', amber:'bg-amber-500' }[ad.color] || 'bg-blue-500'
                            )}>
                              {ad.type === 'banner' ? '▬' : ad.type === 'card' ? '▪' : '—'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-sm">{ad.title}</span>
                                <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
                                <Badge variant="info" className="text-xs">{pageLabel}</Badge>
                                {ad.active
                                  ? <Badge className="text-xs bg-emerald-100 text-emerald-800">Aktif</Badge>
                                  : <Badge variant="secondary" className="text-xs text-muted-foreground">Nonaktif</Badge>
                                }
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{ad.description}</p>
                              {ad.url && (
                                <a href={ad.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 w-fit">
                                  <ExternalLink className="w-3 h-3" />{ad.url.slice(0, 40)}{ad.url.length > 40 && '...'}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => toggleAd(ad.id)}
                                disabled={saving}
                                title={ad.active ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                {ad.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"
                                onClick={() => setAdDialog({ open: true, item: ad })}
                                disabled={saving}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" disabled={saving}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Iklan?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Iklan "<strong>{ad.title}</strong>" akan dihapus permanen
                                      {global && ' dari database dan tidak tampil di semua browser'}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteAd(ad.id)} className="bg-destructive hover:bg-red-700">Hapus</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}

            {!loading && ads.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-blue-200 rounded-2xl">
                <Megaphone className="w-10 h-10 text-blue-200 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Belum ada iklan. Tambahkan iklan pertama.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── NOTIF TAB ────────────────────────────────────────────── */}
        <TabsContent value="notifikasi">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Notifikasi tampil sebagai bar tipis di atas konten.
                {global && ' Aktif/nonaktif berlaku global.'}
              </p>
              <Button variant="gradient" size="sm" className="gap-2" onClick={() => setNotifDialog({ open: true, item: null })}>
                <Plus className="w-4 h-4" />Tambah Notifikasi
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <AnimatePresence>
                {notifs.map(n => {
                  const s = NOTIF_STYLE[n.type] || NOTIF_STYLE.info
                  const Icon = s.icon
                  const pageLabel = PAGE_OPTIONS.find(p => p.value === n.position)?.label || n.position
                  return (
                    <motion.div key={n.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <Card className={cn("border transition-all", !n.active && 'opacity-60 bg-muted/20')}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                              <Icon className={cn("w-5 h-5", s.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-sm">{n.title}</span>
                                <Badge variant="secondary" className="text-xs capitalize">{n.type}</Badge>
                                <Badge variant="info" className="text-xs">{pageLabel}</Badge>
                                {n.dismissable && <Badge variant="secondary" className="text-xs">Bisa ditutup</Badge>}
                                {n.active
                                  ? <Badge className="text-xs bg-emerald-100 text-emerald-800">Aktif</Badge>
                                  : <Badge variant="secondary" className="text-xs text-muted-foreground">Nonaktif</Badge>
                                }
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => toggleNotif(n.id)}
                                disabled={saving}
                                title={n.active ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                {n.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"
                                onClick={() => setNotifDialog({ open: true, item: n })}
                                disabled={saving}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" disabled={saving}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Notifikasi?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Notifikasi "<strong>{n.title}</strong>" akan dihapus permanen
                                      {global && ' dari database dan tidak tampil di semua browser'}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteNotif(n.id)} className="bg-destructive hover:bg-red-700">Hapus</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}

            {!loading && notifs.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-blue-200 rounded-2xl">
                <Bell className="w-10 h-10 text-blue-200 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Belum ada notifikasi.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* SQL helper (only in mock mode) */}
      {!global && <SupabaseSQLHelper />}

      {/* Dialogs */}
      <AdDialog open={adDialog.open} onClose={() => setAdDialog({ open: false, item: null })} initial={adDialog.item} onSave={saveAd} />
      <NotifDialog open={notifDialog.open} onClose={() => setNotifDialog({ open: false, item: null })} initial={notifDialog.item} onSave={saveNotif} />
    </div>
  )
}
