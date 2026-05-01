"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
import {
  LayoutDashboard,
  Radar,
  Box,
  Lightbulb,
  TrendingUp,
  FileText,
  MessageSquare,
  CreditCard,
  Settings,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";

const NAV_MAIN = [
  { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Strategic Scan", icon: Radar, href: "/dashboard/strategic-scan" },
  { label: "Deep Dive Module", icon: Box, href: "/dashboard/deep-dive" },
  { label: "Insights", icon: Lightbulb, href: "/dashboard/insights" },
  { label: "Benchmarks", icon: TrendingUp, href: "/dashboard/benchmarks" },
  { label: "Reports", icon: FileText, href: "/dashboard/reports" },
];

const NAV_SUPPORT = [
  { label: "Consultation", icon: MessageSquare, href: "/dashboard/consultation" },
  { label: "Subscription", icon: CreditCard, href: "/dashboard/subscription" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

function getPageTitle(pathname: string) {
  const all = [...NAV_MAIN, ...NAV_SUPPORT];
  const match = all.find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)));
  return match?.label || "Home";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dark, setDark } = useTheme();
  const pageTitle = getPageTitle(pathname);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const NavItem = ({ item }: { item: (typeof NAV_MAIN)[0] }) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
          active
            ? "text-orange-400 bg-orange-400/5"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-orange-400 rounded-r-full" />
        )}
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col overflow-x-hidden">
      {/* ── Top Nav ── */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-[#0d1117] border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-gray-300 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="text-white font-bold text-xl tracking-wide">
            PICA
          </Link>

          {/* Page title */}
          <span className="text-orange-400 font-semibold text-sm hidden sm:block">
            {pageTitle}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button className="relative p-2 text-gray-400 hover:text-white transition">
            <Bell className="w-5 h-5" />
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-teal-400/30">
              A
            </div>
            <span className="text-sm text-gray-300 hidden sm:block">Alex J.</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`fixed lg:static top-[57px] left-0 bottom-0 z-50 w-56 bg-[#0d1117] flex flex-col py-6 px-3 overflow-y-auto transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } lg:flex-shrink-0`}
        >
          <nav className="space-y-1">
            {NAV_MAIN.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>

          <div className="mt-6">
            <p className="px-4 text-[10px] font-semibold text-orange-400/70 uppercase tracking-widest mb-2">
              Support
            </p>
            <nav className="space-y-1">
              {NAV_SUPPORT.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* ── Mobile dark/light mode toggle ── */}
      <button
        onClick={() => setDark(!dark)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#1c2333] border border-white/10 flex items-center justify-center shadow-lg shadow-black/40 text-gray-300 hover:text-white transition lg:hidden"
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-xs text-gray-500 border-t border-white/5 bg-[#0d1117]">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <span className="hover:text-gray-300 cursor-pointer">PRIVACY POLICY</span>
          <span className="hover:text-gray-300 cursor-pointer">TERMS OF SERVICE</span>
          <span className="hover:text-gray-300 cursor-pointer">SUPPORT</span>
        </div>
        <p>&copy; 2026 PICA</p>
      </footer>
    </div>
  );
}
