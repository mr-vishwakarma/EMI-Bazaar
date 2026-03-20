import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ShieldAlert, CheckCircle2, Percent, Calendar } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export default function TermsTab() {
    return (
        <motion.div
            key="terms"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm max-w-5xl mx-auto"
        >
            {/* Header */}
            <div className="p-8 border-b bg-secondary/20 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black">Terms & Guidelines</h1>
                    <p className="text-muted-foreground mt-1">Protocols and rules for interest rates and EMI plans.</p>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
                {/* Notice Box */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex gap-4">
                    <ShieldAlert className="text-red-500 shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-red-600 font-bold mb-2">Strict Policy Enforcement</h3>
                        <p className="text-red-600/80 leading-relaxed max-w-3xl">
                            All EMI plans and interest rates configured by vendors are closely monitored by the EMI Bazaar Audit Team. 
                            Arbitrary interest rates or predatory lending terms ("manmani") are strictly prohibited. Non-compliance will 
                            result in immediate store suspension.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Interest Rates Rule */}
                    <div className="border border-secondary rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
                                <Percent size={14} className="stroke-[3]" />
                            </div>
                            <h3 className="font-bold text-base">Interest Rate Limits</h3>
                        </div>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li><strong>Maximum Cap:</strong> The interest rate cannot exceed 3% per month (or 36% API).</li>
                            <li><strong>0% EMI (No Cost EMI):</strong> Highly recommended for subventions or promotional products to increase sales volume.</li>
                            <li>Processing fees must not exceed ₹999 or 2% of the product cost (whichever is lower).</li>
                        </ul>
                    </div>

                    {/* Tenure Rules */}
                    <div className="border border-secondary rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Calendar size={14} className="stroke-[3]" />
                            </div>
                            <h3 className="font-bold text-base">Tenure Options</h3>
                        </div>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li><strong>Weekly EMIs:</strong> Allowable up to 24 weeks maximum.</li>
                            <li><strong>Monthly EMIs:</strong> Allowable up to 24 months maximum.</li>
                            <li>Custom tenures exceeding the maximum limit require prior approval from the platform admin.</li>
                        </ul>
                    </div>
                </div>

                {/* Agreement Acknowledgment */}
                <div className="bg-secondary/30 rounded-2xl p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-500" size={20} />
                        <div>
                            <p className="font-bold text-card-foreground">As a verified EMI Bazaar vendor, I agree to abide by these guidelines.</p>
                            <p className="text-xs text-muted-foreground mt-0.5">By continuing to add products and offer EMIs, you accept our Terms of Service.</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
