"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignUp } from "@/lib/authClient";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.businessName)
      newErrors.businessName = "Business name is required";
    if (!form.email) newErrors.email = "Email is required";
    if (!form.phone) newErrors.phone = "Phone number is required";
    if (!form.password) newErrors.password = "Password is required";
    if (!agreed) newErrors.agreed = "You must accept the terms";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    const res = await SignUp({ payload: form });
    if (res.error) {
      setIsLoading(false);
      setErrors({ ...errors, email: res.error.message as string });
    } else {
      setIsLoading(false);
      router.push(
        `/auth/verify-code?email=${encodeURIComponent(
          form.email,
        )}&type=email-verification`,
      );
    }
  };

  const EyeIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0d1117]">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#161b22] grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          {/* Left — Form */}
          <div className="px-8 md:px-12 py-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <img src="/images/logo.png" alt="Beauvision" className="h-8" />
              <span className="text-white text-lg font-bold">Beauvision</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Create Account
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              Join us today and get complete comprehensive analysis
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Business Name */}
              <div>
                <input
                  type="text"
                  placeholder="Business name*"
                  value={form.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-[#0d1117] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    errors.businessName
                      ? "border-red-500 focus:ring-red-400"
                      : "border-white/10 focus:ring-[#f97316]/50"
                  }`}
                />
                {errors.businessName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.businessName}
                  </p>
                )}
              </div>

              {/* Business Email */}
              <div>
                <input
                  type="email"
                  placeholder="Business email*"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-[#0d1117] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    errors.email
                      ? "border-red-500 focus:ring-red-400"
                      : "border-white/10 focus:ring-[#f97316]/50"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <input
                  type="tel"
                  placeholder="Phone number*"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-[#0d1117] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    errors.phone
                      ? "border-red-500 focus:ring-red-400"
                      : "border-white/10 focus:ring-[#f97316]/50"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Password with tooltip */}
              <div className="relative">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password*"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onFocus={() => setShowPasswordHint(true)}
                    onBlur={() => setShowPasswordHint(false)}
                    className={`w-full px-4 py-3.5 rounded-xl border bg-[#0d1117] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition pr-12 ${
                      errors.password
                        ? "border-red-500 focus:ring-red-400"
                        : "border-white/10 focus:ring-[#f97316]/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}

                {/* Password hint tooltip */}
                {showPasswordHint && (
                  <div className="absolute left-0 top-full mt-2 md:left-full md:top-0 md:mt-0 md:ml-3 z-10 bg-[#1c2333] border border-white/10 rounded-2xl shadow-lg p-4 w-64">
                    <p className="text-sm font-semibold text-white mb-2">
                      Your password should contain:
                    </p>
                    <ul className="space-y-1">
                      {[
                        "A Uppercase letter e.g (E)",
                        "An Lowercase letter e.g (a)",
                        "A special character e.g. (!@#)",
                        "A number e.g (1)",
                        "8 characters minimum",
                      ].map((rule) => (
                        <li
                          key={rule}
                          className="flex items-start gap-2 text-sm text-gray-400"
                        >
                          <span className="mt-0.5 text-gray-500">•</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Terms checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (errors.agreed)
                        setErrors((prev) => ({ ...prev, agreed: "" }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-[#0d1117] text-[#f97316] focus:ring-[#f97316] cursor-pointer"
                  />
                  <span className="text-sm text-gray-400 leading-snug">
                    I agree with{" "}
                    <Link
                      href="/terms"
                      className="text-white hover:underline"
                    >
                      Terms of use
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/data-policy"
                      className="text-white hover:underline"
                    >
                      Data Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreed && (
                  <p className="text-red-500 text-xs mt-1">{errors.agreed}</p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] hover:from-[#ea6c0a] hover:to-[#d97706] text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Create my account"}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-sm text-gray-400 mt-5">
              Already have an account?
              <Link
                href="/Auth/login"
                className="font-bold text-white hover:text-[#f97316] transition ml-1 underline"
              >
                Login
              </Link>
            </p>
          </div>

          {/* Right — Image */}
          <div className="hidden md:block relative">
            <Image
              src="/images/assessques.png"
              alt="Create Account"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-white/5">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-3">
          {["Privacy Policy", "Terms of Service", "Security Architecture"].map(
            (item) => (
              <Link
                key={item}
                href="#"
                className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition"
              >
                {item}
              </Link>
            )
          )}
        </div>
        <p className="text-xs text-gray-600 uppercase tracking-wider">
          © 2024 PICA Intelligence Systems. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
