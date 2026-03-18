import { Link } from 'react-router-dom';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateDistance } from '../lib/utils';

export default function ShopCard({ shop }: { shop: any }) {
    // Simulated User Location (Central Bangalore)
    const MOCK_USER_LAT = 12.9716;
    const MOCK_USER_LNG = 77.5946;

    // Calculate actual distance if Shop has coordinates, otherwise fallback to static mock data
    const displayDistance = (shop.lat && shop.lng)
        ? calculateDistance(MOCK_USER_LAT, MOCK_USER_LNG, shop.lat, shop.lng)
        : shop.distance;

    return (
        <Link to={`/shop/${shop.id}`} className="block h-full group">
            <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="flex bg-card border border-border/60 p-4 items-center gap-5 rounded-2xl shadow-sm hover:shadow-xl hover:border-accent/30 transition-all cursor-pointer h-full"
            >
                <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden ring-1 ring-border shadow-inner">
                    <img
                        src={shop.image}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                    {shop.verified && (
                        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full p-1 shadow-sm">
                            <BadgeCheck size={16} fill="hsl(var(--accent))" stroke="hsl(var(--background))" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-center flex-1 py-1">
                    <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-accent transition-colors flex items-center leading-tight">
                        {shop.name}
                    </h3>

                    <p className="text-sm font-medium text-muted-foreground mt-1.5 flex items-center gap-1.5 opacity-80">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">{shop.address}</span>
                    </p>

                    <div className="flex items-center gap-3 mt-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold bg-secondary px-2.5 py-1 rounded-md text-foreground shadow-sm">
                            <Star size={12} fill="currentColor" />
                            <span>{shop.rating}</span>
                            <span className="text-muted-foreground font-medium ml-1">({shop.reviews})</span>
                        </div>
                        <div className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-md whitespace-nowrap border border-accent/20">
                            {displayDistance} away
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
