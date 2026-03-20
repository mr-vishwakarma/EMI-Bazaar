import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, CreditCard, Activity, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Button } from '../../../../components/ui/button';
import { toast } from 'sonner';

export default function CollectionsTab() {
    const [repayments, setRepayments] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Repayments
        const { data: reps } = await supabase
            .from('emi_repayments')
            .select(`
                *,
                contracts:emi_contracts(short_id, product_id, total_amount)
            `)
            .eq('vendor_id', user.id)
            .order('paid_at', { ascending: false });

        // Fetch Active Contracts to show Defaulters
        const { data: acts } = await supabase
            .from('emi_contracts')
            .select('*')
            .eq('vendor_id', user.id)
            .in('status', ['active', 'defaulted']);

        // Fetch Customers for mapping
        let allCustomerIds: string[] = [];
        if (reps) allCustomerIds.push(...reps.map(r => r.customer_id));
        if (acts) allCustomerIds.push(...acts.map(a => a.customer_id));
        allCustomerIds = [...new Set(allCustomerIds)];

        const { data: customerData } = await supabase
            .from('customer_profiles')
            .select('user_id, full_name, phone')
            .in('user_id', allCustomerIds);

        const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, phone')
            .in('id', allCustomerIds);

        const getCustomerInfo = (userId: string) => {
            const cProf = customerData?.find(c => c.user_id === userId);
            const uProf = userData?.find(u => u.id === userId);
            return {
                full_name: cProf?.full_name || uProf?.full_name || 'Unknown',
                phone: cProf?.phone || uProf?.phone || 'Unknown'
            };
        };

        if (reps) {
            setRepayments(reps.map(r => ({ ...r, customer: getCustomerInfo(r.customer_id) })));
        }
        if (acts) {
            setContracts(acts.map(a => ({ ...a, customer: getCustomerInfo(a.customer_id) })));
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalCollected = repayments.reduce((sum, r) => sum + Number(r.amount), 0);
    const pendingTotal = contracts.reduce((sum, c) => sum + (c.total_amount - c.total_paid), 0);

    return (
        <motion.div key="collections" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
            <div className="p-8 border-b bg-secondary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black">Collections & Ledger</h1>
                    <p className="text-muted-foreground">Track EMI payments received and manage active loans.</p>
                </div>
                <Button onClick={fetchData} variant="outline" className="rounded-xl h-10 gap-2"><Activity size={16} />Refresh</Button>
            </div>

            <div className="p-8 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-3xl">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <IndianRupee size={20} />
                            <h3 className="font-bold">Total Collected</h3>
                        </div>
                        <p className="text-4xl font-black text-green-700 dark:text-green-400">₹{totalCollected.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl">
                        <div className="flex items-center gap-2 text-orange-600 mb-2">
                            <CreditCard size={20} />
                            <h3 className="font-bold">Pending EMIs Balance</h3>
                        </div>
                        <p className="text-4xl font-black text-orange-700 dark:text-orange-400">₹{pendingTotal.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <h3 className="text-lg font-bold mb-4">Recent Repayments</h3>
                {loading ? (
                    <div className="text-center py-10"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : repayments.length === 0 ? (
                    <div className="text-center py-10 bg-secondary/30 rounded-2xl border-dashed border-2">
                        <p className="text-muted-foreground font-semibold">No payments recorded yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {repayments.map((rep) => (
                            <div key={rep.id} className="flex justify-between items-center p-4 border rounded-2xl bg-secondary/10 hover:bg-secondary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center">
                                        <ArrowUpRight size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold">{rep.customer?.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground">{rep.contracts?.short_id} • {new Date(rep.paid_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-lg text-green-600 dark:text-green-400">+ ₹{Number(rep.amount).toLocaleString('en-IN')}</p>
                                    <p className="text-xs font-semibold bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full inline-block mt-0.5 capitalize">{rep.payment_method}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
