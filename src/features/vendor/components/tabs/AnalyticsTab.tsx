import React from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, CreditCard, Users } from 'lucide-react';

export default function AnalyticsTab() {
    return (
        <motion.div key="analytics" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Business Analytics</h1>
                <p className="text-muted-foreground font-medium">Track your total sales and EMI conversion performance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 text-green-500/10"><IndianRupee size={80} /></div>
                    <p className="text-muted-foreground font-bold mb-2">Total Monthly Revenue</p>
                    <h2 className="text-4xl font-black mb-2 relative z-10">₹8,45,000</h2>
                    <p className="text-sm font-bold text-green-500 flex items-center gap-1"><TrendingUp size={16} /> +14.5% from last month</p>
                </div>
                <div className="bg-card border p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 text-accent/10"><CreditCard size={80} /></div>
                    <p className="text-muted-foreground font-bold mb-2">EMI Conversions</p>
                    <h2 className="text-4xl font-black mb-2 relative z-10">142</h2>
                    <p className="text-sm font-bold text-accent flex items-center gap-1 mt-1">Orders processed via EMI</p>
                </div>
                <div className="bg-card border p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 text-blue-500/10"><Users size={80} /></div>
                    <p className="text-muted-foreground font-bold mb-2">Walk-in Customers</p>
                    <h2 className="text-4xl font-black mb-2 relative z-10">86</h2>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Unique store visitors this week</p>
                </div>
            </div>

            <div className="bg-card border rounded-[2rem] p-8 shadow-sm h-96 flex flex-col items-center justify-center">
                <TrendingUp size={48} className="text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold text-muted-foreground">Revenue Chart Placeholder</h3>
                <p className="text-sm text-muted-foreground/80">Detailed graphical analytics will appear here.</p>
            </div>
        </motion.div>
    );
}
