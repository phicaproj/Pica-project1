"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CreditCard,
  Building2,
  Eye,
  Search,
  Loader,
  X,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import {
  getAdminPayments,
  getAdminPaymentStats,
  getAdminPaymentDetail,
  checkAdminPayment,
  updateAdminPaymentStatus,
  type AdminPaymentRow,
  type AdminPaymentStats,
  type AdminPaymentDetail,
  type PaymentStatusValue,
} from "@/lib/authClient";
import { formatMoney, type Currency } from "@/lib/utils";

// ── Display helpers ───────────────────────────────────────────
const STATUS_STYLES: Record<PaymentStatusValue, string> = {
  SUCCESS: "text-emerald-400 bg-emerald-400/10",
  PENDING: "text-amber-400 bg-amber-400/10",
  FAILED: "text-red-400 bg-red-400/10",
  ABANDONED: "text-gray-400 bg-gray-400/10",
  REVERSED: "text-purple-400 bg-purple-400/10",
};

const STATUS_LABELS: Record<PaymentStatusValue, string> = {
  SUCCESS: "Successful",
  PENDING: "Pending",
  FAILED: "Failed",
  ABANDONED: "Abandoned",
  REVERSED: "Reversed",
};

const PLAN_LABELS: Record<string, string> = {
  PHASE2A: "Full Diagnostic",
  PHASE2B_PILLAR: "Deep Dive",
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-emerald-500",
];

const avatarColor = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initialsOf = (p: AdminPaymentRow) => {
  const source = p.businessName || p.email;
  return source.substring(0, 2).toUpperCase();
};

// Per-row amounts are rendered in the currency the payment was actually
// captured with (Payment.currency). Roll-ups / stats / month bars don't have
// a per-row currency, so they default to USD — the catalogue base after Slice
// 2. Callers can pass `null`/`undefined`/'' to fall back to USD too.
const formatAmount = (n: number, currency?: string | null) => {
  const c: Currency = currency === "NGN" ? "NGN" : "USD";
  return formatMoney(n, c);
};

// Roll-up amounts (Total Revenue, This Month, Pending) are now USD-denominated
// because the BE aggregates Payment.amountUsd — there's no per-row currency to
// honour here. We only abbreviate at $10k+ (≥ 5 figures) so small totals like
// $100 don't render as the absurd "$100.0k". M kicks in at $1M+.
const compactAmount = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  return formatAmount(n, "USD");
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const methodLabel = (method: string | null) => {
  if (!method) return "—";
  const map: Record<string, string> = {
    card: "Card",
    bank: "Bank",
    bank_transfer: "Bank Transfer",
    transfer: "Transfer",
    ussd: "USSD",
    qr: "QR",
    mobile_money: "Mobile Money",
  };
  return map[method] ?? method;
};

export default function PaymentsPage() {
  // ── Stats ─────────────────────────────────────────────────────
  const [stats, setStats] = useState<AdminPaymentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── List + filters ────────────────────────────────────────────
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusValue | "">("");
  const [planFilter, setPlanFilter] = useState<"PHASE2A" | "PHASE2B_PILLAR" | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 450);
    return () => clearTimeout(t);
  }, [search]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      plan: planFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [debouncedSearch, statusFilter, planFilter, dateFrom, dateTo]
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    const res = await getAdminPaymentStats();
    if (res.error) setError(res.error.message);
    else if (res.data) setStats(res.data.stats);
    setStatsLoading(false);
  }, []);

  const fetchPayments = useCallback(
    async (pageIndex: number) => {
      setTableLoading(true);
      const res = await getAdminPayments({ ...filters, page: pageIndex, pageSize });
      if (res.error) {
        setError(res.error.message);
        setPayments([]);
      } else if (res.data) {
        setPayments(res.data.payments);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
        setError(null);
      }
      setTableLoading(false);
    },
    [filters]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  // ── Detail modal ──────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminPaymentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  const [checking, setChecking] = useState(false);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<PaymentStatusValue>("SUCCESS");
  const [statusReason, setStatusReason] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const openModal = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setModalError(null);
    setModalNotice(null);
    setStatusFormOpen(false);
    setStatusReason("");
    setDetailLoading(true);
    const res = await getAdminPaymentDetail(id);
    if (res.error) setModalError(res.error.message);
    else if (res.data) setDetail(res.data.payment);
    setDetailLoading(false);
  }, []);

  const closeModal = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const refreshAfterMutation = useCallback(() => {
    fetchPayments(page);
    fetchStats();
  }, [fetchPayments, fetchStats, page]);

  const handleCheckPayment = async () => {
    if (!detail) return;
    setChecking(true);
    setModalError(null);
    setModalNotice(null);
    const res = await checkAdminPayment(detail.id);
    if (res.error) {
      setModalError(res.error.message);
    } else if (res.data) {
      setModalNotice(
        res.data.checkedVia === "database"
          ? `Confirmed from our records: ${STATUS_LABELS[res.data.status]}${res.data.gatewayResponse ? ` — ${res.data.gatewayResponse}` : ""}`
          : `Re-verified with Paystack: ${STATUS_LABELS[res.data.status]}${res.data.gatewayResponse ? ` — ${res.data.gatewayResponse}` : ""}`
      );
      // Reload the detail (status / entitlements may have changed) + the table.
      const refreshed = await getAdminPaymentDetail(detail.id);
      if (refreshed.data) setDetail(refreshed.data.payment);
      refreshAfterMutation();
    }
    setChecking(false);
  };

  const handleStatusChange = async () => {
    if (!detail || statusReason.trim().length < 3) return;
    setSavingStatus(true);
    setModalError(null);
    setModalNotice(null);
    const res = await updateAdminPaymentStatus(detail.id, {
      status: newStatus,
      reason: statusReason.trim(),
    });
    if (res.error) {
      setModalError(res.error.message);
    } else if (res.data) {
      setDetail(res.data.payment);
      setModalNotice(res.data.message);
      setStatusFormOpen(false);
      setStatusReason("");
      refreshAfterMutation();
    }
    setSavingStatus(false);
  };

  // ── Chart geometry from real monthly revenue ──────────────────
  const monthly = stats?.monthlyRevenue ?? [];
  const chartMax = Math.max(1, ...monthly.map((m) => m.amount));
  // Map the 6 monthly points onto the 520x140 viewBox (y inverted, 10px padding).
  const chartPts = monthly.map((m, i) => ({
    x: monthly.length > 1 ? (i / (monthly.length - 1)) * 520 : 0,
    y: 130 - (m.amount / chartMax) * 110,
  }));
  const linePath = chartPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = chartPts.length > 0 ? `${linePath} L 520 140 L 0 140 Z` : "";

  const successRate = stats?.successRatePct ?? null;
  // Donut: r=15 → circumference ≈ 94.25.
  const donutOffset = successRate !== null ? 94.25 * (1 - successRate / 100) : 94.25;

  const settledCounts = (stats?.countByStatus ?? []).filter((s) => s.status !== "PENDING");
  const statusTotal = Math.max(1, settledCounts.reduce((sum, s) => sum + s.count, 0));

  const hasFilters = Boolean(debouncedSearch || statusFilter || planFilter || dateFrom || dateTo);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Payment Management</h1>
        <p className="text-gray-400 text-sm max-w-xl">
          Live Paystack transactions — monitor revenue, check payment states, and resolve support
          cases.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stat Banner with background image */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#111318]/65" />

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/5">
          {/* Total Revenue */}
          <div className="p-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Total Revenue</div>
            <div className="text-3xl font-bold text-white mb-2">
              {statsLoading && !stats ? "—" : compactAmount(stats?.totalRevenue ?? 0)}
            </div>
            {stats?.revenueGrowthPct !== null && stats?.revenueGrowthPct !== undefined ? (
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold ${
                  stats.revenueGrowthPct >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {stats.revenueGrowthPct >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {stats.revenueGrowthPct >= 0 ? "+" : ""}
                {stats.revenueGrowthPct}% vs last month
              </div>
            ) : (
              <div className="text-xs text-gray-400">No revenue last month to compare</div>
            )}
            <div className="mt-3 flex items-end gap-0.5 h-8">
              {(monthly.length > 0 ? monthly : Array.from({ length: 6 }, () => ({ amount: 0 }))).map(
                (m, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500/40 rounded-sm"
                    style={{ height: `${Math.max(8, (m.amount / chartMax) * 100)}%` }}
                  />
                )
              )}
            </div>
          </div>

          {/* This Month */}
          <div className="p-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">This Month</div>
            <div className="text-3xl font-bold text-white mb-2">
              {statsLoading && !stats ? "—" : compactAmount(stats?.revenueThisMonth ?? 0)}
            </div>
            <div className="text-xs text-gray-400">
              Last month: {compactAmount(stats?.revenueLastMonth ?? 0)}
            </div>
            <div className="mt-3">
              <svg viewBox="0 0 100 30" className="w-full h-8">
                <polyline
                  points={monthly
                    .map(
                      (m, i) =>
                        `${monthly.length > 1 ? (i / (monthly.length - 1)) * 100 : 0},${28 - (m.amount / chartMax) * 24}`
                    )
                    .join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>

          {/* Pending Payments */}
          <div className="p-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pending Payments</div>
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {statsLoading && !stats ? "—" : compactAmount(stats?.pendingAmount ?? 0)}
            </div>
            <div className="text-xs text-gray-400">
              {stats?.pendingCount ?? 0} transaction{(stats?.pendingCount ?? 0) === 1 ? "" : "s"}{" "}
              awaiting confirmation
            </div>
            <div className="mt-3 relative w-16 h-8 flex items-center justify-center">
              <svg viewBox="0 0 60 34" className="w-full h-full">
                <path d="M 5 30 A 25 25 0 0 1 55 30" fill="none" stroke="#374151" strokeWidth="6" />
                <path
                  d="M 5 30 A 25 25 0 0 1 55 30"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="6"
                  strokeDasharray="78.5"
                  strokeDashoffset={
                    78.5 *
                    (1 -
                      Math.min(
                        1,
                        (stats?.pendingCount ?? 0) /
                          Math.max(1, (stats?.countByStatus ?? []).reduce((s, r) => s + r.count, 0))
                      ))
                  }
                />
              </svg>
            </div>
          </div>

          {/* Success Rate */}
          <div className="p-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Success Rate</div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="transparent" stroke="#1f2937" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray="94.25"
                    strokeDashoffset={donutOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {successRate !== null ? `${Math.round(successRate)}%` : "—"}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {successRate !== null ? "of settled payments succeed" : "No settled payments yet"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Velocity + Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Revenue Velocity</h2>
              <p className="text-sm text-gray-400">Monthly earnings over the last 6 months</p>
            </div>
            {statsLoading && <Loader className="w-4 h-4 animate-spin text-gray-500" />}
          </div>

          {/* SVG area chart (real data) */}
          <div className="relative h-48">
            <svg viewBox="0 0 520 140" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 35, 70, 105, 140].map((y) => (
                <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="#ffffff08" strokeWidth="1" />
              ))}
              {areaPath && <path d={areaPath} fill="url(#revGrad)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
            {/* X labels + per-month amounts */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-1">
              {monthly.map((m) => (
                <span key={`${m.monthLabel}-${m.year}`} title={`${formatAmount(m.amount)} · ${m.count} payments`}>
                  {m.monthLabel}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Status overview */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Payment Outcomes</h3>
          <div className="space-y-3 flex-1">
            {(["SUCCESS", "FAILED", "ABANDONED", "REVERSED", "PENDING"] as PaymentStatusValue[]).map(
              (status) => {
                const count = stats?.countByStatus.find((s) => s.status === status)?.count ?? 0;
                const denominator = status === "PENDING" ? Math.max(1, count) : statusTotal;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={`font-medium ${STATUS_STYLES[status].split(" ")[0]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full">
                      <div
                        className={`h-full rounded-full ${
                          status === "SUCCESS"
                            ? "bg-emerald-500"
                            : status === "FAILED"
                              ? "bg-red-500"
                              : status === "PENDING"
                                ? "bg-amber-500"
                                : status === "REVERSED"
                                  ? "bg-purple-500"
                                  : "bg-gray-500"
                        }`}
                        style={{ width: `${Math.min(100, (count / denominator) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex flex-col gap-4 px-6 py-5 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Transaction History</h2>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reference, email, business…"
                  className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-64"
                />
              </div>
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </button>
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setPlanFilter("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          {filtersOpen && (
            <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-white/5">
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Status</div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PaymentStatusValue | "")}
                  className="bg-[#111318] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">All statuses</option>
                  {(Object.keys(STATUS_LABELS) as PaymentStatusValue[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Plan</div>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as "PHASE2A" | "PHASE2B_PILLAR" | "")}
                  className="bg-[#111318] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">All plans</option>
                  <option value="PHASE2A">Full Diagnostic</option>
                  <option value="PHASE2B_PILLAR">Deep Dive</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">From</div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-[#111318] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">To</div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-[#111318] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["REFERENCE", "CUSTOMER", "DATE", "AMOUNT", "PLAN", "METHOD", "STATUS", ""].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLoading && payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader className="w-5 h-5 animate-spin text-gray-500 inline" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                    No payments match the current filters.
                  </td>
                </tr>
              ) : (
                payments.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => openModal(tx.id)}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        {tx.reference}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full ${avatarColor(tx.email)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                        >
                          {initialsOf(tx)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {tx.businessName || "—"}
                          </div>
                          <div className="text-xs text-gray-500">{tx.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                      {formatDate(tx.paidAt ?? tx.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                      {formatAmount(tx.amount, tx.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 whitespace-nowrap">
                        {PLAN_LABELS[tx.plan] ?? tx.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        {tx.paymentMethod === "card" ? (
                          <CreditCard className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Building2 className="w-4 h-4 text-gray-500" />
                        )}
                        {methodLabel(tx.paymentMethod)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[tx.status]}`}>
                        • {STATUS_LABELS[tx.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(tx.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <span className="text-sm text-gray-500">
            {total > 0
              ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total.toLocaleString()} transactions`
              : "No transactions"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchPayments(page - 1)}
              disabled={page <= 1 || tableLoading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchPayments(page + 1)}
              disabled={page >= totalPages || tableLoading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Payment detail modal ─────────────────────────────── */}
      {selectedId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="bg-[#1C1F2E] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#1C1F2E] z-10">
              <div>
                <h3 className="text-lg font-bold text-white">Payment Details</h3>
                {detail && (
                  <span className="text-xs font-mono text-blue-400">{detail.reference}</span>
                )}
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : modalError && !detail ? (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {modalError}
                </div>
              ) : detail ? (
                <>
                  {/* Status + amount strip */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-3xl font-bold text-white">{formatAmount(detail.amount, detail.currency)}</div>
                      {detail.discountAmount ? (
                        <div className="text-xs text-gray-400 mt-1">
                          Base {formatAmount(detail.baseAmount, detail.currency)} − coupon{" "}
                          <span className="font-mono text-purple-400">{detail.couponCode}</span> (
                          {formatAmount(detail.discountAmount, detail.currency)})
                        </div>
                      ) : null}
                    </div>
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${STATUS_STYLES[detail.status]}`}>
                      • {STATUS_LABELS[detail.status]}
                    </span>
                  </div>

                  {modalNotice && (
                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {modalNotice}
                    </div>
                  )}
                  {modalError && (
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {modalError}
                    </div>
                  )}

                  {/* Detail grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {[
                      ["Customer", detail.businessName || "—"],
                      ["Email", detail.email],
                      ["Plan", PLAN_LABELS[detail.plan] ?? detail.plan],
                      ["Pillar", detail.pillarName ?? (detail.plan === "PHASE2B_PILLAR" ? "—" : "n/a")],
                      ["Method", methodLabel(detail.paymentMethod)],
                      ["Provider", detail.provider],
                      ["Created", formatDateTime(detail.createdAt)],
                      ["Paid at", formatDateTime(detail.paidAt)],
                      ["Last updated", formatDateTime(detail.updatedAt)],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                          {label}
                        </div>
                        <div className="text-gray-200 break-words">{value as string}</div>
                      </div>
                    ))}
                  </div>

                  {detail.failureReason && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">
                        Failure reason
                      </div>
                      <div className="text-sm text-gray-300">{detail.failureReason}</div>
                    </div>
                  )}

                  {/* What the user got */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      What the customer received
                    </div>
                    {detail.plan === "PHASE2A" ? (
                      <div className="flex items-center gap-2 text-sm">
                        {detail.resultIsPaid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-gray-200">Full Diagnostic report unlocked</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-gray-300">
                              Report not unlocked{detail.resultIsPaid === null ? " (no result found for the session)" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        {detail.unlock ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-gray-200">
                              Deep Dive credit granted{" "}
                              {detail.unlock.consumedAt
                                ? `· used on ${formatDate(detail.unlock.consumedAt)}`
                                : detail.unlock.sessionId
                                  ? "· assessment in progress"
                                  : "· not yet used"}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-gray-300">No Deep Dive credit granted yet</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Webhook events */}
                  {detail.webhookEvents.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Provider events
                      </div>
                      <div className="space-y-1.5">
                        {detail.webhookEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="flex items-center justify-between text-xs bg-white/[0.03] rounded-lg px-3 py-2"
                          >
                            <span className="font-mono text-gray-300">{evt.eventType}</span>
                            <span
                              className={
                                evt.processingStatus === "PROCESSED"
                                  ? "text-emerald-400"
                                  : evt.processingStatus === "FAILED"
                                    ? "text-red-400"
                                    : "text-gray-400"
                              }
                              title={evt.processingError ?? undefined}
                            >
                              {evt.processingStatus} · {formatDateTime(evt.receivedAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
                    <button
                      onClick={handleCheckPayment}
                      disabled={checking}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      {checking ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" /> Checking…
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" /> Check Payment
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setStatusFormOpen((v) => !v);
                        setModalNotice(null);
                        setModalError(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <Pencil className="w-4 h-4" /> Change Status
                    </button>
                    {detail.status === "PENDING" && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Check re-verifies with Paystack for pending payments
                      </span>
                    )}
                  </div>

                  {/* Status change form */}
                  {statusFormOpen && (
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="text-sm font-semibold text-white">Manually change status</div>
                      <p className="text-xs text-gray-400">
                        Marking as <span className="text-emerald-400 font-semibold">Successful</span>{" "}
                        unlocks the customer&apos;s report / grants their Deep Dive credit and emails
                        them — exactly like a confirmed Paystack payment. Downgrading a successful
                        payment is record-only: access already given is not taken back.
                      </p>
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                            New status
                          </div>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as PaymentStatusValue)}
                            className="bg-[#111318] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                          >
                            {(Object.keys(STATUS_LABELS) as PaymentStatusValue[])
                              .filter((s) => s !== detail.status)
                              .map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="flex-1 min-w-[220px]">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                            Reason (required, kept for audit)
                          </div>
                          <input
                            value={statusReason}
                            onChange={(e) => setStatusReason(e.target.value)}
                            placeholder="e.g. Paystack dashboard shows charge succeeded; webhook never arrived"
                            className="w-full bg-[#111318] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                        <button
                          onClick={handleStatusChange}
                          disabled={savingStatus || statusReason.trim().length < 3}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          {savingStatus ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" /> Saving…
                            </>
                          ) : (
                            "Apply"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
