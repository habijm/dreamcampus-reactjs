import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Sparkles, Building2, Award, Target, Brain,
  Shield, Globe, Smartphone, BarChart3, Palette, Network,
  Search, Star, GitCompare, ChevronRight, Zap
} from 'lucide-react'
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CampusCard } from '@/components/campus/CampusCard'
import { getFeaturedCampuses } from '@/lib/services'
import { Skeleton } from '@/components/ui/misc'

gsap.registerPlugin(ScrollTrigger)

// ─── Data ──────────────────────────────────────────────────────────
const IT_FIELDS = [
  { icon: Globe,      label: 'Web Development',      color: 'from-blue-500 to-blue-600',    bg: 'bg-blue-50',   text: 'text-blue-700'   },
  { icon: Smartphone, label: 'Mobile Development',   color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-700' },
  { icon: BarChart3,  label: 'Data Science',         color: 'from-emerald-500 to-emerald-600',bg:'bg-emerald-50',text:'text-emerald-700' },
  { icon: Brain,      label: 'Artificial Intelligence',color:'from-orange-500 to-orange-600',bg:'bg-orange-50', text:'text-orange-700'  },
  { icon: Shield,     label: 'Cyber Security',       color: 'from-red-500 to-red-600',      bg: 'bg-red-50',    text: 'text-red-700'    },
  { icon: Palette,    label: 'UI/UX Design',         color: 'from-pink-500 to-pink-600',    bg: 'bg-pink-50',   text: 'text-pink-700'   },
  { icon: Network,    label: 'Network Engineering',  color: 'from-cyan-500 to-cyan-600',    bg: 'bg-cyan-50',   text: 'text-cyan-700'   },
]

const STEPS = [
  { step: '01', title: 'Isi Preferensimu',  desc: 'Pilih jurusan, bidang IT, lokasi, akreditasi, dan biaya kuliah yang sesuai.', icon: Target },
  { step: '02', title: 'Analisis Sistem',   desc: 'Content Based Filtering mencocokkan profilmu dengan data ratusan kampus IT.', icon: Brain },
  { step: '03', title: 'Temukan Kampus',    desc: 'Dapatkan daftar kampus terbaik dengan skor kecocokan yang transparan.', icon: Star },
]

const STATS = [
  { value: '8+',    label: 'Kampus IT',   icon: Building2 },
  { value: '15+',   label: 'Jurusan IT',  icon: Award },
  { value: '1.2K+', label: 'Pencarian',   icon: Search },
  { value: '7',     label: 'Bidang IT',   icon: Target },
]

// ─── Reusable animation variants ───────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }
  }),
}

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut', delay: i * 0.08 }
  }),
}

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.85 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }
  }),
}

// ─── Section header component ───────────────────────────────────────
function SectionHeader({ badge, title, subtitle, light = false }) {
  const ref  = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <div ref={ref} className="text-center mb-14">
      {badge && (
        <motion.div
          variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={0}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4
            bg-blue-100/80 text-blue-700 border border-blue-200/60"
        >
          <Zap className="w-3.5 h-3.5" />{badge}
        </motion.div>
      )}
      <motion.h2
        variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={1}
        className={`font-display font-extrabold text-3xl md:text-4xl leading-tight mb-4 ${light ? 'text-white' : 'text-foreground'}`}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={2}
          className={`text-lg max-w-xl mx-auto ${light ? 'text-blue-100' : 'text-muted-foreground'}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

// ─── Animated counter ───────────────────────────────────────────────
function AnimatedNumber({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const num = parseInt(value.replace(/\D/g, ''))
  const suffix = value.replace(/[0-9]/g, '')
  const spring = useSpring(0, { stiffness: 80, damping: 20 })

  useEffect(() => {
    if (inView) spring.set(num)
  }, [inView, num])

  const display = useTransform(spring, v => `${Math.round(v)}${suffix}`)

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>
    </span>
  )
}

// ─── Floating particles ─────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 3,
    x: Math.random() * 100,
    y: Math.random() * 100,
    dur: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-400/20"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.3, 1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ─── Skeleton campus card ───────────────────────────────────────────
function SkeletonCampusCard() {
  return (
    <div className="rounded-2xl border border-blue-100 p-5 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [campuses, setCampuses] = useState([])
  const [loading, setLoading]   = useState(true)

  // Parallax
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const heroY    = useTransform(scrollY, [0, 600], [0, -120])
  const heroBlobY = useTransform(scrollY, [0, 600], [0, 80])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  // GSAP — horizontal marquee for IT fields section
  const marqueeRef = useRef(null)

  useEffect(() => {
    getFeaturedCampuses().then(({ data }) => {
      setCampuses(data || [])
      setLoading(false)
    })
  }, [])

  // GSAP marquee scroll-linked
  useEffect(() => {
    if (!marqueeRef.current) return
    const ctx = gsap.context(() => {
      gsap.to('.marquee-track', {
        xPercent: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: marqueeRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      })
    }, marqueeRef)
    return () => ctx.revert()
  }, [])

  // GSAP — stagger reveal for steps section
  const stepsRef = useRef(null)
  useEffect(() => {
    if (!stepsRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.step-card',
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.2,
          scrollTrigger: {
            trigger: stepsRef.current,
            start: 'top 75%',
          },
        }
      )
    }, stepsRef)
    return () => ctx.revert()
  }, [])

  return (
    <main className="min-h-screen overflow-x-hidden">

      {/* ══════ HERO ══════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#f0f6ff]">

        {/* Animated mesh background */}
        <motion.div
          style={{ y: heroBlobY }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 20% 30%, rgba(59,130,246,0.13) 0%, transparent 60%),
                radial-gradient(ellipse 70% 50% at 80% 20%, rgba(14,165,233,0.10) 0%, transparent 55%),
                radial-gradient(ellipse 60% 70% at 50% 80%, rgba(99,102,241,0.07) 0%, transparent 60%)
              `
            }}
          />
        </motion.div>

        {/* Floating orbs */}
        <motion.div
          style={{ y: useTransform(scrollY, [0, 600], [0, -60]) }}
          className="absolute top-24 right-[8%] w-80 h-80 bg-gradient-to-br from-blue-300/25 to-sky-400/15 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.08, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ y: useTransform(scrollY, [0, 600], [0, -40]) }}
          className="absolute bottom-24 left-[5%] w-96 h-96 bg-gradient-to-br from-indigo-300/20 to-blue-400/10 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <Particles />

        {/* Grid texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Hero content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-4 relative z-10 py-24 md:py-32"
        >
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full
                bg-white/80 backdrop-blur border border-blue-200/60 shadow-sm
                text-sm font-semibold text-blue-700"
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <Sparkles className="w-4 h-4 text-blue-500" />
              </motion.span>
              Sistem Rekomendasi Kampus IT · Content Based Filtering
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              className="font-display font-extrabold text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6 text-slate-900"
            >
              Temukan{' '}
              <span className="relative inline-block">
                <span className="text-gradient">Kampus IT</span>
                {/* Underline decoration */}
                <motion.svg
                  viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.9, ease: 'easeOut' }}
                >
                  <motion.path
                    d="M2 8 Q75 2 150 8 Q225 14 298 8"
                    stroke="url(#uline)" strokeWidth="3" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 1, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="uline" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
              {' '}Impianmu
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.35 }}
              className="text-lg md:text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto"
            >
              Platform rekomendasi kampus berbasis AI khusus siswa SMA.
              Dapatkan rekomendasi <strong className="text-slate-700">personal & gratis</strong> berdasarkan minat, lokasi, dan kemampuanmu.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button asChild size="xl" variant="gradient" className="gap-2 shadow-xl shadow-blue-500/25">
                  <Link to="/rekomendasi">
                    <Sparkles className="w-5 h-5" />
                    Mulai Rekomendasi
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button asChild size="xl" variant="outline"
                  className="bg-white/80 backdrop-blur border-blue-200 hover:bg-blue-50">
                  <Link to="/kampus">Jelajahi Kampus</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button asChild size="xl" variant="outline"
                  className="gap-2 bg-white/80 backdrop-blur border-blue-200 hover:bg-blue-50">
                  <Link to="/bandingkan">
                    <GitCompare className="w-5 h-5" />
                    Bandingkan
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Stat cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.7 } } }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-16"
          >
            {STATS.map(stat => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                whileHover={{ y: -4, scale: 1.03 }}
                className="glass-card rounded-2xl p-4 text-center cursor-default
                  border border-white/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <motion.div
                  className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-2 shadow"
                  whileHover={{ rotate: 10 }}
                >
                  <stat.icon className="w-4 h-4 text-white" />
                </motion.div>
                <div className="font-display font-extrabold text-2xl text-gradient">
                  <AnimatedNumber value={stat.value} />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        >
          <span className="text-xs text-slate-400 font-medium tracking-widest">SCROLL</span>
          <motion.div
            className="w-5 h-8 rounded-full border-2 border-blue-300/60 flex items-start justify-center p-1"
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }}
          >
            <motion.div
              className="w-1.5 h-2 bg-blue-400 rounded-full"
              animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════ IT FIELDS MARQUEE ═════════════════════════════════════ */}
      <section ref={marqueeRef} className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4 mb-12">
          <SectionHeader
            badge="Bidang Teknologi"
            title="Semua Bidang IT Tersedia"
            subtitle="Dari Web Dev hingga AI — temukan kampus yang sesuai passion-mu"
          />
        </div>

        {/* Marquee strip */}
        <div className="relative overflow-hidden py-4">
          <div className="marquee-track flex gap-4 w-[200%]">
            {[...IT_FIELDS, ...IT_FIELDS].map(({ icon: Icon, label, bg, text, color }, i) => (
              <Link
                key={`${label}-${i}`}
                to={`/rekomendasi?field=${encodeURIComponent(label)}`}
                className={`flex-shrink-0 flex items-center gap-3 px-6 py-3.5 rounded-2xl
                  ${bg} ${text} font-semibold text-sm border border-current/10
                  hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group`}
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Static grid for mobile / fallback */}
        <div className="container mx-auto px-4 mt-10">
          <div className="flex flex-wrap justify-center gap-3 md:hidden">
            {IT_FIELDS.map(({ icon: Icon, label, bg, text, color }) => (
              <Link key={label} to={`/rekomendasi?field=${encodeURIComponent(label)}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full ${bg} ${text} font-medium text-sm hover:shadow-md transition-all`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════════════════════════════════════════ */}
      <section ref={stepsRef} className="py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}
      >
        {/* BG decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-10 left-[10%] w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-10 right-[10%] w-80 h-80 bg-sky-200/20 rounded-full blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <SectionHeader
            badge="Cara Kerja"
            title="Tiga Langkah Mudah"
            subtitle="Dari preferensi ke kampus impian — cepat, personal, dan gratis"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={step.step} className="step-card relative opacity-0">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute top-12 left-full w-8 items-center justify-center z-10 -translate-x-1/2">
                    <ChevronRight className="w-6 h-6 text-blue-300" />
                  </div>
                )}
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="bg-white/80 backdrop-blur rounded-3xl p-8 shadow-sm hover:shadow-xl
                    border border-white/60 text-center cursor-default transition-shadow duration-300 h-full"
                >
                  <motion.div
                    className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
                    whileHover={{ rotate: 8, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <div className="text-xs font-bold text-blue-400 tracking-[0.2em] mb-2 uppercase">
                    Langkah {step.step}
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FEATURED CAMPUSES ═════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative mb-12">
            <SectionHeader
              badge="Kampus Terpilih"
              title="Kampus Unggulan IT"
              subtitle="Kampus-kampus terbaik dengan program IT berkualitas tinggi"
            />
            <motion.div
              whileHover={{ x: 4 }}
              className="hidden sm:flex justify-center mt-2"
            >
              <Button asChild variant="outline" className="gap-1.5">
                <Link to="/kampus">Lihat Semua Kampus <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCampusCard key={i} />)
              : campuses.map((campus, i) => (
                  <motion.div key={campus.id} variants={scaleIn} custom={i}>
                    <CampusCard campus={campus} />
                  </motion.div>
                ))
            }
          </motion.div>

          <motion.div
            className="text-center mt-8 sm:hidden"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            <Button asChild variant="outline" className="gap-1.5">
              <Link to="/kampus">Lihat Semua Kampus <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ══════ COMPARE BANNER ════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg,rgba(59,130,246,0.07) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div key={i}
              className="absolute w-2 h-2 rounded-full bg-blue-400/40"
              style={{ left: `${15 + i * 14}%`, top: '50%' }}
              animate={{ y: [-20, 20, -20], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-500/30">
                <GitCompare className="w-3.5 h-3.5" />FITUR BARU
              </div>
              <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white mb-2">
                Bandingkan Kampus Side-by-Side
              </h2>
              <p className="text-blue-200/80 max-w-md">
                Pilih 2–4 kampus dan lihat perbandingan akreditasi, biaya, jurusan, dan lebih banyak lagi.
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="flex-shrink-0">
              <Button asChild size="lg"
                className="bg-blue-500 hover:bg-blue-400 text-white gap-2 shadow-xl shadow-blue-900/40 px-8">
                <Link to="/bandingkan">
                  <GitCompare className="w-5 h-5" />
                  Mulai Bandingkan
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════ FINAL CTA ═════════════════════════════════════════════ */}
      <section className="py-28 gradient-primary relative overflow-hidden">
        {/* Animated rings */}
        {[200, 350, 500, 650].map((size, i) => (
          <motion.div key={size}
            className="absolute rounded-full border border-white/10 pointer-events-none"
            style={{
              width: size, height: size,
              top: '50%', left: '50%',
              x: '-50%', y: '-50%',
            }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
          />
        ))}

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-5 leading-tight">
              Siap Temukan Kampus<br className="hidden md:block" /> IT Impianmu?
            </h2>
            <p className="text-blue-100/90 text-lg mb-10 max-w-md mx-auto leading-relaxed">
              Mulai sekarang secara gratis. Tidak perlu daftar akun.
            </p>
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
            >
              <Button asChild size="xl"
                className="bg-white text-primary hover:bg-blue-50 shadow-2xl shadow-blue-900/30 gap-2 px-10 text-base font-bold">
                <Link to="/rekomendasi">
                  <Sparkles className="w-5 h-5" />
                  Mulai Sekarang — Gratis
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </main>
  )
}
