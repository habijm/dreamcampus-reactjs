import { Link } from 'react-router-dom'
import { MapPin, Award, Banknote, ArrowRight, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, getAccreditationColor } from '@/lib/utils'

function CampusLogo({ campus, size = 'md' }) {
  const sizes = { sm: 'w-10 h-10 text-sm', md: 'w-14 h-14 text-base', lg: 'w-20 h-20 text-xl' }
  if (campus.logo_url) {
    return <img src={campus.logo_url} alt={campus.name} className={cn("rounded-xl object-contain bg-white border border-blue-100", sizes[size])} />
  }
  return (
    <div className={cn("rounded-xl gradient-primary flex items-center justify-center text-white font-bold font-display shadow-md flex-shrink-0", sizes[size])}>
      {campus.short_name?.slice(0, 3) || campus.name.slice(0, 2).toUpperCase()}
    </div>
  )
}

export function CampusCard({ campus, showScore = false }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-blue-100/60">
      {/* Score bar */}
      {showScore && campus.score !== undefined && (
        <div className="h-1.5 w-full bg-gray-100">
          <div
            className={cn("h-full transition-all duration-700", campus.score >= 80 ? 'bg-emerald-500' : campus.score >= 60 ? 'bg-blue-500' : campus.score >= 40 ? 'bg-amber-500' : 'bg-red-400')}
            style={{ width: `${campus.score}%` }}
          />
        </div>
      )}

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <CampusLogo campus={campus} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-foreground text-sm leading-tight truncate">{campus.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{campus.short_name} • {campus.type}</p>
              </div>
              {showScore && campus.score !== undefined && (
                <div className={cn("flex-shrink-0 font-display font-extrabold text-lg", campus.score >= 80 ? 'text-emerald-600' : campus.score >= 60 ? 'text-blue-600' : 'text-amber-600')}>
                  {campus.score}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>{campus.location}, {campus.province}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className={cn("px-1.5 py-0.5 rounded-md text-xs font-medium border", getAccreditationColor(campus.accreditation))}>
              {campus.accreditation}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Banknote className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>
              {campus.min_tuition === 0 ? 'Gratis' : formatCurrency(campus.min_tuition)}
              {campus.max_tuition > 0 && campus.min_tuition !== campus.max_tuition && ` – ${formatCurrency(campus.max_tuition)}`}
              /semester
            </span>
          </div>
        </div>

        {/* IT Focus Tags */}
        {campus.it_focus?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {campus.it_focus.slice(0, 3).map(field => (
              <Badge key={field} variant="info" className="text-xs px-2 py-0.5">{field}</Badge>
            ))}
            {campus.it_focus.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">+{campus.it_focus.length - 3}</Badge>
            )}
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="w-full gap-1.5 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
          <Link to={`/kampus/${campus.id}`}>
            Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export { CampusLogo }
