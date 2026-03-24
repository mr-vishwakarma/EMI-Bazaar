import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, TrendingUp, CreditCard, Users, PieChart as PieIcon, LineChart as LineIcon, BarChart as BarIcon, RefreshCw, AlertCircle, Package, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import { Button } from '../../../../components/ui/button';
import { StatCardSkeleton, Skeleton } from '../../../../components/ui/skeleton';
import { toast } from 'sonner';

const CATEGORY_COLORS = ['#FF6B3D', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export default function AnalyticsTab() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeChart, setActiveChart] = useState<'area' | 'bar'>('area');
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [recentContracts, setRecentContracts] = useState<any[]>([]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: analytics, error } = await supabase.rpc('get_vendor_analytics', {
                p_vendor_id: user.id
            });

            if (error) throw error;
            setData(analytics);

            // Fetch top selling categories
            const { data: shops } = await supabase.from('shops').select('id').eq('vendor_id', user.id);
            const shopIds = shops?.map((s: any) => s.id) || [];

            if (shopIds.length > 0) {
                const { data: contracts } = await supabase
                    .from('emi_contracts')
                    .select('product_id, product_price, products(name, category_id, categories(name))')
                    .in('shop_id', shopIds)
                    .order('created_at', { ascending: false });

                // Aggregate categories
                const catMap: Record<string, { name: string; count: number; revenue: number }> = {};
                contracts?.forEach((c: any) => {
                    const catName = c.products?.categories?.name || 'Uncategorized';
                    if (!catMap[catName]) catMap[catName] = { name: catName, count: 0, revenue: 0 };
                    catMap[catName].count += 1;
                    catMap[catName].revenue += Number(c.product_price || 0);
                });
                const sorted = Object.values(catMap).sort((a, b) => b.count - a.count).slice(0, 6);
                setCategoryData(sorted);

                // Fetch recent contracts
                const { data: recent } = await supabase
                    .from('emi_contracts')
                    .select('short_id, emi_amount, status, created_at, customer_id, products(name), customer:customer_profiles!customer_id(full_name)')
                    .in('shop_id', shopIds)
                    .order('created_at', { ascending: false })
                    .limit(5);
                setRecentContracts(recent || []);
            }
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to load analytics: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading && !data) {
        return (
            <div className="space-y-8 pb-10">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-12 w-40 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <Skeleton className="xl:col-span-2 h-[500px] rounded-[3rem]" />
                    <Skeleton className="h-[500px] rounded-[3rem]" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const stats = [
        { 
            label: 'Total Revenue', 
            value: `₹${Number(data.totalRevenue).toLocaleString('en-IN')}`, 
            icon: IndianRupee, 
            color: 'green',
            desc: 'Gross value of all contracts created'
        },
        { 
            label: 'EMI Collections', 
            value: `₹${Number(data.totalCollected).toLocaleString('en-IN')}`, 
            icon: LineIcon, 
            color: 'accent',
            desc: 'Total cash received via repayments'
        },
        { 
            label: 'Active Customers', 
            value: data.totalCustomers, 
            icon: Users, 
            color: 'blue',
            desc: 'Unique buyers with EMI accounts'
        },
        { 
            label: 'Active Contracts', 
            value: data.activeContracts, 
            icon: CreditCard, 
            color: 'orange',
            desc: 'Current ongoing loan agreements'
        }
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 backdrop-blur-md border rounded-2xl p-4 shadow-xl ring-1 ring-black/5">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                    <p className="text-lg font-black text-accent">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
                </div>
            );
        }
        return null;
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-accent/10 text-accent border-accent/20';
            case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'defaulted': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-secondary text-muted-foreground border-border';
        }
    };

    return (
        <motion.div key="analytics" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-2 sm:gap-3">
                        Business <span className="text-accent">Pulse</span>
                    </h1>
                    <p className="text-sm sm:text-lg text-muted-foreground font-medium">Real-time performance metrics.</p>
                </div>
                <Button onClick={fetchAnalytics} variant="outline" className="rounded-2xl h-12 bg-card border-2 font-bold gap-2 px-6 shadow-sm hover:bg-secondary">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    Refresh Analytics
                </Button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-card border p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-accent/5 transition-all duration-500"
                    >
                        <div className="absolute -bottom-6 -right-6 text-foreground/[0.10] transition-all group-hover:scale-110 group-hover:-rotate-3 duration-700 pointer-events-none">
                            <s.icon size={120} strokeWidth={1.5} />
                        </div>
                        <p className="text-muted-foreground font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 sm:mb-3">{s.label}</p>
                        <h2 className="text-2xl sm:text-3xl font-black mb-2 sm:mb-3 relative z-10 tracking-tight">{s.value}</h2>
                        <p className="text-xs font-bold text-muted-foreground/60 leading-relaxed max-w-[140px]">{s.desc}</p>
                        <div className={`absolute bottom-0 left-0 h-1.5 w-full bg-${s.color === 'accent' ? 'accent' : s.color + '-500'}/10`} />
                    </motion.div>
                ))}
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Revenue Timeline */}
                <div className="xl:col-span-2 bg-card border rounded-[1.5rem] sm:rounded-[3rem] p-5 sm:p-10 shadow-sm relative">
                    <div className="flex justify-between items-center mb-6 sm:mb-10">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 sm:p-3 bg-accent/10 rounded-xl sm:rounded-2xl text-accent">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Revenue Growth</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Monthly breakdown.</p>
                            </div>
                        </div>
                        <div className="flex bg-secondary p-1 rounded-xl">
                            <button onClick={() => setActiveChart('area')} className={`p-2 rounded-lg transition-all ${activeChart === 'area' ? 'bg-card text-accent shadow-sm' : 'text-muted-foreground'}`}><LineIcon size={18} /></button>
                            <button onClick={() => setActiveChart('bar')} className={`p-2 rounded-lg transition-all ${activeChart === 'bar' ? 'bg-card text-accent shadow-sm' : 'text-muted-foreground'}`}><BarIcon size={18} /></button>
                        </div>
                    </div>

                    <div className="h-[250px] sm:h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {activeChart === 'area' ? (
                                <AreaChart data={data.salesData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF6B3D" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#FF6B3D" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} tickFormatter={(val) => `₹${val/1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" stroke="#FF6B3D" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" animationDuration={2000} />
                                </AreaChart>
                            ) : (
                                <BarChart data={data.salesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} tickFormatter={(val) => `₹${val/1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="#FF6B3D" radius={[10, 10, 0, 0]} animationDuration={1500} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Collections Breakdown */}
                <div className="bg-card border rounded-[1.5rem] sm:rounded-[3rem] p-5 sm:p-10 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-10">
                        <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl sm:rounded-2xl text-green-500">
                            <PieIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Contract Health</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Status distribution.</p>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[300px] relative">
                        {data.activeContracts === 0 && data.completedContracts === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-secondary/20 rounded-3xl border-2 border-dashed">
                                <AlertCircle size={40} className="text-muted-foreground/40 mb-3" />
                                <p className="text-muted-foreground font-bold">No active contracts to analyze.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Active', value: data.activeContracts },
                                            { name: 'Completed', value: data.completedContracts }
                                        ]}
                                        cx="50%" cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={10}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        <Cell fill="var(--accent)" />
                                        <Cell fill="#10b981" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        
                        {(data.activeContracts > 0 || data.completedContracts > 0) && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-4xl font-black tracking-tighter">{data.activeContracts + data.completedContracts}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Deals</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-6 border-t mt-4">
                        <div className="flex justify-between items-center bg-accent/5 p-4 rounded-2xl border border-accent/10">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-accent" />
                                <span className="font-bold text-sm">Active & Pending</span>
                            </div>
                            <span className="font-black text-lg">{data.activeContracts}</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-500/5 p-4 rounded-2xl border border-green-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="font-bold text-sm">Fully Completed</span>
                            </div>
                            <span className="font-black text-lg">{data.completedContracts}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── NEW: Top Selling Categories + Recent Contracts ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Top Selling Categories */}
                <div className="bg-card border rounded-[1.5rem] sm:rounded-[3rem] p-5 sm:p-10 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                        <div className="p-2 sm:p-3 bg-purple-500/10 rounded-xl sm:rounded-2xl text-purple-500">
                            <Package size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Top Categories</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Sales by product category.</p>
                        </div>
                    </div>

                    {categoryData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 bg-secondary/20 rounded-3xl border-2 border-dashed">
                            <AlertCircle size={36} className="text-muted-foreground/40 mb-3" />
                            <p className="text-muted-foreground font-bold">No category data yet.</p>
                        </div>
                    ) : (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 700}} width={100} />
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (active && payload?.length) {
                                                return (
                                                    <div className="bg-background/95 backdrop-blur-md border rounded-2xl p-4 shadow-xl ring-1 ring-black/5">
                                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].payload.name}</p>
                                                        <p className="text-lg font-black">{payload[0].value} contracts</p>
                                                        <p className="text-sm text-accent font-bold">₹{Number(payload[0].payload.revenue).toLocaleString('en-IN')}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[0, 10, 10, 0]} animationDuration={1500}>
                                        {categoryData.map((_: any, idx: number) => (
                                            <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Recent Contracts */}
                <div className="bg-card border rounded-[1.5rem] sm:rounded-[3rem] p-5 sm:p-10 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                        <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl sm:rounded-2xl text-blue-500">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Recent Contracts</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Latest 5 EMI agreements.</p>
                        </div>
                    </div>

                    {recentContracts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 bg-secondary/20 rounded-3xl border-2 border-dashed">
                            <AlertCircle size={36} className="text-muted-foreground/40 mb-3" />
                            <p className="text-muted-foreground font-bold">No contracts created yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentContracts.map((contract: any, idx: number) => (
                                <motion.div
                                    key={contract.short_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0 font-black text-sm">
                                        {(contract.customer?.full_name || 'C').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{contract.customer?.full_name || 'Customer'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{contract.products?.name || 'Product'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-sm">₹{Math.ceil(Number(contract.emi_amount)).toLocaleString('en-IN')}<span className="text-[10px] text-muted-foreground font-medium">/mo</span></p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(contract.status)}`}>
                                            {contract.status?.toUpperCase()}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Insight */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-accent shadow-inner backdrop-blur-md">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black mb-1">Business Collection Rate: <span className="text-accent">{Math.round((data.totalCollected / (data.totalRevenue || 1)) * 100)}%</span></h4>
                        <p className="text-slate-400 text-sm font-medium">Keep it above 80% to maintain a healthy store credit profile.</p>
                    </div>
                </div>
                <Button variant="accent" className="rounded-xl px-10 h-14 font-black text-lg shadow-xl shadow-accent/20">Expand Reports →</Button>
            </motion.div>
        </motion.div>
    );
}

