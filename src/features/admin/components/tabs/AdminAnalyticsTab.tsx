import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Users, Activity, IndianRupee, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'sonner';

export default function AdminAnalyticsTab() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const { data: analytics, error } = await supabase.rpc('get_admin_analytics');
            if (error) throw error;
            setData(analytics);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to load admin analytics: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${val.toLocaleString('en-IN')}`;
    };

    const stats = [
        { label: 'Total active shops',       value: data?.totalVendors || 0,        icon: Store,        bg: 'bg-blue-500/10',   color: 'text-blue-500' },
        { label: 'Total verified customers', value: data?.totalCustomers || 0,      icon: Users,        bg: 'bg-accent/10',     color: 'text-accent' },
        { label: 'EMI Loans Disbursed',      value: data?.totalContracts || 0,      icon: Activity,     bg: 'bg-purple-500/10', color: 'text-purple-500' },
        { label: 'Total Platform GMV',       value: formatCurrency(data?.totalGMV || 0), icon: IndianRupee, bg: 'bg-green-500/10',  color: 'text-green-500' }
    ];

    return (
        <motion.div key="analytics" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">System Master Dashboard</h1>
                    <p className="text-muted-foreground font-medium">Real-time overview of total platform activity and economy.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchAnalytics} className="rounded-xl border-2 font-bold py-1.5 h-10 px-4 group">
                        <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        Sync
                    </Button>
                    <Button className="bg-foreground text-background font-bold tracking-widest uppercase rounded-xl h-10 px-6">Export Report</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-card border p-6 rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute -bottom-6 -right-6 text-foreground/[0.10] transition-all group-hover:scale-110 group-hover:-rotate-3 duration-700 pointer-events-none">
                            <stat.icon size={120} strokeWidth={1} />
                        </div>
                        <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${stat.bg}`}>
                            <stat.icon size={24} className={stat.color} />
                        </div>
                        <h2 className={`text-3xl font-black mb-1 relative z-10 ${loading ? 'opacity-20 transition-opacity' : 'opacity-100'}`}>
                            {loading ? '---' : stat.value}
                        </h2>
                        <p className="text-sm font-bold text-muted-foreground relative z-10">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card border rounded-[2rem] p-8 h-80 flex flex-col items-center justify-center shadow-sm">
                    <TrendingUp size={48} className="text-muted-foreground/30 mb-4" />
                    <h3 className="font-bold text-muted-foreground">Global Growth Chart Placeholder</h3>
                    <p className="text-xs text-muted-foreground/60 mt-1">Cross-vendor performance analytics coming soon.</p>
                </div>
                <div className="bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 rounded-[2rem] p-6 shadow-sm flex flex-col">
                    <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-4">
                        <AlertTriangle size={18} /> Critical Alerts ({loading ? "..." : (data?.activeContracts > 10 ? "!!!" : "3")})
                    </h3>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 text-foreground">
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
