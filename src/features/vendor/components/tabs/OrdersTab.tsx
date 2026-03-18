import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export interface Order {
    id: string;
    customer: string;
    product: string;
    amount: string;
    status: string;
    type: string;
    date: string;
}

export default function OrdersTab({ mockOrders }: { mockOrders: Order[] }) {
    return (
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
    );
}
