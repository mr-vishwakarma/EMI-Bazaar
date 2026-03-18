import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Store, ShoppingBag, LayoutDashboard, Search, Menu, X, User } from 'lucide-react';
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
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Button } from './components/ui/button';
import { useAuthStore } from './features/auth/stores/authStore';
import { supabase } from './lib/supabase';
import { Toaster } from 'sonner';

import './index.css';

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [vendorLogo, setVendorLogo] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.role === 'vendor' && user?.id) {
       supabase.from('vendor_profiles').select('logo_url').eq('user_id', user.id).single()
         .then(({ data }) => setVendorLogo(data?.logo_url || null));
    } else {
       setVendorLogo(null);
    }
  }, [user]);

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
            {!isAuthenticated ? (
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <User className="text-muted-foreground hover:text-accent transition-colors mt-1" size={22} />
                </motion.div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/profile'}>
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden">
                    {vendorLogo ? (
                        <img src={vendorLogo} alt="Shop Logo" className="w-full h-full object-cover" />
                    ) : (
                        user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                </Link>
                <div className="flex flex-col text-sm justify-center leading-tight max-w-[100px]">
                    <span className="font-bold truncate">{user?.name?.split(' ')[0]}</span>
                    <button onClick={logout} className="text-left text-[10px] font-bold text-muted-foreground hover:text-red-500 transition-colors uppercase tracking-wider">
                      Logout
                    </button>
                </div>
              </div>
            )}

            <ThemeToggle />

            <Link to="/checkout" className="ml-2">
              <Button variant="accent" className="rounded-full gap-2 px-5 shadow-sm shadow-accent/20">
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
                    {vendorLogo ? (
                        <img src={vendorLogo} alt="Logo" className="w-6 h-6 rounded-full object-cover inline-block" />
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
