"use client";

import Link from "next/link";
import Image from "next/image";
import { Sun, Moon } from "lucide-react";

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

  return (
    <nav
      className={`${isFixed ? "fixed top-0 left-0 right-0 z-50" : ""
        } flex items-center justify-between px-8 py-1 border-b ${d
          ? "bg-[#0d1117]/90 border-white/10 backdrop-blur"
          : "bg-white/90 border-gray-200 backdrop-blur"
        }`}
    >
      <Link href="/" className="flex items-center">
        <Image
          src="/images/logo.png"
          alt="Beauvision"
          width={120}
          height={32}
          className="h-auto"
        />
      </Link>

      <div className="flex items-center gap-8">
        {navItems.map(({ label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`text-sm font-medium transition ${active
                ? "text-teal-400"
                : d
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark(!d)}
          className={`p-2 rounded-full transition ${d
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          {d ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
        <Link
          href="/auth/login"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${d
              ? "text-white hover:bg-white/10"
              : "text-gray-700 hover:bg-gray-100"
            }`}
        >
          Login
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#f97316] hover:bg-[#ea6c0a] text-white transition"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
