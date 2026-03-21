import { supabase } from '../../../lib/supabase';

export interface Shop {
    id: string;
    name: string;
    image: string;
    verified: boolean;
    address: string;
    distance: string;
    rating: number;
    reviews: number;
    lat?: number;
    lng?: number;
}

export const shopApi = {
    async getShopById(id: string): Promise<Shop | null> {
        const { data, error } = await supabase
            .from('shops')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            name: data.name,
            image: data.image_url || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=600&auto=format&fit=crop',
            verified: data.is_verified || false,
            address: data.address || 'Local Street',
            distance: `${(Math.random() * 5 + 0.3).toFixed(1)} km`,
            rating: data.rating || 5.0,
            reviews: data.reviews_count || 0,
            lat: data.lat,
            lng: data.lng,
        };
    },

    async getFeaturedShops(limit = 6): Promise<Shop[]> {
        const { data, error } = await supabase
            .from('shops')
            .select('*')
            .limit(limit);

        if (error || !data) return [];

        return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            image: s.image_url || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=200&auto=format&fit=crop',
            verified: s.is_verified || false,
            address: s.address || 'Local Street',
            distance: `${(Math.random() * 3 + 0.5).toFixed(1)} km`,
            rating: s.rating || 5.0,
            reviews: s.reviews_count || 0,
            lat: s.lat,
            lng: s.lng,
        }));
    }
};
