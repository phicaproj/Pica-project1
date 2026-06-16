"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  CreditCard,
  Building2,
  MapPin,
  User,
  ChevronDown,
  Users,
  Banknote,
  Info,
  Loader,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  XCircle
} from "lucide-react";
import {
  AuthUser,
  getStoredUser,
  getMe,
  updateUserProfile,
  updateUserBusiness,
  verifyUserEmail,
  uploadAvatar as uploadAvatarApi,
  getMyBillingHistory,
  getMySubscription,
  cancelMySubscription,
  type MySubscriptionPayload
} from "@/lib/authClient";
import { formatMoney, type Currency } from "@/lib/utils";

type Tab = "Profile" | "Business Info" | "Billing";

const TABS: Tab[] = [
  "Profile",
  "Business Info",
  "Billing"
];

export default function DashboardSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-teal-400" />
        </div>
      }
    >
      <DashboardSettingsPageInner />
    </Suspense>
  );
}

function DashboardSettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Outer tab persists via ?tab=Billing; defaults to Profile. Reading the
  // param on mount lets the /dashboard/plans "Manage subscription →" link
  // land deep on Billing → Subscription without an extra click.
  const initialTab: Tab = (() => {
    const t = searchParams.get("tab");
    return t === "Profile" || t === "Business Info" || t === "Billing"
      ? t
      : "Profile";
  })();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "Profile") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    // Clear the billingTab hint when leaving Billing so it doesn't linger
    // and snap the next visit back to Subscription unexpectedly.
    if (tab !== "Billing") params.delete("billingTab");
    const qs = params.toString();
    router.replace(qs ? `/dashboard/settings?${qs}` : "/dashboard/settings", {
      scroll: false,
    });
  };

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
        <div className="flex gap-3 sm:gap-8 justify-center">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
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
  const [firstName, setFirstName] = useState(initialUser?.firstName || "");
  const [lastName, setLastName] = useState(initialUser?.lastName || "");
  const [phone, setPhone] = useState(initialUser?.phone || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [isVerified, setIsVerified] = useState(initialUser?.isVerified || false);
  const [avatarUrl, setAvatarUrl] = useState(initialUser?.avatarUrl || "");

  // Combined name used for the header display and avatar initials.
  const displayName = `${firstName} ${lastName}`.trim();

  useEffect(() => {
    if (initialUser) {
      setFirstName(initialUser.firstName || "");
      setLastName(initialUser.lastName || "");
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
      setFirstName(initialUser.firstName || "");
      setLastName(initialUser.lastName || "");
      setPhone(initialUser.phone || "");
      setEmail(initialUser.email || "");
      setIsVerified(initialUser.isVerified || false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateUserProfile({
        firstName,
        lastName,
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

  // Derive a human-readable role label from the enum value
  const rawRole = initialUser?.role as string | undefined;
  const roleLabel =
    rawRole === "ADMIN" ? "Admin" :
    rawRole === "USER"  ? "User"  :
    rawRole             ? rawRole  : "User";

  // Role badge colour — orange for Admin, teal for User
  const roleBadgeClass =
    rawRole === "ADMIN"
      ? "bg-orange-500/20 text-orange-400 border border-orange-500/20"
      : "bg-teal-500/20 text-teal-400 border border-teal-500/20";

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

      {/* ── TOP CARD: Avatar + Identity (full-width, horizontal) ── */}
      <div className="rounded-xl bg-[#111827] border border-white/5 p-6 sm:p-8 relative overflow-hidden shadow-lg">
        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0 group">
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
                  className={`w-full h-full object-cover transition duration-300 ${isEditing ? 'cursor-pointer group-hover:brightness-50' : ''}`}
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
                  {displayName ? displayName.substring(0, 2).toUpperCase() : "AJ"}
                </span>
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold uppercase tracking-wider">
                    <Camera className="w-5 h-5 mb-1 text-orange-400" />
                    Upload
                  </div>
                )}
              </div>
            )}

            {/* Camera badge — click to upload */}
            {isEditing && (
              <button
                onClick={triggerFileInput}
                title="Change profile picture"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg transition border-2 border-[#111827] z-10"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Name, role badge, email, verification */}
          <div className="flex flex-col items-center sm:items-start gap-2 flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate max-w-full">
              {displayName || "Alex James"}
            </h3>
            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass}`}>
              {roleLabel}
            </span>
            <p className="text-sm text-gray-400 truncate max-w-full mt-1">{email}</p>

            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Email Not Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CARD: General Info form ── */}
      <div className="rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8 relative">
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
              FIRST NAME
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isEditing}
              placeholder="First name"
              className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              LAST NAME
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!isEditing}
              placeholder="Last name"
              className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
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
              className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition duration-300 pr-36 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isVerified ? (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-teal-500/20 text-teal-400 border border-teal-500/10">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </span>
            ) : (
              <button
                onClick={handleVerifyEmail}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/10 transition duration-300"
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
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/states");
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

  // Find selected country states/cities
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
// Mirrors STATUS_COPY from /dashboard/plans. Kept here so the lifted
// ManageView sub-tab is self-contained and doesn't import from /plans.
const SUBSCRIPTION_STATUS_COPY: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: "Active", tone: "bg-emerald-500/15 text-emerald-300" },
  PAST_DUE: { label: "Past due", tone: "bg-amber-500/15 text-amber-300" },
  CANCELLED: { label: "Cancelled", tone: "bg-rose-500/15 text-rose-300" },
  EXPIRED: { label: "Expired", tone: "bg-gray-500/15 text-gray-300" },
};

const formatSubscriptionDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

type BillingSubTab = "History" | "Subscription";

function BillingSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBillingTab: BillingSubTab =
    searchParams.get("billingTab") === "Subscription" ? "Subscription" : "History";
  const [billingTab, setBillingTab] = useState<BillingSubTab>(initialBillingTab);

  const handleBillingTabChange = (tab: BillingSubTab) => {
    setBillingTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "History") {
      params.delete("billingTab");
    } else {
      params.set("billingTab", tab);
    }
    // Make sure the outer ?tab=Billing sticks so a refresh on this sub-tab
    // doesn't bounce the user back to Profile.
    params.set("tab", "Billing");
    router.replace(`/dashboard/settings?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab strip — mirrors the pattern admin/settings uses for its
          internal nested tabs (Roles / Personal info). Sits inside the
          outer Billing tab so the page reads as one product. */}
      <div className="flex gap-2 p-1 rounded-xl bg-[#0d1117] border border-white/5 w-fit">
        {(["History", "Subscription"] as const).map((key) => (
          <button
            key={key}
            onClick={() => handleBillingTabChange(key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              billingTab === key
                ? "bg-orange-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {key === "History" ? "Billing history" : "Subscription"}
          </button>
        ))}
      </div>

      {billingTab === "History" ? <BillingHistoryView /> : <SubscriptionManageView />}
    </div>
  );
}

function BillingHistoryView() {
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

  // Billing history shows each payment in whatever currency it was actually
  // captured with (per-row), so we honor the row's currency tag.
  const formatPrice = (amount: number, currency: string) => {
    const c: Currency = currency === "NGN" ? "NGN" : "USD";
    return formatMoney(amount, c);
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
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Billing history
        </h1>
        <p className="text-sm text-gray-400">
          Review your organizational plan purchases and transaction history
          across the PICA ecosystem.
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

// ─────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION MANAGE VIEW — lifted verbatim from /dashboard/plans
// ─────────────────────────────────────────────────────────────────────────
// The same JSX shape that used to live as ManageView under /dashboard/plans.
// Lives here now so the plans page can stay a pure picker. The cancel modal
// is local to this sub-tab — no shared cross-page modal state.

function SubscriptionManageView() {
  const [sub, setSub] = useState<MySubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await getMySubscription();
    if (res.data) setSub(res.data.subscription);
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  const handleCancel = async () => {
    setCancelBusy(true);
    setCancelError(null);
    const res = await cancelMySubscription();
    setCancelBusy(false);
    if (res.error || !res.data) {
      setCancelError(res.error?.message ?? "Could not cancel subscription.");
      return;
    }
    setCancelOpen(false);
    await refresh();
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="rounded-2xl bg-[#111827] border border-white/5 p-10 text-center">
        <p className="text-sm text-gray-400 mb-5">
          You don&apos;t have an active subscription yet.
        </p>
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
        >
          See plans <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const status = SUBSCRIPTION_STATUS_COPY[sub.status] ?? {
    label: sub.status,
    tone: "bg-gray-500/15 text-gray-300",
  };
  // Subscriptions are billed in the wire currency the user signed up with —
  // surface that exact currency on the management view rather than re-running
  // the resolver, so refund/billing amounts always match what we actually
  // captured.
  const wireCurrency: Currency = sub.currency === "NGN" ? "NGN" : "USD";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-2">
            Your subscription
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
            {sub.plan.name}
          </h1>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest ${status.tone}`}
        >
          {status.label}
        </span>
      </div>

      {cancelError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
          {cancelError}
        </div>
      )}

      {sub.cancelAtPeriodEnd && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-300 flex items-start gap-3">
          <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Your subscription is set to end on{" "}
            <span className="font-bold">
              {formatSubscriptionDate(sub.currentPeriodEnd)}
            </span>
            . You&apos;ll keep your remaining quota until then. After that
            you&apos;ll be on pay-per-use unless you resubscribe.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
            Quota usage this period
          </p>
          <div className="space-y-5">
            <QuotaMeter
              label="Phase 2A diagnostics"
              used={sub.usage.phase2aUsed}
              total={sub.plan.phase2aPerMonth}
            />
            <QuotaMeter
              label="Phase 2B deep dives"
              used={sub.usage.phase2bUsed}
              total={sub.plan.phase2bPerMonth}
            />
            <QuotaMeter
              label="Expert consultations"
              used={sub.usage.consultationsUsed}
              total={sub.plan.consultationsPerMonth}
            />
          </div>
          <p className="text-xs text-gray-500 mt-6 leading-relaxed">
            Quotas reset at the start of every billing period. Unused tests
            don&apos;t roll over. When a quota is exhausted, the matching test
            falls back to pay-per-use automatically.
          </p>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
            Billing
          </p>
          <p className="text-2xl font-extrabold text-white mb-1">
            {formatMoney(sub.plan.priceUsd, wireCurrency)}
          </p>
          <p className="text-xs text-gray-500 mb-5">billed monthly</p>

          <div className="border-t border-white/5 pt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Period started</span>
              <span className="text-white font-medium">
                {formatSubscriptionDate(sub.currentPeriodStart)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Next renewal</span>
              <span className="text-white font-medium">
                {sub.cancelAtPeriodEnd
                  ? "—"
                  : formatSubscriptionDate(sub.currentPeriodEnd)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
          Card on file
        </p>
        {sub.card ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                {sub.card.brand ? `${sub.card.brand} ` : ""}
                <span className="font-mono tracking-wider">
                  •••• {sub.card.last4}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {sub.card.bank ? `${sub.card.bank} · ` : ""}
                {sub.card.expMonth && sub.card.expYear
                  ? `Expires ${sub.card.expMonth}/${sub.card.expYear.slice(-2)}`
                  : "Expiry unknown"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Card details will appear here after your first successful payment.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/plans"
          className="flex-1 py-3 rounded-xl text-sm font-semibold border border-white/10 text-white hover:bg-white/5 transition flex items-center justify-center gap-2"
        >
          View plans <ArrowRight className="w-4 h-4" />
        </Link>
        {!sub.cancelAtPeriodEnd && sub.status === "ACTIVE" && (
          <button
            onClick={() => setCancelOpen(true)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Cancel subscription
          </button>
        )}
      </div>

      {cancelOpen && (
        <CancelConfirmModal
          periodEnd={sub.currentPeriodEnd}
          busy={cancelBusy}
          onConfirm={handleCancel}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </div>
  );
}

function QuotaMeter({
  label,
  used,
  total,
}: {
  label: string;
  used: number;
  total: number;
}) {
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;
  const remaining = Math.max(total - used, 0);
  const exhausted = remaining === 0 && total > 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-3">
        <span className="text-sm font-medium text-white">{label}</span>
        <span
          className={`text-xs font-mono ${
            exhausted ? "text-rose-300" : "text-gray-400"
          }`}
        >
          {used} / {total}
          {exhausted && " · falls back to pay-per-use"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            exhausted
              ? "bg-rose-500"
              : ratio > 0.75
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

function CancelConfirmModal({
  periodEnd,
  busy,
  onConfirm,
  onClose,
}: {
  periodEnd: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#111827] border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
          <XCircle className="w-5 h-5 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Cancel subscription?
        </h2>
        <p className="text-sm text-gray-400 mb-5">
          You&apos;ll keep your remaining quota and continue with full access
          until{" "}
          <span className="text-white font-semibold">
            {formatSubscriptionDate(periodEnd)}
          </span>
          . After that, you&apos;ll be on pay-per-use. You can resubscribe any
          time.
        </p>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300 flex items-start gap-2 mb-5">
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Unused tests do not roll over — they expire when the period ends.
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-white/10 text-white hover:bg-white/5 transition disabled:opacity-60"
          >
            Keep subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && <Loader className="w-4 h-4 animate-spin" />}
            Confirm cancel
          </button>
        </div>
      </div>
    </div>
  );
}
