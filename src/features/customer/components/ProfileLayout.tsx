import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, MapPin, Search, Package, CheckCircle2, CreditCard, ShieldCheck, Settings, LogOut, ChevronRight, Edit3, Save, X, Calendar, Camera, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Skeleton, TableSkeleton } from '../../../components/ui/skeleton';
import { useAuthStore } from '../../auth';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

export default function Profile() {
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');

    // Profile State
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ full_name: '', phone: '', address: '', dob: '', pan_number: '', aadhaar_number: '', avatar_url: '', pan_url: '', aadhaar_url: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [panFile, setPanFile] = useState<File | null>(null);
    const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Orders State
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [payingEmiId, setPayingEmiId] = useState<string | null>(null);

    const fetchMyOrders = async () => {
        if (!user?.id) return;
        setOrdersLoading(true);
        const { data, error } = await supabase
            .from('emi_contracts')
            .select(`
                *,
                product:products(name)
            `)
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMyOrders(data);
        }
        setOrdersLoading(false);
    };

    const handlePayEmi = async (order: any) => {
        if (!user?.id) return;
        setPayingEmiId(order.id);

        try {
            // Simulate payment processing delay showing Razorpay / Stripe
            toast.loading("Opening Secure Payment Gateway...", { id: 'pay' });
            await new Promise(r => setTimeout(r, 1500));
            toast.loading("Processing EMI Repayment...", { id: 'pay' });
            await new Promise(r => setTimeout(r, 1500));

            const { data, error } = await supabase.rpc('process_emi_payment', {
                p_contract_id: order.id,
                p_amount: Number(order.emi_amount),
                p_payment_method: 'online'
            });

            if (error) throw error;

            toast.success(`Payment of ₹${Number(order.emi_amount).toLocaleString('en-IN')} successful! 🎉`, { id: 'pay' });
            fetchMyOrders();
            // Re-fetch profile to update credit limit UI
            const { data: pData } = await supabase.from('customer_profiles').select('*').eq('user_id', user.id).single();
            if (pData) setProfile(pData);
        } catch (err: any) {
            toast.error(err.message || 'Payment failed. Please try again.', { id: 'pay' });
        } finally {
            setPayingEmiId(null);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            setLoading(true);
            const { data, error } = await supabase.from('customer_profiles').select('*').eq('user_id', user.id).single();
            if (data) {
                setProfile(data);
                setEditData({
                    full_name: data.full_name || user?.name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    dob: data.dob || '',
                    pan_number: data.pan_number || '',
                    aadhaar_number: data.aadhaar_number || '',
                    avatar_url: data.avatar_url || '',
                    pan_url: data.pan_url || '',
                    aadhaar_url: data.aadhaar_url || ''
                });
            } else {
                setEditData({ ...editData, full_name: user?.name || '' });
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user?.id]);

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchMyOrders();
        }
    }, [activeTab, user?.id]);

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        setIsSaving(true);

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
        if (avatarFile && avatarFile.size > MAX_SIZE) { toast.error("Profile photo exceeds 5MB limit"); setIsSaving(false); return; }
        if (panFile && panFile.size > MAX_SIZE) { toast.error("PAN document exceeds 5MB limit"); setIsSaving(false); return; }
        if (aadhaarFile && aadhaarFile.size > MAX_SIZE) { toast.error("Aadhaar document exceeds 5MB limit"); setIsSaving(false); return; }

        let finalAvatarUrl = editData.avatar_url;
        if (avatarFile) {
            toast.loading("Uploading photo...", { id: 'avatar' });
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}/avatar_${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('vendor-documents').upload(fileName, avatarFile);
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('vendor-documents').getPublicUrl(fileName);
                finalAvatarUrl = publicUrl;
            }
            toast.dismiss('avatar');
        }

        let finalPanUrl = editData.pan_url;
        if (panFile) {
            toast.loading("Uploading PAN...", { id: 'pan' });
            const fileExt = panFile.name.split('.').pop();
            const fileName = `${user.id}/pan_${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('vendor-documents').upload(fileName, panFile);
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('vendor-documents').getPublicUrl(fileName);
                finalPanUrl = publicUrl;
            }
            toast.dismiss('pan');
        }

        let finalAadhaarUrl = editData.aadhaar_url;
        if (aadhaarFile) {
            toast.loading("Uploading Aadhaar...", { id: 'aadhaar' });
            const fileExt = aadhaarFile.name.split('.').pop();
            const fileName = `${user.id}/aadhaar_${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('vendor-documents').upload(fileName, aadhaarFile);
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('vendor-documents').getPublicUrl(fileName);
                finalAadhaarUrl = publicUrl;
            }
            toast.dismiss('aadhaar');
        }

        const { data, error } = await supabase.from('customer_profiles').upsert({
            user_id: user.id,
            ...editData,
            avatar_url: finalAvatarUrl,
            pan_url: finalPanUrl,
            aadhaar_url: finalAadhaarUrl,
            dob: editData.dob || null, // Postgres DATE column rejects empty strings
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }).select().single();

        if (error) {
            toast.error("Failed to update profile: " + error.message);
        } else {
            setProfile(data);
            setIsEditing(false);
            toast.success("Profile updated successfully!");
        }
        setIsSaving(false);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <User size={18} /> },
        { id: 'orders', label: 'My Orders', icon: <Package size={18} /> },
        { id: 'verification', label: 'Verification', icon: <ShieldCheck size={18} /> },
        { id: 'payments', label: 'Payment Methods', icon: <CreditCard size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
    ];

    const mockOrders: any[] = []; // Currently empty, can be wired to actual orders later

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                <div className="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col md:flex-row gap-8 min-h-[calc(100vh-4rem)]">
            {/* Sidebar Navigation */}
            <motion.aside
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="w-full md:w-64 flex-shrink-0"
            >
                <div className="bg-card rounded-3xl border shadow-sm overflow-hidden sticky top-24">
                    <div className="p-6 bg-gradient-to-br from-accent/10 to-transparent border-b">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-accent font-bold text-2xl overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    profile?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg truncate max-w-[120px]">{profile?.full_name || user?.name || 'User'}</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    {profile?.kyc_status === 'verified' ? (
                                        <><CheckCircle2 size={12} className="text-green-500" /> Verified</>
                                    ) : (
                                        <><ShieldCheck size={12} className="text-orange-500" /> Unverified</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <nav className="p-4 space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-accent text-white shadow-md shadow-accent/20' : 'hover:bg-secondary text-foreground/80 hover:text-foreground'}`}
                            >
                                {tab.icon} {tab.label} {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t mt-4">
                        <Button variant="ghost" onClick={logout} className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl gap-2">
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
                            key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <h2 className="text-3xl font-bold tracking-tight mb-6">Profile Overview</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personal Info Editable */}
                                <div className="bg-card border rounded-3xl p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold">Personal Details</h3>
                                        {!isEditing ? (
                                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8 rounded-full text-xs gap-1.5"><Edit3 size={14} /> Edit</Button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 rounded-full text-xs" disabled={isSaving}>Cancel</Button>
                                                <Button variant="accent" size="sm" onClick={handleSaveProfile} className="h-8 rounded-full text-xs shadow-sm shadow-accent/20" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-2 rounded-lg text-muted-foreground"><User size={16} /></div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground font-medium">Full Name</p>
                                                {isEditing ? <input type="text" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-lg px-3 py-1 mt-1 text-sm outline-none" /> : <p className="text-sm font-semibold">{profile?.full_name || user?.name || '-'}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-2 rounded-lg text-muted-foreground"><Mail size={16} /></div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                                                <p className="text-sm font-semibold text-muted-foreground">{user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-2 rounded-lg text-muted-foreground"><Phone size={16} /></div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                                                {isEditing ? <input type="text" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-lg px-3 py-1 mt-1 text-sm outline-none" /> : <p className="text-sm font-semibold">{profile?.phone || '-'}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-2 rounded-lg text-muted-foreground"><MapPin size={16} /></div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground font-medium">Home Address</p>
                                                {isEditing ? <input type="text" value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-lg px-3 py-1 mt-1 text-sm outline-none" placeholder="Full address" /> : <p className="text-sm font-semibold truncate max-w-[200px]">{profile?.address || '-'}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-2 rounded-lg text-muted-foreground"><Calendar size={16} /></div>
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground font-medium">Date of Birth</p>
                                                {isEditing ? <input type="date" value={editData.dob} onChange={e => setEditData({ ...editData, dob: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-lg px-3 py-1 mt-1 text-sm outline-none" /> : <p className="text-sm font-semibold">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : '-'}</p>}
                                            </div>
                                        </div>
                                        {isEditing && (
                                            <div className="flex items-center gap-3">
                                                <div className="bg-secondary p-2 rounded-lg text-muted-foreground"><Camera size={16} /></div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground font-medium">Profile Photo (Optional)</p>
                                                    <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="w-full bg-secondary border border-transparent focus:border-accent rounded-lg px-3 py-1 mt-1 text-sm outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/80 cursor-pointer" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'verification' && (
                        <motion.div
                            key="verification" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold tracking-tight">KYC & Verification</h2>
                                {!isEditing ? (
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-full text-xs gap-1.5"><Edit3 size={14} /> Edit KYC Docs</Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-full text-xs">Cancel</Button>
                                        <Button variant="accent" size="sm" onClick={handleSaveProfile} className="rounded-full text-xs shadow-sm" disabled={isSaving}>{isSaving ? 'Saving...' : 'Submit Documents'}</Button>
                                    </div>
                                )}
                            </div>

                            <div className={`border rounded-3xl p-6 flex items-start gap-4 mb-8 ${profile?.kyc_status === 'verified' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900'}`}>
                                <div className={`p-2 rounded-full mt-1 ${profile?.kyc_status === 'verified' ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'}`}>
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${profile?.kyc_status === 'verified' ? 'text-green-800 dark:text-green-300' : 'text-orange-800 dark:text-orange-300'}`}>
                                        {profile?.kyc_status === 'verified' ? 'Fully Verified Profile' : 'Pending Verification'}
                                    </h3>
                                    <p className={`text-sm mt-1 ${profile?.kyc_status === 'verified' ? 'text-green-700 dark:text-green-400/80' : 'text-orange-700 dark:text-orange-400/80'}`}>
                                        {profile?.kyc_status === 'verified'
                                            ? 'Your identity and credit profile are fully verified. You are eligible for instant EMI financing.'
                                            : 'Please enter your PAN and Aadhaar numbers to verify identity and unlock your EMI limit.'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-border/60 rounded-2xl p-6 bg-card space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-3 rounded-xl"><User size={20} className="text-foreground" /></div>
                                            <h4 className="font-semibold">PAN Card</h4>
                                        </div>
                                        {profile?.kyc_status === 'verified' && <CheckCircle2 className="text-green-500" size={20} />}
                                    </div>
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <input type="text" value={editData.pan_number} onChange={e => setEditData({ ...editData, pan_number: e.target.value.toUpperCase() })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-lg px-4 py-2 mt-1 outline-none uppercase font-mono tracking-widest" placeholder="ABCDE1234F" />
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium mb-1">Upload PAN Document (Max 5MB)</p>
                                                <input type="file" accept="image/*,.pdf" onChange={e => setPanFile(e.target.files?.[0] || null)} className="w-full bg-secondary border border-transparent focus:border-accent rounded-lg px-3 py-1 text-sm outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="ml-14 space-y-2">
                                            <p className="font-mono tracking-widest text-lg">{profile?.pan_number ? profile.pan_number.replace(/.(?=.{4})/g, '*') : 'Not added ❌'}</p>
                                            {profile?.pan_url && <a href={profile.pan_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-full"><FileText size={14} /> Document Uploaded</a>}
                                        </div>
                                    )}
                                </div>
                                <div className="border border-border/60 rounded-2xl p-6 bg-card space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary p-3 rounded-xl"><MapPin size={20} className="text-foreground" /></div>
                                            <h4 className="font-semibold">Aadhaar / ID</h4>
                                        </div>
                                        {profile?.kyc_status === 'verified' && <CheckCircle2 className="text-green-500" size={20} />}
                                    </div>
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <input type="text" value={editData.aadhaar_number} onChange={e => setEditData({ ...editData, aadhaar_number: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-lg px-4 py-2 mt-1 outline-none font-mono tracking-widest" placeholder="XXXX XXXX 1234" />
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium mb-1">Upload Aadhaar Document (Max 5MB)</p>
                                                <input type="file" accept="image/*,.pdf" onChange={e => setAadhaarFile(e.target.files?.[0] || null)} className="w-full bg-secondary border border-transparent focus:border-accent rounded-lg px-3 py-1 text-sm outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="ml-14 space-y-2">
                                            <p className="font-mono tracking-widest text-lg">{profile?.aadhaar_number ? profile.aadhaar_number.replace(/.(?=.{4})/g, '*') : 'Not added ❌'}</p>
                                            {profile?.aadhaar_url && <a href={profile.aadhaar_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-full"><FileText size={14} /> Document Uploaded</a>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'orders' && (
                        <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold tracking-tight">My Orders & EMIs</h2>
                                <Button onClick={fetchMyOrders} variant="outline" size="sm" className="rounded-full">Refresh</Button>
                            </div>

                            {ordersLoading ? (
                                <div className="space-y-6">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-64 rounded-[2rem]" />
                                    ))}
                                </div>
                            ) : myOrders.length === 0 ? (
                                <div className="text-center py-12 bg-secondary/20 rounded-3xl border border-dashed">
                                    <Package className="mx-auto text-muted-foreground/50 mb-4" size={48} />
                                    <h3 className="text-lg font-bold">No active orders yet</h3>
                                    <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">Once you purchase a product via EMI from a vendor, it will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {myOrders.map(order => {
                                        const pending = order.total_amount - order.total_paid;
                                        return (
                                            <div key={order.id} className="bg-card border rounded-[1.5rem] sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-accent/10 p-3 rounded-xl"><Package size={24} className="text-accent" /></div>
                                                        <div>
                                                            <p className="font-bold text-base sm:text-lg leading-tight">{order.product?.name || 'Unknown Product'}</p>
                                                            <p className="text-[10px] sm:text-sm text-muted-foreground font-mono">{order.short_id} • {order.duration_count} {order.duration_type === 'monthly' ? 'Months' : 'Weeks'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-left md:text-right">
                                                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 pb-1.5 rounded-full ${order.status === 'active' ? 'bg-blue-500/10 text-blue-500' :
                                                                order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                                    order.status === 'defaulted' ? 'bg-red-500/10 text-red-500' :
                                                                        'bg-orange-500/10 text-orange-500'
                                                            }`}>
                                                            {order.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 bg-secondary/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Total Loan</p>
                                                        <p className="font-black">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                                                        <p className="font-black text-green-600 dark:text-green-400">₹{Number(order.total_paid).toLocaleString('en-IN')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground mb-1">Remaining</p>
                                                        <p className="font-black text-sm sm:text-base">₹{pending.toLocaleString('en-IN')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">EMI Amount</p>
                                                        <p className="font-black text-accent">₹{Number(order.emi_amount).toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                                                    <div className="w-full md:w-auto">
                                                        <p className="text-sm font-bold text-foreground mb-1">
                                                            {order.status === 'completed' ? 'All EMIs Paid 🎉' : `Next EMI Due: ${new Date(order.next_due_date).toLocaleDateString()}`}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Progress: {order.paid_installments} / {order.duration_count} Installments
                                                        </p>
                                                        <div className="w-full md:w-48 h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                                                            <div className="h-full bg-accent rounded-full" style={{ width: `${(order.paid_installments / order.duration_count) * 100}%` }} />
                                                        </div>
                                                    </div>

                                                    {order.status !== 'completed' && order.status !== 'pending_approval' && order.status !== 'rejected' && (
                                                        <Button
                                                            onClick={() => handlePayEmi(order)}
                                                            variant="accent"
                                                            className="w-full md:w-auto h-12 rounded-xl font-bold shadow-lg shadow-accent/20 px-8"
                                                            disabled={payingEmiId === order.id}
                                                        >
                                                            {payingEmiId === order.id ? 'Processing...' : `Pay ₹${Number(order.emi_amount).toLocaleString('en-IN')} Now`}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}
