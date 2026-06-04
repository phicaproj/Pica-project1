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
  const [logoutModal, setLogoutModal] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    setLogoutModal(true);
  };

  const confirmLogout = () => {
    setLogoutModal(false);
    router.push("/");
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
    <div className="min-h-screen bg-[#111318] text-white flex font-sans">
      <div className="flex-1 flex overflow-hidden">
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
          } lg:flex-shrink-0 h-screen`}
        >
          <nav className="space-y-1 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {NAV_MAIN.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </div>

            <div className="my-4 h-px bg-white/5 mx-4" />

            <div className="space-y-1">
              {NAV_ASSESSMENT.map((item) => (
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
          <div className="relative z-10 p-4 md:p-6 lg:p-8">
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
