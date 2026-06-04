import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, Upload, Building2, Globe, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/misc'
import { Textarea } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/misc'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/misc'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { getCampuses, createCampus, updateCampus, deleteCampus, uploadLogo } from '@/lib/services'
import { PROVINCES, IT_FIELDS, ACCREDITATION_OPTIONS } from '@/lib/mockData'
import { getAccreditationColor, cn } from '@/lib/utils'

const EMPTY_FORM = {
  name: '', short_name: '', location: '', province: 'Jawa Barat',
  accreditation: 'A', type: 'Swasta', website: '', description: '',
  min_tuition: 0, max_tuition: 0, established_year: '', student_count: '',
  it_focus: [], featured: false, logo_url: '',
}

function CampusFormDialog({ open, onClose, initialData, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
    setLogoFile(null)
    setLogoPreview(initialData?.logo_url || null)
  }, [initialData, open])

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function toggleItField(field) {
    setForm(f => ({
      ...f,
      it_focus: f.it_focus.includes(field) ? f.it_focus.filter(x => x !== field) : [...f.it_focus, field]
    }))
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let logo_url = form.logo_url
      if (logoFile && initialData?.id) {
        const { url } = await uploadLogo(logoFile, initialData.id)
        if (url) logo_url = url
      }
      const payload = {
        ...form,
        logo_url,
        min_tuition: Number(form.min_tuition) || 0,
        max_tuition: Number(form.max_tuition) || 0,
        established_year: Number(form.established_year) || null,
        student_count: Number(form.student_count) || null,
      }
      if (initialData?.id) {
        await updateCampus(initialData.id, payload)
        toast({ title: 'Berhasil', description: 'Kampus berhasil diperbarui', variant: 'success' })
      } else {
        await createCampus(payload)
        toast({ title: 'Berhasil', description: 'Kampus baru berhasil ditambahkan', variant: 'success' })
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Kampus' : 'Tambah Kampus Baru'}</DialogTitle>
          <DialogDescription>Isi semua informasi kampus dengan lengkap dan akurat</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden bg-blue-50 flex-shrink-0">
              {logoPreview
                ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
                : <Building2 className="w-6 h-6 text-blue-300" />
              }
            </div>
            <div>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                <Upload className="w-3.5 h-3.5" /> Upload Logo
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, max 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label>Nama Kampus *</Label>
              <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Institut Teknologi Bandung" required />
            </div>
            <div className="space-y-1.5">
              <Label>Nama Singkatan</Label>
              <Input value={form.short_name} onChange={e => setField('short_name', e.target.value)} placeholder="ITB" />
            </div>
            <div className="space-y-1.5">
              <Label>Kota *</Label>
              <Input value={form.location} onChange={e => setField('location', e.target.value)} placeholder="Bandung" required />
            </div>
            <div className="space-y-1.5">
              <Label>Provinsi *</Label>
              <Select value={form.province} onValueChange={v => setField('province', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.filter(p => p !== 'Semua Provinsi').map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Kampus</Label>
              <Select value={form.type} onValueChange={v => setField('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Negeri">Negeri (PTN)</SelectItem>
                  <SelectItem value="Swasta">Swasta (PTS)</SelectItem>
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
            <div className="space-y-1.5">
              <Label>Biaya Min (Rp/semester)</Label>
              <Input type="number" value={form.min_tuition} onChange={e => setField('min_tuition', e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Biaya Max (Rp/semester)</Label>
              <Input type="number" value={form.max_tuition} onChange={e => setField('max_tuition', e.target.value)} placeholder="15000000" min="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Tahun Berdiri</Label>
              <Input type="number" value={form.established_year} onChange={e => setField('established_year', e.target.value)} placeholder="1960" />
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah Mahasiswa</Label>
              <Input type="number" value={form.student_count} onChange={e => setField('student_count', e.target.value)} placeholder="20000" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Website Resmi</Label>
              <Input type="url" value={form.website} onChange={e => setField('website', e.target.value)} placeholder="https://www.kampus.ac.id" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Deskripsi Kampus</Label>
              <Textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} placeholder="Deskripsi singkat tentang kampus..." />
            </div>
          </div>

          {/* IT Focus */}
          <div className="space-y-2">
            <Label>Fokus Bidang IT</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {IT_FIELDS.map(field => (
                <label key={field} className={cn("flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer text-xs font-medium select-none transition-all",
                  form.it_focus.includes(field) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-blue-200'
                )}>
                  <Checkbox checked={form.it_focus.includes(field)} onCheckedChange={() => toggleItField(field)} />
                  <span className="truncate">{field}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Featured */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.featured} onCheckedChange={v => setField('featured', v)} />
            <span className="text-sm font-medium">Tampilkan di halaman utama (unggulan)</span>
          </label>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Menyimpan...</> : (initialData ? 'Simpan Perubahan' : 'Tambah Kampus')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminCampusPage() {
  const [campuses, setCampuses] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await getCampuses()
    setCampuses(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!search) { setFiltered(campuses); return }
    const q = search.toLowerCase()
    setFiltered(campuses.filter(c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)))
  }, [search, campuses])

  function openAdd() { setEditTarget(null); setDialogOpen(true) }
  function openEdit(campus) { setEditTarget(campus); setDialogOpen(true) }

  async function handleDelete(id) {
    await deleteCampus(id)
    toast({ title: 'Dihapus', description: 'Kampus berhasil dihapus', variant: 'success' })
    load()
  }

  return (
    <div className="space-y-5 w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Manajemen Kampus</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola data kampus IT yang tersedia</p>
        </div>
        <Button onClick={openAdd} variant="gradient" className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Kampus
        </Button>
      </div>

      <Card className="border-blue-100/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari kampus..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="secondary">{filtered.length} kampus</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.map(campus => (
                <TableRow key={campus.id} className="hover:bg-blue-50/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {campus.short_name?.slice(0, 3) || campus.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{campus.name}</p>
                        <p className="text-xs text-muted-foreground">{campus.short_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-400" />{campus.location}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${getAccreditationColor(campus.accreditation)}`}>{campus.accreditation}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={campus.type === 'Negeri' ? 'info' : 'secondary'} className="text-xs">{campus.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {campus.featured ? <Badge variant="success" className="text-xs">Unggulan</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(campus)} className="h-8 w-8 hover:bg-blue-50 hover:text-primary">
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
                            <AlertDialogTitle>Hapus Kampus?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Kampus "<strong>{campus.name}</strong>" akan dihapus secara permanen beserta semua jurusan terkait.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(campus.id)} className="bg-destructive hover:bg-red-700">Hapus</AlertDialogAction>
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
              <Building2 className="w-10 h-10 text-blue-100 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Tidak ada kampus ditemukan</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CampusFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={editTarget}
        onSaved={load}
      />
    </div>
  )
}
