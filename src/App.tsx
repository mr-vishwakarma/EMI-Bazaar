import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Store, ShoppingBag, LayoutDashboard, Search, Menu, X, User, Bell, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import ShopProfile from './pages/ShopProfile';
import Checkout from './pages/Checkout';
import VendorDashboard from './pages/VendorDashboard';
import VendorOnboarding from './pages/VendorOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './features/auth/components/AuthPage';
import Profile from './pages/Profile';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Button } from './components/ui/button';
import { useAuthStore } from './features/auth/stores/authStore';
import { supabase } from './lib/supabase';
import { Toaster } from 'sonner';

import './index.css';

import NotificationPopover from './components/NotificationPopover';

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [currentAvatar, setCurrentAvatar] = React.useState<string | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = React.useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const bellRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user?.id) {
       setCurrentAvatar(null);
       return;
    }
    
    const fetchUserData = async () => {
        const { data } = await supabase.rpc('get_user_chat_profiles', { p_user_ids: [user.id] });
        if (data?.[0]?.avatar_url) {
            setCurrentAvatar(data[0].avatar_url);
        }
    };
    fetchUserData();
  }, [user]);

  // Real-time listener for notifications and messages
  React.useEffect(() => {
    if (!user) return;
    
    const fetchAllCounts = async () => {
      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      setNotifications(notifs || []);
      setUnreadNotifCount(notifs?.filter(n => !n.is_read).length || 0);

      const { count: msgCount } = await supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false);
      setUnreadMsgCount(msgCount || 0);
    };
    fetchAllCounts();

    const notifChannel = supabase.channel('navbar_notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadNotifCount(prev => prev + 1);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        // Simple refresh on update (e.g. marked as read from another tab)
        fetchAllCounts();
      })
      .subscribe();

    const msgChannel = supabase.channel('navbar_msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${user.id}` }, () => {
        setUnreadMsgCount(prev => prev + 1);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${user.id}` }, () => {
        fetchAllCounts();
      })
      .subscribe();

    return () => { 
        supabase.removeChannel(notifChannel); 
        supabase.removeChannel(msgChannel);
    };
  }, [user]);

  // Close on click outside
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadNotifCount(prev => Math.max(0, prev - 1));
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
              className="bg-accent rounded-lg p-2 text-white"
            >
              <Store size={20} />
            </motion.div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">EMI Bazaar</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search modern products, stores, and more..."
              className="w-full bg-secondary/50 border border-transparent focus:border-accent/40 focus:bg-background rounded-full pl-10 pr-4 py-2 text-sm outline-none transition-all duration-300 shadow-sm focus:shadow-md"
            />
          </div>

          <div className="hidden md:flex items-center gap-4">
            {(!user || user.role === 'customer') && (
              <Link to="/vendor/register">
                <span className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname.includes('/vendor') ? 'text-accent' : 'text-muted-foreground'}`}>
                  Become a Seller
                </span>
              </Link>
            )}
            {user?.role === 'vendor' && (
              <Link to="/vendor">
                <span className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname.includes('/vendor') ? 'text-accent' : 'text-muted-foreground'}`}>
                  Vendor Hub
                </span>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin">
                <span className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname.includes('/admin') ? 'text-accent' : 'text-muted-foreground'}`}>
                  Admin Center
                </span>
              </Link>
            )}

            {isAuthenticated && (
              <div className="flex items-center gap-3 mr-2">
                <Link to="/messages">
                  <motion.div whileHover={{ scale: 1.1 }} className="relative text-muted-foreground hover:text-accent transition-colors">
                    <MessageSquare size={20} />
                    {unreadMsgCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-white border-2 border-background rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                        {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                      </span>
                    )}
                  </motion.div>
                </Link>
                <div ref={bellRef} className="relative group">
                  <motion.div 
                    onClick={() => setShowNotifications(!showNotifications)}
                    whileHover={{ scale: 1.1 }} 
                    className={`cursor-pointer transition-colors relative ${showNotifications ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
                  >
                    <Bell size={20} />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 border-2 border-background rounded-full flex items-center justify-center text-[10px] font-black shadow-sm text-white">
                         {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                      </span>
                    )}
                  </motion.div>

                  <AnimatePresence>
                    {showNotifications && (
                        <NotificationPopover 
                            notifications={notifications} 
                            onClose={() => setShowNotifications(false)}
                            onMarkRead={markAsRead}
                        />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {!isAuthenticated ? (
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <User className="text-muted-foreground hover:text-accent transition-colors mt-1" size={22} />
                </motion.div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/profile'}>
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden border">
                    {currentAvatar ? (
                        <img src={currentAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                </Link>
              </div>
            )}

            <ThemeToggle />

            <Link to="/checkout" className="ml-2">
              <Button variant="accent" className="rounded-full gap-2 px-5 shadow-sm shadow-accent/20 h-10">
                <ShoppingBag size={16} /> <span>Cart</span>
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-foreground p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-0 top-16 bg-background border-b z-40 p-4 shadow-xl"
          >
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-secondary border border-transparent rounded-lg pl-10 pr-4 py-2 text-sm outline-none"
                />
              </div>
              {(!user || user.role === 'customer') && (
                <Link to="/vendor/register" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-sm font-medium bg-secondary/50 rounded-lg">Become a Seller</Link>
              )}
              {user?.role === 'vendor' && (
                <Link to="/vendor" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-sm font-medium bg-secondary/50 rounded-lg">Vendor Hub</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-sm font-medium bg-secondary/50 rounded-lg">Admin View</Link>
              )}
              {!isAuthenticated ? (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-sm font-medium bg-secondary/50 rounded-lg flex items-center gap-2">
                  <User size={16} /> Login / Profile
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/profile'} onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold bg-accent/10 text-accent rounded-lg flex items-center gap-3">
                    {currentAvatar ? (
                        <img src={currentAvatar} alt="Logo" className="w-6 h-6 rounded-full object-cover inline-block" />
                    ) : (
                        <User size={16} />
                    )} 
                    Welcome, {user?.name?.split(' ')[0]}
                  </Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg">
                    Log Out
                  </button>
                </div>
              )}

              <ThemeToggle />

              <Link to="/checkout" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="accent" className="w-full rounded-lg gap-2">
                  <ShoppingBag size={16} /> Checkout Cart
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
            <Home />
          </motion.div>
        } />
        <Route path="/product/:id" element={
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
            <ProductDetail />
          </motion.div>
        } />
        <Route path="/shop/:id" element={
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
            <ShopProfile />
          </motion.div>
        } />
        <Route path="/checkout" element={
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
            <Checkout />
          </motion.div>
        } />
        {/* Protected Routes - Vendor Only */}
        <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
          <Route path="/vendor" element={
            <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.3 }}>
              <VendorDashboard />
            </motion.div>
          } />
        </Route>

        {/* Protected Routes - Admin Only */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
              <AdminDashboard />
            </motion.div>
          } />
        </Route>

        {/* Standard Auth Flow Unprotected */}
        <Route path="/auth" element={
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
            <Auth />
          </motion.div>
        } />
        <Route path="/vendor/register" element={
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
            <VendorOnboarding />
          </motion.div>
        } />

        {/* Protected Routes - Authenticated Users Only */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
              <Profile />
            </motion.div>
          } />
          <Route path="/messages" element={
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
              <ChatPage />
            </motion.div>
          } />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-accent/20 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 w-full mx-auto pb-12 overflow-x-hidden">
            <AnimatedRoutes />
          </main>
          <Toaster richColors position="top-right" />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
