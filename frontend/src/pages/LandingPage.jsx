import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import SpotlightCard from '../components/ui/SpotlightCard';
import { BackgroundLines } from '../components/ui/BackgroundLines';
import { AnimatedTestimonials } from '../components/ui/AnimatedTestimonials';
import { BentoGrid, BentoGridItem } from '../components/ui/BentoGrid';
import { Keyboard } from '../components/ui/keyboard';
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
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 1700);
    return () => clearTimeout(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Images slide back out on scroll
  const kbX = useTransform(scrollYProgress, [0, 0.15], [0, -600]);
  const kbY = useTransform(scrollYProgress, [0, 0.15], [0, -300]);
  const kbO = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  const ltX = useTransform(scrollYProgress, [0, 0.15], [0, 600]);
  const ltY = useTransform(scrollYProgress, [0, 0.15], [0, -300]);
  const ltO = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

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

          {/* Keyboard Component replaced sliding image */}
          <motion.div
            initial={{ x: -500, y: -200, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            className="hidden lg:block z-[1]"
            style={{
              position: 'absolute',
              top: '35%',
              left: '-30%', // Adjusted left position for the DOM keyboard layout
              width: '650px',
              rotate: 7,
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))',
              ...(entered ? { x: kbX, y: kbY, opacity: kbO } : {}),
            }}
          >
            <Keyboard enableSound className="pointer-events-auto" />
          </motion.div>

          {/* Laptop */}
          <motion.img
            src="/lapptop.png"
            alt="laptop"
            initial={{ x: 500, y: -200, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
            className="pointer-events-none hidden lg:block"
            style={{
              position: 'absolute',
              top: '-5%',
              right: '-12%',
              width: '380px',
              rotate: -5,
              zIndex: 1,
              filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.2))',
              ...(entered ? { x: ltX, y: ltY, opacity: ltO } : {}),
            }}
          />

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
                Turn documents into<br />dialogue.
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="text-[1.05rem] md:text-[1.15rem] text-gray-500 max-w-[600px] mx-auto mb-10"
                style={{ lineHeight: '1.7', fontWeight: 400 }}
              >
                Stop digging through folders and start getting answers. DocMind AI turns your static PDFs and files into a conversational knowledge base, delivering precise insights in seconds.
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
                    className="no-underline inline-flex items-center justify-center gap-3 transition-all"
                    style={{
                      padding: '1rem 2.5rem',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.45)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.7)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.3)',
                      color: '#111',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                    }}
                  >
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
                <div
                  key={idx}
                  className="rounded-full px-5 py-2.5 flex items-center gap-2.5 font-semibold text-black text-[0.88rem] transition-all hover:scale-105"
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
                </div>
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

      {/* ===== WHY DOCMIND AI ===== */}
      <section id="features" className="py-24 px-6 w-full max-w-[1100px] mx-auto text-left">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <h2 className="text-[2.8rem] font-bold mb-5 text-black" style={{ fontFamily: '"Rubik", sans-serif', letterSpacing: '-0.02em' }}>Why DocMind AI?</h2>
          <p className="text-gray-600 text-[1.05rem] max-w-[520px] font-normal leading-[1.7]">
            DocMind AI bridges the gap between static data and instant action by transforming your entire document library into a conversational partner. Using advanced RAG technology, it eliminates the need for manual searching by extracting precise insights from even the most complex PDFs and files
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
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="pt-16 pb-10 px-8 bg-[#F0F1F3] mt-16 text-gray-400 font-medium text-[0.9rem]"
      >
        <div className="w-full max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <div className="font-bold text-black uppercase tracking-[0.15em] text-[0.9rem] mb-1">RAGHAV GANGWAR</div>
            <div className="text-gray-400 text-[0.85rem]">raghavgangwar222@gmail.com</div>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-black transition-colors no-underline text-gray-400 text-[0.85rem]">Privacy Policy</a>
            <a href="#" className="hover:text-black transition-colors no-underline text-gray-400 text-[0.85rem]">Terms of Service</a>
            <a href="#" className="hover:text-black transition-colors no-underline text-gray-400 text-[0.85rem]">Contact</a>
            <a href="#" className="hover:text-black transition-colors no-underline text-gray-400 text-[0.85rem]">Security</a>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
