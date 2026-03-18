import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export default function AdminProductsTab() {
    return (
        <motion.div key="products" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
            <div className="p-8 border-b bg-secondary/20">
                <h1 className="text-2xl font-black">Global Product Monitoring</h1>
                <p className="text-muted-foreground">Review flagged fake listings and approve new mass categories.</p>
            </div>
            <div className="p-6 space-y-6">
                <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl">
                    <h3 className="font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} /> Reported / Fake Listings (Needs Action)
                    </h3>
                    <div className="bg-background border rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-lg">"Apple iPfone 15 Pro Max - 100% Genguin"</p>
                            <p className="text-xs text-muted-foreground">Listed by Shady Mobiles • Flagged by 14 users</p>
                        </div>
                        <Button variant="destructive" className="rounded-xl font-bold">Remove Listing</Button>
                    </div>
                </div>
                <div className="border border-border p-6 rounded-2xl">
                    <h3 className="font-bold mb-4">Pending Category Approvals</h3>
                    <div className="flex gap-2">
                        <span className="bg-secondary px-4 py-2 rounded-xl border flex items-center gap-2 font-medium">
                            Auto Parts <Button size="icon" variant="ghost" className="w-6 h-6 ml-2 rounded-full"><Check size={14} /></Button>
                        </span>
                        <span className="bg-secondary px-4 py-2 rounded-xl border flex items-center gap-2 font-medium">
                            Jewelry <Button size="icon" variant="ghost" className="w-6 h-6 ml-2 rounded-full"><Check size={14} /></Button>
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
