import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, CreditCard, Package } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, removeItem, clearCart } = useCartStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-xl text-accent">
                                    <ShoppingCart size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">Your Cart</h2>
                                    <p className="text-xs text-muted-foreground font-medium">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-secondary rounded-xl transition-colors"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                                    <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center">
                                        <Package size={36} className="text-muted-foreground/40" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-muted-foreground">Cart is empty</p>
                                        <p className="text-sm text-muted-foreground/60 mt-1">Browse products and add them to your cart</p>
                                    </div>
                                    <Button onClick={onClose} variant="outline" className="rounded-xl border-2 font-bold mt-2">
                                        Continue Shopping
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <motion.div
                                            key={item.productId}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            className="bg-card border rounded-2xl p-4 flex gap-4 group relative overflow-hidden"
                                        >
                                            {/* Product Image */}
                                            <div className="w-20 h-20 bg-white dark:bg-black/20 rounded-xl border flex items-center justify-center shrink-0 p-2">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                                                />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm leading-tight truncate">{item.name}</h4>
                                                <p className="text-xs text-muted-foreground font-medium mt-1">{item.shopName}</p>
                                                <p className="text-lg font-black text-accent mt-2">
                                                    ₹{item.price.toLocaleString('en-IN')}
                                                </p>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removeItem(item.productId)}
                                                className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="border-t border-border p-6 space-y-4 bg-card/50 backdrop-blur-md">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-muted-foreground">Total ({items.length} items)</span>
                                    <span className="text-2xl font-black tracking-tight">
                                        ₹{items.reduce((sum, i) => sum + i.price, 0).toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <Link
                                    to={`/checkout?productId=${items[0].productId}&planIndex=${items[0].selectedPlanIndex}`}
                                    onClick={onClose}
                                >
                                    <Button variant="accent" className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-accent/20 gap-2">
                                        <CreditCard size={20} /> Proceed to EMI Checkout
                                    </Button>
                                </Link>

                                <Button
                                    onClick={clearCart}
                                    variant="ghost"
                                    className="w-full text-sm text-muted-foreground font-medium hover:text-red-500"
                                >
                                    Clear entire cart
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
