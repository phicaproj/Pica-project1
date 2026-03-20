"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOtp, sendVerificationOtp } from "@/lib/authClient";

export default function VerifyCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = (searchParams.get("type") || "forget-password") as
    | "email-verification"
    | "forget-password";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (codeError) setCodeError("");
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
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
      const res = await verifyOtp({ code, email, type });
      console.log(res);

      if (res.error) {
        setCodeError(res.error.message ?? "Incorrect code. Please try again.");
        return;
      }

      if (type === "email-verification") {
        alert("Email verified successfully");
        router.push("/");
      } else if (type === "forget-password") {
        // forget-password — pass the verified otp directly to the new-password page
        router.push(
          `/auth/new-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(code)}`,
        );
      }
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
      await sendVerificationOtp({ email, type });
    } catch {
      setCodeError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const heading =
    type === "email-verification" ? "Verify Your Email" : "Reset Password";
  const subtext =
    type === "email-verification"
      ? "Enter the verification code we sent to"
      : "We've sent a reset code to";

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/loginbg.jpeg')" }}
      />

      {/* Main content */}
      <div className="relative flex-1 flex flex-col">
        {/* Logo - centered */}
        <div className=" flex justify-center">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="logo" />
          </div>
        </div>

        {/* Card - centered */}
        <div className="flex-1 flex items-center justify-center pb-10">
          <div className="bg-white rounded-md shadow-xl p-10 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              {heading}
            </h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              {subtext}{" "}
              <span className="font-bold text-gray-900">
                {email || "your email"}
              </span>
            </p>

            <form onSubmit={handleVerify}>
              {/* OTP inputs */}
              <div className="flex justify-center gap-3 mb-2">
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
                        : "border-gray-200 focus:ring-[#017CA3]"
                    }`}
                  />
                ))}
              </div>

              {/* Error message */}
              {codeError && (
                <p className="text-red-500 text-xs text-center mb-3">
                  {codeError}
                </p>
              )}

              {/* Resend */}
              <p className="text-sm text-gray-500 text-center mb-6 mt-3">
                Didn&apos;t receive the email yet?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || isLoading}
                  className="text-[#017CA3] font-medium hover:underline transition disabled:opacity-50"
                >
                  {isResending ? "Resending..." : "Resend"}
                </button>
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#017CA3] hover:bg-[#046f91] active:bg-[#017CA3] text-white font-semibold text-sm tracking-wide transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </form>
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
