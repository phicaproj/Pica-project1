"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Login, sendVerificationOtp } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/loginbg.jpeg')",
        }}
      />

      {/* Main content */}
      <div className="relative flex-1 flex flex-col">
        {/* Logo - centered */}
        <div className="pt-10 flex justify-center">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="logo" />
          </div>
        </div>

        {/* Login card - centered */}
        <div className="flex-1 flex items-center justify-center pb-10">
          <div className="bg-white rounded-md shadow-xl p-10 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-8">
              Login to your account
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#017CA3] focus:border-transparent transition disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    disabled={isLoading}
                    className={`w-full px-4 py-3.5 rounded-xl border text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition pr-12 bg-gray-50 disabled:opacity-60 ${
                      error
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-200 focus:ring-[#017CA3]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
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
                    ) : (
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
                    )}
                  </button>
                </div>

                {/* Error + Forgot Password row */}
                <div className="flex items-center justify-between mt-2">
                  {error ? (
                    <p className="text-red-500 text-xs">{error}</p>
                  ) : (
                    <span />
                  )}
                  <Link
                    href="/auth/forget-password"
                    className="text-sm text-gray-500 hover:text-[#017CA3] transition ml-auto"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#017CA3] hover:bg-[#046f91] active:bg-[#017CA3] text-white font-semibold text-sm tracking-wide transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Do not have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-bold text-gray-900 hover:text-teal-600 transition"
              >
                Sign Up
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
          className="underline hover:text-teal-600 transition"
        >
          SunDimension
        </a>
      </div>
    </div>
  );
}
