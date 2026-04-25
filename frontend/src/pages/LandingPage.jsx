import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import SpotlightCard from '../components/ui/SpotlightCard';
import { BackgroundLines } from '../components/ui/BackgroundLines';
import { AnimatedTestimonials } from '../components/ui/AnimatedTestimonials';
import { BentoGrid, BentoGridItem } from '../components/ui/BentoGrid';
import useAuthStore from '../store/authStore';
const MotionLink = motion(Link);

const SkeletonSecurity = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-2xl bg-gradient-to-br from-gray-200 via-gray-100 to-white border border-white/40 justify-center items-center overflow-hidden">
    <motion.div
      animate={{ x: [-20, 20, -20] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex items-center justify-center p-4 bg-white/50 backdrop-blur-sm rounded-full shadow-sm"
    >
      <motion.svg
        animate={{ scale: [1, 1.1, 1], rotate: [-10, 10, -10] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </motion.svg>
    </motion.div>
  </div>
);

const SkeletonFast = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-2xl bg-gradient-to-br from-blue-100 via-white to-blue-50 border border-white/40 justify-center items-center overflow-hidden relative">
    <motion.div animate={{ x: ['-200%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute h-1 w-1/3 bg-blue-400 rounded-full blur-[2px]" style={{ top: '30%' }} />
    <motion.div animate={{ x: ['-200%', '200%'] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.2 }} className="absolute h-[2px] w-1/4 bg-sky-400 rounded-full blur-[1px]" style={{ top: '50%' }} />
    <motion.div animate={{ x: ['-200%', '200%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: 0.5 }} className="absolute h-2 w-1/6 bg-indigo-400 rounded-full blur-[4px]" style={{ top: '70%' }} />
    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="z-10 bg-white/60 backdrop-blur-md p-3 rounded-full shadow-sm border border-white">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
    </motion.div>
  </div>
);

const SkeletonCitations = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-2xl bg-gradient-to-tr from-green-100 to-emerald-50 border border-white/40 justify-center items-center overflow-hidden relative">
    <div className="w-[120px] h-[80px] bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/60 p-2 flex flex-col gap-2 relative">
      <div className="w-full h-1.5 bg-gray-200 rounded-full"></div>
      <div className="w-3/4 h-1.5 bg-gray-200 rounded-full"></div>
      <div className="w-5/6 h-1.5 bg-gray-200 rounded-full"></div>
      <motion.div animate={{ width: ["0%", "100%", "0%"], left: ["0%", "0%", "100%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="absolute h-2 bg-emerald-300/60 rounded" style={{ top: '8px' }} />
    </div>
    <motion.div animate={{ x: [-30, 30, -30], y: [-10, 10, -10] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute p-2 bg-white/80 backdrop-blur-md shadow-sm rounded-full border border-white">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    </motion.div>
  </div>
);

const SkeletonArtifacts = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-2xl bg-gradient-to-br from-purple-100 to-fuchsia-50 py-4 border border-white/40 justify-center items-center overflow-hidden relative">
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="relative w-24 h-24">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 m-auto w-10 h-10 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-white flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      </motion.div>
      <motion.div animate={{ y: [-15, 15, -15] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-3 -left-3 w-8 h-8 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-white p-1.5"><svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg></motion.div>
      <motion.div animate={{ y: [15, -15, 15] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-3 -right-3 w-8 h-8 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-white p-1.5"><svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></motion.div>
    </motion.div>
  </div>
);

const SkeletonWebSearch = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 border border-white/40 justify-center items-center overflow-hidden relative">
    <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-full border border-white flex items-center justify-center relative overflow-hidden shadow-sm">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute -inset-1 w-[120%] h-[120%] border-t-[3px] border-orange-500 rounded-full blur-[1px]" style={{ transformOrigin: "center" }} />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
    </div>
    <motion.div animate={{ x: [-40, 40, -40] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-4 mx-auto w-12 h-[3px] bg-white/80 rounded-full blur-[1px]"></motion.div>
  </div>
);

const SkeletonResponsive = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-2xl bg-gradient-to-tr from-cyan-100 to-sky-50 border border-white/40 justify-center items-center overflow-hidden relative flex-row gap-4 px-4">
    <motion.div animate={{ height: ["50%", "80%", "50%"], width: ["20%", "40%", "20%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="bg-white/80 backdrop-blur-md border border-white rounded-xl shadow-sm min-w-[30px]" />
    <motion.div animate={{ height: ["80%", "50%", "80%"], width: ["40%", "20%", "40%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="bg-white/80 backdrop-blur-md border border-white rounded-xl shadow-sm min-w-[50px] flex-1 max-w-[150px]" />
  </div>
);

export default function LandingPage() {
  const containerRef = useRef(null);
  const [entered, setEntered] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 1700);
    return () => clearTimeout(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Hero parallax
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
  const heroO = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  // Section reveal variants
  const fadeUp = {
    hidden: { opacity: 0, y: 60 },
    visible: (i = 0) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.7, delay: i * 0.15, ease: 'easeOut' },
    }),
  };


  return (
    <div ref={containerRef} className="min-h-screen relative font-sans overflow-hidden" style={{ background: '#FAFAFA', fontFamily: '"Inter", "system-ui", sans-serif' }}>

      {/* Aurora Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <style>
          {`
            @keyframes drift {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(5%, 10%) scale(1.1); }
              66% { transform: translate(-5%, 5%) scale(0.95); }
              100% { transform: translate(0, 0) scale(1); }
            }
            @keyframes drift-reverse {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(-8%, -5%) scale(0.9); }
              66% { transform: translate(5%, -10%) scale(1.15); }
              100% { transform: translate(0, 0) scale(1); }
            }
          `}
        </style>

        {/* Deep Indigo/Purple Orb */}
        <div
          className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-[0.14] blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
            animation: 'drift 25s infinite ease-in-out'
          }}
        />

        {/* Electric Blue Orb */}
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[80%] h-[80%] rounded-full opacity-[0.12] blur-[140px]"
          style={{
            background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
            animation: 'drift-reverse 30s infinite ease-in-out'
          }}
        />

        {/* Mint/Teal Accent */}
        <div
          className="absolute top-[20%] right-[10%] w-[50%] h-[50%] rounded-full opacity-[0.08] blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
            animation: 'drift 20s infinite ease-in-out'
          }}
        />

        {/* Soft Pink Highlight */}
        <div
          className="absolute bottom-[20%] left-[5%] w-[40%] h-[40%] rounded-full opacity-[0.06] blur-[90px]"
          style={{
            background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
            animation: 'drift-reverse 22s infinite ease-in-out'
          }}
        />
      </div>

      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <BackgroundLines className="relative z-10 font-sans" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div id="product" className="relative w-full overflow-hidden flex-1">



          {/* Hero Content */}
          <motion.section
            className="pt-36 pb-10 px-6 text-center mx-auto relative z-10 lg:pt-44"
            style={entered ? { y: heroY, opacity: heroO } : {}}
          >
            <div className="w-full max-w-[1100px] mx-auto">


              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                className="mb-6 text-black"
                style={{ fontFamily: '"Rubik", sans-serif', fontWeight: 500, fontSize: 'clamp(3rem, 6vw, 6.5rem)', letterSpacing: '-0.03em', lineHeight: '1.0', textShadow: '1px 1px 2px rgba(0,0,0,0.05), 2px 2px 5px rgba(0,0,0,0.1), 3px 3px 10px rgba(0,0,0,0.1), 4px 4px 20px rgba(0,0,0,0.1)' }}
              >
                Turn documents into<br />dialogue
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="text-[1.05rem] md:text-[1.15rem] text-gray-500 max-w-[600px] mx-auto mb-10"
                style={{ lineHeight: '1.7', fontWeight: 400 }}
              >
                Transform your documents into a conversational knowledge base.<br />Get precise insights in seconds.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex justify-center gap-4 flex-wrap mb-14"
              >
                {user ? (
                  <MotionLink
                    to="/notebooks"
                    whileHover={{ scale: 1.05, y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="no-underline inline-flex items-center justify-center gap-3 transition-all group relative overflow-hidden"
                    style={{
                      padding: '1rem 2.5rem',
                      borderRadius: '999px',
                      background: 'rgba(17,17,17,0.85)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                    }}
                  >
                    {/* Shiny sweep effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    Your Notebooks
                  </MotionLink>
                ) : (
                  <>
                    <MotionLink
                      to="/signup"
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="no-underline inline-flex items-center justify-center transition-all group relative overflow-hidden"
                      style={{
                        padding: '1rem 2.5rem',
                        borderRadius: '999px',
                        background: 'rgba(17,17,17,0.9)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: 700,
                      }}
                    >
                      {/* Shiny accent layer */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
                      Get Started Free
                    </MotionLink>
                    <motion.a
                      href="#how-it-works"
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="no-underline inline-flex items-center justify-center transition-all"
                      style={{
                        padding: '1rem 2.5rem',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.45)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.7)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.3)',
                        color: '#111',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      See How It Works
                    </motion.a>
                  </>
                )}
              </motion.div>
            </div>

            {/* Features Bar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="w-full max-w-[750px] mx-auto rounded-[999px] py-4 px-6 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 items-center mt-6 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
              style={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
              }}
            >
              {[
                { label: 'Private and secure' },
                { label: 'Instant Answer' },
                { label: 'Source Citation' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.1, y: -4 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20, mass: 0.8 }}
                  className="rounded-full px-5 py-2.5 flex items-center gap-2.5 font-semibold text-black text-[0.88rem] transition-all cursor-default"
                  style={{
                    background: 'rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  }}
                >
                  <div className="w-[18px] h-[18px] bg-black text-white rounded-full flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  {item.label}
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        </div>
      </BackgroundLines>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-12 w-full max-w-[1100px] mx-auto text-left relative z-20 bg-transparent">
        <AnimatedTestimonials autoplay={true} testimonials={[
          {
            quote: 'Drop your PDF, TXT, or Markdown files into your private notebook. Our optimized local pipeline processes and indexes everything in seconds.',
            name: '1. Upload',
            designation: 'Secure Document Ingestion',
            src: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=3540&auto=format&fit=crop',
          },
          {
            quote: 'Type any question in natural language. The engine instantly scans your private library, synthesizing context and finding nuances across multiple resources.',
            name: '2. Ask',
            designation: 'Conversational Intelligence',
            src: '/ask_image_2.png',
          },
          {
            quote: 'Receive grounded, narrative answers instantly, fully backed by exact source citations. Verify insights without losing focus.',
            name: '3. Get Answers',
            designation: 'Grounded Insights',
            src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=3540&auto=format&fit=crop',
          }
        ]} />
      </section>

      {/* Divider */}
      <div className="w-full border-t border-gray-100"></div>

      {/* ===== WHY NEXUS ===== */}
      <section id="features" className="py-24 px-6 w-full max-w-[1100px] mx-auto text-left">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <h2 className="text-[2.8rem] font-bold mb-5 text-black" style={{ fontFamily: '"Rubik", sans-serif', letterSpacing: '-0.02em' }}>Why Nexus?</h2>
          <p className="text-gray-600 text-[1.05rem] max-w-[520px] font-normal leading-[1.7]">
            Nexus bridges the gap between static data and instant action by transforming your entire document library into a conversational partner. Using advanced RAG technology, it eliminates the need for manual searching by extracting precise insights from even the most complex PDFs and files
          </p>
        </motion.div>

        <BentoGrid className="max-w-[1100px] mx-auto">
          {[
            {
              title: "100% Private & Secure",
              description: "Your documents are stored securely in your private account workspace. No one else can access them, and models do not train on your private repository.",
              header: <SkeletonSecurity />,
              className: "md:col-span-2 bg-slate-50/60 hover:bg-slate-100/80",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
            },
            {
              title: "Blazing Fast Logic",
              description: "Powered by state-of-the-art LLMs with sub-second response speeds via Groq LPUs.",
              header: <SkeletonFast />,
              className: "md:col-span-1 bg-blue-50/50 hover:bg-blue-100/60 border-blue-100/20",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
            },
            {
              title: "Verifiable Source Citations",
              description: "Every answer shows exactly which document and section it came from. Click the citation to automatically jump to the specific page and highlight.",
              header: <SkeletonCitations />,
              className: "md:col-span-1 bg-emerald-50/50 hover:bg-emerald-100/60 border-emerald-100/20",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
            },
            {
              title: "Generate Interactive Artifacts",
              description: "Turn giant PDF handbooks into quizzes, flashcards, mind maps, and executive summaries with a single click in the studio.",
              header: <SkeletonArtifacts />,
              className: "md:col-span-2 bg-purple-50/50 hover:bg-purple-100/60 border-purple-100/20",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
            },
            {
              title: "Real-Time Web Search",
              description: "Search the entire web with deep AI synthesis when your uploaded documents aren't enough to secure an answer.",
              header: <SkeletonWebSearch />,
              className: "md:col-span-2 bg-orange-50/50 hover:bg-orange-100/60 border-orange-100/20",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
            },
            {
              title: "Fully Responsive UI",
              description: "Experience liquid glass aesthetics across any device size, right through the app.",
              header: <SkeletonResponsive />,
              className: "md:col-span-1 bg-cyan-50/50 hover:bg-cyan-100/60 border-cyan-100/20",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>,
            },
          ].map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={item.className}
            />
          ))}
        </BentoGrid>
      </section>

      {/* Footer */}
      <motion.footer the
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="pt-16 pb-10 px-8 bg-[#F0F1F3] mt-16 text-gray-400 font-medium text-[0.9rem]"
      >
        <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative">
          <div className="flex-1 text-center md:text-left">
            <div className="font-bold text-black uppercase tracking-[0.15em] text-[0.9rem] mb-1">RAGHAV GANGWAR</div>
            <div className="text-gray-400 text-[0.85rem]">raghavgangwar222@gmail.com</div>
          </div>

          {/* Unified Expanding Stack Pill */}
          <div className="flex-1 flex justify-center">
            <motion.div
              onMouseEnter={() => setShowStack(true)}
              onMouseLeave={() => setShowStack(false)}
              className="flex items-center bg-white border border-gray-200 rounded-full h-12 transition-all duration-300 hover:border-black/20 hover:shadow-lg cursor-default"
              initial={{ width: 110 }}
              animate={{ width: showStack ? 'auto' : 110 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <div className="px-5 flex items-center gap-2.5 h-full shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={showStack ? 'rotate-90 transition-transform' : 'transition-transform'}>
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span className="font-bold text-black text-[0.95rem] whitespace-nowrap">Stack</span>
              </div>

              <AnimatePresence>
                {showStack && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-5 pr-6 border-l border-gray-100 ml-1 h-full pl-5"
                  >
                    {[
                      { name: 'React', color: '#61DAFB', url: 'https://react.dev', path: 'M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z', stroke: 'none', fill: 'currentColor' },
                      { name: 'FastAPI', color: '#05998B', url: 'https://fastapi.tiangolo.com', path: 'M12 .0387C5.3729.0384.0003 5.3931 0 11.9988c-.001 6.6066 5.372 11.9628 12 11.9625 6.628.0003 12.001-5.3559 12-11.9625-.0003-6.6057-5.3729-11.9604-12-11.96m-.829 5.4153h7.55l-7.5805 5.3284h5.1828L5.279 18.5436q2.9466-6.5444 5.892-13.0896', stroke: 'none', fill: 'currentColor' },
                      { name: 'Supabase', color: '#3ECF8E', url: 'https://supabase.com', path: 'M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z', stroke: 'none', fill: 'currentColor' },
                      { name: 'Groq', color: '#F55036', url: 'https://groq.com', path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', stroke: 'currentColor', fill: 'none' },
                      { name: 'Tailwind', color: '#38B2AC', url: 'https://tailwindcss.com', path: 'M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z', stroke: 'none', fill: 'currentColor' },
                      { name: 'Framer', color: '#0055FF', url: 'https://www.framer.com/motion', path: 'M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z', stroke: 'none', fill: 'currentColor' },
                      { name: 'Python', color: '#3776AB', url: 'https://www.python.org', path: 'M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z', stroke: 'none', fill: 'currentColor' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <motion.a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial="initial"
                          animate="initial"
                          whileHover="hover"
                          variants={{
                            initial: { y: 0, scale: 1 },
                            hover: { y: -6, scale: 1.15 }
                          }}
                          transition={{ type: 'spring', stiffness: 350, damping: 20, mass: 0.8 }}
                          className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 overflow-hidden cursor-pointer shadow-sm transition-shadow hover:shadow-md hover:border-transparent"
                          title={item.name}
                        >
                          {/* Background fill */}
                          <motion.div
                            className="absolute inset-0 z-0"
                            variants={{
                              initial: { scale: 0, opacity: 0 },
                              hover: { scale: 1.2, opacity: 1 }
                            }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            style={{ backgroundColor: item.color, borderRadius: '50%' }}
                          />

                          {/* Icon */}
                          <motion.div
                            className="relative z-10 flex items-center justify-center"
                            variants={{
                              initial: { color: item.color, rotate: 0, scale: 1 },
                              hover: {
                                color: '#ffffff',
                                rotate: [0, -10, 10, -5, 5, 0],
                                scale: 1.1,
                                transition: { duration: 0.5 }
                              }
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={item.fill || "none"} stroke={item.stroke || "currentColor"} strokeWidth={item.stroke === 'none' ? 0 : 2.2} strokeLinecap="round" strokeLinejoin="round">
                              <path d={item.path} />
                            </svg>
                          </motion.div>
                        </motion.a>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="flex-1 flex justify-center md:justify-end gap-4 items-center">
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                ),
                label: 'GitHub',
                href: 'https://github.com/SheinRG',
                color: '#181717'
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                ),
                label: 'Email',
                href: 'mailto:raghavgangwar222@gmail.com',
                color: '#EA4335'
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                ),
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/in/raghav-gangwar21/',
                color: '#0A66C2'
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                ),
                label: 'Twitter',
                href: 'https://x.com/RaghavGangwar15',
                color: '#000000'
              },
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.href}
                initial="initial"
                whileHover="hover"
                whileTap={{ scale: 0.9 }}
                variants={{
                  initial: { y: 0 },
                  hover: {
                    y: -8,
                    transition: { type: 'spring', stiffness: 400, damping: 10 }
                  }
                }}
                className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white border border-gray-200 text-gray-500 overflow-hidden shadow-sm transition-shadow hover:shadow-lg hover:border-transparent"
                title={social.label}
              >
                <motion.div
                  className="absolute inset-0 z-0"
                  variants={{
                    initial: { scale: 0, opacity: 0 },
                    hover: { scale: 1.2, opacity: 1 }
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ backgroundColor: social.color, borderRadius: '50%' }}
                />

                <motion.div
                  className="relative z-10 flex items-center justify-center"
                  variants={{
                    initial: { color: '#6b7280', rotate: 0, scale: 1 },
                    hover: {
                      color: '#ffffff',
                      rotate: [0, -10, 10, -5, 5, 0],
                      scale: 1.1,
                      transition: { duration: 0.5 }
                    }
                  }}
                >
                  {social.icon}
                </motion.div>
              </motion.a>
            ))}
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
