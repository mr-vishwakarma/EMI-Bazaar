import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert } from 'lucide-react';

export default function AdminEmiTab() {
    return (
        <motion.div key="emi" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
            <div className="p-8 border-b bg-secondary/20">
                <h1 className="text-2xl font-black">EMI Risk &amp; Fraud Engine</h1>
                <p className="text-muted-foreground">Monitor payment statuses and detect systemic loan frauds.</p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-2xl p-6 bg-gradient-to-br from-background to-secondary/30">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity className="text-accent" /> Active Loan Health</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1"><span>On-Time Re-payments</span><span className="text-green-500">94.2%</span></div>
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden"><div className="w-[94%] bg-green-500 h-full"></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1"><span>Late / Default Risk</span><span className="text-red-500">5.8%</span></div>
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden"><div className="w-[6%] bg-red-500 h-full"></div></div>
                        </div>
                    </div>
                </div>
                <div className="border border-red-200 dark:border-red-900 rounded-2xl p-6 bg-red-50 dark:bg-red-950/10">
                    <h3 className="font-bold text-lg mb-4 text-red-600 flex items-center gap-2"><ShieldAlert /> Fraud Detection Engine</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between bg-white dark:bg-black/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                            <span className="font-medium text-xs">Aadhaar mismatch during checkout</span>
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Blocked</span>
                        </div>
                        <div className="flex justify-between bg-white dark:bg-black/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                            <span className="font-medium text-xs">Velocity rule hit (5+ EMIs/day)</span>
                            <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Review</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
