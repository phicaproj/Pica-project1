"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowRight,
  Download,
  Target,
  Sparkles,
  Shield,
  Radar,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { getAccessToken } from "@/lib/authClient";
import { motion } from "framer-motion";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://pica-project1.onrender.com/api";

type ColorBand = "RED" | "AMBER" | "GREEN";

interface Finding {
  optionId: string;
  questionText: string;
  selectedLabel: string;
  observation: string;
  recommendation: string;
  riskType: string;
  score: number;
}

interface PillarMeta {
  id: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

interface PillarScore {
  id: string;
  pillarId: string;
  rawScore: number;
  maxPossibleScore: number;
  weightedScore: number;
  hasKnockout: boolean;
  colorBand: ColorBand;
  insightRuleApplied: string;
  findings: Finding[];
  pillar: PillarMeta;
}

interface ResultPayload {
  id: string;
  sessionId: string;
  totalScore: number;
  colorBand: ColorBand;
  hasAnyKnockout: boolean;
  knockoutQuestionIds: string[];
  insightPayload: unknown;
  reportPdfUrl: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  pillarScores: PillarScore[];
}

interface GetResultResponse {
  message: string;
  paywalled: boolean;
  result: ResultPayload;
}

const COLOR_BAND_TO_STATUS: Record<
  ColorBand,
  { label: string; bar: string; pill: string }
> = {
  GREEN: {
    label: "Optimized",
    bar: "bg-emerald-400",
    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  },
  AMBER: {
    label: "Active",
    bar: "bg-amber-400",
    pill: "bg-amber-500/15 text-amber-300 border-amber-400/20",
  },
  RED: {
    label: "Attention",
    bar: "bg-rose-400",
    pill: "bg-rose-500/15 text-rose-300 border-rose-400/20",
  },
};

const COLOR_BAND_TO_RING: Record<ColorBand, string> = {
  GREEN: "from-emerald-400 to-teal-300",
  AMBER: "from-amber-400 to-orange-300",
  RED: "from-rose-400 to-orange-300",
};

function normalizeColorBand(value: unknown): ColorBand {
  if (typeof value !== "string") return "AMBER";
  const normalized = value.trim().toUpperCase();
  if (normalized === "GREEN" || normalized === "AMBER" || normalized === "RED") {
    return normalized;
  }
  if (normalized === "YELLOW") return "AMBER";
  return "AMBER";
}

function formatRelativeTime(iso: string | null) {
  if (!iso) return "Recently updated";
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return "Recently updated";
  const diffMinutes = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (diffMinutes < 60) {
    return `Last updated ${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Last updated ${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `Last updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function isResultResponse(value: unknown): value is GetResultResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    message?: unknown;
    paywalled?: unknown;
    result?: { pillarScores?: unknown; totalScore?: unknown } | null;
  };

  return (
    typeof candidate.message === "string" &&
    typeof candidate.paywalled === "boolean" &&
    !!candidate.result &&
    typeof candidate.result.totalScore === "number" &&
    Array.isArray(candidate.result.pillarScores)
  );
}

async function authFetch(path: string, init?: RequestInit) {
  const token = getAccessToken();
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<GetResultResponse | null>(null);

  const loadResult = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/result/${id}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to load diagnostic result");
      }

      if (!isResultResponse(data)) {
        throw new Error("Diagnostic result payload is incomplete.");
      }

      setResultData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadResult();
    }
  }, [id, loadResult]);

  const handleDownloadPdf = useCallback(async () => {
    if (!resultData) return;
    if (resultData.paywalled) {
      const sid = resultData.result.sessionId || id;
      router.push(`/dashboard/subscription?sessionId=${sid}&autoCheckout=1`);
      return;
    }
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const sid = resultData.result.sessionId || id;
      const res = await fetch(`${API_BASE}/result/${sid}/pdf`, { headers });
      if (!res.ok) {
        if (res.status === 402 || res.status === 403) {
          router.push(`/dashboard/subscription?sessionId=${sid}&autoCheckout=1`);
          return;
        }
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to download report");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dispo = res.headers.get("Content-Disposition") || "";
      const match = /filename="?([^"]+)"?/.exec(dispo);
      a.download = match?.[1] || `pica-report-${sid}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download report");
    }
  }, [resultData, router, id]);

  const handleDeepDive = useCallback(() => {
    router.push("/dashboard/deep-dive");
  }, [router]);

  const handleStartAnotherScan = useCallback(() => {
    router.push("/dashboard/strategic-scan");
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader className="w-7 h-7 animate-spin text-teal-400" />
          <p className="text-sm">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-red-400 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 mb-2" />
          <h2 className="text-xl font-bold">Failed to load report</h2>
          <p className="text-sm text-gray-400">{error || "Report not found."}</p>
          <Link
            href="/dashboard/reports"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm transition"
          >
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const { result, paywalled } = resultData;
  const pillarScores = result.pillarScores
    .slice()
    .sort((a, b) => a.pillar.displayOrder - b.pillar.displayOrder);
  const totalScore = Math.round(result.totalScore);
  const weakestPillar = pillarScores
    .slice()
    .sort((a, b) => a.weightedScore - b.weightedScore)[0];
  const headlineFinding =
    weakestPillar?.findings.find((item) => item.observation || item.recommendation) ??
    weakestPillar?.findings[0] ??
    null;
  const ringGradient = COLOR_BAND_TO_RING[normalizeColorBand(result.colorBand)];
  const updatedLabel = formatRelativeTime(
    result.generatedAt || result.updatedAt || result.createdAt,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-full pb-20"
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
        <Link href="/dashboard/reports" className="hover:text-teal-400 transition">Reports</Link>
        <span>/</span>
        <span className="text-teal-400">Diagnostic Complete</span>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0e2b2b] via-[#111827] to-[#19132b]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_36%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_34%)]" />
        <div className="relative z-10 grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[280px,1fr] lg:items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="flex justify-center"
          >
            <div
              className={`relative flex h-44 w-44 flex-col items-center justify-center rounded-full border border-white/10 bg-[#07141b]/80 shadow-[0_0_40px_rgba(20,184,166,0.18)]`}
            >
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${ringGradient} opacity-20 blur-md`}
              />
              <div className="absolute inset-[10px] rounded-full border-[6px] border-teal-300/90" />
              <p className="relative text-5xl font-black text-white">{totalScore}%</p>
              <p className="relative mt-1 text-[11px] font-bold uppercase tracking-[0.28em] text-teal-200">
                Complete
              </p>
            </div>
          </motion.div>

          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-extrabold text-white md:text-5xl"
            >
              Diagnostic <span className="text-orange-400">Complete.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 md:text-base"
            >
              Your strategic scan has been synthesized into a live performance snapshot.
              Review the health markers below, then unlock your full report for PDF download
              and email delivery.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex flex-wrap gap-3"
            >
              <button
                onClick={handleDeepDive}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <Target className="h-4 w-4" />
                Deep Dive Into Operations
              </button>
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </motion.div>

            {paywalled && (
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-orange-300">
                PDF and emailed report unlock after subscription.
              </p>
            )}
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-3xl border border-teal-500/30 bg-[#101c23] px-6 py-6 shadow-[0_0_30px_rgba(13,148,136,0.08)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-500/15">
              <Sparkles className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Pulse Insight</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-300">
                {headlineFinding
                  ? `"${headlineFinding.observation || headlineFinding.recommendation}"`
                  : "We detected performance signals across your operating model. Unlock the full report to review detailed findings and recommended actions."}
              </p>
              {weakestPillar && (
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-teal-300">
                  Focus area: {weakestPillar.pillar.name}
                </p>
              )}
            </div>
          </div>
          <Shield className="hidden h-10 w-10 text-white/20 lg:block" />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Pillar Breakdown</h2>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{updatedLabel}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {pillarScores.map((pillarScore, idx) => {
            const band = normalizeColorBand(pillarScore.colorBand);
            const status = COLOR_BAND_TO_STATUS[band];
            const score = Math.round(pillarScore.weightedScore);
            return (
              <motion.div
                key={pillarScore.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className={`rounded-2xl border bg-[#0f1722] p-5 transition hover:-translate-y-1 hover:shadow-lg ${
                  band === "RED"
                    ? "border-rose-400/30 shadow-[0_0_30px_rgba(244,63,94,0.08)]"
                    : "border-white/5"
                }`}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <Radar className="h-4 w-4 text-gray-400" />
                  <span
                    className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${status.pill}`}
                  >
                    {status.label}
                  </span>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">
                  {pillarScore.pillar.name}
                </p>
                <p className="mt-3 text-4xl font-black text-white">
                  {score}
                  <span className="ml-1 text-lg text-gray-500">%</span>
                </p>
                <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, delay: 0.8 + idx * 0.1 }}
                    className={`h-full rounded-full ${status.bar}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-3xl border border-white/5 bg-[#0f1722] px-6 py-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Ready for the full report?</p>
              <p className="text-xs text-gray-500">
                Subscribe to unlock the downloadable PDF and email delivery, or start a fresh scan.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleStartAnotherScan}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Start Another Scan
            </button>
            <Link
              href={`/dashboard/subscription?sessionId=${id}&autoCheckout=1`}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Unlock Full Report
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
