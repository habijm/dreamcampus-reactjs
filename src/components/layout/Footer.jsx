import { Link } from 'react-router-dom'
import { GraduationCap, Heart, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-blue-100 bg-gradient-to-b from-white to-blue-50/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-extrabold text-lg">Dream</span>
                <span className="font-display font-extrabold text-lg text-gradient">Campus</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Platform rekomendasi kampus IT terbaik untuk siswa SMA yang ingin melanjutkan pendidikan di bidang teknologi informasi.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold font-display text-sm mb-4 text-foreground">Halaman</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'Beranda' },
                { href: '/rekomendasi', label: 'Rekomendasi Kampus' },
                { href: '/kampus', label: 'Semua Kampus' },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-muted-foreground text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold font-display text-sm mb-4 text-foreground">Bidang IT</h4>
            <ul className="space-y-2.5">
              {['Web Development', 'Mobile Development', 'Data Science', 'AI', 'Cyber Security'].map(field => (
                <li key={field}>
                  <span className="text-muted-foreground text-sm">{field}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © 2025 DreamCampus. Seluruh hak cipta dilindungi.
          </p>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            Dibuat dengan <Heart className="w-3 h-3 text-red-400 fill-red-400" /> untuk siswa SMA Indonesia
          </p>
        </div>
      </div>
    </footer>
  )
}
