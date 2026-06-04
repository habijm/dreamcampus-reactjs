import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle,
  AlertTriangle, Download, Trash2,
  Building2, BookOpen, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { createCampus, createMajor, getCampuses } from '@/lib/services'
import { cn } from '@/lib/utils'

// ─── Template definitions ─────────────────────────────────────────
const CAMPUS_COLUMNS = [
  'name', 'short_name', 'location', 'province', 'type',
  'accreditation', 'min_tuition', 'max_tuition',
  'established_year', 'student_count', 'website',
  'description', 'it_focus', 'featured'
]

const MAJOR_COLUMNS = [
  'campus_name', 'name', 'degree', 'accreditation',
  'tuition_per_semester', 'it_fields'
]

const CAMPUS_EXAMPLE = [
  ['Institut Teknologi Contoh', 'ITC', 'Bandung', 'Jawa Barat', 'Swasta',
   'A', '5000000', '15000000', '2000', '10000',
   'https://itc.ac.id', 'Kampus teknologi terbaik', 'AI;Web Development', 'true'],
]

const MAJOR_EXAMPLE = [
  ['Institut Teknologi Contoh', 'Teknik Informatika', 'S1', 'A', '8000000', 'AI;Web Development'],
  ['Institut Teknologi Contoh', 'Sistem Informasi', 'S1', 'B', '7000000', 'Web Development;Data Science'],
]

// ─── CSV parser ────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'))
  const rows = lines.slice(1).map(line => {
    // Handle quoted commas
    const cells = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes }
      else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = '' }
      else { current += ch }
    }
    cells.push(current.trim())
    return cells
  })
  return { headers, rows }
}

// Parse XLSX/CSV file → { headers, rows }
async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'csv') {
    const text = await file.text()
    return parseCSV(text)
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_csv(ws)
    return parseCSV(data)
  }

  throw new Error('Format tidak didukung. Gunakan .xlsx, .xls, atau .csv')
}

// Map parsed row → campus object
function rowToCampus(headers, row) {
  const obj = {}
  headers.forEach((h, i) => { obj[h] = row[i] ?? '' })

  return {
    name: obj.name || '',
    short_name: obj.short_name || '',
    location: obj.location || '',
    province: obj.province || '',
    type: obj.type || 'Swasta',
    accreditation: obj.accreditation || 'B',
    min_tuition: Number(String(obj.min_tuition).replace(/\D/g, '')) || 0,
    max_tuition: Number(String(obj.max_tuition).replace(/\D/g, '')) || 0,
    established_year: Number(obj.established_year) || null,
    student_count: Number(String(obj.student_count).replace(/\D/g, '')) || null,
    website: obj.website || '',
    description: obj.description || '',
    it_focus: obj.it_focus ? String(obj.it_focus).split(';').map(s => s.trim()).filter(Boolean) : [],
    featured: String(obj.featured).toLowerCase() === 'true',
    logo_url: '',
  }
}

// Map parsed row → major object (needs campusMap for campus_id)
function rowToMajor(headers, row, campusMap) {
  const obj = {}
  headers.forEach((h, i) => { obj[h] = row[i] ?? '' })

  const campusName = (obj.campus_name || '').toLowerCase().trim()
  const campus_id = campusMap[campusName] || null

  return {
    campus_id,
    campus_name_raw: obj.campus_name || '',
    name: obj.name || '',
    degree: obj.degree || 'S1',
    accreditation: obj.accreditation || 'B',
    tuition_per_semester: Number(String(obj.tuition_per_semester).replace(/\D/g, '')) || null,
    it_fields: obj.it_fields ? String(obj.it_fields).split(';').map(s => s.trim()).filter(Boolean) : [],
  }
}

// Validate campus row
function validateCampus(c, index) {
  const errors = []
  if (!c.name) errors.push('name wajib diisi')
  if (!c.location) errors.push('location wajib diisi')
  if (!c.province) errors.push('province wajib diisi')
  return { row: index + 1, data: c, errors, valid: errors.length === 0 }
}

// Validate major row
function validateMajor(m, index) {
  const errors = []
  if (!m.name) errors.push('name wajib diisi')
  if (!m.campus_id) errors.push(`kampus "${m.campus_name_raw}" tidak ditemukan`)
  if (!['D3','S1','S2','S3'].includes(m.degree)) errors.push('degree harus D3/S1/S2/S3')
  return { row: index + 1, data: m, errors, valid: errors.length === 0 }
}

// ─── Download template helper ──────────────────────────────────────
function downloadTemplate(type) {
  const isC = type === 'campus'
  const headers = isC ? CAMPUS_COLUMNS : MAJOR_COLUMNS
  const example = isC ? CAMPUS_EXAMPLE : MAJOR_EXAMPLE
  const rows = [headers, ...example]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `template-${type === 'campus' ? 'kampus' : 'jurusan'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Preview table ─────────────────────────────────────────────────
function PreviewTable({ items, type }) {
  const isCampus = type === 'campus'
  return (
    <div className="rounded-xl border overflow-auto max-h-72">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-12">#</TableHead>
            <TableHead>Nama</TableHead>
            {isCampus ? (
              <>
                <TableHead>Lokasi</TableHead>
                <TableHead>Provinsi</TableHead>
                <TableHead>Akreditasi</TableHead>
                <TableHead>Jenis</TableHead>
              </>
            ) : (
              <>
                <TableHead>Kampus</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Akreditasi</TableHead>
              </>
            )}
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i} className={cn(!item.valid && 'bg-red-50/50')}>
              <TableCell className="text-muted-foreground text-xs">{item.row}</TableCell>
              <TableCell className="font-medium text-sm">{item.data.name}</TableCell>
              {isCampus ? (
                <>
                  <TableCell className="text-sm text-muted-foreground">{item.data.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.data.province}</TableCell>
                  <TableCell>
                    <Badge variant="info" className="text-xs">{item.data.accreditation}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.data.type}</TableCell>
                </>
              ) : (
                <>
                  <TableCell className="text-sm text-muted-foreground">{item.data.campus_name_raw}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{item.data.degree}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info" className="text-xs">{item.data.accreditation}</Badge>
                  </TableCell>
                </>
              )}
              <TableCell>
                {item.valid ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-600 font-medium" title={item.errors.join(', ')}>
                    <XCircle className="w-3.5 h-3.5" /> {item.errors[0]}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Drop zone ──────────────────────────────────────────────────────
function DropZone({ onFile, accept }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200",
        dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-blue-200 bg-blue-50/30 hover:border-primary hover:bg-blue-50'
      )}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
        <FileSpreadsheet className="w-7 h-7 text-white" />
      </div>
      <p className="font-semibold text-foreground mb-1">Drag & drop file di sini</p>
      <p className="text-sm text-muted-foreground mb-3">atau klik untuk pilih file</p>
      <Badge variant="secondary" className="text-xs">XLSX · XLS · CSV</Badge>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────
export default function AdminImportPage() {
  const [activeTab, setActiveTab] = useState('campus')

  // Campus import state
  const [campusFile, setCampusFile]       = useState(null)
  const [campusItems, setCampusItems]     = useState([])
  const [campusParsing, setCampusParsing] = useState(false)
  const [campusImporting, setCampusImporting] = useState(false)
  const [campusResult, setCampusResult]   = useState(null)

  // Major import state
  const [majorFile, setMajorFile]         = useState(null)
  const [majorItems, setMajorItems]       = useState([])
  const [majorParsing, setMajorParsing]   = useState(false)
  const [majorImporting, setMajorImporting] = useState(false)
  const [majorResult, setMajorResult]     = useState(null)

  // ── Campus file handler ──────────────────────────────────────────
  async function handleCampusFile(file) {
    setCampusFile(file)
    setCampusItems([])
    setCampusResult(null)
    setCampusParsing(true)
    try {
      const { headers, rows } = await parseFile(file)
      const items = rows.map((row, i) => validateCampus(rowToCampus(headers, row), i))
      setCampusItems(items)
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setCampusParsing(false)
    }
  }

  async function handleCampusImport() {
    const valid = campusItems.filter(i => i.valid)
    if (!valid.length) return
    setCampusImporting(true)
    let success = 0, failed = 0
    for (const item of valid) {
      const { error } = await createCampus(item.data)
      error ? failed++ : success++
    }
    setCampusResult({ success, failed, total: valid.length })
    setCampusImporting(false)
    toast({
      title: success > 0 ? 'Import Selesai' : 'Import Gagal',
      description: `${success} kampus berhasil, ${failed} gagal`,
      variant: success > 0 ? 'success' : 'destructive'
    })
  }

  // ── Major file handler ───────────────────────────────────────────
  async function handleMajorFile(file) {
    setMajorFile(file)
    setMajorItems([])
    setMajorResult(null)
    setMajorParsing(true)
    try {
      const { headers, rows } = await parseFile(file)
      // Build campus name → id map
      const { data: campuses } = await getCampuses()
      const campusMap = {}
      ;(campuses || []).forEach(c => {
        campusMap[c.name.toLowerCase().trim()] = c.id
        if (c.short_name) campusMap[c.short_name.toLowerCase().trim()] = c.id
      })
      const items = rows.map((row, i) => validateMajor(rowToMajor(headers, row, campusMap), i))
      setMajorItems(items)
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setMajorParsing(false)
    }
  }

  async function handleMajorImport() {
    const valid = majorItems.filter(i => i.valid)
    if (!valid.length) return
    setMajorImporting(true)
    let success = 0, failed = 0
    for (const item of valid) {
      const { campus_name_raw, ...payload } = item.data
      const { error } = await createMajor(payload)
      error ? failed++ : success++
    }
    setMajorResult({ success, failed, total: valid.length })
    setMajorImporting(false)
    toast({
      title: success > 0 ? 'Import Selesai' : 'Import Gagal',
      description: `${success} jurusan berhasil, ${failed} gagal`,
      variant: success > 0 ? 'success' : 'destructive'
    })
  }

  const campusValid   = campusItems.filter(i => i.valid).length
  const campusInvalid = campusItems.filter(i => !i.valid).length
  const majorValid    = majorItems.filter(i => i.valid).length
  const majorInvalid  = majorItems.filter(i => !i.valid).length

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl">Import Data</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload file Excel atau CSV untuk import data kampus dan jurusan secara massal
        </p>
      </div>

      {/* Cara pakai */}
      <Card className="border-blue-100/60 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-semibold">Cara Import Data:</p>
              <ol className="list-decimal ml-4 space-y-0.5 text-blue-700">
                <li>Download template CSV sesuai jenis data</li>
                <li>Isi template sesuai format (jangan ubah nama kolom)</li>
                <li>Kolom <code className="bg-blue-100 px-1 rounded">it_focus</code> dan <code className="bg-blue-100 px-1 rounded">it_fields</code> dipisahkan tanda titik koma <strong>;</strong></li>
                <li>Untuk import jurusan, pastikan nama kampus sudah ada di database</li>
                <li>Upload file, periksa preview, lalu klik "Import"</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="campus" className="gap-2">
            <Building2 className="w-4 h-4" /> Import Kampus
          </TabsTrigger>
          <TabsTrigger value="major" className="gap-2">
            <BookOpen className="w-4 h-4" /> Import Jurusan
          </TabsTrigger>
        </TabsList>

        {/* ── CAMPUS TAB ─────────────────────────────────────────── */}
        <TabsContent value="campus">
          <div className="space-y-5">
            {/* Template download */}
            <Card className="border-blue-100/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  Template Kampus
                </CardTitle>
                <CardDescription>Download template CSV lalu isi dengan data kampus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-muted/40 overflow-auto border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/60">
                        {CAMPUS_COLUMNS.map(c => (
                          <TableHead key={c} className="text-xs whitespace-nowrap">{c}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {CAMPUS_EXAMPLE.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j} className="text-xs text-muted-foreground whitespace-nowrap">{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadTemplate('campus')}>
                  <Download className="w-4 h-4" /> Download Template Kampus (.csv)
                </Button>
              </CardContent>
            </Card>

            {/* Upload zone */}
            <Card className="border-blue-100/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  Upload File Kampus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {campusParsing ? (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-primary rounded-full animate-spin" />
                    <span className="text-muted-foreground text-sm">Membaca file...</span>
                  </div>
                ) : campusItems.length === 0 ? (
                  <DropZone onFile={handleCampusFile} accept=".xlsx,.xls,.csv" />
                ) : (
                  <div className="space-y-4">
                    {/* File info bar */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{campusFile?.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
                        onClick={() => { setCampusFile(null); setCampusItems([]); setCampusResult(null) }}>
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </Button>
                    </div>

                    {/* Summary badges */}
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{campusItems.length} total baris</Badge>
                      {campusValid > 0 && <Badge className="bg-emerald-100 text-emerald-800">{campusValid} valid</Badge>}
                      {campusInvalid > 0 && <Badge className="bg-red-100 text-red-800">{campusInvalid} error</Badge>}
                    </div>

                    {/* Preview */}
                    <PreviewTable items={campusItems} type="campus" />

                    {/* Result banner */}
                    {campusResult && (
                      <div className={cn("p-3 rounded-xl border flex items-center gap-2 text-sm font-medium",
                        campusResult.failed === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                      )}>
                        <CheckCircle2 className="w-4 h-4" />
                        {campusResult.success} dari {campusResult.total} kampus berhasil diimport
                        {campusResult.failed > 0 && ` (${campusResult.failed} gagal)`}
                      </div>
                    )}

                    {/* Import button */}
                    {!campusResult && (
                      <Button
                        variant="gradient"
                        className="gap-2"
                        disabled={campusValid === 0 || campusImporting}
                        onClick={handleCampusImport}
                      >
                        {campusImporting ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mengimport {campusValid} kampus...</>
                        ) : (
                          <><Upload className="w-4 h-4" />Import {campusValid} Kampus Valid</>
                        )}
                      </Button>
                    )}
                    {campusResult && (
                      <Button variant="outline" className="gap-2"
                        onClick={() => { setCampusFile(null); setCampusItems([]); setCampusResult(null) }}>
                        <RefreshCw className="w-4 h-4" /> Import File Baru
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── MAJOR TAB ──────────────────────────────────────────── */}
        <TabsContent value="major">
          <div className="space-y-5">
            <Card className="border-blue-100/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  Template Jurusan
                </CardTitle>
                <CardDescription>
                  Kolom <code>campus_name</code> harus sesuai dengan nama kampus yang sudah ada di database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-muted/40 overflow-auto border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/60">
                        {MAJOR_COLUMNS.map(c => (
                          <TableHead key={c} className="text-xs whitespace-nowrap">{c}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MAJOR_EXAMPLE.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j} className="text-xs text-muted-foreground whitespace-nowrap">{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadTemplate('major')}>
                  <Download className="w-4 h-4" /> Download Template Jurusan (.csv)
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-100/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  Upload File Jurusan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {majorParsing ? (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-primary rounded-full animate-spin" />
                    <span className="text-muted-foreground text-sm">Membaca file...</span>
                  </div>
                ) : majorItems.length === 0 ? (
                  <DropZone onFile={handleMajorFile} accept=".xlsx,.xls,.csv" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{majorFile?.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
                        onClick={() => { setMajorFile(null); setMajorItems([]); setMajorResult(null) }}>
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </Button>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{majorItems.length} total baris</Badge>
                      {majorValid > 0 && <Badge className="bg-emerald-100 text-emerald-800">{majorValid} valid</Badge>}
                      {majorInvalid > 0 && <Badge className="bg-red-100 text-red-800">{majorInvalid} error</Badge>}
                    </div>

                    <PreviewTable items={majorItems} type="major" />

                    {majorResult && (
                      <div className={cn("p-3 rounded-xl border flex items-center gap-2 text-sm font-medium",
                        majorResult.failed === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                      )}>
                        <CheckCircle2 className="w-4 h-4" />
                        {majorResult.success} dari {majorResult.total} jurusan berhasil diimport
                        {majorResult.failed > 0 && ` (${majorResult.failed} gagal)`}
                      </div>
                    )}

                    {!majorResult && (
                      <Button
                        variant="gradient"
                        className="gap-2"
                        disabled={majorValid === 0 || majorImporting}
                        onClick={handleMajorImport}
                      >
                        {majorImporting ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mengimport {majorValid} jurusan...</>
                        ) : (
                          <><Upload className="w-4 h-4" />Import {majorValid} Jurusan Valid</>
                        )}
                      </Button>
                    )}
                    {majorResult && (
                      <Button variant="outline" className="gap-2"
                        onClick={() => { setMajorFile(null); setMajorItems([]); setMajorResult(null) }}>
                        <RefreshCw className="w-4 h-4" /> Import File Baru
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
