import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { getDashboardStats } from '@/lib/services'
import { formatNumber } from '@/lib/utils'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }}>
          {e.name}: <strong>{formatNumber(e.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function AdminStatistikPage() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(({ data }) => { setStats(data); setLoading(false) })
  }, [])

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <h1 className="font-display font-bold text-2xl">Statistik</h1>
        <p className="text-muted-foreground text-sm mt-1">Analisis penggunaan dan tren rekomendasi kampus</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pencarian', value: stats?.total_searches, icon: BarChart3,  color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Total Kampus',    value: stats?.total_campuses, icon: Award,      color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Jurusan',   value: stats?.total_majors,   icon: Users,      color: 'text-emerald-600',bg: 'bg-emerald-50'},
          { label: 'Bidang IT',       value: 7,                     icon: TrendingUp, color: 'text-amber-600',  bg: 'bg-amber-50'  },
        ].map(card => (
          <Card key={card.label} className="border-blue-100/60">
            <CardContent className="p-4">
              {loading ? <Skeleton className="h-16" /> : (
                <>
                  <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center mb-2`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="font-display font-extrabold text-2xl">{formatNumber(card.value || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Monthly trend */}
        <Card className="lg:col-span-2 border-blue-100/60 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Tren Pencarian Bulanan
            </CardTitle>
            <CardDescription>Jumlah pencarian rekomendasi per bulan</CardDescription>
          </CardHeader>
          <CardContent className="pr-2">
            {loading ? <Skeleton className="h-52" /> : (
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart
                    data={stats?.monthly_searches || []}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
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
                      strokeWidth={2.5}
                      fill="url(#grad1)"
                      dot={{ fill: '#3b82f6', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IT Interest distribution — progress bars */}
        <Card className="border-blue-100/60 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribusi Minat IT</CardTitle>
            <CardDescription>Persentase minat per bidang</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52" /> : (
              <div className="space-y-2.5 mt-1">
                {(stats?.it_interests || []).map((item, i) => {
                  const total = (stats?.it_interests || []).reduce((s, x) => s + x.count, 0)
                  const pct   = Math.round((item.count / total) * 100)
                  return (
                    <div key={item.field}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-foreground truncate mr-2">{item.field}</span>
                        <span className="text-muted-foreground flex-shrink-0">{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top recommended — horizontal bar */}
        <Card className="border-blue-100/60 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kampus Paling Sering Direkomendasikan</CardTitle>
            <CardDescription>Top 5 kampus berdasarkan frekuensi rekomendasi</CardDescription>
          </CardHeader>
          <CardContent className="pr-2">
            {loading ? <Skeleton className="h-52" /> : (
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart
                    data={stats?.top_recommended || []}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Rekomendasi" radius={[0, 6, 6, 0]}>
                      {(stats?.top_recommended || []).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IT Interest Pie */}
        <Card className="border-blue-100/60 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Minat Bidang IT (Pie)</CardTitle>
            <CardDescription>Proporsi minat pengguna per bidang teknologi</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52" /> : (
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={stats?.it_interests || []}
                      cx="50%"
                      cy="45%"
                      outerRadius={70}
                      dataKey="count"
                      nameKey="field"
                    >
                      {(stats?.it_interests || []).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [formatNumber(v), n]} />
                    <Legend
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{ fontSize: 10 }}
                      formatter={v => <span style={{ color: '#64748b' }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
