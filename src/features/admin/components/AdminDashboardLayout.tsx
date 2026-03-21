import React, { useState, useEffect } from 'react';
import { Store, Box, Activity, CreditCard, LayoutDashboard, Settings, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

// Feature tabs
import AdminAnalyticsTab from './tabs/AdminAnalyticsTab';
import AdminVendorsTab from './tabs/AdminVendorsTab';
import AdminProductsTab from './tabs/AdminProductsTab';
import AdminEmiTab from './tabs/AdminEmiTab';
import AdminPaymentsTab from './tabs/AdminPaymentsTab';
import AdminPlatformTab from './tabs/AdminPlatformTab';

const PAGE_SIZE = 10;

const SIDEBAR_TABS = [
    { id: 'analytics', icon: LayoutDashboard, label: 'Analytics Console'  },
    { id: 'vendors',   icon: Store,           label: 'Vendor Management'  },
    { id: 'products',  icon: Box,             label: 'Product Monitoring' },
    { id: 'emi',       icon: Activity,        label: 'EMI & Fraud Tracker'},
    { id: 'payments',  icon: CreditCard,      label: 'Payment Gateway'    },
    { id: 'platform',  icon: Settings,        label: 'Platform Settings'  },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('analytics');

    // ─── Vendor Management State ─────────────────────────────────
    const [vendorList,        setVendorList]        = useState<any[]>([]);
    const [vendorLoading,     setVendorLoading]     = useState(false);
    const [searchQuery,       setSearchQuery]       = useState('');
    const [debouncedSearch,   setDebouncedSearch]   = useState('');
    const [expandedVendorId,  setExpandedVendorId]  = useState<string | null>(null);
    const [statusFilter,      setStatusFilter]      = useState<'all' | 'pending' | 'approved' | 'rejected' | 'incomplete' | 'suspended'>('all');
    const [currentPage,       setCurrentPage]       = useState(1);
    const [totalVendors,      setTotalVendors]      = useState(0);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedSearch(searchQuery); setCurrentPage(1); }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Reset page when filter changes
    useEffect(() => { setCurrentPage(1); }, [statusFilter]);

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

    // ─── Vendor Action Handlers ──────────────────────────────────
    const handleApprove = async (userId: string) => {
        const { error } = await supabase.from('users').update({ approval_status: 'approved' }).eq('id', userId);
        if (error) { toast.error('Failed to approve: ' + error.message); }
        else { 
            await supabase.from('notifications').insert({
                user_id: userId,
                title: 'Application Approved! 🎉',
                content: 'Welcome to EMI Bazaar! Your vendor account is now active. You can start adding products and managing your shop.',
                type: 'approval'
            });
            toast.success('Vendor approved! They can now access their dashboard.'); 
            fetchVendors(); 
        }
    };

    const handleDecline = async (userId: string, reason?: string) => {
        const { error: uError } = await supabase.from('users').update({ approval_status: 'rejected' }).eq('id', userId);
        if (uError) { 
            toast.error('Failed to decline: ' + uError.message); 
            return;
        }

        if (reason) {
            await supabase.from('vendor_profiles').update({ rejection_reason: reason }).eq('user_id', userId);
        }

        await supabase.from('notifications').insert({
            user_id: userId,
            title: 'Application Declined',
            content: `Your vendor application was not approved. Reason: ${reason || 'Incomplete details'}. Please review and re-submit.`,
            type: 'approval'
        });

        toast.success('Vendor application declined.'); 
        fetchVendors();
    };

    const handleSuspend = async (userId: string) => {
        const { error } = await supabase.from('users').update({ approval_status: 'suspended' }).eq('id', userId);
        if (error) { toast.error('Failed to suspend: ' + error.message); }
        else { toast.success('Vendor account suspended.'); fetchVendors(); }
    };

    const handleMarkReviewed = async (vendorProfileId: string) => {
        const { error } = await supabase.from('vendor_profiles').update({ reviewed_at: new Date().toISOString() }).eq('id', vendorProfileId);
        if (error) { toast.error('Failed to mark reviewed: ' + error.message); }
        else { toast.success('Marked as reviewed.'); fetchVendors(); }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Desktop Sidebar */}
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
                        <span className="text-xs text-muted-foreground font-bold">System Access Granted</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                    {SIDEBAR_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold text-left transition-all duration-300 relative overflow-hidden hover:bg-secondary/80",
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

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto w-full bg-secondary/20 p-4 md:p-8 lg:p-10 pb-24 md:pb-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'analytics' && <AdminAnalyticsTab />}
                    {activeTab === 'vendors'   && (
                        <AdminVendorsTab
                            vendorList={vendorList}
                            vendorLoading={vendorLoading}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            expandedVendorId={expandedVendorId}
                            setExpandedVendorId={setExpandedVendorId}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            totalVendors={totalVendors}
                            PAGE_SIZE={PAGE_SIZE}
                            fetchVendors={fetchVendors}
                            handleApprove={handleApprove}
                            handleDecline={handleDecline}
                            handleSuspend={handleSuspend}
                            handleMarkReviewed={handleMarkReviewed}
                        />
                    )}
                    {activeTab === 'products' && <AdminProductsTab />}
                    {activeTab === 'emi'      && <AdminEmiTab />}
                    {activeTab === 'payments' && <AdminPaymentsTab />}
                    {activeTab === 'platform' && <AdminPlatformTab />}
                </AnimatePresence>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 px-2 py-3 flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                {SIDEBAR_TABS.slice(0, 5).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full gap-1 p-2 ${activeTab === tab.id ? "text-rose-500" : "text-muted-foreground"}`}
                    >
                        <tab.icon size={20} className={activeTab === tab.id ? "stroke-[2.5]" : "opacity-80"} />
                        <span className="text-[10px] font-bold leading-none select-none">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
