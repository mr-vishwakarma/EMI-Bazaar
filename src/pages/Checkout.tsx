import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { products, getEmiPlans } from '../data/mockData';
import { Store, Truck, MapPin, Building, Lock, CreditCard, Landmark, CheckCircle2, ChevronRight, ShieldCheck, Fingerprint, Phone, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';

export default function Checkout() {
    const [step, setStep] = useState(1);
    const [deliveryMode, setDeliveryMode] = useState('pickup');
    const [autoPayMethod, setAutoPayMethod] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const product = products[0];

    const nextStep = () => setStep(prev => prev + 1);

    const handleAutoPaySetup = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(4);
        }, 1500);
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
                                    <h2 className="text-2xl font-bold mb-6">Customer Details</h2>

                                    <div className="space-y-4">
                                        {deliveryMode === 'delivery' && (
                                            <div className="bg-secondary/30 p-5 rounded-2xl border mb-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="font-semibold flex items-center gap-2"><MapPin size={18} /> Shipping Address</h3>
                                                    <Button variant="outline" size="sm" className="h-8 rounded-full text-xs">Change</Button>
                                                </div>
                                                <p className="text-sm font-medium">Shyam Alok</p>
                                                <p className="text-sm text-muted-foreground mt-1">123, Tech Park Road, Koramangala, Bengaluru, Karnataka 560034</p>
                                                <p className="text-sm text-muted-foreground mt-1">+91 98765 43210</p>
                                            </div>
                                        )}

                                        <div className="bg-secondary/30 p-5 rounded-2xl border">
                                            <h3 className="font-semibold flex items-center gap-2 mb-4"><ShieldCheck size={18} className="text-green-500" /> Identity Verification</h3>
                                            <div className="flex flex-col gap-3">
                                                <div className="relative">
                                                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                    <input type="text" placeholder="PAN Number" className="w-full bg-background border rounded-xl pl-10 pr-4 py-3 outline-none uppercase" defaultValue="ABCDE1234F" readOnly />
                                                </div>
                                                <p className="text-xs text-green-600 font-medium">✓ PAN Verified successfully</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <Button onClick={() => setStep(1)} variant="ghost" className="rounded-xl text-muted-foreground">Back</Button>
                                        <Button onClick={nextStep} variant="accent" size="lg" className="rounded-xl px-8 shadow-lg shadow-accent/20">Verify & Continue <ChevronRight size={18} className="ml-2" /></Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: AutoPay Setup */}
                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                                    <h2 className="text-2xl font-bold mb-2">Setup AutoPay</h2>
                                    <p className="text-sm text-muted-foreground mb-6">Set up continuous mandate for monthly EMI deductions.</p>

                                    <form onSubmit={handleAutoPaySetup} className="space-y-4">
                                        <div
                                            onClick={() => setAutoPayMethod('upi')}
                                            className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-colors ${autoPayMethod === 'upi' ? 'border-accent bg-accent/5' : 'border-border hover:bg-secondary'}`}
                                        >
                                            <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center font-black text-xl text-slate-800">U</div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold">UPI AutoPay</h4>
                                                <p className="text-xs text-muted-foreground">Approve mandate on PhonePe / GPay</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${autoPayMethod === 'upi' ? 'border-accent' : 'border-muted-foreground'}`}>
                                                {autoPayMethod === 'upi' && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setAutoPayMethod('bank')}
                                            className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-colors ${autoPayMethod === 'bank' ? 'border-accent bg-accent/5' : 'border-border hover:bg-secondary'}`}
                                        >
                                            <div className="w-10 h-10 bg-secondary rounded-lg border flex items-center justify-center"><Landmark size={20} /></div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold">Bank e-Mandate</h4>
                                                <p className="text-xs text-muted-foreground">NetBanking / Debit Card (Aadhaar needed)</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${autoPayMethod === 'bank' ? 'border-accent' : 'border-muted-foreground'}`}>
                                                {autoPayMethod === 'bank' && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setAutoPayMethod('card')}
                                            className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-colors ${autoPayMethod === 'card' ? 'border-accent bg-accent/5' : 'border-border hover:bg-secondary'}`}
                                        >
                                            <div className="w-10 h-10 bg-secondary rounded-lg border flex items-center justify-center"><CreditCard size={20} /></div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold">Credit/Debit Card</h4>
                                                <p className="text-xs text-muted-foreground">Setup using card details</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${autoPayMethod === 'card' ? 'border-accent' : 'border-muted-foreground'}`}>
                                                {autoPayMethod === 'card' && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                                            </div>
                                        </div>

                                        <div className="mt-8 flex justify-between pt-4">
                                            <Button type="button" onClick={() => setStep(2)} variant="ghost" className="rounded-xl text-muted-foreground shadow-none">Back</Button>
                                            <Button type="submit" disabled={!autoPayMethod || loading} variant="accent" size="lg" className="rounded-xl px-8 shadow-lg shadow-accent/20">
                                                {loading ? 'Processing...' : 'Confirm AutoPay'}
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* Step 4: Confirmation */}
                            {step === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 md:p-12 flex flex-col items-center text-center">
                                    <div className="bg-green-500/10 text-green-500 rounded-full p-6 mb-6">
                                        <CheckCircle2 size={48} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-3xl font-black mb-2">Order Confirmed!</h2>
                                    <p className="text-muted-foreground mb-8">
                                        Your AutoPay is linked and EMI is active.
                                        {deliveryMode === 'pickup' ? ` Please visit ${product.shopName} to pick up your item.` : ` Your item will be shipped shortly.`}
                                    </p>

                                    {deliveryMode === 'pickup' && (
                                        <div className="bg-secondary/50 p-6 rounded-2xl w-full max-w-sm mb-8 border border-border flex flex-col items-center">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Store Pickup Code</p>
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PICKUP-123`} alt="QR Code" className="w-[150px] h-[150px] mb-4 mix-blend-multiply dark:mix-blend-lighten" />
                                            <p className="font-mono font-bold text-xl tracking-[0.2em]">{Math.floor(100000 + Math.random() * 900000)}</p>
                                        </div>
                                    )}

                                    <Button onClick={() => navigate('/profile')} variant="outline" className="rounded-xl border-2 font-bold px-8 h-12">Go to My Orders</Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Right Col - Order Summary */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-[400px]">
                    <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-6">Order Summary</h3>

                        <div className="flex gap-4 mb-6">
                            <div className="w-20 h-20 bg-white dark:bg-black/20 rounded-xl border p-2 shrink-0">
                                <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                            </div>
                            <div>
                                <h4 className="font-bold line-clamp-2">{product.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">Sold by {product.shopName}</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm mb-6 pb-6 border-b">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Product Total</span>
                                <span className="font-medium">₹{product.price.toLocaleString('en-IN')}</span>
                            </div>
                            {deliveryMode === 'delivery' && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Delivery Fee</span>
                                    <span className="font-medium">₹149</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Processing Fee</span>
                                <span className="font-medium">₹499</span>
                            </div>
                        </div>

                        <div className="mb-6 pb-6 border-b">
                            <p className="text-sm font-bold text-foreground mb-3">EMI Plan Details</p>
                            <div className="bg-secondary/50 rounded-xl p-4 flex justify-between items-center border">
                                <div>
                                    <p className="font-black text-lg text-accent">₹{getEmiPlans(product.price)[1].emi.toLocaleString('en-IN')} /mo</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">For 6 months • {getEmiPlans(product.price)[1].name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-lg">Down Payment</span>
                            <span className="font-black text-2xl">₹0</span>
                        </div>

                        <div className="flex gap-2">
                            <ShieldCheck size={20} className="text-green-500 shrink-0" />
                            <p className="text-xs text-muted-foreground">Safe & Secure exactly as per RBI guidelines for digital lending.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
