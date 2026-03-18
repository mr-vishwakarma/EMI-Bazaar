import React, { useState, useEffect } from 'react';
import {
    Users, Store, IndianRupee, TrendingUp, AlertTriangle, Shield, CheckCircle2,
    XCircle, Box, Activity, CreditCard, LayoutDashboard, Settings, MapPin,
    Bell, Star, UploadCloud, Search, Check, ShieldAlert, Clock, Mail, Building,
    Eye, ChevronDown, ChevronUp, FileText, User, Banknote, Phone, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('analytics');

    // Live vendor applications from Supabase
    const [vendorList, setVendorList] = useState<any[]>([]);
    const [vendorLoading, setVendorLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'incomplete'>('all');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalVendors, setTotalVendors] = useState(0);
    const PAGE_SIZE = 10;
    
    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Reset pagination when status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    const fetchVendors = async () => {
        setVendorLoading(true);
        const { data, error } = await supabase.rpc('get_admin_vendors', {
            search_query: debouncedSearch,
            status_filter: statusFilter,
            page_number: currentPage,
            page_size: PAGE_SIZE
        });

        setVendorLoading(false);
        if (error) {
            toast.error('Failed to load vendors: ' + error.message);
        } else {
            setVendorList(data || []);
            setTotalVendors(data?.[0]?.total_count || 0);
        }
    };

    useEffect(() => {
        if (activeTab === 'vendors') fetchVendors();
    }, [activeTab, debouncedSearch, statusFilter, currentPage]);

    const handleApprove = async (userId: string) => {
        const { error } = await supabase
            .from('users')
            .update({ approval_status: 'approved' })
            .eq('id', userId);
        if (error) {
            toast.error('Failed to approve: ' + error.message);
        } else {
            toast.success('Vendor approved! They can now access their dashboard.');
            fetchVendors(); // Refresh list
        }
    };

    const handleDecline = async (userId: string) => {
        const { error } = await supabase
            .from('users')
            .update({ approval_status: 'rejected' })
            .eq('id', userId);
        if (error) {
            toast.error('Failed to decline: ' + error.message);
        } else {
            toast.success('Vendor application declined.');
            fetchVendors();
        }
    };

    const handleSuspend = async (userId: string) => {
        const { error } = await supabase
            .from('users')
            .update({ approval_status: 'suspended' })
            .eq('id', userId);
        if (error) {
            toast.error('Failed to suspend: ' + error.message);
        } else {
            toast.success('Vendor account suspended.');
            fetchVendors();
        }
    };

    const handleMarkReviewed = async (vendorProfileId: string) => {
        const { error } = await supabase
            .from('vendor_profiles')
            .update({ reviewed_at: new Date().toISOString() })
            .eq('id', vendorProfileId);
        if (error) {
            toast.error('Failed to mark reviewed: ' + error.message);
        } else {
            toast.success('Marked as reviewed.');
            fetchVendors();
        }
    };

    const sidebarTabs = [
        { id: 'analytics', icon: LayoutDashboard, label: 'Analytics Console' },
        { id: 'vendors', icon: Store, label: 'Vendor Management' },
        { id: 'products', icon: Box, label: 'Product Monitoring' },
        { id: 'emi', icon: Activity, label: 'EMI & Fraud Tracker' },
        { id: 'payments', icon: CreditCard, label: 'Payment Gateway' },
        { id: 'platform', icon: Settings, label: 'Platform Settings' },
    ];

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Sidebar - Desktop */}
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden md:flex flex-col w-72 bg-card border-r border-border/60 p-5 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
            >
                <div className="flex items-center gap-3 px-3 mb-8">
                    <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight uppercase tracking-widest text-rose-500">Root Admin</h2>
                        <span className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                            System Access Granted
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                    {sidebarTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold text-left transition-all duration-300 relative overflow-hidden group hover:bg-secondary/80",
                                activeTab === tab.id ? "text-rose-500" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeAdminTab"
                                    className="absolute inset-0 bg-rose-500/10 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                            )}
                            <tab.icon size={20} className={activeTab === tab.id ? "stroke-[2.5]" : "opacity-80"} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto w-full bg-secondary/20 p-4 md:p-8 lg:p-10 pb-24 md:pb-8">
                <AnimatePresence mode="wait">

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
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
                                    { label: 'Total active shops', value: '1,492', icon: Store, bg: 'bg-blue-500/10', color: 'text-blue-500' },
                                    { label: 'Total verified customers', value: '42.5k', icon: Users, bg: 'bg-accent/10', color: 'text-accent' },
                                    { label: 'EMI Loans Disbursed', value: '28.4k', icon: Activity, bg: 'bg-purple-500/10', color: 'text-purple-500' },
                                    { label: 'Monthly Revenue (GMV)', value: '₹14.2 Cr', icon: IndianRupee, bg: 'bg-green-500/10', color: 'text-green-500' }
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
                    )}

                    {/* Vendor Management */}
                    {activeTab === 'vendors' && (
                        <motion.div key="vendors" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">

                            {/* Header */}
                            <div className="bg-card rounded-[2rem] border shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-black">Vendor Management</h1>
                                    <p className="text-muted-foreground text-sm">Review applications, preview full profiles, and manage store access.</p>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full bg-secondary/50 border rounded-full pl-9 pr-4 py-2 outline-none text-sm"
                                            placeholder="Search name or email..."
                                        />
                                    </div>
                                    <Button onClick={fetchVendors} variant="outline" className="rounded-xl font-bold shrink-0">Refresh</Button>
                                </div>
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { key: 'all',        label: 'All',       color: 'bg-secondary text-foreground' },
                                    { key: 'pending',    label: '⏳ Pending',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' },
                                    { key: 'approved',   label: '✅ Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30' },
                                    { key: 'suspended',  label: '🔒 Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
                                    { key: 'rejected',   label: '❌ Declined', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
                                    { key: 'incomplete', label: '📝 Incomplete', color: 'bg-secondary text-muted-foreground' },
                                ].map(f => {
                                    return (
                                        <button
                                            key={f.key}
                                            onClick={() => setStatusFilter(f.key as any)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                                                statusFilter === f.key
                                                    ? f.color + ' border-current shadow-sm'
                                                    : 'border-transparent bg-secondary text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Vendor List */}
                            <div className="space-y-3">
                                {vendorLoading ? (
                                    <div className="bg-card rounded-[2rem] border p-16 flex items-center justify-center gap-3 text-muted-foreground">
                                        <div className="w-6 h-6 border-2 border-border border-t-rose-500 rounded-full animate-spin" />
                                        Loading vendor applications...
                                    </div>
                                ) : vendorList.length === 0 ? (
                                    <div className="bg-card rounded-[2rem] border text-center py-16 text-muted-foreground">
                                        <Store size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">No vendor applications yet</p>
                                        <p className="text-sm">Submitted applications will appear here.</p>
                                    </div>
                                ) : (
                                    vendorList
                                        .map((vendor) => {
                                            const status = vendor.approval_status || 'incomplete';
                                            const userEmail = vendor.email || 'N/A';
                                            const userId = vendor.user_id;

                                            const isExpanded = expandedVendorId === userId;

                                            const statusConfig: Record<string, { label: string, color: string, dot: string }> = {
                                                pending:    { label: 'Pending Review', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
                                                approved:   { label: 'Approved',       color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   dot: 'bg-green-500' },
                                                suspended:  { label: 'Suspended',      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
                                                rejected:   { label: 'Declined',       color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
                                                incomplete: { label: 'Incomplete',     color: 'bg-secondary text-muted-foreground',                                       dot: 'bg-gray-400' },
                                            };
                                            const cfg = statusConfig[status] || statusConfig.incomplete;

                                            return (
                                                <div key={userId} className="bg-card border rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">

                                                    {/* ── Summary Row ─────────────────────────────── */}
                                                    <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shrink-0 relative">
                                                                <Store size={22} className="text-muted-foreground" />
                                                                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${cfg.dot}`} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-base truncate">{vendor.business_name || 'Unnamed Store'}</p>
                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10} />{userEmail}</span>
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Tag size={10} />{vendor.category || 'No category'}</span>
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} />{vendor.submitted_at ? new Date(vendor.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                                                            <span className={`px-3 py-1 font-bold text-xs rounded-lg ${cfg.color}`}>{cfg.label}</span>

                                                            {/* Preview Toggle */}
                                                            <button
                                                                onClick={() => setExpandedVendorId(isExpanded ? null : userId)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-bold transition-colors"
                                                            >
                                                                <Eye size={13} /> {isExpanded ? 'Hide' : 'Preview'}
                                                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                            </button>

                                                            {(status === 'pending' || status === 'incomplete') && (
                                                                <>
                                                                    <Button size="sm" onClick={() => handleApprove(userId)} className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold h-8">
                                                                        <Check size={13} className="mr-1" /> Approve
                                                                    </Button>
                                                                    <Button size="sm" onClick={() => handleDecline(userId)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl font-bold h-8">
                                                                        <XCircle size={13} className="mr-1" /> Decline
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {status === 'approved' && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black text-green-600 bg-green-500/10 px-2 py-1 rounded-lg uppercase tracking-widest border border-green-500/20 flex items-center gap-1">
                                                                        <CheckCircle2 size={10} /> Active
                                                                    </span>
                                                                    <Button size="sm" onClick={() => handleSuspend(userId)} variant="link" className="text-red-500 h-8 text-xs p-0 px-2">
                                                                        Suspend Access
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ── Expandable Full Profile Detail ──────────── */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                key="detail"
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                                className="overflow-hidden border-t border-dashed"
                                                            >
                                                                <div className="p-6 space-y-6 bg-secondary/20">

                                                                    {/* Business Info */}
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><Store size={13} /> Business Information</p>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                            {[
                                                                                { label: 'Shop Name',  value: vendor.business_name },
                                                                                { label: 'Category',   value: vendor.category },
                                                                                { label: 'GSTIN',      value: vendor.gstin },
                                                                                { label: 'Address',    value: vendor.address, wide: true },
                                                                            ].map((f, i) => (
                                                                                <div key={i} className={`bg-background rounded-xl p-3 border ${f.wide ? 'sm:col-span-2' : ''}`}>
                                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{f.label}</p>
                                                                                    <p className="text-sm font-semibold break-all">{f.value || <span className="text-muted-foreground italic">Not provided</span>}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* KYC Info */}
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><User size={13} /> KYC & Identity</p>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                            {[
                                                                                { label: 'PAN Number',    value: vendor.pan },
                                                                                { label: 'Aadhaar',       value: vendor.aadhaar ? vendor.aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') : null },
                                                                            ].map((f, i) => (
                                                                                <div key={i} className="bg-background rounded-xl p-3 border">
                                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{f.label}</p>
                                                                                    <p className="text-sm font-semibold font-mono">{f.value || <span className="text-muted-foreground italic">Not provided</span>}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Bank Info */}
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><Banknote size={13} /> Bank & Settlement</p>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                            {[
                                                                                { label: 'Account Number', value: vendor.account_no ? '****' + vendor.account_no.slice(-4) : null },
                                                                                { label: 'IFSC Code',      value: vendor.ifsc },
                                                                            ].map((f, i) => (
                                                                                <div key={i} className="bg-background rounded-xl p-3 border">
                                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{f.label}</p>
                                                                                    <p className="text-sm font-semibold font-mono">{f.value || <span className="text-muted-foreground italic">Not provided</span>}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Documents */}
                                                                    <div>
                                                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><FileText size={13} /> Uploaded Documents</p>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                            {(vendor.document_urls?.length > 0 ? vendor.document_urls : []).map((doc: any, i: number) => (
                                                                                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                                                                                   className="bg-background rounded-xl p-3 border flex items-center gap-3 hover:border-blue-500 transition-colors group">
                                                                                    <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                                                                                        <FileText size={16} className="text-blue-500" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs font-bold capitalize">{doc.type?.replace(/_/g, ' ')}</p>
                                                                                        <p className="text-[10px] text-blue-500 group-hover:underline">Click to view →</p>
                                                                                    </div>
                                                                                </a>
                                                                            ))}
                                                                            {(!vendor.document_urls || vendor.document_urls.length === 0) && (
                                                                                <>
                                                                                    {['GST Certificate / Trade License', 'Cancelled Cheque'].map((docName, i) => (
                                                                                        <div key={i} className="bg-background rounded-xl p-3 border border-dashed flex items-center gap-3 opacity-50">
                                                                                            <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                                                                                                <UploadCloud size={16} className="text-muted-foreground" />
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-xs font-bold">{docName}</p>
                                                                                                <p className="text-[10px] text-muted-foreground">Not uploaded yet</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Action Bar — always visible in expanded detail */}
                                                                    <div className="pt-3 border-t border-border space-y-3">
                                                                        {/* Reviewed Status */}
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            {vendor.reviewed_at ? (
                                                                                <span className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg font-bold">
                                                                                    <Check size={12} /> Reviewed on {new Date(vendor.reviewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground italic">Not yet reviewed</span>
                                                                            )}
                                                                            {!vendor.reviewed_at && (
                                                                                <button
                                                                                    onClick={() => handleMarkReviewed(vendor.id)}
                                                                                    className="ml-auto px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 text-xs font-bold transition-colors flex items-center gap-1.5"
                                                                                >
                                                                                    <CheckCircle2 size={12} /> Mark as Reviewed
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        {/* Main Action Buttons */}
                                                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                                                            <p className="text-xs text-muted-foreground mr-auto">
                                                                                {status === 'pending' ? 'Take action after reviewing profile details.' : `Current status: ${cfg.label}`}
                                                                            </p>
                                                                            {status === 'pending' && (
                                                                                <>
                                                                                    <Button size="sm" onClick={() => handleDecline(userId)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl font-bold">
                                                                                        <XCircle size={14} className="mr-1" /> Decline
                                                                                    </Button>
                                                                                    <Button size="sm" onClick={() => handleApprove(userId)} className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold">
                                                                                        <Check size={14} className="mr-1" /> Approve & Activate
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                            {status === 'approved' && (
                                                                                <Button size="sm" onClick={() => handleSuspend(userId)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl font-bold">
                                                                                    Suspend Vendor
                                                                                </Button>
                                                                            )}
                                                                            {status === 'suspended' && (
                                                                                <Button size="sm" onClick={() => handleApprove(userId)} className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold">
                                                                                    <Check size={14} className="mr-1" /> Reinstate Vendor
                                                                                </Button>
                                                                            )}
                                                                            {status === 'rejected' && (
                                                                                <Button size="sm" onClick={() => handleApprove(userId)} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-xl font-bold">
                                                                                    Approve Anyway
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                            
                            {/* Pagination Controls */}
                            {totalVendors > PAGE_SIZE && (
                                <div className="flex items-center justify-between border-t border-border pt-4 mt-4 text-sm font-bold">
                                    <div className="text-muted-foreground">
                                        Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, totalVendors)} of {totalVendors}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="rounded-xl px-4"
                                        >
                                            Previous
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setCurrentPage(p => p + 1)}
                                            disabled={currentPage * PAGE_SIZE >= totalVendors}
                                            className="rounded-xl px-4"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Product Monitoring */}
                    {activeTab === 'products' && (
                        <motion.div key="products" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
                            <div className="p-8 border-b bg-secondary/20">
                                <h1 className="text-2xl font-black">Global Product Monitoring</h1>
                                <p className="text-muted-foreground">Review flagged fake listings and approve new mass categories.</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl">
                                    <h3 className="font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Reported / Fake Listings (Needs Action)</h3>
                                    <div className="bg-background border rounded-xl p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-lg">"Apple iPfone 15 Pro Max - 100% Genguin"</p>
                                            <p className="text-xs text-muted-foreground">Listed by Shady Mobiles • Flagged by 14 users</p>
                                        </div>
                                        <Button variant="destructive" className="rounded-xl font-bold">Remove Listing</Button>
                                    </div>
                                </div>
                                <div className="border border-border p-6 rounded-2xl">
                                    <h3 className="font-bold mb-4">Pending Category Approvals</h3>
                                    <div className="flex gap-2">
                                        <span className="bg-secondary px-4 py-2 rounded-xl border flex items-center gap-2 font-medium">Auto Parts <Button size="icon" variant="ghost" className="w-6 h-6 ml-2 rounded-full"><Check size={14} /></Button></span>
                                        <span className="bg-secondary px-4 py-2 rounded-xl border flex items-center gap-2 font-medium">Jewelry <Button size="icon" variant="ghost" className="w-6 h-6 ml-2 rounded-full"><Check size={14} /></Button></span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* EMI / Risk Manager */}
                    {activeTab === 'emi' && (
                        <motion.div key="emi" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
                            <div className="p-8 border-b bg-secondary/20">
                                <h1 className="text-2xl font-black">EMI Risk & Fraud Engine</h1>
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
                    )}

                    {/* Payment Gateway */}
                    {activeTab === 'payments' && (
                        <motion.div key="payments" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
                            <div className="p-8 border-b bg-secondary/20">
                                <h1 className="text-2xl font-black">Master Ledger & Gateway</h1>
                                <p className="text-muted-foreground">Live transaction feed and refund processing unit.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-muted-foreground text-xs uppercase tracking-widest border-b border-border/60 font-bold">
                                            <th className="p-6">Txn ID / Gateway</th>
                                            <th className="p-6">Amount</th>
                                            <th className="p-6">Status</th>
                                            <th className="p-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { id: 'TXN-9092839', amount: '₹14,990', type: 'UPI AutoPay (PhonePe)', status: 'Success' },
                                            { id: 'TXN-9092838', amount: '₹4,500', type: 'HDFC e-Mandate', status: 'Failed' },
                                            { id: 'TXN-9092837', amount: '₹89,900', type: 'Credit Card', status: 'Refund Req' },
                                        ].map((txn, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-secondary/30">
                                                <td className="p-6">
                                                    <p className="font-bold">{txn.id}</p>
                                                    <p className="text-xs text-muted-foreground">{txn.type}</p>
                                                </td>
                                                <td className="p-6 font-black text-lg">{txn.amount}</td>
                                                <td className="p-6">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${txn.status === 'Success' ? 'bg-green-100 text-green-700' :
                                                        txn.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>{txn.status}</span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    {txn.status === 'Refund Req' ? (
                                                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-200">Process Refund</Button>
                                                    ) : (
                                                        <button className="text-accent text-xs font-bold hover:underline">View Log</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Platform Features / Settings */}
                    {activeTab === 'platform' && (
                        <motion.div key="platform" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm max-w-4xl mx-auto">
                            <div className="p-8 border-b bg-secondary/20">
                                <h1 className="text-2xl font-black">Platform Global Toggles</h1>
                                <p className="text-muted-foreground">Manage system-level services, geolocations, and notifications.</p>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-secondary rounded-xl text-foreground"><Shield size={24} /></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">Global Security </h3>
                                        <p className="text-xs text-muted-foreground mb-4">OTP Auth, HTTPS gateways, and AI Fraud flagging logic.</p>
                                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-200 dark:border-green-900">
                                            <span className="text-xs font-bold text-green-700">Strict Auth Mode</span>
                                            <div className="w-10 h-5 bg-green-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-secondary rounded-xl text-foreground"><MapPin size={24} /></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">Location Services</h3>
                                        <p className="text-xs text-muted-foreground mb-4">Calculations for "Nearby Shops", distance bounding, Maps API.</p>
                                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-200 dark:border-green-900">
                                            <span className="text-xs font-bold text-green-700">Google Maps API Linked</span>
                                            <div className="w-10 h-5 bg-green-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-secondary rounded-xl text-foreground"><Star size={24} /></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">Reviews System</h3>
                                        <p className="text-xs text-muted-foreground mb-4">Aggregating Shop ratings and Product feedback.</p>
                                        <Button variant="outline" size="sm" className="w-full text-xs h-8">Moderate Reviews</Button>
                                    </div>
                                </div>

                                <div className="border p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-secondary rounded-xl text-foreground"><Bell size={24} /></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">Notification Engine</h3>
                                        <p className="text-xs text-muted-foreground mb-3">SMS alerts, AutoPay push reminders, and Email receipts.</p>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] font-bold px-2 py-1 bg-secondary rounded uppercase">SMS Configured</span>
                                            <span className="text-[10px] font-bold px-2 py-1 bg-secondary rounded uppercase">Email Setup</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 px-2 py-3 flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                {sidebarTabs.slice(0, 5).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full gap-1 p-2 ${activeTab === tab.id ? "text-rose-500" : "text-muted-foreground"
                            }`}
                    >
                        <tab.icon size={20} className={activeTab === tab.id ? "stroke-[2.5]" : "opacity-80"} />
                        <span className="text-[10px] font-bold leading-none select-none tooltip">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
