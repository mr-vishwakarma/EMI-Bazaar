import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Store, Search, Eye, ChevronDown, ChevronUp, Check, CheckCircle2,
    XCircle, Mail, Tag, Clock, User, Banknote, FileText, UploadCloud
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface AdminVendorsTabProps {
    vendorList: any[];
    vendorLoading: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    statusFilter: 'all' | 'pending' | 'approved' | 'rejected' | 'incomplete' | 'suspended';
    setStatusFilter: (f: any) => void;
    expandedVendorId: string | null;
    setExpandedVendorId: (id: string | null) => void;
    currentPage: number;
    setCurrentPage: (fn: (p: number) => number) => void;
    totalVendors: number;
    PAGE_SIZE: number;
    fetchVendors: () => void;
    handleApprove: (userId: string) => void;
    handleDecline: (userId: string) => void;
    handleSuspend: (userId: string) => void;
    handleMarkReviewed: (vendorProfileId: string) => void;
}

const STATUS_FILTERS = [
    { key: 'all',        label: 'All',           color: 'bg-secondary text-foreground' },
    { key: 'pending',    label: '⏳ Pending',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' },
    { key: 'approved',   label: '✅ Approved',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30' },
    { key: 'suspended',  label: '🔒 Suspended',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
    { key: 'rejected',   label: '❌ Declined',    color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
    { key: 'incomplete', label: '📝 Incomplete',  color: 'bg-secondary text-muted-foreground' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    pending:    { label: 'Pending Review', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
    approved:   { label: 'Approved',       color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   dot: 'bg-green-500'  },
    suspended:  { label: 'Suspended',      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500'    },
    rejected:   { label: 'Declined',       color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500'    },
    incomplete: { label: 'Incomplete',     color: 'bg-secondary text-muted-foreground',                                      dot: 'bg-gray-400'   },
};

export default function AdminVendorsTab({
    vendorList, vendorLoading, searchQuery, setSearchQuery,
    statusFilter, setStatusFilter, expandedVendorId, setExpandedVendorId,
    currentPage, setCurrentPage, totalVendors, PAGE_SIZE,
    fetchVendors, handleApprove, handleDecline, handleSuspend, handleMarkReviewed
}: AdminVendorsTabProps) {
    return (
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
                {STATUS_FILTERS.map(f => (
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
                ))}
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
                ) : vendorList.map(vendor => {
                    const status = vendor.approval_status || 'incomplete';
                    const userEmail = vendor.email || 'N/A';
                    const userId = vendor.user_id;
                    const isExpanded = expandedVendorId === userId;
                    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.incomplete;

                    return (
                        <div key={userId} className="bg-card border rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                            {/* Summary Row */}
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
                                            <Button size="sm" onClick={() => handleSuspend(userId)} variant="link" className="text-red-500 h-8 text-xs p-0 px-2">Suspend Access</Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expandable Full Profile Detail */}
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
                                                        { label: 'Shop Name', value: vendor.business_name },
                                                        { label: 'Category',  value: vendor.category },
                                                        { label: 'GSTIN',     value: vendor.gstin },
                                                        { label: 'Address',   value: vendor.address, wide: true },
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
                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><User size={13} /> KYC &amp; Identity</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {[
                                                        { label: 'PAN Number', value: vendor.pan },
                                                        { label: 'Aadhaar',    value: vendor.aadhaar ? vendor.aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') : null },
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
                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><Banknote size={13} /> Bank &amp; Settlement</p>
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

                                            {/* Action Bar */}
                                            <div className="pt-3 border-t border-border space-y-3">
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
                                                                <Check size={14} className="mr-1" /> Approve &amp; Activate
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
                })}
            </div>

            {/* Pagination */}
            {totalVendors > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t border-border pt-4 mt-4 text-sm font-bold">
                    <div className="text-muted-foreground">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, totalVendors)} of {totalVendors}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl px-4">Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * PAGE_SIZE >= totalVendors} className="rounded-xl px-4">Next</Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
