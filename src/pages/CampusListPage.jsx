import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, Building2, GitCompare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CampusCard } from '@/components/campus/CampusCard'
import { getCampuses } from '@/lib/services'
import { PROVINCES, ACCREDITATION_OPTIONS } from '@/lib/mockData'
import { Skeleton } from '@/components/ui/misc'

export default function CampusListPage() {
  const [campuses, setCampuses] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [province, setProvince] = useState('Semua Provinsi')
  const [accreditation, setAccreditation] = useState('any')
  const [type, setType] = useState('all')

  useEffect(() => {
    getCampuses().then(({ data }) => {
      setCampuses(data || [])
      setFiltered(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    let result = [...campuses]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.short_name?.toLowerCase().includes(q) || c.location.toLowerCase().includes(q))
    }
    if (province !== 'Semua Provinsi') result = result.filter(c => c.province === province)
    if (accreditation !== 'any') result = result.filter(c => c.accreditation === accreditation)
    if (type !== 'all') result = result.filter(c => c.type === type)
    setFiltered(result)
  }, [search, province, accreditation, type, campuses])

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      {/* Header */}
      <div className="gradient-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3">Semua Kampus IT</h1>
          <p className="text-blue-100">Jelajahi {campuses.length}+ kampus dengan program IT terbaik di Indonesia</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-blue-100 p-5 mb-8 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama kampus..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={accreditation} onValueChange={setAccreditation}>
              <SelectTrigger><SelectValue placeholder="Akreditasi" /></SelectTrigger>
              <SelectContent>
                {ACCREDITATION_OPTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Jenis kampus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="Negeri">Negeri (PTN)</SelectItem>
                <SelectItem value="Swasta">Swasta (PTS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-sm">
            Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> kampus
          </p>
          {(search || province !== 'Semua Provinsi' || accreditation !== 'any' || type !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setProvince('Semua Provinsi'); setAccreditation('any'); setType('all') }}>
              Reset Filter
            </Button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-blue-100 p-5 space-y-3">
                <div className="flex gap-3"><Skeleton className="w-14 h-14 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
                <div className="flex gap-1"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /></div>
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-blue-100 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Kampus Tidak Ditemukan</h3>
            <p className="text-muted-foreground">Coba ubah kata pencarian atau filter yang dipilih</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(campus => <CampusCard key={campus.id} campus={campus} />)}
          </div>
        )}
      </div>
    </main>
  )
}
