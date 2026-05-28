"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader,
  Radar,
  Save,
} from "lucide-react";
import {
  getMyPhase2BPillars,
  fetchPhase2BQuestions,
  getSessionResponses,
} from "@/lib/authClient";
import { getAccessToken } from "@/lib/authClient";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://pica-project1.onrender.com/api";

async function authFetch(path: string, init?: RequestInit) {
  const token = getAccessToken();
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

type ScanState = "loading" | "questions" | "processing";

interface QuestionOption {
  id: string;
  optionLabel: string;
  optionText: string;
  displayOrder: number;
}

interface Phase2BQuestion {
  id: string;
  questionCode: string;
  questionText: string;
  displayOrder: number;
  answered: boolean;
  selectedOptionId: string | null;
  options: QuestionOption[];
}

interface FlatQuestion {
  question: Phase2BQuestion;
}

// ─── Questions State ────────────────────────────────────────────────────────
function QuestionsState({
  pillarName,
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
  pillarName: string;
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-full"
    >
      <div className="rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 p-6 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-1">
              {pillarName} Deep Dive
            </p>
            <p className="text-xl font-bold text-white">
              Assessment in progress
            </p>
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
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 transition-all duration-500"
            animate={{ width: `${progress}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
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
                    <motion.button
                      whileHover={!saving && !submitting ? { scale: 1.01 } : {}}
                      whileTap={!saving && !submitting ? { scale: 0.99 } : {}}
                      key={opt.id}
                      onClick={() => onSelect(opt.id)}
                      disabled={saving || submitting}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition disabled:cursor-not-allowed ${
                        isSelected
                          ? "border-orange-400 bg-orange-400/10"
                          : "border-white/10 bg-[#161b22] hover:border-white/20"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isSelected
                            ? "bg-orange-400 text-gray-900"
                            : "bg-[#243044] text-gray-400"
                        }`}
                      >
                        {opt.optionLabel}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isSelected
                            ? "text-white font-bold"
                            : "text-gray-300"
                        }`}
                      >
                        {opt.optionText}
                      </span>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-orange-400 ml-auto flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </motion.div>
        </AnimatePresence>

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
                Submit Deep Dive <CheckCircle className="w-4 h-4" />
              </>
            ) : (
              <>
                Next Question <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-full"
    >
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0a1628] via-[#0d1117] to-[#0d1117] border border-white/5 overflow-hidden min-h-[60vh] flex flex-col items-center justify-center p-6 md:p-10">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="relative w-48 h-48 md:w-56 md:h-56">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-500/20 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-orange-900/50 via-red-900/50 to-purple-900/50 border border-orange-500/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400/30 to-red-500/30 flex items-center justify-center">
                <Radar className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-orange-400 uppercase tracking-widest mt-2 font-mono">
            Synthesizing Deep Dive
          </p>
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Deep Dive Module
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Routing you to the results...
          </p>
          <div className="h-2 rounded-full bg-white/5 mb-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-mono">PROCESSING</span>
            <span className="text-orange-400 font-mono">
              {progress.toFixed(0)}% COMPLETE
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function DeepDiveSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [scanState, setScanState] = useState<ScanState>("loading");
  const [flat, setFlat] = useState<FlatQuestion[]>([]);
  const [pillarName, setPillarName] = useState("");
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setScanState("loading");
        
        // 1. Get pillar metadata for the session
        const pillarsRes = await getMyPhase2BPillars();
        const sessionMeta = pillarsRes.data?.pillars.find((p) => p.sessionId === sessionId);
        
        if (!sessionMeta) {
          throw new Error("Session not found or not owned by you.");
        }
        
        setPillarName(sessionMeta.pillarName);
        
        // 2. Load Phase 2B questions for that pillar
        const questionsRes = await fetchPhase2BQuestions(sessionMeta.pillarId);
        const questions = questionsRes.data?.questions || [];
        
        // 3. Load user's saved answers
        const answersRes = await getSessionResponses(sessionId);
        const savedAnswers = answersRes.data?.responses || [];
        
        const seeded: Record<string, string> = {};
        savedAnswers.forEach((a) => {
          seeded[a.questionId] = a.selectedOptionId;
        });
        
        setAnswers(seeded);
        
        const flatQuestions: FlatQuestion[] = questions.map((q: any) => ({
          question: {
            ...q,
            answered: !!seeded[q.id],
            selectedOptionId: seeded[q.id] || null,
          }
        }));
        
        setFlat(flatQuestions);
        
        const firstUnansweredIndex = flatQuestions.findIndex((item) => !seeded[item.question.id]);
        setCurrentIndex(firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex);
        
        setScanState("questions");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      }
    }
    
    if (sessionId) {
      loadData();
    }
  }, [sessionId]);

  const handleSelect = useCallback(
    async (optionId: string) => {
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
          if (previous) next[current.question.id] = previous;
          else delete next[current.question.id];
          return next;
        });
        setError(err instanceof Error ? err.message : "Failed to save answer");
      } finally {
        setSaving(false);
      }
    },
    [answers, currentIndex, flat, sessionId]
  );

  const handlePrev = useCallback(() => {
    setCurrentIndex((idx) => Math.max(0, idx - 1));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
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
      
      // Navigate to reports after a short delay
      setTimeout(() => {
        router.push(`/dashboard/reports/${sessionId}`);
      }, 4000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit assessment");
      setSubmitting(false);
    }
  }, [sessionId, router]);

  const handleNext = useCallback(() => {
    const current = flat[currentIndex];
    if (!current) return;
    
    // Auto-save is done on select, so just proceed
    if (currentIndex === flat.length - 1) {
      handleSubmit();
    } else {
      setCurrentIndex((idx) => Math.min(flat.length - 1, idx + 1));
      setError(null);
    }
  }, [currentIndex, flat, handleSubmit]);

  const handleSaveAndExit = useCallback(() => {
    router.push("/dashboard/deep-dive");
  }, [router]);

  if (scanState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (scanState === "processing") {
    return <ProcessingState />;
  }

  return (
    <QuestionsState
      pillarName={pillarName}
      flat={flat}
      currentIndex={currentIndex}
      selectedOptionId={answers[flat[currentIndex]?.question.id] || null}
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
