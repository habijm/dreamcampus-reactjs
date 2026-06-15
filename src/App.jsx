import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminLayout from '@/components/admin/AdminLayout'
import FeatureGate from '@/components/FeatureGate'
import { Toaster } from '@/components/ui/toast'

// Public pages
import LandingPage        from '@/pages/LandingPage'
import RecommendationPage from '@/pages/RecommendationPage'
import CampusListPage     from '@/pages/CampusListPage'
import CampusDetailPage   from '@/pages/CampusDetailPage'
import ComparePage        from '@/pages/ComparePage'
import PredictionPage     from '@/pages/PredictionPage'
import JurusanInfoPage    from '@/pages/JurusanInfoPage'

// Admin pages
import AdminLoginPage      from '@/pages/admin/AdminLoginPage'
import AdminDashboardPage  from '@/pages/admin/AdminDashboardPage'
import AdminCampusPage     from '@/pages/admin/AdminCampusPage'
import AdminMajorPage      from '@/pages/admin/AdminMajorPage'
import AdminStatistikPage  from '@/pages/admin/AdminStatistikPage'
import AdminImportPage     from '@/pages/admin/AdminImportPage'
import AdminFiturPage      from '@/pages/admin/AdminFiturPage'
import AdminIklanPage      from '@/pages/admin/AdminIklanPage'
import AdminRecycleBinPage from '@/pages/admin/AdminRecycleBinPage'

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}

// Halaman 404
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-8xl font-display font-extrabold text-gradient mb-4">404</div>
      <h2 className="font-display font-bold text-2xl mb-3">Halaman Tidak Ditemukan</h2>
      <p className="text-muted-foreground mb-6">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white
          rounded-xl font-semibold hover:bg-blue-700 transition-colors"
      >
        Kembali ke Beranda
      </a>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={
          <PublicLayout><LandingPage /></PublicLayout>
        } />
        <Route path="/kampus" element={
          <PublicLayout><CampusListPage /></PublicLayout>
        } />
        <Route path="/kampus/:id" element={
          <PublicLayout><CampusDetailPage /></PublicLayout>
        } />
        <Route path="/jurusan" element={
          <PublicLayout><JurusanInfoPage /></PublicLayout>
        } />

        {/* ── Feature-gated routes — baca flag dari DB ── */}
        <Route path="/rekomendasi" element={
          <FeatureGate flag="rekomendasi">
            <PublicLayout><RecommendationPage /></PublicLayout>
          </FeatureGate>
        } />
        <Route path="/bandingkan" element={
          <FeatureGate flag="bandingkan">
            <PublicLayout><ComparePage /></PublicLayout>
          </FeatureGate>
        } />
        <Route path="/prediksi" element={
          <FeatureGate flag="prediksi">
            <PublicLayout><PredictionPage /></PublicLayout>
          </FeatureGate>
        } />

        {/* ── Admin ── */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard"   element={<AdminDashboardPage />} />
          <Route path="kampus"      element={<AdminCampusPage />} />
          <Route path="jurusan"     element={<AdminMajorPage />} />
          <Route path="import"      element={<AdminImportPage />} />
          <Route path="statistik"   element={<AdminStatistikPage />} />
          <Route path="fitur"       element={<AdminFiturPage />} />
          <Route path="iklan"       element={<AdminIklanPage />} />
          <Route path="recycle-bin" element={<AdminRecycleBinPage />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={
          <PublicLayout><NotFoundPage /></PublicLayout>
        } />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
