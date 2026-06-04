import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/misc'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/misc'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { getCampuses, getMajors, createMajor, updateMajor, deleteMajor } from '@/lib/services'
import { IT_FIELDS, ACCREDITATION_OPTIONS } from '@/lib/mockData'
import { getAccreditationColor, cn } from '@/lib/utils'

const EMPTY_FORM = {
  campus_id: '', name: '', degree: 'S1', accreditation: 'A',
  tuition_per_semester: '', it_fields: [],
}

function MajorFormDialog({ open, onClose, initialData, campuses, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
  }, [initialData, open])

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function toggleField(field) {
    setForm(f => ({
      ...f,
      it_fields: f.it_fields.includes(field) ? f.it_fields.filter(x => x !== field) : [...f.it_fields, field]
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.campus_id) { toast({ title: 'Error', description: 'Pilih kampus terlebih dahulu', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const payload = { ...form, tuition_per_semester: Number(form.tuition_per_semester) || null }
      if (initialData?.id) {
        await updateMajor(initialData.id, payload)
        toast({ title: 'Berhasil', description: 'Jurusan berhasil diperbarui', variant: 'success' })
      } else {
        await createMajor(payload)
        toast({ title: 'Berhasil', description: 'Jurusan baru berhasil ditambahkan', variant: 'success' })
      }
      onSaved()
      onClose()
    } catch (err) {
      toast({ title: 'Gagal', description: 'Terjadi kesalahan, coba lagi', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Jurusan' : 'Tambah Jurusan IT'}</DialogTitle>
          <DialogDescription>Lengkapi data jurusan dengan akurat</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Kampus *</Label>
            <Select value={form.campus_id} onValueChange={v => setField('campus_id', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih kampus..." /></SelectTrigger>
              <SelectContent>
                {campuses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nama Jurusan *</Label>
              <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Teknik Informatika" required />
            </div>
            <div className="space-y-1.5">
              <Label>Jenjang</Label>
              <Select value={form.degree} onValueChange={v => setField('degree', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="D3">D3</SelectItem>
                  <SelectItem value="S1">S1</SelectItem>
                  <SelectItem value="S2">S2</SelectItem>
                  <SelectItem value="S3">S3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Akreditasi</Label>
              <Select value={form.accreditation} onValueChange={v => setField('accreditation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCREDITATION_OPTIONS.filter(a => a.value !== 'any').map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Biaya per Semester (Rp)</Label>
              <Input type="number" value={form.tuition_per_semester} onChange={e => setField('tuition_per_semester', e.target.value)} placeholder="10000000" min="0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bidang IT yang Dipelajari</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {IT_FIELDS.map(field => (
                <label key={field} className={cn("flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer text-xs font-medium select-none transition-all",
                  form.it_fields.includes(field) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-blue-200'
                )}>
                  <Checkbox checked={form.it_fields.includes(field)} onCheckedChange={() => toggleField(field)} />
                  <span>{field}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Menyimpan...</> : (initialData ? 'Simpan' : 'Tambah Jurusan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminMajorPage() {
  const [majors, setMajors] = useState([])
  const [campuses, setCampuses] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCampus, setFilterCampus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  async function load() {
    setLoading(true)
    const [m, c] = await Promise.all([getMajors(), getCampuses()])
    const campusMap = Object.fromEntries((c.data || []).map(camp => [camp.id, camp]))
    const majorsWithCampus = (m.data || []).map(major => ({
      ...major,
      campus: campusMap[major.campus_id]
    }))
    setMajors(majorsWithCampus)
    setFiltered(majorsWithCampus)
    setCampuses(c.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = [...majors]
    if (search) { const q = search.toLowerCase(); result = result.filter(m => m.name.toLowerCase().includes(q)) }
    if (filterCampus !== 'all') result = result.filter(m => m.campus_id === filterCampus)
    setFiltered(result)
  }, [search, filterCampus, majors])

  function openAdd() { setEditTarget(null); setDialogOpen(true) }
  function openEdit(major) { setEditTarget(major); setDialogOpen(true) }

  async function handleDelete(id) {
    await deleteMajor(id)
    toast({ title: 'Dihapus', description: 'Jurusan berhasil dihapus', variant: 'success' })
    load()
  }

  return (
    <div className="space-y-5 w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Manajemen Jurusan IT</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola data jurusan IT di setiap kampus</p>
        </div>
        <Button onClick={openAdd} variant="gradient" className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Jurusan
        </Button>
      </div>

      <Card className="border-blue-100/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari jurusan..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterCampus} onValueChange={setFilterCampus}>
              <SelectTrigger className="sm:w-56"><SelectValue placeholder="Filter kampus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kampus</SelectItem>
                {campuses.map(c => <SelectItem key={c.id} value={c.id}>{c.short_name || c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="self-center">{filtered.length} jurusan</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.map(major => (
                <TableRow key={major.id} className="hover:bg-blue-50/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
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
                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${getAccreditationColor(major.accreditation)}`}>{major.accreditation}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(major.it_fields || []).slice(0, 2).map(f => (
                        <span key={f} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100">{f}</span>
                      ))}
                      {(major.it_fields || []).length > 2 && <span className="text-xs text-muted-foreground">+{major.it_fields.length - 2}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(major)} className="h-8 w-8 hover:bg-blue-50 hover:text-primary">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Jurusan?</AlertDialogTitle>
                            <AlertDialogDescription>Jurusan "<strong>{major.name}</strong>" akan dihapus secara permanen.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(major.id)} className="bg-destructive hover:bg-red-700">Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-blue-100 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Tidak ada jurusan ditemukan</p>
            </div>
          )}
        </CardContent>
      </Card>

      <MajorFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={editTarget}
        campuses={campuses}
        onSaved={load}
      />
    </div>
  )
}
