import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Upload, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useNavigate } from 'react-router-dom';

interface InventoryTabProps {
    isAddingProduct: boolean;
    setIsAddingProduct: (v: boolean) => void;
    editingProductId: string | null;
    setEditingProductId: (id: string | null) => void;
    newProduct: { name: string; price: string; mrp: string; stock: string; description: string };
    setNewProduct: (p: any) => void;
    selectedCategory: string;
    setSelectedCategory: (c: string) => void;
    dbCategories: any[];
    productImageFiles: File[];
    setProductImageFiles: (files: File[]) => void;
    isSavingProduct: boolean;
    submitNewProduct: () => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    myProducts: any[];
    fetchingProducts: boolean;
    handleEditProduct: (p: any) => void;
    handleDeleteProduct: (id: string) => void;
}

export default function InventoryTab({
    isAddingProduct, setIsAddingProduct, editingProductId, setEditingProductId,
    newProduct, setNewProduct, selectedCategory, setSelectedCategory,
    dbCategories, productImageFiles, setProductImageFiles, isSavingProduct,
    submitNewProduct, searchQuery, setSearchQuery, myProducts, fetchingProducts,
    handleEditProduct, handleDeleteProduct
}: InventoryTabProps) {
    const navigate = useNavigate();

    return (
        <motion.div key="inventory" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm">
            {/* Header */}
            <div className="p-8 border-b bg-secondary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black">{isAddingProduct ? (editingProductId ? 'Edit Product' : 'Add New Product') : 'Product Management'}</h1>
                    <p className="text-muted-foreground">{isAddingProduct ? (editingProductId ? 'Update your product listing details.' : 'Create a new offline/online product listing.') : 'Add products, update pricing, and manage stock.'}</p>
                </div>
                {!isAddingProduct && (
                    <div className="flex w-full md:w-auto items-center gap-3">
                        <div className="relative flex-1 md:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-background border rounded-full pl-9 pr-4 py-2 outline-none"
                                placeholder="Search products..."
                            />
                        </div>
                        <Button variant="accent" onClick={() => setIsAddingProduct(true)} className="rounded-full shadow-lg shadow-accent/20 font-bold px-6">
                            <Plus size={18} className="mr-2" /> Add Product
                        </Button>
                    </div>
                )}
            </div>

            {/* Add / Edit Form */}
            {isAddingProduct ? (
                <div className="p-8 space-y-6 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Image Upload */}
                        <div className="col-span-1 md:col-span-2 flex items-center gap-4 bg-background p-4 rounded-xl border border-dashed border-border mb-2">
                            <div className="flex gap-2 overflow-x-auto pb-2 max-w-[50%]">
                                {productImageFiles.length > 0 ? (
                                    productImageFiles.map((file, idx) => (
                                        <div key={idx} className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center shrink-0 border overflow-hidden">
                                            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center shrink-0 border">
                                        <Upload className="text-muted-foreground w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="font-bold text-sm block mb-1">Product Images (Multiple allowed)</label>
                                <input type="file" multiple accept="image/*" onChange={e => setProductImageFiles(Array.from(e.target.files || []))} className="text-xs w-full text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer outline-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-bold text-xs uppercase text-muted-foreground">Product Name *</label>
                            <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base" placeholder="Sony 65 inch TV" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-bold text-xs uppercase text-muted-foreground">Category *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    list="category-suggestions"
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base capitalize"
                                    placeholder="Type or select a category (e.g. Mobiles)"
                                />
                                <datalist id="category-suggestions">
                                    {dbCategories.map(cat => (
                                        <option key={cat.id} value={cat.name} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="font-bold text-xs uppercase text-muted-foreground">Selling Price (₹) *</label>
                            <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base" placeholder="55000" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-bold text-xs uppercase text-muted-foreground">Original MRP (₹)</label>
                            <input type="number" value={newProduct.mrp} onChange={e => setNewProduct({ ...newProduct, mrp: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base" placeholder="65000" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-bold text-xs uppercase text-muted-foreground">Stock Count</label>
                            <input type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base" placeholder="10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="font-bold text-xs uppercase text-muted-foreground">Description</label>
                        <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full bg-secondary border border-transparent focus:border-accent rounded-xl px-4 py-3 outline-none font-medium text-base resize-none h-24" placeholder="Features, specifications..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-secondary">
                        <Button variant="outline" onClick={() => { setIsAddingProduct(false); setEditingProductId(null); setNewProduct({ name: '', price: '', mrp: '', stock: '', description: '' }); }} disabled={isSavingProduct} className="rounded-xl font-bold px-6">Cancel</Button>
                        <Button variant="accent" onClick={submitNewProduct} disabled={isSavingProduct} className="rounded-xl shadow-lg shadow-accent/20 font-bold px-8">
                            {isSavingProduct ? 'Saving...' : (editingProductId ? 'Update Product' : 'Save Catalog')}
                        </Button>
                    </div>
                </div>
            ) : (
                /* Product Table */
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="text-muted-foreground text-xs uppercase tracking-widest font-bold border-b">
                                <th className="p-6">Product Item</th>
                                <th className="p-6">EMI Tag / ID</th>
                                <th className="p-6">Price Details</th>
                                <th className="p-6">Stock Status</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fetchingProducts ? (
                                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Loading products...</td></tr>
                            ) : myProducts.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No products added yet. Start adding your inventory!</td></tr>
                            ) : myProducts
                                .filter((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.short_tag?.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((p, i) => (
                                    <tr key={i} className="group hover:bg-secondary/40 border-b last:border-0 transition-colors">
                                        <td className="p-6 flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white dark:bg-black/10 rounded-xl border flex items-center justify-center p-2 shrink-0">
                                                <img src={p.image_url || 'https://via.placeholder.com/150'} alt={p.name} className="w-full h-full object-cover rounded-lg mix-blend-multiply dark:mix-blend-normal" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-muted-foreground uppercase">{p.category?.name || 'Uncategorized'}</span>
                                                <p className="font-bold text-base leading-tight max-w-[200px] truncate">{p.name}</p>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="bg-secondary px-3 py-1.5 rounded-lg border inline-flex items-center gap-2">
                                                <span className="font-black tracking-wider text-sm">{p.short_tag || 'PENDING'}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-lg font-black shrink-0">₹{p.price?.toLocaleString() || 0}</p>
                                            {p.original_price && <p className="text-xs text-muted-foreground line-through">MRP ₹{p.original_price.toLocaleString()}</p>}
                                        </td>
                                        <td className="p-6">
                                            <span className={`${p.stock_count > 0 ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'} font-bold text-xs px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 shrink-0`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${p.stock_count > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                {p.stock_count > 0 ? `In Stock (${p.stock_count})` : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(`/product/${p.short_tag}`)} title="View Customer Product Page"><Eye size={14} /></Button>
                                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEditProduct(p)} title="Edit Product"><Edit size={14} /></Button>
                                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20" onClick={() => handleDeleteProduct(p.id)} title="Delete Product"><Trash size={14} /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
}
