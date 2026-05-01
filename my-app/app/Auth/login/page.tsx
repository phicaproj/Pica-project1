"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Login, sendVerificationOtp } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await Login({ payload: { email, password } });

      if (res.error) {
        setError(res.error.message ?? "Login failed. Please try again.");
        return;
      }

      if (res.data?.user.emailVerified === false) {
        await sendVerificationOtp({ email, type: "email-verification" });
        router.push(
          `/auth/verify-code?email=${encodeURIComponent(email)}&type=email-verification`,
        );
        return;
      }

      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
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
          <div className="px-8 md:px-12 py-10 flex flex-col justify-center">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-10">
              <img src="/images/logo.png" alt="Beauvision" className="h-8" />
              <span className="text-white text-lg font-bold">Beauvision</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-400 mb-10">
              Hello, welcome back to your special place
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Business email*"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-[#0d1117] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/50 focus:border-transparent transition disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password*"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    disabled={isLoading}
                    className={`w-full px-4 py-3.5 rounded-xl border bg-[#0d1117] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition pr-12 disabled:opacity-60 ${
                      error
                        ? "border-red-500 focus:ring-red-400"
                        : "border-white/10 focus:ring-[#f97316]/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {error && (
                  <p className="text-red-500 text-xs mt-2">{error}</p>
                )}
              </div>

              {/* Remember me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-[#0d1117] text-[#f97316] focus:ring-[#f97316] cursor-pointer"
                  />
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>
                <Link
                  href="/Auth/forget-password"
                  className="text-sm text-gray-400 hover:text-[#f97316] transition"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] hover:from-[#ea6c0a] hover:to-[#d97706] text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-400 mt-6">
              Don&apos;t have an account?
              <Link
                href="/Auth/signup"
                className="font-bold text-white hover:text-[#f97316] transition ml-1 underline"
              >
                Signup
              </Link>
            </p>
          </div>

          {/* Right — Image */}
          <div className="hidden md:block relative">
            <Image
              src="/images/assessques.png"
              alt="Welcome Back"
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
