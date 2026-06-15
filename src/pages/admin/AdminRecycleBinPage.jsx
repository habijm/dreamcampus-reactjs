import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2, RotateCcw, Trash, Building2, BookOpen, AlertCircle,
  Clock, Info, Search, Filter, ChevronDown, X, CheckSquare,
  Square, TriangleAlert, Inbox, ShieldAlert
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/misc'
import { Separator } from '@/components/ui/misc'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/misc'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { createCampus, createMajor, getCampuses } from '@/lib/services'
import {
  getBinItems, getBinItemsByType, getBinCount,
  restoreFromBin, permanentDeleteFromBin,
  emptyRecycleBin, emptyBinByType,
  formatDeletedAt, daysUntilExpiry, EXPIRE_DAYS_CONST
} from '@/lib/recycleBin'
import { cn } from '@/lib/utils'

// ─── Type config ───────────────────────────────────────────────────
const TYPE_CONFIG = {
  campus: {
    label:    'Kampus',
    labelPlural: 'Kampus',
    icon:     Building2,
    color:    'text-blue-600',
    bg:       'bg-blue-50',
    border:   'border-blue-200',
    badge:    'bg-blue-100 text-blue-800',
    dot:      'bg-blue-500',
  },
  major: {
    label:    'Jurusan',
    labelPlural: 'Jurusan',
    icon:     BookOpen,
    color:    'text-purple-600',
    bg:       'bg-purple-50',
    border:   'border-purple-200',
    badge:    'bg-purple-100 text-purple-800',
    dot:      'bg-purple-500',
  },
}

// ─── Expiry badge ──────────────────────────────────────────────────
function ExpiryBadge({ deletedAt }) {
  const days = daysUntilExpiry(deletedAt)
  if (days > 7) return null
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold",
      days <= 1
        ? "bg-red-100 text-red-700 border border-red-200"
        : "bg-amber-100 text-amber-700 border border-amber-200"
    )}>
      <Clock className="w-3 h-3" />
      {days <= 1 ? 'Kedaluwarsa besok' : `${days} hari lagi`}
    </span>
  )
}

// ─── Empty Bin State ───────────────────────────────────────────────
function EmptyBinState({ type }) {
  const cfg = type ? TYPE_CONFIG[type] : null
  const Icon = cfg?.icon || Inbox
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "w-24 h-24 rounded-3xl flex items-center justify-center mb-6 border-2",
          cfg ? `${cfg.bg} ${cfg.border}` : "bg-slate-50 border-slate-200"
        )}
      >
        <Icon className={cn("w-12 h-12", cfg ? cfg.color : "text-slate-300")} />
      </motion.div>
      <h3 className="font-display font-bold text-lg text-foreground mb-2">
        {type ? `Tidak Ada ${cfg.labelPlural} Terhapus` : 'Recycle Bin Kosong'}
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
        {type
          ? `Semua ${cfg.label.toLowerCase()} yang kamu hapus akan muncul di sini dan bisa dipulihkan.`
          : 'Tidak ada data yang dihapus. Item yang dihapus akan muncul di sini selama 30 hari.'}
      </p>
    </div>
  )
}

// ─── Empty Search State ────────────────────────────────────────────
function EmptySearchState({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Search className="w-10 h-10 text-slate-200 mb-4" />
      <p className="text-muted-foreground text-sm mb-3">Tidak ada item yang cocok.</p>
      <Button variant="ghost" size="sm" onClick={onReset} className="text-xs gap-1">
        <X className="w-3.5 h-3.5" /> Hapus pencarian
      </Button>
    </div>
  )
}

// ─── Confirm Empty Dialog ──────────────────────────────────────────
function ConfirmEmptyDialog({ open, onClose, onConfirm, type, count, loading }) {
  const cfg = type ? TYPE_CONFIG[type] : null
  const label = cfg ? cfg.labelPlural.toLowerCase() : 'semua item'

  return (
    <Dialog open={open} onOpenChange={v => { if (!loading) onClose(v) }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="w-5 h-5" />
            Hapus Permanen
          </DialogTitle>
          <DialogDescription className="text-left pt-1">
            <span className="block font-semibold text-foreground mb-1">
              {count} {label} akan dihapus secara permanen.
            </span>
            <span className="text-sm">
              Tindakan ini tidak dapat dibatalkan. Data tidak bisa dipulihkan kembali.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            Pastikan kamu sudah yakin sebelum melanjutkan. Data yang terhapus tidak dapat dikembalikan.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onClose(false)} disabled={loading}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {loading
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menghapus...</>
              : <><Trash className="w-3.5 h-3.5" />Hapus Permanen</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Single Bin Item Card ──────────────────────────────────────────
function BinItemCard({ item, selected, onSelect, onRestore, onDelete }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.campus
  const Icon = cfg.icon
  const days = daysUntilExpiry(item.deletedAt)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative rounded-2xl border-2 p-4 transition-all duration-200",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      )}
    >
      {/* Checkbox select */}
      <button
        onClick={() => onSelect(item)}
        className="absolute top-3 left-3 z-10"
        aria-label="Pilih item"
      >
        {selected
          ? <CheckSquare className="w-4 h-4 text-primary" />
          : <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
        }
      </button>

      <div className="flex items-start gap-3 pl-6">
        {/* Icon */}
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
          <Icon className={cn("w-5 h-5", cfg.color)} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{item.label}</p>
              {item.meta && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.meta}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge className={cn("text-xs", cfg.badge)}>{cfg.label}</Badge>
            </div>
          </div>

          {/* Time + expiry */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDeletedAt(item.deletedAt)}
            </span>
            <ExpiryBadge deletedAt={item.deletedAt} />
            {days <= 0 && (
              <span className="text-xs text-red-600 font-semibold">Kedaluwarsa</span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          onClick={() => onRestore(item)}
        >
          <RotateCcw className="w-3 h-3" /> Pulihkan
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="w-3 h-3" /> Hapus Permanen
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Bulk Action Bar ───────────────────────────────────────────────
function BulkActionBar({ selected, onRestore, onDelete, onClear }) {
  if (selected.length === 0) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="sticky bottom-4 z-30 mx-auto max-w-xl"
    >
      <div className="bg-slate-900 text-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl">
        <span className="text-sm font-semibold flex-1">
          {selected.length} item dipilih
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 h-8"
          onClick={onRestore}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 h-8"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" /> Hapus
        </Button>
        <button onClick={onClear} className="text-slate-400 hover:text-white ml-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Tab content — list per type ───────────────────────────────────
function BinTabContent({
  type, search,
  onRestore, onDeleteOne,
  selected, onSelect,
}) {
  const items = getBinItemsByType(type)
  const filtered = search
    ? items.filter(i =>
        i.label.toLowerCase().includes(search.toLowerCase()) ||
        i.meta.toLowerCase().includes(search.toLowerCase())
      )
    : items

  if (items.length === 0)     return <EmptyBinState type={type} />
  if (filtered.length === 0)  return <EmptySearchState onReset={() => {}} />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <AnimatePresence mode="popLayout">
        {filtered.map(item => (
          <BinItemCard
            key={`${item.type}-${item.id}`}
            item={item}
            selected={selected.some(s => s.id === item.id && s.type === item.type)}
            onSelect={onSelect}
            onRestore={onRestore}
            onDelete={onDeleteOne}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function AdminRecycleBinPage() {
  const [items, setItems]         = useState([])
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [restoring, setRestoring] = useState(false)

  // Confirm dialogs
  const [confirmDelete, setConfirmDelete]   = useState({ open: false, item: null })
  const [confirmEmpty, setConfirmEmpty]     = useState({ open: false, type: null })
  const [confirmBulk, setConfirmBulk]       = useState({ open: false, action: null })
  const [processing, setProcessing]         = useState(false)

  // ── Load from localStorage ──
  function loadItems() {
    setItems(getBinItems())
  }

  useEffect(() => {
    loadItems()
    window.addEventListener('dc-recycle-bin-changed', loadItems)
    return () => window.removeEventListener('dc-recycle-bin-changed', loadItems)
  }, [])

  // Counts per type
  const campusItems = items.filter(i => i.type === 'campus')
  const majorItems  = items.filter(i => i.type === 'major')

  // Filtered for "semua" tab
  const allFiltered = search
    ? items.filter(i =>
        i.label.toLowerCase().includes(search.toLowerCase()) ||
        i.meta.toLowerCase().includes(search.toLowerCase())
      )
    : items

  // ── Select ──
  function toggleSelect(item) {
    setSelected(prev => {
      const exists = prev.some(s => s.id === item.id && s.type === item.type)
      return exists
        ? prev.filter(s => !(s.id === item.id && s.type === item.type))
        : [...prev, item]
    })
  }

  function selectAll() {
    const tabItems = activeTab === 'all' ? allFiltered
      : activeTab === 'campus' ? campusItems
      : majorItems
    setSelected(tabItems)
  }

  function clearSelection() { setSelected([]) }

  // ── Restore single ──
  async function handleRestoreOne(item) {
    setRestoring(true)
    try {
      const data = restoreFromBin(item.id, item.type)
      if (!data) throw new Error('Item tidak ditemukan di recycle bin')

      if (item.type === 'campus') {
        const { id, created_at, ...payload } = data
        const { error } = await createCampus(payload)
        if (error) throw error
      } else {
        // Untuk major: cek apakah campus_id masih ada
        const { data: campuses } = await getCampuses()
        const campusExists = (campuses || []).some(c => c.id === data.campus_id)
        if (!campusExists) {
          // Kembalikan ke bin karena kampus sudah tidak ada
          throw new Error(`Kampus terkait sudah tidak ada. Pulihkan kampusnya terlebih dahulu.`)
        }
        const { id, ...payload } = data
        const { error } = await createMajor(payload)
        if (error) throw error
      }

      loadItems()
      setSelected(prev => prev.filter(s => !(s.id === item.id && s.type === item.type)))
      toast({
        title: 'Berhasil Dipulihkan',
        description: `${item.label} berhasil dipulihkan`,
        variant: 'success',
      })
    } catch (err) {
      // Jika restore gagal, kembalikan ke bin
      toast({
        title: 'Gagal Memulihkan',
        description: err?.message || 'Terjadi kesalahan. Coba lagi.',
        variant: 'destructive',
      })
    } finally {
      setRestoring(false)
    }
  }

  // ── Restore bulk ──
  async function handleRestoreBulk() {
    setProcessing(true)
    let success = 0, failed = 0, failReasons = []

    for (const item of selected) {
      try {
        const data = restoreFromBin(item.id, item.type)
        if (!data) { failed++; continue }

        if (item.type === 'campus') {
          const { id, created_at, ...payload } = data
          const { error } = await createCampus(payload)
          if (error) throw error
        } else {
          const { data: campuses } = await getCampuses()
          const campusExists = (campuses || []).some(c => c.id === data.campus_id)
          if (!campusExists) {
            failReasons.push(`${item.label}: kampus terkait tidak ada`)
            failed++
            continue
          }
          const { id, ...payload } = data
          const { error } = await createMajor(payload)
          if (error) throw error
        }
        success++
      } catch (err) {
        failed++
        failReasons.push(`${item.label}: ${err?.message || 'error'}`)
      }
    }

    loadItems()
    clearSelection()
    setConfirmBulk({ open: false, action: null })
    setProcessing(false)

    if (success > 0 && failed === 0) {
      toast({ title: `${success} item dipulihkan`, description: 'Semua item berhasil dipulihkan', variant: 'success' })
    } else if (success > 0) {
      toast({ title: `${success} berhasil, ${failed} gagal`, description: failReasons[0] || '', variant: 'default' })
    } else {
      toast({ title: 'Gagal memulihkan', description: failReasons[0] || 'Semua item gagal dipulihkan', variant: 'destructive' })
    }
  }

  // ── Delete permanent single ──
  function handleDeleteOne(item) {
    setConfirmDelete({ open: true, item })
  }

  function confirmPermanentDelete() {
    if (!confirmDelete.item) return
    permanentDeleteFromBin(confirmDelete.item.id, confirmDelete.item.type)
    setSelected(prev => prev.filter(s =>
      !(s.id === confirmDelete.item.id && s.type === confirmDelete.item.type)
    ))
    loadItems()
    setConfirmDelete({ open: false, item: null })
    toast({ title: 'Dihapus Permanen', description: `${confirmDelete.item.label} dihapus permanen` })
  }

  // ── Delete bulk ──
  function handleDeleteBulk() {
    setConfirmBulk({ open: true, action: 'delete' })
  }

  function confirmBulkDelete() {
    for (const item of selected) {
      permanentDeleteFromBin(item.id, item.type)
    }
    clearSelection()
    loadItems()
    setConfirmBulk({ open: false, action: null })
    toast({ title: `${selected.length} item dihapus permanen` })
  }

  // ── Empty by type ──
  function handleEmptyType(type) {
    setConfirmEmpty({ open: true, type })
  }

  function confirmEmptyType() {
    setProcessing(true)
    if (confirmEmpty.type) {
      emptyBinByType(confirmEmpty.type)
    } else {
      emptyRecycleBin()
    }
    clearSelection()
    loadItems()
    setConfirmEmpty({ open: false, type: null })
    setProcessing(false)
    toast({ title: 'Recycle Bin Dikosongkan' })
  }

  // ── Tab change ──
  function handleTabChange(val) {
    setActiveTab(val)
    clearSelection()
    setSearch('')
  }

  const totalCount   = items.length
  const soonExpiring = items.filter(i => daysUntilExpiry(i.deletedAt) <= 3).length

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-slate-600" />
            </div>
            Recycle Bin
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Data yang dihapus disimpan selama {EXPIRE_DAYS_CONST} hari sebelum dihapus otomatis
          </p>
        </div>
        {totalCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleEmptyType(null)}
          >
            <Trash className="w-3.5 h-3.5" /> Kosongkan Semua
          </Button>
        )}
      </div>

      {/* ── Info banner: expiring soon ── */}
      <AnimatePresence>
        {soonExpiring > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <TriangleAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <span className="font-semibold">{soonExpiring} item</span> akan kedaluwarsa dalam 3 hari ke depan dan dihapus secara otomatis. Pulihkan sebelum terlambat.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Item',   val: totalCount,          icon: Trash2,    color: 'text-slate-600',  bg: 'bg-slate-50'   },
          { label: 'Kampus',       val: campusItems.length,  icon: Building2, color: 'text-blue-600',   bg: 'bg-blue-50'    },
          { label: 'Jurusan',      val: majorItems.length,   icon: BookOpen,  color: 'text-purple-600', bg: 'bg-purple-50'  },
        ].map(s => (
          <Card key={s.label} className="border-slate-200">
            <CardContent className="p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <p className="font-display font-extrabold text-2xl">{s.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search + select all ── */}
      {totalCount > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari item di recycle bin..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={selectAll}>
            <CheckSquare className="w-3.5 h-3.5" />
            Pilih Semua
          </Button>
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" className="gap-1.5 h-9 text-xs" onClick={clearSelection}>
              <X className="w-3.5 h-3.5" /> Batal Pilih
            </Button>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              Semua
              {totalCount > 0 && (
                <Badge variant="secondary" className="text-xs ml-0.5">{totalCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="campus" className="gap-2">
              <Building2 className="w-3.5 h-3.5" />
              Kampus
              {campusItems.length > 0 && (
                <Badge className="text-xs ml-0.5 bg-blue-100 text-blue-800">{campusItems.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="major" className="gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              Jurusan
              {majorItems.length > 0 && (
                <Badge className="text-xs ml-0.5 bg-purple-100 text-purple-800">{majorItems.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Empty type button */}
          {activeTab !== 'all' && (
            (activeTab === 'campus' ? campusItems : majorItems).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 text-xs"
                onClick={() => handleEmptyType(activeTab)}
              >
                <Trash className="w-3.5 h-3.5" />
                Kosongkan {activeTab === 'campus' ? 'Kampus' : 'Jurusan'}
              </Button>
            )
          )}
        </div>

        {/* ── Tab: Semua ── */}
        <TabsContent value="all">
          {totalCount === 0 ? (
            <EmptyBinState type={null} />
          ) : allFiltered.length === 0 ? (
            <EmptySearchState onReset={() => setSearch('')} />
          ) : (
            <div className="space-y-6">
              {/* Campus group */}
              {campusItems.filter(i => !search || i.label.toLowerCase().includes(search.toLowerCase()) || i.meta.toLowerCase().includes(search.toLowerCase())).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-sm text-foreground">Kampus</h3>
                    <Badge className="text-xs bg-blue-100 text-blue-800">
                      {campusItems.filter(i => !search || i.label.toLowerCase().includes(search.toLowerCase())).length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence mode="popLayout">
                      {campusItems
                        .filter(i => !search || i.label.toLowerCase().includes(search.toLowerCase()) || i.meta.toLowerCase().includes(search.toLowerCase()))
                        .map(item => (
                          <BinItemCard
                            key={`campus-${item.id}`}
                            item={item}
                            selected={selected.some(s => s.id === item.id && s.type === item.type)}
                            onSelect={toggleSelect}
                            onRestore={handleRestoreOne}
                            onDelete={handleDeleteOne}
                          />
                        ))
                      }
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Separator */}
              {campusItems.length > 0 && majorItems.length > 0 && <Separator />}

              {/* Major group */}
              {majorItems.filter(i => !search || i.label.toLowerCase().includes(search.toLowerCase()) || i.meta.toLowerCase().includes(search.toLowerCase())).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-sm text-foreground">Jurusan</h3>
                    <Badge className="text-xs bg-purple-100 text-purple-800">
                      {majorItems.filter(i => !search || i.label.toLowerCase().includes(search.toLowerCase())).length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence mode="popLayout">
                      {majorItems
                        .filter(i => !search || i.label.toLowerCase().includes(search.toLowerCase()) || i.meta.toLowerCase().includes(search.toLowerCase()))
                        .map(item => (
                          <BinItemCard
                            key={`major-${item.id}`}
                            item={item}
                            selected={selected.some(s => s.id === item.id && s.type === item.type)}
                            onSelect={toggleSelect}
                            onRestore={handleRestoreOne}
                            onDelete={handleDeleteOne}
                          />
                        ))
                      }
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Kampus ── */}
        <TabsContent value="campus">
          <BinTabContent
            type="campus"
            search={search}
            selected={selected}
            onSelect={toggleSelect}
            onRestore={handleRestoreOne}
            onDeleteOne={handleDeleteOne}
          />
        </TabsContent>

        {/* ── Tab: Jurusan ── */}
        <TabsContent value="major">
          <BinTabContent
            type="major"
            search={search}
            selected={selected}
            onSelect={toggleSelect}
            onRestore={handleRestoreOne}
            onDeleteOne={handleDeleteOne}
          />
        </TabsContent>
      </Tabs>

      {/* ── Info footer ── */}
      {totalCount > 0 && (
        <Card className="border-blue-100/60 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-semibold">Tentang Recycle Bin:</p>
                <ul className="list-disc ml-4 space-y-0.5 text-blue-700">
                  <li>Item tersimpan selama <strong>{EXPIRE_DAYS_CONST} hari</strong> sebelum dihapus otomatis</li>
                  <li>Memulihkan kampus <strong>tidak otomatis</strong> memulihkan jurusannya — pulihkan terpisah</li>
                  <li>Memulihkan jurusan memerlukan kampus terkaitnya masih ada</li>
                  <li>Data tersimpan di browser (localStorage) — bersih saat clear browser data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Bulk action bar (sticky bottom) ── */}
      <AnimatePresence>
        {selected.length > 0 && (
          <BulkActionBar
            selected={selected}
            onRestore={() => setConfirmBulk({ open: true, action: 'restore' })}
            onDelete={handleDeleteBulk}
            onClear={clearSelection}
          />
        )}
      </AnimatePresence>

      {/* ── Confirm delete one ── */}
      <AlertDialog
        open={confirmDelete.open}
        onOpenChange={v => !v && setConfirmDelete({ open: false, item: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash className="w-4 h-4" /> Hapus Permanen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmDelete.item?.label}</strong> akan dihapus secara permanen dan tidak bisa dipulihkan lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              className="bg-red-600 hover:bg-red-700">
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm empty by type ── */}
      <ConfirmEmptyDialog
        open={confirmEmpty.open}
        onClose={v => setConfirmEmpty({ open: v, type: null })}
        onConfirm={confirmEmptyType}
        type={confirmEmpty.type}
        count={
          confirmEmpty.type === 'campus' ? campusItems.length
          : confirmEmpty.type === 'major' ? majorItems.length
          : totalCount
        }
        loading={processing}
      />

      {/* ── Confirm bulk restore / delete ── */}
      <Dialog
        open={confirmBulk.open}
        onOpenChange={v => { if (!processing) setConfirmBulk({ open: v, action: null }) }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={cn(
              "flex items-center gap-2",
              confirmBulk.action === 'restore' ? 'text-emerald-600' : 'text-red-600'
            )}>
              {confirmBulk.action === 'restore'
                ? <><RotateCcw className="w-4 h-4" /> Pulihkan {selected.length} Item</>
                : <><Trash className="w-4 h-4" /> Hapus {selected.length} Item Permanen</>
              }
            </DialogTitle>
            <DialogDescription className="text-left pt-1">
              {confirmBulk.action === 'restore'
                ? `${selected.length} item akan dipulihkan ke database. Jurusan memerlukan kampus terkaitnya masih ada.`
                : `${selected.length} item akan dihapus secara permanen dan tidak bisa dikembalikan.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm"
              onClick={() => setConfirmBulk({ open: false, action: null })}
              disabled={processing}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={processing}
              onClick={confirmBulk.action === 'restore' ? handleRestoreBulk : confirmBulkDelete}
              className={cn("gap-2", confirmBulk.action === 'restore'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
              )}
            >
              {processing
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</>
                : confirmBulk.action === 'restore'
                  ? <><RotateCcw className="w-3.5 h-3.5" />Pulihkan Semua</>
                  : <><Trash className="w-3.5 h-3.5" />Hapus Permanen</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
