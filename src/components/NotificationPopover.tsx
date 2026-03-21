import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, ShoppingBag, Zap, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

interface Notification {
    id: string;
    title: string;
    content: string;
    type: string;
    is_read: boolean;
    created_at: string;
    action_url?: string;
}

export default function NotificationPopover({ 
    notifications, 
    onClose, 
    onMarkRead 
}: { 
    notifications: Notification[], 
    onClose: () => void,
    onMarkRead: (id: string) => void
}) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'approval': return <CheckCircle2 className="text-green-500" size={18} />;
            case 'reminder': return <AlertCircle className="text-amber-500" size={18} />;
            case 'flash_sale': return <Zap className="text-accent" size={18} fill="currentColor" />;
            default: return <Bell className="text-muted-foreground" size={18} />;
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-4 w-80 sm:w-96 bg-card border-2 shadow-2xl rounded-[2rem] z-[100] overflow-hidden"
        >
            <div className="p-6 border-b flex justify-between items-center bg-secondary/20">
                <h3 className="font-black text-lg">Notifications</h3>
                <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Bell size={40} className="mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-bold">All caught up!</p>
                        <p className="text-xs">No new notifications at the moment.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div 
                            key={notif.id}
                            onClick={() => onMarkRead(notif.id)}
                            className={`p-5 border-b last:border-0 cursor-pointer transition-colors hover:bg-secondary/30 relative flex gap-4 ${!notif.is_read ? 'bg-accent/5' : ''}`}
                        >
                            <div className="mt-1 shrink-0">
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-black">{notif.title}</h4>
                                    <span className="text-[10px] font-medium text-muted-foreground">{format(new Date(notif.created_at), 'MMM d')}</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {notif.content}
                                </p>
                                {!notif.is_read && (
                                    <div className="w-2 h-2 bg-accent rounded-full absolute top-6 right-5" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {notifications.length > 0 && (
                <div className="p-4 bg-secondary/10 text-center border-t">
                    <button className="text-xs font-black text-accent uppercase tracking-widest hover:underline">
                        View All Activity
                    </button>
                </div>
            )}
        </motion.div>
    );
}
