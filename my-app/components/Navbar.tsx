"use client";

import Link from "next/link";
import Image from "next/image";
import { Sun, Moon, Menu, X, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { clearSession, getStoredUser, type AuthUser } from "@/lib/authClient";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface NavbarProps {
  dark: boolean;
  setDark: (value: boolean) => void;
  navItems: NavItem[];
  isFixed?: boolean;
}

export default function Navbar({
  dark,
  setDark,
  navItems,
  isFixed = false,
}: NavbarProps) {
  const d = dark;
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const accountHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";
  const accountLabel = user?.role === "ADMIN" ? "Admin" : "Dashboard";
  const displayName =
    user?.businessName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Account";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  const AccountAvatar = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const dimension = size === "md" ? "h-10 w-10" : "h-8 w-8";
    return user?.avatarUrl ? (
      <img
        src={user.avatarUrl}
        alt={displayName}
        className={`${dimension} rounded-full object-cover ring-2 ${
          d ? "ring-white/10" : "ring-gray-200"
        }`}
      />
    ) : (
      <div
        className={`${dimension} rounded-full bg-[#f97316] text-white flex items-center justify-center text-xs font-bold`}
      >
        {initial}
      </div>
    );
  };

  return (
    <>
      <nav
        className={`${isFixed ? "fixed top-0 left-0 right-0 z-50" : ""
          } flex items-center justify-between px-4 sm:px-8 py-2 border-b ${d
            ? "bg-[#0d1117]/95 border-white/10 backdrop-blur"
            : "bg-white/95 border-gray-200 backdrop-blur"
          }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="Beauvision"
            width={100}
            height={28}
            className="h-auto w-[100px]"
          />
        </Link>

        {/* Desktop Navigation - hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map(({ label, href, active }) => (
            <Link
              key={label}
              href={href}
              className={`relative text-sm font-medium transition pb-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#f97316] after:transition-all after:duration-300 hover:after:w-full ${active
                  ? "text-teal-400 after:w-full after:bg-teal-400"
                  : d
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop Right Actions - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setDark(!d)}
            className={`p-2 rounded-full transition ${d
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {d ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                className={`flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition ${
                  d ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-800"
                }`}
              >
                <AccountAvatar />
                <span className="max-w-36 truncate text-sm font-semibold">
                  {displayName}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {accountMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border shadow-xl ${
                    d
                      ? "border-white/10 bg-[#111827] text-white"
                      : "border-gray-200 bg-white text-gray-900"
                  }`}
                >
                  <Link
                    href={accountHref}
                    onClick={() => setAccountMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${
                      d ? "hover:bg-white/10" : "hover:bg-gray-100"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {accountLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition ${
                      d ? "hover:bg-white/10" : "hover:bg-gray-100"
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/Auth/login"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${d
                    ? "text-white hover:bg-white/10"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Login
              </Link>
              <Link
                href="/Auth/signup"
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#f97316] hover:bg-[#ea6c0a] text-white transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded-lg transition ${d
              ? "text-white hover:bg-white/10"
              : "text-gray-700 hover:bg-gray-100"
            }`}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className={`fixed top-[53px] left-0 right-0 z-40 md:hidden shadow-xl border-t ${d
              ? "bg-[#0d1117]/95 border-white/10 backdrop-blur"
              : "bg-white/95 border-gray-200 backdrop-blur"
            }`}
        >
          <div className="flex flex-col p-4 space-y-3">
            {/* Navigation Links */}
            {navItems.map(({ label, href, active }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition border-l-2 ${active
                    ? "text-teal-400 bg-teal-400/10 border-teal-400"
                    : d
                      ? "text-gray-300 hover:text-white hover:bg-white/10 border-transparent hover:border-[#f97316]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent hover:border-[#f97316]"
                  }`}
              >
                {label}
              </Link>
            ))}

            {/* Divider */}
            <div className={`h-px my-2 ${d ? "bg-white/10" : "bg-gray-200"}`} />

            {/* Theme Toggle - Mobile */}
            <button
              onClick={() => setDark(!d)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${d
                  ? "text-white hover:bg-white/10"
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {d ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{d ? "Light Mode" : "Dark Mode"}</span>
            </button>

            {user ? (
              <div className="space-y-2">
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    d ? "bg-white/5" : "bg-gray-100"
                  }`}
                >
                  <AccountAvatar size="md" />
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${d ? "text-white" : "text-gray-900"}`}>
                      {displayName}
                    </p>
                    <p className={d ? "text-xs text-gray-400" : "text-xs text-gray-500"}>
                      {user.role === "ADMIN" ? "Admin account" : "User account"}
                    </p>
                  </div>
                </div>
                <Link
                  href={accountHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${d
                      ? "text-white hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {accountLabel}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${d
                      ? "text-white hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/Auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium text-center transition ${d
                      ? "text-white hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  Login
                </Link>
                <Link
                  href="/Auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-center bg-[#f97316] hover:bg-[#ea6c0a] text-white transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add padding to body content if navbar is fixed */}
      {isFixed && <div className="h-[53px]" />}
    </>
  );
}
