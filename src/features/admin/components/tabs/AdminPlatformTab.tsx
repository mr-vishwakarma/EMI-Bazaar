import React from 'react';
import { motion } from 'framer-motion';
import { Shield, MapPin, Star, Bell } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export default function AdminPlatformTab() {
    return (
        <motion.div key="platform" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm max-w-4xl mx-auto">
            <div className="p-8 border-b bg-secondary/20">
                <h1 className="text-2xl font-black">Platform Global Toggles</h1>
                <p className="text-muted-foreground">Manage system-level services, geolocations, and notifications.</p>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-secondary rounded-xl text-foreground"><Shield size={24} /></div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Global Security</h3>
                        <p className="text-xs text-muted-foreground mb-4">OTP Auth, HTTPS gateways, and AI Fraud flagging logic.</p>
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-200 dark:border-green-900">
                            <span className="text-xs font-bold text-green-700">Strict Auth Mode</span>
                            <div className="w-10 h-5 bg-green-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                        </div>
                    </div>
                </div>

                <div className="border p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-secondary rounded-xl text-foreground"><MapPin size={24} /></div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Location Services</h3>
                        <p className="text-xs text-muted-foreground mb-4">Calculations for "Nearby Shops", distance bounding, Maps API.</p>
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-200 dark:border-green-900">
                            <span className="text-xs font-bold text-green-700">Google Maps API Linked</span>
                            <div className="w-10 h-5 bg-green-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                        </div>
                    </div>
                </div>

                <div className="border p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-secondary rounded-xl text-foreground"><Star size={24} /></div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Reviews System</h3>
                        <p className="text-xs text-muted-foreground mb-4">Aggregating Shop ratings and Product feedback.</p>
                        <Button variant="outline" size="sm" className="w-full text-xs h-8">Moderate Reviews</Button>
                    </div>
                </div>

                <div className="border p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-secondary rounded-xl text-foreground"><Bell size={24} /></div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Notification Engine</h3>
                        <p className="text-xs text-muted-foreground mb-3">SMS alerts, AutoPay push reminders, and Email receipts.</p>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-bold px-2 py-1 bg-secondary rounded uppercase">SMS Configured</span>
                            <span className="text-[10px] font-bold px-2 py-1 bg-secondary rounded uppercase">Email Setup</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
