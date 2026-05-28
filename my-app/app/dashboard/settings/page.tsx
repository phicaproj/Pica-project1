"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  Building2,
  MapPin,
  User,
  ChevronDown,
  Users,
  Banknote,
  Info,
  Loader,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  AuthUser, 
  getStoredUser, 
  getMe, 
  updateUserProfile, 
  updateUserBusiness, 
  verifyUserEmail, 
  uploadAvatar as uploadAvatarApi, 
  getMyBillingHistory 
} from "@/lib/authClient";

type Tab = "Profile" | "Business Info" | "Billing";

const TABS: Tab[] = [
  "Profile",
  "Business Info",
  "Billing"
];

export default function DashboardSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Profile");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  const fetchUserData = async () => {
    try {
      const res = await getMe();
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        const stored = getStoredUser();
        if (stored) setUser(stored);
      }
    } catch (err) {
      const stored = getStoredUser();
      if (stored) setUser(stored);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 text-white bg-[#0d1117] min-h-screen">
      {/* Centralized Tabs */}
      <div className="flex justify-center border-b border-white/5 pb-4 mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex gap-8 justify-center">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap text-sm font-semibold transition pb-2 relative ${
                activeTab === tab
                  ? "text-orange-400 font-bold"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "Profile" && <ProfileSettings initialUser={user} onUpdate={fetchUserData} />}
      {activeTab === "Business Info" && <BusinessInfoSettings initialUser={user} onUpdate={fetchUserData} />}
      {activeTab === "Billing" && <BillingSettings />}
    </div>
  );
}

// Helper to resize/compress images client-side using canvas
const resizeImage = (file: File, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// ─── Profile Settings ────────────────────────────────────────────────────────
function ProfileSettings({ initialUser, onUpdate }: { initialUser: any, onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [fullName, setFullName] = useState(initialUser?.businessName || "Alex James");
  const [phone, setPhone] = useState(initialUser?.phone || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [isVerified, setIsVerified] = useState(initialUser?.isVerified || false);
  const [avatarUrl, setAvatarUrl] = useState(initialUser?.avatarUrl || "");

  useEffect(() => {
    if (initialUser) {
      setFullName(initialUser.businessName || "Alex James");
      setPhone(initialUser.phone || "");
      setEmail(initialUser.email || "");
      setIsVerified(initialUser.isVerified || false);
      setAvatarUrl(initialUser.avatarUrl || "");
    }
  }, [initialUser]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (initialUser) {
      setFullName(initialUser.businessName || "Alex James");
      setPhone(initialUser.phone || "");
      setEmail(initialUser.email || "");
      setIsVerified(initialUser.isVerified || false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateUserProfile({
        businessName: fullName,
        phone,
        email,
      });

      if (res.error) {
        alert(res.error.message);
      } else {
        setIsEditing(false);
        onUpdate();
        alert("Profile changes saved successfully!");
      }
    } catch (err) {
      alert("An unexpected error occurred while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const res = await verifyUserEmail();
      if (res.error) {
        alert(res.error.message);
      } else {
        setIsVerified(true);
        onUpdate();
        alert("Verification successful! Email verified.");
      }
    } catch (err) {
      alert("An error occurred during email verification.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploading(true);
    try {
      // Resize and compress Chosen Image using client-side canvas
      const file = await resizeImage(rawFile).catch(err => {
        console.error("Canvas compression failed, falling back to original file", err);
        return rawFile;
      });

      // Strict 2MB Guard (file size is in bytes)
      const MAX_SIZE = 2 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert("Profile picture upload is limited to a maximum of 2MB. Please select a smaller file.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploading(false);
        return;
      }

      const res = await uploadAvatarApi(file);
      if (res.error) {
        alert(res.error.message);
      } else if (res.data?.avatarUrl) {
        setAvatarUrl(res.data.avatarUrl);
        onUpdate();
        alert("Profile picture uploaded successfully!");
      }
    } catch (err) {
      alert("An error occurred while uploading your profile picture.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-sm text-gray-400">
            Update your personal information and how others see you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={saving || uploading}
                className="px-5 py-2.5 rounded-full border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-6 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative mb-4 group">
            {uploading ? (
              <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center ring-4 ring-[#0d1117]">
                <Loader className="w-6 h-6 animate-spin text-teal-400" />
              </div>
            ) : avatarUrl ? (
              <div className="relative w-24 h-24 rounded-full ring-4 ring-[#0d1117] overflow-hidden group">
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  onClick={triggerFileInput}
                  className={`w-full h-full object-cover transition duration-300 ${isEditing ? 'cursor-pointer group-hover:scale-105 group-hover:brightness-50' : ''}`}
                />
                {isEditing && (
                  <div 
                    onClick={triggerFileInput}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold uppercase tracking-wider"
                  >
                    <Camera className="w-5 h-5 mb-1 text-orange-400" />
                    Upload
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={triggerFileInput}
                className={`w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-[#0d1117] relative overflow-hidden group ${isEditing ? 'cursor-pointer' : ''}`}
              >
                <span className={`transition duration-300 ${isEditing ? 'group-hover:opacity-0' : ''}`}>
                  {fullName ? fullName.substring(0, 2).toUpperCase() : "AJ"}
                </span>
                {isEditing && (
                  <div 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold uppercase tracking-wider"
                  >
                    <Camera className="w-5 h-5 mb-1 text-orange-400" />
                    Upload
                  </div>
                )}
              </div>
            )}
            
            {isEditing && (
              <button 
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg transition border-2 border-[#111827] z-10"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{fullName || "Alex James"}</h3>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            ADMIN ROLE
          </p>
        </div>

        {/* Right Column: General Info */}
        <div className="lg:col-span-2 rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8 relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <User className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">
              General Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                FULL NAME
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                PHONE NUMBER
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 pr-10 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <PhoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 pr-32 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {isVerified ? (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-teal-500/20 text-teal-400 border border-teal-500/10">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <button 
                  onClick={handleVerifyEmail}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/10 transition duration-300"
                >
                  VERIFY EMAIL
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Primary email for account access and critical notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// ─── Business Info Settings ──────────────────────────────────────────────────
function BusinessInfoSettings({ initialUser, onUpdate }: { initialUser: any, onUpdate: () => void }) {
  const [businessName, setBusinessName] = useState(initialUser?.businessName || "Aether Dynamics Global");
  const [industry, setIndustry] = useState(initialUser?.industry || "Aerospace & Engineering");
  const [country, setCountry] = useState(initialUser?.country || "");
  const [stateVal, setStateVal] = useState(initialUser?.state || "");
  const [years, setYears] = useState(initialUser?.operatingYears || "");
  const [staffSize, setStaffSize] = useState(initialUser?.staffSize || "248");
  const [revenue, setRevenue] = useState(initialUser?.annualRevenue || "$10M - $50M");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Countries and cascading states loading
  const [countriesData, setCountriesData] = useState<any[]>([]);
  const [apiFailed, setApiFailed] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries");
        const json = await res.json();
        if (json && !json.error && Array.isArray(json.data)) {
          const sorted = [...json.data].sort((a: any, b: any) => a.name.localeCompare(b.name));
          setCountriesData(sorted);
        } else {
          setApiFailed(true);
        }
      } catch (err) {
        console.error("Error fetching countries API:", err);
        setApiFailed(true);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (initialUser) {
      setBusinessName(initialUser.businessName || "Aether Dynamics Global");
      setIndustry(initialUser.industry || "Aerospace & Engineering");
      setCountry(initialUser.country || "");
      setStateVal(initialUser.state || "");
      setYears(initialUser.operatingYears || "");
      setStaffSize(initialUser.staffSize || "248");
      setRevenue(initialUser.annualRevenue || "$10M - $50M");
    }
  }, [initialUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateUserBusiness({
        businessName,
        industry,
        country,
        state: stateVal || null,
        operatingYears: years,
        staffSize,
        annualRevenue: revenue,
      });

      if (res.error) {
        alert(res.error.message);
      } else {
        setIsEditing(false);
        onUpdate();
        alert("Business info configuration saved!");
      }
    } catch (err) {
      alert("An error occurred while saving business info.");
    } finally {
      setSaving(false);
    }
  };

  // Find selected country states
  const selectedCountryObj = countriesData.find((c: any) => c.name === country);
  const statesList = selectedCountryObj?.states || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Business Information
          </h1>
          <p className="text-sm text-gray-400">
            Detailed organizational metrics and identity parameters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
            >
              Edit Business Info
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="px-5 py-2.5 rounded-full border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                Save Configuration
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Identity - Span 2 */}
        <div className="md:col-span-2 rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Building2 className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Core Identity</h2>
                <p className="text-xs text-gray-400">Update your business details</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                BUSINESS NAME
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                INDUSTRY
              </label>
              <div className="relative">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm appearance-none focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60 bg-[#111827]"
                >
                  <option value="" className="bg-[#111827] text-white">Select Industry</option>
                  <option className="bg-[#111827] text-white">Aerospace &amp; Engineering</option>
                  <option className="bg-[#111827] text-white">Software &amp; Technology</option>
                  <option className="bg-[#111827] text-white">Financial Services</option>
                  <option className="bg-[#111827] text-white">Healthcare &amp; Life Sciences</option>
                  <option className="bg-[#111827] text-white">Retail &amp; E-commerce</option>
                  <option className="bg-[#111827] text-white">Manufacturing &amp; Logistics</option>
                  <option className="bg-[#111827] text-white">Professional Services &amp; Consulting</option>
                  <option className="bg-[#111827] text-white">Education &amp; EdTech</option>
                  <option className="bg-[#111827] text-white">Agriculture &amp; Food Technology</option>
                  <option className="bg-[#111827] text-white">Energy, Utilities &amp; CleanTech</option>
                  <option className="bg-[#111827] text-white">Marketing, Media &amp; Entertainment</option>
                  <option className="bg-[#111827] text-white">Real Estate &amp; Construction</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                COUNTRY
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 pointer-events-none" />
                {loadingCountries ? (
                  <div className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-gray-400 text-sm flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-orange-500" /> Fetching countries...
                  </div>
                ) : apiFailed ? (
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter Country"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60"
                  />
                ) : (
                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setStateVal("");
                    }}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-10 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm appearance-none focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60 bg-[#111827]"
                  >
                    <option value="" className="bg-[#111827] text-white">Select Country</option>
                    {countriesData.map((c: any) => (
                      <option key={c.name} value={c.name} className="bg-[#111827] text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                {!loadingCountries && !apiFailed && (
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                STATE / PROVINCE
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 pointer-events-none" />
                {apiFailed || statesList.length === 0 ? (
                  <input
                    type="text"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter State/Province"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60"
                  />
                ) : (
                  <select
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-10 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm appearance-none focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60 bg-[#111827]"
                  >
                    <option value="" className="bg-[#111827] text-white">Select State/Province</option>
                    {statesList.map((s: any) => (
                      <option key={s.name} value={s.name} className="bg-[#111827] text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
                {!(apiFailed || statesList.length === 0) && (
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                YEARS IN OPERATION
              </label>
              <div className="relative">
                <select
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm appearance-none focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60 bg-[#111827]"
                >
                  <option value="" className="bg-[#111827] text-white">Select Years</option>
                  <option value="0-1 Years" className="bg-[#111827] text-white">0-1 Years</option>
                  <option value="1-3 Years" className="bg-[#111827] text-white">1-3 Years</option>
                  <option value="3-5 Years" className="bg-[#111827] text-white">3-5 Years</option>
                  <option value="5-10 Years" className="bg-[#111827] text-white">5-10 Years</option>
                  <option value="10+ Years" className="bg-[#111827] text-white">10+ Years</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Metrics - Span 1 */}
        <div className="space-y-6">
          {/* Human Capital */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <Users className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold text-white">Human Capital</h3>
            </div>
            <div className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  NUMBER OF STAFF
                </label>
                <input
                  type="text"
                  value={staffSize}
                  onChange={(e) => setStaffSize(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60"
                />
              </div>
              <div className="p-4 rounded-lg bg-[#0d1117] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Target Expansion</span>
                  <span className="text-sm font-bold text-teal-400">+15%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 w-[60%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Tier */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <Banknote className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold text-white">Revenue Metrics</h3>
            </div>
            <div className="relative z-10">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                ANNUAL RANGE (USD)
              </label>
              <div className="relative">
                <select
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm appearance-none focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60 bg-[#111827]"
                >
                  <option value="$10M - $50M" className="bg-[#111827] text-white">$10M - $50M</option>
                  <option value="Under $5M" className="bg-[#111827] text-white">Under $5M</option>
                  <option value="$5M - $10M" className="bg-[#111827] text-white">$5M - $10M</option>
                  <option value="Over $50M" className="bg-[#111827] text-white">Over $50M</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/5 text-gray-500 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-orange-400" />
          Last updated: Mar 24, 2026. Configured values are used for diagnostics tailoring.
        </div>
      </div>
    </div>
  );
}

// ─── Billing & Subscription Settings ─────────────────────────────────────────
function BillingSettings() {
  const [latestPlan, setLatestPlan] = useState("2A - Strategic Scan");
  
  // Billing history state
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchBillingHistory = async (pageIndex: number) => {
    setLoadingHistory(true);
    try {
      const res = await getMyBillingHistory(pageIndex, 10);
      if (res.data) {
        setHistory(res.data.payments);
        setPage(res.data.page);
        setTotalPages(res.data.totalPages);
        setTotalItems(res.data.total);
        
        // Update the current plan label based on the most recent successful payment
        const successfulPayment = res.data.payments.find((p: any) => p.status === "SUCCESS");
        if (successfulPayment) {
          const planLabel = successfulPayment.plan === "PHASE2B_PILLAR" ? "Phase 2B - Deep Dive" : "Phase 2A - Diagnosis";
          setLatestPlan(planLabel);
        }
      }
    } catch (err) {
      console.error("Error loading billing records:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory(1);
  }, []);

  const formatPrice = (amount: number, currency: string) => {
    const symbol = currency === "NGN" ? "₦" : "$";
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatDateLabel = (isoStr: string) => {
    const date = new Date(isoStr);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Billing & Subscription
        </h1>
        <p className="text-sm text-gray-400">
          Review your organizational plan purchases and transaction history across the PICA ecosystem. All plans are one-time purchase with lifetime access.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Current Plan */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8 relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-2">
                LAST PURCHASED PLAN
              </p>
              <h2 className="text-2xl font-bold text-white mb-1">{latestPlan}</h2>
              <p className="text-sm text-gray-400 mt-2">
                Status: <span className="text-white font-medium">Completed & Unlocked</span>. Lifetime access to report dashboards and PDF downloads.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider">
              ACTIVE
            </span>
          </div>

          <div className="mt-6 flex gap-4 relative z-10">
            <button 
              onClick={() => window.location.href = "/dashboard/reports"}
              className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
            >
              View Reports
            </button>
            <button 
              onClick={() => window.location.href = "/dashboard/subscription"}
              className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              Purchase Another Module
            </button>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8 space-y-4">
        <h3 className="text-base font-bold text-white">Billing History</h3>
        
        {loadingHistory ? (
          <div className="py-10 flex items-center justify-center">
            <Loader className="w-5 h-5 animate-spin text-teal-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-[#0d1117] p-8 text-center text-gray-500">
            No payments records found for this account.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="pb-4 font-bold">INVOICE</th>
                    <th className="pb-4 font-bold">STATUS</th>
                    <th className="pb-4 font-bold">DATE</th>
                    <th className="pb-4 font-bold">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {history.map((payment) => {
                    const statusVal = payment.status;
                    let statusLabel = statusVal;
                    let dotColor = "bg-gray-400";
                    if (statusVal === "SUCCESS") {
                      statusLabel = "Paid";
                      dotColor = "bg-emerald-400";
                    } else if (statusVal === "FAILED") {
                      statusLabel = "Failed";
                      dotColor = "bg-rose-400";
                    } else if (statusVal === "PENDING") {
                      statusLabel = "Pending";
                      dotColor = "bg-amber-400";
                    }

                    return (
                      <tr key={payment.id} className="border-b border-white/5 last:border-b-0">
                        <td className="py-4 font-mono text-white text-xs uppercase">
                          {payment.reference.substring(0, 12)}
                        </td>
                        <td className="py-4">
                          <span className="flex items-center gap-1.5 text-white text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} /> 
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-4 text-gray-400 text-xs">
                          {formatDateLabel(payment.createdAt)}
                        </td>
                        <td className="py-4 font-medium text-white text-xs">
                          {formatPrice(payment.amount, payment.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/5 text-gray-400 text-xs">
                <span>
                  Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total payments)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchBillingHistory(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 transition disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchBillingHistory(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 transition disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
