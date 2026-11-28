'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CheckCircle2, 
  Store, 
  FileText, 
  CreditCard, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  Camera,
  Trash2,
  FileUp,
  Mail,
  KeyRound,
  X
} from 'lucide-react';
import Image from 'next/image';

export default function ShopRegistrationPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);

  // Step 4 Email OTP Verification State
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');
  const [emailOtpInfo, setEmailOtpInfo] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState('');
  const [emailOtpSecondsLeft, setEmailOtpSecondsLeft] = useState(0);
  const [isBranchMode, setIsBranchMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=new-branch')) {
      try {
        const raw = sessionStorage.getItem('mbm_add_branch_prefill');
        if (raw) {
          const parsed = JSON.parse(raw);
          setIsBranchMode(true);
          setFormData((prev) => ({
            ...prev,
            shopName: parsed.shopName || prev.shopName,
            ownerName: parsed.ownerName || prev.ownerName,
            phone: String(parsed.phone || prev.phone).replace(/\D/g, '').slice(-10),
            email: parsed.email || prev.email,
            address: '',
            pincode: '',
          }));
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (emailOtpSecondsLeft <= 0 || emailVerified) return;
    const timer = setInterval(() => {
      setEmailOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailOtpSecondsLeft, emailVerified]);

  // Form State
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Ranchi',
    state: 'Jharkhand',
    pincode: '834001',
    businessType: 'KIRANA_GENERAL',
    yearsInBusiness: 5,
    fssaiNumber: '',
    tradeLicenseNumber: '',
    gstin: '',
    panNumber: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    // Document URLs (Attached verification proofs)
    documents: {
      tradeLicenseUrl: '',
      fssaiCertUrl: '',
      panCardUrl: '',
      storePhotoUrl: '',
    }
  });

  // Track file metadata & preview for uploaded documents
  const [docUploads, setDocUploads] = useState<{
    [key: string]: {
      fileName: string;
      previewUrl: string;
      isPdf: boolean;
      uploading: boolean;
    };
  }>({});

  // Field validation helpers
  const cleanPhone = formData.phone.replace(/\D/g, '');
  const cleanFssai = formData.fssaiNumber.replace(/\D/g, '');
  const cleanPan = formData.panNumber.trim().toUpperCase();
  const cleanPincode = formData.pincode.replace(/\D/g, '');
  const cleanIfsc = formData.ifscCode.trim().toUpperCase();

  const isPhoneValid = cleanPhone.length === 10;
  const isFssaiValid = cleanFssai.length === 14;
  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan);
  const isPincodeValid = cleanPincode.length === 6;
  const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docKey: 'fssaiCertUrl' | 'tradeLicenseUrl' | 'panCardUrl' | 'storePhotoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File "${file.name}" exceeds 10MB limit. Please upload a smaller file.`);
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const localPreview = URL.createObjectURL(file);

    setDocUploads((prev) => ({
      ...prev,
      [docKey]: {
        fileName: file.name,
        previewUrl: localPreview,
        isPdf,
        uploading: true,
      },
    }));

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('docType', docKey);

      const res = await fetch('/api/v1/shop/upload-doc', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setFormData((prev) => ({
          ...prev,
          documents: {
            ...prev.documents,
            [docKey]: data.url,
          },
        }));
        setDocUploads((prev) => ({
          ...prev,
          [docKey]: {
            ...prev[docKey],
            uploading: false,
            previewUrl: data.url,
          },
        }));
      } else {
        // Fallback to base64 data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setFormData((prev) => ({
            ...prev,
            documents: {
              ...prev.documents,
              [docKey]: base64,
            },
          }));
          setDocUploads((prev) => ({
            ...prev,
            [docKey]: {
              ...prev[docKey],
              uploading: false,
            },
          }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Direct upload notice, falling back to base64 encoding:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          documents: {
            ...prev.documents,
            [docKey]: base64,
          },
        }));
        setDocUploads((prev) => ({
          ...prev,
          [docKey]: {
            ...prev[docKey],
            uploading: false,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDoc = (
    docKey: 'fssaiCertUrl' | 'tradeLicenseUrl' | 'panCardUrl' | 'storePhotoUrl'
  ) => {
    setDocUploads((prev) => {
      const updated = { ...prev };
      delete updated[docKey];
      return updated;
    });
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: '',
      },
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') {
      setEmailVerified(false);
      setEmailVerificationToken('');
      setEmailOtpSent(false);
      setEmailOtpInput('');
      setEmailOtpError('');
      setEmailOtpInfo('');
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (currentStep === 1) {
      if (!formData.shopName || !formData.ownerName || !formData.phone || !formData.email || !formData.address) {
        setErrorMsg('Please complete all basic store and contact information.');
        return;
      }
      if (!isPhoneValid) {
        setErrorMsg('Primary Mobile must be a valid 10-digit number (e.g. 9845612300).');
        return;
      }
      if (!isPincodeValid) {
        setErrorMsg('Please enter a valid 6-digit postal PIN code.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.fssaiNumber || !formData.tradeLicenseNumber || !formData.panNumber) {
        setErrorMsg('FSSAI Registration, Trade License, and PAN Number are mandatory.');
        return;
      }
      if (!isFssaiValid) {
        setErrorMsg(`FSSAI License Number must be a valid 14-digit number (currently ${cleanFssai.length} digits).`);
        return;
      }
      if (!isPanValid) {
        setErrorMsg('PAN Number must be a valid 10-character code (e.g. ABCDE1234F).');
        return;
      }
      if (
        docUploads.fssaiCertUrl?.uploading ||
        docUploads.tradeLicenseUrl?.uploading ||
        docUploads.panCardUrl?.uploading ||
        docUploads.storePhotoUrl?.uploading
      ) {
        setErrorMsg('Please wait for all verification documents and photos to finish uploading.');
        return;
      }
      if (
        !formData.documents.fssaiCertUrl ||
        !formData.documents.tradeLicenseUrl ||
        !formData.documents.panCardUrl ||
        !formData.documents.storePhotoUrl
      ) {
        setErrorMsg('Please upload all 4 required images/copies: FSSAI License, Trade License, PAN Card, and Storefront Photo.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formData.bankAccountNumber || !formData.ifscCode || !formData.bankName) {
        setErrorMsg('Bank Name, Account Number, and IFSC are required for automated daily payouts.');
        return;
      }
      if (!isIfscValid) {
        setErrorMsg('Please enter a valid 11-character IFSC code (e.g. SBIN0000167).');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleSendEmailOtp = async () => {
    setEmailOtpSending(true);
    setEmailOtpError('');
    setEmailOtpInfo('');

    try {
      const res = await fetch('/api/v1/shop/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, action: 'SEND' }),
      });
      const data = await res.json();
      setEmailOtpSending(false);

      if (res.ok && data.success) {
        setEmailOtpSent(true);
        setEmailOtpInput('');
        setEmailOtpSecondsLeft(Number(data.resendInSeconds) || 15);
        setEmailOtpInfo(`A 6-digit OTP has been sent to ${formData.email}.`);
      } else {
        setEmailOtpError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setEmailOtpSending(false);
      setEmailOtpError(err.message || 'Failed to reach verification server.');
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpInput.trim()) {
      setEmailOtpError('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    setEmailOtpVerifying(true);
    setEmailOtpError('');

    try {
      const res = await fetch('/api/v1/shop/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, action: 'VERIFY', otp: emailOtpInput.trim() }),
      });
      const data = await res.json();
      setEmailOtpVerifying(false);

      if (res.ok && data.success && data.emailVerificationToken) {
        setEmailVerified(true);
        setEmailOtpSecondsLeft(0);
        setEmailVerificationToken(data.emailVerificationToken);
        setEmailOtpInfo('Email verified! You can now submit your application.');
      } else {
        setEmailOtpError(data.message || 'Invalid OTP code. Please try again.');
      }
    } catch (err: any) {
      setEmailOtpVerifying(false);
      setEmailOtpError(err.message || 'Failed to verify OTP.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified || !emailVerificationToken) {
      setErrorMsg('Please verify your email address with OTP before submitting.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/shop/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, emailVerificationToken }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        setSubmittedApp(data.application);
        setShowApprovalPopup(true);
        // Save local backup copy for seamless instant visibility across tabs
        if (typeof window !== 'undefined') {
          try {
            const existing = JSON.parse(localStorage.getItem('mymbmart_pending_merchant_apps') || '[]');
            existing.unshift(data.application);
            localStorage.setItem('mymbmart_pending_merchant_apps', JSON.stringify(existing.slice(0, 20)));
          } catch {}
        }
      } else {
        setErrorMsg(data.message || 'Submission failed.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message || 'Error communicating with onboarding server.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0F172A] w-[100vw] max-w-[100vw] overflow-x-hidden">
      {/* Top Header with Only Website Logo */}
      <header className="w-[100vw] max-w-[100vw] bg-white border-b-[1px] border-slate-200 px-[4%] py-[0.75rem] sm:py-[1.25rem] flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="relative w-[10.5rem] sm:w-[14.5rem] md:w-[18rem] lg:w-[22rem] h-[3rem] sm:h-[4rem]">
            <Image
              src="/images/LOgo.jpeg"
              alt="MegaBachatMart"
              fill
              priority
              className="object-contain object-left group-hover:scale-105 transition-transform"
            />
          </div>
        </Link>

        <div className="flex items-center space-x-[0.75rem] sm:space-x-[1rem]">
          <Link
            href="/shop/login"
            className="text-[0.75rem] font-bold text-emerald-800 hover:text-emerald-950 transition"
          >
            Already a Partner? Sign In →
          </Link>
          <Link
            href="/"
            className="text-[0.75rem] font-semibold text-slate-500 hover:text-[#064E3B] transition hidden sm:inline-block"
          >
            ← Back to Store
          </Link>
        </div>
      </header>

      <main className="w-[100vw] max-w-[100vw] flex-1 py-[2rem] sm:py-[3.5rem] px-[4%] sm:px-[5%]">
        <div className="w-[100%] max-w-[48rem] mx-auto space-y-[1.5rem] sm:space-y-[2rem]">
          
          {/* Header Banner */}
          <div className="text-center space-y-[0.75rem]">
            <div className="inline-flex items-center space-x-[0.5rem] bg-emerald-100 text-[#064E3B] px-[0.875rem] py-[0.375rem] rounded-full text-[0.75rem] font-black border-[1px] border-emerald-300">
              <Store className="w-[1rem] h-[1rem] text-emerald-700" />
              <span>MegaBachatMart Merchant & Shop Partner Program</span>
            </div>
            <h1 className="text-[1.75rem] sm:text-[2.25rem] font-black text-[#0F172A] tracking-tight leading-tight">
              Grow Your Shop with Hyperlocal Orders
            </h1>
            <p className="text-[0.875rem] text-slate-600 max-w-[36rem] mx-auto leading-relaxed">
              Join Ranchi’s leading zero-commission hyperlocal grocery network. Complete your digital KYC below to receive your Store ID and start listing products.
            </p>
          </div>

          {/* Success Screen after submission */}
          {submittedApp ? (
            <div className="w-[100%] bg-white rounded-[1.5rem] p-[1.5rem] sm:p-[2.5rem] border-[1px] border-emerald-200 shadow-xl text-center space-y-[1.5rem] animate-in fade-in zoom-in duration-200">
              <div className="w-[4rem] h-[4rem] rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-[2.5rem] h-[2.5rem]" />
              </div>

              <div className="space-y-[0.5rem]">
                <h2 className="text-[1.5rem] font-black text-[#0F172A]">Application Submitted Successfully!</h2>
                <p className="text-[0.875rem] text-slate-600">
                  Your store registration has been received at the Ranchi Central Onboarding Desk.
                </p>
              </div>

              {/* Reference Badge */}
              <div className="w-[100%] max-w-[28rem] bg-slate-50 border-[1px] border-slate-200 rounded-[1rem] p-[1rem] mx-auto text-left space-y-[0.5rem]">
                <div className="text-[0.75rem] text-slate-500 font-bold uppercase tracking-wider">Application Reference</div>
                <div className="font-mono text-[1.25rem] font-black text-[#064E3B]">{submittedApp.applicationNumber}</div>
                <div className="text-[0.75rem] text-slate-700">
                  <strong>Store:</strong> {submittedApp.shopName} ({submittedApp.pincode})<br />
                  <strong>Proprietor:</strong> {submittedApp.ownerName}
                </div>
              </div>

              {/* Workflow Next Steps Box */}
              <div className="w-[100%] max-w-[32rem] bg-emerald-50/70 border-[1px] border-emerald-200 rounded-[1rem] p-[1.25rem] mx-auto text-left space-y-[0.75rem]">
                <h4 className="font-extrabold text-[0.75rem] text-[#064E3B] uppercase tracking-wider flex items-center space-x-[0.375rem]">
                  <Sparkles className="w-[1rem] h-[1rem] text-emerald-600" />
                  <span>What Happens Next?</span>
                </h4>
                <ol className="text-[0.75rem] text-slate-700 space-y-[0.5rem] list-decimal list-inside leading-relaxed">
                  <li>Our verification desk reviews your FSSAI license and premises within 2-4 hours.</li>
                  <li>Upon approval, a unique <strong>Store ID & Secure Password</strong> is generated.</li>
                  <li>Your credentials will be dispatched directly to your <strong>WhatsApp (+91 {submittedApp.phone})</strong> and <strong>Email ({submittedApp.email})</strong>.</li>
                  <li>Sign in at the Merchant Portal, download our CSV template, and upload your inventory to go live!</li>
                </ol>
              </div>

              <div className="pt-[0.5rem] flex flex-col sm:flex-row items-center justify-center gap-[0.75rem] w-[100%]">
                <Link
                  href="/shop/login"
                  className="w-[100%] sm:w-auto bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold px-[1.5rem] py-[0.75rem] rounded-[1rem] text-[0.75rem] shadow-md transition text-center"
                >
                  Go to Merchant Portal Login
                </Link>
                <Link
                  href="/shop"
                  className="w-[100%] sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-[1.5rem] py-[0.75rem] rounded-[1rem] text-[0.75rem] transition text-center"
                >
                  Explore Customer Storefront
                </Link>
              </div>
            </div>
          ) : (
            
            /* Multi-step Application Form Card */
            <div className="w-[100%] bg-white rounded-[1.5rem] border-[1px] border-slate-200 shadow-xl overflow-hidden">
              
              {/* Stepper Progress Bar */}
              <div className="w-[100%] bg-slate-50 border-b-[1px] border-slate-200 p-[0.75rem] sm:p-[1.25rem] flex items-center justify-between text-[0.75rem] font-bold">
                {[
                  { step: 1, label: 'Store Info' },
                  { step: 2, label: 'Licenses & KYC' },
                  { step: 3, label: 'Bank Payouts' },
                  { step: 4, label: 'Review & Submit' }
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      if (s.step < currentStep) {
                        setErrorMsg('');
                        setCurrentStep(s.step);
                      }
                    }}
                    disabled={s.step > currentStep}
                    className={`flex items-center space-x-[0.375rem] sm:space-x-[0.5rem] text-left transition ${
                      s.step < currentStep ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                    }`}
                  >
                    <div 
                      className={`w-[1.75rem] h-[1.75rem] sm:w-[2rem] sm:h-[2rem] rounded-full flex items-center justify-center text-[0.75rem] font-black transition shrink-0 ${
                        currentStep === s.step
                          ? 'bg-[#064E3B] text-white ring-2 ring-emerald-300'
                          : currentStep > s.step
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {currentStep > s.step ? '✓' : s.step}
                    </div>
                    <span className={`text-[0.6875rem] sm:text-[0.75rem] ${currentStep === s.step ? 'inline font-black text-slate-900' : 'hidden md:inline text-slate-600'}`}>{s.label}</span>
                  </button>
                ))}
              </div>

              {errorMsg && (
                <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: STORE & OWNER DETAILS */}
              {currentStep === 1 && (
                <form onSubmit={handleNextStep} className="p-6 sm:p-8 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">Step 1: Store & Proprietor Information</h3>
                    <p className="text-xs text-slate-500">Provide the commercial and contact details of your retail store.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Store / Shop Name * {isBranchMode && <span className="text-[10px] text-emerald-700 font-semibold">(Same partner brand)</span>}
                      </label>
                      <input
                        type="text"
                        name="shopName"
                        required
                        readOnly={isBranchMode}
                        placeholder="e.g. Gupta Daily Grocery & General Store"
                        value={formData.shopName}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none ${isBranchMode ? 'bg-slate-100 font-bold text-slate-700' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Owner / Proprietor Name *</label>
                      <input
                        type="text"
                        name="ownerName"
                        required
                        placeholder="e.g. Rajesh Kumar Gupta"
                        value={formData.ownerName}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700">Primary Mobile / WhatsApp *</label>
                        {formData.phone && (
                          <span className={`text-[10px] font-extrabold ${isPhoneValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {cleanPhone.length}/10 digits
                          </span>
                        )}
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData(prev => ({ ...prev, phone: val }));
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-mono ${
                          formData.phone
                            ? isPhoneValid
                              ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                              : 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                      {formData.phone && !isPhoneValid ? (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">Must be exactly 10 digits.</p>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-1">Credentials will be sent to this WhatsApp number.</span>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="merchant@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Shop Address (Street, Landmark) *</label>
                      <input
                        type="text"
                        name="address"
                        required
                        placeholder="e.g. Shop #14, Main Road, Near Overbridge, Hindpiri"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City / District</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700">PIN Code *</label>
                        {formData.pincode && (
                          <span className={`text-[10px] font-extrabold ${isPincodeValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {cleanPincode.length}/6 digits
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        name="pincode"
                        required
                        maxLength={6}
                        placeholder="834001"
                        value={formData.pincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setFormData(prev => ({ ...prev, pincode: val }));
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-mono ${
                          formData.pincode
                            ? isPincodeValid
                              ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                              : 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                      {formData.pincode && !isPincodeValid && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">Must be a 6-digit PIN code.</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Store Category / Type</label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="KIRANA_GENERAL">Daily Grocery & Retail Store</option>
                        <option value="SUPERMARKET">Supermarket / Provision Store</option>
                        <option value="ORGANIC_PRODUCE">Farm Fresh & Smallholder Farmer</option>
                        <option value="SHG_COOPERATIVE">SHG Women Cooperative & Cottage Industry</option>
                        <option value="HOME_KITCHEN">Home Kitchen / Ghost Kitchen / Tiffin Center</option>
                        <option value="DAIRY_SWEETS">Dairy, Milk & Bakery Products</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Years in Operation</label>
                      <input
                        type="number"
                        name="yearsInBusiness"
                        min="1"
                        value={formData.yearsInBusiness}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Continue to Statutory Licenses</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: LICENSES & KYC */}
              {currentStep === 2 && (
                <form onSubmit={handleNextStep} className="p-6 sm:p-8 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">Step 2: Statutory Licenses & KYC Verification</h3>
                    <p className="text-xs text-slate-500">Provide legal identification numbers and upload all required verification documents.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700">
                          FSSAI License / Registration No *
                        </label>
                        {formData.fssaiNumber && (
                          <span className={`text-[10px] font-extrabold ${isFssaiValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {cleanFssai.length}/14 digits
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        name="fssaiNumber"
                        required
                        maxLength={14}
                        placeholder="14-digit FSSAI Number"
                        value={formData.fssaiNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                          setFormData(prev => ({ ...prev, fssaiNumber: val }));
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-mono ${
                          formData.fssaiNumber
                            ? isFssaiValid
                              ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                              : 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                      {formData.fssaiNumber && !isFssaiValid ? (
                        <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>FSSAI License Number must be a valid 14-digit number (needs {14 - cleanFssai.length} more digit{14 - cleanFssai.length === 1 ? '' : 's'}).</span>
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Required 14-digit number for food and grocery delivery.
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Municipal Trade License No *
                      </label>
                      <input
                        type="text"
                        name="tradeLicenseNumber"
                        required
                        placeholder="e.g. RMC/TL/2025/1042"
                        value={formData.tradeLicenseNumber}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700">
                          Proprietor / Firm PAN *
                        </label>
                        {formData.panNumber && (
                          <span className={`text-[10px] font-extrabold ${isPanValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {cleanPan.length} chars (PAN)
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        name="panNumber"
                        required
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().slice(0, 10);
                          setFormData(prev => ({ ...prev, panNumber: val }));
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none uppercase font-mono ${
                          formData.panNumber
                            ? isPanValid
                              ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                              : 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                      {formData.panNumber && !isPanValid ? (
                        <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Format must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).</span>
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-1">
                          10-character alphanumeric PAN.
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                      <input
                        type="text"
                        name="gstin"
                        placeholder="20XXXXXXXXXX1ZX"
                        value={formData.gstin}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4 pt-2">
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                            <FileUp className="w-4 h-4 text-emerald-600" />
                            <span>Upload Verification Documents & Storefront Photo</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Attach clear photos or PDF copies of your licenses and store premises for 2-hour onboarding approval.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 hidden sm:inline-block">
                          JPG, PNG, PDF up to 10MB
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. FSSAI License */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              FSSAI License / Certificate
                              <span className="text-rose-500 ml-0.5">*</span>
                            </span>
                          </span>
                          {docUploads['fssaiCertUrl'] ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Attached</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              Required *
                            </span>
                          )}
                        </div>

                        {docUploads['fssaiCertUrl'] ? (
                          <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              {docUploads['fssaiCertUrl'].isPdf ? (
                                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  PDF
                                </div>
                              ) : (
                                <img
                                  src={docUploads['fssaiCertUrl'].previewUrl}
                                  alt="FSSAI"
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                                />
                              )}
                              <div className="truncate text-left">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {docUploads['fssaiCertUrl'].fileName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {docUploads['fssaiCertUrl'].uploading ? 'Uploading...' : 'Ready for admin verification'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc('fssaiCertUrl')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remove document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="block border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/30">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileUpload(e, 'fssaiCertUrl')}
                              className="hidden"
                            />
                            <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                            <span className="text-xs font-bold text-slate-700 block">Click to upload or take photo</span>
                            <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
                          </label>
                        )}
                      </div>

                      {/* 2. Municipal Trade License */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              Trade License Copy
                              <span className="text-rose-500 ml-0.5">*</span>
                            </span>
                          </span>
                          {docUploads['tradeLicenseUrl'] ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Attached</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              Required *
                            </span>
                          )}
                        </div>

                        {docUploads['tradeLicenseUrl'] ? (
                          <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              {docUploads['tradeLicenseUrl'].isPdf ? (
                                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  PDF
                                </div>
                              ) : (
                                <img
                                  src={docUploads['tradeLicenseUrl'].previewUrl}
                                  alt="Trade License"
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                                />
                              )}
                              <div className="truncate text-left">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {docUploads['tradeLicenseUrl'].fileName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {docUploads['tradeLicenseUrl'].uploading ? 'Uploading...' : 'Ready for admin verification'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc('tradeLicenseUrl')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remove document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="block border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/30">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileUpload(e, 'tradeLicenseUrl')}
                              className="hidden"
                            />
                            <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                            <span className="text-xs font-bold text-slate-700 block">Click to upload or take photo</span>
                            <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
                          </label>
                        )}
                      </div>

                      {/* 3. PAN Card */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              Proprietor / Firm PAN Card
                              <span className="text-rose-500 ml-0.5">*</span>
                            </span>
                          </span>
                          {docUploads['panCardUrl'] ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Attached</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              Required *
                            </span>
                          )}
                        </div>

                        {docUploads['panCardUrl'] ? (
                          <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              {docUploads['panCardUrl'].isPdf ? (
                                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  PDF
                                </div>
                              ) : (
                                <img
                                  src={docUploads['panCardUrl'].previewUrl}
                                  alt="PAN Card"
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                                />
                              )}
                              <div className="truncate text-left">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {docUploads['panCardUrl'].fileName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {docUploads['panCardUrl'].uploading ? 'Uploading...' : 'Ready for admin verification'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc('panCardUrl')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remove document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="block border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/30">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileUpload(e, 'panCardUrl')}
                              className="hidden"
                            />
                            <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                            <span className="text-xs font-bold text-slate-700 block">Click to upload or take photo</span>
                            <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
                          </label>
                        )}
                      </div>

                      {/* 4. Storefront Photo */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                            <Store className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              Storefront / Premises Photo
                              <span className="text-rose-500 ml-0.5">*</span>
                            </span>
                          </span>
                          {docUploads['storePhotoUrl'] ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Attached</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              Required *
                            </span>
                          )}
                        </div>

                        {docUploads['storePhotoUrl'] ? (
                          <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              <img
                                src={docUploads['storePhotoUrl'].previewUrl}
                                alt="Storefront"
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                              />
                              <div className="truncate text-left">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {docUploads['storePhotoUrl'].fileName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {docUploads['storePhotoUrl'].uploading ? 'Uploading...' : 'Ready for admin verification'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc('storePhotoUrl')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remove document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="block border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/30">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'storePhotoUrl')}
                              className="hidden"
                            />
                            <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                            <span className="text-xs font-bold text-slate-700 block">Click to upload or take photo</span>
                            <span className="text-[10px] text-slate-400">JPG, PNG, WEBP with storefront signboard</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Continue to Banking Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: BANKING & PAYOUTS */}
              {currentStep === 3 && (
                <form onSubmit={handleNextStep} className="p-6 sm:p-8 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">Step 3: Settlement Bank Account</h3>
                    <p className="text-xs text-slate-500">Where customer order earnings will be credited on a daily T+1 basis.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        name="bankName"
                        required
                        placeholder="e.g. State Bank of India, Main Branch Ranchi"
                        value={formData.bankName}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bank Account Number *</label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        required
                        placeholder="Enter 9-18 digit account number"
                        value={formData.bankAccountNumber}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700">IFSC Code *</label>
                        {formData.ifscCode && (
                          <span className={`text-[10px] font-extrabold ${isIfscValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {cleanIfsc.length}/11 chars
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        name="ifscCode"
                        required
                        maxLength={11}
                        placeholder="e.g. SBIN0000167"
                        value={formData.ifscCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().slice(0, 11);
                          setFormData(prev => ({ ...prev, ifscCode: val }));
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-mono uppercase ${
                          formData.ifscCode
                            ? isIfscValid
                              ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                              : 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                            : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                      {formData.ifscCode && !isIfscValid ? (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">IFSC must be 11 characters (e.g. SBIN0000167).</p>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-1">11-character bank branch code.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Review Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: REVIEW & FINAL SUBMISSION */}
              {currentStep === 4 && (
                <div className="p-6 sm:p-8 space-y-6 text-xs">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">Step 4: Review Details & Submit</h3>
                    <p className="text-slate-500">Confirm your application details before sending to the Ranchi admin desk.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                      <div><strong className="text-slate-900">Store / Farm Name:</strong> {formData.shopName}</div>
                      <div><strong className="text-slate-900">Proprietor Name:</strong> {formData.ownerName}</div>
                      <div><strong className="text-slate-900">WhatsApp Mobile:</strong> +91 {formData.phone}</div>
                      <div><strong className="text-slate-900">Email:</strong> {formData.email}</div>
                      <div><strong className="text-slate-900">Address:</strong> {formData.address}, {formData.pincode}</div>
                      <div>
                        <strong className="text-slate-900">Category:</strong>{' '}
                        {formData.businessType === 'SHG_COOPERATIVE' ? 'SHG Women Cooperative' :
                         formData.businessType === 'ORGANIC_PRODUCE' ? 'Farm Fresh / Smallholder Farmer' :
                         formData.businessType === 'HOME_KITCHEN' ? 'Home / Ghost Kitchen' :
                         formData.businessType === 'SUPERMARKET' ? 'Supermarket' : 'Daily Grocery Store'}
                      </div>
                      <div>
                        <strong className="text-slate-900">FSSAI Status:</strong>{' '}
                        {formData.fssaiNumber || 'Pending Verification'}
                      </div>
                      <div>
                        <strong className="text-slate-900">Trade License:</strong>{' '}
                        {formData.tradeLicenseNumber || 'Pending Verification'}
                      </div>
                      <div>
                        <strong className="text-slate-900">PAN Number:</strong>{' '}
                        {formData.panNumber || 'Pending'}
                      </div>
                      <div><strong className="text-slate-900">Bank:</strong> {formData.bankName} ({formData.ifscCode})</div>
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                        <strong className="text-slate-900 block mb-1.5">Attached Documents:</strong>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${formData.documents.fssaiCertUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {formData.documents.fssaiCertUrl ? '✓ FSSAI Certificate' : '— FSSAI Pending'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${formData.documents.tradeLicenseUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {formData.documents.tradeLicenseUrl ? '✓ Trade License' : '— Trade License Pending'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${formData.documents.panCardUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {formData.documents.panCardUrl ? '✓ PAN Card' : '— PAN Pending'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${formData.documents.storePhotoUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {formData.documents.storePhotoUrl ? '✓ Storefront Photo' : '— Store Photo Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-slate-700 space-y-2">
                    <div className="font-bold text-[#064E3B] flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Merchant Partner Agreement</span>
                    </div>
                    <p className="text-[11px]">
                      By submitting this registration, you agree to fulfill fresh grocery orders within 20-30 minutes for customers in your pincode polygon, adhere to fair Bachat pricing, and honor FEFO hygiene standards.
                    </p>
                  </div>

                  {/* Email OTP Verification before Submit */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <Mail className="w-4 h-4 text-emerald-700" />
                          <span>Email Verification</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Verify <strong>{formData.email}</strong> with a 6-digit OTP to unlock application submission.
                        </p>
                      </div>

                      {!emailVerified ? (
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={emailOtpSending || (emailOtpSent && emailOtpSecondsLeft > 0)}
                          className="bg-[#064E3B] hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {emailOtpSending
                            ? 'Sending OTP...'
                            : emailOtpSent && emailOtpSecondsLeft > 0
                            ? `Resend in ${emailOtpSecondsLeft}s`
                            : emailOtpSent
                            ? 'Resend OTP'
                            : 'Send OTP'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[11px] font-extrabold shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    {emailOtpSent && !emailVerified && (
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative flex-1">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={emailOtpInput}
                              onChange={(e) => {
                                setEmailOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                                if (emailOtpError) setEmailOtpError('');
                              }}
                              placeholder="Enter 6-digit OTP"
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleVerifyEmailOtp}
                            disabled={emailOtpVerifying || emailOtpInput.length < 6}
                            className="bg-[#16A34A] hover:bg-[#15803d] text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {emailOtpVerifying ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>
                      </div>
                    )}

                    {emailOtpError && (
                      <p className="text-[11px] text-rose-600 font-bold flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{emailOtpError}</span>
                      </p>
                    )}

                    {emailOtpInfo && !emailOtpError && (
                      <p className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{emailOtpInfo}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Back
                    </button>
                    {emailVerified ? (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-[#16A34A] hover:bg-[#15803d] text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs shadow-lg shadow-emerald-700/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{submitting ? 'Submitting Application...' : 'Submit Application'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">
                        Verify your email OTP above to submit
                      </span>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* Approval Wait Popup Modal */}
      {showApprovalPopup && submittedApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approval-popup-title"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl max-w-md w-full p-6 sm:p-7 text-center space-y-4 relative animate-in fade-in zoom-in duration-150">
            <button
              type="button"
              onClick={() => setShowApprovalPopup(false)}
              aria-label="Close popup"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 id="approval-popup-title" className="text-lg font-black text-slate-900">
              Application Submitted
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Please wait for admin&apos;s approval. Your application (<strong className="text-[#064E3B]">{submittedApp.applicationNumber}</strong>) has been received and your Store ID &amp; login details will be sent once approved.
            </p>
            <button
              type="button"
              onClick={() => setShowApprovalPopup(false)}
              className="w-full bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold py-3 rounded-2xl text-xs transition cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Minimal Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        &copy; 2026 MegaBachatMart (mymbmart.com). Merchant Partner Program.
      </footer>
    </div>
  );
}
