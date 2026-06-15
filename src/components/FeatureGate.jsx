/**
 * FeatureGate.jsx
 * ─────────────────────────────────────────────────────────────────
 * Wrapper komponen yang membaca feature flags dari DB (async).
 * Digunakan di App.jsx untuk membungkus route yang bisa dimatikan.
 *
 * Cara pakai di App.jsx:
 *   <Route path="/rekomendasi" element={
 *     <FeatureGate flag="rekomendasi">
 *       <PublicLayout><RecommendationPage /></PublicLayout>
 *     </FeatureGate>
 *   } />
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFeatureFlags, subscribeFlags } from '@/lib/featureFlags'
import { Skeleton } from '@/components/ui/misc'

// ─── Halaman "Fitur Nonaktif" ──────────────────────────────────────
function FeatureDisabledPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-7xl mb-6 select-none">🚧</div>
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <span className="text-2xl">⚙️</span>
      </div>
      <h2 className="font-display font-extrabold text-2xl md:text-3xl text-foreground mb-3">
        Fitur Sedang Tidak Tersedia
      </h2>
      <p className="text-muted-foreground max-w-sm leading-relaxed mb-2">
        Fitur ini sedang dinonaktifkan sementara oleh administrator.
      </p>
      <p className="text-sm text-muted-foreground/70 mb-8">
        Silakan coba kembali nanti atau hubungi administrator.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3
            bg-primary text-white rounded-xl font-semibold text-sm
            hover:bg-blue-700 transition-colors"
        >
          Kembali ke Beranda
        </Link>
        <Link
          to="/kampus"
          className="inline-flex items-center justify-center gap-2 px-6 py-3
            border-2 border-blue-200 text-primary rounded-xl font-semibold text-sm
            hover:bg-blue-50 transition-colors"
        >
          Lihat Kampus
        </Link>
      </div>
    </div>
  )
}

// ─── Loading skeleton saat cek flag ───────────────────────────────
function FlagLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Memuat halaman...</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
export default function FeatureGate({ flag, children }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'enabled' | 'disabled'

  useEffect(() => {
    let mounted = true

    async function checkFlag() {
      const flags = await getFeatureFlags()
      if (!mounted) return
      setStatus(flags[flag] === false ? 'disabled' : 'enabled')
    }

    checkFlag()

    // Subscribe real-time perubahan (Supabase realtime / BroadcastChannel)
    const unsub = subscribeFlags(newFlags => {
      if (!mounted) return
      setStatus(newFlags[flag] === false ? 'disabled' : 'enabled')
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [flag])

  if (status === 'loading')  return <FlagLoadingSkeleton />
  if (status === 'disabled') return <FeatureDisabledPage />
  return children
}
