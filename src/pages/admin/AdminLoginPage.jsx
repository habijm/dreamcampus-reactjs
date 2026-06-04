import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { adminLogin } from '@/lib/services'
import { toast } from '@/components/ui/toast'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Demo mode bypass
    const USE_MOCK = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url'
    if (USE_MOCK) {
      if (email === 'admin@dreamcampus.id' && password === 'admin123') {
        localStorage.setItem('dc_admin', 'true')
        navigate('/admin/dashboard')
        setLoading(false)
        return
      } else {
        setError('Email atau password salah. Demo: admin@dreamcampus.id / admin123')
        setLoading(false)
        return
      }
    }

    const { data, error: authError } = await adminLogin(email, password)
    setLoading(false)
    if (authError) {
      setError('Email atau password salah.')
      return
    }
    navigate('/admin/dashboard')
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      {/* Decorative */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl">Dream</span>
              <span className="font-display font-extrabold text-2xl text-gradient">Campus</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Admin Dashboard</p>
        </div>

        <Card className="shadow-2xl border-blue-100/60">
          <CardHeader className="pb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Masuk ke Dashboard</CardTitle>
            <CardDescription>Gunakan akun admin untuk mengakses panel manajemen</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Admin</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@dreamcampus.id"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" variant="gradient" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memverifikasi...</>
                ) : (
                  <><Shield className="w-4 h-4" />Masuk ke Dashboard</>
                )}
              </Button>
            </form>

            {/* Demo hint */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 font-medium mb-1">🔑 Demo Login</p>
              <p className="text-xs text-amber-700">Email: admin@dreamcampus.id</p>
              <p className="text-xs text-amber-700">Password: admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
