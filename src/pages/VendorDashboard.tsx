import React, { useState, useEffect } from 'react';
import { products, getEmiPlans } from '../data/mockData';
import {
    Plus, Box, CreditCard, LayoutDashboard, Search, FileText, IndianRupee, Users,
    ShoppingBag, Store, CheckCircle2, ChevronRight, Phone, Lock, Upload, MapPin,
    TrendingUp, ShieldCheck, Edit, Check, X, Calculator, Smartphone, Settings,
    Clock, AlertCircle, Trash, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

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
            if (!authUser) {
                setVendorStatus('incomplete');
                return;
            }

            // Fetch user status
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('approval_status')
                .eq('id', authUser.id)
                .single();

            // Fetch vendor profile to check completeness
            const { data: profileData } = await supabase
                .from('vendor_profiles')
                .select('business_name, category, address, gstin, pan, aadhaar, account_no, ifsc, document_urls')
                .eq('user_id', authUser.id)
                .single();

            setVendorProfile(profileData || null);

            if (userError || !userData) {
                setVendorStatus('approved'); // default during dev before SQL is run
            } else {
                setVendorStatus(userData.approval_status || 'incomplete');
            }

            // Subscribe to real-time status updates
            userSub = supabase.channel('vendor-approval-status')
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${authUser.id}` },
                    (payload) => {
                        if (payload.new && payload.new.approval_status) {
                            setVendorStatus(payload.new.approval_status);
                            if (payload.new.approval_status === 'approved') {
                                toast.success("Your store has been approved! Dashboard is now unlocked.");
                            }
                        }
                    }
                )
                .subscribe();
        };

        checkApprovalStatus();

        return () => {
            if (userSub) {
                supabase.removeChannel(userSub);
            }
        };
    }, []);

    // POS State
    const [posStep, setPosStep] = useState(1);
    const [posPhone, setPosPhone] = useState('');
    const [posOtp, setPosOtp] = useState(['', '', '', '']);
    const [selectedPosProduct, setSelectedPosProduct] = useState<any>(null);
    const [posEmiPlan, setPosEmiPlan] = useState<number | null>(null);

    // Mock Data
    const mockOrders = [
        { id: 'ORD-1092', customer: 'Rahul Sharma', product: 'iPhone 15 Pro', amount: '₹1,34,900', status: 'Pending', type: 'Walk-in EMI', date: 'Just now' },
        { id: 'ORD-1091', customer: 'Priya Patel', product: 'Sony 4K TV', amount: '₹65,000', status: 'Completed', type: 'Online Delivery', date: '2 hours ago' },
        { id: 'ORD-1090', customer: 'Amit Kumar', product: 'MacBook Air M2', amount: '₹1,14,900', status: 'Completed', type: 'Store Pickup', date: 'Yesterday' },
    ];

    const mockCustomers = [
        { id: 'CUST-001', name: 'Rahul Sharma', phone: '+91 98765 43210', activeEmis: 1, totalSpent: '₹1,34,900', status: 'Good Standing' },
        { id: 'CUST-002', name: 'Amit Kumar', phone: '+91 91234 56789', activeEmis: 0, totalSpent: '₹45,000', status: 'Paid Off' },
        { id: 'CUST-003', name: 'Priya Patel', phone: '+91 99887 76655', activeEmis: 2, totalSpent: '₹85,000', status: 'Payment Due' },
    ];

    const handlePosOtpChange = (idx: number, val: string) => {
        if (!/^[0-9]*$/.test(val)) return;
        const newOtp = [...posOtp];
        newOtp[idx] = val;
        setPosOtp(newOtp);
    };

    // Inventory states
    const [myProducts, setMyProducts] = useState<any[]>([]);
    const [fetchingProducts, setFetchingProducts] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', mrp: '', stock: '', description: '' });
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
        setNewProduct({
            name: p.name || '',
            price: p.price?.toString() || '',
            mrp: p.original_price?.toString() || '',
            stock: p.stock_count?.toString() || '0',
            description: p.description || ''
        });
        setSelectedCategory(p.category?.name || '');
        setProductImageFiles([]); 
        setIsAddingProduct(true);
    };

    const handleDeleteProduct = (id: string) => {
        setProductToDelete(id);
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        const { error } = await supabase.from('products').delete().eq('id', productToDelete);
        
        if (error) {
            toast.error("Failed to delete product: " + error.message);
        } else {
            toast.success("Product deleted successfully");
            setMyProducts(prev => prev.filter(p => p.id !== productToDelete));
            setProductToDelete(null);
        }
        setIsDeleting(false);
    };

    const fetchMyProducts = async () => {
        setFetchingProducts(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return setFetchingProducts(false);

        // Fetch categories for the form
        const { data: cats } = await supabase.from('categories').select('*');
        if (cats) setDbCategories(cats);

        // Fetch or create shop
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

    useEffect(() => {
        if (activeTab === 'inventory') fetchMyProducts();
    }, [activeTab]);

    const submitNewProduct = async () => {
        if(!newProduct.name || !newProduct.price || !selectedCategory) {
             toast.error("Please fill all required fields"); return;
        }
        setIsSavingProduct(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { setIsSavingProduct(false); return; }

        let { data: shop } = await supabase.from('shops').select('id').eq('vendor_id', authUser.id).single();
        if (!shop) { toast.error("Shop not found"); setIsSavingProduct(false); return; }

        // Process typed Category
        const formattedCategory = selectedCategory.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        let finalCategoryId = '';
        const existingCat = dbCategories.find(c => c.name.toLowerCase() === formattedCategory.toLowerCase());
        
        if (existingCat) {
            finalCategoryId = existingCat.id;
        } else {
            const { data: newCat, error: catError } = await supabase.from('categories').insert({ name: formattedCategory }).select('id').single();
            if (catError) {
                toast.error("Could not create new category: " + catError.message);
                setIsSavingProduct(false);
                return;
            }
            finalCategoryId = newCat.id;
        }

        let finalImageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
        const imageGallery: string[] = [];

        if (productImageFiles.length > 0) {
            toast.loading("Uploading product images...", { id: 'upload' });
            for (let i = 0; i < productImageFiles.length; i++) {
                const file = productImageFiles[i];
                const fileExt = file.name.split('.').pop();
                // Format MUST be user_id/filename to pass the bucket RLS policy
                const fileName = `${authUser.id}/product_${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('vendor-documents').upload(fileName, file);
                if (!uploadError) {
                     const { data: { publicUrl } } = supabase.storage.from('vendor-documents').getPublicUrl(fileName);
                     imageGallery.push(publicUrl);
                } else {
                     toast.error(`Image upload failed: ${uploadError.message}`);
                }
            }
            if (imageGallery.length > 0) {
                 finalImageUrl = imageGallery[0];
            } else {
                 toast.error("Failed to upload product images.");
            }
            toast.dismiss('upload');
        }

        const shortTag = 'PROD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        if (editingProductId) {
            const updatePayload: any = {
                category_id: finalCategoryId,
                name: newProduct.name,
                price: Number(newProduct.price),
                original_price: Number(newProduct.mrp) || null,
                stock_count: Number(newProduct.stock) || 0,
                description: newProduct.description,
            };
            
            // Only update images if the vendor uploaded new ones during edit
            if (productImageFiles.length > 0) {
                updatePayload.image_url = finalImageUrl;
                updatePayload.image_gallery = imageGallery;
            }

            const { error } = await supabase.from('products').update(updatePayload).eq('id', editingProductId);

            if (error) {
                toast.error("Failed to update product: " + error.message);
            } else {
                toast.success("Product updated successfully!");
                setIsAddingProduct(false);
                setEditingProductId(null);
                setNewProduct({ name: '', price: '', mrp: '', stock: '', description: '' });
                setProductImageFiles([]);
                fetchMyProducts();
            }
        } else {
            const { error } = await supabase.from('products').insert({
                shop_id: shop.id,
                category_id: finalCategoryId,
                name: newProduct.name,
                price: Number(newProduct.price),
                original_price: Number(newProduct.mrp) || null,
                stock_count: Number(newProduct.stock) || 0,
                description: newProduct.description,
                short_tag: shortTag,
                image_url: finalImageUrl,
                image_gallery: imageGallery,
            });

            if (error) {
                toast.error("Failed to add product: " + error.message);
            } else {
                toast.success("Product added successfully! Tag: " + shortTag);
                setIsAddingProduct(false);
                setNewProduct({ name: '', price: '', mrp: '', stock: '', description: '' });
                setProductImageFiles([]);
                fetchMyProducts();
            }
        }
        setIsSavingProduct(false);
    };

    const sidebarTabs = [
        { id: 'analytics', icon: LayoutDashboard, label: 'Analytics' },
        { id: 'inventory', icon: Box, label: 'Products & Stock' },
        { id: 'orders', icon: ShoppingBag, label: 'Manage Orders' },
        { id: 'pos', icon: CreditCard, label: 'Walk-in EMI (POS)' },
        { id: 'customers', icon: Users, label: 'Customers' },
        { id: 'registration', icon: Store, label: 'Shop Profile' }
    ];

    // ─── LOADING ────────────────────────────────────────────────────────────────
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

    // ─── INCOMPLETE: Vendor skipped registration ─────────────────────────────────
    if (vendorStatus === 'incomplete') {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                    <div className="bg-orange-500/10 text-orange-500 rounded-full p-5 w-fit mx-auto mb-6">
                        <AlertCircle size={44} />
                    </div>
                    <h1 className="text-3xl font-black mb-3">Shop Setup Incomplete</h1>
                    <p className="text-muted-foreground mb-8">
                        You haven't finished setting up your online store yet. Complete your Business Info, KYC, and Document upload to get approved and unlock your Vendor Dashboard.
                    </p>
                    <div className="bg-secondary rounded-2xl p-5 text-left mb-8 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">To unlock your dashboard:</p>
                        {['Business & Shop Details', 'KYC & Bank Details', 'Upload GST / Trade License', 'Wait for Admin Approval (24–48 hrs)'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                                <span className="text-sm font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => navigate('/vendor/register')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-8 h-12 text-base shadow-lg shadow-blue-500/20">
                        Complete Registration →
                    </Button>
                </motion.div>
            </div>
        );
    }

    // ─── PENDING: Submitted but awaiting admin approval ──────────────────────────
    if (vendorStatus === 'pending') {
        const p = vendorProfile;
        const hasDocs = p?.document_urls?.length > 0;
        const hasKyc = !!(p?.pan && p?.aadhaar);
        const hasBank = !!(p?.account_no && p?.ifsc);
        const hasBusiness = !!(p?.business_name && p?.address);
        const isProfileComplete = hasBusiness && hasKyc && hasBank && hasDocs;

        const checklistItems = [
            { label: 'Account Created & Email Set',      done: true },
            { label: 'Business Name & Address',           done: hasBusiness },
            { label: 'KYC — PAN & Aadhaar',              done: hasKyc },
            { label: 'Bank Account Details',              done: hasBank },
            { label: 'Documents — GST & Cancelled Cheque', done: hasDocs },
        ];

        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6 bg-secondary/20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
                    <div className="text-center mb-6">
                        <div className={`rounded-full p-5 w-fit mx-auto mb-4 ${isProfileComplete ? 'bg-yellow-500/10 text-yellow-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            <Clock size={44} />
                        </div>
                        <h1 className="text-3xl font-black mb-2">
                            {isProfileComplete ? 'Awaiting Approval' : 'Profile Incomplete'}
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
                            {isProfileComplete
                                ? "Your store application is under review. This usually takes 24–48 hours. You'll receive an email once approved."
                                : 'Your application was submitted but some required details are missing. Complete your profile to speed up approval.'}
                        </p>
                    </div>

                    <div className={`rounded-2xl p-6 text-left mb-5 border ${isProfileComplete ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                        <p className={`text-xs font-black uppercase tracking-widest mb-4 ${isProfileComplete ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            ⏳ Application Status
                        </p>
                        <div className="space-y-3">
                            {checklistItems.map((s, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    {s.done
                                        ? <CheckCircle2 size={17} className="text-green-500 shrink-0" />
                                        : <div className="w-4 h-4 rounded-full border-2 border-orange-400 shrink-0" />
                                    }
                                    <span className={`text-sm flex-1 ${s.done ? 'font-semibold' : 'text-muted-foreground'}`}>{s.label}</span>
                                    {!s.done && (
                                        <span className="text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold shrink-0">Missing</span>
                                    )}
                                </div>
                            ))}

                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {!isProfileComplete && (
                            <Button onClick={() => navigate('/vendor/register')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12">
                                ✏️ Complete Your Profile
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => window.location.href = 'mailto:support@emibazaar.com'} className={`rounded-xl font-bold h-12 ${isProfileComplete ? 'flex-1' : ''}`}>
                            Contact Support
                        </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                        Need help? <span className="font-bold text-foreground">support@emibazaar.com</span>
                    </p>
                </motion.div>
            </div>
        );
    }

    // ─── SUSPENDED ───────────────────────────────────────────────────────────────
    if (vendorStatus === 'suspended') {
        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                    <div className="bg-red-500/10 text-red-500 rounded-full p-5 w-fit mx-auto mb-6">
                        <Lock size={44} />
                    </div>
                    <h1 className="text-3xl font-black mb-3">Account Suspended</h1>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                        Your vendor account has been temporarily suspended by the platform admin. This may be due to a policy violation or pending review. Contact support to resolve this.
                    </p>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 text-left mb-8">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-3">What this means</p>
                        <ul className="text-sm text-muted-foreground space-y-2 pl-4 list-disc">
                            <li>Your store is not visible to customers</li>
                            <li>New EMI orders are paused</li>
                            <li>Existing orders are still being processed</li>
                        </ul>
                    </div>
                    <Button onClick={() => window.location.href = 'mailto:support@emibazaar.com'} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold px-8 h-12">
                        Contact Support to Appeal
                    </Button>
                </motion.div>
            </div>
        );
    }

    // ─── REJECTED ────────────────────────────────────────────────────────────────
    if (vendorStatus === 'rejected') {
        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                    <div className="bg-red-500/10 text-red-500 rounded-full p-5 w-fit mx-auto mb-6">
                        <AlertCircle size={44} />
                    </div>
                    <h1 className="text-3xl font-black mb-3">Application Declined</h1>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                        Your vendor application was not approved at this time. Review the common reasons below, update your profile, and resubmit — our team will re-review within 24 hours.
                    </p>
                    <div className="bg-secondary/50 rounded-2xl p-4 text-left mb-6">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Common reasons for rejection</p>
                        <ul className="text-sm text-muted-foreground space-y-1.5 pl-4 list-disc">
                            <li>Incomplete or blurry documents</li>
                            <li>GSTIN does not match business address</li>
                            <li>Invalid KYC information (PAN / Aadhaar mismatch)</li>
                        </ul>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => navigate('/vendor/register')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 h-12">
                            ✏️ Update &amp; Resubmit
                        </Button>
                        <Button variant="outline" onClick={() => window.location.href = 'mailto:support@emibazaar.com'} className="rounded-xl font-bold px-6 h-12">
                            Contact Support
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── APPROVED: Show full dashboard ───────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Sidebar - Desktop */}
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden md:flex flex-col w-72 bg-card border-r border-border/60 p-5 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
            >
                <div className="flex items-center gap-3 px-3 mb-8">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
                        <Store size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight truncate max-w-[160px]">
                            {vendorProfile?.business_name || 'My Shop'}
                        </h2>
                        {vendorStatus === 'approved' ? (
                            <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                                <CheckCircle2 size={10} /> Verified Seller
                            </span>
                        ) : (
                            <span className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                                <Clock size={10} /> Pending Review
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                    {sidebarTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold text-left transition-all duration-300 relative overflow-hidden group hover:bg-secondary/80",
                                activeTab === tab.id ? "text-accent" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeVendorTab"
                                    className="absolute inset-0 bg-accent/10 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
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

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto w-full bg-secondary/20 p-4 md:p-8 lg:p-10 pb-24 md:pb-8">
                <AnimatePresence mode="wait">

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
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
                    )}

                    {/* Products & Inventory */}
                    {activeTab === 'inventory' && (
                        <motion.div key="inventory" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
                            <div className="p-8 border-b bg-secondary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-black">{isAddingProduct ? (editingProductId ? 'Edit Product' : 'Add New Product') : 'Product Management'}</h1>
                                    <p className="text-muted-foreground">{isAddingProduct ? (editingProductId ? 'Update your product listing details.' : 'Create a new offline/online product listing.') : 'Add products, update pricing, and manage stock.'}</p>
                                </div>
                                {!isAddingProduct && (
                                    <div className="flex w-full md:w-auto items-center gap-3">
                                        <div className="relative flex-1 md:w-64 group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <input 
                                                type="text" 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-background border rounded-full pl-9 pr-4 py-2 outline-none" 
                                                placeholder="Search products..." 
                                            />
                                        </div>
                                        <Button variant="accent" onClick={() => setIsAddingProduct(true)} className="rounded-full shadow-lg shadow-accent/20 font-bold px-6">
                                            <Plus size={18} className="mr-2" /> Add Product
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {isAddingProduct ? (
                                <div className="p-8 space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-1 md:col-span-2 flex items-center gap-4 bg-background p-4 rounded-xl border border-dashed border-border mb-2">
                                            <div className="flex gap-2 overflow-x-auto pb-2 max-w-[50%]">
                                                {productImageFiles.length > 0 ? (
                                                    productImageFiles.map((file, idx) => (
                                                        <div key={idx} className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center shrink-0 border overflow-hidden">
                                                            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover"/>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center shrink-0 border">
                                                        <Upload className="text-muted-foreground w-6 h-6"/>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <label className="font-bold text-sm block mb-1">Product Images (Multiple allowed)</label>
                                                <input type="file" multiple accept="image/*" onChange={e => setProductImageFiles(Array.from(e.target.files || []))} className="text-xs w-full text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer outline-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-bold text-xs uppercase text-muted-foreground">Product Name *</label>
                                            <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base" placeholder="Sony 65 inch TV" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-bold text-xs uppercase text-muted-foreground">Category *</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    list="category-suggestions"
                                                    value={selectedCategory} 
                                                    onChange={e => setSelectedCategory(e.target.value)} 
                                                    className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base capitalize" 
                                                    placeholder="Type or select a category (e.g. Mobiles)" 
                                                />
                                                <datalist id="category-suggestions">
                                                    {dbCategories.map(cat => (
                                                        <option key={cat.id} value={cat.name} />
                                                    ))}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-bold text-xs uppercase text-muted-foreground">Selling Price (₹) *</label>
                                            <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base" placeholder="55000" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-bold text-xs uppercase text-muted-foreground">Original MRP (₹)</label>
                                            <input type="number" value={newProduct.mrp} onChange={e => setNewProduct({...newProduct, mrp: e.target.value})} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base" placeholder="65000" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-bold text-xs uppercase text-muted-foreground">Stock Count</label>
                                            <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base" placeholder="10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                         <label className="font-bold text-xs uppercase text-muted-foreground">Description</label>
                                         <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base resize-none h-24" placeholder="Features, specifications..." />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-secondary">
                                        <Button variant="outline" onClick={() => { setIsAddingProduct(false); setEditingProductId(null); setNewProduct({ name: '', price: '', mrp: '', stock: '', description: '' }); }} disabled={isSavingProduct} className="rounded-xl font-bold px-6">Cancel</Button>
                                        <Button variant="accent" onClick={submitNewProduct} disabled={isSavingProduct} className="rounded-xl shadow-lg shadow-accent/20 font-bold px-8">
                                            {isSavingProduct ? 'Saving...' : (editingProductId ? 'Update Product' : 'Save Catalog')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="text-muted-foreground text-xs uppercase tracking-widest font-bold border-b">
                                                <th className="p-6">Product Item</th>
                                                <th className="p-6">EMI Tag / ID</th>
                                                <th className="p-6">Price Details</th>
                                                <th className="p-6">Stock Status</th>
                                                <th className="p-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fetchingProducts ? (
                                                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Loading products...</td></tr>
                                            ) : myProducts.length === 0 ? (
                                                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No products added yet. Start adding your inventory!</td></tr>
                                            ) : myProducts.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.short_tag.toLowerCase().includes(searchQuery.toLowerCase())).map((p, i) => (
                                                <tr key={i} className="group hover:bg-secondary/40 border-b last:border-0 transition-colors">
                                                    <td className="p-6 flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-white dark:bg-black/10 rounded-xl border flex items-center justify-center p-2 shrink-0">
                                                            <img src={p.image_url || 'https://via.placeholder.com/150'} alt={p.name} className="w-full h-full object-cover rounded-lg mix-blend-multiply dark:mix-blend-normal" />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-muted-foreground uppercase">{p.category?.name || 'Uncategorized'}</span>
                                                            <p className="font-bold text-base leading-tight max-w-[200px] truncate">{p.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="bg-secondary px-3 py-1.5 rounded-lg border inline-flex items-center gap-2">
                                                            <span className="font-black tracking-wider text-sm">{p.short_tag || 'PENDING'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="text-lg font-black shrink-0">₹{p.price?.toLocaleString() || 0}</p>
                                                        {p.original_price && <p className="text-xs text-muted-foreground line-through">MRP ₹{p.original_price.toLocaleString()}</p>}
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`${p.stock_count > 0 ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'} font-bold text-xs px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 shrink-0`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${p.stock_count > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div> {p.stock_count > 0 ? `In Stock (${p.stock_count})` : 'Out of Stock'}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(`/product/${p.short_tag}`)} title="View Customer Product Page"><Eye size={14} /></Button>
                                                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEditProduct(p)} title="Edit Product"><Edit size={14} /></Button>
                                                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20" onClick={() => handleDeleteProduct(p.id)} title="Delete Product"><Trash size={14} /></Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Orders Management */}
                    {activeTab === 'orders' && (
                        <motion.div key="orders" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
                            <div className="p-8 border-b bg-secondary/20">
                                <h1 className="text-2xl font-black">Orders Management</h1>
                                <p className="text-muted-foreground">View orders, accept new requests, and mark as completed.</p>
                            </div>
                            <div className="p-4">
                                {mockOrders.map((order, i) => (
                                    <div key={i} className="p-6 border rounded-2xl mb-4 bg-background flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                                <ShoppingBag size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-xs bg-secondary px-2 py-0.5 rounded uppercase tracking-wider">{order.id}</span>
                                                    <span className="text-xs text-muted-foreground">{order.date}</span>
                                                </div>
                                                <p className="font-bold text-lg leading-tight">{order.product}</p>
                                                <p className="text-sm font-medium text-muted-foreground mt-0.5">By {order.customer} • {order.type}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                                            <p className="font-black text-xl mb-2">{order.amount}</p>
                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                {order.status === 'Pending' ? (
                                                    <>
                                                        <Button variant="outline" className="flex-1 md:flex-none h-9 rounded-xl border-red-200 text-red-600 hover:bg-red-50">Reject</Button>
                                                        <Button variant="accent" className="flex-1 md:flex-none h-9 rounded-xl shadow-sm"><Check size={16} className="mr-1" /> Accept Order</Button>
                                                    </>
                                                ) : (
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                                                        <CheckCircle2 size={16} /> Completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Walk-in EMI (POS) */}
                    {activeTab === 'pos' && (
                        <motion.div key="pos" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-3xl mx-auto">
                            <div className="bg-card rounded-[2.5rem] p-8 md:p-12 border shadow-xl relative overflow-hidden">
                                <h1 className="text-3xl font-black tracking-tight mb-2">Create Walk-in EMI</h1>
                                <p className="text-muted-foreground font-medium mb-8">Set up 0% EMI instantly for customers visiting your physical store.</p>

                                {/* Stepper Progress */}
                                <div className="flex justify-between items-center mb-10 relative">
                                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-secondary -z-10 -translate-y-1/2"></div>
                                    <div className="absolute top-1/2 left-0 h-[2px] bg-accent -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${((posStep - 1) / 3) * 100}%` }}></div>

                                    {[1, 2, 3, 4].map(stepNum => (
                                        <div key={stepNum} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${posStep >= stepNum ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30' : 'bg-background border-border text-muted-foreground'}`}>
                                            {posStep > stepNum ? <Check size={14} strokeWidth={3} /> : stepNum}
                                        </div>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    {posStep === 1 && (
                                        <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={(e) => { e.preventDefault(); setPosStep(2); }} className="space-y-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="font-semibold text-muted-foreground">Customer Phone Number</label>
                                                <div className="relative">
                                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                                    <input type="tel" value={posPhone} onChange={e => setPosPhone(e.target.value)} className="w-full bg-secondary text-lg font-bold border-2 border-transparent focus:border-accent rounded-xl pl-12 pr-4 py-4 outline-none" placeholder="Enter customer number..." required minLength={10} />
                                                </div>
                                            </div>
                                            <Button type="submit" variant="accent" size="lg" className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-accent/20">Send OTP <ChevronRight size={20} className="ml-2" /></Button>
                                        </motion.form>
                                    )}

                                    {posStep === 2 && (
                                        <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={(e) => { e.preventDefault(); setPosStep(3); }} className="space-y-8 flex flex-col items-center">
                                            <div className="text-center">
                                                <h3 className="text-2xl font-bold">Verify Customer</h3>
                                                <p className="text-muted-foreground mt-1">Ask customer for the 4-digit code sent to them.</p>
                                            </div>
                                            <div className="flex justify-center gap-4">
                                                {posOtp.map((digit, idx) => (
                                                    <input key={idx} type="text" maxLength={1} value={digit} onChange={e => handlePosOtpChange(idx, e.target.value)} className="w-16 h-16 bg-background border-2 border-border focus:border-accent text-center text-3xl font-black rounded-xl outline-none" required />
                                                ))}
                                            </div>
                                            <div className="flex gap-4 w-full">
                                                <Button type="button" onClick={() => setPosStep(1)} variant="outline" size="lg" className="flex-1 h-14 rounded-xl border-2">Back</Button>
                                                <Button type="submit" variant="accent" size="lg" className="flex-[2] h-14 rounded-xl font-bold text-lg shadow-xl shadow-accent/20">Verify OTP</Button>
                                            </div>
                                        </motion.form>
                                    )}

                                    {posStep === 3 && (
                                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                            <div className="flex items-center gap-3 bg-green-500/10 p-4 rounded-xl border border-green-500/20 mb-6">
                                                <CheckCircle2 className="text-green-500 shrink-0" />
                                                <p className="font-semibold text-green-700 dark:text-green-400">Customer Verified! EMI Limit Available: <span className="font-black">₹1,20,000</span></p>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="font-semibold text-muted-foreground">1. Select Product</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {products.slice(0, 4).map((p, idx) => (
                                                        <div key={idx} onClick={() => setSelectedPosProduct(p)} className={`p-4 border-2 rounded-xl cursor-pointer flex flex-col gap-2 transition-all ${selectedPosProduct?.id === p.id ? 'border-accent bg-accent/5 shadow-md shadow-accent/10' : 'border-border hover:border-accent/40'}`}>
                                                            <div className="w-full h-20 bg-white dark:bg-black/10 rounded-lg p-2 mb-2"><img src={p.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" /></div>
                                                            <p className="font-bold text-sm leading-tight truncate">{p.name}</p>
                                                            <p className="text-accent font-black">₹{p.price.toLocaleString()}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {selectedPosProduct && (
                                                <div className="space-y-3 mt-6">
                                                    <label className="font-semibold text-muted-foreground">2. Select EMI Plan</label>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {getEmiPlans(selectedPosProduct.price).map((plan, idx) => (
                                                            <div key={idx} onClick={() => setPosEmiPlan(plan.months)} className={`p-4 border-2 rounded-xl cursor-pointer text-center transition-all relative ${posEmiPlan === plan.months ? 'border-accent bg-accent/5 shadow-md' : 'border-border hover:border-accent/40'}`}>
                                                                <p className="font-bold text-sm text-muted-foreground mb-1">{plan.months} Months</p>
                                                                <p className="font-black text-lg text-foreground">₹{plan.emi.toLocaleString('en-IN')}</p>
                                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">{plan.name}</p>
                                                                {plan.rate === 0 && <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-accent text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">0%</div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-4 w-full pt-4 border-t">
                                                <Button onClick={() => setPosStep(2)} variant="outline" size="lg" className="flex-1 h-14 rounded-xl border-2">Back</Button>
                                                <Button onClick={() => setPosStep(4)} disabled={!selectedPosProduct || !posEmiPlan} variant="accent" size="lg" className="flex-[2] h-14 rounded-xl font-bold text-lg shadow-xl shadow-accent/20">Generate AutoPay Link</Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {posStep === 4 && (
                                        <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-8">
                                            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                                                <Smartphone size={40} className="text-accent" />
                                            </div>
                                            <h2 className="text-3xl font-black mb-3">Link Sent to Customer</h2>
                                            <p className="text-muted-foreground text-lg max-w-sm mb-8">
                                                Customer has received an SMS. Ask them to click the link to setup their UPI AutoPay and confirm the order.
                                            </p>
                                            <div className="w-full bg-secondary/50 p-6 rounded-2xl border mb-8 flex items-center justify-between">
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-muted-foreground">Waiting for customer...</p>
                                                    <p className="font-bold">AutoPay Setup Pending</p>
                                                </div>
                                                <div className="w-6 h-6 border-4 border-accent border-r-transparent rounded-full animate-spin"></div>
                                            </div>
                                            <Button onClick={() => { setPosStep(1); setSelectedPosProduct(null); setPosEmiPlan(null); setPosOtp(['', '', '', '']); setPosPhone(''); }} variant="outline" className="w-full h-14 rounded-xl font-bold border-2">
                                                Create Another EMI Order
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}

                    {/* Customers Management */}
                    {activeTab === 'customers' && (
                        <motion.div key="customers" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
                            <div className="p-8 border-b bg-secondary/20">
                                <h1 className="text-2xl font-black">Customer Management</h1>
                                <p className="text-muted-foreground">View your customer base, EMI standing, and payment statuses.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="text-muted-foreground text-xs uppercase tracking-widest font-bold border-b border-border/50">
                                            <th className="p-6">Customer Details</th>
                                            <th className="p-6">Total Spent</th>
                                            <th className="p-6">Active EMIs</th>
                                            <th className="p-6">Account Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mockCustomers.map((c, i) => (
                                            <tr key={i} className="hover:bg-secondary/40 border-b last:border-0 transition-colors">
                                                <td className="p-6">
                                                    <p className="font-bold text-base">{c.name}</p>
                                                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">{c.phone}</p>
                                                </td>
                                                <td className="p-6 font-black text-lg">{c.totalSpent}</td>
                                                <td className="p-6">
                                                    <span className="bg-secondary font-bold px-3 py-1 rounded-full">{c.activeEmis} Plans</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`font-bold text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1 shrink-0 ${c.status === 'Good Standing' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                        c.status === 'Paid Off' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        }`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Shop Registration & Profile */}
                    {activeTab === 'registration' && (
                        <motion.div key="registration" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm max-w-4xl mx-auto">
                            <div className="p-8 border-b bg-secondary/20 flex items-center gap-4">
                                <div className="p-4 bg-accent/10 rounded-2xl text-accent"><Settings size={32} /></div>
                                <div>
                                    <h1 className="text-2xl font-black">Shop Profile & Details</h1>
                                    <p className="text-muted-foreground">Information submitted during onboarding. To update these, contact support.</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-lg border-b pb-2">Business Details</h3>
                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Legal Shop Name</label>
                                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none">{vendorProfile?.business_name || 'N/A'}</div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Category</label>
                                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none">{vendorProfile?.category || 'N/A'}</div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">GSTIN Number</label>
                                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none uppercase">{vendorProfile?.gstin || 'N/A'}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-bold text-lg border-b pb-2">KYC & Bank Details</h3>
                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">PAN Number</label>
                                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none uppercase">{vendorProfile?.pan || 'N/A'}</div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Aadhaar / KYC Details</label>
                                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none truncate">Verified securely on {vendorProfile?.submitted_at ? new Date(vendorProfile?.submitted_at).toLocaleDateString() : 'Submission'}</div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Payout Account</label>
                                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none">
                                                A/C: {vendorProfile?.account_no ? '****' + vendorProfile.account_no.slice(-4) : 'N/A'} • IFSC: {vendorProfile?.ifsc || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                     <h3 className="font-bold text-lg border-b pb-2">Location Setup</h3>
                                     <div className="flex flex-col gap-2">
                                         <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Physical Address</label>
                                         <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium whitespace-pre-wrap select-none min-h-[80px]">{vendorProfile?.address || 'N/A'}</div>
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
                        className={`flex flex-col items-center justify-center w-full gap-1 p-2 ${activeTab === tab.id ? "text-accent" : "text-muted-foreground"
                            }`}
                    >
                        <tab.icon size={20} className={activeTab === tab.id ? "stroke-[2.5]" : "opacity-80"} />
                        <span className="text-[10px] font-bold leading-none select-none tooltip">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {productToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-card w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border"
                        >
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-center mb-3">Delete Product?</h2>
                            <p className="text-center text-muted-foreground mb-8 text-sm">
                                Are you sure you want to delete this product? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setProductToDelete(null)}
                                    className="flex-1 rounded-xl h-12 font-bold"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="accent"
                                    onClick={confirmDeleteProduct}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-500/20 border-red-600"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
