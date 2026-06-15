import { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, Search,
  BookOpen, Trash, AlertCircle, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/misc'
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
  getCampuses, getMajors, createMajor,
  updateMajor, deleteMajor, deleteAllMajors,
} from '@/lib/services'
import { moveToRecycleBin, bulkMoveToRecycleBin } from '@/lib/recycleBin'
import { usePagination, TablePerPageSelector, PaginationBar } from '@/hooks/usePagination'
import { IT_FIELDS, ACCREDITATION_OPTIONS } from '@/lib/mockData'
import { getAccreditationColor, cn } from '@/lib/utils'

const EMPTY_FORM = {
  campus_id: '', name: '', degree: 'S1',
  accreditation: 'A', tuition_per_semester: '', it_fields: [],
}

// ─── Major Form Panel (slide-in) ───────────────────────────────────
function MajorFormPanel({ open, onClose, initialData, campuses, onSaved }) {
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          ...EMPTY_FORM,
          ...initialData,
          it_fields: Array.isArray(initialData.it_fields) ? initialData.it_fields : [],
          tuition_per_semester: initialData.tuition_per_semester ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
    }
  }, [open, initialData])

  if (!open) return null

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function toggleField(field) {
    setForm(f => ({
      ...f,
      it_fields: f.it_fields.includes(field)
        ? f.it_fields.filter(x => x !== field)
        : [...f.it_fields, field],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.campus_id) {
      toast({ title: 'Error', description: 'Pilih kampus terlebih dahulu', variant: 'destructive' })
      return
    }
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'Nama jurusan tidak boleh kosong', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        tuition_per_semester: form.tuition_per_semester
          ? Number(form.tuition_per_semester)
          : null,
      }
      if (initialData?.id) {
        const { error } = await updateMajor(initialData.id, payload)
        if (error) throw error
        toast({ title: 'Berhasil', description: 'Jurusan berhasil diperbarui', variant: 'success' })
      } else {
        const { error } = await createMajor(payload)
        if (error) throw error
        toast({ title: 'Berhasil', description: 'Jurusan baru berhasil ditambahkan', variant: 'success' })
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

      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg">
              {initialData ? 'Edit Jurusan' : 'Tambah Jurusan IT'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {initialData
                ? `${initialData.name} · ${initialData.degree}`
                : 'Isi informasi jurusan dengan lengkap'}
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="major-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Pilih kampus */}
            <div className="space-y-1.5">
              <Label htmlFor="mf-campus">
                Kampus <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.campus_id}
                onValueChange={v => setField('campus_id', v)}
              >
                <SelectTrigger id="mf-campus">
                  <SelectValue placeholder="Pilih kampus..." />
                </SelectTrigger>
                <SelectContent>
                  {campuses.length === 0
                    ? <SelectItem value="" disabled>Belum ada kampus</SelectItem>
                    : campuses.map(c =>
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      )
                  }
                </SelectContent>
              </Select>
              {campuses.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Tambahkan kampus terlebih dahulu sebelum menambah jurusan
                </p>
              )}
            </div>

            {/* Nama jurusan */}
            <div className="space-y-1.5">
              <Label htmlFor="mf-name">
                Nama Jurusan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mf-name"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="Teknik Informatika"
                required
              />
            </div>

            {/* Jenjang + Akreditasi */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mf-degree">Jenjang</Label>
                <Select value={form.degree} onValueChange={v => setField('degree', v)}>
                  <SelectTrigger id="mf-degree"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['D3','S1','S2','S3'].map(d =>
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mf-accr">Akreditasi</Label>
                <Select value={form.accreditation} onValueChange={v => setField('accreditation', v)}>
                  <SelectTrigger id="mf-accr"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCREDITATION_OPTIONS.filter(a => a.value !== 'any').map(a =>
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Biaya */}
            <div className="space-y-1.5">
              <Label htmlFor="mf-tuition">Biaya per Semester (Rp)</Label>
              <Input
                id="mf-tuition"
                type="number" min="0"
                value={form.tuition_per_semester}
                onChange={e => setField('tuition_per_semester', e.target.value)}
                placeholder="10000000"
              />
              <p className="text-xs text-muted-foreground">Kosongkan jika tidak diketahui</p>
            </div>

            {/* Bidang IT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Bidang IT yang Dipelajari</Label>
                {form.it_fields.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setField('it_fields', [])}
                    className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    Hapus semua
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {IT_FIELDS.map(field => (
                  <label
                    key={field}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer',
                      'text-xs font-medium select-none transition-all duration-150',
                      form.it_fields.includes(field)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 hover:border-blue-300 text-slate-600'
                    )}
                  >
                    <Checkbox
                      checked={form.it_fields.includes(field)}
                      onCheckedChange={() => toggleField(field)}
                    />
                    <span className="truncate">{field}</span>
                  </label>
                ))}
              </div>
              {form.it_fields.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.it_fields.map(f => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => toggleField(f)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preview info */}
            {(form.campus_id || form.name) && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Preview:</p>
                <p className="text-xs text-blue-800">
                  <strong>{form.degree}</strong>
                  {form.name ? ` · ${form.name}` : ''}
                  {form.campus_id
                    ? ` @ ${campuses.find(c => c.id === form.campus_id)?.short_name || '—'}`
                    : ''}
                </p>
                {form.it_fields.length > 0 && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    {form.it_fields.length} bidang IT dipilih
                  </p>
                )}
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50/50">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            type="submit"
            form="major-form"
            variant="gradient"
            disabled={saving || campuses.length === 0}
            className="min-w-[130px]"
          >
            {saving
              ? <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              : initialData ? 'Simpan Perubahan' : 'Tambah Jurusan'
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
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!loading) onClose(false) }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-red-600">
                Pindahkan Semua ke Recycle Bin
              </h3>
              <p className="text-sm text-muted-foreground">{count} jurusan akan dipindahkan</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Semua {count} jurusan dipindahkan ke Recycle Bin</li>
              <li>• Data kampus tidak ikut terhapus</li>
              <li>• Sistem rekomendasi tidak memiliki data jurusan</li>
              <li>• Bisa dipulihkan dari menu Recycle Bin (30 hari)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Ketik{' '}
              <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                {REQUIRED}
              </span>
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
            <Button variant="outline" onClick={() => onClose(false)} disabled={loading}>
              Batal
            </Button>
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
function EmptyState({ onAdd, hasCampuses }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-purple-200/60 flex items-center justify-center shadow-inner">
          <BookOpen className="w-14 h-14 text-purple-300" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center">
          <span className="text-xs font-bold text-amber-600">0</span>
        </div>
      </div>
      <h3 className="font-display font-bold text-xl mb-2">Belum Ada Data Jurusan</h3>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8">
        {hasCampuses
          ? 'Tambahkan jurusan IT ke kampus yang sudah ada.'
          : 'Tambahkan kampus terlebih dahulu sebelum menambah jurusan.'}
      </p>
      {hasCampuses ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onAdd} variant="gradient" className="gap-2">
            <Plus className="w-4 h-4" /> Tambah Jurusan Pertama
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href="/admin/import"><Trash2 className="w-4 h-4" /> Import dari File</a>
          </Button>
        </div>
      ) : (
        <Button asChild variant="gradient" className="gap-2">
          <a href="/admin/kampus"><Plus className="w-4 h-4" /> Tambah Kampus Dulu</a>
        </Button>
      )}
    </div>
  )
}

function FilterEmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-purple-50 border-2 border-purple-100 flex items-center justify-center mb-5">
        <Search className="w-9 h-9 text-purple-200" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">Jurusan Tidak Ditemukan</h3>
      <p className="text-muted-foreground text-sm mb-5 max-w-xs">
        Tidak ada jurusan yang cocok dengan filter yang digunakan.
      </p>
      <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
        <X className="w-3.5 h-3.5" /> Reset Filter
      </Button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function AdminMajorPage() {
  const [majors, setMajors]             = useState([])
  const [campuses, setCampuses]         = useState([])
  const [filtered, setFiltered]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterCampus, setFilterCampus] = useState('all')
  const [filterDegree, setFilterDegree] = useState('all')

  // Panel state
  const [panelOpen, setPanelOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deletingAll, setDeletingAll]     = useState(false)

  const hasFilter = search || filterCampus !== 'all' || filterDegree !== 'all'

  const { page, setPage, perPage, changePerPage, totalItems, totalPages, pageData, start, end } =
    usePagination({ data: filtered, defaultPerPage: 10, storageKey: 'admin-major' })

  async function load() {
    setLoading(true)
    try {
      const [m, c] = await Promise.all([getMajors(), getCampuses()])
      if (m.error) throw m.error
      const campusMap = Object.fromEntries((c.data || []).map(camp => [camp.id, camp]))
      setMajors((m.data || []).map(maj => ({ ...maj, campus: campusMap[maj.campus_id] })))
      setCampuses(c.data || [])
    } catch {
      toast({ title: 'Gagal memuat data', description: 'Coba refresh halaman', variant: 'destructive' })
      setMajors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = [...majors]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.campus?.name?.toLowerCase().includes(q)
      )
    }
    if (filterCampus !== 'all') result = result.filter(m => m.campus_id === filterCampus)
    if (filterDegree !== 'all') result = result.filter(m => m.degree === filterDegree)
    setFiltered(result)
  }, [search, filterCampus, filterDegree, majors])

  function openAdd() {
    setEditTarget(null)
    setPanelOpen(true)
  }

  function openEdit(major) {
    setEditTarget({ ...major }) // snapshot
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelOpen(false)
    setTimeout(() => setEditTarget(null), 300)
  }

  function resetFilter() {
    setSearch('')
    setFilterCampus('all')
    setFilterDegree('all')
  }

  async function handleDelete(major) {
    try {
      const campusName = major.campus?.name || major.campus?.short_name || 'Kampus tidak diketahui'
      moveToRecycleBin('major', major, major.name, `${campusName} · ${major.degree}`)
      const { error } = await deleteMajor(major.id)
      if (error) throw error
      setMajors(prev => prev.filter(m => m.id !== major.id))
      toast({
        title: 'Dipindahkan ke Recycle Bin',
        description: `${major.name} bisa dipulihkan dari Recycle Bin`,
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: 'Gagal menghapus',
        description: err?.message || 'Terjadi kesalahan, coba lagi',
        variant: 'destructive',
      })
    }
  }

  async function handleDeleteAll() {
    setDeletingAll(true)
    try {
      bulkMoveToRecycleBin('major', majors.map(m => ({
        data:  m,
        label: m.name,
        meta:  `${m.campus?.name || 'Unknown'} · ${m.degree}`,
      })))
      const { error } = await deleteAllMajors()
      if (error) throw error
      setMajors([])
      setDeleteAllOpen(false)
      toast({
        title: 'Semua Jurusan Dipindahkan ke Recycle Bin',
        description: `${majors.length} jurusan bisa dipulihkan dari Recycle Bin`,
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: 'Gagal',
        description: err?.message || 'Terjadi kesalahan saat menghapus data',
        variant: 'destructive',
      })
    } finally {
      setDeletingAll(false)
    }
  }

  return (
    <div className="space-y-5 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Manajemen Jurusan IT</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola data jurusan IT di setiap kampus</p>
        </div>
        <div className="flex items-center gap-2">
          {majors.length > 0 && (
            <Button variant="outline" size="sm"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => setDeleteAllOpen(true)}>
              <Trash className="w-3.5 h-3.5" /> Hapus Semua
            </Button>
          )}
          <Button onClick={openAdd} variant="gradient" className="gap-2">
            <Plus className="w-4 h-4" /> Tambah Jurusan
          </Button>
        </div>
      </div>

      {/* Card */}
      <Card className="border-blue-100/60">
        {(majors.length > 0 || hasFilter) && (
          <div className="p-4 border-b border-blue-50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Cari jurusan..." value={search}
                  onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={filterCampus} onValueChange={setFilterCampus}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Kampus" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kampus</SelectItem>
                  {campuses.map(c =>
                    <SelectItem key={c.id} value={c.id}>{c.short_name || c.name}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Select value={filterDegree} onValueChange={setFilterDegree}>
                <SelectTrigger className="w-28 h-9"><SelectValue placeholder="Jenjang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {['D3','S1','S2','S3'].map(d =>
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 ml-auto">
                <TablePerPageSelector value={perPage} onChange={changePerPage} />
                <Badge variant="secondary" className="whitespace-nowrap">{filtered.length} jurusan</Badge>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) =>
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              )}
            </div>
          ) : majors.length === 0 ? (
            <EmptyState onAdd={openAdd} hasCampuses={campuses.length > 0} />
          ) : filtered.length === 0 ? (
            <FilterEmptyState onReset={resetFilter} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Nama Jurusan</TableHead>
                  <TableHead className="hidden sm:table-cell">Kampus</TableHead>
                  <TableHead className="hidden md:table-cell">Jenjang</TableHead>
                  <TableHead className="hidden md:table-cell">Akreditasi</TableHead>
                  <TableHead className="hidden lg:table-cell">Bidang IT</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map(major => (
                  <TableRow key={major.id} className="hover:bg-blue-50/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-purple-500" />
                        </div>
                        <span className="font-semibold text-sm">{major.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {major.campus?.short_name || major.campus?.name || '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="text-xs">{major.degree}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${getAccreditationColor(major.accreditation)}`}>
                        {major.accreditation}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(major.it_fields || []).slice(0, 2).map(f => (
                          <span key={f} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100">
                            {f}
                          </span>
                        ))}
                        {(major.it_fields || []).length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{major.it_fields.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 hover:bg-blue-50 hover:text-primary"
                          onClick={() => openEdit(major)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {/* Delete to bin */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Pindahkan ke Recycle Bin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{major.name}</strong> akan dipindahkan ke Recycle Bin.
                                Kamu bisa memulihkannya dalam 30 hari.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(major)}
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

      {/* Slide-in panel */}
      <MajorFormPanel
        open={panelOpen}
        onClose={closePanel}
        initialData={editTarget}
        campuses={campuses}
        onSaved={() => { load(); closePanel() }}
      />

      {/* Delete all dialog */}
      <DeleteAllDialog
        open={deleteAllOpen}
        onClose={setDeleteAllOpen}
        onConfirm={handleDeleteAll}
        count={majors.length}
        loading={deletingAll}
      />
    </div>
  )
}
