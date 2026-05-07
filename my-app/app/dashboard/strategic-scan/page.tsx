"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle,
  Loader,
  Megaphone,
  Radar,
  Save,
  Settings2,
  Users,
} from "lucide-react";
import { getAccessToken, setLastSessionId } from "@/lib/authClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://pica-project1.onrender.com/api";

type ScanState = "landing" | "questions" | "processing";

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
  pillarName: string;
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
          flat.push({ question, pillarName: pillar.name });
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
  const departments = [
    { label: "Finance", icon: Banknote, color: "text-teal-400 border-teal-400/30 bg-teal-400/5" },
    { label: "HR", icon: Users, color: "text-blue-400 border-blue-400/30 bg-blue-400/5" },
    { label: "Ops", icon: Settings2, color: "text-green-400 border-green-400/30 bg-green-400/5" },
    { label: "Marketing", icon: Megaphone, color: "text-purple-400 border-purple-400/30 bg-purple-400/5" },
    { label: "Strategy", icon: Radar, color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5" },
  ];

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
              Unfold the mathematical architecture of your business. The full diagnostic asks 70
              calibrated questions across 7 strategic pillars. Your progress is saved automatically &mdash;
              you can leave any time and resume right where you stopped.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {departments.map((dept) => (
                <div
                  key={dept.label}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border ${dept.color} transition hover:scale-105 cursor-pointer`}
                >
                  <dept.icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                    {dept.label}
                  </span>
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
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold text-white">70</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Calibrated Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">7</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Strategic Pillars</p>
                </div>
              </div>
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
  pillarName,
  answeredCount,
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
  pillarName: string;
  answeredCount: number;
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
  const completionProgress = total > 0 ? (answeredCount / total) * 100 : 0;
  const isLast = currentIndex === total - 1;

  if (!current) return null;

  return (
    <div className="space-y-6 max-w-full">
      <div className="rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 p-6 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-1">
              Current Pillar
            </p>
            <p className="text-xl font-bold text-white">{pillarName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Progress
            </p>
            <p className="text-sm text-gray-300">
              Question{" "}
              <span className="font-bold text-orange-400">{currentIndex + 1}</span> of {total}
              <span className="ml-3 text-xs text-gray-500">
                ({answeredCount}/{total} answered)
              </span>
            </p>
          </div>
        </div>

        <div className="h-1 rounded-full bg-white/10 mb-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-teal-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="h-1 rounded-full bg-white/5 mb-8 overflow-hidden">
          <div
            className="h-full rounded-full bg-orange-400/70 transition-all duration-500"
            style={{ width: `${completionProgress}%` }}
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

  const flat = useMemo(() => flattenPillars(pillars), [pillars]);
  const answeredCount = Object.keys(answers).length;

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
      const redirectTo =
        typeof data.redirectTo === "string" && data.redirectTo
          ? data.redirectTo
          : "/dashboard/subscription";

      setTimeout(() => {
        router.push(redirectTo);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  }, [router, sessionId]);

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

  if (scanState === "questions" && flat.length > 0) {
    const current = flat[currentIndex];
    return (
      <QuestionsState
        flat={flat}
        currentIndex={currentIndex}
        selectedOptionId={answers[current.question.id] || null}
        pillarName={current.pillarName}
        answeredCount={answeredCount}
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

  return <LandingState onStart={handleStart} loading={loading} error={error} />;
}
