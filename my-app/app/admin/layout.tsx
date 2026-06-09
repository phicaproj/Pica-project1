"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getAccessToken, getStoredUser } from "@/lib/authClient";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  BarChart2,
  Settings,
  Database,
  Activity,
  TicketPercent,
  Search,
  Menu,
  X,
  LogOut,
} from "lucide-react";

type NavItemConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

const NAV_MAIN: NavItemConfig[] = [
  { label: "Home", icon: LayoutDashboard, href: "/admin" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Reports & Analytics", icon: BarChart2, href: "/admin/reports" },
  { label: "Subscription", icon: CreditCard, href: "/admin/subscription" },
  { label: "Payments", icon: DollarSign, href: "/admin/payments" },
];

const NAV_ASSESSMENT: NavItemConfig[] = [
  { label: "Coupons", icon: TicketPercent, href: "/admin/coupons" },
  { label: "Question Bank", icon: Database, href: "/admin/question-bank" },
  { label: "Scoring", icon: Activity, href: "/admin/scoring" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

const ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin/users": "users:read",
  "/admin/reports": "analytics:read",
  "/admin/subscription": "ledger:read",
  "/admin/payments": "ledger:read",
  "/admin/coupons": "coupons:read",
  "/admin/question-bank": "questions:read",
  "/admin/scoring": "scoring:read",
  "/admin/settings": "settings:read",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    const token = getAccessToken();

    if (!token || !user || user.role !== "ADMIN") {
      clearSession();
      router.replace("/Auth/login");
      return;
    }

    // Direct page access guard
    if (pathname !== "/admin") {
      const matchedEntry = Object.entries(ROUTE_PERMISSIONS).find(([route]) => pathname.startsWith(route));
      const requiredPermission = matchedEntry?.[1];

      if (
        requiredPermission &&
        user.adminRoleName !== "SUPER ADMIN" &&
        (!user.permissions || !user.permissions.includes(requiredPermission))
      ) {
        // Redirect to admin landing home if missing permission
        router.replace("/admin");
        return;
      }
    }

    setAuthChecked(true);
  }, [router, pathname]);

  const user = typeof window !== "undefined" ? getStoredUser() : null;
  const isSuperAdmin = user?.adminRoleName === "SUPER ADMIN";
  const permissions = user?.permissions || [];

  const checkPermission = (href: string) => {
    if (href === "/admin") return true;
    const required = ROUTE_PERMISSIONS[href];
    if (!required) return true;
    return isSuperAdmin || permissions.includes(required);
  };

  const visibleNavMain = NAV_MAIN.filter((item) => checkPermission(item.href));
  const visibleNavAssessment = NAV_ASSESSMENT.filter((item) => checkPermission(item.href));

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    setLogoutModal(true);
  };

  const confirmLogout = () => {
    clearSession();
    setLogoutModal(false);
    router.push("/");
  };

  const NavItem = ({ item }: { item: NavItemConfig }) => {
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

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#111318] text-white flex items-center justify-center">
        <div className="text-sm text-gray-400">Checking admin session...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#111318] text-white flex flex-col font-sans overflow-hidden">
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
          className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-60 bg-[#161925] border-r border-white/5 flex flex-col py-6 px-3 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } lg:flex-shrink-0 h-full`}
        >
          <nav className="space-y-1 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {visibleNavMain.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </div>

            <div className="my-4 h-px bg-white/5 mx-4" />

            <div className="space-y-1">
              {visibleNavAssessment.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </div>
          </nav>

          {/* Logout Button at Bottom */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-gray-400 hover:text-white hover:bg-white/5 mt-auto"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            Logout
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#111318]">
          {/* Mobile hamburger button */}
          <button
            className="lg:hidden fixed top-4 left-4 z-30 text-gray-300 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Subtle gradient background element */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
          <div className="relative p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {logoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-6 max-w-sm">
            <h2 className="text-lg font-bold text-white mb-2">Leave Admin Dashboard?</h2>
            <p className="text-gray-400 mb-6">Are you sure you want to leave?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setLogoutModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
              >
                No
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
