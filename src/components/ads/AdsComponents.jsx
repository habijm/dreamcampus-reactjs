import { useState, useEffect } from 'react'
import { X, ExternalLink, Info, AlertTriangle, CheckCircle2, Zap, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─── Color configs ─────────────────────────────────────────────────
const AD_COLORS = {
  blue:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-900',   sub: 'text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700',   icon: 'bg-blue-100 text-blue-600'   },
  purple:  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', sub: 'text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700',icon: 'bg-purple-100 text-purple-600'},
  emerald: { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-900',sub: 'text-emerald-700',btn: 'bg-emerald-600 hover:bg-emerald-700',icon:'bg-emerald-100 text-emerald-600'},
  amber:   { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-900',  sub: 'text-amber-700',  btn: 'bg-amber-600 hover:bg-amber-700',  icon: 'bg-amber-100 text-amber-600'  },
}

const NOTIF_STYLES = {
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-900',  icon: Info,            iconColor: 'text-blue-500'   },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-900', icon: AlertTriangle,   iconColor: 'text-amber-500'  },
  success: { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-900',icon: CheckCircle2,   iconColor: 'text-emerald-500'},
  urgent:  { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-900',   icon: Zap,             iconColor: 'text-red-500'    },
}

// ─── Dismissed notifications (per browser) ─────────────────────────
const DISMISSED_KEY = 'dc_dismissed_notifs_v4'

function getDismissedLocal() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
}

function dismissLocal(id) {
  const list = getDismissedLocal()
  if (!list.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]))
  }
}

// ─── Hook: load ads & notifs dari adsManager (jika ada) atau services ──
function useAdsConfig() {
  const [ads, setAds]       = useState([])
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    let mounted = true
    let unsub = () => {}

    async function load() {
      try {
        // Coba gunakan adsManager (tersedia setelah file dipasang)
        const mod = await import('@/lib/adsManager').catch(() => null)
        if (mod && mounted) {
          const { ads: a, notifs: n } = await mod.getAdsConfig()
          if (!mounted) return
          setAds(a || [])
          setNotifs(n || [])

          // Subscribe real-time
          unsub = mod.subscribeAdsConfig(({ ads: newA, notifs: newN }) => {
            if (!mounted) return
            setAds(newA || [])
            setNotifs(newN || [])
          })
          return
        }
      } catch { /* fallback ke services */ }

      // Fallback: gunakan services.js lama
      try {
        const svc = await import('@/lib/services')
        if (!mounted) return
        setAds(svc.getAds?.() || [])
        setNotifs(svc.getNotifications?.() || [])

        // Subscribe event lama
        const syncAds   = () => { if (mounted) setAds(svc.getAds?.() || []) }
        const syncNotif = () => { if (mounted) setNotifs(svc.getNotifications?.() || []) }
        window.addEventListener('dc-ads-changed', syncAds)
        window.addEventListener('dc-notif-changed', syncNotif)
        unsub = () => {
          window.removeEventListener('dc-ads-changed', syncAds)
          window.removeEventListener('dc-notif-changed', syncNotif)
        }
      } catch (e) {
        console.warn('[AdsComponents] Gagal load ads config:', e)
      }
    }

    load()
    return () => { mounted = false; unsub() }
  }, [])

  return { ads, notifs }
}

// ─── Notification Bar (top of page) ───────────────────────────────
export function NotificationBar({ page = 'all' }) {
  const { notifs }            = useAdsConfig()
  const [dismissed, setDismissed] = useState(() => getDismissedLocal())

  const visible = notifs.filter(
    n => n.active && (n.position === 'all' || n.position === page) && !dismissed.includes(n.id)
  )

  if (!visible.length) return null

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {visible.map(notif => {
          const s = NOTIF_STYLES[notif.type] || NOTIF_STYLES.info
          const Icon = s.icon
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={cn("flex items-start gap-3 px-4 py-3 border-b text-sm", s.bg, s.border, s.text)}>
                <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", s.iconColor)} />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{notif.title} </span>
                  <span className="opacity-90">{notif.message}</span>
                  {notif.link && (
                    <a href={notif.link} className="ml-2 underline font-semibold hover:opacity-80 inline-flex items-center gap-0.5">
                      {notif.linkText}<ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {notif.dismissable && (
                  <button
                    onClick={() => {
                      dismissLocal(notif.id)
                      setDismissed(getDismissedLocal())
                    }}
                    className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity mt-0.5"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ─── Banner Ad (horizontal, below header) ─────────────────────────
export function AdBanner({ page = 'all' }) {
  const { ads }             = useAdsConfig()
  const [closed, setClosed]       = useState(false)
  const [currentAdId, setCurrentAdId] = useState(null)

  const match = ads.find(
    a => a.active && a.type === 'banner' && (a.position === 'all' || a.position === page)
  )

  // Reset "closed" jika iklan berubah (admin update)
  useEffect(() => {
    if (match && match.id !== currentAdId) {
      setCurrentAdId(match.id)
      setClosed(false)
    }
  }, [match?.id])

  if (!match || closed) return null
  const c = AD_COLORS[match.color] || AD_COLORS.blue

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.35 }}
        className={cn("border-b", c.bg, c.border)}
      >
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex-shrink-0">Iklan</span>
          <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
            <span className={cn("font-semibold text-sm truncate", c.text)}>{match.title}</span>
            <span className={cn("text-xs hidden sm:block truncate", c.sub)}>{match.description}</span>
          </div>
          <a
            href={match.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={cn("flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors", c.btn)}
          >
            {match.cta} <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setClosed(true)}
            className={cn("flex-shrink-0 hover:opacity-60 transition-opacity", c.text)}
            aria-label="Tutup iklan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Card Ad (inline in content) ──────────────────────────────────
export function AdCard({ page = 'all', className }) {
  const { ads }             = useAdsConfig()
  const [closed, setClosed]       = useState(false)
  const [currentAdId, setCurrentAdId] = useState(null)

  const match = ads.find(
    a => a.active && a.type === 'card' && (a.position === 'all' || a.position === page)
  )

  useEffect(() => {
    if (match && match.id !== currentAdId) {
      setCurrentAdId(match.id)
      setClosed(false)
    }
  }, [match?.id])

  if (!match || closed) return null
  const c = AD_COLORS[match.color] || AD_COLORS.blue

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.35 }}
        className={cn("relative rounded-2xl border-2 p-4", c.bg, c.border, className)}
      >
        <span className="absolute top-2 right-8 text-[9px] font-bold uppercase tracking-widest opacity-30">Iklan</span>
        <button
          onClick={() => setClosed(true)}
          className={cn("absolute top-2 right-2 hover:opacity-60 transition-opacity", c.text)}
          aria-label="Tutup iklan"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-start gap-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", c.icon)}>
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className={cn("font-semibold text-sm mb-0.5", c.text)}>{match.title}</p>
            <p className={cn("text-xs leading-relaxed mb-2", c.sub)}>{match.description}</p>
            <a
              href={match.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={cn("inline-flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-colors", c.btn)}
            >
              {match.cta} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Inline Ad (between content rows) ─────────────────────────────
export function AdInline({ page = 'all', className }) {
  const { ads }             = useAdsConfig()
  const [closed, setClosed]       = useState(false)
  const [currentAdId, setCurrentAdId] = useState(null)

  const match = ads.find(
    a => a.active && a.type === 'inline' && (a.position === 'all' || a.position === page)
  )

  useEffect(() => {
    if (match && match.id !== currentAdId) {
      setCurrentAdId(match.id)
      setClosed(false)
    }
  }, [match?.id])

  if (!match || closed) return null
  const c = AD_COLORS[match.color] || AD_COLORS.blue

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", c.bg, c.border, className)}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-30 flex-shrink-0">Iklan</span>
        <div className="flex-1 min-w-0">
          <span className={cn("font-semibold text-xs", c.text)}>{match.title} </span>
          <span className={cn("text-xs opacity-80 hidden sm:inline", c.sub)}>{match.description}</span>
        </div>
        <a
          href={match.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={cn("flex-shrink-0 text-xs font-bold text-white px-2.5 py-1 rounded-lg transition-colors", c.btn)}
        >
          {match.cta}
        </a>
        <button
          onClick={() => setClosed(true)}
          className={cn("flex-shrink-0 hover:opacity-60", c.text)}
          aria-label="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
