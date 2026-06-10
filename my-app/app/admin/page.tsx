"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  CheckSquare,
  HeartPulse,
  FileText,
  DollarSign,
  AlertCircle,
  Loader,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import {
  getReportKpis,
  getReportBreakdowns,
  getReportSessions,
  getAllUsers,
  getAdminPaymentStats,
  type ReportKpisResponse,
  type ReportBreakdownsResponse,
  type ReportSessionRow,
  type AdminPaymentStats,
  type ReportColorBand,
} from "@/lib/authClient";

// ── Formatting helpers (client is non-technical, NGN-first) ───────
const formatNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatNumber = (n: number) => n.toLocaleString("en-NG");

const formatRelative = (iso: string | null) => {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const BAND_DOT: Record<ReportColorBand, string> = {
  RED: "bg-red-500",
  AMBER: "bg-amber-500",
  GREEN: "bg-emerald-500",
};

const PHASE_LABELS: Record<string, string> = {
  PHASE1: "Free Snapshot",
  PHASE2A: "Full Diagnostic",
  PHASE2B: "Deep Dive",
};

const CATEGORY_COLORS = [
  "bg-indigo-400",
  "bg-emerald-400",
  "bg-orange-400",
  "bg-sky-400",
  "bg-pink-400",
  "bg-gray-400",
];

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<ReportKpisResponse["kpis"] | null>(null);
  const [breakdowns, setBreakdowns] =
    useState<ReportBreakdownsResponse["breakdowns"] | null>(null);
  const [recent, setRecent] = useState<ReportSessionRow[]>([]);
  const [paymentStats, setPaymentStats] = useState<AdminPaymentStats | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [k, br, sess, pay, usr] = await Promise.all([
      getReportKpis(),
      getReportBreakdowns(),
      getReportSessions({ page: 1, pageSize: 5 }),
      getAdminPaymentStats(),
      getAllUsers({ role: "USER", pageSize: 1 }),
    ]);

    const firstError = k.error || br.error || sess.error || pay.error || usr.error;
    if (firstError) setError(firstError.message);

    if (k.data) setKpis(k.data.kpis);
    if (br.data) setBreakdowns(br.data.breakdowns);
    if (sess.data) setRecent(sess.data.sessions);
    if (pay.data) setPaymentStats(pay.data.stats);
    if (usr.data) setTotalUsers(usr.data.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        <Loader className="w-6 h-6 animate-spin mr-3" />
        Loading dashboard…
      </div>
    );
  }

  // ── Derived display values from real data ──────────────────────
  const avgScore = kpis?.avgTotalScore ?? null;
  const highRiskPct = kpis?.highRiskPct ?? null;
  const totalAssessments = kpis?.totalAssessments ?? 0;
  const revenue = kpis?.revenue;

  // Paid reports = paid sessions across phases (revenue split is a good proxy
  // when a count isn't directly available; we surface the phase 2A/2B counts
  // from breakdowns.byPhase as the "engagement by phase" donut instead).
  const byPhase = breakdowns?.byPhase ?? [];
  const phaseTotal = byPhase.reduce((s, p) => s + p.count, 0);

  // Assessment categories come from per-pillar Phase 2B purchases (real demand
  // signal). Sorted desc, top 5, bars scaled to the leader.
  const pillarRows = (breakdowns?.byPillar ?? [])
    .slice()
    .sort((a, b) => b.phase2bPurchases - a.phase2bPurchases)
    .slice(0, 5);
  const pillarMax = Math.max(1, ...pillarRows.map((p) => p.phase2bPurchases));

  const monthly = paymentStats?.monthlyRevenue ?? [];
  const revenueMax = Math.max(1, ...monthly.map((m) => m.amount));

  const growthPct = paymentStats?.revenueGrowthPct ?? null;

  const DONUT_COLORS = ["#3B82F6", "#10B981", "#F59E0B"];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={load}
            className="ml-auto text-xs font-semibold uppercase tracking-wider hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Users"
          icon={<Users className="text-white/10 w-10 h-10 absolute right-4 top-4" />}
          value={totalUsers !== null ? formatNumber(totalUsers) : "—"}
          sub="Registered businesses"
        />

        <StatCard
          label="Total Revenue"
          icon={<DollarSign className="text-white/10 w-10 h-10 absolute right-4 top-4" />}
          value={revenue ? formatNaira(revenue.total) : "—"}
          growth={growthPct}
          growthSuffix="vs last month"
        />

        <StatCard
          label="Assessments Taken"
          icon={<CheckSquare className="text-white/10 w-10 h-10 absolute right-4 top-4" />}
          value={formatNumber(totalAssessments)}
          sub="All phases"
        />

        <div className="bg-[#1C1F2E] rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Avg Health Score
            </h3>
            <HeartPulse className="text-white/10 w-10 h-10 absolute right-4 top-4" />
          </div>
          <div className="text-3xl font-bold text-orange-400 mb-3">
            {avgScore !== null ? avgScore.toFixed(1) : "—"}
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 flex overflow-hidden">
            <div
              className="bg-orange-400 h-full rounded-full"
              style={{ width: `${avgScore !== null ? Math.min(100, avgScore) : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Middle Row: Revenue + Phase mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview Chart */}
        <div className="bg-[#1C1F2E] rounded-2xl p-6 border border-white/5 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Revenue Overview</h2>
              <p className="text-sm text-gray-400">
                Settled payments over the last {monthly.length || 0} months.
              </p>
            </div>
            {revenue && (
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider">This month</div>
                <div className="text-lg font-bold text-white">
                  {formatNaira(paymentStats?.revenueThisMonth ?? 0)}
                </div>
              </div>
            )}
          </div>

          {monthly.length === 0 ? (
            <EmptyState label="No revenue recorded yet." />
          ) : (
            <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-auto pb-6 relative">
              {monthly.map((m, i) => {
                const h = `${Math.max(4, (m.amount / revenueMax) * 100)}%`;
                const isPeak = m.amount === revenueMax && m.amount > 0;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="w-full relative flex justify-center h-[180px] items-end">
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2A2E3D] text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                        {formatNaira(m.amount)}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#2A2E3D]"></div>
                      </div>
                      <div
                        className={`w-full max-w-[32px] rounded-t-sm transition-all duration-300 ${
                          isPeak ? "bg-blue-500" : "bg-[#3A3F58] group-hover:bg-[#4A506E]"
                        }`}
                        style={{ height: h }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500 mt-3">
                      {m.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Phase mix donut */}
        <div className="bg-[#1C1F2E] rounded-2xl p-6 border border-white/5 flex flex-col items-center">
          <div className="w-full flex justify-start mb-6">
            <h2 className="text-lg font-semibold text-white">Assessment Mix</h2>
          </div>

          {phaseTotal === 0 ? (
            <EmptyState label="No assessments yet." />
          ) : (
            <>
              <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#2A2E3D"
                    strokeWidth="12"
                  />
                  {(() => {
                    const circ = 251.2;
                    let offsetAcc = 0;
                    return byPhase.map((p, i) => {
                      const frac = p.count / phaseTotal;
                      const dash = `${frac * circ} ${circ}`;
                      const seg = (
                        <circle
                          key={p.phase}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                          strokeWidth="12"
                          strokeDasharray={dash}
                          strokeDashoffset={-offsetAcc * circ}
                          className="transition-all duration-700 ease-out"
                        />
                      );
                      offsetAcc += frac;
                      return seg;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {formatNumber(phaseTotal)}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 tracking-wider uppercase mt-1">
                    Total
                  </span>
                </div>
              </div>

              <div className="w-full space-y-3 mt-auto">
                {byPhase.map((p, i) => (
                  <div key={p.phase} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      ></span>
                      <span className="text-gray-300">
                        {PHASE_LABELS[p.phase] ?? p.phase}
                      </span>
                    </div>
                    <span className="text-white font-semibold">
                      {Math.round((p.count / phaseTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Third Row: Pillar demand & Recent sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pillar demand */}
        <div className="bg-[#1C1F2E] rounded-2xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-semibold text-white">Deep Dive Demand by Pillar</h2>
            <Link
              href="/admin/reports"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-wider"
            >
              View reports
            </Link>
          </div>

          {pillarRows.length === 0 ? (
            <EmptyState label="No Deep Dive purchases yet." />
          ) : (
            <div className="space-y-6">
              {pillarRows.map((cat, i) => (
                <div key={cat.pillarId}>
                  <div className="flex justify-between items-end mb-2 text-sm">
                    <span className="text-gray-200">{cat.pillarName}</span>
                    <span className="text-gray-400 text-xs">
                      {formatNumber(cat.phase2bPurchases)} purchased
                    </span>
                  </div>
                  <div className="w-full bg-[#2A2E3D] rounded-full h-1.5">
                    <div
                      className={`${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} h-1.5 rounded-full transition-all`}
                      style={{ width: `${(cat.phase2bPurchases / pillarMax) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1C1F2E] rounded-2xl p-6 border border-white/5 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6">Recent Assessments</h2>

          {recent.length === 0 ? (
            <EmptyState label="No recent assessments." />
          ) : (
            <div className="space-y-5 flex-1">
              {recent.map((s) => {
                const isHighRisk = s.overallBand === "RED" || s.hasAnyKnockout;
                return (
                  <div key={s.id} className="flex gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                        isHighRisk ? "bg-red-500/10" : "bg-blue-500/10"
                      }`}
                    >
                      {isHighRisk ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-white mb-1 truncate">
                        {s.businessName || s.email || "Unknown business"}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Completed{" "}
                        <span className="text-gray-300">
                          {PHASE_LABELS[s.phase] ?? s.phase}
                        </span>
                        {s.totalScore !== null && (
                          <>
                            {" "}with a score of{" "}
                            <span className="text-gray-300 font-semibold">
                              {Math.round(s.totalScore)}/100
                            </span>
                          </>
                        )}
                        .
                      </p>
                      <div className="flex items-center mt-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                        {s.overallBand && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-2 ${BAND_DOT[s.overallBand]}`}
                          ></span>
                        )}
                        {formatRelative(s.completedAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href="/admin/reports"
            className="w-full mt-6 py-2.5 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-gray-300 uppercase tracking-wider transition-colors text-center"
          >
            View All Sessions
          </Link>
        </div>
      </div>

      {/* Bottom Mini Cards — real operational metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 pb-12">
        <MiniCard
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          tint="bg-red-500/20 border-red-500/20"
          label="High-Risk Rate"
          value={highRiskPct !== null ? `${highRiskPct.toFixed(1)}%` : "—"}
          sub="Of completed assessments"
        />

        <MiniCard
          icon={<Clock className="w-5 h-5 text-orange-400" />}
          tint="bg-orange-500/20 border-orange-500/20"
          label="Pending Payments"
          value={
            paymentStats
              ? `${formatNumber(paymentStats.pendingCount)} pending`
              : "—"
          }
          sub={
            paymentStats ? formatNaira(paymentStats.pendingAmount) + " awaiting" : undefined
          }
        />

        <MiniCard
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
          tint="bg-emerald-500/20 border-emerald-500/20"
          label="Payment Success Rate"
          value={
            paymentStats?.successRatePct !== null && paymentStats?.successRatePct !== undefined
              ? `${paymentStats.successRatePct.toFixed(1)}%`
              : "—"
          }
          sub="Of all attempts"
        />
      </div>
    </div>
  );
}

// ── Presentational helpers ────────────────────────────────────────

function StatCard({
  label,
  icon,
  value,
  sub,
  growth,
  growthSuffix,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  sub?: string;
  growth?: number | null;
  growthSuffix?: string;
}) {
  const showGrowth = growth !== undefined && growth !== null;
  const positive = (growth ?? 0) >= 0;
  return (
    <div className="bg-[#1C1F2E] rounded-xl p-5 border border-white/5 relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</h3>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      {showGrowth ? (
        <div className="flex items-center text-xs">
          <span
            className={`font-medium flex items-center ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {positive ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(growth as number).toFixed(1)}%
          </span>
          <span className="text-gray-500 ml-2 uppercase text-[10px] font-semibold">
            {growthSuffix}
          </span>
        </div>
      ) : (
        sub && (
          <div className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
            {sub}
          </div>
        )
      )}
    </div>
  );
}

function MiniCard({
  icon,
  tint,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#212435] rounded-xl p-4 flex items-center gap-4 border border-white/5">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${tint}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </div>
        <div className="text-lg font-bold text-white leading-none">{value}</div>
        {sub && <div className="text-[10px] text-gray-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-gray-500 py-12">
      {label}
    </div>
  );
}
