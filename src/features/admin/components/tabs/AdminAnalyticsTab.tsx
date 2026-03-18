import React from 'react';
import { motion } from 'framer-motion';
import { Store, Users, Activity, IndianRupee, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export default function AdminAnalyticsTab() {
    return (
        <motion.div key="analytics" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">System Master Dashboard</h1>
                    <p className="text-muted-foreground font-medium">Real-time overview of total platform activity and economy.</p>
                </div>
                <Button className="bg-foreground text-background font-bold tracking-widest uppercase rounded-xl">Export Report</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total active shops',       value: '1,492',  icon: Store,        bg: 'bg-blue-500/10',   color: 'text-blue-500' },
                    { label: 'Total verified customers', value: '42.5k',  icon: Users,        bg: 'bg-accent/10',     color: 'text-accent' },
                    { label: 'EMI Loans Disbursed',      value: '28.4k',  icon: Activity,     bg: 'bg-purple-500/10', color: 'text-purple-500' },
                    { label: 'Monthly Revenue (GMV)',    value: '₹14.2 Cr', icon: IndianRupee, bg: 'bg-green-500/10',  color: 'text-green-500' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-card border p-6 rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className={`absolute top-0 right-0 p-6 ${stat.bg}`}><stat.icon size={80} className={`opacity-20 ${stat.color}`} /></div>
                        <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${stat.bg}`}>
                            <stat.icon size={24} className={stat.color} />
                        </div>
                        <h2 className="text-3xl font-black mb-1 relative z-10">{stat.value}</h2>
                        <p className="text-sm font-bold text-muted-foreground relative z-10">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card border rounded-[2rem] p-8 h-80 flex flex-col items-center justify-center shadow-sm">
                    <TrendingUp size={48} className="text-muted-foreground/30 mb-4" />
                    <h3 className="font-bold text-muted-foreground">Global Growth Chart Placeholder</h3>
                </div>
                <div className="bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 rounded-[2rem] p-6 shadow-sm flex flex-col">
                    <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-4">
                        <AlertTriangle size={18} /> Critical Alerts (3)
                    </h3>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                        {[
                            'Gateway API timeout on Server C',
                            'Suspicious EMI burst from Store #590',
                            'Unusual stock wipeout on iPhone 15 SKU'
                        ].map((alert, i) => (
                            <div key={i} className="bg-background/80 p-3 rounded-xl border border-red-500/20 text-sm font-medium">
                                <div className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2" />{alert}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
