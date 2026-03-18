import React from 'react';
import { motion } from 'framer-motion';

export interface Customer {
    id: string;
    name: string;
    phone: string;
    activeEmis: number;
    totalSpent: string;
    status: string;
}

export default function CustomersTab({ mockCustomers }: { mockCustomers: Customer[] }) {
    return (
        <motion.div key="customers" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
            <div className="p-8 border-b bg-secondary/20">
                <h1 className="text-2xl font-black">Customer Management</h1>
                <p className="text-muted-foreground">View your customer base, EMI standing, and payment statuses.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="text-muted-foreground text-xs uppercase tracking-widest font-bold border-b border-border/50">
                            <th className="p-6">Customer Details</th>
                            <th className="p-6">Total Spent</th>
                            <th className="p-6">Active EMIs</th>
                            <th className="p-6">Account Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockCustomers.map((c, i) => (
                            <tr key={i} className="hover:bg-secondary/40 border-b last:border-0 transition-colors">
                                <td className="p-6">
                                    <p className="font-bold text-base">{c.name}</p>
                                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">{c.phone}</p>
                                </td>
                                <td className="p-6 font-black text-lg">{c.totalSpent}</td>
                                <td className="p-6">
                                    <span className="bg-secondary font-bold px-3 py-1 rounded-full">{c.activeEmis} Plans</span>
                                </td>
                                <td className="p-6">
                                    <span className={`font-bold text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                                        c.status === 'Good Standing' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                        c.status === 'Paid Off'     ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    }`}>
                                        {c.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
