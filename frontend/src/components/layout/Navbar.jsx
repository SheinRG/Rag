import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('product');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    // Call once to set initial state
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 font-sans" style={{ fontFamily: '"Inter", "system-ui", sans-serif' }}>
      <div 
        className={`rounded-[999px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between w-full max-w-[1000px] px-8 py-3 transition-all duration-300 ease-in-out ${
          isScrolled ? 'bg-white/70 backdrop-blur-lg' : 'bg-white'
        }`}
      >
        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} className="text-[#111827] no-underline focus:outline-none">
           <span className="font-extrabold text-[1.3rem] tracking-tighter text-black">DocMind AI</span>
        </Link>
        
        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 -ml-8">
           <div className="flex flex-col items-center">
             <a 
               href="#product" 
               onClick={() => setActiveSection('product')}
               className={`font-semibold text-[0.95rem] transition-colors pb-1 border-b-2 hover:opacity-75 ${
                 activeSection === 'product' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-black'
               }`}
             >
               Product
             </a>
           </div>
           <div className="flex flex-col items-center">
             <a 
               href="#features" 
               onClick={() => setActiveSection('features')}
               className={`font-semibold text-[0.95rem] transition-colors pb-1 border-b-2 hover:opacity-75 ${
                 activeSection === 'features' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-black'
               }`}
             >
               Features
             </a>
           </div>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <span className="hidden sm:inline-block text-sm text-gray-500 font-semibold">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 rounded-full bg-black text-white font-semibold text-[0.9rem] hover:bg-gray-800 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-block text-black font-bold text-[0.95rem] no-underline hover:text-gray-600 transition-colors">Log In</Link>
              <Link to="/signup" className="px-6 py-[0.65rem] bg-black text-white rounded-[999px] font-bold text-[0.9rem] no-underline hover:bg-gray-800 transition-all shadow-md">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
