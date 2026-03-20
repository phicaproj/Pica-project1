"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { SignUp } from "@/lib/authClient";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    rcNumber: "",
    phone: "",
    password: "",
    confirmPassword: "",
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
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!agreed) newErrors.agreed = "You must accept the terms";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // TODO: call your register API here
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
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/signupbg.png')" }}
      />

      {/* Main content */}
      <div className="relative flex-1 flex flex-col">
        {/* Logo - top left */}
        <div className="pt-8 pl-10">
          <div className="flex items-center gap-2">
            {/* Replace with your logo */}
            <img src="/images/logo.png" alt="logo"></img>
          </div>
        </div>

        {/* Card - center */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="bg-white rounded-md shadow-xl px-10 py-8 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
              Create account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Business Name */}
              <div>
                <input
                  type="text"
                  placeholder="Business Name*"
                  value={form.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    errors.businessName
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-200 focus:ring-[#017CA3]"
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
                  placeholder="Business Email Address*"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    errors.email
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-200 focus:ring-[#017CA3]"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* RC Number */}
              <div>
                <input
                  type="text"
                  placeholder="Rc number"
                  value={form.rcNumber}
                  onChange={(e) => handleChange("rcNumber", e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>

              {/* Phone Number */}
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number*"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    errors.phone
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-200 focus:ring-[#017CA3]"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Enter Password with tooltip */}
              <div className="relative">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password*"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onFocus={() => setShowPasswordHint(true)}
                    onBlur={() => setShowPasswordHint(false)}
                    className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition pr-12 ${
                      errors.password
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-200 focus:ring-[#017CA3]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}

                {/* Password hint tooltip */}
                {showPasswordHint && (
                  <div className="absolute left-full top-0 ml-3 z-10 bg-white rounded-2xl shadow-lg p-4 w-64">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      Your password should contain:
                    </p>
                    <ul className="space-y-1">
                      {[
                        "A Uppercase letter e.g  (E)",
                        "An Lowercase letter e.g (e)",
                        "A special character e.g  (!@#)",
                        "A number e.g (1)",
                        "8 characters minimum",
                      ].map((rule) => (
                        <li
                          key={rule}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <span className="mt-0.5 text-gray-400">•</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password*"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition pr-12 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-200 focus:ring-[#017CA3]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
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
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#017CA3] focus:ring-[#017CA3] cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 leading-snug">
                    I have read and accepted the{" "}
                    <Link
                      href="/terms"
                      className="text-[#017CA3] hover:underline"
                    >
                      Terms & conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/data-policy"
                      className="text-[#017CA3] hover:underline"
                    >
                      Data Processing Policy
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
                className="w-full py-3.5 rounded-xl bg-[#017CA3] hover:bg-[#046f91] active:bg-[#017CA3] text-white font-semibold text-sm tracking-wide transition-colors duration-200"
              >
                {isLoading ? "Creating account..." : "Create my account"}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-bold text-gray-900 hover:text-[#017CA3] transition"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-4 text-center text-sm text-gray-600 bg-white/80 backdrop-blur-sm">
        © Beauvision 2024 . All rights reserved. Powered By{" "}
        <a
          href="https://sundimension.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#017CA3] transition"
        >
          SunDimension
        </a>
      </div>
    </div>
  );
}
