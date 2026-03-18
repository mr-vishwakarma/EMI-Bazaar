import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, MapPin, Search, Package, CheckCircle2, CreditCard, ShieldCheck, Settings, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Profile() {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <User size={18} /> },
        { id: 'orders', label: 'My Orders', icon: <Package size={18} /> },
        { id: 'verification', label: 'Verification', icon: <ShieldCheck size={18} /> },
        { id: 'payments', label: 'Payment Methods', icon: <CreditCard size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
    ];

    const mockOrders = [
        { id: 'ORD-83749', date: 'Oct 24, 2026', total: '₹45,000', emi: '₹4,500/mo', status: 'Active EMI', product: 'MacBook Air M2', shop: 'iStore Electronics' },
        { id: 'ORD-99382', date: 'Sep 12, 2026', total: '₹12,499', emi: 'Paid Off', status: 'Completed', product: 'Sony WH-1000XM4', shop: 'Sound Center' }
    ];

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col md:flex-row gap-8 min-h-[calc(100vh-4rem)]">

            {/* Sidebar Navigation */}
            <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full md:w-64 flex-shrink-0"
            >
                <div className="bg-card rounded-3xl border shadow-sm overflow-hidden sticky top-24">
                    <div className="p-6 bg-gradient-to-br from-accent/10 to-transparent border-b">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-accent font-bold text-2xl">
                                SA
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Shyam Alok</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CheckCircle2 size={12} className="text-green-500" /> Verified User
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="p-4 space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-accent text-white shadow-md shadow-accent/20' : 'hover:bg-secondary text-foreground/80 hover:text-foreground'}`}
                            >
                                {tab.icon}
                                {tab.label}
                                {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t mt-4">
                        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl gap-2">
                            <LogOut size={18} /> Sign Out
                        </Button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-4xl">
                <AnimatePresence mode="wait">

                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <h2 className="text-3xl font-bold tracking-tight mb-6">Profile Overview</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Credit Limit Card */}
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[40px] pointer-events-none group-hover:bg-accent/30 transition-colors" />
                                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-slate-400 font-medium text-sm">Available EMI Limit</p>
                                                <h3 className="text-4xl font-black mt-1">₹85,000</h3>
                                            </div>
                                            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
                                                <ShieldCheck size={24} className="text-green-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs mb-2 text-slate-300 font-medium">
                                                <span>Used: ₹45,000</span>
                                                <span>Total: ₹1,30,000</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-accent to-[#ff8c69] w-[35%] rounded-full shadow-[0_0_10px_rgba(255,107,61,0.5)]" />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-3 font-medium">Score: <span className="text-green-400">Excellent (782)</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info */}
                                <div className="bg-card border rounded-3xl p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold">Personal Details</h3>
                                        <Button variant="outline" size="sm" className="h-8 rounded-full text-xs">Edit</Button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-2 rounded-lg text-muted-foreground"><User size={16} /></div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Full Name</p>
                                                <p className="text-sm font-semibold">Shyam Alok</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-2 rounded-lg text-muted-foreground"><Mail size={16} /></div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                                                <p className="text-sm font-semibold">shyam.alok@example.com</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-2 rounded-lg text-muted-foreground"><Phone size={16} /></div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                                                <p className="text-sm font-semibold">+91 98765 43210</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-card border rounded-3xl p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold">Recent Activity</h3>
                                    <Button variant="ghost" size="sm" className="text-xs text-accent">View All</Button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">EMI Payment Successful</p>
                                                <p className="text-xs text-muted-foreground">MacBook Air M2 • Oct 28</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">-₹4,500</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">New Purchase</p>
                                                <p className="text-xs text-muted-foreground">iStore Electronics • Oct 24</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">₹45,000</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'verification' && (
                        <motion.div
                            key="verification"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <h2 className="text-3xl font-bold tracking-tight mb-6">KYC & Verification</h2>

                            <div className="bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900 rounded-3xl p-6 flex items-start gap-4 mb-8">
                                <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full text-green-600 dark:text-green-400 mt-1">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-green-800 dark:text-green-300 text-lg">Fully Verified Profile</h3>
                                    <p className="text-green-700 dark:text-green-400/80 text-sm mt-1">Your identity and credit profile are fully verified. You are eligible for instant 0% EMI financing up to ₹85,000.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border rounded-2xl p-5 flex items-center justify-between bg-card">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-secondary p-3 rounded-xl"><User size={20} className="text-foreground" /></div>
                                        <div>
                                            <h4 className="font-semibold">PAN Card</h4>
                                            <p className="text-xs text-muted-foreground">Verified on Oct 2023</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="text-green-500" size={20} />
                                </div>
                                <div className="border rounded-2xl p-5 flex items-center justify-between bg-card">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-secondary p-3 rounded-xl"><MapPin size={20} className="text-foreground" /></div>
                                        <div>
                                            <h4 className="font-semibold">Aadhaar / Address</h4>
                                            <p className="text-xs text-muted-foreground">Verified on Oct 2023</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="text-green-500" size={20} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'orders' && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <h2 className="text-3xl font-bold tracking-tight mb-6">My Orders & EMIs</h2>

                            <div className="space-y-4">
                                {mockOrders.map((order, idx) => (
                                    <div key={idx} className="bg-card border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold px-2 py-1 bg-secondary rounded-md">{order.id}</span>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${order.status === 'Active EMI' ? 'bg-accent/10 text-accent' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Purchased on {order.date}</p>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <p className="text-xs text-muted-foreground">Order Total</p>
                                                <p className="font-black text-lg">{order.total}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                                                    <Package className="text-muted-foreground" size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm md:text-base">{order.product}</h4>
                                                    <p className="text-xs text-muted-foreground bg-secondary/50 inline-block px-2 py-0.5 rounded-full mt-1">Sold by {order.shop}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground font-medium">EMI Amount</p>
                                                <p className="font-bold text-accent">{order.emi}</p>
                                            </div>
                                        </div>

                                        {order.status === 'Active EMI' && (
                                            <div className="mt-6 pt-4 border-t flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1 w-full max-w-sm">
                                                    <div className="flex justify-between text-xs mb-1 font-medium">
                                                        <span className="text-foreground">1 of 10 Paid</span>
                                                        <span className="text-muted-foreground">9 Months left</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                                        <div className="h-full bg-accent w-[10%] rounded-full" />
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" className="rounded-full shadow-sm text-xs font-semibold hover:bg-accent hover:text-white border-accent/20">Pay Next Installment</Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}
