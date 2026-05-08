"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Download,
  Loader,
  Radar,
  Shield,
  Sparkles,
  Target,
  Save,
} from "lucide-react";
import { getAccessToken, setLastSessionId } from "@/lib/authClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://pica-project1.onrender.com/api";

type ScanState = "landing" | "questions" | "processing" | "result";

type ColorBand = "RED" | "YELLOW" | "GREEN";

interface QuestionOption {
  id: string;
  optionLabel: string;
  optionText: string;
  displayOrder: number;
}

interface Phase2AQuestion {
  id: string;
  questionCode: string;
  questionText: string;
  displayOrder: number;
  answered: boolean;
  selectedOptionId: string | null;
  options: QuestionOption[];
}

interface Phase2APillar {
  id: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  questions: Phase2AQuestion[];
}

interface FlatQuestion {
  question: Phase2AQuestion;
}

interface PillarMeta {
  id: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

interface Finding {
  optionId: string;
  questionText: string;
  selectedLabel: string;
  observation: string;
  recommendation: string;
  riskType: string;
  score: number;
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
  YELLOW: {
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
  YELLOW: "from-amber-400 to-orange-300",
  RED: "from-rose-400 to-orange-300",
};

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

async function authFetch(path: string, init?: RequestInit) {
  const token = getAccessToken();
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

function flattenPillars(pillars: Phase2APillar[]): FlatQuestion[] {
  const flat: FlatQuestion[] = [];
  pillars
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .forEach((pillar) => {
      pillar.questions
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .forEach((question) => {
          flat.push({ question });
        });
    });
  return flat;
}

// ─── Landing State ──────────────────────────────────────────────────────────
function LandingState({
  onStart,
  loading,
  error,
}: {
  onStart: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-8 max-w-full">
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-8 p-6 md:p-10">
          <div className="flex-1 min-w-0">
            <span className="inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider mb-6">
              System Ready
            </span>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Initiate Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Strategic
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-yellow-400 to-teal-400 bg-clip-text text-transparent">
                Scan.
              </span>
            </h1>

            <p className="text-gray-400 text-sm md:text-base max-w-lg mb-8">
              Unfold the mathematical architecture of your business through a guided diagnostic.
              Your progress is saved automatically, so you can leave any time and resume right
              where you stopped.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {[
                "Guided assessment flow",
                "Auto-save enabled",
                "Secure session tracking",
              ].map((item) => (
                <div
                  key={item}
                  className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-gray-300"
                >
                  {item}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6">
              <button
                onClick={onStart}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition shadow-lg shadow-orange-500/20"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Preparing Scan...
                  </>
                ) : (
                  <>
                    Start New Scan
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 uppercase tracking-widest">
                Resume is available whenever you return.
              </p>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center gap-4 w-72">
            <div className="rounded-xl bg-[#0d1117] border border-teal-500/20 px-4 py-2 flex items-center gap-2 self-end">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-300 font-mono">CORE_OS V.4.2</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#0f1a2e] to-[#0d1117] border border-teal-500/10 p-6 w-full">
              <div className="w-24 h-24 rounded-2xl border-2 border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-4">
                <Radar className="w-10 h-10 text-teal-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Neural Link Active</h4>
              <p className="text-xs text-gray-500 text-center">
                Save-and-continue is enabled. Your answers persist across sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Questions State ────────────────────────────────────────────────────────
function QuestionsState({
  flat,
  currentIndex,
  selectedOptionId,
  saving,
  submitting,
  error,
  onSelect,
  onPrev,
  onNext,
  onSaveAndExit,
}: {
  flat: FlatQuestion[];
  currentIndex: number;
  selectedOptionId: string | null;
  saving: boolean;
  submitting: boolean;
  error: string | null;
  onSelect: (optionId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSaveAndExit: () => void;
}) {
  const total = flat.length;
  const current = flat[currentIndex];
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const isLast = currentIndex === total - 1;

  if (!current) return null;

  return (
    <div className="space-y-6 max-w-full">
      <div className="rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 p-6 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-1">
              Strategic Scan
            </p>
            <p className="text-xl font-bold text-white">Assessment in progress</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Progress
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-bold text-orange-400">
                {Math.round(progress)}%
              </span>{" "}
              complete
            </p>
          </div>
        </div>

        <div className="h-1 rounded-full bg-white/10 mb-8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-teal-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-8">
          {current.question.questionText}
        </h2>

        <div className="space-y-3 mb-8">
          {current.question.options
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  disabled={saving || submitting}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition disabled:cursor-not-allowed ${
                    isSelected
                      ? "border-teal-400 bg-teal-400/10"
                      : "border-white/10 bg-[#161b22] hover:border-white/20"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isSelected ? "bg-teal-400 text-gray-900" : "bg-[#243044] text-gray-400"
                    }`}
                  >
                    {opt.optionLabel}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-white font-bold" : "text-gray-300"
                    }`}
                  >
                    {opt.optionText}
                  </span>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-teal-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              );
            })}
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0 || saving || submitting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-white/10 text-white hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={onSaveAndExit}
            disabled={saving || submitting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-white/10 text-gray-300 hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Save &amp; Exit
          </button>

          <button
            onClick={onNext}
            disabled={!selectedOptionId || saving || submitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition ${
              selectedOptionId && !saving && !submitting
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-orange-500/40 text-gray-300 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : isLast ? (
              <>
                Submit Assessment <CheckCircle className="w-4 h-4" />
              </>
            ) : (
              <>
                Next Question <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Processing State ───────────────────────────────────────────────────────
function ProcessingState() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 0.5));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-full">
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0a1628] via-[#0d1117] to-[#0d1117] border border-white/5 overflow-hidden min-h-[60vh] flex flex-col items-center justify-center p-6 md:p-10">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="relative w-48 h-48 md:w-56 md:h-56">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-teal-500/20 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-teal-900/50 via-blue-900/50 to-purple-900/50 border border-teal-500/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400/30 to-blue-500/30 flex items-center justify-center">
                <Radar className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-teal-400 uppercase tracking-widest mt-2 font-mono">
            Synthesizing Diagnostic
          </p>
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Strategic Scan</h2>
          <p className="text-gray-400 text-sm mb-6">
            Routing you to the next step...
          </p>
          <div className="h-2 rounded-full bg-white/5 mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-teal-300 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-mono">PROCESSING</span>
            <span className="text-teal-400 font-mono">{progress.toFixed(0)}% COMPLETE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultState({
  data,
  onDownloadPdf,
  onDeepDive,
  onStartAnotherScan,
}: {
  data: GetResultResponse;
  onDownloadPdf: () => void;
  onDeepDive: () => void;
  onStartAnotherScan: () => void;
}) {
  const { result, paywalled } = data;
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
  const ringGradient = COLOR_BAND_TO_RING[result.colorBand];
  const updatedLabel = formatRelativeTime(
    result.generatedAt || result.updatedAt || result.createdAt,
  );

  return (
    <div className="space-y-6 max-w-full">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0e2b2b] via-[#111827] to-[#19132b]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_36%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_34%)]" />
        <div className="relative z-10 grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[280px,1fr] lg:items-center">
          <div className="flex justify-center">
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
          </div>

          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold text-white md:text-5xl">
              Diagnostic <span className="text-orange-400">Complete.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 md:text-base">
              Your strategic scan has been synthesized into a live performance snapshot.
              Review the health markers below, then unlock your full report for PDF download
              and email delivery.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onDeepDive}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <Target className="h-4 w-4" />
                Deep Dive Into Operations
              </button>
              <button
                onClick={onDownloadPdf}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>

            {paywalled && (
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-orange-300">
                PDF and emailed report unlock after subscription.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-teal-500/30 bg-[#101c23] px-6 py-6 shadow-[0_0_30px_rgba(13,148,136,0.08)]">
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
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Pillar Breakdown</h2>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{updatedLabel}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {pillarScores.map((pillarScore) => {
            const status = COLOR_BAND_TO_STATUS[pillarScore.colorBand];
            const score = Math.round(pillarScore.weightedScore);
            return (
              <div
                key={pillarScore.id}
                className={`rounded-2xl border bg-[#0f1722] p-5 transition ${
                  pillarScore.colorBand === "RED"
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
                <div className="mt-4 h-1.5 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${status.bar}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-[#0f1722] px-6 py-5">
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
              onClick={onStartAnotherScan}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Start Another Scan
            </button>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Unlock Full Report
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function StrategicScanPage() {
  const router = useRouter();
  const [scanState, setScanState] = useState<ScanState>("landing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pillars, setPillars] = useState<Phase2APillar[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<GetResultResponse | null>(null);

  const flat = useMemo(() => flattenPillars(pillars), [pillars]);

  const loadResult = useCallback(async (id: string) => {
    const res = await authFetch(`/result/${id}`);
    const data = await res.json().catch(() => ({}));

    if (res.status === 409) {
      return { status: 409 as const, data: null };
    }

    if (!res.ok) {
      throw new Error(data.message || "Failed to load diagnostic result");
    }

    if (!isResultResponse(data)) {
      throw new Error("Diagnostic result payload is incomplete.");
    }

    return { status: 200 as const, data };
  }, []);

  const waitForResult = useCallback(
    async (id: string) => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const response = await loadResult(id);
        if (response.status === 200 && response.data) {
          return response.data;
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 1200);
        });
      }
      throw new Error("Your diagnostic is still processing. Please reopen Strategic Scan shortly.");
    },
    [loadResult],
  );

  const loadQuestions = useCallback(async (id: string) => {
    const res = await authFetch(`/questions/phase2a?sessionId=${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Failed to load Phase 2A questions");
    }

    const loadedPillars = (data.pillars || []) as Phase2APillar[];
    setPillars(loadedPillars);

    const seeded: Record<string, string> = {};
    loadedPillars.forEach((pillar) => {
      pillar.questions.forEach((q) => {
        if (q.answered && q.selectedOptionId) {
          seeded[q.id] = q.selectedOptionId;
        }
      });
    });
    setAnswers(seeded);

    const flatQuestions = flattenPillars(loadedPillars);
    const firstUnansweredIndex = flatQuestions.findIndex(
      (item) => !seeded[item.question.id],
    );
    setCurrentIndex(firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex);
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);

    if (!getAccessToken()) {
      setError("You need to be signed in to start the full diagnostic.");
      router.push("/Auth/login");
      return;
    }

    setLoading(true);
    try {
      const startRes = await authFetch("/assessment/phase2a/start", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const startData = await startRes.json().catch(() => ({}));
      if (!startRes.ok) {
        throw new Error(startData.message || "Failed to start Phase 2A session");
      }

      const newSessionId = startData.sessionId as string;
      setSessionId(newSessionId);
      setLastSessionId(newSessionId);

      await loadQuestions(newSessionId);
      setScanState("questions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [loadQuestions, router]);

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!sessionId) return;
      const current = flat[currentIndex];
      if (!current) return;

      const previous = answers[current.question.id];
      setAnswers((prev) => ({ ...prev, [current.question.id]: optionId }));
      setError(null);
      setSaving(true);

      try {
        const res = await authFetch(`/assessment/${sessionId}/answer`, {
          method: "POST",
          body: JSON.stringify({
            questionId: current.question.id,
            selectedOptionId: optionId,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to save answer");
        }
      } catch (err) {
        setAnswers((prev) => {
          const next = { ...prev };
          if (previous) {
            next[current.question.id] = previous;
          } else {
            delete next[current.question.id];
          }
          return next;
        });
        setError(err instanceof Error ? err.message : "Failed to save answer");
      } finally {
        setSaving(false);
      }
    },
    [answers, currentIndex, flat, sessionId],
  );

  const handlePrev = useCallback(() => {
    setCurrentIndex((idx) => Math.max(0, idx - 1));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!sessionId) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await authFetch(`/assessment/${sessionId}/submit`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit assessment");
      }

      setScanState("processing");
      const result = await waitForResult(sessionId);
      setResultData(result);
      setScanState("result");
    } catch (err) {
      setScanState("questions");
      setError(err instanceof Error ? err.message : "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, waitForResult]);

  const handleNext = useCallback(() => {
    if (currentIndex < flat.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setError(null);
    } else {
      handleSubmit();
    }
  }, [currentIndex, flat.length, handleSubmit]);

  const handleSaveAndExit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleDownloadPdf = useCallback(() => {
    if (!resultData) return;
    if (resultData.paywalled || !resultData.result.reportPdfUrl) {
      router.push("/dashboard/subscription");
      return;
    }
    window.open(resultData.result.reportPdfUrl, "_blank", "noopener,noreferrer");
  }, [resultData, router]);

  const handleDeepDive = useCallback(() => {
    router.push("/dashboard/deep-dive");
  }, [router]);

  const handleStartAnotherScan = useCallback(() => {
    setResultData(null);
    setPillars([]);
    setAnswers({});
    setCurrentIndex(0);
    setError(null);
    setSessionId(null);
    setScanState("landing");
  }, []);

  if (scanState === "questions" && flat.length > 0) {
    const current = flat[currentIndex];
    return (
      <QuestionsState
        flat={flat}
        currentIndex={currentIndex}
        selectedOptionId={answers[current.question.id] || null}
        saving={saving}
        submitting={submitting}
        error={error}
        onSelect={handleSelect}
        onPrev={handlePrev}
        onNext={handleNext}
        onSaveAndExit={handleSaveAndExit}
      />
    );
  }

  if (scanState === "processing") {
    return <ProcessingState />;
  }

  if (scanState === "result" && resultData) {
    return (
      <ResultState
        data={resultData}
        onDownloadPdf={handleDownloadPdf}
        onDeepDive={handleDeepDive}
        onStartAnotherScan={handleStartAnotherScan}
      />
    );
  }

  return <LandingState onStart={handleStart} loading={loading} error={error} />;
}
