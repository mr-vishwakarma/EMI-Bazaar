import { useState, useEffect } from 'react';

export const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (document.getElementById('razorpay-script')) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => setIsLoaded(true);
        script.onerror = () => console.error('Failed to load Razorpay script');
        document.body.appendChild(script);

        return () => {
            // Optional: remove script on unmount
        };
    }, []);

    return isLoaded;
};
