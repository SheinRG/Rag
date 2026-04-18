import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import SpotlightCard from '../components/ui/SpotlightCard';

export default function LandingPage() {
  const containerRef = useRef(null);
  const [entered, setEntered] = useState(false);

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
      
      {/* Background Mesh Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-[#0ea5e9]/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] left-[20%] w-[60%] h-[40%] rounded-full bg-blue-400/5 blur-[120px] pointer-events-none z-0"></div>
      
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <div id="product" className="relative overflow-hidden" style={{ minHeight: '100vh' }}>

        {/* Keyboard */}
        <motion.img
          src="/kyboard.png"
          alt="keyboard"
          initial={{ x: -500, y: -200, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          className="pointer-events-none hidden lg:block"
          style={{
            position: 'absolute',
            top: '38%',
            left: '-20%',
            width: '650px',
            rotate: 15,
            zIndex: 1,
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))',
            ...(entered ? { x: kbX, y: kbY, opacity: kbO } : {}),
          }}
        />

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
              <Link to="/signup" className="px-8 py-3.5 bg-black hover:bg-gray-800 text-white rounded-[999px] font-bold text-[1rem] no-underline inline-flex items-center justify-center transition-colors">
                Get Started Free
              </Link>
              <a href="#how-it-works" className="px-8 py-3.5 bg-white border border-gray-200 hover:border-gray-400 text-black rounded-[999px] font-bold text-[1rem] no-underline inline-flex items-center justify-center transition-colors">
                See How It Works
              </a>
            </motion.div>
          </div>

          {/* Features Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="w-full max-w-[700px] mx-auto bg-[#F0F1F3] rounded-[999px] py-5 px-6 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 items-center mt-4"
          >
            <div className="bg-white rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-sm font-semibold text-black text-[0.85rem]">
              <div className="w-[18px] h-[18px] bg-black rounded-full flex items-center justify-center text-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              Private and secure
            </div>
            <div className="bg-white rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-sm font-semibold text-black text-[0.85rem]">
              <div className="w-[18px] h-[18px] bg-black rounded-full flex items-center justify-center text-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              Instant Answer
            </div>
            <div className="bg-white rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-sm font-semibold text-black text-[0.85rem]">
              <div className="w-[18px] h-[18px] bg-black rounded-full flex items-center justify-center text-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              Source Citation
            </div>
          </motion.div>
        </motion.section>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="pt-24 pb-20 px-6 w-full max-w-[1100px] mx-auto text-left">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>, title: 'Upload', desc: 'Drop your PDF, TXT, or Markdown files. We process them in seconds.' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, title: 'Ask', desc: 'Type any question in natural language.' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>, title: 'Get Answers', desc: 'Receive grounded answers with exact source citations.' },
          ].map((card, i) => (
            <SpotlightCard
              key={card.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
              className="p-8 flex flex-col min-h-[260px] cursor-default"
            >
              <div className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-auto bg-white/80 border border-gray-100 shadow-sm relative z-10 backdrop-blur-sm">
                {card.icon}
              </div>
              <div className="mt-auto relative z-10">
                <h3 className="text-[1.2rem] font-bold text-black mb-2">{card.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed text-[0.95rem]">{card.desc}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { content: 'Your documents are stored in your private account. No one else can access them.', iconEl: <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-sm"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg></div> },
            { content: 'Powered by state-of-the-art LLMs with sub-second response times via Groq.', iconEl: <div className="flex gap-2"><div className="w-8 h-8 rounded-[6px] bg-white shadow-sm flex items-center justify-center text-xs font-bold">💳</div><div className="w-8 h-8 rounded-[6px] bg-white shadow-sm flex items-center justify-center text-xs font-bold">🏛</div><div className="w-8 h-8 rounded-[6px] bg-white shadow-sm flex items-center justify-center text-xs font-bold">₿</div></div> },
            { content: 'Every answer shows exactly which document and section it came from.', iconEl: <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-sm"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div> },
            { content: 'Generate quizzes, flashcards, mind maps, and executive summaries with one click.', iconEl: <div className="flex gap-2"><div className="w-8 h-8 rounded-[6px] bg-white shadow-sm flex items-center justify-center text-xs font-bold">📄</div><div className="w-8 h-8 rounded-[6px] bg-white shadow-sm flex items-center justify-center text-xs font-bold">🏛</div></div> },
            { content: "Search the entire web with AI synthesis when your documents aren't enough.", iconEl: <div className="w-8 h-8 rounded-[6px] bg-white shadow-sm flex items-center justify-center text-black"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div> },
            { content: 'Responsive ui through out the website.', iconEl: <div className="flex gap-2"><div className="h-8 px-2 rounded-full bg-white shadow-sm flex items-center justify-center text-[0.6rem] font-bold uppercase tracking-wide">Xero</div><div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[0.6rem] font-bold uppercase">QB</div></div> },
          ].map((feature, i) => (
            <SpotlightCard
              key={i}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="p-8 text-left min-h-[200px] flex flex-col justify-end cursor-default"
            >
              <p className="text-black font-medium leading-relaxed text-[0.95rem] relative z-10">{feature.content}</p>
            </SpotlightCard>
          ))}
        </div>
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
