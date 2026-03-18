import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../../components/ui/button';

const mockTxns = [
    { id: 'TXN-9092839', amount: '₹14,990', type: 'UPI AutoPay (PhonePe)',  status: 'Success' },
    { id: 'TXN-9092838', amount: '₹4,500',  type: 'HDFC e-Mandate',         status: 'Failed' },
    { id: 'TXN-9092837', amount: '₹89,900', type: 'Credit Card',            status: 'Refund Req' },
];

export default function AdminPaymentsTab() {
    return (
        <motion.div key="payments" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
            <div className="p-8 border-b bg-secondary/20">
                <h1 className="text-2xl font-black">Master Ledger &amp; Gateway</h1>
                <p className="text-muted-foreground">Live transaction feed and refund processing unit.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-muted-foreground text-xs uppercase tracking-widest border-b border-border/60 font-bold">
                            <th className="p-6">Txn ID / Gateway</th>
                            <th className="p-6">Amount</th>
                            <th className="p-6">Status</th>
                            <th className="p-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockTxns.map((txn, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-secondary/30">
                                <td className="p-6">
                                    <p className="font-bold">{txn.id}</p>
                                    <p className="text-xs text-muted-foreground">{txn.type}</p>
                                </td>
                                <td className="p-6 font-black text-lg">{txn.amount}</td>
                                <td className="p-6">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                        txn.status === 'Success'    ? 'bg-green-100 text-green-700' :
                                        txn.status === 'Failed'     ? 'bg-red-100 text-red-700' :
                                                                        'bg-orange-100 text-orange-700'
                                    }`}>{txn.status}</span>
                                </td>
                                <td className="p-6 text-right">
                                    {txn.status === 'Refund Req' ? (
                                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-200">Process Refund</Button>
                                    ) : (
                                        <button className="text-accent text-xs font-bold hover:underline">View Log</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
