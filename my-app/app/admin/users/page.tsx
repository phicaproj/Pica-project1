"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Eye,
  FileText,
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  Table2,
  Loader,
} from "lucide-react";
import { getAllUsers, type AdminUserRow } from "@/lib/authClient";

// â”€â”€ Display helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fullName = (u: AdminUserRow) => {
  const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return name || u.businessName || u.email;
};

const initials = (u: AdminUserRow) => {
  const name = fullName(u);
  return name.substring(0, 2).toUpperCase();
};

const businessSegment = (u: AdminUserRow) => {
  if (u.businessSize === "MEDIUM") return "MEDIUM BUSINESS";
  if (u.businessSize === "SMALL") return "SMALL BUSINESS";
  return u.industry?.toUpperCase() || "UNSPECIFIED";
};

const segmentColor = (u: AdminUserRow) => {
  if (u.businessSize === "MEDIUM") return "text-teal-400 bg-teal-500/10 border-teal-500/20";
  if (u.businessSize === "SMALL") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return "text-gray-400 bg-white/5 border-white/10";
};

const subscriptionLabel = (u: AdminUserRow) => {
  if (u.subscriptionPlan === "PHASE2A") return "Phase 2A";
  if (u.subscriptionPlan === "PHASE2B_PILLAR") return "Phase 2B";
  return "Free";
};

const subscriptionNote = (u: AdminUserRow) => {
  if (u.subscriptionPlan === "PHASE2A") return "STRATEGIC SCAN";
  if (u.subscriptionPlan === "PHASE2B_PILLAR") return "DEEP DIVE";
  return "NO PURCHASE";
};

// Relative "time ago" from an ISO date string.
const lastSeenLabel = (iso: string | null) => {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
};

export default function UsersPage() {
  const router = useRouter();
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [businessSize, setBusinessSize] = useState<"SMALL" | "MEDIUM" | "">("");
  const [plan, setPlan] = useState<"PHASE2A" | "PHASE2B_PILLAR" | "FREE" | "">("");
  const [active, setActive] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const openUser = (userId: string) => router.push(`/admin/users/${userId}`);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchUsers = useCallback(
    async (
      pageIndex: number,
      searchTerm: string,
      limitVal: number,
      bizSize: "SMALL" | "MEDIUM" | "",
      planVal: "PHASE2A" | "PHASE2B_PILLAR" | "FREE" | "",
      activeVal: "ALL" | "ACTIVE" | "INACTIVE"
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllUsers({
          page: pageIndex,
          pageSize: limitVal,
          search: searchTerm || undefined,
          businessSize: bizSize || undefined,
          plan: planVal || undefined,
          active: activeVal === "ALL" ? undefined : activeVal === "ACTIVE",
        });
        if (res.error) {
          setError(res.error.message);
          setUsers([]);
        } else if (res.data) {
          setUsers(res.data.users);
          setTotal(res.data.total);
          setPage(res.data.page);
        }
      } catch {
        setError("Failed to load users. Please try again.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load and search effect
  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(1, search.trim(), pageSize, businessSize, plan, active);
    }, 300);
    return () => clearTimeout(t);
  }, [search, pageSize, businessSize, plan, active, fetchUsers]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchUsers(p, search.trim(), pageSize, businessSize, plan, active);
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Oversee platform access, monitor subscription status, and manage organizational health
            for all PICA active tenants.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === "table"
                ? "bg-white/10 border-white/20 text-white"
                : "border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Table2 className="w-4 h-4" />
            Table View
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === "grid"
                ? "bg-white/10 border-white/20 text-white"
                : "border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Grid View
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stat Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-850 border border-white/5">
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "TOTAL USERS",
              value: total.toLocaleString(),
              sub: "Across all tenants",
              border: "border-r border-white/10",
            },
            {
              label: "ACTIVE NOW",
              value: users.filter((u) => u.isActive).length.toLocaleString(),
              dot: true,
              dotColor: "bg-emerald-500",
              sub: "Active on this page",
              border: "border-r border-white/10",
            },
            {
              label: "PAID SUBS",
              value: users.filter((u) => u.subscriptionPlan).length.toLocaleString(),
              sub: "Paid on this page",
              border: "border-r border-white/10",
            },
            {
              label: "CURRENT PAGE",
              value: `${page} / ${totalPages}`,
              sub: "Pagination info",
              border: "",
            },
          ].map((stat, i) => (
            <div key={i} className={`p-6 ${stat.border}`}>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                {stat.label}
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              {stat.dot && (
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${stat.dotColor}`} />
                  <span className="text-xs text-gray-300">{stat.sub}</span>
                </div>
              )}
              {stat.sub && !stat.dot && (
                <div className="text-[10px] text-gray-400 mt-1">{stat.sub}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, email, or company..."
            className="w-full bg-[#1C1F2E] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={businessSize}
          onChange={(e) => {
            setBusinessSize(e.target.value as "SMALL" | "MEDIUM" | "");
            setPage(1);
          }}
          className="bg-[#1C1F2E] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 hover:text-white outline-none focus:border-blue-500/50"
        >
          <option value="">All Business Sizes</option>
          <option value="SMALL">Small Business</option>
          <option value="MEDIUM">Medium Business</option>
        </select>
        <select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value as "PHASE2A" | "PHASE2B_PILLAR" | "FREE" | "");
            setPage(1);
          }}
          className="bg-[#1C1F2E] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 hover:text-white outline-none focus:border-blue-500/50"
        >
          <option value="">All Subscription Plans</option>
          <option value="FREE">Free</option>
          <option value="PHASE2A">Phase 2A</option>
          <option value="PHASE2B_PILLAR">Phase 2B</option>
        </select>
        <select
          value={active}
          onChange={(e) => {
            setActive(e.target.value as "ALL" | "ACTIVE" | "INACTIVE");
            setPage(1);
          }}
          className="bg-[#1C1F2E] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 hover:text-white outline-none focus:border-blue-500/50"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#1C1F2E] p-12 text-center text-gray-500">
          No users found{search ? ` for "${search}"` : ""}.
        </div>
      ) : (
        <>
          {/* Table View */}
          {view === "table" && (
            <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["NAME & CONTACT", "BUSINESS TYPE", "SUBSCRIPTION", "ACTIVE STATUS", "LAST SEEN", "ACTIONS"].map((h) => (
                        <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => openUser(user.id)}
                        className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer ${!user.isActive ? "opacity-70" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={fullName(user)} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {initials(user)}
                              </div>
                            )}
                            <div>
                              <div className={`text-sm font-semibold ${user.isActive ? "text-white" : "text-gray-400"}`}>{fullName(user)}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${segmentColor(user)}`}>{businessSegment(user)}</span>
                          {user.businessName && (
                            <div className="text-[10px] text-gray-500 mt-1">{user.businessName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{subscriptionLabel(user)}</div>
                          <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{subscriptionNote(user)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                            <span className={`text-xs font-medium ${user.isActive ? "text-emerald-400" : "text-red-400"}`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{lastSeenLabel(user.lastSeenAt)}</td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openUser(user.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openUser(user.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPageSize(val);
                        setPage(1);
                      }}
                      className="bg-[#111318] border border-white/10 rounded px-2 py-1 text-xs text-gray-400 outline-none focus:border-blue-500/50"
                    >
                      {[5, 10, 20, 50, 100].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-sm text-gray-500">
                    Showing {rangeStart}-{rangeEnd} of {total.toLocaleString()} users
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid View */}
          {view === "grid" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => openUser(user.id)}
                    className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={fullName(user)} className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-sm font-bold text-white">
                            {initials(user)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-white">{fullName(user)}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <span className={`w-2 h-2 rounded-full mt-2 ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Segment</span>
                        <span className={`font-semibold text-[10px] px-2 py-0.5 rounded border ${segmentColor(user)}`}>{businessSegment(user)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plan</span>
                        <span className="text-white font-medium">{subscriptionLabel(user)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Seen</span>
                        <span className="text-gray-300">{lastSeenLabel(user.lastSeenAt)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openUser(user.id)}
                        className="flex-1 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        View
                      </button>
                      <button className="flex-1 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">Suspend</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPageSize(val);
                        setPage(1);
                      }}
                      className="bg-[#111318] border border-white/10 rounded px-2 py-1 text-xs text-gray-400 outline-none focus:border-blue-500/50"
                    >
                      {[5, 10, 20, 50, 100].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-sm text-gray-500">
                    Showing {rangeStart}-{rangeEnd} of {total.toLocaleString()} users
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
}
