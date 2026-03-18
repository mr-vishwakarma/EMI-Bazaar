import React, { useState, useEffect } from 'react';
import { products as mockProducts, shops as mockShops, categories as mockCategories } from '../data/mockData';
import { productsApi, ProductCard } from '../features/products';
import { shopApi, ShopCard }        from '../features/shop';
import { ChevronRight, ArrowRight, MapPin, Search } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { Button } from '../components/ui/button';

const MotionButton = motion(Button);

export default function Home() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const [liveProducts, setLiveProducts] = useState<any[]>([]);
    const [liveShops, setLiveShops] = useState<any[]>([]);
    const [liveCategories, setLiveCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchHomeData = async () => {
            const { supabase } = await import('../lib/supabase');
            const [shops, prods, { data: categories }] = await Promise.all([
                shopApi.getFeaturedShops(6),
                productsApi.getFeaturedProducts(8),
                supabase.from('categories').select('*').limit(10)
            ]);

            if (categories && categories.length > 0) setLiveCategories(categories);
            if (shops && shops.length > 0) setLiveShops(shops);
            if (prods && prods.length > 0) setLiveProducts(prods);
        };
        fetchHomeData();
    }, []);

    const displayProducts = liveProducts.length > 0 ? liveProducts : mockProducts;
    const displayShops = liveShops.length > 0 ? liveShops : mockShops;
    const displayCategories = liveCategories.length > 0 ? liveCategories : mockCategories;

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="w-full">
            {/* Hero Banner Area */}
            <section className="relative overflow-hidden bg-dot-pattern bg-[length:24px_24px] pt-8 pb-16 lg:pt-16 lg:pb-24 border-b">
                <div className="absolute inset-0 bg-background/50 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
                <div className="container relative z-10 px-4 md:px-8 mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="flex-1 flex flex-col gap-6"
                        >
                            <div className="inline-flex self-start px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-sm shadow-sm backdrop-blur-md">
                                ✨ Zero Cost EMI is here
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] text-foreground">
                                Buy what you love. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#ff8c69] drop-shadow-sm">Pay over time.</span>
                            </h1>
                            <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">
                                Connect with local verified shops instantly. Browse inventory, lock in 0% EMI financing directly, and pick up your items the same day.
                            </p>

                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                <MotionButton
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    variant="accent"
                                    size="lg"
                                    className="rounded-full shadow-xl shadow-accent/20"
                                >
                                    Start Shopping <ArrowRight size={18} className="ml-2" />
                                </MotionButton>

                                <MotionButton
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    variant="outline"
                                    size="lg"
                                    className="rounded-full border-2"
                                >
                                    Find Shops Near Me <MapPin size={18} className="ml-2" />
                                </MotionButton>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                            className="flex-1 relative w-full aspect-[4/3] max-w-2xl lg:max-w-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-primary/5 rounded-[2.5rem] transform rotate-3 scale-105" />
                            <img
                                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop"
                                alt="Shopping Experience"
                                className="w-full h-full object-cover rounded-[2rem] shadow-2xl ring-1 ring-border/50 relative z-10"
                            />
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-6 -left-6 bg-background rounded-2xl p-4 shadow-xl border border-border z-20 flex items-center gap-3 backdrop-blur-xl"
                            >
                                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">📱</span>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Approved in seconds</p>
                                    <p className="text-lg font-black">₹40,000 EMI</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 md:py-24 container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Shop by Category</h2>
                        <p className="text-muted-foreground">Everything you need, available on easy installments.</p>
                    </div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x"
                >
                    {displayCategories.map((cat, idx) => (
                        <motion.div
                            variants={itemVariants}
                            key={cat.id || idx}
                            whileHover={{ y: -5, scale: 1.05 }}
                            className="flex flex-col items-center gap-3 snap-start min-w-[90px] md:min-w-[110px] cursor-pointer group"
                        >
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-card rounded-[1.5rem] border border-border shadow-sm group-hover:shadow-lg group-hover:border-accent/40 flex items-center justify-center transition-all duration-300 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground">{cat.name ? cat.name[0] : '?'}</span>
                            </div>
                            <span className="text-sm font-semibold text-center text-foreground/80 group-hover:text-accent transition-colors">{cat.name}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Featured Deals */}
            <section className="py-16 md:py-24 bg-secondary/30 border-y container-fluid">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm shadow-accent/20">Hot Picks</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Trending Deals Near You</h2>
                        </div>
                        <Button variant="ghost" className="font-semibold text-accent hover:text-accent hover:bg-accent/10 rounded-full pr-2">
                            Explore All <ChevronRight size={16} className="ml-1" />
                        </Button>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {displayProducts.map(product => (
                            <motion.div variants ={itemVariants} key={product.id} className="h-full">
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Shops */}
            <section className="py-16 md:py-24 container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Verified Local Shops</h2>
                        <p className="text-muted-foreground">Discover authorized retailers with the best EMI offers.</p>
                    </div>
                    <Button variant="outline" className="rounded-full font-semibold border-2 hover:bg-secondary">
                        <MapPin size={16} className="mr-2" /> View Map
                    </Button>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {displayShops.map((shop, idx) => (
                        <motion.div variants={itemVariants} key={shop.id || idx} className="h-full">
                            <ShopCard shop={shop} />
                        </motion.div>
                    ))}
                </motion.div>
            </section>

        </div>
    );
}
