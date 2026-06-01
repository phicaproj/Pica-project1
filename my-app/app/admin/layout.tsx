"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  DollarSign,
  BarChart2,
  Settings,
  Database,
  Activity,
  PenTool,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight
} from "lucide-react";

const NAV_MAIN = [
  { label: "Home", icon: LayoutDashboard, href: "/admin" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Reports", icon: FileText, href: "/admin/reports" },
  { label: "Subscription", icon: CreditCard, href: "/admin/subscription" },
  { label: "Payments", icon: DollarSign, href: "/admin/payments" },
  { label: "Analytics", icon: BarChart2, href: "/admin/analytics" },
];

const NAV_ASSESSMENT = [
  { label: "Assessment Builder", icon: PenTool, href: "/admin/assessment-builder" },
  { label: "Question Bank", icon: Database, href: "/admin/question-bank" },
  { label: "Scoring", icon: Activity, href: "/admin/scoring" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
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
            ? "text-white bg-blue-500/20"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-500 rounded-r-full" />
        )}
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#111318] text-white flex flex-col font-sans">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#111318] border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-gray-300 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#F97316"/>
                <path d="M2 17L12 22L22 17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-white font-bold text-lg tracking-wide hidden sm:block">
                Beauvision
              </span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
            <Link href="/admin" className="text-white font-bold text-xl tracking-wide hidden sm:block">
              PICA
            </Link>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search insights..." 
              className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 w-64"
            />
          </div>
          
          <button className="bg-blue-200/90 hover:bg-blue-200 text-blue-950 px-4 py-1.5 rounded-full text-sm font-medium transition-colors hidden sm:block">
            Create Assessment
          </button>

          <div className="flex items-center gap-3 border-l border-white/10 pl-6">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
               <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static top-[73px] left-0 bottom-0 z-50 w-60 bg-[#161925] border-r border-white/5 flex flex-col py-6 px-3 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } lg:flex-shrink-0`}
        >
          <nav className="space-y-1">
            {NAV_MAIN.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>

          <div className="my-4 h-px bg-white/5 mx-4" />

          <nav className="space-y-1">
            {NAV_ASSESSMENT.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#111318]">
          {/* Subtle gradient background element */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
          <div className="relative z-10 p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
