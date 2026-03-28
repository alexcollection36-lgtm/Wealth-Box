import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  ArrowLeft,
  Search,
  User as UserIcon,
  ExternalLink,
  ChevronRight,
  Package,
  Settings,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Customer {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: any;
  lastLogin?: any;
}

interface ProductConfig {
  id: string;
  title: string;
  downloadUrl: string;
  downloadUrl2?: string;
  emailSubject: string;
  emailBody: string;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'products'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveStatus, setSaveStatus] = useState<{[key: string]: 'idle' | 'saving' | 'success' | 'error'}>({});
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== 'alexcollection36@gmail.com') {
        navigate('/');
        return;
      }
      setIsAdmin(true);
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin || !auth.currentUser) return;

    // Fetch Customers
    const customersPath = 'users';
    const qCustomers = query(collection(db, customersPath), orderBy('createdAt', 'desc'));
    const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
      const customerList: Customer[] = [];
      snapshot.forEach((doc) => {
        customerList.push({ uid: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customerList);
      if (activeTab === 'customers') setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, customersPath);
    });

    // Fetch Products
    const productsPath = 'products';
    const unsubscribeProducts = onSnapshot(collection(db, productsPath), (snapshot) => {
      const productList: ProductConfig[] = [];
      snapshot.forEach((doc) => {
        productList.push({ id: doc.id, ...doc.data() } as ProductConfig);
      });
      
      // Ensure default products exist in the list if not in DB
      const defaults = [
        { id: 'bundle', title: 'The Ultimate Wealth Bundle' },
        { id: 'habit', title: 'Habit Architect Pro' },
        { id: 'task', title: 'Task Mastery System' },
        { id: 'food', title: 'Food Product (Test)' }
      ];

      const merged = defaults.map(def => {
        const existing = productList.find(p => p.id === def.id);
        return existing || {
          id: def.id,
          title: def.title,
          downloadUrl: '',
          downloadUrl2: '',
          emailSubject: `Your Download: ${def.title}`,
          emailBody: `Hi there!\n\nThank you for your purchase of ${def.title}.\n\nYou can access your digital product here: {{DOWNLOAD_URL}}\n\nBest regards,\nThe WealthBox Team`
        };
      });

      setProducts(merged);
      if (activeTab === 'products') setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, productsPath);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, [isAdmin, activeTab]);

  const handleSaveProduct = async (product: ProductConfig) => {
    console.log("Saving product:", product);
    setSaveStatus(prev => ({ ...prev, [product.id]: 'saving' }));
    try {
      await setDoc(doc(db, 'products', product.id), product);
      setSaveStatus(prev => ({ ...prev, [product.id]: 'success' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [product.id]: 'idle' }));
      }, 3000);
    } catch (error) {
      console.error("Error saving product:", error);
      setSaveStatus(prev => ({ ...prev, [product.id]: 'error' }));
    }
  };

  const updateProductField = (id: string, field: keyof ProductConfig, value: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const filteredCustomers = customers.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.displayName && c.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAdmin && !loading) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neon-purple selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-xl font-display font-bold">Admin Dashboard</h1>
              <p className="text-[10px] text-neon-purple font-bold uppercase tracking-widest">WealthBox Command Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
              <button 
                onClick={() => setActiveTab('customers')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'customers' ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Customers
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'products' ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Products
              </button>
            </nav>

            <div className="flex items-center gap-3 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 rounded-full">
              <ShieldCheck className="w-4 h-4 text-neon-purple" />
              <span className="text-xs font-bold text-neon-purple uppercase tracking-wider">Admin Verified</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'customers' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 rounded-3xl border-white/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-neon-purple/10 rounded-2xl flex items-center justify-center glow-purple">
                    <Users className="text-neon-purple w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Customers</span>
                </div>
                <div className="text-4xl font-display font-bold">{customers.length}</div>
                <p className="text-gray-500 text-xs mt-2 font-medium">Registered users in database</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-8 rounded-3xl border-white/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <Calendar className="text-blue-500 w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">New Today</span>
                </div>
                <div className="text-4xl font-display font-bold">
                  {customers.filter(c => {
                    const date = c.createdAt?.toDate ? c.createdAt.toDate() : new Date();
                    return date.toDateString() === new Date().toDateString();
                  }).length}
                </div>
                <p className="text-gray-500 text-xs mt-2 font-medium">Joined in the last 24 hours</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-8 rounded-3xl border-white/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="text-emerald-500 w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Status</span>
                </div>
                <div className="text-4xl font-display font-bold text-emerald-400">Operational</div>
                <p className="text-gray-500 text-xs mt-2 font-medium">All systems running smoothly</p>
              </motion.div>
            </div>

            {/* Search & Filter */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-neon-purple transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <Users className="w-4 h-4" />
                Showing {filteredCustomers.length} of {customers.length} customers
              </div>
            </div>

            {/* Customer Table */}
            <div className="glass-panel rounded-3xl border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-gray-500">Customer</th>
                      <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-gray-500">Email Address</th>
                      <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-gray-500">Joined Date</th>
                      <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading customer data...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No customers found matching your search.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer, i) => (
                        <motion.tr 
                          key={customer.uid}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                {customer.photoURL ? (
                                  <img src={customer.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <UserIcon className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white">{customer.displayName || 'Anonymous User'}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">ID: {customer.uid.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Mail className="w-4 h-4 text-neon-purple/50" />
                              <span className="text-sm font-medium">{customer.email}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-400 font-medium">
                              {customer.createdAt?.toDate ? customer.createdAt.toDate().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-neon-purple/20 hover:border-neon-purple/50 transition-all group/btn">
                                <ExternalLink className="w-4 h-4 text-gray-500 group-hover/btn:text-neon-purple transition-colors" />
                              </button>
                              <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-display font-bold">Product Delivery Settings</h2>
                <p className="text-gray-500 mt-2">Configure download links and automated delivery emails.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Settings className="w-4 h-4" />
                Auto-Save Enabled
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {products.map((product) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-panel p-8 rounded-3xl border-white/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-neon-purple" />
                  
                  <div className="flex flex-col lg:flex-row gap-12">
                    <div className="lg:w-1/3">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-neon-purple/10 rounded-xl flex items-center justify-center">
                          <Package className="text-neon-purple w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold">{product.title}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-6">
                        Set the link that will be sent to customers after they purchase this item.
                      </p>
                      
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Download URL 1</label>
                            <div className="relative">
                              <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <input 
                                type="url" 
                                placeholder="https://your-storage.com/file1.zip"
                                value={product.downloadUrl}
                                onChange={(e) => updateProductField(product.id, 'downloadUrl', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-neon-purple/50 transition-all text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Download URL 2 (Optional)</label>
                            <div className="relative">
                              <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <input 
                                type="url" 
                                placeholder="https://your-storage.com/file2.zip"
                                value={product.downloadUrl2 || ''}
                                onChange={(e) => updateProductField(product.id, 'downloadUrl2', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-neon-purple/50 transition-all text-sm"
                              />
                            </div>
                          </div>
                        </div>
                    </div>

                    <div className="lg:w-2/3 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Template</h4>
                        <div className="text-[10px] text-gray-600 font-medium">
                          Use <code className="text-neon-purple">{"{{DOWNLOAD_URL}}"}</code> and <code className="text-neon-purple">{"{{DOWNLOAD_URL_2}}"}</code> as placeholders
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Subject Line</label>
                          <input 
                            type="text" 
                            placeholder="Your Download is Ready!"
                            value={product.emailSubject}
                            onChange={(e) => updateProductField(product.id, 'emailSubject', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-neon-purple/50 transition-all text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Email Body</label>
                          <textarea 
                            rows={6}
                            placeholder="Write your message here..."
                            value={product.emailBody}
                            onChange={(e) => updateProductField(product.id, 'emailBody', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 outline-none focus:border-neon-purple/50 transition-all text-sm resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={() => handleSaveProduct(product)}
                          disabled={saveStatus[product.id] === 'saving'}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                            saveStatus[product.id] === 'success' ? 'bg-green-500 text-white' :
                            saveStatus[product.id] === 'error' ? 'bg-red-500 text-white' :
                            'bg-white/10 text-white hover:bg-neon-purple'
                          }`}
                        >
                          {saveStatus[product.id] === 'saving' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : saveStatus[product.id] === 'success' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : saveStatus[product.id] === 'error' ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {saveStatus[product.id] === 'saving' ? 'Saving...' : 
                           saveStatus[product.id] === 'success' ? 'Saved!' : 
                           saveStatus[product.id] === 'error' ? 'Error' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          WealthBox Admin Protocol v1.0.4 • Secure Connection
        </p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
