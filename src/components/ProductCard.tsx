import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductCard({ product }: { product: any }) {
    const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

    return (
        <Link to={`/product/${product.id}`} className="block h-full group">
            <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                className="flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 h-full"
            >
                <div className="relative aspect-square p-6 bg-white/50 dark:bg-black/5 flex items-center justify-center">
                    <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                    <div className="absolute top-4 left-4 bg-accent/10 border border-accent/20 text-accent text-xs font-bold px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md">
                        {discount}% OFF
                    </div>
                </div>

                <div className="flex flex-col flex-1 p-5 gap-3">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">{product.brand}</span>
                            <h3 className="text-base font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-accent transition-colors">
                                {product.name}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1 bg-secondary/80 px-2 py-1 rounded-md mb-auto shrink-0">
                            <Star size={12} className="fill-foreground text-foreground" />
                            <span className="text-xs font-bold">{product.rating}</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 mt-auto pt-2">
                        <span className="text-xl font-black tracking-tight">₹{product.price.toLocaleString('en-IN')}</span>
                        <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50 pb-0.5">₹{product.mrp.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="bg-secondary/40 rounded-lg p-2.5 mt-1 border border-border/50">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent/70">0% EMI</span>
                            <span className="text-muted-foreground font-medium">from <span className="text-foreground font-bold">₹{Math.round(product.price / 6)}</span>/mo</span>
                        </div>
                    </div>

                    <div className="h-[1px] w-full bg-border/60 my-1" />

                    <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5 truncate pr-2">
                            <StoreIcon size={14} className="opacity-70" /> {product.shopName}
                        </span>
                        <span className="flex items-center gap-1 text-accent whitespace-nowrap bg-accent/5 px-2 py-1 rounded-md">
                            <MapPin size={12} /> {product.distance}
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

const StoreIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></svg>
);
