import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Award, Globe, GraduationCap, Banknote, Calendar, Users, ArrowLeft, ExternalLink, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/misc'
import { getCampusById, getMajors } from '@/lib/services'
import { formatCurrency, getAccreditationColor } from '@/lib/utils'

function InfoRow({ icon: Icon, label, value, className }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold text-foreground ${className || ''}`}>{value}</p>
      </div>
    </div>
  )
}

export default function CampusDetailPage() {
  const { id } = useParams()
  const [campus, setCampus] = useState(null)
  const [majors, setMajors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getCampusById(id), getMajors(id)]).then(([c, m]) => {
      if (c.error) { setError(c.error.message); setLoading(false); return }
      setCampus(c.data)
      setMajors(m.data || [])
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
          <div className="lg:col-span-2 space-y-4"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
        </div>
      </div>
    )
  }

  if (error || !campus) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-bold text-2xl mb-4">Kampus tidak ditemukan</h2>
        <Button asChild variant="outline"><Link to="/kampus"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Link></Button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      {/* Header banner */}
      <div className="gradient-primary py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 mb-4 gap-1.5">
            <Link to="/kampus"><ArrowLeft className="w-4 h-4" />Semua Kampus</Link>
          </Button>
          <div className="flex items-center gap-4">
            {campus.logo_url ? (
              <img src={campus.logo_url} alt={campus.name} className="w-16 h-16 rounded-2xl object-contain bg-white p-1.5 shadow-lg" />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white font-display font-bold text-lg shadow-lg">
                {campus.short_name?.slice(0, 3) || campus.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">{campus.name}</h1>
              <p className="text-blue-100">{campus.short_name} • {campus.type}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            {/* Quick Info */}
            <Card className="border-blue-100/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informasi Kampus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow icon={MapPin} label="Lokasi" value={`${campus.location}, ${campus.province}`} />
                <InfoRow icon={Award} label="Akreditasi" value={
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getAccreditationColor(campus.accreditation)}`}>{campus.accreditation}</span>
                } />
                <InfoRow icon={Banknote} label="Biaya Kuliah" value={
                  campus.min_tuition === 0
                    ? `Gratis – ${formatCurrency(campus.max_tuition)}/semester`
                    : `${formatCurrency(campus.min_tuition)} – ${formatCurrency(campus.max_tuition)}/semester`
                } />
                {campus.established_year && <InfoRow icon={Calendar} label="Tahun Berdiri" value={campus.established_year} />}
                {campus.student_count && <InfoRow icon={Users} label="Jumlah Mahasiswa" value={`${campus.student_count.toLocaleString('id-ID')}+`} />}
              </CardContent>
            </Card>

            {/* IT Focus */}
            {campus.it_focus?.length > 0 && (
              <Card className="border-blue-100/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Fokus Bidang IT</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {campus.it_focus.map(field => (
                      <Badge key={field} variant="info" className="text-xs px-2.5 py-1">{field}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <div className="space-y-3">
              {campus.website && (
                <Button asChild variant="outline" className="w-full gap-2">
                  <a href={campus.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4" />Website Resmi
                    <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-60" />
                  </a>
                </Button>
              )}
              <Button asChild variant="gradient" className="w-full gap-2">
                <Link to="/rekomendasi">
                  <Sparkles className="w-4 h-4" />Lihat Rekomendasi Lain
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <Card className="border-blue-100/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tentang {campus.short_name || campus.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{campus.description}</p>
              </CardContent>
            </Card>

            {/* Majors */}
            <Card className="border-blue-100/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Jurusan IT ({majors.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {majors.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Data jurusan belum tersedia</p>
                ) : (
                  <div className="space-y-3">
                    {majors.map((major, i) => (
                      <div key={major.id}>
                        {i > 0 && <Separator className="mb-3" />}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{major.name}</h4>
                              <Badge variant="secondary" className="text-xs">{major.degree}</Badge>
                            </div>
                            {major.it_fields?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {major.it_fields.map(f => (
                                  <span key={f} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{f}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {major.accreditation && (
                              <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${getAccreditationColor(major.accreditation)}`}>
                                {major.accreditation}
                              </span>
                            )}
                            {major.tuition_per_semester && (
                              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(major.tuition_per_semester)}/sem</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
