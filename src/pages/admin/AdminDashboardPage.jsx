import { useState, useEffect } from 'react'
import { Building2, BookOpen, Search, TrendingUp, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { getDashboardStats } from '@/lib/services'
import { formatNumber } from '@/lib/utils'

const STAT_CARDS = [
  { key: 'total_campuses',  label: 'Total Kampus',     icon: Building2, bg: 'bg-blue-50',    text: 'text-blue-700'    },
  { key: 'total_majors',   label: 'Total Jurusan IT',  icon: BookOpen,  bg: 'bg-purple-50',  text: 'text-purple-700'  },
  { key: 'total_searches', label: 'Total Pencarian',   icon: Search,    bg: 'bg-emerald-50', text: 'text-emerald-700' },
]

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{formatNumber(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

function StatCard({ stat, value, loading }) {
  return (
    <Card className="border-blue-100/60 overflow-hidden">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.text}`} />
              </div>
              <p className="font-display font-extrabold text-3xl text-foreground">
                {formatNumber(value || 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap">
              <ArrowUpRight className="w-3 h-3" />
              Aktif
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(({ data }) => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Page title */}
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Selamat datang kembali, Administrator</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map(stat => (
          <StatCard key={stat.key} stat={stat} value={stats?.[stat.key]} loading={loading} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Area Chart — Aktivitas Pencarian */}
        <Card className="border-blue-100/60 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Aktivitas Pencarian
            </CardTitle>
            <CardDescription>Jumlah pencarian rekomendasi per bulan</CardDescription>
          </CardHeader>
          <CardContent className="pr-2">
            {loading ? (
              <Skeleton className="h-52 w-full rounded-xl" />
            ) : (
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={stats?.monthly_searches || []}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="searches"
                      name="Pencarian"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorSearches)"
                      dot={{ fill: '#3b82f6', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart — Minat Bidang IT */}
        <Card className="border-blue-100/60 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Minat Bidang IT</CardTitle>
            <CardDescription>Distribusi minat pengguna berdasarkan bidang IT</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full rounded-xl" />
            ) : (
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats?.it_interests || []}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="count"
                      nameKey="field"
                    >
                      {(stats?.it_interests || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [formatNumber(v), n]} />
                    <Legend
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                      formatter={v => <span style={{ color: '#64748b' }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart — Top Recommended */}
      <Card className="border-blue-100/60 min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kampus Paling Sering Direkomendasikan</CardTitle>
          <CardDescription>Berdasarkan total hasil rekomendasi sistem</CardDescription>
        </CardHeader>
        <CardContent className="pr-2">
          {loading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : (
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={stats?.top_recommended || []}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Rekomendasi" radius={[6, 6, 0, 0]}>
                    {(stats?.top_recommended || []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
