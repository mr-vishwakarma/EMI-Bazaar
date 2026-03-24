import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2, CheckCircle2, Store, Phone, Mail, Globe, Camera, Upload } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'sonner';

const LS_KEY = 'emi-bazaar-vendor-profile';

interface ShopProfileTabProps {
    vendorProfile: any;
    onProfileUpdated?: (profile: any) => void;
}

export default function ShopProfileTab({ vendorProfile, onProfileUpdated }: ShopProfileTabProps) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        business_name: '',
        category: '',
        address: '',
        gstin: '',
        pan: '',
        phone: '',
        email: '',
        upi_id: '',
        profile_photo_url: '',
    });

    // Load: localStorage first → then override with prop
    useEffect(() => {
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setForm(prev => ({ ...prev, ...parsed }));
            } catch { /* ignore */ }
        }
        if (vendorProfile) {
            const merged = {
                business_name: vendorProfile.business_name || '',
                category: vendorProfile.category || '',
                address: vendorProfile.address || '',
                gstin: vendorProfile.gstin || '',
                pan: vendorProfile.pan || '',
                phone: vendorProfile.phone || '',
                email: vendorProfile.email || '',
                upi_id: vendorProfile.upi_id || '',
                profile_photo_url: vendorProfile.profile_photo_url || '',
            };
            setForm(merged);
            localStorage.setItem(LS_KEY, JSON.stringify(merged));
        }
    }, [vendorProfile]);

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
        setProfilePhotoFile(file);
        setProfilePhotoPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let finalPhotoUrl = form.profile_photo_url;
            if (profilePhotoFile) {
                toast.loading('Uploading photo...', { id: 'photo-upload' });
                const fileExt = profilePhotoFile.name.split('.').pop();
                const fileName = `${user.id}/shop_profile_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('vendor-documents').upload(fileName, profilePhotoFile);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('vendor-documents').getPublicUrl(fileName);
                    finalPhotoUrl = publicUrl;
                } else {
                    toast.error('Photo upload failed: ' + uploadError.message);
                }
                toast.dismiss('photo-upload');
            }

            const updatePayload: any = {
                address: form.address,
                phone: form.phone,
                email: form.email,
                upi_id: form.upi_id,
                profile_photo_url: finalPhotoUrl,
            };

            const { error } = await supabase
                .from('vendor_profiles')
                .update(updatePayload)
                .eq('user_id', user.id);

            if (error) throw error;

            // Update form state with final photo URL
            const updatedForm = { ...form, profile_photo_url: finalPhotoUrl };
            setForm(updatedForm);
            setProfilePhotoFile(null);
            setProfilePhotoPreview(null);

            // Cache to localStorage
            localStorage.setItem(LS_KEY, JSON.stringify(updatedForm));
            
            // Notify parent
            onProfileUpdated?.({ ...vendorProfile, ...updatePayload });

            toast.success('Profile saved successfully!');
            setEditing(false);
        } catch (err: any) {
            toast.error('Failed to save: ' + (err.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
        <div className="flex flex-col gap-2">
            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{label}</label>
            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none text-foreground/70">{value || 'N/A'}</div>
        </div>
    );

    const EditableField = ({ label, field, placeholder, icon: Icon }: { label: string; field: string; placeholder?: string; icon?: any }) => (
        <div className="flex flex-col gap-2">
            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{label}</label>
            {editing ? (
                <div className="relative">
                    {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                    <input
                        type="text"
                        value={(form as any)[field]}
                        onChange={(e) => handleChange(field, e.target.value)}
                        placeholder={placeholder}
                        className={`w-full bg-background border-2 border-accent/20 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all ${Icon ? 'pl-10' : ''}`}
                    />
                </div>
            ) : (
                <div className={`w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none ${Icon ? 'flex items-center gap-2' : ''}`}>
                    {Icon && <Icon size={14} className="text-muted-foreground" />}
                    {(form as any)[field] || 'Not set'}
                </div>
            )}
        </div>
    );

    const displayPhoto = profilePhotoPreview || form.profile_photo_url;

    return (
        <motion.div key="registration" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden text-sm max-w-4xl mx-auto">
            <div className="p-8 border-b bg-secondary/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Profile Photo */}
                    <div className="relative group">
                        <div className="w-16 h-16 rounded-2xl bg-accent/10 border-2 border-accent/30 flex items-center justify-center text-accent font-bold text-2xl overflow-hidden shadow-md">
                            {displayPhoto ? (
                                <img src={displayPhoto} alt="Shop" className="w-full h-full object-cover" />
                            ) : (
                                form.business_name?.charAt(0)?.toUpperCase() || <Store size={28} />
                            )}
                        </div>
                        {editing && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <Camera size={20} className="text-white" />
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            className="hidden"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">Shop Profile & Details</h1>
                        <p className="text-muted-foreground">{editing ? 'Edit your contact & address details below.' : 'Your registered business information.'}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {editing ? (
                        <>
                            <Button variant="ghost" onClick={() => { setEditing(false); setProfilePhotoFile(null); setProfilePhotoPreview(null); }} className="rounded-xl font-bold" disabled={saving}>Cancel</Button>
                            <Button variant="accent" onClick={handleSave} className="rounded-xl font-bold gap-2 shadow-lg shadow-accent/20" disabled={saving}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setEditing(true)} className="rounded-xl font-bold border-2 gap-2">
                            <Settings size={16} /> Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Business Details (mostly read-only) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2"><Store size={18} className="text-accent" /> Business Details</h3>
                        <ReadOnlyField label="Legal Shop Name" value={form.business_name} />
                        <ReadOnlyField label="Category" value={form.category} />
                        <ReadOnlyField label="GSTIN Number" value={form.gstin} />
                    </div>

                    {/* KYC & Bank (read-only) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2"><CheckCircle2 size={18} className="text-green-500" /> KYC & Bank Details</h3>
                        <ReadOnlyField label="PAN Number" value={form.pan} />
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Aadhaar / KYC Details</label>
                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none truncate text-foreground/70">
                                Verified securely on {vendorProfile?.submitted_at ? new Date(vendorProfile?.submitted_at).toLocaleDateString() : 'Submission'}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Payout Account</label>
                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium select-none text-foreground/70">
                                A/C: {vendorProfile?.account_no ? '****' + vendorProfile.account_no.slice(-4) : 'N/A'} • IFSC: {vendorProfile?.ifsc || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editable Contact & Address */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2"><Globe size={18} className="text-blue-500" /> Contact & Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditableField label="Phone Number" field="phone" placeholder="+91 99999 99999" icon={Phone} />
                        <EditableField label="Email Address" field="email" placeholder="shop@example.com" icon={Mail} />
                    </div>
                    <EditableField label="UPI ID (for payouts)" field="upi_id" placeholder="yourshop@upi" />
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Physical Address</label>
                        {editing ? (
                            <textarea
                                value={form.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="Full shop address..."
                                className="w-full bg-background border-2 border-accent/20 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all resize-none min-h-[80px]"
                            />
                        ) : (
                            <div className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3 font-medium whitespace-pre-wrap select-none min-h-[80px] text-foreground/70">{form.address || 'N/A'}</div>
                        )}
                    </div>
                </div>

                {editing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-accent/5 border border-accent/20 rounded-2xl p-4 text-xs text-muted-foreground">
                        <p className="font-bold text-accent mb-1">ℹ️ Note</p>
                        <p>Legal business name, GSTIN, PAN, and bank details cannot be changed here. Contact support to update KYC-verified fields.</p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
