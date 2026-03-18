import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, FileText, ShieldCheck, CheckCircle2, ChevronRight, UploadCloud, Landmark, Banknote, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Steps: 1=Business Info, 2=KYC & Bank, 3=Documents, 4=Submitted, 5=Skipped
export default function VendorOnboarding() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false); // true if vendor has existing profile
    const navigate = useNavigate();

    // Form States
    const [businessName, setBusinessName] = useState('');
    const [category, setCategory] = useState('');
    const [address, setAddress] = useState('');
    const [gstin, setGstin] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [pan, setPan] = useState('');

    // Document Upload States
    const [gstFile, setGstFile] = useState<File | null>(null);
    const [chequeFile, setChequeFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [existingDocs, setExistingDocs] = useState<any[]>([]);
    const [existingLogo, setExistingLogo] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ gst: boolean; cheque: boolean; logo: boolean }>({ gst: false, cheque: false, logo: false });
    const gstInputRef = useRef<HTMLInputElement>(null!);
    const chequeInputRef = useRef<HTMLInputElement>(null!);
    const logoInputRef = useRef<HTMLInputElement>(null!);

    // Gate: Ensure vendor is logged in + pre-load existing profile for edit mode
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Please create a vendor account first.');
                navigate('/auth');
                return;
            }
            setUserId(user.id);

            // Try to load existing vendor profile
            const { data: profile } = await supabase
                .from('vendor_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                // Pre-fill form with existing data
                setIsEditMode(true);
                setBusinessName(profile.business_name || '');
                setCategory(profile.category || '');
                setAddress(profile.address || '');
                setGstin(profile.gstin || '');
                setAccountNo(profile.account_no || '');
                setIfsc(profile.ifsc || '');
                setAadhaar(profile.aadhaar || '');
                setPan(profile.pan || '');
                setExistingDocs(profile.document_urls || []);
                setExistingLogo(profile.logo_url || null);
            }

            setAuthChecked(true);
        };
        init();
    }, [navigate]);

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(prev => prev + 1);
    };

    const handleSkip = () => {
        toast('You can complete your shop setup from your dashboard anytime.');
        setStep(5);
    };

    // Upload a single file to Supabase Storage
    const uploadFile = async (file: File, type: 'gst_certificate' | 'cancelled_cheque' | 'shop_logo'): Promise<string | null> => {
        if (!userId) return null;
        const ext = file.name.split('.').pop();
        const path = `${userId}/${type}_${Date.now()}.${ext}`;

        const { error } = await supabase.storage
            .from('vendor-documents')
            .upload(path, file, { upsert: true });

        if (error) {
            toast.error(`Failed to upload ${type}: ${error.message}`);
            return null;
        }

        // Get public/signed URL
        const { data } = supabase.storage
            .from('vendor-documents')
            .getPublicUrl(path);

        return data?.publicUrl || null;
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            toast.error('Session expired. Please log in again.');
            setLoading(false);
            navigate('/auth');
            return;
        }

        // Upload documents if selected
        const docUrls = [...existingDocs]; // Start with existing docs
        if (gstFile) {
            setUploadProgress(p => ({ ...p, gst: true }));
            const url = await uploadFile(gstFile, 'gst_certificate');
            setUploadProgress(p => ({ ...p, gst: false }));
            if (url) {
                // Remove old GST entry if exists, add new
                const filtered = docUrls.filter((d: any) => d.type !== 'gst_certificate');
                filtered.push({ type: 'gst_certificate', url, name: gstFile.name });
                docUrls.length = 0;
                docUrls.push(...filtered);
            }
        }
        if (chequeFile) {
            setUploadProgress(p => ({ ...p, cheque: true }));
            const url = await uploadFile(chequeFile, 'cancelled_cheque');
            setUploadProgress(p => ({ ...p, cheque: false }));
            if (url) {
                const filtered = docUrls.filter((d: any) => d.type !== 'cancelled_cheque');
                filtered.push({ type: 'cancelled_cheque', url, name: chequeFile.name });
                docUrls.length = 0;
                docUrls.push(...filtered);
            }
        }

        let newLogoUrl = existingLogo;
        if (logoFile) {
            setUploadProgress(p => ({ ...p, logo: true }));
            const url = await uploadFile(logoFile, 'shop_logo');
            setUploadProgress(p => ({ ...p, logo: false }));
            if (url) {
                newLogoUrl = url;
            }
        }

        // Upsert vendor profile
        const { error: profileError } = await supabase
            .from('vendor_profiles')
            .upsert({
                user_id: authUser.id,
                business_name: businessName,
                category,
                address,
                gstin,
                account_no: accountNo,
                ifsc,
                pan,
                aadhaar,
                document_urls: docUrls,
                logo_url: newLogoUrl,
                submitted_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (profileError) {
            toast.error('Failed to save details: ' + profileError.message);
            setLoading(false);
            return;
        }

        // Set approval_status to 'pending' for admin review
        const { error: statusError } = await supabase
            .from('users')
            .update({ approval_status: 'pending' })
            .eq('id', authUser.id);

        if (statusError) {
            toast.error('Failed to update status: ' + statusError.message);
            setLoading(false);
            return;
        }

        setLoading(false);
        toast.success(isEditMode ? 'Profile updated! Admin will re-review shortly.' : 'Application submitted! Admin will review within 24-48 hours.');
        setStep(4);
    };

    // File input helper
    const FileDropZone = ({
        file, existingDoc, inputRef, label, hint, type, onFileSelect, uploading, accept
    }: {
        file: File | null;
        existingDoc?: any;
        inputRef: React.RefObject<HTMLInputElement>;
        label: string;
        hint: string;
        type: string;
        onFileSelect: (f: File | null) => void;
        uploading?: boolean;
        accept?: string;
    }) => {
        const hasExisting = !!existingDoc;
        const hasNew = !!file;
        const displayName = hasNew ? file!.name : hasExisting ? (existingDoc.name || 'document') : null;

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const selected = e.target.files?.[0];
            if (!selected) return;

            // Enforce Size & Format limit (2MB)
            const isImage = selected.type.startsWith('image/');
            const isPdf = selected.type === 'application/pdf';
            const accepted = accept || 'image/jpeg, image/png, application/pdf';
            
            if (accept && !accept.includes(selected.type) && (!isImage || !accept.includes('image/*'))) {
                 toast.error('Invalid file format selected.');
                 return;
            } else if (!accept && !isImage && !isPdf) {
                 toast.error('Only JPG, PNG, and PDF files are allowed.');
                 return;
            }

            if (selected.size > 2 * 1024 * 1024) {
                 toast.error('File size exceeds the 2MB limit. Please compress it and try again.');
                 return;
            }

            onFileSelect(selected);
        };

        return (
            <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground">{label}</label>
                <input
                    type="file"
                    ref={inputRef}
                    accept={accept || "image/jpeg, image/png, application/pdf"}
                    className="hidden"
                    onChange={handleFileChange}
                />
                <div
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                        hasNew || hasExisting
                            ? 'border-green-500 bg-green-500/5'
                            : 'border-border hover:border-blue-500 bg-secondary/30 hover:bg-blue-500/5'
                    }`}
                >
                    {uploading ? (
                        <Loader2 size={32} className="text-blue-500 animate-spin mb-2" />
                    ) : hasNew || hasExisting ? (
                        <CheckCircle2 size={32} className="text-green-500 mb-2" />
                    ) : (
                        <UploadCloud size={32} className="text-muted-foreground group-hover:text-blue-500 mb-2 transition-colors" />
                    )}

                    {displayName ? (
                        <>
                            <p className="font-bold text-sm text-green-600 truncate max-w-full px-4">{displayName}</p>
                            <p className="text-xs text-muted-foreground mt-1">{hasNew ? 'New file selected — click to change' : 'Previously uploaded — click to replace'}</p>
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-sm">Click to upload</p>
                            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                        </>
                    )}

                    {(hasNew || hasExisting) && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); if (hasNew) onFileSelect(null as any); }}
                            className="mt-2 text-xs text-red-500 hover:underline flex items-center gap-1"
                        >
                            {hasNew ? <><X size={11} /> Remove new file</> : <><UploadCloud size={11} /> Replace</>}
                        </button>
                    )}
                </div>

                {hasExisting && !hasNew && (
                    <a href={existingDoc.url} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        <FileText size={11} /> View uploaded document →
                    </a>
                )}
            </div>
        );
    };

    if (!authChecked) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="w-10 h-10 border-4 border-border border-t-blue-500 rounded-full animate-spin" />
                    <p className="font-semibold">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 container mx-auto">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center">

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tight mb-2">
                        {isEditMode ? 'Complete Your Store Profile' : 'Set Up Your Online Store'}
                    </h1>
                    <p className="text-muted-foreground font-medium max-w-lg mx-auto">
                        {isEditMode
                            ? 'You have an existing profile. Update any missing details and re-submit for admin review.'
                            : "Your account is ready. Now let's create your EMI Bazaar store."}
                    </p>
                    {isEditMode && (
                        <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                            ✏️ Editing existing profile
                        </div>
                    )}
                </div>

                <div className="w-full bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden relative min-h-[500px]">
                    {/* Progress Steps */}
                    <div className="flex bg-secondary/50 border-b border-border text-[10px] sm:text-xs font-bold uppercase tracking-widest relative z-10 overflow-x-auto">
                        {['1. Business', '2. KYC & Bank', '3. Documents'].map((label, idx) => (
                            <div
                                key={idx}
                                onClick={() => { if (step > idx + 1) setStep(idx + 1); }}
                                className={`flex-shrink-0 flex-1 py-4 px-2 text-center border-b-2 transition-colors ${
                                    step > idx + 1
                                        ? 'border-green-500 text-green-600 bg-green-500/5 cursor-pointer hover:bg-green-500/10'
                                        : step === idx + 1
                                        ? 'border-blue-500 text-blue-500 bg-blue-500/5'
                                        : 'border-transparent text-muted-foreground'
                                }`}
                            >
                                {step > idx + 1 ? '✓ ' : ''}{label}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">

                        {/* Step 1: Business Information */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-12">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Store size={24} /></div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Business Information</h2>
                                        <p className="text-sm text-muted-foreground">Tell us about your physical shop</p>
                                    </div>
                                </div>

                                <form onSubmit={handleNext} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground">Registered Shop Name *</label>
                                            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required placeholder="e.g. iStore Electronics" className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground">Primary Category *</label>
                                            <select value={category} onChange={e => setCategory(e.target.value)} required className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all appearance-none">
                                                <option value="" disabled>Select category...</option>
                                                <option value="Mobiles & Tablets">Mobiles & Tablets</option>
                                                <option value="Consumer Electronics">Consumer Electronics</option>
                                                <option value="Home Appliances">Home Appliances</option>
                                                <option value="Furniture">Furniture</option>
                                                <option value="Computers & Laptops">Computers & Laptops</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground">Complete Shop Address *</label>
                                        <textarea value={address} onChange={e => setAddress(e.target.value)} required rows={3} placeholder="Shop No., Street, Landmark, City, State, PIN Code" className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all resize-none"></textarea>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground">GSTIN / Trade License No. <span className="text-muted-foreground font-normal">(optional)</span></label>
                                        <input type="text" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="e.g. 27AAAAA0000A1Z5" className="w-full bg-secondary/50 border border-border focus:border-blue-500 focus:bg-background rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" />
                                    </div>
                                    
                                    <FileDropZone
                                        file={logoFile}
                                        existingDoc={existingLogo ? { name: 'Current Shop Logo', url: existingLogo } : null}
                                        inputRef={logoInputRef}
                                        label="Shop Logo / Profile Image (Optional)"
                                        hint="JPG or PNG (max. 2MB)"
                                        type="shop_logo"
                                        accept="image/jpeg, image/png"
                                        onFileSelect={setLogoFile}
                                        uploading={uploadProgress.logo}
                                    />

                                    <div className="flex justify-between pt-4">
                                        <button type="button" onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground font-semibold underline underline-offset-4">
                                            Skip for now
                                        </button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-blue-500/20">
                                            Continue <ChevronRight size={18} className="ml-2" />
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 2: KYC & Bank */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-12">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Landmark size={24} /></div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Payouts & KYC</h2>
                                        <p className="text-sm text-muted-foreground">Bank details for settlements and identity verification</p>
                                    </div>
                                </div>

                                <form onSubmit={handleNext} className="space-y-6">
                                    <div className="bg-secondary/30 p-6 rounded-2xl border border-border">
                                        <h3 className="font-bold mb-4 flex items-center gap-2"><Banknote size={18} className="text-blue-500" /> Bank Details for Settlement</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Account Number *</label>
                                                <input type="text" value={accountNo} onChange={e => setAccountNo(e.target.value)} required placeholder="1234567890" className="w-full bg-background border border-border focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm outline-none" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">IFSC Code *</label>
                                                <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} required placeholder="HDFC0001234" className="w-full bg-background border border-border focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm outline-none uppercase" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/30 p-6 rounded-2xl border border-border">
                                        <h3 className="font-bold mb-4 flex items-center gap-2 text-base"><ShieldCheck size={18} className="text-blue-500" /> Owner KYC</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">PAN Number *</label>
                                                <input type="text" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} required maxLength={10} placeholder="ABCDE1234F" className="w-full bg-background border border-border focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm outline-none uppercase tracking-widest" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Aadhaar Number *</label>
                                                <input type="text" value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))} required maxLength={12} placeholder="123456789012" className="w-full bg-background border border-border focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm outline-none tracking-widest" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <Button type="button" onClick={() => setStep(1)} variant="outline" className="rounded-xl px-8 h-12 font-bold shadow-none">Back</Button>
                                        <div className="flex items-center gap-4">
                                            <button type="button" onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground font-semibold underline underline-offset-4">
                                                Skip for now
                                            </button>
                                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-blue-500/20">
                                                Continue <ChevronRight size={18} className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 3: Document Upload */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-12">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><FileText size={24} /></div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Upload Documents</h2>
                                        <p className="text-sm text-muted-foreground">Required for store verification — PDF/JPG/PNG (max 5MB each)</p>
                                    </div>
                                </div>

                                <form onSubmit={handleFinalSubmit} className="space-y-6">
                                    <FileDropZone
                                        file={gstFile}
                                        existingDoc={existingDocs.find(d => d.type === 'gst_certificate')}
                                        inputRef={gstInputRef}
                                        label="GST Certificate / Trade License *"
                                        hint="PDF, JPG or PNG (max. 2MB)"
                                        type="gst_certificate"
                                        onFileSelect={setGstFile}
                                        uploading={uploadProgress.gst}
                                    />
                                    <FileDropZone
                                        file={chequeFile}
                                        existingDoc={existingDocs.find(d => d.type === 'cancelled_cheque')}
                                        inputRef={chequeInputRef}
                                        label="Cancelled Cheque *"
                                        hint="Must show name & a/c no. (Max 2MB)"
                                        type="cancelled_cheque"
                                        onFileSelect={setChequeFile}
                                        uploading={uploadProgress.cheque}
                                    />

                                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-xs text-muted-foreground">
                                        <p className="font-bold text-foreground mb-1">📋 Document requirements:</p>
                                        <ul className="space-y-1 pl-4 list-disc">
                                            <li>Documents must be clear, unedited, and valid</li>
                                            <li>GSTIN should match the business address submitted</li>
                                            <li>Cancelled cheque must show your name and IFSC/account number</li>
                                        </ul>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <Button type="button" onClick={() => setStep(2)} variant="outline" className="rounded-xl px-8 h-12 font-bold shadow-none">Back</Button>
                                        <div className="flex items-center gap-4">
                                            <button type="button" onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground font-semibold underline underline-offset-4">
                                                Skip for now
                                            </button>
                                            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-blue-500/20">
                                                {loading
                                                    ? <><Loader2 size={16} className="animate-spin mr-2" /> Uploading...</>
                                                    : isEditMode ? 'Update & Resubmit' : 'Submit Application'
                                                }
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 4: Submitted / Pending Approval */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 md:p-16 flex flex-col items-center text-center">
                                <div className="bg-green-500/10 text-green-500 rounded-full p-6 mb-6">
                                    <ShieldCheck size={56} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-3xl font-black mb-3">
                                    {isEditMode ? 'Profile Updated!' : 'Application Submitted!'}
                                </h2>
                                <p className="text-muted-foreground text-base mb-8 max-w-md">
                                    {isEditMode
                                        ? `Your updated profile for ${businessName || 'your store'} has been sent for re-review. Admin will verify your changes shortly.`
                                        : `Your application for ${businessName || 'your store'} is under review. Our team will verify your details within 24–48 hours.`
                                    }
                                </p>

                                <div className="bg-yellow-500/5 border border-yellow-500/20 w-full max-w-md rounded-2xl p-5 text-left mb-8">
                                    <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-4">⏳ Application Status</p>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Account Created', done: true },
                                            { label: 'Details Submitted', done: true },
                                            { label: 'KYC & Document Review', done: false, active: true },
                                            { label: 'Store Activation', done: false },
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                {s.done
                                                    ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                                    : <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${s.active ? 'border-yellow-500' : 'border-muted-foreground'}`} />
                                                }
                                                <span className={`text-sm ${s.done ? 'font-semibold' : 'text-muted-foreground'}`}>{s.label}</span>
                                                {s.active && <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold ml-auto">In Progress</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button onClick={() => navigate('/vendor')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-8 h-12">
                                    Go to My Dashboard
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 5: Skipped Registration */}
                        {step === 5 && (
                            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 md:p-16 flex flex-col items-center text-center">
                                <div className="bg-blue-500/10 text-blue-500 rounded-full p-6 mb-6">
                                    <Store size={48} strokeWidth={2} />
                                </div>
                                <h2 className="text-3xl font-black mb-3">Saved for Later</h2>
                                <p className="text-muted-foreground text-base mb-8 max-w-md">
                                    Complete your store setup from the dashboard anytime. Dashboard access unlocks after admin approval.
                                </p>
                                <div className="bg-orange-500/5 border border-orange-500/20 w-full max-w-md rounded-2xl p-5 text-left mb-8">
                                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-3">⚠️ To unlock full dashboard:</p>
                                    <ul className="text-sm text-muted-foreground space-y-2 pl-4 list-disc">
                                        <li>Complete your Business & KYC details</li>
                                        <li>Upload GST certificate & cancelled cheque</li>
                                        <li>Wait for Admin approval (24–48 hrs)</li>
                                    </ul>
                                </div>
                                <Button onClick={() => navigate('/vendor')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-8 h-12">
                                    Go to Dashboard
                                </Button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
