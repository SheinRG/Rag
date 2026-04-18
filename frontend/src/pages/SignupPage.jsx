import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const { signup, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (password !== confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    const result = await signup(email, password);
    if (result.success) {
      setMessage(result.message);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans overflow-hidden" style={{ background: '#FAFAFA', fontFamily: '"Inter", "system-ui", sans-serif' }}>
      
      {/* Background Mesh Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-[#0ea5e9]/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0"></div>
      
      <div className="text-center relative z-10 w-full max-w-[440px] px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
           <Link to="/" className="text-[#111827] no-underline focus:outline-none flex items-center gap-2">
             <span className="font-extrabold text-[1.6rem] tracking-tighter text-black">DocMind AI</span>
           </Link>
        </div>

        {/* Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 sm:p-10 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left">
          <h1 className="text-[1.6rem] font-bold mb-2 text-black" style={{ fontFamily: '"Rubik", sans-serif', letterSpacing: '-0.02em' }}>Create your account</h1>
          <p className="text-gray-500 mb-8 text-[0.95rem]">Free forever. No credit card needed.</p>

          {(error || message) && (
            <div className={`px-4 py-3 rounded-[12px] mb-6 text-[0.9rem] font-medium border ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
              {error || message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
               <label className="block font-semibold text-[0.875rem] mb-1.5 text-gray-700">Email address</label>
               <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 className="w-full px-4 py-3.5 rounded-[16px] border border-gray-200 text-[0.95rem] outline-none hover:border-gray-300 focus:border-[#0ea5e9] focus:ring-4 focus:ring-[#e0f2fe] transition-all bg-white/50 backdrop-blur-sm"
                 placeholder="you@example.com" required />
            </div>
            <div className="mb-5">
               <label className="block font-semibold text-[0.875rem] mb-1.5 text-gray-700">Password</label>
               <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 className="w-full px-4 py-3.5 rounded-[16px] border border-gray-200 text-[0.95rem] outline-none hover:border-gray-300 focus:border-[#0ea5e9] focus:ring-4 focus:ring-[#e0f2fe] transition-all bg-white/50 backdrop-blur-sm"
                 placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <div className="mb-8">
               <label className="block font-semibold text-[0.875rem] mb-1.5 text-gray-700">Confirm Password</label>
               <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                 className="w-full px-4 py-3.5 rounded-[16px] border border-gray-200 text-[0.95rem] outline-none hover:border-gray-300 focus:border-[#0ea5e9] focus:ring-4 focus:ring-[#e0f2fe] transition-all bg-white/50 backdrop-blur-sm"
                 placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} 
              className={`w-full py-4 rounded-[16px] font-bold text-[1rem] text-white bg-black hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 ${loading ? 'opacity-70' : ''}`}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-[0.95rem] text-gray-500 font-medium">
             Already have an account? <Link to="/login" className="text-[#0ea5e9] font-bold no-underline hover:text-blue-500 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
