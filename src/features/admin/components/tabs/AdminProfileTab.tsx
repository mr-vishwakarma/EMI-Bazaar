import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Loader2, ShieldCheck, Mail, Phone, Globe, Camera } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'sonner';

const LS_KEY = 'emi-bazaar-admin-profile';

export default function AdminProfileTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        avatar_url: '',
    });

    useEffect(() => {
        // Load from localStorage first
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
            try {
                setForm(prev => ({ ...prev, ...JSON.parse(cached) }));
            } catch { /* ignore */ }
        }

        // Then hydrate from DB
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const profile = {
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
                    email: user.email || '',
                    phone: user.user_metadata?.phone || '',
                    avatar_url: user.user_metadata?.avatar_url || '',
                };

                // Also check users table
                const { data: userData } = await supabase
                    .from('users')
                    .select('full_name, phone, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (userData) {
                    profile.full_name = userData.full_name || profile.full_name;
                    profile.phone = userData.phone || profile.phone;
                    profile.avatar_url = userData.avatar_url || profile.avatar_url;
                }

                setForm(profile);
                localStorage.setItem(LS_KEY, JSON.stringify(profile));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let finalAvatarUrl = form.avatar_url;
            if (avatarFile) {
                toast.loading('Uploading photo...', { id: 'admin-avatar' });
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}/admin_avatar_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('vendor-documents').upload(fileName, avatarFile);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('vendor-documents').getPublicUrl(fileName);
                    finalAvatarUrl = publicUrl;
                } else {
                    toast.error('Photo upload failed: ' + uploadError.message);
                }
                toast.dismiss('admin-avatar');
            }

            // Update users table
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: form.full_name,
                    phone: form.phone,
                    avatar_url: finalAvatarUrl,
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update auth metadata too
            await supabase.auth.updateUser({
                data: {
                    full_name: form.full_name,
                    phone: form.phone,
                    avatar_url: finalAvatarUrl,
                }
            });

            // Update form state
            setForm(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
            setAvatarFile(null);
            setAvatarPreview(null);

            // Cache to localStorage
            localStorage.setItem(LS_KEY, JSON.stringify({ ...form, avatar_url: finalAvatarUrl }));

            toast.success('Admin profile updated!');
            setEditing(false);
        } catch (err: any) {
            toast.error('Failed to save: ' + (err.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div key="admin-profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-3xl mx-auto space-y-8 pb-10">
            {/* Profile Header Card */}
            <div className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-8 pb-20 relative">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={24} className="text-white/80" />
                        <div>
                            <h1 className="text-2xl font-black text-white">Admin Profile</h1>
                            <p className="text-white/60 text-sm font-medium">System administrator account settings.</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 -mt-12 relative z-10 pb-8">
                    {/* Avatar */}
                    <div className="flex items-end gap-6 mb-8">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center text-3xl font-black text-rose-500 shrink-0 overflow-hidden">
                                {(avatarPreview || form.avatar_url) ? (
                                    <img src={avatarPreview || form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    form.full_name?.charAt(0).toUpperCase() || 'A'
                                )}
                            </div>
                            {editing && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <Camera size={24} className="text-white" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarSelect}
                                className="hidden"
                            />
                        </div>
                        <div className="pb-1">
                            <h2 className="text-2xl font-black">{form.full_name || 'Administrator'}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/20">ROOT ADMIN</span>
                                <span className="text-xs text-muted-foreground font-medium">{form.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Edit Button */}
                    <div className="flex justify-end mb-6">
                        {editing ? (
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null); }} className="rounded-xl font-bold" disabled={saving}>Cancel</Button>
                                <Button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold gap-2 shadow-lg shadow-rose-500/20" disabled={saving}>
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline" onClick={() => setEditing(true)} className="rounded-xl font-bold border-2 gap-2">
                                <User size={16} /> Edit Profile
                            </Button>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Full Name</label>
                                {editing ? (
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={form.full_name}
                                            onChange={(e) => handleChange('full_name', e.target.value)}
                                            placeholder="Your name"
                                            className="w-full bg-background border-2 border-rose-500/20 rounded-xl pl-10 pr-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/40 transition-all"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full bg-secondary rounded-xl px-4 py-3 font-medium flex items-center gap-2">
                                        <User size={14} className="text-muted-foreground" /> {form.full_name || 'Not set'}
                                    </div>
                                )}
                            </div>

                            {/* Email (read-only) */}
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email Address</label>
                                <div className="w-full bg-secondary rounded-xl px-4 py-3 font-medium flex items-center gap-2 text-foreground/70">
                                    <Mail size={14} className="text-muted-foreground" /> {form.email || 'Not set'}
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Phone Number</label>
                                {editing ? (
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={form.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            placeholder="+91 99999 99999"
                                            className="w-full bg-background border-2 border-rose-500/20 rounded-xl pl-10 pr-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/40 transition-all"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full bg-secondary rounded-xl px-4 py-3 font-medium flex items-center gap-2">
                                        <Phone size={14} className="text-muted-foreground" /> {form.phone || 'Not set'}
                                    </div>
                                )}
                            </div>

                            {/* Profile Photo Upload */}
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Profile Photo</label>
                                {editing ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full bg-background border-2 border-dashed border-rose-500/20 rounded-xl px-4 py-3 font-medium flex items-center gap-3 cursor-pointer hover:border-rose-500/40 hover:bg-rose-500/5 transition-all"
                                    >
                                        <Camera size={16} className="text-muted-foreground" />
                                        <span className="text-sm">{avatarFile ? avatarFile.name : 'Click to upload a photo...'}</span>
                                    </div>
                                ) : (
                                    <div className="w-full bg-secondary rounded-xl px-4 py-3 font-medium flex items-center gap-2">
                                        <Camera size={14} className="text-muted-foreground" /> {form.avatar_url ? 'Custom avatar set ✓' : 'Default avatar'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Info */}
            <div className="bg-card rounded-[2.5rem] border shadow-sm p-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck size={20} className="text-rose-500" /> Security & Access</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-500/5 p-5 rounded-2xl border border-green-500/10">
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Authentication</p>
                        <p className="font-bold">Email + Password</p>
                    </div>
                    <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10">
                        <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Role</p>
                        <p className="font-bold">Root Administrator</p>
                    </div>
                    <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10">
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Access Level</p>
                        <p className="font-bold">Full System Access</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
