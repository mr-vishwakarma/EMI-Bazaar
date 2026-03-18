import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Phone, ShieldCheck, ArrowRight, MessageSquare, Building2, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function Auth() {
    // Top Tabs: 'customer', 'vendor', 'admin'
    const [loginMode, setLoginMode] = useState<'customer' | 'vendor' | 'admin'>('customer');

    // Customer Auth State
    const [customerMode, setCustomerMode] = useState<'login' | 'signup'>('login');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPassword, setCustomerPassword] = useState('');
    const [customerConfirmPassword, setCustomerConfirmPassword] = useState('');
    
    // Shared Verification State
    const [showVerifyOTP, setShowVerifyOTP] = useState(false);
    const [verifyEmail, setVerifyEmail] = useState('');
    const [otpToken, setOtpToken] = useState('');

    // Business Login State (Vendor/Admin)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    // Vendor mode: 'login' or 'signup'
    const [vendorMode, setVendorMode] = useState<'login' | 'signup'>('login');
    const [confirmPassword, setConfirmPassword] = useState('');

    // --- Customer Sign Up / Login Flow (Email & Password) ---
    const handleCustomerSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (customerPassword !== customerConfirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        if (customerPassword.length < 8) {
            toast.error('Password must be at least 8 characters.');
            return;
        }
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email: customerEmail,
            password: customerPassword,
            options: { data: { role: 'customer' } }
        });

        setLoading(false);
        if (error) {
            toast.error('Sign up failed: ' + error.message);
        } else if (data.session) {
            login({
                id: data.session.user.id,
                email: data.session.user.email,
                name: data.session.user.user_metadata?.full_name || 'Customer',
                role: 'customer',
            });
            toast.success('Welcome to EMI Bazaar! 🎉');
            navigate('/');
        } else if (data.user) {
             // Supabase Email Confirmation is ON
             toast.success('OTP sent! Please check your email for the 8-digit code.');
             setVerifyEmail(customerEmail);
             setShowVerifyOTP(true);
        }
    };

    const handleCustomerLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: customerEmail,
            password: customerPassword
        });

        setLoading(false);

        if (error) {
            toast.error('Login Failed: ' + error.message);
            return;
        }

        if (data.session) {
            login({
                id: data.session.user.id,
                email: data.session.user.email,
                name: data.session.user.user_metadata?.full_name || 'Customer',
                role: 'customer'
            });
            toast.success('Welcome back! 🎉');
            navigate('/');
        }
    };

    // --- Verify OTP Flow (6-digit token from Supabase Email) ---
    const handleVerifyUserOTP = async (e: React.FormEvent, targetRole: 'customer' | 'vendor') => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.verifyOtp({
            email: verifyEmail,
            token: otpToken,
            type: 'signup'
        });

        setLoading(false);

        if (error) {
            toast.error('Verification Failed: ' + error.message);
        } else if (data.session) {
            login({
                id: data.session.user.id,
                email: data.session.user.email || '',
                name: data.session.user.user_metadata?.full_name || (targetRole === 'customer' ? 'Customer' : 'Vendor'),
                role: targetRole,
            });
            toast.success('Email Verified Successfully! 🎉');
            setShowVerifyOTP(false);
            if (targetRole === 'customer') {
                navigate('/');
            } else {
                navigate('/vendor/register');
            }
        }
    };

    // --- Vendor Sign Up Flow ---
    const handleVendorSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters.');
            return;
        }
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { role: 'vendor' } }
        });

        setLoading(false);
        if (error) {
            toast.error('Sign up failed: ' + error.message);
        } else if (data.session) {
            login({
                id: data.session.user.id,
                email: data.session.user.email,
                name: data.session.user.user_metadata?.full_name || 'Vendor',
                role: 'vendor',
            });
            toast.success('Account created! Now set up your store.');
            navigate('/vendor/register');
        } else if (data.user) {
             toast.success('OTP sent! Please check your email for the 8-digit code.');
             setVerifyEmail(email);
             setShowVerifyOTP(true);
        }
    };

    // --- Business Login Flow (Vendor/Admin) ---
    const handleBusinessLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        setLoading(false);

        if (error) {
            toast.error('Login Failed: ' + error.message);
            return;
        }

        if (data.session) {
            // Note: In a full app, you might query the 'users' table to double check the exact role and shopId.
            // For now, we rely on the metadata OR assume based on the tab clicked.
            const userRole = data.session.user.user_metadata?.role || loginMode;

            login({
                id: data.session.user.id,
                email: data.session.user.email,
                name: data.session.user.user_metadata?.full_name || 'System User',
                role: userRole,
                shopId: userRole === 'vendor' ? 'shop_live_123' : undefined // Mock shop mapping until setup
            });

            if (userRole === 'admin') {
                toast.success('Welcome back, Admin!');
                navigate('/admin');
            } else {
                toast.success('Welcome to your Vendor Hub!');
                navigate('/vendor');
            }
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-secondary/30 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md bg-background rounded-3xl shadow-2xl border border-border overflow-hidden relative z-10"
            >
                {/* Mode Selector */}
                <div className="flex border-b border-border/50">
                    <button
                        onClick={() => { setLoginMode('customer'); setCustomerMode('login'); setShowVerifyOTP(false); }}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${loginMode === 'customer' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-muted-foreground hover:bg-secondary/50'}`}
                    >
                        Customer
                    </button>
                    <button
                        onClick={() => { setLoginMode('vendor'); setShowVerifyOTP(false); }}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors border-l border-border/50 ${loginMode === 'vendor' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5' : 'text-muted-foreground hover:bg-secondary/50'}`}
                    >
                        Vendor
                    </button>
                    <button
                        onClick={() => { setLoginMode('admin'); setShowVerifyOTP(false); }}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors border-l border-border/50 ${loginMode === 'admin' ? 'text-rose-500 border-b-2 border-rose-500 bg-rose-500/5' : 'text-muted-foreground hover:bg-secondary/50'}`}
                    >
                        Admin
                    </button>
                </div>

                <div className="px-8 pt-8 pb-8">
                    <div className="flex justify-center mb-8">
                        <motion.div
                            whileHover={{ rotate: 90 }}
                            transition={{ type: "spring", stiffness: 300, damping: 10 }}
                            className={`rounded-2xl p-3 text-white shadow-lg ${loginMode === 'customer' ? 'bg-accent shadow-accent/20' :
                                loginMode === 'vendor' ? 'bg-blue-500 shadow-blue-500/20' :
                                    'bg-rose-500 shadow-rose-500/20'
                                }`}
                        >
                            {loginMode === 'customer' && <Store size={28} />}
                            {loginMode === 'vendor' && <Building2 size={28} />}
                            {loginMode === 'admin' && <ShieldAlert size={28} />}
                        </motion.div>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* CUSTOMER OTP LOGIN */}
                        {loginMode === 'customer' && (
                            <motion.div key="customer-flow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                
                                <div className="flex bg-secondary rounded-2xl p-1 mb-6 gap-1">
                                    <button
                                        onClick={() => setCustomerMode('login')}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                            customerMode === 'login'
                                                ? 'bg-background text-accent shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => setCustomerMode('signup')}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                            customerMode === 'signup'
                                                ? 'bg-background text-accent shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Create Account
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                {showVerifyOTP ? (
                                    <motion.div key="customer-verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <h2 className="text-3xl font-black text-center mb-2 tracking-tight">Verify Email</h2>
                                        <p className="text-muted-foreground text-center mb-8 text-sm">We sent an 8-digit code to <span className="font-bold">{verifyEmail}</span></p>

                                        <form onSubmit={(e) => handleVerifyUserOTP(e, 'customer')} className="space-y-6">
                                            <input
                                                type="text"
                                                placeholder="Enter 8-Digit Code"
                                                value={otpToken}
                                                onChange={(e) => setOtpToken(e.target.value)}
                                                required
                                                maxLength={8}
                                                className="w-full bg-secondary/50 border border-border focus:border-accent/50 focus:bg-background rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-black outline-none transition-all shadow-sm"
                                            />
                                            <Button type="submit" variant="accent" disabled={loading || otpToken.length < 8} className="w-full rounded-xl py-6 text-base font-bold shadow-lg shadow-accent/20">
                                                {loading ? 'Verifying...' : 'Verify Email & Enter'}
                                            </Button>
                                            
                                            <div className="text-center mt-4">
                                                <button type="button" onClick={() => setShowVerifyOTP(false)} className="text-xs text-muted-foreground hover:text-accent font-semibold transition-colors">
                                                    Cancel / Back to Login
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                ) : customerMode === 'login' ? (
                                    <motion.div key="customer-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <h2 className="text-3xl font-black text-center mb-2 tracking-tight">Login</h2>
                                        <p className="text-muted-foreground text-center mb-8 text-sm">Unlock 0% EMI instantly with your Account.</p>

                                        <form onSubmit={handleCustomerLogin} className="space-y-4">
                                            <input
                                                type="email"
                                                placeholder="Enter Your Email"
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                required
                                                className="w-full bg-secondary/50 border border-border focus:border-accent/50 focus:bg-background rounded-xl px-4 py-4 text-base font-medium outline-none transition-all duration-300 tracking-wider"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={customerPassword}
                                                onChange={(e) => setCustomerPassword(e.target.value)}
                                                required
                                                className="w-full bg-secondary/50 border border-border focus:border-accent/50 focus:bg-background rounded-xl px-4 py-4 text-base font-medium outline-none transition-all duration-300 tracking-wider"
                                            />
                                            <Button type="submit" variant="accent" disabled={loading || !customerEmail.includes('@') || !customerPassword} className="w-full rounded-xl py-6 text-base font-bold shadow-lg shadow-accent/20 flex items-center justify-center gap-2 group mt-2">
                                                {loading ? 'Logging in...' : 'Sign In'}
                                                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                            </Button>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <motion.div key="customer-signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <h2 className="text-3xl font-black text-center mb-2 tracking-tight">Sign Up</h2>
                                        <p className="text-muted-foreground text-center mb-8 text-sm">Join EMI Bazaar to grab instant offers.</p>

                                        <form onSubmit={handleCustomerSignUp} className="space-y-4">
                                            <input
                                                type="email"
                                                placeholder="Email Address"
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                required
                                                className="w-full bg-secondary/50 border border-border focus:border-accent/50 focus:bg-background rounded-xl px-4 py-3.5 text-base font-medium outline-none transition-all duration-300 tracking-wider"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Create Password (min. 8 chars)"
                                                value={customerPassword}
                                                onChange={(e) => setCustomerPassword(e.target.value)}
                                                required
                                                minLength={8}
                                                className="w-full bg-secondary/50 border border-border focus:border-accent/50 focus:bg-background rounded-xl px-4 py-3.5 text-base font-medium outline-none transition-all duration-300 tracking-wider"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={customerConfirmPassword}
                                                onChange={(e) => setCustomerConfirmPassword(e.target.value)}
                                                required
                                                className="w-full bg-secondary/50 border border-border focus:border-accent/50 focus:bg-background rounded-xl px-4 py-3.5 text-base font-medium outline-none transition-all duration-300 tracking-wider"
                                            />
                                            <Button type="submit" variant="accent" disabled={loading || !customerEmail || !customerPassword || !customerConfirmPassword} className="w-full rounded-xl py-6 text-base font-bold shadow-lg shadow-accent/20 flex items-center justify-center gap-2 group mt-2">
                                                {loading ? 'Creating Account...' : 'Sign Up'}
                                            </Button>
                                        </form>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </motion.div>
                        )}


                        {/* VENDOR LOGIN / SIGNUP */}
                        {(loginMode === 'vendor') && (
                            <motion.div key="vendor-flow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

                                {/* Toggle */}
                                <div className="flex bg-secondary rounded-2xl p-1 mb-6 gap-1">
                                    <button
                                        onClick={() => setVendorMode('login')}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                            vendorMode === 'login'
                                                ? 'bg-background text-blue-500 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => setVendorMode('signup')}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                            vendorMode === 'signup'
                                                ? 'bg-background text-blue-500 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        New Store
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                {showVerifyOTP ? (
                                    <motion.div key="vendor-verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <h2 className="text-2xl font-black text-center mb-1 tracking-tight">Verify Your Store</h2>
                                        <p className="text-muted-foreground text-center mb-6 text-sm">Enter the 8-digit code sent to <span className="font-bold">{verifyEmail}</span></p>

                                        <form onSubmit={(e) => handleVerifyUserOTP(e, 'vendor')} className="space-y-6">
                                            <input
                                                type="text"
                                                placeholder="Enter 8-Digit Code"
                                                value={otpToken}
                                                onChange={(e) => setOtpToken(e.target.value)}
                                                required
                                                maxLength={8}
                                                className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-black outline-none transition-all shadow-sm"
                                            />
                                            <Button type="submit" disabled={loading || otpToken.length < 8} className="w-full rounded-xl py-6 text-base font-bold shadow-lg text-white bg-blue-600 hover:bg-blue-700 shadow-blue-500/20">
                                                {loading ? 'Verifying...' : 'Verify Store Account'}
                                            </Button>
                                            
                                            <div className="text-center mt-4">
                                                <button type="button" onClick={() => setShowVerifyOTP(false)} className="text-xs text-muted-foreground hover:text-blue-500 font-semibold transition-colors">
                                                    Cancel / Back to Login
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                ) : vendorMode === 'login' ? (
                                    <motion.div key="vendor-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <h2 className="text-2xl font-black text-center mb-1 tracking-tight">Vendor Portal</h2>
                                        <p className="text-muted-foreground text-center mb-6 text-sm">Sign in to manage your EMI store.</p>

                                        <form onSubmit={handleBusinessLogin} className="space-y-4">
                                            <input
                                                type="email"
                                                placeholder="Work Email Address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-4 text-base font-medium outline-none transition-all shadow-sm"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-4 text-base font-medium outline-none transition-all shadow-sm"
                                            />
                                            <Button type="submit" disabled={loading || !email || !password} className="w-full rounded-xl py-6 text-base font-bold shadow-lg text-white bg-blue-600 hover:bg-blue-700 shadow-blue-500/20">
                                                {loading ? 'Signing in...' : 'Sign In'}
                                            </Button>
                                        </form>

                                        <p className="text-center text-sm text-muted-foreground mt-4">
                                            New vendor? <button onClick={() => setVendorMode('signup')} className="text-blue-500 font-bold hover:underline">Create a store →</button>
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div key="vendor-signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <h2 className="text-2xl font-black text-center mb-1 tracking-tight">Create Your Store</h2>
                                        <p className="text-muted-foreground text-center mb-6 text-sm">Join EMI Bazaar as a verified vendor.</p>

                                        <form onSubmit={handleVendorSignUp} className="space-y-4">
                                            <input
                                                type="email"
                                                placeholder="Business Email Address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-3.5 text-base font-medium outline-none transition-all shadow-sm"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Create Password (min. 8 chars)"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={8}
                                                className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-3.5 text-base font-medium outline-none transition-all shadow-sm"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-3.5 text-base font-medium outline-none transition-all shadow-sm"
                                            />
                                            <Button type="submit" disabled={loading || !email || !password || !confirmPassword} className="w-full rounded-xl py-6 text-base font-bold shadow-lg text-white bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 flex items-center justify-center gap-2">
                                                {loading ? 'Creating Account...' : 'Create Account & Continue →'}
                                            </Button>
                                        </form>

                                        <p className="text-xs text-muted-foreground text-center mt-4">
                                            Already have an account? <button onClick={() => setVendorMode('login')} className="text-blue-500 font-bold hover:underline">Sign in</button>
                                        </p>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* ADMIN LOGIN */}
                        {loginMode === 'admin' && (
                            <motion.div key="admin-flow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <h2 className="text-3xl font-black text-center mb-2 tracking-tight">Admin Console</h2>
                                <p className="text-muted-foreground text-center mb-8 text-sm">System restricted access portal.</p>

                                <form onSubmit={handleBusinessLogin} className="space-y-6">
                                    <input
                                        type="email"
                                        placeholder="Admin Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-secondary/50 border border-border focus:border-rose-500 focus:bg-background rounded-xl px-4 py-4 text-base font-medium outline-none transition-all shadow-sm"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Secure Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-secondary/50 border border-border focus:border-rose-500 focus:bg-background rounded-xl px-4 py-4 text-base font-medium outline-none transition-all shadow-sm"
                                    />
                                    <Button type="submit" disabled={loading || !email || !password} className="w-full rounded-xl py-6 text-base font-bold shadow-lg text-white bg-rose-600 hover:bg-rose-700 shadow-rose-500/20">
                                        {loading ? 'Authenticating...' : 'Secure Sign In'}
                                    </Button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Common Footer */}
                    <div className="mt-8 relative flex items-center justify-center">
                        <div className="absolute w-full border-t border-border"></div>
                        <span className="bg-background px-4 text-xs text-muted-foreground relative font-medium uppercase tracking-wider">
                            Secure Authentication
                        </span>
                    </div>
                </div>

                {/* Security Badge */}
                <div className="bg-secondary/50 border-t border-border p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
                    <ShieldCheck size={16} className={`
                        ${loginMode === 'customer' ? 'text-green-500' : ''}
                        ${loginMode === 'vendor' ? 'text-blue-500' : ''}
                        ${loginMode === 'admin' ? 'text-rose-500' : ''}
                    `} />
                    256-bit encrypted authentication
                </div>
            </motion.div>
        </div>
    );
}
