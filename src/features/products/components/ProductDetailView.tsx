import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Calculator, Store, Zap, CreditCard, MessageSquare, ShoppingCart } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products as mockProducts, getEmiPlans } from '../../../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { supabase } from '../../../lib/supabase';
import { productsApi } from '../api/productsApi';
import { useCartStore } from '../../../store/cartStore';
import { toast } from 'sonner';
import ProductReviews from './ProductReviews';
import type { ProductRating } from '../api/reviewsApi';

export default function ProductDetail() {
    const { id } = useParams();
    const [liveProduct, setLiveProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(0);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [productRating, setProductRating] = useState<ProductRating>({ avgRating: 0, reviewCount: 0 });
    const navigate = useNavigate();

    const handleContactVendor = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
            return;
        }

        if (user.id === product.vendorId) {
            return; // Can't chat with self
        }

        // Check if there's already a message, otherwise send a "Hi" to start the conversation
        const { data: existing } = await supabase
            .from('chat_messages')
            .select('id')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${product.vendorId}),and(sender_id.eq.${product.vendorId},receiver_id.eq.${user.id})`)
            .limit(1);

        if (!existing || existing.length === 0) {
            await supabase.from('chat_messages').insert({
                sender_id: user.id,
                receiver_id: product.vendorId,
                content: `Hi, I'm interested in the "${product.name}".`,
                product_context_id: product.id
            });
        }

        navigate('/messages');
    };

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            setIsLoading(true);
            
            const data = await productsApi.getProductById(id);
            if (data) {
                setLiveProduct(data);
            }
            setIsLoading(false);
        };
        fetchProduct();
    }, [id]);

    const product = liveProduct || mockProducts.find(p => p.id === id) || mockProducts[0];
    
    // Convert product's dynamic EMI plans or fallback to defaults
    const emiPlans = product?.emiPlans && product.emiPlans.length > 0
        ? product.emiPlans.map((plan: any) => {
            const principal = product.price;
            // Simplified interest calculation for display
            const interestDivisor = plan.type === 'weekly' ? 5200 : 1200;
            const totalInterest = (principal * plan.interestRate * plan.duration) / interestDivisor; 
            const totalAmount = principal + totalInterest;
            const emi = totalAmount / plan.duration;
            return {
                id: plan.id,
                duration: plan.duration,
                type: plan.type,
                rate: plan.interestRate || 0,
                emi: Math.round(emi),
                name: `${plan.duration} ${plan.type === 'weekly' ? 'Weeks' : 'Months'} Plan`
            };
        })
        : getEmiPlans(product?.price || 10000).map((p: any) => ({
            id: p.months.toString(), duration: p.months, type: 'monthly', rate: p.rate, emi: p.emi, name: p.name
        }));

    const productImages = product?.imageGallery && product.imageGallery.length > 0 ? product.imageGallery : [product.image];

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 md:px-8 py-10 max-w-7xl animate-pulse">
                <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
                    <div className="lg:w-1/2 space-y-4">
                        <Skeleton className="aspect-square rounded-[2.5rem] w-full" />
                        <div className="flex gap-4">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-20 h-20 rounded-2xl" />)}
                        </div>
                    </div>
                    <div className="lg:w-1/2 space-y-8">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                        </div>
                        <div className="p-8 border rounded-[2rem] space-y-4">
                            <Skeleton className="h-4 w-32" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-16 rounded-xl" />
                                <Skeleton className="h-16 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-40" />
                            <div className="flex gap-4 overflow-x-auto">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="min-w-[120px] h-20 rounded-2xl" />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto px-4 md:px-8 py-10"
        >
            <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">

                {/* Left Column - Image Gallery (Modern Full Width Style) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:w-1/2 flex flex-col gap-3 sm:gap-4"
                >
                    <div className="bg-card border border-border/50 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 flex items-center justify-center aspect-square shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={activeImageIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                                src={productImages[activeImageIndex]}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transform group-hover:scale-105 transition-transform duration-700 ease-out z-10"
                            />
                        </AnimatePresence>

                        <div className="absolute top-6 right-6 bg-background/80 backdrop-blur-md rounded-full px-4 py-2 border font-bold text-accent shadow-sm z-20">
                            {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% Drop
                        </div>
                    </div>

                    {/* Thumbnail Carousel */}
                    {productImages.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1 mt-2">
                            {productImages.map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`w-20 h-20 shrink-0 rounded-2xl border-2 overflow-hidden transition-all bg-white dark:bg-black/20 flex items-center justify-center ${activeImageIndex === idx ? 'border-accent shadow-md shadow-accent/20 opacity-100' : 'border-border/50 opacity-60 hover:opacity-100 hover:border-border'}`}
                                >
                                    <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-2" />
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Right Column - Product Info */}
                <div className="lg:w-1/2 flex flex-col gap-8">

                    <div className="flex flex-col gap-4">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-black text-muted-foreground uppercase tracking-widest"
                        >
                            {product.brand}
                        </motion.span>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]"
                        >
                            {product.name}
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            className="flex items-center gap-4"
                        >
                            <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border/50">
                                <span className="text-sm font-bold">★ {productRating.avgRating || '—'}</span>
                                <span className="text-muted-foreground text-sm font-medium">| {productRating.reviewCount} Review{productRating.reviewCount !== 1 ? 's' : ''}</span>
                            </div>
                        </motion.div>
                    </div>

                        <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col gap-2 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-card to-secondary/20 border border-border/60 shadow-sm"
                    >
                        <div className="flex items-end gap-2 sm:gap-3 flex-wrap">
                            <span className="text-3xl sm:text-5xl font-black tracking-tighter">₹{product.price.toLocaleString('en-IN')}</span>
                            <span className="text-xl text-muted-foreground line-through decoration-muted-foreground/40 font-semibold pb-1">
                                ₹{product.mrp.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <p className="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400 mt-2">
                            <Zap size={16} fill="currentColor" /> Inclusive of all taxes
                        </p>
                    </motion.div>

                    {/* Product Description */}
                    {product.description && (
                         <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                            className="text-muted-foreground leading-relaxed whitespace-pre-wrap"
                         >
                            {product.description}
                         </motion.div>
                    )}

                    {/* EMI Calculator */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col gap-4"
                    >
                        <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <Calculator size={22} className="text-accent" />
                            Instant EMI Options
                        </h3>

                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            {emiPlans.map((plan: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedPlan(idx)}
                                    className={`relative p-3 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 border-2 ${selectedPlan === idx
                                            ? 'border-accent bg-accent/5 shadow-md shadow-accent/10'
                                            : 'border-border/60 bg-card hover:border-border'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-black px-2 py-1 rounded-md uppercase tracking-wide ${selectedPlan === idx ? 'bg-accent text-white' : 'bg-secondary text-muted-foreground'
                                            }`}>
                                            {plan.duration} {plan.type === 'weekly' ? 'Wk' : 'Mo'}
                                        </span>
                                        {plan.rate === 0 && <span className="text-[10px] font-bold text-accent px-2 py-1 bg-accent/10 rounded border border-accent/20">NO COST</span>}
                                    </div>
                                    <div className="text-lg sm:text-2xl font-black tracking-tight mt-1 sm:mt-3">₹{plan.emi.toLocaleString('en-IN')}<span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">/{plan.type === 'weekly' ? 'wk' : 'mo'}</span></div>
                                    <div className="text-sm font-medium text-muted-foreground mt-1">{plan.name} at {plan.rate}% pa</div>

                                    {selectedPlan === idx && (
                                        <motion.div layoutId="plan-selector" className="absolute -inset-[2px] rounded-2xl border-2 border-accent pointer-events-none" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Shop Card inline */}
                    <Link to={`/shop/${product.shopId}`} className="block group">
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="p-5 rounded-2xl flex items-center gap-5 cursor-pointer bg-card border border-border/80 shadow-sm transition-all group-hover:border-accent/40 group-hover:shadow-md"
                        >
                            <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center shrink-0 border border-border group-hover:bg-accent/10 transition-colors">
                                <Store size={24} className="text-accent" />
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="text-lg font-bold group-hover:text-accent transition-colors">{product.shopName}</span>
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                                    <MapPin size={14} /> {product.distance} away — Authorized Partner
                                </span>
                            </div>
                        </motion.div>
                    </Link>

                    <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        <Link to={`/checkout?productId=${product.id}&planIndex=${selectedPlan}`} className="flex-1">
                            <Button variant="accent" size="lg" className="w-full text-lg h-14 rounded-xl shadow-xl shadow-accent/20">
                                <CreditCard size={20} className="mr-2" /> Buy on EMI
                            </Button>
                        </Link>
                        <Button
                            onClick={() => {
                                useCartStore.getState().addItem({
                                    productId: product.id,
                                    name: product.name,
                                    image: product.image,
                                    price: product.price,
                                    shopName: product.shopName,
                                    shopId: product.shopId,
                                    selectedPlanIndex: selectedPlan,
                                });
                                toast.success('Added to cart!', { description: product.name });
                            }}
                            variant="outline" size="lg" className="h-14 rounded-xl border-2 hover:bg-secondary px-5"
                        >
                            <ShoppingCart size={20} />
                        </Button>
                        <Button 
                            onClick={handleContactVendor}
                            variant="outline" size="lg" className="flex-1 text-lg h-14 rounded-xl border-2 hover:bg-secondary">
                            <MessageSquare size={20} className="mr-2" /> Chat with Seller
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 mt-2 pt-6 border-t border-border/50 text-sm font-medium text-muted-foreground">
                        <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-500" /> Authentic Product</span>
                        <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-500" /> 7-Day Replacement</span>
                        <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-500" /> 1 Year Warranty</span>
                    </div>

                    {/* Product Reviews */}
                    <ProductReviews productId={product.id} onRatingLoaded={setProductRating} />

                </div>
            </div>
        </motion.div>
    );
}
