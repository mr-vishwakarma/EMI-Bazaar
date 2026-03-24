import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    productId: string;
    name: string;
    image: string;
    price: number;
    shopName: string;
    shopId: string;
    selectedPlanIndex: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const exists = get().items.find(i => i.productId === item.productId);
                if (exists) {
                    // Update the plan if already in cart
                    set({
                        items: get().items.map(i =>
                            i.productId === item.productId ? item : i
                        )
                    });
                } else {
                    set({ items: [...get().items, item] });
                }
            },
            removeItem: (productId) => {
                set({ items: get().items.filter(i => i.productId !== productId) });
            },
            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'emi-bazaar-cart',
        }
    )
);
