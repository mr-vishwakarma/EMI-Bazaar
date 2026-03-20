import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, CheckCircle2, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'sonner';

export default function OrdersTab() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: contractsData, error } = await supabase
            .from('emi_contracts')
            .select(`
                *,
                product:products(name, short_tag)
            `)
            .eq('vendor_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Failed to load orders: " + error.message);
        } else if (contractsData) {
            
            const customerIds = [...new Set(contractsData.map(c => c.customer_id))];
            
            const { data: customerData } = await supabase
                .from('customer_profiles')
                .select('user_id, full_name, phone')
                .in('user_id', customerIds);
                
            const { data: userData } = await supabase
                .from('users')
                .select('id, full_name, phone')
                .in('id', customerIds);

            const mergedOrders = contractsData.map(order => {
                const cProf = customerData?.find(c => c.user_id === order.customer_id);
                const uProf = userData?.find(u => u.id === order.customer_id);
                return {
                    ...order,
                    customer: {
                        full_name: cProf?.full_name || uProf?.full_name || 'Unknown',
                        phone: cProf?.phone || uProf?.phone || 'Unknown'
                    }
                };
            });
            setOrders(mergedOrders);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('emi_contracts')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast.error("Failed to update order status");
        } else {
            toast.success(`Order marked as ${newStatus}`);
            fetchOrders();
        }
    };

    return (
        <motion.div key="orders" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
            <div className="p-8 border-b bg-secondary/20 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black">Orders Management</h1>
                    <p className="text-muted-foreground">Manage your Walk-in POS orders and online EMI requests.</p>
                </div>
                <Button onClick={fetchOrders} variant="outline" className="h-10 rounded-xl font-bold">Refresh</Button>
            </div>
            
            <div className="p-6">
                {loading ? (
                    <div className="text-center py-10"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 bg-secondary/30 rounded-3xl border-2 border-dashed">
                        <ShoppingBag size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-bold mb-2">No orders yet</h3>
                        <p className="text-muted-foreground">Use the POS tab to create walk-in EMI contracts.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="p-6 border rounded-2xl bg-background flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-xs bg-secondary px-2 py-0.5 rounded uppercase tracking-wider">{order.short_id}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                                            {order.status === 'defaulted' && <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded font-bold uppercase">Late</span>}
                                        </div>
                                        <p className="font-bold text-lg leading-tight">{order.product?.name || 'Unknown Product'}</p>
                                        <p className="text-xs font-mono font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded w-fit mt-1">{order.product?.short_tag || 'NO-TAG'}</p>
                                        <p className="text-sm font-medium text-muted-foreground mt-1.5">By {order.customer?.full_name || 'Unknown Customer'} • {order.duration_count} {order.duration_type === 'monthly' ? 'Months' : 'Weeks'}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                                    <p className="font-black text-xl mb-2">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        {order.status === 'pending_approval' ? (
                                            <>
                                                <Button onClick={() => handleUpdateStatus(order.id, 'rejected')} variant="outline" className="flex-1 md:flex-none h-9 rounded-xl border-red-200 text-red-600 hover:bg-red-50"><X size={16} className="mr-1" /> Reject</Button>
                                                <Button onClick={() => handleUpdateStatus(order.id, 'active')} variant="accent" className="flex-1 md:flex-none h-9 rounded-xl shadow-sm"><Check size={16} className="mr-1" /> Accept Order</Button>
                                            </>
                                        ) : order.status === 'active' || order.status === 'defaulted' ? (
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                                                <CheckCircle2 size={16} /> Active EMI
                                            </span>
                                        ) : order.status === 'completed' ? (
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                                                <CheckCircle2 size={16} /> Fully Paid
                                            </span>
                                        ) : order.status === 'rejected' ? (
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                                                <X size={16} /> Rejected
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
