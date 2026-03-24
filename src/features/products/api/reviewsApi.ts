import { supabase } from '../../../lib/supabase';

export interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    customer_name: string;
}

export interface ProductRating {
    avgRating: number;
    reviewCount: number;
}

export const reviewsApi = {
    async getProductReviews(productId: string): Promise<Review[]> {
        // We need the actual UUID, not the short_tag
        let actualId = productId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
        
        if (!isUuid) {
            const { data } = await supabase
                .from('products')
                .select('id')
                .eq('short_tag', productId)
                .single();
            if (data) actualId = data.id;
            else return [];
        }

        const { data, error } = await supabase
            .from('product_reviews')
            .select('id, rating, comment, created_at, customer:customer_profiles!customer_id(full_name)')
            .eq('product_id', actualId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error || !data) return [];

        return data.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            customer_name: r.customer?.full_name || 'Anonymous',
        }));
    },

    async getProductRating(productId: string): Promise<ProductRating> {
        let actualId = productId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
        
        if (!isUuid) {
            const { data } = await supabase
                .from('products')
                .select('id')
                .eq('short_tag', productId)
                .single();
            if (data) actualId = data.id;
            else return { avgRating: 0, reviewCount: 0 };
        }

        const { data, error } = await supabase
            .from('product_reviews')
            .select('rating')
            .eq('product_id', actualId);

        if (error || !data || data.length === 0) return { avgRating: 0, reviewCount: 0 };

        const total = data.reduce((sum: number, r: any) => sum + r.rating, 0);
        return {
            avgRating: Math.round((total / data.length) * 10) / 10,
            reviewCount: data.length,
        };
    },

    async submitReview(productId: string, rating: number, comment: string): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        let actualId = productId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
        
        if (!isUuid) {
            const { data } = await supabase
                .from('products')
                .select('id')
                .eq('short_tag', productId)
                .single();
            if (data) actualId = data.id;
            else return false;
        }

        const { error } = await supabase.from('product_reviews').insert({
            product_id: actualId,
            customer_id: user.id,
            rating,
            comment: comment.trim() || null,
        });

        return !error;
    },
};
