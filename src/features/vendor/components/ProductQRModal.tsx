import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface ProductQRModalProps {
    product: {
        name: string;
        short_tag: string;
        price: number;
        image_url?: string;
        category?: { name: string };
    } | null;
    onClose: () => void;
}

export default function ProductQRModal({ product, onClose }: ProductQRModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    if (!product) return null;

    // The QR code encodes the full product URL for customer scanning
    const baseUrl = window.location.origin.includes('localhost') ? 'https://emi-bazaar.vercel.app' : window.location.origin;
    const qrValue = `${baseUrl}/product/${product.short_tag}`;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=400,height=500');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>EMI Label – ${product.short_tag}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Arial', sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
                    .label { width: 320px; border: 2px solid #000; border-radius: 16px; overflow: hidden; }
                    .label-header { background: #FF6B3D; color: white; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
                    .label-header .brand { font-size: 18px; font-weight: 900; letter-spacing: 2px; }
                    .label-header .badge { font-size: 9px; font-weight: 700; background: rgba(255,255,255,0.25); padding: 3px 8px; border-radius: 999px; letter-spacing: 1px; }
                    .label-body { padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
                    .product-name { font-size: 15px; font-weight: 800; text-align: center; color: #111; line-height: 1.3; }
                    .product-cat { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; }
                    .qr-wrap { padding: 10px; border: 2px solid #eee; border-radius: 12px; }
                    .short-tag { font-size: 20px; font-weight: 900; letter-spacing: 3px; color: #111; font-family: monospace; border: 2px dashed #FF6B3D; padding: 6px 16px; border-radius: 8px; }
                    .price { font-size: 13px; color: #555; font-weight: 700; }
                    .price strong { font-size: 22px; color: #111; font-weight: 900; }
                    .instruction { font-size: 10px; color: #888; text-align: center; padding: 0 16px; line-height: 1.5; }
                    .label-footer { background: #f9f9f9; border-top: 1px solid #eee; padding: 8px; text-align: center; font-size: 9px; font-weight: 700; color: #aaa; letter-spacing: 1px; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div class="label">
                    <div class="label-header">
                        <span class="brand">EMI Bazaar</span>
                        <span class="badge">✦ 0% EMI Available</span>
                    </div>
                    <div class="label-body">
                        <p class="product-cat">${product.category?.name || 'Product'}</p>
                        <p class="product-name">${product.name}</p>
                        <div class="qr-wrap">
                            ${printContent.querySelector('svg')?.outerHTML || ''}
                        </div>
                        <span class="short-tag">${product.short_tag}</span>
                        <p class="price">Price: <strong>₹${product.price?.toLocaleString('en-IN')}</strong></p>
                        <p class="instruction">📲 Scan QR or share this ID with vendor to get this product on 0% EMI</p>
                    </div>
                    <div class="label-footer">emibazaar.com · Authorized Reseller</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-card w-full max-w-xs rounded-3xl shadow-2xl border overflow-hidden max-h-[92vh] flex flex-col"
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
                        <div>
                            <h2 className="font-black text-base">QR Label</h2>
                            <p className="text-muted-foreground text-[11px]">Print & stick on the product shelf</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">

                        {/* Label Preview Card */}
                        <div ref={printRef} className="border-2 border-border rounded-xl overflow-hidden mx-auto" style={{ maxWidth: 240 }}>
                            {/* Label Header */}
                            <div className="bg-accent px-3 py-2 flex items-center justify-between">
                                <span className="text-white font-black text-sm tracking-widest">EMI Bazaar</span>
                                <span className="text-[8px] font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">0% EMI</span>
                            </div>

                            {/* Label Body */}
                            <div className="bg-white px-3 py-3 flex flex-col items-center gap-2">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{product.category?.name || 'Product'}</p>
                                <p className="font-black text-gray-900 text-xs text-center leading-tight">{product.name}</p>

                                {/* QR Code */}
                                <div className="p-2 border-2 border-gray-100 rounded-lg">
                                    <QRCodeSVG
                                        value={qrValue}
                                        size={100}
                                        bgColor="#ffffff"
                                        fgColor="#111111"
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>

                                {/* Short Tag */}
                                <div className="border-2 border-dashed border-accent px-3 py-1 rounded-md">
                                    <span className="font-black text-sm tracking-[3px] text-gray-900 font-mono">{product.short_tag}</span>
                                </div>

                                {/* Price */}
                                <p className="text-xs text-gray-500 font-semibold">
                                    ₹<span className="text-base font-black text-gray-900">{product.price?.toLocaleString('en-IN')}</span>
                                </p>
                            </div>

                            {/* Label Footer */}
                            <div className="bg-gray-50 border-t py-1.5 text-center">
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">emibazaar.com</p>
                            </div>
                        </div>

                        {/* How it works — compact inline steps */}
                        <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                            {['Print & place on product', 'Customer scans QR', 'Search tag in POS → EMI'].map((step, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 text-center">
                                    <span className="w-5 h-5 rounded-full bg-accent/10 text-accent font-black text-[10px] flex items-center justify-center shrink-0">{i + 1}</span>
                                    <span className="leading-tight">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 px-4 py-3 border-t shrink-0">
                        <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl font-bold h-10 text-sm">
                            Cancel
                        </Button>
                        <Button
                            variant="accent"
                            onClick={handlePrint}
                            className="flex-[2] rounded-xl font-bold h-10 text-sm shadow-lg shadow-accent/20"
                        >
                            <Printer size={16} className="mr-1.5" />
                            Print Label
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
