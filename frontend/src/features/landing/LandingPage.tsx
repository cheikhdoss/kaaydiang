import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Trophy,
  Users,
  Star,
  CheckCircle,
  Clock,
  Award,
  Globe,
  Zap,
  Brain,
  Target,
  Calendar,
  Wrench,
  Sparkle,
} from 'lucide-react';
import { ContainerScroll } from '../../components/ui/container-scroll-animation';
import { AnimatedText } from '../../components/ui/animated-underline-text-one';
import { CurriculumAdaptivePreview } from '../../components/ui/curriculum-adaptive-preview';
import { Sparkles, Play } from '../../components/animated-icons';
import { Header } from '../../components/ui/header-2';
import ScrollExpandMedia from '../../components/ui/scroll-expansion-hero';

gsap.registerPlugin(ScrollTrigger);

const LandingPage: React.FC = () => {
  const statsRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);

  useEffect(() => {
    if (!statsRef.current) return;

    const counters = statsRef.current.querySelectorAll('.counter-value');
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-value') || '0');
      gsap.fromTo(
        counter,
        { textContent: '0' },
        {
          textContent: target,
          duration: 2,
          ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: counter,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        },
      );
    });
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'IA Curriculum Adaptive',
      description:
        "Notre intelligence artificielle génère instantanément un parcours d'apprentissage sur mesure basé sur vos acquis et vos objectifs de carrière.",
      number: '01',
    },
    {
      icon: Target,
      title: 'Objectifs personnalisés',
      description:
        'Définissez vos objectifs et suivez votre progression en temps réel',
      number: '02',
    },
    {
      icon: Award,
      title: 'Certifications reconnues',
      description:
        'Obtenez des certificats valorisants pour votre carrière professionnelle',
      number: '03',
    },
    {
      icon: Globe,
      title: 'Accès mondial',
      description:
        'Apprenez partout, tout le temps, même hors ligne avec notre mode PWA',
      number: '04',
    },
  ];

  const stats = [
    { value: 50000, suffix: '+', label: 'Apprenants' },
    { value: 250, suffix: '+', label: 'Cours' },
    { value: 98, suffix: '%', label: 'Satisfaction' },
    { value: 24, suffix: '/7', label: 'Support' },
  ];

  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const getBentoColSizes = () => {
    if (hoveredCard === null) return '4fr 4fr 4fr';
    switch (hoveredCard) {
      case 0:
        return '5fr 5fr 2fr';
      case 1:
        return '3fr 3fr 6fr';
      case 2:
        return '6fr 3fr 3fr';
      case 3:
        return '3fr 6fr 3fr';
      default:
        return '4fr 4fr 4fr';
    }
  };

  const getBentoRowSizes = () => {
    if (hoveredCard === null) return '1fr 1fr';
    switch (hoveredCard) {
      case 0:
        return '1.4fr 0.6fr';
      case 1:
        return '1fr 1fr';
      case 2:
        return '0.6fr 1.4fr';
      case 3:
        return '0.6fr 1.4fr';
      default:
        return '1fr 1fr';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#3054ff] selection:text-white dark">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 overflow-hidden px-6">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          >
            <source
              src="https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8"
              type="application/x-mpegURL"
            />
          </video>

          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
        </div>

        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#3054ff]/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#9791fe]/10 blur-[100px] rounded-full"></div>
        </div>

        <motion.div style={{ y: heroY }} className="relative z-10 text-center max-w-4xl mx-auto mb-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}

          >

          </motion.div>

          {/* Main Title - KayyDiang */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-6"
          >
            <AnimatedText
              text="KayyDiang"
              textClassName="text-7xl md:text-9xl font-black text-white tracking-tight"
              underlineClassName="text-[#3054ff]"
              underlinePath="M 0,10 Q 150,-10 300,10"
              underlineHoverPath="M 0,10 Q 150,30 300,10"
              underlineDuration={2}
            />
          </motion.div>

          {/* Subtitle */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-6xl font-serif mb-8 leading-[0.95] tracking-tight"
          >
            Apprenez sans{' '}
            <span className="italic text-[#3054ff]">limites</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed"
          >
            Accédez à des centaines de cours de qualité, dispensés par les meilleurs experts.
            Développez vos compétences et obtenez des certifications reconnues.
          </motion.p>
        </motion.div>

        {/* Dashboard Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative z-20 w-full max-w-[1200px] mx-auto cursor-pointer"
        >
          <div
            style={{ transform: 'translateZ(50px)' }}
            className="bg-[#191919]/40 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-[0_40px_100px_rgba(48,84,255,0.25)] p-2 md:p-3 overflow-hidden"
          >
            {/* Window Controls - Glassmorphism style */}
            <div className="flex items-center justify-between mb-4 px-6 py-4 border-b border-white/5 bg-white/5 rounded-t-2xl">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-[0_0_10px_rgba(255,95,86,0.4)]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-[0_0_10px_rgba(255,189,46,0.4)]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-[0_0_10px_rgba(39,201,63,0.4)]"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[10px] tracking-widest text-white/30 uppercase font-black">
                  KayyDiang Pro Workspace
                </div>
                <div className="h-4 w-[1px] bg-white/10"></div>
                <div className="flex items-center gap-2 px-2 py-1 bg-[#3054ff]/20 rounded-md border border-[#3054ff]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3054ff] animate-ping"></span>
                  <span className="text-[8px] font-bold text-[#3054ff]">LIVE NOW</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Star className="w-3 h-3 text-white/40" />
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-12 gap-3 min-h-[450px] md:min-h-[600px]">
              {/* Ultra Modern Sidebar */}
              <div className="col-span-12 md:col-span-3 bg-black/60 rounded-2xl p-6 flex flex-col justify-between border border-white/5">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-[#3054ff] font-black opacity-70">
                      Module Actuel
                    </label>
                    <div className="p-4 bg-gradient-to-br from-[#3054ff]/10 to-transparent rounded-xl border border-[#3054ff]/20">
                      <h4 className="text-sm font-bold mb-3">Animation GSAP 3D</h4>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                        <span>Chapitre 12/20</span>
                        <span>85%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '85%' }}
                          transition={{ duration: 1.5, delay: 0.8 }}
                          className="h-full bg-gradient-to-r from-[#3054ff] to-[#9791fe]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-[#3054ff] text-white rounded-xl shadow-[0_10px_20px_rgba(48,84,255,0.3)]">
                      <Play className="w-4 h-4" animate={true} />
                      <span className="text-xs font-bold">Continuer</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group text-gray-500 hover:text-white">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs">Ressources</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group text-gray-500 hover:text-white">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Planning</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#3054ff]/20 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-[#3054ff]" />
                    </div>
                    <div className="text-[10px] font-bold">Certificat Pro</div>
                  </div>
                  <div className="text-[9px] text-gray-500 leading-tight">
                    Plus que 2 chapitres pour débloquer votre diplôme.
                  </div>
                </div>
              </div>

              {/* Immersive Main Player Area */}
              <div className="col-span-12 md:col-span-9 relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/5 flex flex-col">
                <div className="relative flex-1 group">
                  <img
                    src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80"
                    alt="Learning experience"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/20"></div>

                  {/* Floating Video Overlay Controls */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-20 h-20 bg-[#3054ff] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(48,84,255,0.6)] cursor-pointer"
                    >
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </motion.div>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="max-w-md space-y-4">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-[#3054ff] text-[8px] font-black rounded uppercase">
                          Premium
                        </span>
                        <span className="px-2 py-1 bg-white/10 text-[8px] font-black rounded uppercase backdrop-blur-md">
                          4K Video
                        </span>
                      </div>
                      <h2 className="text-3xl font-serif italic text-white drop-shadow-lg">
                        Optimisation des performances avec React
                      </h2>
                      <div className="flex items-center gap-4 text-[10px] text-white/50">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 12:45 / 45:00
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> 1.2k étudiants en ligne
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Floating Panels */}
                  <div
                    className="absolute top-8 right-8 space-y-4 hidden md:block"
                    style={{ transform: 'translateZ(80px)' }}
                  >
                    {/* Live Chat/Notes Preview */}
                    <div className="w-64 bg-black/40 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[9px] font-bold text-[#3054ff]">
                          NOTES COLLABORATIVES
                        </span>
                        <Sparkles className="w-3 h-3 text-[#3054ff]" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="w-5 h-5 rounded bg-blue-500/20" />
                          <div className="h-2 w-full bg-white/10 rounded" />
                        </div>
                        <div className="flex gap-2">
                          <div className="w-5 h-5 rounded bg-purple-500/20" />
                          <div className="h-2 w-3/4 bg-white/10 rounded" />
                        </div>
                        <div className="flex gap-2">
                          <div className="w-5 h-5 rounded bg-green-500/20" />
                          <div className="h-2 w-4/5 bg-white/10 rounded" />
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="h-8 w-full bg-[#3054ff]/10 rounded-lg border border-[#3054ff]/20 flex items-center px-3 text-[9px] text-gray-400">
                          Poser une question...
                        </div>
                      </div>
                    </div>

                    {/* Streak Card */}
                    <div className="w-64 bg-gradient-to-br from-[#3054ff] to-[#1943f2] p-4 rounded-2xl shadow-xl shadow-[#3054ff]/20">
                      <div className="flex items-center justify-between text-white">
                        <div>
                          <div className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                            Série Actuelle
                          </div>
                          <div className="text-2xl font-black">15 JOURS</div>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <Zap className="w-5 h-5 fill-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Player Bottom Bar */}
                  <div className="h-16 bg-black flex items-center justify-between px-8 border-t border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="flex gap-4">
                        <div className="w-3 h-3 rounded-full bg-[#3054ff]" />
                        <div className="w-3 h-3 rounded-full bg-white/10" />
                        <div className="w-3 h-3 rounded-full bg-white/10" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-[#3054ff]" />
                      </div>
                      <span className="text-[10px] text-gray-500">Vol 85%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                <span className="counter-value" data-value={stat.value}>
                  0
                </span>
                {stat.suffix}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Container Scroll Section - Mini Dashboard Apprenant */}
      <section className="relative py-20 overflow-hidden">
        <ContainerScroll
          titleComponent={
            <div className="mb-20 md:mb-40">
              <h1 className="text-5xl md:text-8xl font-bold text-white mb-6 tracking-tighter">
                Votre savoir,
              </h1>
              <h1 className="text-5xl md:text-8xl font-serif italic text-[#3054ff] tracking-tight">
                votre liberté
              </h1>
            </div>
          }
        >
          {/* Minimalist Tablet Content */}
          <div className="h-full w-full bg-[#050505] rounded-2xl overflow-hidden border border-white/5 relative flex flex-col items-center justify-center p-6 md:p-12">
            {/* Background Image & Effects */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80"
                alt="Digital Background"
                className="w-full h-full object-cover opacity-20 scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-[#3054ff]/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-12">
              {/* Main Text Content */}
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="text-5xl md:text-8xl font-serif leading-tight text-white italic">
                    Apprenez <span className="not-italic">où vous</span>
                    <br />
                    <span className="text-white">voulez.</span>
                  </h2>
                </motion.div>

                {/* Single Play Button below text */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex justify-center pt-4"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, backgroundColor: '#3054ff' }}
                    whileTap={{ scale: 0.95 }}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#3054ff] to-[#1943f2] flex items-center justify-center shadow-[0_20px_60px_rgba(48,84,255,0.5)] cursor-pointer group relative"
                  >
                    <Play className="w-10 h-10 md:w-16 md:h-16 text-white fill-white ml-2 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping opacity-20"></div>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Subtle indicator */}
            <div className="absolute bottom-8 flex gap-1">
              <div className="w-8 h-1 bg-[#3054ff] rounded-full"></div>
              <div className="w-1 h-1 bg-white/20 rounded-full"></div>
              <div className="w-1 h-1 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* Features Bento Grid */}
      <section id="about" className="py-32 px-8 max-w-[1440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif mb-6">
            Pourquoi choisir <span className="italic text-[#3054ff]">KayyDiang</span> ?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Une plateforme complète pour atteindre vos objectifs d'apprentissage
          </p>
        </motion.div>

        <div
          className="hidden md:grid gap-6 h-[720px]"
          style={{
            gridTemplateColumns: getBentoColSizes(),
            gridTemplateRows: getBentoRowSizes(),
            transition: 'grid-template-columns 0.4s ease, grid-template-rows 0.4s ease',
          }}
        >
          {/* Card 1: Auto-Layout (Top Left) */}
          <motion.div
            style={{ gridArea: '1 / 1 / 2 / 3' }}
            onMouseEnter={() => setHoveredCard(0)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-[#1a1a1a] rounded-2xl p-8 flex flex-col gap-6 justify-between group overflow-hidden relative border border-white/5"
          >
            <div className="relative z-10">
              <span className="text-[#3054ff] font-serif italic text-2xl mb-4 block">01</span>
              <h3 className="text-3xl font-serif mb-4 text-white">{features[0].title}</h3>
              <p className="text-gray-400 max-w-xl leading-relaxed">{features[0].description}</p>
            </div>
            <div className="relative z-10 flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl">
              <CurriculumAdaptivePreview />
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#3054ff]/5 rounded-full blur-[80px] group-hover:bg-[#3054ff]/10 transition-all duration-700"></div>
          </motion.div>

          {/* Card 2: Objectifs (Right Tall) */}
          <motion.div
            style={{ gridArea: '1 / 3 / 3 / 4' }}
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-[#1a1a1a] rounded-2xl p-8 flex flex-col border-l-2 border-[#3054ff] border-y border-white/5 border-r border-white/5 group hover:bg-[#202020] transition-colors relative"
          >
            <div className="w-12 h-12 rounded-full bg-[#3054ff]/10 flex items-center justify-center mb-8">
              <Target className="w-6 h-6 text-[#3054ff]" />
            </div>
            <h3 className="text-2xl font-bold mb-6 text-white">{features[1].title}</h3>
            <p className="text-gray-400 leading-relaxed">{features[1].description}</p>
          </motion.div>

          {/* Card 3: Certifications (Bottom Left) */}
          <motion.div
            style={{ gridArea: '2 / 1 / 3 / 2' }}
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-[#1a1a1a] rounded-2xl p-8 flex flex-col border-l-2 border-[#3054ff] border-y border-white/5 border-r border-white/5 group hover:bg-[#202020] transition-colors relative"
          >
            <div className="w-10 h-10 rounded-full bg-[#3054ff]/10 flex items-center justify-center mb-6">
              <Award className="w-5 h-5 text-[#3054ff]" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">{features[2].title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{features[2].description}</p>
          </motion.div>

          {/* Card 4: Accès (Bottom Center) */}
          <motion.div
            style={{ gridArea: '2 / 2 / 3 / 3' }}
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-[#1a1a1a] rounded-2xl p-8 flex flex-col border-l-2 border-[#3054ff] border-y border-white/5 border-r border-white/5 group hover:bg-[#202020] transition-colors relative"
          >
            <div className="w-10 h-10 rounded-full bg-[#3054ff]/10 flex items-center justify-center mb-6">
              <Globe className="w-5 h-5 text-[#3054ff]" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">{features[3].title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{features[3].description}</p>
          </motion.div>
        </div>

        {/* Mobile View (keep standard stack) */}
        <div className="md:hidden flex flex-col gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#1a1a1a] rounded-2xl p-8 border border-white/5 border-l-2 border-[#3054ff]"
            >
              <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section & du Savoir - Scroll Expansion Effect */}
      <ScrollExpandMedia
        mediaType="image"
        mediaSrc="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1280&h=720&fit=crop&q=80"
        bgImageSrc="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&h=1080&fit=crop&q=80"
        title="& du Savoir"
        subtitle="L'intersection de l'Art et de l'Éducation"
      >
        <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 md:p-8 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="h-0.5 w-16 bg-gradient-to-r from-[#3054ff] to-purple-500 rounded-full mb-5" />

          <h2 className="text-xl md:text-2xl font-serif mb-2 text-white">
            L'éducation ne doit pas être <span className="italic text-[#3054ff]">ennuyeuse</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            KayyDiang combine technologie et pédagogie innovante pour une expérience d'apprentissage unique.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <Wrench className="w-4 h-4 text-[#3054ff] mb-2" />
              <h4 className="font-semibold text-white text-sm mb-1">Ingénierie de précision</h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                Cours structurés pour maximiser l'engagement.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <Sparkle className="w-4 h-4 text-[#3054ff] mb-2" />
              <h4 className="font-semibold text-white text-sm mb-1">Intelligence adaptative</h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                Parcours personnalisé selon vos préférences.
              </p>
            </div>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3054ff] text-white text-sm font-bold rounded-lg hover:bg-[#1943f2] transition-all hover:shadow-[0_0_20px_rgba(48,84,255,0.3)] group"
          >
            Commencer maintenant
            <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </ScrollExpandMedia>

      {/* Footer */}
      <footer id="contact" className="w-full py-12 px-8 bg-black border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1440px] mx-auto">
          <div className="font-serif text-xl text-white italic">KayyDiang</div>

          <div className="flex flex-wrap justify-center gap-8">
            <a href="#" className="text-xs text-white/50 hover:text-[#3054ff] transition-colors">
              Politique de confidentialité
            </a>
            <a href="#" className="text-xs text-white/50 hover:text-[#3054ff] transition-colors">
              Conditions d'utilisation
            </a>
            <a href="#" className="text-xs text-white/50 hover:text-[#3054ff] transition-colors">
              Twitter
            </a>
            <a href="#" className="text-xs text-white/50 hover:text-[#3054ff] transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-xs text-white/50 hover:text-[#3054ff] transition-colors">
              GitHub
            </a>
          </div>

          <div className="text-xs text-white/50">© 2026 KayyDiang. Tous droits réservés.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
