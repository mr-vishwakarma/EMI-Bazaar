import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shops as mockShops, products as mockProducts } from '../../../data/mockData';
import { shopApi }                 from '../api/shopApi';
import { productsApi, ProductCard } from '../../products';
import { MapPin, Phone, Clock, Star, BadgeCheck, ShieldCheck, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { Skeleton, ProductCardSkeleton } from '../../../components/ui/skeleton';

export default function ShopProfile() {
    const { id } = useParams();
    const [liveShop, setLiveShop] = useState<any>(null);
    const [liveProducts, setLiveProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchShopData = async () => {
            if (!id) return;

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (!isUuid) { setIsLoading(false); return; }

            setIsLoading(true);
            const shopData = await shopApi.getShopById(id);

            if (shopData) {
                setLiveShop(shopData);
                const prods = await productsApi.getShopProducts(shopData.id, shopData.name);
                if (prods && prods.length > 0) setLiveProducts(prods);
            }
            setIsLoading(false);
        };
        fetchShopData();
    }, [id]);

    const shop = liveShop || mockShops.find(s => s.id === id) || mockShops[0];
    const shopProducts = liveShop ? liveProducts : mockProducts.filter(p => p.shopId === shop.id);

    if (isLoading) {
        return (
            <div className="w-full animate-pulse">
                <div className="bg-secondary/30 h-[300px] w-full flex items-center">
                    <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8 items-center">
                        <Skeleton className="w-40 h-40 rounded-[2.5rem]" />
                        <div className="space-y-4 flex-1">
                            <Skeleton className="h-12 w-1/2" />
                            <Skeleton className="h-6 w-1/3" />
                            <div className="flex gap-4">
                                <Skeleton className="h-10 w-32 rounded-xl" />
                                <Skeleton className="h-10 w-32 rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-4 md:px-8 py-16">
                    <div className="flex justify-between items-center mb-10">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-12 w-32 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <ProductCardSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-secondary/30 border-b border-border/60 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 md:px-8 py-8 md:py-20 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        <motion.div
                            initial={{ scale: 0.9, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                            className="relative shrink-0"
                        >
                            <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-[1.5rem] sm:rounded-[2.5rem] bg-card border-4 border-background shadow-xl overflow-hidden relative z-10">
                                <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
                            </div>
                            {shop.verified && (
                                <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-full shadow-lg z-20">
                                    <BadgeCheck size={32} className="text-accent" fill="currentColor" stroke="var(--background)" strokeWidth={1} />
                                </div>
                            )}
                        </motion.div>

                        <div className="flex flex-col gap-4 flex-1">
                            <div>
                                <motion.h1
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                                    className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tight flex items-center justify-center md:justify-start gap-2 sm:gap-3"
                                >
                                    {shop.name}
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                                    className="text-muted-foreground font-medium text-lg mt-2 flex items-center justify-center md:justify-start gap-2"
                                >
                                    <MapPin size={18} /> {shop.address} <span className="opacity-50 mx-2">•</span> {shop.distance} Away
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2"
                            >
                                <div className="flex items-center gap-1.5 text-sm font-bold bg-foreground text-background px-4 py-2 rounded-xl shadow-md">
                                    <Star size={14} className="text-accent" fill="currentColor" />
                                    {shop.rating} ({shop.reviews} Verified)
                                </div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground bg-background/50 border border-border/80 px-4 py-2 rounded-xl backdrop-blur-sm">
                                    <Phone size={14} /> +91 98765 43210
                                </div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground bg-background/50 border border-border/80 px-4 py-2 rounded-xl backdrop-blur-sm">
                                    <Clock size={14} /> Opens 10 AM
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                className="flex flex-wrap justify-center md:justify-start gap-3 mt-4 pt-4 border-t border-border/60"
                            >
                                <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                    <ShieldCheck size={14} /> Authorized Reseller
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                    ✨ No Cost EMI Active
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-foreground">Available Inventory</h2>
                        <p className="text-muted-foreground font-medium mt-1">Shop directly from their local warehouse stock.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="rounded-full border-2 font-bold hover:bg-secondary">
                            <Filter size={16} className="mr-2" /> Filters
                        </Button>
                    </div>
                </div>

                {shopProducts.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {shopProducts.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="h-full"
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="w-full bg-secondary/30 border border-border/50 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center">
                        <span className="text-6xl mb-4 opacity-50">🛒</span>
                        <h3 className="text-2xl font-black tracking-tight text-foreground">Out of Stock</h3>
                        <p className="text-muted-foreground font-medium max-w-sm mt-2">This vendor hasn't listed any new inventory yet or all items are sold out.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
