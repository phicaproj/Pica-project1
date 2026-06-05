"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronDown,
  Database,
  Loader,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  addAdminQuestionOption,
  createAdminQuestion,
  deleteAdminQuestion,
  deleteAdminQuestionOption,
  getAdminPillars,
  getAdminQuestions,
  updateAdminQuestion,
  updateAdminQuestionOption,
  type AdminQuestion,
  type AdminQuestionOption,
  type AdminQuestionOptionPayload,
  type AdminQuestionPhase,
  type BusinessSize,
  type PillarMeta,
} from "@/lib/authClient";

type QuestionDraft = {
  questionText: string;
  phase: AdminQuestionPhase;
  businessSize: BusinessSize;
  isPhase1Featured: boolean;
  isActive: boolean;
};

type CreateDraft = QuestionDraft & {
  pillarId: string;
  options: AdminQuestionOptionPayload[];
};

const PHASES: AdminQuestionPhase[] = ["PHASE1", "PHASE2A", "PHASE2B"];
const BUSINESS_SIZES: BusinessSize[] = ["SMALL", "MEDIUM"];

const emptyOption = (score = 0): AdminQuestionOptionPayload => ({
  optionText: "",
  score,
  observation: "",
  recommendation: "",
});

const initialCreateDraft = (): CreateDraft => ({
  pillarId: "",
  questionText: "",
  phase: "PHASE2A",
  businessSize: "SMALL",
  isPhase1Featured: false,
  isActive: true,
  options: [emptyOption(10), emptyOption(6), emptyOption(3), emptyOption(0)],
});

const phaseLabel = (phase: AdminQuestionPhase) => {
  if (phase === "PHASE1") return "Phase 1";
  if (phase === "PHASE2A") return "Plan 2A";
  return "Plan 2B";
};

const riskStyle = (riskType: AdminQuestionOption["riskType"]) => {
  if (riskType === "NORMAL") return "bg-emerald-500/10 text-emerald-300";
  if (riskType === "KNOCKOUT") return "bg-red-500/10 text-red-300";
  return "bg-amber-500/10 text-amber-300";
};

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-[#111318] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/50";

const textareaClass =
  "w-full resize-none rounded-lg border border-white/10 bg-[#111318] px-3 py-2.5 text-sm leading-relaxed text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/50";

function optionPayload(option: AdminQuestionOption): AdminQuestionOptionPayload {
  return {
    optionText: option.optionText,
    score: option.score,
    observation: option.observation,
    recommendation: option.recommendation,
  };
}

function validateOption(option: AdminQuestionOptionPayload) {
  return (
    option.optionText.trim() &&
    Number.isFinite(option.score) &&
    option.score >= 0 &&
    option.score <= 10 &&
    option.observation.trim() &&
    option.recommendation.trim()
  );
}

export default function QuestionBankPage() {
  const [pillars, setPillars] = useState<PillarMeta[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [pillarFilter, setPillarFilter] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<AdminQuestionPhase | "">("");
  const [businessFilter, setBusinessFilter] = useState<BusinessSize | "">("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateDraft>(initialCreateDraft);
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft | null>(null);
  const [optionDrafts, setOptionDrafts] = useState<Record<string, AdminQuestionOptionPayload>>({});
  const [newOption, setNewOption] = useState<AdminQuestionOptionPayload>(emptyOption(0));

  const activeQuestion = useMemo(
    () => questions.find((question) => question.id === activeId) ?? null,
    [activeId, questions],
  );

  const pillarById = useMemo(() => {
    const map = new Map<string, PillarMeta>();
    for (const pillar of pillars) map.set(pillar.id, pillar);
    return map;
  }, [pillars]);

  const activePillar = activeQuestion ? pillarById.get(activeQuestion.pillarId) : null;
  const activeCount = questions.filter((question) => question.isActive).length;

  const loadPillars = useCallback(async () => {
    const res = await getAdminPillars();
    if (res.error) {
      setError(res.error.message);
      return;
    }
    if (res.data) {
      setPillars(res.data.pillars);
      setCreateDraft((current) => ({
        ...current,
        pillarId: current.pillarId || res.data.pillars[0]?.id || "",
      }));
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await getAdminQuestions({
      search: search.trim() || undefined,
      pillarId: pillarFilter || undefined,
      phase: phaseFilter || undefined,
      businessSize: businessFilter || undefined,
      includeInactive,
    });

    if (res.error) {
      setError(res.error.message);
      setQuestions([]);
      setActiveId(null);
    } else if (res.data) {
      setQuestions(res.data.questions);
      setActiveId((current) => {
        if (current && res.data.questions.some((question) => question.id === current)) {
          return current;
        }
        return res.data.questions[0]?.id ?? null;
      });
    }

    setLoading(false);
  }, [businessFilter, includeInactive, phaseFilter, pillarFilter, search]);

  useEffect(() => {
    void loadPillars();
  }, [loadPillars]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuestions();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadQuestions]);

  useEffect(() => {
    if (!activeQuestion) {
      setQuestionDraft(null);
      setOptionDrafts({});
      return;
    }

    setQuestionDraft({
      questionText: activeQuestion.questionText,
      phase: activeQuestion.phase,
      businessSize: activeQuestion.businessSize,
      isPhase1Featured: activeQuestion.isPhase1Featured,
      isActive: activeQuestion.isActive,
    });

    setOptionDrafts(
      activeQuestion.options.reduce<Record<string, AdminQuestionOptionPayload>>((acc, option) => {
        acc[option.id] = optionPayload(option);
        return acc;
      }, {}),
    );
    setNewOption(emptyOption(0));
  }, [activeQuestion]);

  const replaceQuestion = (question: AdminQuestion) => {
    setQuestions((current) => {
      const exists = current.some((row) => row.id === question.id);
      if (!exists) return [question, ...current];
      return current.map((row) => (row.id === question.id ? question : row));
    });
    setActiveId(question.id);
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  };

  const saveQuestion = async () => {
    if (!activeQuestion || !questionDraft) return;
    if (!questionDraft.questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await updateAdminQuestion(activeQuestion.id, {
      questionText: questionDraft.questionText.trim(),
      phase: questionDraft.phase,
      businessSize: questionDraft.businessSize,
      isPhase1Featured: questionDraft.isPhase1Featured,
      isActive: questionDraft.isActive,
    });

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      replaceQuestion(res.data.question);
      showNotice("Question saved.");
    }
    setSaving(false);
  };

  const saveOption = async (optionId: string) => {
    const draft = optionDrafts[optionId];
    if (!draft || !validateOption(draft)) {
      setError("Complete the option text, score, observation, and recommendation.");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await updateAdminQuestionOption(optionId, {
      optionText: draft.optionText.trim(),
      score: Number(draft.score),
      observation: draft.observation.trim(),
      recommendation: draft.recommendation.trim(),
    });

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      replaceQuestion(res.data.question);
      showNotice("Option saved.");
    }
    setSaving(false);
  };

  const addOption = async () => {
    if (!activeQuestion || !validateOption(newOption)) {
      setError("Complete the new option before adding it.");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await addAdminQuestionOption(activeQuestion.id, {
      optionText: newOption.optionText.trim(),
      score: Number(newOption.score),
      observation: newOption.observation.trim(),
      recommendation: newOption.recommendation.trim(),
    });

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      replaceQuestion(res.data.question);
      setNewOption(emptyOption(0));
      showNotice("Option added.");
    }
    setSaving(false);
  };

  const removeOption = async (optionId: string) => {
    if (!window.confirm("Delete this option?")) return;

    setSaving(true);
    setError(null);
    const res = await deleteAdminQuestionOption(optionId);

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      replaceQuestion(res.data.question);
      showNotice("Option deleted.");
    }
    setSaving(false);
  };

  const archiveQuestion = async () => {
    if (!activeQuestion || !window.confirm("Archive this question?")) return;

    setSaving(true);
    setError(null);
    const res = await deleteAdminQuestion(activeQuestion.id);

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      replaceQuestion(res.data.question);
      showNotice("Question archived.");
    }
    setSaving(false);
  };

  const createQuestion = async () => {
    if (!createDraft.pillarId || !createDraft.questionText.trim()) {
      setError("Select a pillar and enter the question text.");
      return;
    }

    const options = createDraft.options.map((option) => ({
      optionText: option.optionText.trim(),
      score: Number(option.score),
      observation: option.observation.trim(),
      recommendation: option.recommendation.trim(),
    }));

    if (options.length < 2 || options.some((option) => !validateOption(option))) {
      setError("Every option needs text, score, observation, and recommendation.");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await createAdminQuestion({
      pillarId: createDraft.pillarId,
      questionText: createDraft.questionText.trim(),
      phase: createDraft.phase,
      businessSize: createDraft.businessSize,
      isPhase1Featured: createDraft.isPhase1Featured,
      options,
    });

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      replaceQuestion(res.data.question);
      setCreateOpen(false);
      setCreateDraft({
        ...initialCreateDraft(),
        pillarId: createDraft.pillarId,
      });
      showNotice("Question created.");
    }
    setSaving(false);
  };

  const updateCreateOption = (
    index: number,
    key: keyof AdminQuestionOptionPayload,
    value: string,
  ) => {
    setCreateDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              [key]: key === "score" ? Number(value) : value,
            }
          : option,
      ),
    }));
  };

  const removeCreateOption = (index: number) => {
    setCreateDraft((current) => ({
      ...current,
      options: current.options.filter((_, optionIndex) => optionIndex !== index),
    }));
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Question Bank</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Manage active PICA diagnostic questions, answer options, scoring, and archive state.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadQuestions()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            New Question
          </button>
        </div>
      </div>

      {(error || notice) && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {error ? (
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <span>{error || notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-5">
          <div className="text-xs font-semibold uppercase text-gray-500">Visible Questions</div>
          <div className="mt-2 text-2xl font-bold text-white">{activeCount}</div>
          <div className="mt-1 text-xs text-gray-500">In the current result set</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-5">
          <div className="text-xs font-semibold uppercase text-gray-500">Total Loaded</div>
          <div className="mt-2 text-2xl font-bold text-white">{questions.length}</div>
          <div className="mt-1 text-xs text-gray-500">Matches the active filters</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-5">
          <div className="text-xs font-semibold uppercase text-gray-500">Pillars</div>
          <div className="mt-2 text-2xl font-bold text-white">{pillars.length}</div>
          <div className="mt-1 text-xs text-gray-500">Available for authoring</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by code or question text"
                  className={`${fieldClass} pl-9`}
                />
              </div>

              <select
                value={pillarFilter}
                onChange={(event) => setPillarFilter(event.target.value)}
                className={fieldClass}
              >
                <option value="">All pillars</option>
                {pillars.map((pillar) => (
                  <option key={pillar.id} value={pillar.id}>
                    {pillar.name}
                  </option>
                ))}
              </select>

              <select
                value={phaseFilter}
                onChange={(event) => setPhaseFilter(event.target.value as AdminQuestionPhase | "")}
                className={fieldClass}
              >
                <option value="">All phases</option>
                {PHASES.map((phase) => (
                  <option key={phase} value={phase}>
                    {phaseLabel(phase)}
                  </option>
                ))}
              </select>

              <select
                value={businessFilter}
                onChange={(event) => setBusinessFilter(event.target.value as BusinessSize | "")}
                className={fieldClass}
              >
                <option value="">All business sizes</option>
                {BUSINESS_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111318] px-3 py-2.5 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(event) => setIncludeInactive(event.target.checked)}
                  className="h-4 w-4 accent-blue-500"
                />
                Include archived
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-white/5 bg-[#1C1F2E]">
                <Loader className="h-6 w-6 animate-spin text-blue-300" />
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-8 text-center text-sm text-gray-500">
                No questions match the current filters.
              </div>
            ) : (
              questions.map((question) => (
                <button
                  type="button"
                  key={question.id}
                  onClick={() => setActiveId(question.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    activeId === question.id
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-white/5 bg-[#1C1F2E] hover:border-white/10"
                  } ${question.isActive ? "" : "opacity-60"}`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-semibold text-gray-300">
                        {question.questionCode}
                      </span>
                      <span className="rounded-md bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300">
                        {phaseLabel(question.phase)}
                      </span>
                      <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-semibold text-gray-300">
                        {question.businessSize}
                      </span>
                    </div>
                    {!question.isActive && (
                      <span className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-gray-200">
                    {question.questionText}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Database className="h-3.5 w-3.5" />
                    {question.pillarCode} / {question.options.length} options
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-white/5 bg-[#1C1F2E] lg:col-span-3">
          {!activeQuestion || !questionDraft ? (
            <div className="flex min-h-[520px] items-center justify-center p-8 text-center text-sm text-gray-500">
              Select a question to edit it, or create a new one.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-white/5 px-6 py-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{activeQuestion.questionCode}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {activePillar?.name || activeQuestion.pillarCode} / Display order {activeQuestion.displayOrder}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void archiveQuestion()}
                    disabled={saving || !activeQuestion.isActive}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveQuestion()}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
                  >
                    {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Question
                  </button>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Question Text
                  </label>
                  <textarea
                    value={questionDraft.questionText}
                    onChange={(event) =>
                      setQuestionDraft({ ...questionDraft, questionText: event.target.value })
                    }
                    rows={4}
                    className={textareaClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                      Phase
                    </label>
                    <select
                      value={questionDraft.phase}
                      onChange={(event) =>
                        setQuestionDraft({
                          ...questionDraft,
                          phase: event.target.value as AdminQuestionPhase,
                        })
                      }
                      className={fieldClass}
                    >
                      {PHASES.map((phase) => (
                        <option key={phase} value={phase}>
                          {phaseLabel(phase)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                      Business Size
                    </label>
                    <select
                      value={questionDraft.businessSize}
                      onChange={(event) =>
                        setQuestionDraft({
                          ...questionDraft,
                          businessSize: event.target.value as BusinessSize,
                        })
                      }
                      className={fieldClass}
                    >
                      {BUSINESS_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111318] px-3 py-2.5 text-sm text-gray-300 md:mt-6">
                    <input
                      type="checkbox"
                      checked={questionDraft.isPhase1Featured}
                      onChange={(event) =>
                        setQuestionDraft({
                          ...questionDraft,
                          isPhase1Featured: event.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-blue-500"
                    />
                    Phase 1 featured
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111318] px-3 py-2.5 text-sm text-gray-300 md:mt-6">
                    <input
                      type="checkbox"
                      checked={questionDraft.isActive}
                      onChange={(event) =>
                        setQuestionDraft({
                          ...questionDraft,
                          isActive: event.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-blue-500"
                    />
                    Active
                  </label>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Options</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Risk type is recalculated by the backend from option scores.
                      </p>
                    </div>
                    {activeQuestion.hasKnockoutOption && (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                        Knockout present
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {activeQuestion.options.map((option) => {
                      const draft = optionDrafts[option.id] ?? optionPayload(option);
                      return (
                        <div key={option.id} className="rounded-xl border border-white/5 bg-[#111318] p-4">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
                                {option.optionLabel}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskStyle(option.riskType)}`}>
                                {option.riskType}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void saveOption(option.id)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-950 transition hover:bg-gray-100 disabled:opacity-60"
                              >
                                <Save className="h-3.5 w-3.5" />
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeOption(option.id)}
                                disabled={saving || activeQuestion.options.length <= 2}
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                            <div className="md:col-span-5">
                              <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                                Option Text
                              </label>
                              <input
                                value={draft.optionText}
                                onChange={(event) =>
                                  setOptionDrafts((current) => ({
                                    ...current,
                                    [option.id]: { ...draft, optionText: event.target.value },
                                  }))
                                }
                                className={fieldClass}
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                                Score
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={draft.score}
                                onChange={(event) =>
                                  setOptionDrafts((current) => ({
                                    ...current,
                                    [option.id]: { ...draft, score: Number(event.target.value) },
                                  }))
                                }
                                className={fieldClass}
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                                Observation
                              </label>
                              <textarea
                                value={draft.observation}
                                onChange={(event) =>
                                  setOptionDrafts((current) => ({
                                    ...current,
                                    [option.id]: { ...draft, observation: event.target.value },
                                  }))
                                }
                                rows={3}
                                className={textareaClass}
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                                Recommendation
                              </label>
                              <textarea
                                value={draft.recommendation}
                                onChange={(event) =>
                                  setOptionDrafts((current) => ({
                                    ...current,
                                    [option.id]: { ...draft, recommendation: event.target.value },
                                  }))
                                }
                                rows={3}
                                className={textareaClass}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="rounded-xl border border-dashed border-white/10 bg-[#111318] p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h4 className="font-semibold text-white">Add Option</h4>
                        <button
                          type="button"
                          onClick={() => void addOption()}
                          disabled={saving || activeQuestion.options.length >= 6}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                        <input
                          value={newOption.optionText}
                          onChange={(event) =>
                            setNewOption({ ...newOption, optionText: event.target.value })
                          }
                          placeholder="Option text"
                          className={`${fieldClass} md:col-span-5`}
                        />
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={newOption.score}
                          onChange={(event) =>
                            setNewOption({ ...newOption, score: Number(event.target.value) })
                          }
                          className={fieldClass}
                        />
                        <textarea
                          value={newOption.observation}
                          onChange={(event) =>
                            setNewOption({ ...newOption, observation: event.target.value })
                          }
                          rows={2}
                          placeholder="Observation"
                          className={`${textareaClass} md:col-span-3`}
                        />
                        <textarea
                          value={newOption.recommendation}
                          onChange={(event) =>
                            setNewOption({ ...newOption, recommendation: event.target.value })
                          }
                          rows={2}
                          placeholder="Recommendation"
                          className={`${textareaClass} md:col-span-3`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-[#1C1F2E] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-white">New Question</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create a question with two to six scored answer options.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-150px)] overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Pillar
                  </label>
                  <div className="relative">
                    <select
                      value={createDraft.pillarId}
                      onChange={(event) =>
                        setCreateDraft({ ...createDraft, pillarId: event.target.value })
                      }
                      className={`${fieldClass} appearance-none pr-9`}
                    >
                      <option value="" disabled>
                        Select pillar
                      </option>
                      {pillars.map((pillar) => (
                        <option key={pillar.id} value={pillar.id}>
                          {pillar.name} ({pillar.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Phase
                  </label>
                  <select
                    value={createDraft.phase}
                    onChange={(event) =>
                      setCreateDraft({
                        ...createDraft,
                        phase: event.target.value as AdminQuestionPhase,
                      })
                    }
                    className={fieldClass}
                  >
                    {PHASES.map((phase) => (
                      <option key={phase} value={phase}>
                        {phaseLabel(phase)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Business Size
                  </label>
                  <select
                    value={createDraft.businessSize}
                    onChange={(event) =>
                      setCreateDraft({
                        ...createDraft,
                        businessSize: event.target.value as BusinessSize,
                      })
                    }
                    className={fieldClass}
                  >
                    {BUSINESS_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                  Question Text
                </label>
                <textarea
                  value={createDraft.questionText}
                  onChange={(event) =>
                    setCreateDraft({ ...createDraft, questionText: event.target.value })
                  }
                  rows={4}
                  className={textareaClass}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={createDraft.isPhase1Featured}
                    onChange={(event) =>
                      setCreateDraft({
                        ...createDraft,
                        isPhase1Featured: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-blue-500"
                  />
                  Phase 1 featured
                </label>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">Answer Options</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateDraft((current) => ({
                        ...current,
                        options: [...current.options, emptyOption(0)],
                      }))
                    }
                    disabled={createDraft.options.length >= 6}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Option
                  </button>
                </div>

                {createDraft.options.map((option, index) => (
                  <div key={index} className="rounded-xl border border-white/5 bg-[#111318] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-white">
                        Option {String.fromCharCode(65 + index)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCreateOption(index)}
                        disabled={createDraft.options.length <= 2}
                        className="rounded-lg p-2 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                      <input
                        value={option.optionText}
                        onChange={(event) =>
                          updateCreateOption(index, "optionText", event.target.value)
                        }
                        placeholder="Option text"
                        className={`${fieldClass} md:col-span-5`}
                      />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={option.score}
                        onChange={(event) =>
                          updateCreateOption(index, "score", event.target.value)
                        }
                        className={fieldClass}
                      />
                      <textarea
                        value={option.observation}
                        onChange={(event) =>
                          updateCreateOption(index, "observation", event.target.value)
                        }
                        rows={2}
                        placeholder="Observation"
                        className={`${textareaClass} md:col-span-3`}
                      />
                      <textarea
                        value={option.recommendation}
                        onChange={(event) =>
                          updateCreateOption(index, "recommendation", event.target.value)
                        }
                        rows={2}
                        placeholder="Recommendation"
                        className={`${textareaClass} md:col-span-3`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-5">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                disabled={saving}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createQuestion()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
              >
                {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
