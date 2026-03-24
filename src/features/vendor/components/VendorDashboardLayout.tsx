import React, { useState, useEffect } from 'react';
import {
    Plus, Box, CreditCard, LayoutDashboard, Users,
    ShoppingBag, Store, CheckCircle2, Lock,
    TrendingUp, AlertCircle, Trash, Clock, BookOpen, Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth';
import { toast } from 'sonner';

// Feature tabs
import AnalyticsTab from './tabs/AnalyticsTab';
import InventoryTab from './tabs/InventoryTab';
import OrdersTab from './tabs/OrdersTab';
import CollectionsTab from './tabs/CollectionsTab';
import PosTab from './tabs/PosTab';
import CustomersTab from './tabs/CustomersTab';
import ShopProfileTab from './tabs/ShopProfileTab';
import TermsTab from './tabs/TermsTab';

export default function VendorDashboard() {
    const [activeTab, setActiveTab] = useState('analytics');
    const [vendorStatus, setVendorStatus] = useState<'loading' | 'incomplete' | 'pending' | 'approved' | 'rejected' | 'suspended'>('loading');
    const [vendorProfile, setVendorProfile] = useState<any>(null);
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        let userSub: any = null;

        const checkApprovalStatus = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) { setVendorStatus('incomplete'); return; }

            const { data: userData, error: userError } = await supabase
                .from('users').select('approval_status').eq('id', authUser.id).single();

            const { data: profileData } = await supabase
                .from('vendor_profiles')
                .select('business_name, category, address, gstin, pan, aadhaar, account_no, ifsc, document_urls, phone, email, upi_id, profile_photo_url')
                .eq('user_id', authUser.id).single();

            setVendorProfile(profileData || null);

            if (userError || !userData) {
                setVendorStatus('approved');
            } else {
                setVendorStatus(userData.approval_status || 'incomplete');
            }

            userSub = supabase.channel('vendor-approval-status')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${authUser.id}` }, (payload) => {
                    if (payload.new?.approval_status) {
                        setVendorStatus(payload.new.approval_status);
                        if (payload.new.approval_status === 'approved') toast.success("Your store has been approved! Dashboard is now unlocked.");
                    }
                }).subscribe();
        };

        checkApprovalStatus();
        return () => { if (userSub) supabase.removeChannel(userSub); };
    }, []);

    // ─── POS State ───────────────────────────────────────────────
    const [posStep, setPosStep] = useState(1);
    const [posPhone, setPosPhone] = useState('');
    const [posOtp, setPosOtp] = useState(['', '', '', '']);
    const [selectedPosProduct, setSelectedPosProduct] = useState<any>(null);
    const [posEmiPlan, setPosEmiPlan] = useState<number | null>(null);

    const handlePosOtpChange = (idx: number, val: string) => {
        if (!/^[0-9]*$/.test(val)) return;
        const newOtp = [...posOtp];
        newOtp[idx] = val;
        setPosOtp(newOtp);
    };

    // ─── Mock Data ───────────────────────────────────────────────
    const mockCustomers = [
        { id: 'CUST-001', name: 'Rahul Sharma', phone: '+91 98765 43210', activeEmis: 1, totalSpent: '₹1,34,900', status: 'Good Standing' },
        { id: 'CUST-002', name: 'Amit Kumar',   phone: '+91 91234 56789', activeEmis: 0, totalSpent: '₹45,000',   status: 'Paid Off'     },
        { id: 'CUST-003', name: 'Priya Patel',  phone: '+91 99887 76655', activeEmis: 2, totalSpent: '₹85,000',   status: 'Payment Due'  },
    ];

    // ─── Inventory State ─────────────────────────────────────────
    const [myProducts, setMyProducts] = useState<any[]>([]);
    const [fetchingProducts, setFetchingProducts] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', mrp: '', stock: '', description: '', emiPlans: [{ id: crypto.randomUUID(), type: 'monthly', duration: 6, interestRate: 0 }] });
    const [selectedCategory, setSelectedCategory] = useState('');
    const [dbCategories, setDbCategories] = useState<any[]>([]);
    const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEditProduct = (p: any) => {
        setEditingProductId(p.id);
        setNewProduct({ name: p.name || '', price: p.price?.toString() || '', mrp: p.original_price?.toString() || '', stock: p.stock_count?.toString() || '0', description: p.description || '', emiPlans: Array.isArray(p.emi_plans) && p.emi_plans.length > 0 ? p.emi_plans : [{ id: crypto.randomUUID(), type: 'monthly', duration: 6, interestRate: 0 }] });
        setSelectedCategory(p.category?.name || '');
        setProductImageFiles([]);
        setIsAddingProduct(true);
    };

    const handleDeleteProduct = (id: string) => setProductToDelete(id);

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        const { error } = await supabase.from('products').delete().eq('id', productToDelete);
        if (error) { toast.error("Failed to delete product: " + error.message); }
        else { toast.success("Product deleted successfully"); setMyProducts(prev => prev.filter(p => p.id !== productToDelete)); setProductToDelete(null); }
        setIsDeleting(false);
    };

    const fetchMyProducts = async () => {
        setFetchingProducts(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return setFetchingProducts(false);

        const { data: cats } = await supabase.from('categories').select('*');
        if (cats) setDbCategories(cats);

        let { data: shop } = await supabase.from('shops').select('id, name').eq('vendor_id', authUser.id).single();
        if (!shop) {
            const { data: profile } = await supabase.from('vendor_profiles').select('business_name').eq('user_id', authUser.id).single();
            const { data: newShop } = await supabase.from('shops').insert({ vendor_id: authUser.id, name: profile?.business_name || 'My Store' }).select('id, name').single();
            shop = newShop;
        }

        if (shop) {
            const { data: prods } = await supabase.from('products').select('*, category:categories(name)').eq('shop_id', shop.id).order('created_at', { ascending: false });
            setMyProducts(prods || []);
        }
        setFetchingProducts(false);
    };

    useEffect(() => { if (activeTab === 'inventory') fetchMyProducts(); }, [activeTab]);

    const submitNewProduct = async () => {
        if (!newProduct.name || !newProduct.price || !selectedCategory) { toast.error("Please fill all required fields"); return; }
        setIsSavingProduct(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { setIsSavingProduct(false); return; }

        let { data: shop } = await supabase.from('shops').select('id').eq('vendor_id', authUser.id).single();
        if (!shop) { toast.error("Shop not found"); setIsSavingProduct(false); return; }

        const formattedCategory = selectedCategory.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        let finalCategoryId = '';
        const existingCat = dbCategories.find(c => c.name.toLowerCase() === formattedCategory.toLowerCase());
        if (existingCat) {
            finalCategoryId = existingCat.id;
        } else {
            const { data: newCat, error: catError } = await supabase.from('categories').insert({ name: formattedCategory }).select('id').single();
            if (catError) { toast.error("Could not create new category: " + catError.message); setIsSavingProduct(false); return; }
            finalCategoryId = newCat.id;
        }

        let finalImageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
        const imageGallery: string[] = [];
        if (productImageFiles.length > 0) {
            toast.loading("Uploading product images...", { id: 'upload' });
            for (const file of productImageFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${authUser.id}/product_${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('vendor-documents').upload(fileName, file);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('vendor-documents').getPublicUrl(fileName);
                    imageGallery.push(publicUrl);
                } else {
                    toast.error(`Image upload failed: ${uploadError.message}`);
                }
            }
            if (imageGallery.length > 0) finalImageUrl = imageGallery[0];
            else toast.error("Failed to upload product images.");
            toast.dismiss('upload');
        }

        const shortTag = 'PROD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        if (editingProductId) {
            const updatePayload: any = { category_id: finalCategoryId, name: newProduct.name, price: Number(newProduct.price), original_price: Number(newProduct.mrp) || null, stock_count: Number(newProduct.stock) || 0, description: newProduct.description, emi_plans: newProduct.emiPlans };
            if (productImageFiles.length > 0) { updatePayload.image_url = finalImageUrl; updatePayload.image_gallery = imageGallery; }
            const { error } = await supabase.from('products').update(updatePayload).eq('id', editingProductId);
            if (error) { toast.error("Failed to update product: " + error.message); }
            else { toast.success("Product updated successfully!"); setIsAddingProduct(false); setEditingProductId(null); setNewProduct({ name: '', price: '', mrp: '', stock: '', description: '', emiPlans: [{ id: crypto.randomUUID(), type: 'monthly', duration: 6, interestRate: 0 }] }); setProductImageFiles([]); fetchMyProducts(); }
        } else {
            const { error } = await supabase.from('products').insert({ shop_id: shop.id, category_id: finalCategoryId, name: newProduct.name, price: Number(newProduct.price), original_price: Number(newProduct.mrp) || null, stock_count: Number(newProduct.stock) || 0, description: newProduct.description, short_tag: shortTag, image_url: finalImageUrl, image_gallery: imageGallery, emi_plans: newProduct.emiPlans });
            if (error) { toast.error("Failed to add product: " + error.message); }
            else { toast.success("Product added successfully! Tag: " + shortTag); setIsAddingProduct(false); setNewProduct({ name: '', price: '', mrp: '', stock: '', description: '', emiPlans: [{ id: crypto.randomUUID(), type: 'monthly', duration: 6, interestRate: 0 }] }); setProductImageFiles([]); fetchMyProducts(); }
        }
        setIsSavingProduct(false);
    };

    const sidebarTabs = [
        { id: 'analytics',    icon: LayoutDashboard, label: 'Analytics' },
        { id: 'inventory',    icon: Box,             label: 'Products & Stock' },
        { id: 'orders',       icon: ShoppingBag,     label: 'Manage Orders' },
        { id: 'collections',  icon: Banknote,        label: 'Collections' },
        { id: 'pos',          icon: CreditCard,      label: 'Walk-in EMI (POS)' },
        { id: 'customers',    icon: Users,           label: 'Customers' },
        { id: 'terms',        icon: BookOpen,        label: 'Terms & Rules' },
        { id: 'registration', icon: Store,           label: 'Shop Profile' }
    ];

    // ─── STATUS SCREENS ───────────────────────────────────────────
    if (vendorStatus === 'loading') {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin" />
                    <p className="font-semibold">Checking account status...</p>
                </div>
            </div>
        );
    }

    if (vendorStatus === 'incomplete') {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                    <div className="bg-orange-500/10 text-orange-500 rounded-full p-5 w-fit mx-auto mb-6"><AlertCircle size={44} /></div>
                    <h1 className="text-3xl font-black mb-3">Shop Setup Incomplete</h1>
                    <p className="text-muted-foreground mb-8">You haven't finished setting up your online store yet. Complete your Business Info, KYC, and Document upload to get approved and unlock your Vendor Dashboard.</p>
                    <div className="bg-secondary rounded-2xl p-5 text-left mb-8 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">To unlock your dashboard:</p>
                        {['Business & Shop Details', 'KYC & Bank Details', 'Upload GST / Trade License', 'Wait for Admin Approval (24–48 hrs)'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                                <span className="text-sm font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => navigate('/vendor/register')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-8 h-12 text-base shadow-lg shadow-blue-500/20">Complete Registration →</Button>
                </motion.div>
            </div>
        );
    }

    if (vendorStatus === 'pending') {
        const p = vendorProfile;
        const hasDocs = p?.document_urls?.length > 0;
        const hasKyc = !!(p?.pan && p?.aadhaar);
        const hasBank = !!(p?.account_no && p?.ifsc);
        const hasBusiness = !!(p?.business_name && p?.address);
        const isProfileComplete = hasBusiness && hasKyc && hasBank && hasDocs;
        const checklistItems = [
            { label: 'Account Created & Email Set',        done: true },
            { label: 'Business Name & Address',            done: hasBusiness },
            { label: 'KYC — PAN & Aadhaar',               done: hasKyc },
            { label: 'Bank Account Details',               done: hasBank },
            { label: 'Documents — GST & Cancelled Cheque', done: hasDocs },
        ];
        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6 bg-secondary/20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
                    <div className="text-center mb-6">
                        <div className={`rounded-full p-5 w-fit mx-auto mb-4 ${isProfileComplete ? 'bg-yellow-500/10 text-yellow-500' : 'bg-orange-500/10 text-orange-500'}`}><Clock size={44} /></div>
                        <h1 className="text-3xl font-black mb-2">{isProfileComplete ? 'Awaiting Approval' : 'Profile Incomplete'}</h1>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">{isProfileComplete ? "Your store application is under review. This usually takes 24–48 hours. You'll receive an email once approved." : 'Your application was submitted but some required details are missing. Complete your profile to speed up approval.'}</p>
                    </div>
                    <div className={`rounded-2xl p-6 text-left mb-5 border ${isProfileComplete ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                        <p className={`text-xs font-black uppercase tracking-widest mb-4 ${isProfileComplete ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`}>⏳ Application Status</p>
                        <div className="space-y-3">
                            {checklistItems.map((s, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    {s.done ? <CheckCircle2 size={17} className="text-green-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-orange-400 shrink-0" />}
                                    <span className={`text-sm flex-1 ${s.done ? 'font-semibold' : 'text-muted-foreground'}`}>{s.label}</span>
                                    {!s.done && <span className="text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold shrink-0">Missing</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {!isProfileComplete && <Button onClick={() => navigate('/vendor/register')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12">✏️ Complete Your Profile</Button>}
                        <Button variant="outline" onClick={() => window.location.href = 'mailto:support@emibazaar.com'} className={`rounded-xl font-bold h-12 ${isProfileComplete ? 'flex-1' : ''}`}>Contact Support</Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-4">Need help? <span className="font-bold text-foreground">support@emibazaar.com</span></p>
                </motion.div>
            </div>
        );
    }

    if (vendorStatus === 'suspended') {
        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                    <div className="bg-red-500/10 text-red-500 rounded-full p-5 w-fit mx-auto mb-6"><Lock size={44} /></div>
                    <h1 className="text-3xl font-black mb-3">Account Suspended</h1>
                    <p className="text-muted-foreground mb-6 leading-relaxed">Your vendor account has been temporarily suspended by the platform admin. This may be due to a policy violation or pending review. Contact support to resolve this.</p>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 text-left mb-8">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-3">What this means</p>
                        <ul className="text-sm text-muted-foreground space-y-2 pl-4 list-disc">
                            <li>Your store is not visible to customers</li>
                            <li>New EMI orders are paused</li>
                            <li>Existing orders are still being processed</li>
                        </ul>
                    </div>
                    <Button onClick={() => window.location.href = 'mailto:support@emibazaar.com'} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold px-8 h-12">Contact Support to Appeal</Button>
                </motion.div>
            </div>
        );
    }

    if (vendorStatus === 'rejected') {
        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                    <div className="bg-red-500/10 text-red-500 rounded-full p-5 w-fit mx-auto mb-6"><AlertCircle size={44} /></div>
                    <h1 className="text-3xl font-black mb-3">Application Declined</h1>
                    <p className="text-muted-foreground mb-6 leading-relaxed">Your vendor application was not approved at this time. Review the common reasons below, update your profile, and resubmit — our team will re-review within 24 hours.</p>
                    <div className="bg-secondary/50 rounded-2xl p-4 text-left mb-6">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Common reasons for rejection</p>
                        <ul className="text-sm text-muted-foreground space-y-1.5 pl-4 list-disc">
                            <li>Incomplete or blurry documents</li>
                            <li>GSTIN does not match business address</li>
                            <li>Invalid KYC information (PAN / Aadhaar mismatch)</li>
                        </ul>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => navigate('/vendor/register')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 h-12">✏️ Update &amp; Resubmit</Button>
                        <Button variant="outline" onClick={() => window.location.href = 'mailto:support@emibazaar.com'} className="rounded-xl font-bold px-6 h-12">Contact Support</Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── APPROVED: Full Dashboard ─────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden md:flex flex-col w-72 bg-card border-r border-border/60 p-5 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 px-3 mb-8">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/20"><Store size={20} /></div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight truncate max-w-[160px]">{vendorProfile?.business_name || 'My Shop'}</h2>
                        {vendorStatus === 'approved'
                            ? <span className="text-xs text-green-500 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Verified Seller</span>
                            : <span className="text-xs text-yellow-500 font-bold flex items-center gap-1"><Clock size={10} /> Pending Review</span>}
                    </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                    {sidebarTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn("w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold text-left transition-all duration-300 relative overflow-hidden group hover:bg-secondary/80",
                                activeTab === tab.id ? "text-accent" : "text-muted-foreground hover:text-foreground")}
                        >
                            {activeTab === tab.id && (
                                <motion.div layoutId="activeVendorTab" className="absolute inset-0 bg-accent/10 rounded-xl" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                            )}
                            <tab.icon size={20} className={activeTab === tab.id ? "text-accent stroke-[2.5]" : "opacity-80"} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-auto bg-gradient-to-br from-green-500/10 to-transparent p-5 rounded-2xl border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold mb-1">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Active Integration
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">System online. Receiving EMI orders smoothly.</p>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto w-full bg-secondary/20 p-4 md:p-8 lg:p-10 pb-24 md:pb-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'analytics'    && <AnalyticsTab />}
                    {activeTab === 'inventory'    && (
                        <InventoryTab
                            isAddingProduct={isAddingProduct} setIsAddingProduct={setIsAddingProduct}
                            editingProductId={editingProductId} setEditingProductId={setEditingProductId}
                            newProduct={newProduct} setNewProduct={setNewProduct}
                            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                            dbCategories={dbCategories}
                            productImageFiles={productImageFiles} setProductImageFiles={setProductImageFiles}
                            isSavingProduct={isSavingProduct} submitNewProduct={submitNewProduct}
                            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                            myProducts={myProducts} fetchingProducts={fetchingProducts}
                            handleEditProduct={handleEditProduct} handleDeleteProduct={handleDeleteProduct}
                        />
                    )}
                    {activeTab === 'orders'       && <OrdersTab />}
                    {activeTab === 'collections'  && <CollectionsTab />}
                    {activeTab === 'pos'          && (
                        <PosTab
                            posStep={posStep} setPosStep={setPosStep}
                            posPhone={posPhone} setPosPhone={setPosPhone}
                            posOtp={posOtp} handlePosOtpChange={handlePosOtpChange}
                            selectedPosProduct={selectedPosProduct} setSelectedPosProduct={setSelectedPosProduct}
                            posEmiPlan={posEmiPlan} setPosEmiPlan={setPosEmiPlan}
                            setPosOtp={setPosOtp}
                        />
                    )}
                    {activeTab === 'customers'    && <CustomersTab mockCustomers={mockCustomers} />}
                    {activeTab === 'terms'        && <TermsTab />}
                    {activeTab === 'registration' && <ShopProfileTab vendorProfile={vendorProfile} onProfileUpdated={setVendorProfile} />}
                </AnimatePresence>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 px-2 py-3 flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                {sidebarTabs.slice(0, 5).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center w-full gap-1 p-2 ${activeTab === tab.id ? "text-accent" : "text-muted-foreground"}`}>
                        <tab.icon size={20} className={activeTab === tab.id ? "stroke-[2.5]" : "opacity-80"} />
                        <span className="text-[10px] font-bold leading-none select-none">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {productToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-card w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border"
                        >
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash size={32} /></div>
                            <h2 className="text-2xl font-black text-center mb-3">Delete Product?</h2>
                            <p className="text-center text-muted-foreground mb-8 text-sm">Are you sure you want to delete this product? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setProductToDelete(null)} className="flex-1 rounded-xl h-12 font-bold" disabled={isDeleting}>Cancel</Button>
                                <Button variant="accent" onClick={confirmDeleteProduct} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-500/20 border-red-600" disabled={isDeleting}>
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
