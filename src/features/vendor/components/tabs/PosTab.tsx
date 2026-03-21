import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, CheckCircle2, Smartphone, ChevronRight, Search, ShieldCheck,
    ShieldAlert, FileText, User, AlertCircle, CreditCard, Package,
    Loader2, RefreshCw, KeyRound
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'sonner';

interface PosTabProps {
    posStep: number; setPosStep: (step: number) => void;
    posPhone: string; setPosPhone: (p: string) => void;
    posOtp: string[]; handlePosOtpChange: (idx: number, val: string) => void;
    selectedPosProduct: any; setSelectedPosProduct: (p: any) => void;
    posEmiPlan: number | null; setPosEmiPlan: (n: number | null) => void;
    setPosOtp: (otp: string[]) => void;
}

export default function PosTab(_props: PosTabProps) {
    // ─── Core State ───────────────────────────────────────────────
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [customer, setCustomer] = useState<any>(null);   // fetched profile row
    const [customerId, setCustomerId] = useState('');

    // OTP state
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otpInput, setOtpInput] = useState(['', '', '', '']);
    const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    // Product state
    const [productShortId, setProductShortId] = useState('');
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [product, setProduct] = useState<any>(null);

    // Contract state
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [downPayment, setDownPayment] = useState('');
    const [isCreatingContract, setIsCreatingContract] = useState(false);
    const [createdContract, setCreatedContract] = useState<any>(null);
    const [isVerifyingKyc, setIsVerifyingKyc] = useState(false);

    // ─── Reset ────────────────────────────────────────────────────
    const reset = () => {
        setStep(1); setPhone(''); setCustomer(null); setCustomerId('');
        setGeneratedOtp(''); setOtpInput(['', '', '', '']);
        setProductShortId(''); setProduct(null);
        setSelectedPlan(null); setDownPayment(''); setCreatedContract(null);
    };

    // ─── Step 1: Lookup or register customer by phone ─────────────
    const handleLookupCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) { toast.error('Enter a valid 10-digit phone number'); return; }
        setIsSearchingCustomer(true);

        try {
            // Secure RPC that bypasses RLS to lookup customer by phone
            const { data, error } = await supabase.rpc('get_customer_by_phone', { p_phone: cleanPhone });

            if (error) throw error;

            // SETOF json returns an array of raw JSON objects
            if (!data || data.length === 0) {
                toast.error('No customer account found with this phone number. Ask the customer to register in the EMI Bazaar app first.');
                setIsSearchingCustomer(false);
                return;
            }

            const profile = data[0];
            setCustomer(profile);
            setCustomerId(profile.user_id);

            // Generate 4-digit in-store OTP
            const otp = String(Math.floor(1000 + Math.random() * 9000));
            setGeneratedOtp(otp);
            setOtpInput(['', '', '', '']);
            toast.success(`Customer found: ${profile.full_name || 'Unknown'}`, { duration: 3000 });
            setStep(2);
        } catch (err: any) {
            toast.error(err.message || 'Failed to lookup customer');
        } finally {
            setIsSearchingCustomer(false);
        }
    };

    // ─── Step 2: Handle OTP digit input ──────────────────────────
    const handleOtpChange = (idx: number, val: string) => {
        if (!/^[0-9]?$/.test(val)) return;
        const next = [...otpInput];
        next[idx] = val;
        setOtpInput(next);
        if (val && idx < 3) otpRefs[idx + 1].current?.focus();
    };

    const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpInput[idx] && idx > 0) {
            otpRefs[idx - 1].current?.focus();
        }
    };

    const handleVerifyOtp = () => {
        const entered = otpInput.join('');
        if (entered.length < 4) { toast.error('Enter all 4 digits'); return; }
        if (entered !== generatedOtp) {
            toast.error('Incorrect OTP. Ask the customer to check again.');
            setOtpInput(['', '', '', '']);
            otpRefs[0].current?.focus();
            return;
        }
        toast.success('OTP verified! Customer identity confirmed.');
        setStep(3);
    };

    // ─── Step 3: Verify KYC ───────────────────────────────────────
    const handleVerifyKyc = async () => {
        if (!customer?.profile_id && !customerId) return;
        setIsVerifyingKyc(true);

        // Upsert customer_profile with verified status
        const { error } = await supabase
            .from('customer_profiles')
            .upsert({ user_id: customerId, kyc_status: 'verified' }, { onConflict: 'user_id' });

        if (error) { toast.error('Failed to verify KYC: ' + error.message); setIsVerifyingKyc(false); return; }

        setCustomer({ ...customer, kyc_status: 'verified' });
        toast.success('Customer KYC verified globally!');
        setIsVerifyingKyc(false);
        setStep(4);
    };

    // ─── Step 4: Find product ─────────────────────────────────────
    const handleProductSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productShortId.trim()) return;
        setIsSearchingProduct(true);

        const { data, error } = await supabase
            .from('products')
            .select('*, shops(id, vendor_id)')
            .ilike('short_tag', productShortId.trim())
            .single();

        if (error || !data) {
            toast.error('Product not found. Check the Short ID printed on the tag.');
            setIsSearchingProduct(false);
            return;
        }
        if (data.stock_count <= 0) {
            toast.error('Product is out of stock. Please update the inventory first.');
            setIsSearchingProduct(false);
            return;
        }

        setProduct(data);
        setIsSearchingProduct(false);
        setStep(5);
    };

    // ─── Step 6: Create Contract ──────────────────────────────────
    const handleCreateContract = async () => {
        if (!customer || !product || !selectedPlan) return;
        setIsCreatingContract(true);

        try {
            const { data: authData } = await supabase.auth.getUser();
            if (!authData.user) throw new Error('Not authenticated as vendor');

            const down = parseFloat(downPayment) || 0;
            const principal = product.price - down;
            if (principal <= 0) { toast.error('Down payment cannot exceed product price'); setIsCreatingContract(false); return; }

            const interestAmount = (principal * (selectedPlan.interestRate / 100) * selectedPlan.duration) / 12;
            const totalAmount = principal + interestAmount;
            const emiAmount = totalAmount / selectedPlan.duration;

            const nextDue = new Date();
            if (selectedPlan.type === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
            else nextDue.setDate(nextDue.getDate() + 7);

            const shortId = 'EMI-' + Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data: contract, error } = await supabase.from('emi_contracts').insert({
                short_id: shortId,
                customer_id: customerId,
                vendor_id: authData.user.id,
                shop_id: product.shops?.id,
                product_id: product.id,
                product_price: product.price,
                down_payment: down,
                principal_amount: principal,
                interest_rate: selectedPlan.interestRate,
                total_amount: Number(totalAmount.toFixed(2)),
                emi_amount: Number(emiAmount.toFixed(2)),
                duration_count: selectedPlan.duration,
                duration_type: selectedPlan.type,
                next_due_date: nextDue.toISOString().split('T')[0],
                status: 'active'
            }).select().single();

            if (error) throw error;
            
            // ─── Phase 1: Automated Inventory Sync ───
            // Decrement stock count for the product
            if (product.stock_count !== undefined) {
                const { error: stockError } = await supabase
                    .from('products')
                    .update({ stock_count: Math.max(0, (product.stock_count || 0) - 1) })
                    .eq('id', product.id);

                if (stockError) {
                    console.error('Failed to decrement inventory:', stockError);
                    toast.error('Contract created but failed to update inventory count.');
                }
            }

            setCreatedContract(contract);
            setStep(7);
            toast.success('EMI Contract created successfully! 🎉');
        } catch (err: any) {
            toast.error(err.message || 'Failed to create contract');
        } finally {
            setIsCreatingContract(false);
        }
    };

    const TOTAL_STEPS = 6;
    const stepLabels = ['Find Customer', 'Verify OTP', 'KYC Check', 'Find Product', 'Pick Plan', 'Confirm'];

    return (
        <motion.div key="pos" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-3xl mx-auto">
            <div className="bg-card rounded-[2.5rem] p-8 md:p-12 border shadow-xl relative overflow-hidden">
                <h1 className="text-3xl font-black tracking-tight mb-1">Walk-in EMI — POS</h1>
                <p className="text-muted-foreground font-medium mb-8">Set up EMI instantly for customers visiting your physical store.</p>

                {/* Stepper */}
                {step < 7 && (
                    <div className="mb-10">
                        <div className="flex justify-between items-center relative">
                            <div className="absolute top-4 left-0 w-full h-[2px] bg-secondary -z-10" />
                            <div className="absolute top-4 left-0 h-[2px] bg-accent -z-10 transition-all duration-500" style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }} />
                            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
                                const s = i + 1;
                                return (
                                    <div key={s} className="flex flex-col items-center gap-1.5">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${step > s ? 'bg-accent border-accent text-white' : step === s ? 'bg-accent border-accent text-white ring-4 ring-accent/20' : 'bg-background border-border text-muted-foreground'}`}>
                                            {step > s ? <Check size={12} strokeWidth={3} /> : s}
                                        </div>
                                        <span className="text-[9px] font-bold text-muted-foreground hidden sm:block">{stepLabels[i]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">

                    {/* ── STEP 1: Enter Phone ── */}
                    {step === 1 && (
                        <motion.form key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleLookupCustomer} className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Customer Phone Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-secondary text-lg font-bold border-2 border-transparent focus:border-accent rounded-xl pl-12 pr-4 py-4 outline-none" placeholder="e.g. 9876543210" required minLength={10} maxLength={13} />
                                </div>
                                <p className="text-xs text-muted-foreground">Enter the number used during app registration.</p>
                            </div>
                            <Button type="submit" variant="accent" size="lg" className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-accent/20" disabled={isSearchingCustomer}>
                                {isSearchingCustomer ? <><Loader2 size={20} className="animate-spin mr-2" />Searching...</> : <>Find Customer <ChevronRight size={20} className="ml-1" /></>}
                            </Button>
                        </motion.form>
                    )}

                    {/* ── STEP 2: OTP Verification ── */}
                    {step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4"><KeyRound size={32} className="text-accent" /></div>
                                <h3 className="text-2xl font-black">Confirm Customer Identity</h3>
                                <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">Show the 4-digit code below to your customer. Ask them to read it out loud so you can verify it's really them.</p>
                            </div>

                            {/* The OTP to show to vendor (they show to customer) */}
                            <div className="bg-accent/10 border-2 border-accent/30 rounded-2xl p-6 text-center">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">One-Time Code — Show to Customer</p>
                                <p className="text-6xl font-black tracking-[1rem] text-accent">{generatedOtp}</p>
                                <p className="text-xs text-muted-foreground mt-3">Valid for this session only</p>
                            </div>

                            {/* Vendor types what customer says */}
                            <div>
                                <p className="font-semibold text-sm text-muted-foreground text-center mb-4">Ask the customer to read back the code. Enter it below:</p>
                                <div className="flex justify-center gap-3">
                                    {otpInput.map((digit, idx) => (
                                        <input
                                            key={idx} ref={otpRefs[idx]} type="text" maxLength={1} value={digit}
                                            onChange={e => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                                            className="w-16 h-16 bg-background border-2 border-border focus:border-accent text-center text-3xl font-black rounded-xl outline-none transition-colors"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl border-2 font-bold">← Back</Button>
                                <Button variant="accent" onClick={handleVerifyOtp} className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-accent/20">
                                    <Check size={18} className="mr-2" /> Confirm OTP
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3: KYC Check ── */}
                    {step === 3 && customer && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <label className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Review Customer KYC Documents</label>

                            {/* Customer Card */}
                            <div className="bg-secondary/50 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-accent font-black text-xl overflow-hidden shrink-0">
                                    {customer.avatar_url ? <img src={customer.avatar_url} alt="" className="w-full h-full object-cover" /> : (customer.full_name?.charAt(0) || '?')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-lg truncate">{customer.full_name || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${customer.kyc_status === 'verified' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                    {customer.kyc_status === 'verified' ? '✓ Verified' : '⚠ Pending'}
                                </span>
                            </div>

                            {/* KYC Doc previews */}
                            {customer.kyc_status !== 'verified' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border rounded-xl p-4 space-y-2">
                                            <p className="flex items-center gap-2 font-semibold text-sm"><User size={16} /> PAN Card</p>
                                            {customer.pan_number && <p className="font-mono text-sm text-muted-foreground">{customer.pan_number}</p>}
                                            {customer.pan_url
                                                ? <a href={customer.pan_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-500 font-semibold hover:underline"><FileText size={13} /> View Document</a>
                                                : <p className="text-xs text-orange-500">Not uploaded</p>}
                                        </div>
                                        <div className="border rounded-xl p-4 space-y-2">
                                            <p className="flex items-center gap-2 font-semibold text-sm"><ShieldCheck size={16} /> Aadhaar Card</p>
                                            {customer.aadhaar_number && <p className="font-mono text-sm text-muted-foreground">{customer.aadhaar_number.replace(/.(?=.{4})/g, '*')}</p>}
                                            {customer.aadhaar_url
                                                ? <a href={customer.aadhaar_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-500 font-semibold hover:underline"><FileText size={13} /> View Document</a>
                                                : <p className="text-xs text-orange-500">Not uploaded</p>}
                                        </div>
                                    </div>
                                    {!customer.pan_url && !customer.aadhaar_url && (
                                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
                                            <ShieldAlert size={20} className="text-orange-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-orange-700 dark:text-orange-400">No documents uploaded yet. Verify by asking customer to show their original PAN and Aadhaar physically.</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {customer.kyc_status === 'verified' && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                                    <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                                    <div>
                                        <p className="font-bold text-green-700 dark:text-green-400">Platform Verified — No action needed!</p>
                                        <p className="text-xs text-green-600/80 mt-0.5">This customer was verified in a previous session.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl border-2 font-bold">← Back</Button>
                                {customer.kyc_status !== 'verified' ? (
                                    <Button variant="accent" onClick={handleVerifyKyc} className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-accent/20" disabled={isVerifyingKyc}>
                                        {isVerifyingKyc ? <><Loader2 size={18} className="animate-spin mr-2" />Verifying...</> : <><ShieldCheck size={18} className="mr-2" />Confirm KYC & Proceed</>}
                                    </Button>
                                ) : (
                                    <Button variant="accent" onClick={() => setStep(4)} className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-accent/20">
                                        Proceed to Product <ChevronRight size={18} className="ml-1" />
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 4: Search Product ── */}
                    {step === 4 && (
                        <motion.form key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleProductSearch} className="space-y-5">
                            <label className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Scan / Enter Product Short ID</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <input type="text" value={productShortId} onChange={e => setProductShortId(e.target.value.toUpperCase())} className="w-full bg-secondary text-lg font-black border-2 border-transparent focus:border-accent rounded-xl pl-12 pr-4 py-4 outline-none tracking-widest uppercase" placeholder="PROD-XXXXXX" required />
                            </div>
                            <p className="text-xs text-muted-foreground">Scan QR or type the tag printed on the product shelf label.</p>
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl border-2 font-bold">← Back</Button>
                                <Button type="submit" variant="accent" className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-accent/20" disabled={isSearchingProduct}>
                                    {isSearchingProduct ? <><Loader2 size={18} className="animate-spin mr-2" />Searching...</> : <><Package size={18} className="mr-2" />Find Product</>}
                                </Button>
                            </div>
                        </motion.form>
                    )}

                    {/* ── STEP 5: Select EMI Plan ── */}
                    {step === 5 && product && (
                        <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <label className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Select EMI Plan</label>
                            <div className="flex items-center gap-4 bg-secondary/50 rounded-2xl p-4">
                                {product.image_url && <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0 bg-white" />}
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-base truncate">{product.name}</p>
                                    <p className="text-accent font-black text-xl">₹{Number(product.price).toLocaleString('en-IN')}</p>
                                    <p className="text-xs font-mono text-muted-foreground">{product.short_tag}</p>
                                </div>
                            </div>
                            {Array.isArray(product.emi_plans) && product.emi_plans.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {product.emi_plans.map((plan: any, idx: number) => {
                                        const emi = plan.interestRate === 0
                                            ? product.price / plan.duration
                                            : (product.price + (product.price * plan.interestRate / 100 * plan.duration / 12)) / plan.duration;
                                        return (
                                            <div key={idx} onClick={() => { setSelectedPlan(plan); setStep(6); }} className="border-2 border-border hover:border-accent rounded-xl p-4 cursor-pointer transition-all hover:bg-accent/5 hover:shadow-md">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${plan.type === 'monthly' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>{plan.type}</span>
                                                    {plan.interestRate === 0 && <span className="text-xs font-black bg-accent text-white px-2 py-0.5 rounded-full">0% Interest</span>}
                                                </div>
                                                <p className="font-black text-2xl">₹{Math.ceil(emi).toLocaleString('en-IN')}<span className="text-sm font-semibold text-muted-foreground">/{plan.type === 'monthly' ? 'mo' : 'wk'}</span></p>
                                                <p className="text-sm text-muted-foreground mt-1">{plan.duration} {plan.type === 'monthly' ? 'Months' : 'Weeks'} • {plan.interestRate}% p.a.</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 border rounded-xl text-muted-foreground">
                                    <AlertCircle className="mx-auto mb-3" size={36} />
                                    <p className="font-semibold">No EMI plans for this product.</p>
                                    <p className="text-sm mt-1 max-w-xs mx-auto">Add EMI plans in the Inventory tab for this product to create contracts.</p>
                                </div>
                            )}
                            <Button variant="outline" onClick={() => setStep(4)} className="w-full h-12 rounded-xl border-2 font-bold">← Change Product</Button>
                        </motion.div>
                    )}

                    {/* ── STEP 6: Confirm & Create ── */}
                    {step === 6 && product && selectedPlan && (
                        <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <label className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Confirm & Create EMI Contract</label>
                            <div>
                                <label className="font-semibold text-sm text-muted-foreground block mb-2">Down Payment (Cash collected now)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-lg">₹</span>
                                    <input type="number" value={downPayment} onChange={e => setDownPayment(e.target.value)} min="0" max={product.price} className="w-full bg-secondary border-2 border-transparent focus:border-accent rounded-xl pl-10 pr-4 py-3 text-lg font-black outline-none" placeholder="0" />
                                </div>
                            </div>
                            {(() => {
                                const down = parseFloat(downPayment) || 0;
                                const principal = Math.max(product.price - down, 0);
                                const interestAmount = (principal * (selectedPlan.interestRate / 100) * selectedPlan.duration) / 12;
                                const total = principal + interestAmount;
                                const emi = total / selectedPlan.duration;
                                return (
                                    <div className="bg-secondary/60 rounded-2xl p-5 space-y-3">
                                        <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Contract Summary</p>
                                        {[['Customer', customer?.full_name || phone], ['Product', product.name], ['Product Price', `₹${Number(product.price).toLocaleString('en-IN')}`], ['Down Payment', `₹${down.toLocaleString('en-IN')}`], ['Principal', `₹${principal.toLocaleString('en-IN')}`], [`Interest (${selectedPlan.interestRate}% p.a.)`, `₹${Math.ceil(interestAmount).toLocaleString('en-IN')}`], ['Duration', `${selectedPlan.duration} ${selectedPlan.type === 'monthly' ? 'Months' : 'Weeks'}`]]
                                            .map(([l, v]) => <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-bold">{v}</span></div>)}
                                        <div className="border-t pt-3 flex justify-between items-center">
                                            <span className="font-black">Monthly EMI</span>
                                            <span className="font-black text-accent text-xl">₹{Math.ceil(emi).toLocaleString('en-IN')}<span className="text-sm text-muted-foreground">/{selectedPlan.type === 'monthly' ? 'mo' : 'wk'}</span></span>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep(5)} className="flex-1 h-12 rounded-xl border-2 font-bold">← Back</Button>
                                <Button variant="accent" onClick={handleCreateContract} className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-accent/20" disabled={isCreatingContract}>
                                    {isCreatingContract ? <><Loader2 size={18} className="animate-spin mr-2" />Creating...</> : <><CreditCard size={18} className="mr-2" />Create EMI Contract</>}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 7: Success ── */}
                    {step === 7 && createdContract && (
                        <motion.div key="s7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-4">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={52} className="text-green-500" />
                            </div>
                            <h2 className="text-3xl font-black mb-2">EMI Created! 🎉</h2>
                            <p className="text-muted-foreground mb-6 max-w-sm">The agreement is locked in. Share the Contract ID with your customer for reference.</p>
                            <div className="w-full bg-secondary/50 p-5 rounded-2xl border mb-6 text-left space-y-2.5">
                                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Contract Details</p>
                                {[['Contract ID', createdContract.short_id], ['Customer', customer?.full_name || phone], ['Product', product?.name], ['EMI', `₹${Math.ceil(createdContract.emi_amount).toLocaleString('en-IN')} / ${createdContract.duration_type === 'monthly' ? 'month' : 'week'}`], ['Duration', `${createdContract.duration_count} ${createdContract.duration_type === 'monthly' ? 'months' : 'weeks'}`], ['Next Due', new Date(createdContract.next_due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })]]
                                    .map(([l, v]) => <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-bold">{v}</span></div>)}
                            </div>
                            <Button onClick={reset} variant="outline" className="w-full h-12 rounded-xl font-bold border-2 gap-2">
                                <RefreshCw size={18} /> Start New EMI Order
                            </Button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </motion.div>
    );
}
