import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCircle2, Smartphone, ChevronRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { products, getEmiPlans } from '../../../../data/mockData';

interface PosTabProps {
    posStep: number;
    setPosStep: (step: number) => void;
    posPhone: string;
    setPosPhone: (p: string) => void;
    posOtp: string[];
    handlePosOtpChange: (idx: number, val: string) => void;
    selectedPosProduct: any;
    setSelectedPosProduct: (p: any) => void;
    posEmiPlan: number | null;
    setPosEmiPlan: (n: number | null) => void;
    setPosOtp: (otp: string[]) => void;
}

export default function PosTab({ posStep, setPosStep, posPhone, setPosPhone, posOtp, handlePosOtpChange, selectedPosProduct, setSelectedPosProduct, posEmiPlan, setPosEmiPlan, setPosOtp }: PosTabProps) {
    return (
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
    );
}
