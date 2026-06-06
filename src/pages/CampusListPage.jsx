import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Building2, GitCompare, LayoutGrid, List, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/misc'
import { CampusCard } from '@/components/campus/CampusCard'
import { NotificationBar, AdBanner, AdCard, AdInline } from '@/components/ads/AdsComponents'
import { getCampuses } from '@/lib/services'
import { PROVINCES, ACCREDITATION_OPTIONS } from '@/lib/mockData'
import { Skeleton } from '@/components/ui/misc'
import {
  usePagination, useInfiniteScroll,
  GridPerPageSelector, PaginationBar, InfiniteScrollSentinel
} from '@/hooks/usePagination'
import { cn } from '@/lib/utils'

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-blue-100 p-5 space-y-3 bg-white">
      <div className="flex gap-3">
        <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
      </div>
      <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
      <div className="flex gap-1.5"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /></div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  )
}

// ─── Pagination mode ───────────────────────────────────────────────
function PaginationView({ filtered }) {
  const {
    page, setPage, perPage, changePerPage,
    totalItems, totalPages, pageData, start, end,
  } = usePagination({ data: filtered, defaultPerPage: 9, storageKey: 'campus-list' })

  return (
    <div className="space-y-5">
      {/* Per-page + count bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Halaman <span className="font-semibold text-foreground">{page}</span> dari{' '}
          <span className="font-semibold text-foreground">{totalPages}</span>
          <span className="text-muted-foreground"> ({totalItems} kampus)</span>
        </p>
        <GridPerPageSelector value={perPage} onChange={changePerPage} />
      </div>

      {/* Ad card */}
      <AdCard page="kampus" />

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {pageData.map(campus => <CampusCard key={campus.id} campus={campus} />)}
        </motion.div>
      </AnimatePresence>

      {/* Pagination bar */}
      <PaginationBar
        page={page} setPage={setPage}
        totalPages={totalPages} totalItems={totalItems}
        start={start} end={end}
      />
    </div>
  )
}

// ─── Infinite scroll mode ──────────────────────────────────────────
function InfiniteView({ filtered }) {
  const { pageData, hasMore, loading, loadMore, sentinelRef, visible, total } =
    useInfiniteScroll({ data: filtered, defaultPerPage: 9 })

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Menampilkan <span className="font-semibold text-foreground">{Math.min(visible, total)}</span> dari{' '}
        <span className="font-semibold text-foreground">{total}</span> kampus
      </p>

      {/* Ad card */}
      <AdCard page="kampus" />

      {/* Grid with inline ad every 6 items */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pageData.slice(0, 6).map(campus => (
            <motion.div
              key={campus.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CampusCard campus={campus} />
            </motion.div>
          ))}
        </div>
        {pageData.length > 6 && (
          <>
            <AdInline page="kampus" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pageData.slice(6).map(campus => (
                <motion.div
                  key={campus.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CampusCard campus={campus} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sentinel / load more */}
      <InfiniteScrollSentinel
        sentinelRef={sentinelRef}
        hasMore={hasMore} loading={loading}
        loadMore={loadMore} total={total} visible={visible}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function CampusListPage() {
  const [campuses, setCampuses]     = useState([])
  const [filtered, setFiltered]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [province, setProvince]     = useState('Semua Provinsi')
  const [accreditation, setAccred]  = useState('any')
  const [type, setType]             = useState('all')
  const [itField, setItField]       = useState('all')
  const [viewMode, setViewMode]     = useState(() =>
    localStorage.getItem('dc_campus_view') || 'pagination'
  )

  // Unique IT fields from all campuses
  const [allItFields, setAllItFields] = useState([])

  useEffect(() => {
    getCampuses().then(({ data }) => {
      const list = data || []
      setCampuses(list)
      setFiltered(list)
      // Build unique IT fields
      const fields = [...new Set(list.flatMap(c => c.it_focus || []))].sort()
      setAllItFields(fields)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    let result = [...campuses]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.short_name?.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
      )
    }
    if (province !== 'Semua Provinsi') result = result.filter(c => c.province === province)
    if (accreditation !== 'any')       result = result.filter(c => c.accreditation === accreditation)
    if (type !== 'all')                result = result.filter(c => c.type === type)
    if (itField !== 'all')             result = result.filter(c => (c.it_focus || []).includes(itField))
    setFiltered(result)
  }, [search, province, accreditation, type, itField, campuses])

  function handleViewMode(v) {
    setViewMode(v)
    localStorage.setItem('dc_campus_view', v)
  }

  const hasFilter = search || province !== 'Semua Provinsi' || accreditation !== 'any' || type !== 'all' || itField !== 'all'

  function resetAll() {
    setSearch(''); setProvince('Semua Provinsi')
    setAccred('any'); setType('all'); setItField('all')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      <NotificationBar page="kampus" />
      <AdBanner page="kampus" />

      {/* Header */}
      <div className="gradient-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3">Semua Kampus IT</h1>
          <p className="text-blue-100">
            Jelajahi {campuses.length}+ kampus dengan program IT terbaik di Indonesia
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Button asChild variant="outline" size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2">
              <Link to="/bandingkan"><GitCompare className="w-4 h-4" />Bandingkan Kampus</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter panel */}
        <div className="bg-white rounded-2xl border border-blue-100 p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari kampus..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            {/* Province */}
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Accreditation */}
            <Select value={accreditation} onValueChange={setAccred}>
              <SelectTrigger><SelectValue placeholder="Akreditasi" /></SelectTrigger>
              <SelectContent>
                {ACCREDITATION_OPTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Type */}
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Jenis" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="Negeri">Negeri (PTN)</SelectItem>
                <SelectItem value="Swasta">Swasta (PTS)</SelectItem>
              </SelectContent>
            </Select>
            {/* IT Field filter */}
            <Select value={itField} onValueChange={setItField}>
              <SelectTrigger><SelectValue placeholder="Bidang IT" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bidang IT</SelectItem>
                {allItFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Active filters + reset */}
          {hasFilter && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-50 flex-wrap">
              <span className="text-xs text-muted-foreground">Filter aktif:</span>
              {search && <Badge variant="secondary" className="text-xs gap-1">Cari: "{search}"</Badge>}
              {province !== 'Semua Provinsi' && <Badge variant="info" className="text-xs">{province}</Badge>}
              {accreditation !== 'any' && <Badge variant="info" className="text-xs">{accreditation}</Badge>}
              {type !== 'all' && <Badge variant="info" className="text-xs">{type}</Badge>}
              {itField !== 'all' && <Badge variant="info" className="text-xs">{itField}</Badge>}
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto" onClick={resetAll}>
                Reset semua
              </Button>
            </div>
          )}
        </div>

        {/* Toolbar: count + view mode toggle */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span> kampus ditemukan
            </span>
            {hasFilter && filtered.length !== campuses.length && (
              <Badge variant="secondary" className="text-xs">dari {campuses.length} total</Badge>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">Mode tampilan:</span>
            <div className="flex rounded-xl border border-blue-100 overflow-hidden">
              <button
                onClick={() => handleViewMode('pagination')}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === 'pagination'
                    ? 'bg-primary text-white'
                    : 'bg-white text-muted-foreground hover:bg-blue-50'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Halaman</span>
              </button>
              <div className="w-px bg-blue-100" />
              <button
                onClick={() => handleViewMode('infinite')}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === 'infinite'
                    ? 'bg-primary text-white'
                    : 'bg-white text-muted-foreground hover:bg-blue-50'
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Scroll</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-blue-100 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Kampus Tidak Ditemukan</h3>
            <p className="text-muted-foreground mb-4">Coba ubah kata pencarian atau filter yang dipilih</p>
            <Button variant="outline" onClick={resetAll}>Reset Semua Filter</Button>
          </div>
        ) : viewMode === 'pagination' ? (
          <PaginationView filtered={filtered} />
        ) : (
          <InfiniteView filtered={filtered} />
        )}
      </div>
    </main>
  )
}
