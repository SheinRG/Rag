import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('product');
  const [hoveredSection, setHoveredSection] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -50% 0px', // Detects sections when they enter the upper-middle of the screen
      threshold: 0
    };

    const observerCallback = (entries) => {
      // Find the first entry that is intersecting
      // In case multiple are (unlikely with narrow margin), the last one wins or we can find the most intersecting
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = ['product', 'how-it-works', 'features'];
    
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Fallback: If we're at the very top, always show 'product' as active
    const handleScrollFallback = () => {
      if (window.scrollY < 100) {
        setActiveSection('product');
      }
    };
    window.addEventListener('scroll', handleScrollFallback);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScrollFallback);
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { id: 'product', label: 'Product', type: 'anchor', href: '#product' },
    { id: 'how-it-works', label: 'How It Works', type: 'anchor', href: '#how-it-works' },
    { id: 'features', label: 'Features', type: 'anchor', href: '#features' },
  ];

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 font-sans" style={{ fontFamily: '"Inter", "system-ui", sans-serif' }}>
      <div 
        className={`rounded-[999px] flex items-center justify-between w-full max-w-[1020px] px-8 py-3 transition-all duration-500 ease-in-out border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_0_1px_rgba(255,255,255,0.4)] backdrop-blur-2xl backdrop-saturate-[180%] ${
          isScrolled ? 'bg-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]' : 'bg-white/30'
        }`}
      >
        {/* Logo */}
        <div className="flex-1">
          <Link to={user ? '/dashboard' : '/'} className="text-[#111827] no-underline focus:outline-none">
             <span className="font-extrabold text-[1.3rem] tracking-tighter text-black">DocMind AI</span>
          </Link>
        </div>
        
        {/* Center Links */}
        <div 
          className="hidden md:flex items-center gap-1"
          onMouseLeave={() => setHoveredSection(null)}
        >
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            const isHovered = hoveredSection === link.id;
            
            const content = (
              <>
                <span className="relative z-10">{link.label}</span>
                {(isHovered || (isActive && !hoveredSection)) && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-white/80 rounded-full z-0 border border-white/50 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </>
            );

            const baseClass = `relative px-5 py-2 rounded-full font-semibold text-[0.95rem] transition-colors duration-300 no-underline ${
              isActive || isHovered ? 'text-black' : 'text-gray-500'
            }`;

            if (link.type === 'anchor') {
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onMouseEnter={() => setHoveredSection(link.id)}
                  onClick={() => setActiveSection(link.id)}
                  className={baseClass}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={link.id}
                to={link.to}
                onMouseEnter={() => setHoveredSection(link.id)}
                onClick={() => setActiveSection(link.id)}
                className={baseClass}
              >
                {content}
              </Link>
            );
          })}
        </div>

        {/* Right CTA */}
        <div className="flex-1 flex items-center justify-end gap-6">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none hover:scale-105 active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-white/80 ${
                  isProfileOpen ? 'bg-white/60 scale-105' : 'bg-white/40 backdrop-blur-xl'
                }`}
                aria-label="User Profile"
              >
                <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-[#0ea5e9]/10 to-[#38bdf8]/10 group">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] text-[#0ea5e9] opacity-80">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30 
                    }}
                    style={{ transformOrigin: 'top right' }} 
                    className="absolute -right-2 mt-5 w-56 bg-white/40 backdrop-blur-2xl backdrop-saturate-[180%] border border-white/40 rounded-[24px] shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_0_1px_rgba(255,255,255,0.4)] py-2 z-50 flex flex-col overflow-hidden"
                  >
                    <div className="px-5 py-3 border-b border-gray-200/40 mb-1">
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Signed in as</p>
                      <p className="text-[0.9rem] text-gray-900 font-semibold truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-5 py-2.5 text-[0.9rem] font-bold text-red-600 hover:bg-red-50/50 transition-colors duration-200"
                    >
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <div 
                className="relative px-5 py-2 rounded-full font-semibold text-[0.95rem] transition-colors duration-300 no-underline cursor-pointer flex items-center justify-center"
                onMouseEnter={() => setHoveredSection('login')}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <Link 
                  to="/login" 
                  className={`relative z-10 no-underline transition-colors duration-300 ${hoveredSection === 'login' ? 'text-black' : 'text-gray-500'}`}
                >
                  Log In
                </Link>
                {hoveredSection === 'login' && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-white/80 rounded-full z-0 border border-white/50 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <Link 
                to="/signup" 
                className="ml-2 px-6 py-[0.65rem] text-white rounded-[999px] font-bold text-[0.9rem] no-underline transition-all relative overflow-hidden group shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                style={{
                  background: 'rgba(17,17,17,0.9)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.15)',
                }}
              >
                {/* Glossy highlight layer */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
