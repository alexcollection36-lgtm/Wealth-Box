import React from 'react';
import { motion } from 'motion/react';
import { Box, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Google Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 group">
        <div className="w-8 h-8 bg-neon-purple rounded-lg flex items-center justify-center glow-purple group-hover:scale-110 transition-transform">
          <Box className="text-white w-5 h-5 fill-white" />
        </div>
        <span className="text-xl font-display font-bold tracking-tighter text-white">WealthBox</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2 text-white">Welcome Back</h1>
          <p className="text-gray-400">Log in to access your digital assets.</p>
        </div>

        <div className="space-y-4 mb-8">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all disabled:opacity-50 text-white"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-black px-4 text-gray-500">Or email</span>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-purple transition-colors" />
              <input 
                type="email" 
                placeholder="john@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Password</label>
              <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-neon-purple hover:underline">Forgot?</a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-purple transition-colors" />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all text-white"
              />
            </div>
          </div>

          <button className="w-full py-4 bg-neon-purple rounded-2xl font-bold glow-purple hover:glow-purple-strong hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-white">
            Log In <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account? <Link to="/signup" className="text-neon-purple font-bold hover:underline">Sign up</Link>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Secure
          </div>
          <div className="w-1 h-1 bg-white/10 rounded-full" />
          <div>Privacy Protected</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
