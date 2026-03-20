import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { products as mockProducts, getEmiPlans } from '../data/mockData';
import { Store, Truck, MapPin, Building, Lock, CreditCard, Landmark, CheckCircle2, ChevronRight, ShieldCheck, Fingerprint, Phone, Home, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../features/auth';
import { productsApi } from '../features/products';
import { toast } from 'sonner';

export default function Checkout() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    
    // State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [deliveryMode, setDeliveryMode] = useState('pickup');
    const [autoPayMethod, setAutoPayMethod] = useState('');
    const [orderSuccess, setOrderSuccess] = useState<any>(null);

    const productId = searchParams.get('productId');
    const planIndex = parseInt(searchParams.get('planIndex') || '0');

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("Please login to proceed with checkout");
            navigate(`/auth?redirect=/checkout?${searchParams.toString()}`);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Product
                if (productId) {
                    const prod = await productsApi.getProductById(productId);
                    if (prod) {
                        setProduct(prod);
                        const plans = (prod.emiPlans && prod.emiPlans.length > 0)
                            ? prod.emiPlans.map((p: any) => ({
                                ...p, emi: Math.round(((prod.price * (p.interestRate || 0) * p.duration) / (p.type === 'weekly' ? 5200 : 1200) + prod.price) / p.duration)
                            }))
                            : getEmiPlans(prod.price);
                        setSelectedPlan(plans[planIndex] || plans[0]);
                    }
                }

                // 2. Fetch Profile
                const { data: prof } = await supabase
                    .from('customer_profiles')
                    .select('*')
                    .eq('user_id', user?.id)
                    .single();
                setProfile(prof);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load checkout details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId, planIndex, isAuthenticated, user?.id, searchParams]);

    const handleConfirmOrder = async () => {
        if (!user || !product || !selectedPlan || !profile) return;
        
        setLoading(true);
        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + 1);

        const principal = Number(product.price);
        const rate = Number(selectedPlan.interestRate || selectedPlan.rate || 0);
        const duration = Number(selectedPlan.duration || selectedPlan.months);
        const type = selectedPlan.type || 'monthly';
        
        const total = Math.round(principal + (principal * rate * duration) / (type === 'weekly' ? 5200 : 1200));
        const emi = Math.round(total / duration);

        try {
            // Simulated delay to "setup AutoPay Mandate" with Bank / UPI
            toast.loading("Setting up Secure EMI Mandate...", { id: 'setup' });
            await new Promise(r => setTimeout(r, 2000));
            toast.loading("Verifying AutoPay with NPCI...", { id: 'setup' });
            await new Promise(r => setTimeout(r, 1500));
            toast.dismiss('setup');

            const { data, error } = await supabase.rpc('create_online_emi_order', {
                p_customer_id: user.id,
                p_vendor_id: product.vendorId || product.vendor_id || product.shops?.vendor_id,
                p_shop_id: product.shopId || product.shop_id,
                p_product_id: product.id,
                p_product_price: principal,
                p_down_payment: 0,
                p_principal_amount: principal,
                p_interest_rate: rate,
                p_total_amount: total,
                p_emi_amount: emi,
                p_duration_count: duration,
                p_duration_type: type,
                p_next_due_date: nextDue.toISOString().split('T')[0]
            });

            if (error) {
                console.error("RPC Error:", error);
                throw new Error(error.message || "Failed to call checkout procedure");
            }

            if (data.success) {
                setOrderSuccess(data);
                setStep(4);
                toast.success("EMI Order Placed Successfully!");
            } else {
                if (data.error === 'KYC_NOT_VERIFIED') {
                    toast.error("Your KYC is not verified yet.");
                } else {
                    toast.error(data.error || "Failed to create order");
                }
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred during checkout");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !product) {
        return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (!product) {
        return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold">Product not found</h2>
            <Button onClick={() => navigate('/')}>Return to Shopping</Button>
        </div>;
    }

    const nextStep = () => {
        if (step === 2 && profile?.kyc_status !== 'verified') {
            toast.error("Please verify your KYC to proceed");
            return;
        }
        setStep(prev => prev + 1);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 container mx-auto">
            <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
                {/* Left Col - Stepper Form */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
                    <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden relative min-h-[500px]">

                        {/* Progress */}
                        <div className="flex bg-secondary/50 border-b border-border text-sm font-medium">
                            <div className={`flex-1 py-4 text-center border-b-2 ${step >= 1 ? 'border-accent text-accent' : 'border-transparent text-muted-foreground'}`}>Delivery</div>
                            <div className={`flex-1 py-4 text-center border-b-2 ${step >= 2 ? 'border-accent text-accent' : 'border-transparent text-muted-foreground'}`}>Details</div>
                            <div className={`flex-1 py-4 text-center border-b-2 ${step >= 3 ? 'border-accent text-accent' : 'border-transparent text-muted-foreground'}`}>AutoPay</div>
                            <div className={`flex-1 py-4 text-center border-b-2 ${step === 4 ? 'border-accent text-accent' : 'border-transparent text-muted-foreground'}`}>Confirm</div>
                        </div>

                        <AnimatePresence mode="wait">
                            {/* Step 1: Delivery Mode */}
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                                    <h2 className="text-2xl font-bold mb-6">Choose Delivery Mode</h2>
                                    <div className="space-y-4">
                                        <div
                                            onClick={() => setDeliveryMode('pickup')}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer flex items-start gap-4 transition-all ${deliveryMode === 'pickup' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'}`}
                                        >
                                            <div className={`p-3 rounded-full ${deliveryMode === 'pickup' ? 'bg-accent text-white' : 'bg-secondary text-foreground'}`}>
                                                <Store size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">Pick up at Store (Recommended)</h3>
                                                <p className="text-sm text-muted-foreground mb-2">Get it today directly from {product.shopName}. No delivery fees.</p>
                                                {deliveryMode === 'pickup' && <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">Available Today</span>}
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setDeliveryMode('delivery')}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer flex items-start gap-4 transition-all ${deliveryMode === 'delivery' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'}`}
                                        >
                                            <div className={`p-3 rounded-full ${deliveryMode === 'delivery' ? 'bg-accent text-white' : 'bg-secondary text-foreground'}`}>
                                                <Truck size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">Home Delivery</h3>
                                                <p className="text-sm text-muted-foreground mb-2">Delivered to your doorstep within 2-3 business days.</p>
                                                {deliveryMode === 'delivery' && <span className="text-xs font-bold text-accent px-2 py-1 rounded bg-accent/10">₹149 Delivery Fee</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end">
                                        <Button onClick={nextStep} variant="accent" size="lg" className="rounded-xl px-8 shadow-lg shadow-accent/20">Continue <ChevronRight size={18} className="ml-2" /></Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Customer Details */}
                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                                    <h2 className="text-2xl font-bold mb-6">Verify Identity</h2>

                                    <div className="space-y-4">
                                        {profile?.kyc_status !== 'verified' ? (
                                            <div className="bg-orange-500/10 border-2 border-orange-500/20 p-6 rounded-3xl flex flex-col items-center text-center gap-4">
                                                <div className="w-16 h-16 bg-orange-500/20 text-orange-600 rounded-full flex items-center justify-center">
                                                    <AlertCircle size={32} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-orange-700 dark:text-orange-400">KYC Verification Required</h3>
                                                    <p className="text-sm text-muted-foreground mt-2">To complete your purchase, we need to verify your PAN and Aadhaar documents for instant EMI financing.</p>
                                                </div>
                                                <Button onClick={() => navigate('/profile')} variant="accent" className="rounded-xl w-full py-6 font-bold">Go to KYC Gateway</Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-green-500/10 p-6 rounded-3xl border border-green-500/20 flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                                        <ShieldCheck size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-green-700 dark:text-green-400">Identity Verified</p>
                                                        <p className="text-xs text-green-600/80">Your credit profile is active and ready.</p>
                                                    </div>
                                                </div>

                                                <div className="bg-secondary/30 p-5 rounded-2xl border">
                                                    <h3 className="font-semibold flex items-center gap-2 mb-4"><MapPin size={18} /> Delivery Address</h3>
                                                    <p className="text-sm font-bold">{profile.full_name}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{profile.address || 'Address not listed, will use billing address.'}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{profile.phone}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-8 flex justify-between">
                                        <Button onClick={() => setStep(1)} variant="ghost" className="rounded-xl text-muted-foreground">Back</Button>
                                        <Button 
                                            onClick={nextStep} 
                                            disabled={profile?.kyc_status !== 'verified'}
                                            variant="accent" 
                                            size="lg" 
                                            className="rounded-xl px-8 shadow-lg shadow-accent/20"
                                        >
                                            Continue to Payment <ChevronRight size={18} className="ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: AutoPay Setup */}
                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                                    <h2 className="text-2xl font-bold mb-2">Setup AutoPay</h2>
                                    <p className="text-sm text-muted-foreground mb-6">Set up continuous mandate for monthly EMI deductions.</p>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'upi', name: 'UPI AutoPay', desc: 'PhonePe / GPay', icon: 'U' },
                                            { id: 'bank', name: 'Bank e-Mandate', desc: 'NetBanking / Debit Card', icon: <Landmark size={20} /> },
                                            { id: 'card', name: 'Credit/Debit Card', desc: 'Direct card mandate', icon: <CreditCard size={20} /> }
                                        ].map(method => (
                                            <div
                                                key={method.id}
                                                onClick={() => setAutoPayMethod(method.id)}
                                                className={`p-4 border-2 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${autoPayMethod === method.id ? 'border-accent bg-accent/5 ring-4 ring-accent/10' : 'border-border hover:bg-secondary'}`}
                                            >
                                                <div className="w-12 h-12 bg-card rounded-xl border flex items-center justify-center font-black text-xl shadow-sm">
                                                    {typeof method.icon === 'string' ? method.icon : method.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold">{method.name}</h4>
                                                    <p className="text-xs text-muted-foreground">{method.desc}</p>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${autoPayMethod === method.id ? 'border-accent bg-accent' : 'border-muted-foreground'}`}>
                                                    {autoPayMethod === method.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                </div>
                                            </div>
                                        ))}

                                        <div className="mt-10 flex justify-between pt-4 border-t">
                                            <Button type="button" onClick={() => setStep(2)} variant="ghost" className="rounded-xl text-muted-foreground">Back</Button>
                                            <Button 
                                                onClick={handleConfirmOrder} 
                                                disabled={!autoPayMethod || loading} 
                                                variant="accent" 
                                                size="lg" 
                                                className="rounded-xl px-10 h-14 font-black shadow-xl shadow-accent/20"
                                            >
                                                {loading ? 'Processing EMI...' : 'Process Order & EMI'}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Confirmation */}
                            {step === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 md:p-12 flex flex-col items-center text-center">
                                    <div className="bg-green-500/10 text-green-500 rounded-full p-8 mb-6 relative">
                                        <CheckCircle2 size={64} strokeWidth={2.5} className="z-10 relative" />
                                        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-green-500/20 rounded-full" />
                                    </div>
                                    <h2 className="text-4xl font-black mb-2 tracking-tight">Request Sent!</h2>
                                    <p className="text-muted-foreground mb-8 text-lg font-medium">
                                        Your AutoPay is linked. Contract <span className="text-foreground font-mono font-bold bg-secondary px-2 py-0.5 rounded">{orderSuccess?.short_id}</span> is awaiting vendor approval.
                                    </p>

                                    <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl mb-10 overflow-x-auto pb-4">
                                        <div className="bg-secondary/30 p-8 rounded-[2.5rem] flex-1 border border-border/50 backdrop-blur-sm relative overflow-hidden min-w-[300px]">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 text-center">Reference: Product ID</p>
                                            <div className="bg-white p-4 rounded-3xl block mb-6 shadow-xl ring-1 ring-black/5 mx-auto w-fit">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${product.shortTag}`} alt="Product Tag" className="w-[150px] h-[150px] mix-blend-multiply mx-auto" />
                                            </div>
                                            <p className="font-mono font-black text-2xl tracking-[0.2em] text-accent text-center uppercase">{product.shortTag || 'PRODUCT'}</p>
                                            <p className="text-[10px] text-center text-muted-foreground mt-2 font-bold select-none">Show this during product pickup</p>
                                        </div>

                                        <div className="bg-secondary/30 p-8 rounded-[2.5rem] flex-1 border border-border/50 backdrop-blur-sm relative overflow-hidden min-w-[300px]">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 text-center">Reference: Contract ID</p>
                                            <div className="bg-white p-4 rounded-3xl block mb-6 shadow-xl ring-1 ring-black/5 mx-auto w-fit">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${orderSuccess?.short_id}`} alt="Contract ID" className="w-[150px] h-[150px] mix-blend-multiply mx-auto" />
                                            </div>
                                            <p className="font-mono font-black text-2xl tracking-[0.2em] text-accent text-center uppercase">{orderSuccess?.short_id || 'ORDER'}</p>
                                            <p className="text-[10px] text-center text-muted-foreground mt-2 font-bold select-none">Reference for your EMI ledger</p>
                                        </div>
                                    </div>

                                    <Button onClick={() => navigate('/profile')} variant="outline" className="rounded-2xl border-2 font-black px-12 h-14 hover:bg-secondary text-lg">Manage My EMIs</Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Right Col - Order Summary */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-[420px] shrink-0">
                    <div className="bg-card border border-border/60 rounded-[3rem] p-10 shadow-sm sticky top-24">
                        <div className="flex items-center gap-2 mb-8">
                            <Sparkles className="text-accent" size={20} />
                            <h3 className="text-2xl font-black tracking-tight">Purchase Summary</h3>
                        </div>

                        <div className="flex gap-5 mb-8">
                            <div className="w-24 h-24 bg-white dark:bg-black/20 rounded-[1.5rem] border border-border/50 p-3 shrink-0 shadow-inner flex items-center justify-center">
                                <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className="font-black leading-tight mb-1 text-lg">{product.name}</h4>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Authorized by {product.shopName || 'Partner'}</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm mb-8 pb-8 border-b border-border/50">
                            <div className="flex justify-between font-medium">
                                <span className="text-muted-foreground">Product Price</span>
                                <span>₹{Number(product.price).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                                <span className="text-muted-foreground">Interest ({selectedPlan?.rate || 0}% p.a)</span>
                                <span className="text-accent underline decoration-accent/30">+₹{Math.round((Number(product.price) * (selectedPlan?.rate || 0) * (selectedPlan?.duration || selectedPlan?.months || 6)) / (selectedPlan?.type === 'weekly' ? 5200 : 1200)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-medium pt-2 border-t border-border/30">
                                <span className="text-foreground font-black">Total Payable</span>
                                <span className="text-foreground font-black">₹{Math.round(Number(product.price) + (Number(product.price) * (selectedPlan?.rate || 0) * (selectedPlan?.duration || selectedPlan?.months || 6)) / (selectedPlan?.type === 'weekly' ? 5200 : 1200)).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Selected EMI Plan</p>
                            <div className="bg-accent/5 rounded-[1.5rem] p-6 border border-accent/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-accent/10 rounded-bl-full" />
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <p className="font-black text-3xl text-accent">₹{selectedPlan?.emi?.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-tighter">Per {selectedPlan?.type === 'weekly' ? 'Week' : 'Month'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg">{selectedPlan?.duration || selectedPlan?.months} {selectedPlan?.type === 'weekly' ? 'Weeks' : 'Months'}</p>
                                        <p className="text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-full mt-1 border border-accent/20">0 DOWN PAYMENT</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
                                <ShieldCheck size={20} className="text-green-500 shrink-0" />
                                <p className="text-xs font-bold text-green-700 dark:text-green-400">Secured with Fingerprint / OTP Token</p>
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground font-medium px-4">
                                By proceeding, you agree to the <span className="underline">Loan Agreement</span> and <span className="underline">AutoPay T&Cs</span> as mandated by RBI.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
