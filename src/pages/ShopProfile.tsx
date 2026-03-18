import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shops as mockShops, products as mockProducts } from '../data/mockData';
import ProductCard from '../components/ProductCard';
import { MapPin, Phone, Clock, Star, BadgeCheck, ShieldCheck, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';

export default function ShopProfile() {
    const { id } = useParams();
    const [liveShop, setLiveShop] = useState<any>(null);
    const [liveProducts, setLiveProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchShopData = async () => {
            if (!id) return;

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (!isUuid) {
                 setIsLoading(false);
                 return;
            }

            setIsLoading(true);
            const { data: shopData } = await supabase.from('shops').select('*').eq('id', id).single();
            
            if (shopData) {
                setLiveShop({
                    id: shopData.id,
                    name: shopData.name,
                    image: shopData.image_url || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=600&auto=format&fit=crop',
                    verified: shopData.is_verified || false,
                    address: shopData.address || 'Local Street',
                    distance: '2.5 km', // Placeholder until GPS feature
                    rating: shopData.rating || 5.0,
                    reviews: shopData.reviews_count || 0
                });

                const { data: prodsData } = await supabase.from('products').select('*, category:categories(name)').eq('shop_id', shopData.id).eq('is_active', true).order('created_at', { ascending: false });
                
                if (prodsData && prodsData.length > 0) {
                    const mappedProducts = prodsData.map(p => ({
                        id: p.short_tag || p.id,
                        name: p.name,
                        brand: p.category?.name || 'Local',
                        image: p.image_url || 'https://via.placeholder.com/300',
                        price: p.price,
                        mrp: p.original_price || p.price * 1.2,
                        rating: 4.8,
                        shopName: shopData.name,
                        distance: '2.5 km',
                        shopId: shopData.id
                    }));
                    setLiveProducts(mappedProducts);
                }
            }
            setIsLoading(false);
        };
        fetchShopData();
    }, [id]);

    const shop = liveShop || mockShops.find(s => s.id === id) || mockShops[0];
    const shopProducts = liveShop ? liveProducts : mockProducts.filter(p => p.shopId === shop.id);

    if (isLoading) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
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
                <div className="container mx-auto px-4 md:px-8 py-12 md:py-20 relative z-10">

                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        <motion.div
                            initial={{ scale: 0.9, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                            className="relative shrink-0"
                        >
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-card border-4 border-background shadow-xl overflow-hidden relative z-10">
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
                                    className="text-4xl md:text-6xl font-black tracking-tight flex items-center justify-center md:justify-start gap-3"
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
