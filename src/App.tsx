import * as React from 'react';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import { auth, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Brain, 
  Wallet, 
  Globe, 
  CheckCircle2, 
  Download, 
  Zap, 
  Star, 
  ArrowRight, 
  Menu, 
  X,
  ChevronRight,
  ShieldCheck,
  Clock,
  TrendingUp,
  Layout,
  BarChart3,
  Box,
  LogOut,
  User as UserIcon,
  AlertCircle,
  CheckCircle,
  Utensils
} from 'lucide-react';

// Initialize Stripe (using a mock public key if not provided)
const getStripePromise = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  const isValidPrefix = key && (key.startsWith('pk_') || key.startsWith('mk_'));
  
  if (!key || key === 'Alex' || !isValidPrefix) {
    console.warn('Invalid or missing VITE_STRIPE_PUBLIC_KEY. Please set a valid Stripe Public Key (starting with pk_ or mk_) in the application settings.');
    return loadStripe('pk_test_mock_key');
  }
  return loadStripe(key);
};

const stripePromise = getStripePromise();


// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      try {
        const parsedError = JSON.parse((this.state.error as any)?.message || "");
        if (parsedError.error) {
          errorMessage = `Firestore Error: ${parsedError.error}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <X className="text-red-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-4 text-white">Application Error</h1>
          <p className="text-gray-400 max-w-md mb-8">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-full font-bold hover:bg-white/10 transition-all text-white"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navLinks = [
    { name: 'Products', href: '#products' },
    { name: 'Features', href: '#features' },
    { name: 'Testimonials', href: '#testimonials' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neon-purple rounded-lg flex items-center justify-center glow-purple">
            <Box className="text-white w-5 h-5 fill-white" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tighter text-white">WealthBox</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-sm font-medium text-gray-400 hover:text-neon-purple transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {user.email === 'alexcollection36@gmail.com' && (
                <Link 
                  to="/admin"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-neon-purple border border-neon-purple/30 bg-neon-purple/5 rounded-full hover:bg-neon-purple/10 transition-all"
                >
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full" />
                ) : (
                  <UserIcon className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs font-bold text-gray-300">{user.displayName || user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Link 
                to="/signup"
                className="px-5 py-2 text-sm font-medium text-white hover:text-neon-purple transition-colors"
              >
                Sign Up
              </Link>
              <a 
                href="#products"
                className="px-6 py-2 text-sm font-semibold bg-neon-purple rounded-full glow-purple hover:scale-105 transition-transform text-white text-center"
              >
                Buy Now
              </a>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black border-b border-white/10 p-6 md:hidden flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-gray-300"
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              {user ? (
                <>
                  {user.email === 'alexcollection36@gmail.com' && (
                    <Link 
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 text-center text-neon-purple font-bold border border-neon-purple/20 rounded-xl bg-neon-purple/5"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full py-3 text-center text-red-500 font-bold border border-red-500/20 rounded-xl"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center text-gray-300 font-medium hover:text-white transition-colors"
                  >
                    Sign Up
                  </Link>
                  <a 
                    href="#products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center bg-neon-purple rounded-xl glow-purple text-white"
                  >
                    Buy Now
                  </a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden grid-bg">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-[10px] uppercase tracking-[0.2em] font-bold text-neon-purple">
              Digital Excellence
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight leading-[1.1]">
              Upgrade Your Life with <br />
              <span className="text-gradient">Excel Systems</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Track habits and stay consistent with powerful Excel systems designed for real results.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="#products"
                className="w-full sm:w-auto px-8 py-4 bg-neon-purple rounded-full text-lg font-bold glow-purple hover:glow-purple-strong hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Buy Now <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="#products"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-full text-lg font-bold hover:bg-white/10 transition-all text-center"
              >
                View Products
              </a>
            </div>
          </motion.div>
        </div>


      </div>
    </section>
  );
};

const SecondaryNav = () => {
  const items = ['Products', 'Benefits', 'How It Works', 'Reviews'];
  return (
    <div className="border-y border-white/5 bg-black/50 backdrop-blur-sm sticky top-[64px] z-40 hidden md:block">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-12 py-4">
          {items.map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} 
              className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-neon-purple transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

const FeatureHighlight = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-neon-purple/10 rounded-3xl border border-neon-purple/30 flex items-center justify-center mb-8 glow-purple">
            <BarChart3 className="w-12 h-12 text-neon-purple" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">The Power of Smart Tracking</h2>
          <p className="text-gray-400 max-w-2xl text-lg leading-relaxed">
            Stop guessing and start growing. Our tools are built to bring discipline, daily clarity, and long-term performance tracking to your routine.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full">
            {[
              { icon: Brain, title: 'Discipline', desc: 'Build unbreakable habits with visual progress tracking.' },
              { icon: BarChart3, title: 'Daily Clarity', desc: 'Wake up with a clear plan and track your daily wins with precision.' },
              { icon: Clock, title: 'Performance Records', desc: 'Maintain a complete history of your journey and analyze your long-term growth.' },
            ].map((item, i) => (
              <div key={i} className="glass-panel p-8 rounded-2xl hover:border-neon-purple/50 transition-all group">
                <div className="w-12 h-12 bg-neon-purple/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="text-neon-purple w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Absolute backend URL for the Shared App (Fallback)
const BACKEND_URL = 'https://ais-pre-fkiph533gzk4dlledcqsa6-617908309211.europe-west2.run.app';

const getApiUrl = (path: string) => {
  // Prefer same-origin. If wealth-box.com points to the app, this will work.
  // If we are on a different domain (like a static host), we fallback to the absolute URL.
  if (window.location.hostname.includes('run.app') || 
      window.location.hostname === 'wealth-box.com' || 
      window.location.hostname === 'www.wealth-box.com') {
    return `${window.location.origin}${path}`;
  }
  
  return `${BACKEND_URL}${path}`;
};

const BackendStatus = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const apiUrl = getApiUrl('/api/health');
  
  useEffect(() => {
    const checkStatus = async () => {
      setStatus('checking');
      try {
        // Try primary URL first
        const response = await fetch(apiUrl, {
          cache: 'no-cache',
          mode: 'cors'
        });
        if (response.ok) {
          setStatus('online');
          setError(null);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (e: any) {
        console.warn('Primary backend check failed, trying fallback...', e);
        
        // Fallback to absolute URL if primary fails and we aren't already using it
        const fallbackUrl = `${BACKEND_URL}/api/health`;
        if (apiUrl !== fallbackUrl) {
          try {
            const fallbackResponse = await fetch(fallbackUrl, {
              cache: 'no-cache',
              mode: 'cors'
            });
            if (fallbackResponse.ok) {
              setStatus('online');
              setError(null);
              return;
            }
          } catch (fallbackErr) {
            console.error('Fallback backend check also failed:', fallbackErr);
          }
        }
        
        setStatus('offline');
        setError(`Connection failed to ${apiUrl}`);
      }
    };
    checkStatus();
  }, [apiUrl, retryCount]);

  return (
    <div className="flex items-center gap-2">
      <div 
        title={`Connecting to: ${apiUrl || 'local'}${error ? ` - Error: ${error}` : ''}`}
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50 cursor-help"
      >
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : status === 'offline' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 animate-pulse'}`} />
        Backend: {status}
      </div>
        {status === 'offline' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setRetryCount(prev => prev + 1)}
              className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[8px] uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
            >
              Retry
            </button>
            <a 
              href={getApiUrl('/api/health')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[8px] uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
            >
              Test URL
            </a>
          </div>
        )}
    </div>
  );
};

const ProductShowcase = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string, url?: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  const handleBuyNow = async (product: any) => {
    if (!auth.currentUser) {
      // Save product to localStorage to resume after login
      localStorage.setItem('pendingPurchase', JSON.stringify(product));
      setNotification({ type: 'error', message: 'Please sign up or log in to complete your purchase.' });
      setTimeout(() => navigate('/signup'), 1500);
      return;
    }

    setPaymentLoading(product.id);
    setNotification(null);
    
    try {
      const endpoint = getApiUrl('/api/create-checkout-session');
      console.log('Initiating purchase for:', product.title, 'at', endpoint);
      
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            email: auth.currentUser?.email,
            userId: auth.currentUser?.uid,
          }),
        });
      } catch (e: any) {
        console.warn('Primary checkout session creation failed, trying fallback...', e);
        
        const fallbackUrl = `${BACKEND_URL}/api/create-checkout-session`;
        if (endpoint !== fallbackUrl) {
          response = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              title: product.title,
              price: product.price,
              image: product.image,
              email: auth.currentUser?.email,
              userId: auth.currentUser?.uid,
            }),
          });
        } else {
          throw e;
        }
      }

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response text:', text);
        console.error('Response Status:', response.status);
        console.error('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        let errorData = {};
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse error JSON:', e);
        }
        throw new Error((errorData as any).error || `Server responded with ${response.status}: ${text.substring(0, 100)}...`);
      }

      const text = await response.text();
      let session;
      try {
        session = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse success JSON:', e);
        console.error('Full response text:', text);
        console.error('Response Status:', response.status);
        console.error('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        throw new Error(`Invalid JSON response from server (Status ${response.status}). The server returned HTML instead of JSON. This often happens if the request is redirected or if the API route is not found.`);
      }

      if (session.error) {
        throw new Error(session.error);
      }

      // Stripe Checkout cannot be rendered in an iframe.
      // We must open it in a new tab.
      if (session.url) {
        const checkoutWindow = window.open(session.url, '_blank');
        
        if (!checkoutWindow || checkoutWindow.closed || typeof checkoutWindow.closed === 'undefined') {
          // Popup was blocked
          setNotification({ 
            type: 'error', 
            message: 'Popup blocked! Please allow popups or click here to complete payment.',
            url: session.url 
          });
        } else {
          setNotification({ type: 'success', message: 'Opening secure checkout in a new tab...' });
        }
      } else {
        throw new Error('Failed to create checkout session URL');
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      let errorMessage = error.message || 'Something went wrong with the payment.';
      
      if (errorMessage.includes('Failed to fetch')) {
        const targetUrl = getApiUrl('/api/create-checkout-session');
        errorMessage = `Could not connect to the payment server. This usually means the backend is offline or blocked by CORS. (Target: ${targetUrl})`;
      }
      
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setPaymentLoading(null);
    }
  };

  useEffect(() => {
    if (searchParams.get('success')) {
      setNotification({ 
        type: 'success', 
        message: 'Payment successful! The digital product has been sent to your email. Please check your inbox (and spam folder).' 
      });
      setSearchParams({});
    } else if (searchParams.get('canceled')) {
      setNotification({ type: 'error', message: 'Payment was canceled. Please try again when you are ready.' });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      // Check if there's a pending purchase after login
      const pendingPurchase = localStorage.getItem('pendingPurchase');
      if (currentUser && pendingPurchase) {
        const product = JSON.parse(pendingPurchase);
        localStorage.removeItem('pendingPurchase');
        handleBuyNow(product);
      }
    });

    return () => unsubscribe();
  }, []);

  const products = [
    {
      id: 'bundle',
      title: 'Habit + Task Tracker (Bundle)',
      desc: 'Get the best of both worlds. Combine our pro habit tracker and automated task system for ultimate life organization.',
      icon: Zap,
      price: '$9.99',
      image: 'https://lh3.googleusercontent.com/d/1GdeKQzGUUMMIpyFjvZ9pCrL43FvI1P5G',
      badge: 'Bundle Pack'
    },
    {
      id: 'habit',
      title: 'Habit Tracker pro (Excel)',
      desc: 'The ultimate habit tracking dashboard for high-performers. Build unbreakable consistency.',
      icon: Brain,
      price: '$6.99',
      image: 'https://i.pinimg.com/736x/ad/1f/fd/ad1ffdb4e6dfff1000060da843b2b3b7.jpg'
    },
    {
      id: 'task',
      title: 'Task tracker (Excel)',
      desc: 'Stay organized and boost productivity with our automated Excel task management system.',
      icon: CheckCircle2,
      price: '$4.99',
      image: 'https://i.pinimg.com/1200x/3a/fb/d1/3afbd192df3de2a6c0b2492c7a050f19.jpg'
    }
  ];

  return (
    <section id="products" className="py-24 bg-black relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-6"
          >
            <div className={`p-4 rounded-2xl border flex items-center gap-3 backdrop-blur-md ${
              notification.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-bold">{notification.message}</p>
                {notification.url && (
                  <a 
                    href={notification.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs underline mt-1 block font-bold"
                  >
                    Click here to open checkout
                  </a>
                )}
                {notification.type === 'error' && notification.message.includes('connect to the payment server') && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors"
                  >
                    Retry Connection
                  </button>
                )}
              </div>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/5 rounded-lg transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-neon-purple font-bold uppercase tracking-widest text-xs">Our Collection</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-2">Premium Digital Assets</h2>
          </div>
          <p className="text-gray-400 max-w-md text-white/60">
            One-time payment. Lifetime access. Instant download. Start your journey to efficiency today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -10 }}
              className="group relative bg-zinc-900/50 rounded-3xl overflow-hidden border border-white/5 hover:border-neon-purple/50 transition-all"
            >
              <div className="aspect-video overflow-hidden relative">
                {product.badge && (
                  <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                    {product.badge}
                  </div>
                )}
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-neon-purple/10 rounded-lg flex items-center justify-center">
                    <product.icon className="text-neon-purple w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-white">{product.price}</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">{product.title}</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  {product.desc}
                </p>
                <button 
                  onClick={() => handleBuyNow(product)}
                  disabled={paymentLoading !== null}
                  className="w-full py-4 bg-neon-purple rounded-xl font-bold glow-purple group-hover:glow-purple-strong transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  {paymentLoading === product.id ? 'Processing...' : 'Buy Now'} 
                  {paymentLoading !== product.id && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">Built for High Performance</h2>
            <div className="space-y-6">
              {[
                { title: 'Easy to Use', desc: 'No complex formulas or Excel experience needed. Just plug and play.' },
                { title: 'Fully Automated', desc: 'Calculations, charts, and summaries update instantly as you type.' },
                { title: 'Clean Dashboard', desc: 'Minimalist interface designed for focus and clarity.' },
                { title: 'Instant Download', desc: 'Get access to your files immediately after purchase.' },
                { title: 'Universal Compatibility', desc: 'Works seamlessly in Microsoft Excel and Google Sheets.' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="text-neon-purple w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">{feature.title}</h4>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-neon-purple/20 blur-[100px] rounded-full" />
            <div className="relative glass-panel p-4 rounded-2xl border-neon-purple/20 glow-purple">
              <img 
                src="https://picsum.photos/seed/habit-tracker-dashboard/800/600" 
                alt="Excel Preview" 
                className="rounded-xl w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const UseCaseGrid = () => {
  const cases = [
    { title: 'Build Better Habits', icon: Brain },
    { title: 'Track Your Habit', icon: Brain },
    { title: 'Stay Consistent', icon: Clock },
    { title: 'Save Time', icon: Zap },
    { title: 'Increase Productivity', icon: TrendingUp },
    { title: 'Simplify Your Life', icon: Layout },
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold mb-4">Why Choose WealthBox?</h2>
          <p className="text-gray-400">Transform your daily routine with tools that actually work.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((item, i) => (
            <div 
              key={i} 
              className={`p-8 rounded-2xl bg-zinc-900/30 border transition-all flex flex-col items-center text-center group ${
                i === 1 ? 'border-neon-purple/30 glow-purple-subtle bg-zinc-900/50' : 'border-white/5 hover:bg-zinc-900/50'
              }`}
            >
              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:bg-neon-purple/20 transition-colors">
                <item.icon className="text-gray-400 group-hover:text-neon-purple transition-colors w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    { title: 'Purchase Product', desc: 'Select your tool and complete the secure checkout.', icon: Wallet },
    { title: 'Download Instantly', desc: 'Receive your download link immediately via email.', icon: Download },
    { title: 'Start Tracking', desc: 'Open in Excel or Sheets and start your transformation.', icon: Zap },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold mb-4">How It Works</h2>
          <p className="text-gray-400">Three simple steps to a better you.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple/30 to-transparent -translate-y-1/2 z-0" />
          
          {steps.map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-black border-2 border-neon-purple rounded-full flex items-center justify-center mb-8 glow-purple">
                <step.icon className="text-neon-purple w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
              <p className="text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const reviews = [
    { name: 'Alex Rivera', role: 'Entrepreneur', text: 'The Tax Tracker saved me hours of stress during tax season. Worth every dollar!', rating: 5 },
    { name: 'Sarah Chen', role: 'Freelance Designer', text: 'I love the habit tracker. The visual progress keeps me motivated every single day.', rating: 5 },
    { name: 'Marcus Thorne', role: 'Product Manager', text: 'Clean, simple, and effective. Exactly what I was looking for to manage my finances.', rating: 5 },
  ];

  return (
    <section id="testimonials" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold mb-4">What Our Users Say</h2>
          <div className="flex items-center justify-center gap-1 text-neon-purple">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <div key={i} className="glass-panel p-8 rounded-2xl">
              <div className="flex gap-1 mb-4 text-yellow-500">
                {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-gray-300 italic mb-6 leading-relaxed">"{review.text}"</p>
              <div>
                <p className="font-bold">{review.name}</p>
                <p className="text-xs text-neon-purple font-semibold uppercase tracking-wider">{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-neon-purple/10 blur-[150px]" />
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="glass-panel p-12 md:p-20 rounded-[40px] text-center border-neon-purple/20">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 leading-tight">
            Start Building Discipline & <br /> Financial Clarity Today
          </h2>
          <a 
            href="#products"
            className="inline-block px-12 py-6 bg-neon-purple rounded-full text-xl font-bold glow-purple hover:glow-purple-strong hover:scale-105 transition-all mb-6 text-white"
          >
            Buy Now
          </a>
          <p className="text-gray-400 text-sm font-medium">
            No subscription. One-time payment. Instant access.
          </p>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-20 border-t border-white/5 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-neon-purple rounded-lg flex items-center justify-center">
                <Box className="text-white w-5 h-5 fill-white" />
              </div>
              <span className="text-2xl font-display font-bold tracking-tighter">WealthBox</span>
            </div>
            <p className="text-gray-400 max-w-sm leading-relaxed">
              Empowering individuals with smart digital tools for a more organized, disciplined, and financially clear life.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-neon-purple transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-neon-purple transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-neon-purple transition-colors">Refund Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Social</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-neon-purple transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-neon-purple transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-neon-purple transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <div className="flex flex-col gap-2">
            <p>© 2026 WealthBox. All rights reserved.</p>
            <BackendStatus />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Instant Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Main App ---

const LandingPage = () => {
  return (
    <div className="min-h-screen selection:bg-neon-purple selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <SecondaryNav />
        <div className="max-w-7xl mx-auto px-6 pt-12">
          <img 
            src="https://lh3.googleusercontent.com/d/18tMuCBH85xD3OAetmK6tK_8vo3vCeduW" 
            alt="Feature Highlight Image" 
            className="w-full rounded-3xl border border-white/10 shadow-2xl glow-purple-subtle"
            referrerPolicy="no-referrer"
          />
        </div>
        <FeatureHighlight />
        <ProductShowcase />
        <FeaturesSection />
        <UseCaseGrid />
        <HowItWorks />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Fallback for other routes */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
