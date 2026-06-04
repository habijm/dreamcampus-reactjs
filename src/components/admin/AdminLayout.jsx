import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet, Navigate } from 'react-router-dom'
import {
  GraduationCap, LayoutDashboard, Building2, BookOpen,
  BarChart3, LogOut, Menu, ChevronRight, Shield, Upload, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { adminLogout, getAdminSession } from '@/lib/services'

const USE_MOCK = !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/admin/kampus',    label: 'Manajemen Kampus',  icon: Building2 },
  { href: '/admin/jurusan',   label: 'Manajemen Jurusan', icon: BookOpen },
  { href: '/admin/import',    label: 'Import Data',       icon: Upload },
  { href: '/admin/statistik', label: 'Statistik',         icon: BarChart3 },
  { href: '/admin/fitur',     label: 'Pengaturan Fitur',  icon: Settings },
]

function NavItem({ item, collapsed, onClick }) {
  const { pathname } = useLocation()
  const active = pathname === item.href
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        active ? 'gradient-primary text-white shadow-md' : 'text-slate-600 hover:bg-blue-50 hover:text-primary'
      )}
    >
      <item.icon className={cn("w-5 h-5 flex-shrink-0", active ? 'text-white' : 'text-slate-500')} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authState, setAuthState]   = useState('loading')

  useEffect(() => {
    async function checkAuth() {
      if (USE_MOCK) {
        setAuthState(localStorage.getItem('dc_admin') === 'true' ? 'auth' : 'unauth')
      } else {
        const { session } = await getAdminSession()
        setAuthState(session ? 'auth' : 'unauth')
      }
    }
    checkAuth()
  }, [])

  async function handleLogout() {
    localStorage.removeItem('dc_admin')
    await adminLogout()
    navigate('/admin/login')
  }

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Memeriksa sesi...</p>
        </div>
      </div>
    )
  }

  if (authState === 'unauth') return <Navigate to="/admin/login" replace />

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-blue-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-display font-extrabold text-base leading-tight">
                <span>Dream</span><span className="text-gradient">Campus</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} item={item} collapsed={collapsed} onClick={onNavClick} />
        ))}
      </nav>

      <div className="p-3 border-t border-blue-100 space-y-2">
        <Button
          variant="ghost" size="sm" onClick={handleLogout}
          className={cn("w-full text-red-500 hover:text-red-600 hover:bg-red-50 gap-2", collapsed && "px-2")}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && 'Keluar'}
        </Button>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />Lihat Website
          </Link>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <aside className={cn(
        "hidden lg:flex flex-col bg-white border-r border-blue-100 transition-all duration-300 flex-shrink-0 relative",
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-full top-20 bg-white border border-blue-100 rounded-r-lg p-1.5 shadow-sm hover:bg-blue-50 transition-colors z-10"
          style={{ marginLeft: '-1px' }}
        >
          <ChevronRight className={cn("w-3.5 h-3.5 text-blue-400 transition-transform", collapsed ? '' : 'rotate-180')} />
        </button>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white shadow-2xl z-10">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-40 bg-white border-b border-blue-100 h-14 flex items-center px-4 gap-3 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-foreground leading-tight">Administrator</p>
              <p className="text-xs text-muted-foreground">admin@dreamcampus.id</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <div className="max-w-full"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
