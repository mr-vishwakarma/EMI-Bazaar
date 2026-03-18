import { supabase } from '../../../lib/supabase';

export interface Product {
    id: string;
    name: string;
    brand: string;
    image: string;
    imageGallery: string[];
    price: number;
    mrp: number;
    rating: number;
    shopName: string;
    distance: string;
    shopId: string;
    description: string;
}

export const productsApi = {
    async getFeaturedProducts(limit = 8): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*, shop:shops(name, lat, lng), category:categories(name)')
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (error || !data) return [];
        return data.map((p: any) => ({
            id: p.short_tag || p.id,
            name: p.name,
            brand: p.category?.name || 'Local',
            image: p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
            imageGallery: p.image_gallery || [],
            price: p.price,
            mrp: p.original_price || p.price * 1.2,
            rating: 4.8,
            shopName: p.shop?.name || 'Partner Store',
            distance: '2.5 km',
            shopId: p.shop_id,
            description: p.description || ''
        }));
    },
    
    async getShopProducts(shopId: string, shopName: string): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*, category:categories(name)')
            .eq('shop_id', shopId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
            
        if (error || !data) return [];
        return data.map((p: any) => ({
            id: p.short_tag || p.id,
            name: p.name,
            brand: p.category?.name || 'Local',
            image: p.image_url || 'https://via.placeholder.com/300',
            imageGallery: p.image_gallery || [],
            price: p.price,
            mrp: p.original_price || p.price * 1.2,
            rating: 4.8,
            shopName: shopName,
            distance: '2.5 km',
            shopId: p.shop_id,
            description: p.description || ''
        }));
    },

    async getProductById(id: string): Promise<Product | null> {
        let query = supabase.from('products').select('*, shop:shops(name, lat, lng), category:categories(name)');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        if (isUuid) {
             query = query.eq('id', id);
        } else {
             query = query.eq('short_tag', id);
        }
        
        const { data, error } = await query.single();
        if (error || !data) return null;
        
        return {
            id: data.id,
            name: data.name,
            brand: data.category?.name || 'Authorized Store',
            image: data.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=100',
            imageGallery: data.image_gallery || [],
            price: data.price,
            mrp: data.original_price || data.price * 1.2,
            rating: 4.8,
            shopName: data.shop?.name || 'EMI Partner',
            distance: '2.5 km', 
            shopId: data.shop_id,
            description: data.description || 'No detailed description available.'
        };
    }
};
