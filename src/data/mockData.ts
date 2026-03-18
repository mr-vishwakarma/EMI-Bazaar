export const products = [
    {
        id: '1',
        name: 'iPhone 15 Pro Max',
        brand: 'Apple',
        price: 159900,
        mrp: 169900,
        image: 'https://images.unsplash.com/photo-1696010078235-efed2499119d?q=80&w=800&auto=format&fit=crop',
        shopId: 's1',
        shopName: 'iStore Electronics',
        distance: '2.4 km',
        category: 'Mobiles',
        rating: 4.8
    },
    {
        id: '2',
        name: 'Sony Bravia 65" 4K Smart TV',
        brand: 'Sony',
        price: 84900,
        mrp: 119900,
        image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop',
        shopId: 's2',
        shopName: 'Metro Reliance',
        distance: '5.1 km',
        category: 'TVs',
        rating: 4.6
    },
    {
        id: '3',
        name: 'LG 8kg Front Load Washing Machine',
        brand: 'LG',
        price: 36500,
        mrp: 45000,
        image: 'https://plus.unsplash.com/premium_photo-1664301556942-d6aeef0e6e7d?q=80&w=800&auto=format&fit=crop',
        shopId: 's1',
        shopName: 'iStore Electronics',
        distance: '2.4 km',
        category: 'Appliances',
        rating: 4.5
    },
    {
        id: '4',
        name: 'MacBook Air M2',
        brand: 'Apple',
        price: 114900,
        mrp: 124900,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop',
        shopId: 's3',
        shopName: 'Apple Premium Reseller',
        distance: '1.2 km',
        category: 'Laptops',
        rating: 4.9
    }
];

export const shops = [
    {
        id: 's1',
        name: 'iStore Electronics',
        address: 'Koramangala 4th Block, Bangalore',
        rating: 4.6,
        reviews: 124,
        distance: '2.4 km',
        lat: 12.9352, // Koramangala
        lng: 77.6245,
        image: 'https://images.unsplash.com/photo-1601599561096-f87c95fff1e9?q=80&w=800&auto=format&fit=crop',
        verified: true
    },
    {
        id: 's2',
        name: 'Metro Reliance',
        address: 'MG Road, Bangalore',
        rating: 4.3,
        reviews: 512,
        distance: '5.1 km',
        lat: 12.9716, // MG Road
        lng: 77.6013,
        image: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?q=80&w=800&auto=format&fit=crop',
        verified: true
    },
    {
        id: 's3',
        name: 'Apple Premium Reseller',
        address: 'Indiranagar, Bangalore',
        rating: 4.8,
        reviews: 89,
        distance: '1.2 km',
        lat: 12.9784, // Indiranagar
        lng: 77.6408,
        image: 'https://images.unsplash.com/photo-1610464858852-6c3ced019889?q=80&w=800&auto=format&fit=crop',
        verified: true
    }
];

export const categories = [
    { name: 'Mobiles', icon: 'Smartphone' },
    { name: 'TVs', icon: 'Tv' },
    { name: 'Laptops', icon: 'Laptop' },
    { name: 'Appliances', icon: 'WashingMachine' },
    { name: 'Audio', icon: 'Headphones' }
];

export const getEmiPlans = (price: number) => {
    return [
        { months: 3, rate: 0, emi: Math.round(price / 3), name: 'No Cost EMI' },
        { months: 6, rate: 0, emi: Math.round(price / 6), name: 'No Cost EMI' },
        { months: 9, rate: 12, emi: Math.round(((price * 1.09) / 9)), name: 'Standard EMI' },
        { months: 12, rate: 14, emi: Math.round(((price * 1.14) / 12)), name: 'Standard EMI' },
    ];
};
