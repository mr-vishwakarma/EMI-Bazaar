import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

export default function ShopProfileTab({ vendorProfile }: { vendorProfile: any }) {
    return (
        <motion.div key="registration" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm max-w-4xl mx-auto">
            <div className="p-8 border-b bg-secondary/20 flex items-center gap-4">
                <div className="p-4 bg-accent/10 rounded-2xl text-accent"><Settings size={32} /></div>
                <div>
                    <h1 className="text-2xl font-black">Shop Profile &amp; Details</h1>
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
                        <h3 className="font-bold text-lg border-b pb-2">KYC &amp; Bank Details</h3>
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">PAN Number</label>
                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none uppercase">{vendorProfile?.pan || 'N/A'}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Aadhaar / KYC Details</label>
                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none truncate">
                                Verified securely on {vendorProfile?.submitted_at ? new Date(vendorProfile?.submitted_at).toLocaleDateString() : 'Submission'}
                            </div>
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
    );
}
