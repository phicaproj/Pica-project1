"use client";

import { Suspense, useState, useRef, KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { forgotPassword, verifyResetOtp } from "@/lib/authClient";

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (codeError) setCodeError("");
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 5).split("");
    const newOtp = [...otp];
    pasted.forEach((char, i) => {
      if (/\d/.test(char)) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 4)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 5) {
      setCodeError("Please enter the full 5-digit code.");
      return;
    }

    setIsLoading(true);
    setCodeError("");

    try {
      const res = await verifyResetOtp({ code, email });

      if (res.error) {
        setCodeError(
          res.error.message ?? "Incorrect code. Please try again.",
        );
        return;
      }

      router.push(
        `/Auth/new-password?email=${encodeURIComponent(email)}`,
      );
    } catch {
      setCodeError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp(["", "", "", "", ""]);
    setCodeError("");
    setIsResending(true);
    inputRefs.current[0]?.focus();

    try {
      const res = await forgotPassword({ email });
      if (res.error) {
        setCodeError(res.error.message ?? "Failed to resend code.");
      }
    } catch {
      setCodeError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const heading = "Reset Password";
  const subtext = "We have sent a code to your email";

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0d1117]">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <img src="/images/logo.png" alt="Beauvision" className="h-8" />
          <span className="text-white text-lg font-bold">Beauvision</span>
        </div>

        {/* Card */}
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161b22] p-8 md:p-10">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {heading}
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">
            {subtext}
          </p>

          <form onSubmit={handleVerify}>
            {/* OTP inputs */}
            <div className="flex justify-center gap-3 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-14 h-14 text-center text-lg font-semibold rounded-xl border-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-60 ${
                    codeError
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-[#f97316]/50"
                  }`}
                />
              ))}
            </div>

            {/* Error message */}
            {codeError && (
              <p className="text-red-500 text-xs text-center mb-2">
                {codeError}
              </p>
            )}

            {/* Resend */}
            <p className="text-sm text-gray-400 text-center mb-6">
              Didn&apos;t receive the email yet?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || isLoading}
                className="text-white font-bold hover:text-[#f97316] transition disabled:opacity-50"
              >
                {isResending ? "Resending..." : "Resend"}
              </button>
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] hover:from-[#ea6c0a] hover:to-[#d97706] text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </form>
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

export default function VerifyCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d1117]">
          <div className="rounded-2xl border border-white/10 bg-[#161b22] p-10 w-full max-w-md mx-4 text-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyCodeContent />
    </Suspense>
  );
}
