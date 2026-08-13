"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from '@/components/ThemeContext';
import { AdminLogin, verifyAdminOtp } from "@/lib/authClient";
import { Eye, EyeOff, ShieldCheck, KeyRound, AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
  const { dark: d } = useTheme();
  const router = useRouter();
  
  // Stages: "credentials" | "otp"
  const [stage, setStage] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await AdminLogin({ payload: { email, password } });

      if (res.error) {
        setError(res.error.message ?? "Invalid admin credentials.");
        setIsLoading(false);
        return;
      }

      if (res.data && "requiresOtp" in res.data && res.data.requiresOtp) {
        setStage("otp");
      } else {
        // Logged in directly (rare for admin, but handled)
        router.push("/admin");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const newVal = val.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = newVal;
    setOtp(newOtp);
    setError("");

    if (newVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pasteData.length === 6) {
      const newOtp = pasteData.split("");
      setOtp(newOtp);
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await verifyAdminOtp({ code });
      if (res.error) {
        setError(res.error.message ?? "Verification failed. Please check the code.");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStage("credentials");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  return (
    <div className={`relative min-h-screen w-full flex items-center justify-center ${d ? 'bg-[#0b0c10]' : 'bg-gray-50'} overflow-hidden px-4`}>
      {/* Background aesthetics */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none animate-pulse duration-[8s]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none animate-pulse duration-[6s]" />

      <div className={`relative w-full max-w-md ${d ? 'bg-[#161b22]/40 border-white/10 shadow-black/80' : 'bg-white/80 border-gray-200 shadow-gray-200'} backdrop-blur-xl border rounded-2xl p-8 md:p-10 shadow-2xl`}>
        
        {/* Brand logo & title */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-orange-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-bounce duration-[3s]">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className={`text-xs font-semibold tracking-[0.2em] uppercase ${d ? 'text-blue-400' : 'text-blue-600'}`}>Secure Access</span>
          <h1 className={`text-2xl font-bold ${d ? 'text-white' : 'text-gray-900'} mt-1`}>PICA Admin Portal</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 flex items-start gap-3">
            <AlertTriangle className={`h-5 w-5 ${d ? 'text-red-400' : 'text-red-600'} flex-shrink-0 mt-0.5`} />
            <p className={`${d ? 'text-red-400' : 'text-red-600'} text-xs leading-relaxed`}>{error}</p>
          </div>
        )}

        {stage === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider ${d ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                Administrator Email
              </label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl border ${d ? 'border-white/10 bg-[#0d1117]/60 text-white placeholder-gray-600' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition disabled:opacity-60`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider ${d ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-xl border ${d ? 'border-white/10 bg-[#0d1117]/60 text-white placeholder-gray-600' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition pr-12 disabled:opacity-60`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${d ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition`}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-blue-500/25 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Authenticating..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                <KeyRound className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className={`text-sm font-semibold ${d ? 'text-white' : 'text-gray-900'}`}>Enter Verification Code</h2>
              <p className={`text-xs ${d ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                A 6-digit secure code has been sent to your administrator email.
              </p>
            </div>

            <div className="flex justify-center gap-2.5">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={idx === 0 ? handleOtpPaste : undefined}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  className={`w-11 h-13 text-center text-xl font-bold ${d ? 'bg-[#0d1117]/80 text-white border-white/10' : 'bg-white text-gray-900 border-gray-200'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition disabled:opacity-50`}
                />
              ))}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading || otp.some(d => !d)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold text-sm tracking-wide shadow-lg shadow-orange-500/25 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify & Access Dashboard"}
              </button>

              <button
                type="button"
                onClick={handleBackToCredentials}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl border ${d ? 'border-white/10 hover:bg-white/5 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900'} text-xs font-semibold tracking-wide transition`}
              >
                Back to credentials
              </button>
            </div>
          </form>
        )}

        <div className={`mt-8 text-center border-t ${d ? 'border-white/5' : 'border-gray-200'} pt-6`}>
          <Link
            href="/"
            className={`text-xs ${d ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition uppercase tracking-wider font-semibold`}
          >
            ← Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
}
