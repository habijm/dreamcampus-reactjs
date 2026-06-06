import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ─── usePagination hook ────────────────────────────────────────────
export function usePagination({ data = [], defaultPerPage = 9, storageKey = null }) {
  const [page, setPage]         = useState(1)
  const [perPage, setPerPage]   = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`dc_perpage_${storageKey}`)
      return saved ? Number(saved) : defaultPerPage
    }
    return defaultPerPage
  })

  // Reset to page 1 when data or perPage changes
  useEffect(() => { setPage(1) }, [data.length, perPage])

  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
  const safePage   = Math.min(page, totalPages)
  const start      = (safePage - 1) * perPage
  const end        = Math.min(start + perPage, totalItems)
  const pageData   = data.slice(start, end)

  function changePerPage(val) {
    const n = Number(val)
    setPerPage(n)
    if (storageKey) localStorage.setItem(`dc_perpage_${storageKey}`, n)
  }

  return {
    page: safePage, setPage, perPage, changePerPage,
    totalItems, totalPages, pageData, start, end,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  }
}

// ─── useInfiniteScroll hook ────────────────────────────────────────
export function useInfiniteScroll({ data = [], defaultPerPage = 9 }) {
  const [visible, setVisible]   = useState(defaultPerPage)
  const [loading, setLoading]   = useState(false)
  const sentinelRef             = useRef(null)

  // Reset when data changes
  useEffect(() => { setVisible(defaultPerPage) }, [data.length, defaultPerPage])

  const pageData   = data.slice(0, visible)
  const hasMore    = visible < data.length

  // IntersectionObserver for auto-load
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setLoading(true)
        setTimeout(() => {
          setVisible(v => v + defaultPerPage)
          setLoading(false)
        }, 400) // small delay for smooth feel
      }
    }, { threshold: 0.1 })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, defaultPerPage])

  function loadMore() {
    setLoading(true)
    setTimeout(() => {
      setVisible(v => v + defaultPerPage)
      setLoading(false)
    }, 300)
  }

  return { pageData, hasMore, loading, loadMore, sentinelRef, visible, total: data.length }
}

// ─── PER PAGE selector ─────────────────────────────────────────────
const PER_PAGE_OPTIONS_GRID = [6, 9, 12, 24, 48]
const PER_PAGE_OPTIONS_TABLE = [5, 10, 20, 50]

export function PerPageSelector({ value, onChange, options, label = 'Tampilkan' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">{label}:</span>
      <Select value={String(value)} onValueChange={v => onChange(Number(v))}>
        <SelectTrigger className="w-20 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(n => (
            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export const GridPerPageSelector = ({ value, onChange }) => (
  <PerPageSelector value={value} onChange={onChange} options={PER_PAGE_OPTIONS_GRID} label="Per halaman" />
)

export const TablePerPageSelector = ({ value, onChange }) => (
  <PerPageSelector value={value} onChange={onChange} options={PER_PAGE_OPTIONS_TABLE} label="Baris" />
)

// ─── Pagination controls ───────────────────────────────────────────
export function PaginationBar({ page, totalPages, setPage, totalItems, start, end, className }) {
  if (totalPages <= 1) return null

  // Generate page numbers to show
  function getPages() {
    const delta = 2
    const pages = []
    const left  = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)
    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-blue-100", className)}>
      {/* Info */}
      <p className="text-sm text-muted-foreground order-2 sm:order-1">
        Menampilkan <span className="font-semibold text-foreground">{start + 1}–{end}</span> dari{' '}
        <span className="font-semibold text-foreground">{totalItems}</span> item
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => setPage(1)} disabled={page === 1}>
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
          ) : (
            <Button key={p} variant={p === page ? 'default' : 'outline'}
              size="icon" className="h-8 w-8 text-xs"
              onClick={() => setPage(p)}>
              {p}
            </Button>
          )
        )}

        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => setPage(totalPages)} disabled={page === totalPages}>
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Infinite scroll sentinel + load more button ───────────────────
export function InfiniteScrollSentinel({ sentinelRef, hasMore, loading, loadMore, total, visible }) {
  if (!hasMore) return (
    <p className="text-center text-sm text-muted-foreground py-4">
      Semua {total} kampus telah ditampilkan
    </p>
  )
  return (
    <div ref={sentinelRef} className="flex flex-col items-center gap-3 py-6">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-primary rounded-full animate-spin" />
          Memuat lebih banyak...
        </div>
      ) : (
        <Button variant="outline" className="gap-2" onClick={loadMore}>
          Muat Lebih Banyak
          <span className="text-xs text-muted-foreground">({total - visible} lagi)</span>
        </Button>
      )}
    </div>
  )
}
