import { useState, useEffect, useRef } from 'react'
import {
  Plus, Pencil, Trash2, Search, Upload,
  Building2, MapPin, AlertCircle, Trash, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/misc'
import { Textarea } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/misc'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import {
  getCampuses, createCampus, updateCampus,
  deleteCampus, uploadLogo, deleteAllCampuses,
} from '@/lib/services'
import { moveToRecycleBin, bulkMoveToRecycleBin } from '@/lib/recycleBin'
import { PROVINCES, IT_FIELDS, ACCREDITATION_OPTIONS } from '@/lib/mockData'
import { validateCampusInput, sanitizeText, isSafeUrl } from '@/lib/security'
import { usePagination, TablePerPageSelector, PaginationBar } from '@/hooks/usePagination'
import { getAccreditationColor, cn } from '@/lib/utils'

const EMPTY_FORM = {
  name: '', short_name: '', location: '', province: 'Jawa Barat',
  accreditation: 'A', type: 'Swasta', website: '', description: '',
  min_tuition: 0, max_tuition: 0, established_year: '', student_count: '',
  it_focus: [], featured: false, logo_url: '',
}

// ─── Campus Form — rendered inline as a panel/sheet ───────────────
// Menggunakan panel slide-in sederhana, BUKAN Radix Dialog,
// untuk menghindari konflik portal rendering.
function CampusFormPanel({ open, onClose, initialData, onSaved }) {
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [logoFile, setLogoFile]   = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const fileRef = useRef()

  // Sync form saat initialData atau open berubah
  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          ...EMPTY_FORM,
          ...initialData,
          it_focus: Array.isArray(initialData.it_focus) ? initialData.it_focus : [],
          min_tuition: initialData.min_tuition ?? 0,
          max_tuition: initialData.max_tuition ?? 0,
          established_year: initialData.established_year ?? '',
          student_count: initialData.student_count ?? '',
          featured: initialData.featured ?? false,
        })
        setLogoPreview(initialData.logo_url || null)
      } else {
        setForm(EMPTY_FORM)
        setLogoPreview(null)
      }
      setLogoFile(null)
    }
  }, [open, initialData])

  if (!open) return null

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function toggleItField(field) {
    setForm(f => ({
      ...f,
      it_focus: f.it_focus.includes(field)
        ? f.it_focus.filter(x => x !== field)
        : [...f.it_focus, field],
    }))
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload_pre = {
      ...form,
      min_tuition:      Number(form.min_tuition) || 0,
      max_tuition:      Number(form.max_tuition) || 0,
      established_year: form.established_year ? Number(form.established_year) : null,
      student_count:    form.student_count    ? Number(form.student_count)    : null,
    }
    const errors = validateCampusInput(payload_pre)
    if (errors.length > 0) {
      toast({ title: 'Validasi Gagal', description: errors[0], variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      let logo_url = form.logo_url || ''
      if (logoFile && initialData?.id) {
        const { url } = await uploadLogo(logoFile, initialData.id)
        if (url) logo_url = url
      }
      const payload = {
        ...payload_pre,
        name:        sanitizeText(form.name),
        short_name:  sanitizeText(form.short_name),
        location:    sanitizeText(form.location),
        description: sanitizeText(form.description || '').slice(0, 1000),
        website:     isSafeUrl(form.website) ? form.website : '',
        logo_url,
      }
      if (initialData?.id) {
        const { error } = await updateCampus(initialData.id, payload)
        if (error) throw error
        toast({ title: 'Berhasil', description: 'Kampus berhasil diperbarui', variant: 'success' })
      } else {
        const { error } = await createCampus(payload)
        if (error) throw error
        toast({ title: 'Berhasil', description: 'Kampus baru berhasil ditambahkan', variant: 'success' })
      }
      onSaved()
      onClose()
    } catch (err) {
      toast({
        title: 'Gagal Menyimpan',
        description: err?.message || 'Terjadi kesalahan, coba lagi',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg">
              {initialData ? 'Edit Kampus' : 'Tambah Kampus Baru'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {initialData ? `ID: ${initialData.id}` : 'Isi semua informasi kampus'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="campus-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Logo upload */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden bg-blue-50 flex-shrink-0">
                {logoPreview
                  ? <img src={logoPreview} alt="logo preview" className="w-full h-full object-contain" />
                  : <Building2 className="w-6 h-6 text-blue-300" />
                }
              </div>
              <div>
                <Button
                  type="button" variant="outline" size="sm" className="gap-1.5"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Logo
                </Button>
                <input
                  ref={fileRef} type="file" accept="image/*"
                  className="hidden" onChange={handleLogoChange}
                />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG · maks 2 MB</p>
              </div>
            </div>

            {/* Nama + singkatan */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="f-name">Nama Kampus <span className="text-red-500">*</span></Label>
                <Input
                  id="f-name"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="Institut Teknologi Bandung"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-short">Singkatan</Label>
                <Input
                  id="f-short"
                  value={form.short_name}
                  onChange={e => setField('short_name', e.target.value)}
                  placeholder="ITB"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-type">Jenis</Label>
                <Select value={form.type} onValueChange={v => setField('type', v)}>
                  <SelectTrigger id="f-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Negeri">Negeri (PTN)</SelectItem>
                    <SelectItem value="Swasta">Swasta (PTS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lokasi */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="f-loc">Kota <span className="text-red-500">*</span></Label>
                <Input
                  id="f-loc"
                  value={form.location}
                  onChange={e => setField('location', e.target.value)}
                  placeholder="Bandung"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-prov">Provinsi <span className="text-red-500">*</span></Label>
                <Select value={form.province} onValueChange={v => setField('province', v)}>
                  <SelectTrigger id="f-prov"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.filter(p => p !== 'Semua Provinsi').map(p =>
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Akreditasi + biaya */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="f-accr">Akreditasi</Label>
                <Select value={form.accreditation} onValueChange={v => setField('accreditation', v)}>
                  <SelectTrigger id="f-accr"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCREDITATION_OPTIONS.filter(a => a.value !== 'any').map(a =>
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-year">Tahun Berdiri</Label>
                <Input
                  id="f-year" type="number"
                  value={form.established_year}
                  onChange={e => setField('established_year', e.target.value)}
                  placeholder="1960"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-min">Biaya Min (Rp/sem)</Label>
                <Input
                  id="f-min" type="number" min="0"
                  value={form.min_tuition}
                  onChange={e => setField('min_tuition', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-max">Biaya Max (Rp/sem)</Label>
                <Input
                  id="f-max" type="number" min="0"
                  value={form.max_tuition}
                  onChange={e => setField('max_tuition', e.target.value)}
                  placeholder="15000000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-count">Jml. Mahasiswa</Label>
                <Input
                  id="f-count" type="number" min="0"
                  value={form.student_count}
                  onChange={e => setField('student_count', e.target.value)}
                  placeholder="20000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-web">Website Resmi</Label>
                <Input
                  id="f-web" type="url"
                  value={form.website}
                  onChange={e => setField('website', e.target.value)}
                  placeholder="https://kampus.ac.id"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label htmlFor="f-desc">Deskripsi</Label>
              <Textarea
                id="f-desc"
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                rows={3}
                placeholder="Deskripsi singkat tentang kampus..."
              />
            </div>

            {/* Fokus IT */}
            <div className="space-y-2">
              <Label>Fokus Bidang IT</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {IT_FIELDS.map(field => (
                  <label
                    key={field}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer',
                      'text-xs font-medium select-none transition-all duration-150',
                      form.it_focus.includes(field)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 hover:border-blue-300 text-slate-600'
                    )}
                  >
                    <Checkbox
                      checked={form.it_focus.includes(field)}
                      onCheckedChange={() => toggleItField(field)}
                    />
                    <span className="truncate">{field}</span>
                  </label>
                ))}
              </div>
              {form.it_focus.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {form.it_focus.length} bidang dipilih: {form.it_focus.join(', ')}
                </p>
              )}
            </div>

            {/* Featured */}
            <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
              <Checkbox
                checked={form.featured}
                onCheckedChange={v => setField('featured', !!v)}
              />
              <div>
                <p className="text-sm font-medium">Tampilkan sebagai Unggulan</p>
                <p className="text-xs text-muted-foreground">Muncul di halaman utama website</p>
              </div>
            </label>

          </form>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50/50">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            type="submit"
            form="campus-form"
            variant="gradient"
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving
              ? <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              : initialData ? 'Simpan Perubahan' : 'Tambah Kampus'
            }
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Delete All Dialog ─────────────────────────────────────────────
function DeleteAllDialog({ open, onClose, onConfirm, count, loading }) {
  const [confirmText, setConfirmText] = useState('')
  const REQUIRED = 'HAPUS SEMUA'
  useEffect(() => { if (open) setConfirmText('') }, [open])
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => { if (!loading) onClose(false) }} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-red-600">Pindahkan Semua ke Recycle Bin</h3>
              <p className="text-sm text-muted-foreground">{count} kampus akan dipindahkan</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Semua {count} kampus dipindahkan ke Recycle Bin</li>
              <li>• Jurusan terkait ikut dipindahkan</li>
              <li>• Bisa dipulihkan dari menu Recycle Bin (30 hari)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Ketik{' '}
              <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{REQUIRED}</span>
              {' '}untuk konfirmasi:
            </Label>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={REQUIRED}
              className="font-mono border-red-200 focus-visible:ring-red-400"
              autoComplete="off"
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onClose(false)} disabled={loading}>Batal</Button>
            <Button
              onClick={onConfirm}
              disabled={confirmText !== REQUIRED || loading}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memindahkan...</>
                : <><Trash className="w-4 h-4" />Pindahkan ke Bin</>
              }
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Empty States ──────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-100 to-sky-100 border-2 border-blue-200/60 flex items-center justify-center shadow-inner">
          <Building2 className="w-14 h-14 text-blue-300" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center">
          <span className="text-xs font-bold text-amber-600">0</span>
        </div>
      </div>
      <h3 className="font-display font-bold text-xl mb-2">Belum Ada Data Kampus</h3>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8">
        Database kampus masih kosong. Tambahkan kampus pertama atau import dari file.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onAdd} variant="gradient" className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Kampus Pertama
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <a href="/admin/import"><Upload className="w-4 h-4" /> Import dari File</a>
        </Button>
      </div>
    </div>
  )
}

function FilterEmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center mb-5">
        <Search className="w-9 h-9 text-blue-200" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">Kampus Tidak Ditemukan</h3>
      <p className="text-muted-foreground text-sm mb-5 max-w-xs">Tidak ada kampus yang cocok dengan filter.</p>
      <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
        <X className="w-3.5 h-3.5" /> Reset Filter
      </Button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function AdminCampusPage() {
  const [campuses, setCampuses]     = useState([])
  const [filtered, setFiltered]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [accrFilter, setAccrFilter] = useState('any')

  // Panel state — pisahkan open/editTarget
  const [panelOpen, setPanelOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deletingAll, setDeletingAll]     = useState(false)

  const hasFilter = search || typeFilter !== 'all' || accrFilter !== 'any'

  const { page, setPage, perPage, changePerPage, totalItems, totalPages, pageData, start, end } =
    usePagination({ data: filtered, defaultPerPage: 10, storageKey: 'admin-campus' })

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await getCampuses()
      if (error) throw error
      setCampuses(data || [])
    } catch {
      toast({ title: 'Gagal memuat data', description: 'Coba refresh halaman', variant: 'destructive' })
      setCampuses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = [...campuses]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.short_name?.toLowerCase().includes(q)
      )
    }
    if (typeFilter !== 'all') result = result.filter(c => c.type === typeFilter)
    if (accrFilter !== 'any') result = result.filter(c => c.accreditation === accrFilter)
    setFiltered(result)
  }, [search, typeFilter, accrFilter, campuses])

  function openAdd() {
    setEditTarget(null)
    setPanelOpen(true)
  }

  function openEdit(campus) {
    setEditTarget({ ...campus }) // snapshot supaya tidak mutate state
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelOpen(false)
    // Delay clear editTarget agar animasi tidak rusak
    setTimeout(() => setEditTarget(null), 300)
  }

  function resetFilter() {
    setSearch('')
    setTypeFilter('all')
    setAccrFilter('any')
  }

  async function handleDelete(campus) {
    try {
      moveToRecycleBin('campus', campus, campus.name, `${campus.location}, ${campus.province} · ${campus.type}`)
      const { error } = await deleteCampus(campus.id)
      if (error) throw error
      setCampuses(prev => prev.filter(c => c.id !== campus.id))
      toast({ title: 'Dipindahkan ke Recycle Bin', description: `${campus.name} bisa dipulihkan dari Recycle Bin`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Gagal menghapus', description: err?.message || 'Coba lagi', variant: 'destructive' })
    }
  }

  async function handleDeleteAll() {
    setDeletingAll(true)
    try {
      bulkMoveToRecycleBin('campus', campuses.map(c => ({
        data: c, label: c.name, meta: `${c.location}, ${c.province} · ${c.type}`,
      })))
      const { error } = await deleteAllCampuses()
      if (error) throw error
      setCampuses([])
      setDeleteAllOpen(false)
      toast({ title: 'Semua Kampus Dipindahkan ke Recycle Bin', description: `${campuses.length} kampus bisa dipulihkan`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Gagal', description: err?.message || 'Terjadi kesalahan', variant: 'destructive' })
    } finally {
      setDeletingAll(false)
    }
  }

  return (
    <div className="space-y-5 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Manajemen Kampus</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola data kampus IT yang tersedia</p>
        </div>
        <div className="flex items-center gap-2">
          {campuses.length > 0 && (
            <Button variant="outline" size="sm"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => setDeleteAllOpen(true)}>
              <Trash className="w-3.5 h-3.5" /> Hapus Semua
            </Button>
          )}
          <Button onClick={openAdd} variant="gradient" className="gap-2">
            <Plus className="w-4 h-4" /> Tambah Kampus
          </Button>
        </div>
      </div>

      {/* Card + Table */}
      <Card className="border-blue-100/60">
        {(campuses.length > 0 || hasFilter) && (
          <div className="p-4 border-b border-blue-50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Cari kampus..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Jenis" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="Negeri">Negeri</SelectItem>
                  <SelectItem value="Swasta">Swasta</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accrFilter} onValueChange={setAccrFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Akreditasi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Semua Akreditasi</SelectItem>
                  <SelectItem value="Unggul">Unggul</SelectItem>
                  <SelectItem value="Baik Sekali">Baik Sekali</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 ml-auto">
                <TablePerPageSelector value={perPage} onChange={changePerPage} />
                <Badge variant="secondary" className="whitespace-nowrap">{filtered.length} kampus</Badge>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : campuses.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : filtered.length === 0 ? (
            <FilterEmptyState onReset={resetFilter} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Kampus</TableHead>
                  <TableHead className="hidden sm:table-cell">Lokasi</TableHead>
                  <TableHead className="hidden md:table-cell">Akreditasi</TableHead>
                  <TableHead className="hidden lg:table-cell">Jenis</TableHead>
                  <TableHead className="hidden lg:table-cell">Unggulan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map(campus => (
                  <TableRow key={campus.id} className="hover:bg-blue-50/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {campus.short_name?.slice(0, 3) || campus.name?.slice(0, 2) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{campus.name}</p>
                          <p className="text-xs text-muted-foreground">{campus.short_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        {campus.location}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${getAccreditationColor(campus.accreditation)}`}>
                        {campus.accreditation}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={campus.type === 'Negeri' ? 'info' : 'secondary'} className="text-xs">
                        {campus.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {campus.featured
                        ? <Badge variant="success" className="text-xs">Unggulan</Badge>
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit button */}
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 hover:bg-blue-50 hover:text-primary"
                          onClick={() => openEdit(campus)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {/* Delete to bin */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Pindahkan ke Recycle Bin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{campus.name}</strong> akan dipindahkan ke Recycle Bin.
                                Kamu bisa memulihkannya dalam 30 hari.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(campus)}
                                className="bg-red-600 hover:bg-red-700">
                                Pindahkan
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {!loading && filtered.length > 0 && (
          <div className="px-4 pb-4">
            <PaginationBar page={page} setPage={setPage} totalPages={totalPages}
              totalItems={totalItems} start={start} end={end} />
          </div>
        )}
      </Card>

      {/* Slide-in form panel */}
      <CampusFormPanel
        open={panelOpen}
        onClose={closePanel}
        initialData={editTarget}
        onSaved={() => { load(); closePanel() }}
      />

      {/* Delete all dialog */}
      <DeleteAllDialog
        open={deleteAllOpen}
        onClose={setDeleteAllOpen}
        onConfirm={handleDeleteAll}
        count={campuses.length}
        loading={deletingAll}
      />
    </div>
  )
}
