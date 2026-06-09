"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader,
  X,
  SlidersHorizontal,
  AlertTriangle,
  FileText,
  Activity,
  Flag,
  DollarSign,
} from "lucide-react";
import {
  getReportKpis,
  getReportFunnel,
  getReportProblemAreas,
  getReportBreakdowns,
  getReportSessions,
  downloadReportExcel,
  type ReportFilters,
  type ReportKpisResponse,
  type ReportFunnelStep,
  type ReportProblemArea,
  type ReportBreakdownsResponse,
  type ReportSessionRow,
  type ReportPhase,
  type ReportColorBand,
  type ReportSessionStatus,
} from "@/lib/authClient";

// ── Plain-English labels (the client is non-technical) ─────────
const PHASE_LABELS: Record<ReportPhase, string> = {
  PHASE1: "Free Snapshot",
  PHASE2A: "Full Diagnostic",
  PHASE2B: "Deep Dive",
};

const STATUS_LABELS: Record<ReportSessionStatus, string> = {
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  PAID: "Paid",
  REPORT_GENERATED: "Report ready",
};

const STATUS_COLORS: Record<ReportSessionStatus, string> = {
  IN_PROGRESS: "text-gray-400 bg-white/5",
  COMPLETED: "text-blue-400 bg-blue-500/10",
  PAID: "text-emerald-400 bg-emerald-500/10",
  REPORT_GENERATED: "text-emerald-400 bg-emerald-500/10",
};

const BAND_LABELS: Record<ReportColorBand, string> = {
  RED: "Urgent attention",
  AMBER: "Needs work",
  GREEN: "Healthy",
};

const BAND_DOT: Record<ReportColorBand, string> = {
  RED: "bg-red-500",
  AMBER: "bg-amber-500",
  GREEN: "bg-emerald-500",
};

const BAND_TEXT: Record<ReportColorBand, string> = {
  RED: "text-red-400",
  AMBER: "text-amber-400",
  GREEN: "text-emerald-400",
};

const SIZE_LABELS: Record<string, string> = {
  SMALL: "Small business",
  MEDIUM: "Medium business",
  UNKNOWN: "Not captured",
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

type BreakdownTab = "pillars" | "phases" | "regions" | "industries";

export default function ReportsAnalyticsPage() {
  // ── Filters ───────────────────────────────────────────────────
  const [phase, setPhase] = useState<ReportPhase | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [status, setStatus] = useState<ReportSessionStatus | "">("");
  const [colorBand, setColorBand] = useState<ReportColorBand | "">("");
  const [businessSize, setBusinessSize] = useState<"SMALL" | "MEDIUM" | "">("");
  const [industry, setIndustry] = useState("");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  // Debounced text inputs so we don't refetch on every keystroke.
  const [debouncedCountry, setDebouncedCountry] = useState("");
  const [debouncedState, setDebouncedState] = useState("");
  const [debouncedIndustry, setDebouncedIndustry] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedCountry(country.trim());
      setDebouncedState(stateRegion.trim());
      setDebouncedIndustry(industry.trim());
    }, 450);
    return () => clearTimeout(t);
  }, [country, stateRegion, industry]);

  const filters: ReportFilters = useMemo(
    () => ({
      phase: phase || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      country: debouncedCountry || undefined,
      state: debouncedState || undefined,
      status: status || undefined,
      colorBand: colorBand || undefined,
      businessSize: businessSize || undefined,
      industry: debouncedIndustry || undefined,
    }),
    [phase, dateFrom, dateTo, debouncedCountry, debouncedState, status, colorBand, businessSize, debouncedIndustry]
  );

  const hasFilters = Object.values(filters).some((v) => v !== undefined);

  const clearFilters = () => {
    setPhase("");
    setDateFrom("");
    setDateTo("");
    setCountry("");
    setStateRegion("");
    setStatus("");
    setColorBand("");
    setBusinessSize("");
    setIndustry("");
  };

  // ── Data ──────────────────────────────────────────────────────
  const [kpis, setKpis] = useState<ReportKpisResponse["kpis"] | null>(null);
  const [funnel, setFunnel] = useState<ReportFunnelStep[]>([]);
  const [problemAreas, setProblemAreas] = useState<ReportProblemArea[]>([]);
  const [breakdowns, setBreakdowns] = useState<ReportBreakdownsResponse["breakdowns"] | null>(null);
  const [sessions, setSessions] = useState<ReportSessionRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>("pillars");

  // Everything except the table refetches together when filters change.
  const fetchAggregates = useCallback(async (f: ReportFilters) => {
    setLoading(true);
    setError(null);
    const [k, fu, pa, br] = await Promise.all([
      getReportKpis(f),
      getReportFunnel(f),
      getReportProblemAreas(f),
      getReportBreakdowns(f),
    ]);
    const firstError = k.error || fu.error || pa.error || br.error;
    if (firstError) setError(firstError.message);
    if (k.data) setKpis(k.data.kpis);
    if (fu.data) setFunnel(fu.data.funnel);
    if (pa.data) setProblemAreas(pa.data.problemAreas);
    if (br.data) setBreakdowns(br.data.breakdowns);
    setLoading(false);
  }, []);

  const fetchSessions = useCallback(async (f: ReportFilters, pageIndex: number) => {
    setTableLoading(true);
    const res = await getReportSessions({ ...f, page: pageIndex, pageSize });
    if (res.error) {
      setError(res.error.message);
      setSessions([]);
    } else if (res.data) {
      setSessions(res.data.sessions);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    }
    setTableLoading(false);
  }, []);

  useEffect(() => {
    fetchAggregates(filters);
    fetchSessions(filters, 1);
  }, [filters, fetchAggregates, fetchSessions]);

  // ── Excel export ──────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    const res = await downloadReportExcel(filters);
    if (res.error) {
      setExportError(res.error.message);
    } else if (res.data) {
      const url = URL.createObjectURL(res.data.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  // ── Render helpers ────────────────────────────────────────────
  const selectCls =
    "bg-[#1C1F2E] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50";
  const inputCls =
    "bg-[#1C1F2E] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-36";

  const maxBarValue = (rows: { value: number }[]) =>
    Math.max(1, ...rows.map((r) => r.value));

  const breakdownRows: { label: string; value: number; sub?: string }[] = useMemo(() => {
    if (!breakdowns) return [];
    switch (breakdownTab) {
      case "pillars":
        return breakdowns.byPillar.map((p) => ({
          label: p.pillarName,
          value: p.avgWeightedScore ?? 0,
          sub:
            p.phase2bPurchases > 0
              ? `${p.phase2bPurchases} Deep Dive purchase${p.phase2bPurchases === 1 ? "" : "s"}`
              : undefined,
        }));
      case "phases":
        return breakdowns.byPhase.map((p) => ({
          label: PHASE_LABELS[p.phase],
          value: p.count,
        }));
      case "regions":
        return breakdowns.byRegion.map((r) => ({
          label: r.country,
          value: r.count,
          sub: r.states
            .slice(0, 3)
            .map((s) => `${s.state} (${s.count})`)
            .join(", "),
        }));
      case "industries":
        return breakdowns.byIndustry.map((i) => ({
          label: i.industry,
          value: i.count,
          sub: i.avgScore !== null ? `Avg score ${i.avgScore}` : undefined,
        }));
    }
  }, [breakdowns, breakdownTab]);

  const barMax = maxBarValue(breakdownRows);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports &amp; Analytics</h1>
          <p className="text-gray-400 text-sm">
            Live assessment data. The Excel download matches whatever filters are active below.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {exporting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Preparing your file…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download Excel
              </>
            )}
          </button>
          {exportError && (
            <span className="text-xs text-red-400">{exportError}</span>
          )}
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Assessment type
            </div>
            <select value={phase} onChange={(e) => setPhase(e.target.value as ReportPhase | "")} className={selectCls}>
              <option value="">All types</option>
              <option value="PHASE1">Free Snapshot</option>
              <option value="PHASE2A">Full Diagnostic</option>
              <option value="PHASE2B">Deep Dive</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">From</div>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectCls} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">To</div>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectCls} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Country</div>
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Nigeria" className={inputCls} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">State / Region</div>
            <input value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} placeholder="e.g. Lagos" className={inputCls} />
          </div>
          <button
            onClick={() => setMoreFiltersOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            More filters
            <ChevronDown className={`w-4 h-4 transition-transform ${moreFiltersOpen ? "rotate-180" : ""}`} />
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" /> Clear all
            </button>
          )}
        </div>

        {moreFiltersOpen && (
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-white/5">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Status</div>
              <select value={status} onChange={(e) => setStatus(e.target.value as ReportSessionStatus | "")} className={selectCls}>
                <option value="">All statuses</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="PAID">Paid</option>
                <option value="REPORT_GENERATED">Report ready</option>
              </select>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Overall result</div>
              <select value={colorBand} onChange={(e) => setColorBand(e.target.value as ReportColorBand | "")} className={selectCls}>
                <option value="">All results</option>
                <option value="GREEN">Healthy (green)</option>
                <option value="AMBER">Needs work (amber)</option>
                <option value="RED">Urgent attention (red)</option>
              </select>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Business size</div>
              <select value={businessSize} onChange={(e) => setBusinessSize(e.target.value as "SMALL" | "MEDIUM" | "")} className={selectCls}>
                <option value="">All sizes</option>
                <option value="SMALL">Small business</option>
                <option value="MEDIUM">Medium business</option>
              </select>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Industry</div>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Retail" className={inputCls} />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI banner ───────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#111318]/65" />
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Assessments</div>
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {loading && !kpis ? "—" : (kpis?.totalAssessments ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              {kpis?.assessmentsByPhase
                .map((p) => `${PHASE_LABELS[p.phase]}: ${p.count}`)
                .join(" · ") || ""}
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Average score</div>
              <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {loading && !kpis ? "—" : kpis?.avgTotalScore ?? "No data"}
            </div>
            {kpis?.avgTotalScore !== null && kpis?.avgTotalScore !== undefined && (
              <div className="h-1 w-full bg-white/10 rounded-full">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, kpis.avgTotalScore)}%` }}
                />
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">High-risk businesses</div>
              <Flag className="w-4 h-4 text-red-400 flex-shrink-0" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {loading && !kpis ? "—" : kpis?.highRiskPct !== null && kpis?.highRiskPct !== undefined ? `${kpis.highRiskPct}%` : "No data"}
            </div>
            <div className="text-xs text-gray-400">of completed assessments</div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Revenue</div>
              <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {loading && !kpis ? "—" : formatNaira(kpis?.revenue.total ?? 0)}
            </div>
            <div className="text-xs text-gray-400">
              {kpis
                ? `Full Diagnostic ${formatNaira(kpis.revenue.phase2a)} · Deep Dives ${formatNaira(kpis.revenue.phase2b)}`
                : ""}
            </div>
          </div>
        </div>
      </div>

      {/* ── Funnel strip ─────────────────────────────────────── */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
        <h2 className="text-sm font-bold text-white mb-4">Where users drop off</h2>
        {loading && funnel.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <Loader className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {funnel.map((step, i) => (
              <div key={step.key} className="relative bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 leading-tight min-h-[28px]">
                  {step.label}
                </div>
                <div className="text-2xl font-bold text-white">{step.count.toLocaleString()}</div>
                {i > 0 && (
                  <div
                    className={`text-xs font-semibold mt-1 ${
                      step.pctOfPrevious !== null && step.pctOfPrevious < 50 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {step.pctOfPrevious !== null ? `${step.pctOfPrevious}% of previous step` : "—"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Problem areas + Breakdowns ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Problem Areas */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
          <h2 className="text-sm font-bold text-white mb-4">Common problem areas</h2>
          {loading && problemAreas.length === 0 ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <Loader className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : problemAreas.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No risk findings match the current filters.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {problemAreas.map((area) => (
                <div
                  key={`${area.questionId}-${area.optionLabel}`}
                  className="flex items-start justify-between gap-4 bg-white/[0.03] border border-white/5 rounded-xl p-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{area.observation}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {area.pillarName}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{area.questionText}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mb-1.5 ${
                        area.riskType === "KNOCKOUT"
                          ? "text-red-400 bg-red-500/10"
                          : "text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {area.riskType === "KNOCKOUT" ? "High-risk" : "Risk"}
                    </span>
                    <div className="text-sm font-bold text-white">{area.affectedBusinesses}</div>
                    <div className="text-[10px] text-gray-500">businesses</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakdowns */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-white">Breakdowns</h2>
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
              {(
                [
                  ["pillars", "Pillars"],
                  ["phases", "Phases"],
                  ["regions", "Regions"],
                  ["industries", "Industries"],
                ] as [BreakdownTab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setBreakdownTab(key)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    breakdownTab === key ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {loading && !breakdowns ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <Loader className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : breakdownRows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No data matches the current filters.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {breakdownRows.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300 truncate">{row.label}</span>
                    <span className="text-white font-semibold ml-3">
                      {breakdownTab === "pillars" ? (row.value > 0 ? row.value : "No data") : row.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${Math.max(2, (row.value / (breakdownTab === "pillars" ? 100 : barMax)) * 100)}%`,
                      }}
                    />
                  </div>
                  {row.sub && <div className="text-[11px] text-gray-500 mt-1">{row.sub}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Assessments table ────────────────────────────────── */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          <h2 className="text-sm font-bold text-white">Assessments</h2>
          {tableLoading && <Loader className="w-4 h-4 animate-spin text-gray-500" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["BUSINESS", "TYPE", "DATE", "PILLAR HEALTH", "SCORE", "STATUS", "REPORT"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && !tableLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                    No assessments match the current filters.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-white">{session.businessName || "—"}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{session.email || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 whitespace-nowrap">
                        {PHASE_LABELS[session.phase]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{formatDate(session.completedAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {session.pillarBands.map((band, i) => (
                          <div
                            key={i}
                            title={`${band.pillarName}${band.weightedScore !== null ? `: ${band.weightedScore}` : ": not assessed"}`}
                            className={`w-4 h-4 rounded-sm ${band.colorBand ? BAND_DOT[band.colorBand] : "bg-gray-700"}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {session.totalScore !== null ? (
                        <div className="whitespace-nowrap">
                          <span className="text-sm font-bold text-white">{session.totalScore}</span>
                          {session.overallBand && (
                            <span className={`text-xs font-semibold ml-2 ${BAND_TEXT[session.overallBand]}`}>
                              {BAND_LABELS[session.overallBand]}
                            </span>
                          )}
                          {session.hasAnyKnockout && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded ml-2">
                              High-risk
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[session.status]}`}>
                        {STATUS_LABELS[session.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {session.reportPdfUrl ? (
                        <a
                          href={session.reportPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Download PDF report"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
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
              ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()} assessments`
              : "No assessments"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchSessions(filters, page - 1)}
              disabled={page <= 1 || tableLoading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchSessions(filters, page + 1)}
              disabled={page >= totalPages || tableLoading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
