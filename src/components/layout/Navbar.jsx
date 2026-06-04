import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GraduationCap, Menu, X, Sparkles, GitCompare, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getFeatureFlags } from '@/lib/services'
import { cn } from '@/lib/utils'

const ALL_NAV = [
  { href: '/',            label: 'Beranda',    flag: null },
  { href: '/rekomendasi', label: 'Rekomendasi',flag: 'rekomendasi', icon: Sparkles },
  { href: '/kampus',      label: 'Kampus',     flag: null },
  { href: '/bandingkan',  label: 'Bandingkan', flag: 'bandingkan',  icon: GitCompare },
  { href: '/prediksi',    label: 'Prediksi',   flag: 'prediksi',    icon: TrendingUp },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [flags, setFlags]       = useState(getFeatureFlags())
  const { pathname }            = useLocation()

  // React to flag changes (from admin panel)
  useEffect(() => {
    const sync = () => setFlags(getFeatureFlags())
    window.addEventListener('feature-flags-changed', sync)
    return () => window.removeEventListener('feature-flags-changed', sync)
  }, [])

  const visibleLinks = ALL_NAV.filter(l => !l.flag || flags[l.flag])

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-blue-100/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-foreground">Dream</span>
            <span className="font-display font-extrabold text-lg text-gradient">Campus</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === link.href
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.icon && <link.icon className="w-3.5 h-3.5" />}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {flags.rekomendasi && (
            <Button asChild size="sm" variant="gradient" className="gap-1.5">
              <Link to="/rekomendasi">
                <Sparkles className="w-4 h-4" />Cari Kampus
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-blue-100 bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {visibleLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
            {flags.rekomendasi && (
              <Button asChild size="sm" variant="gradient" className="mt-2 gap-1.5">
                <Link to="/rekomendasi" onClick={() => setMenuOpen(false)}>
                  <Sparkles className="w-4 h-4" />Cari Kampus Impian
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
