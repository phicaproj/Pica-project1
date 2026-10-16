"use client";

import { useToast } from "@/components/ToastContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader,
  Pencil,
  RefreshCw,
  Save,
  Scale,
} from "lucide-react";
import {
  clearSession,
  getAdminPillarsDetailed,
  getScoringSettings,
  saveAdminPillarWeights,
  updateScoringSettings,
  type AdminPillarDetailed,
  type ScoringSettings,
} from "@/lib/authClient";

// Slider range. Weights are relative shares (backend normalizes by the
// total), so the absolute scale is arbitrary — 1–100 is comfortable to drag.
const WEIGHT_MIN = 1;
const WEIGHT_MAX = 100;

// Per-pillar accent colors keyed by displayOrder position (cycles if needed).
const PILLAR_COLORS = [
  { hex: "#3b82f6", text: "text-blue-400" },
  { hex: "#10b981", text: "text-emerald-400" },
  { hex: "#f59e0b", text: "text-amber-400" },
  { hex: "#8b5cf6", text: "text-violet-400" },
  { hex: "#ec4899", text: "text-pink-400" },
  { hex: "#06b6d4", text: "text-cyan-400" },
  { hex: "#f97316", text: "text-orange-400" },
];

type BandKey = "red" | "orange" | "amber" | "lightGreen" | "green";

type BandDraft = {
  label: string;
  description: string;
};

export default function ScoringPage() {
  const router = useRouter();
  const [pillars, setPillars] = useState<AdminPillarDetailed[]>([]);
  const [settings, setSettings] = useState<ScoringSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success: showSuccess, error: showError } = useToast();
  useEffect(() => { if (error && typeof error === 'string') showError(error); }, [error, showError]);
  const [success, setSuccess] = useState<string | null>(null);
  useEffect(() => { if (success && typeof success === 'string') showSuccess(success); }, [success, showSuccess]);
  // Read-only until the admin explicitly clicks Edit — guards against
  // accidental changes to scoring config.
  const [isEditing, setIsEditing] = useState(false);

  // Drafts — what the admin is editing. Saved values live in pillars/settings.
  const [weightDraft, setWeightDraft] = useState<Record<string, number>>({});
  const [orangeMinDraft, setOrangeMinDraft] = useState("");
  const [amberMinDraft, setAmberMinDraft] = useState("");
  const [lightGreenMinDraft, setLightGreenMinDraft] = useState("");
  const [greenMinDraft, setGreenMinDraft] = useState("");
  const [bandDrafts, setBandDrafts] = useState<Record<BandKey, BandDraft>>({
    red: { label: "", description: "" },
    orange: { label: "", description: "" },
    amber: { label: "", description: "" },
    lightGreen: { label: "", description: "" },
    green: { label: "", description: "" },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [pillarsRes, settingsRes] = await Promise.all([
      getAdminPillarsDetailed(),
      getScoringSettings(),
    ]);

    const isUnauthorized =
      pillarsRes.error?.message?.includes("401") ||
      settingsRes.error?.message?.includes("401") ||
      pillarsRes.error?.message?.toLowerCase().includes("not authenticated") ||
      settingsRes.error?.message?.toLowerCase().includes("not authenticated") ||
      pillarsRes.error?.message?.toLowerCase().includes("expired token") ||
      settingsRes.error?.message?.toLowerCase().includes("expired token");

    if (isUnauthorized) {
      clearSession();
      router.replace("/admin/login");
      return;
    }

    if (pillarsRes.error || settingsRes.error) {
      setError(
        pillarsRes.error?.message ||
          settingsRes.error?.message ||
          "Unable to load scoring configuration",
      );
    }

    if (pillarsRes.data) {
      setPillars(pillarsRes.data.pillars);
      setWeightDraft(
        Object.fromEntries(
          pillarsRes.data.pillars.map((p) => [p.id, p.weight]),
        ),
      );
    }
    if (settingsRes.data) {
      const s = settingsRes.data.settings;
      setSettings(s);
      setOrangeMinDraft(String(s.orangeMin ?? 31));
      setAmberMinDraft(String(s.amberMin ?? 51));
      setLightGreenMinDraft(String(s.lightGreenMin ?? 71));
      setGreenMinDraft(String(s.greenMin ?? 91));
      setBandDrafts({
        red: { label: s.redLabel ?? "Reactive", description: s.redDescription ?? "" },
        orange: { label: s.orangeLabel ?? "Foundational Emergent", description: s.orangeDescription ?? "" },
        amber: { label: s.amberLabel ?? "Operationally Sound", description: s.amberDescription ?? "" },
        lightGreen: { label: s.lightGreenLabel ?? "Strategically Fortified", description: s.lightGreenDescription ?? "" },
        green: { label: s.greenLabel ?? "Future-Proofed", description: s.greenDescription ?? "" },
      });
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ── Dirty-state detection ──────────────────────────────────────────────

  const weightsDirty = useMemo(
    () => pillars.some((p) => (weightDraft[p.id] ?? p.weight) !== p.weight),
    [pillars, weightDraft],
  );

  const settingsDirty = useMemo(() => {
    if (!settings) return false;
    return (
      Number(orangeMinDraft) !== (settings.orangeMin ?? 31) ||
      Number(amberMinDraft) !== (settings.amberMin ?? 51) ||
      Number(lightGreenMinDraft) !== (settings.lightGreenMin ?? 71) ||
      Number(greenMinDraft) !== (settings.greenMin ?? 91) ||
      (bandDrafts.red?.label ?? "") !== (settings.redLabel ?? "") ||
      (bandDrafts.red?.description ?? "") !== (settings.redDescription ?? "") ||
      (bandDrafts.orange?.label ?? "") !== (settings.orangeLabel ?? "") ||
      (bandDrafts.orange?.description ?? "") !== (settings.orangeDescription ?? "") ||
      (bandDrafts.amber?.label ?? "") !== (settings.amberLabel ?? "") ||
      (bandDrafts.amber?.description ?? "") !== (settings.amberDescription ?? "") ||
      (bandDrafts.lightGreen?.label ?? "") !== (settings.lightGreenLabel ?? "") ||
      (bandDrafts.lightGreen?.description ?? "") !== (settings.lightGreenDescription ?? "") ||
      (bandDrafts.green?.label ?? "") !== (settings.greenLabel ?? "") ||
      (bandDrafts.green?.description ?? "") !== (settings.greenDescription ?? "")
    );
  }, [settings, orangeMinDraft, amberMinDraft, lightGreenMinDraft, greenMinDraft, bandDrafts]);

  const dirty = weightsDirty || settingsDirty;

  const totalWeight = useMemo(
    () =>
      pillars.reduce((sum, p) => sum + (weightDraft[p.id] ?? p.weight), 0),
    [pillars, weightDraft],
  );

  // ── Validation (mirrors backend rules) ─────────────────────────────────

  const validationError = useMemo(() => {
    for (const p of pillars) {
      const w = weightDraft[p.id] ?? p.weight;
      if (!Number.isFinite(w) || w <= 0) {
        return `${p.name}: weight must be greater than 0.`;
      }
      if (w > 999.99) {
        return `${p.name}: weight cannot exceed 999.99.`;
      }
    }

    if (settings) {
      const orange = Number(orangeMinDraft);
      const amber = Number(amberMinDraft);
      const lightGreen = Number(lightGreenMinDraft);
      const green = Number(greenMinDraft);
      
      if (!Number.isFinite(orange) || orange <= 0 || orange > 100) return "Orange cutoff must be between 0 and 100.";
      if (!Number.isFinite(amber) || amber <= 0 || amber > 100) return "Amber cutoff must be between 0 and 100.";
      if (!Number.isFinite(lightGreen) || lightGreen <= 0 || lightGreen > 100) return "Light green cutoff must be between 0 and 100.";
      if (!Number.isFinite(green) || green <= 0 || green > 100) return "Green cutoff must be between 0 and 100.";
      
      if (orange >= amber || amber >= lightGreen || lightGreen >= green) {
        return "Cutoffs must be strictly increasing (Orange < Amber < Light Green < Green).";
      }
      
      for (const key of ["red", "orange", "amber", "lightGreen", "green"] as BandKey[]) {
        const draft = bandDrafts[key] ?? { label: "", description: "" };
        if (!(draft.label ?? "").trim()) return "Band labels cannot be empty.";
        if (!(draft.description ?? "").trim()) {
          return "Band descriptions cannot be empty.";
        }
      }
    }

    return null;
  }, [pillars, weightDraft, settings, orangeMinDraft, amberMinDraft, lightGreenMinDraft, greenMinDraft, bandDrafts]);

  // ── Save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!dirty || validationError) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (weightsDirty) {
      const res = await saveAdminPillarWeights(
        pillars.map((p) => ({
          pillarId: p.id,
          weight: weightDraft[p.id] ?? p.weight,
        })),
      );
      if (res.error) {
        setError(res.error.message);
        setSaving(false);
        return;
      }
      if (res.data) setPillars(res.data.pillars);
    }

    if (settingsDirty && settings) {
      const res = await updateScoringSettings({
        orangeMin: Number(orangeMinDraft),
        amberMin: Number(amberMinDraft),
        lightGreenMin: Number(lightGreenMinDraft),
        greenMin: Number(greenMinDraft),
        redLabel: (bandDrafts.red?.label ?? "").trim(),
        redDescription: (bandDrafts.red?.description ?? "").trim(),
        orangeLabel: (bandDrafts.orange?.label ?? "").trim(),
        orangeDescription: (bandDrafts.orange?.description ?? "").trim(),
        amberLabel: (bandDrafts.amber?.label ?? "").trim(),
        amberDescription: (bandDrafts.amber?.description ?? "").trim(),
        lightGreenLabel: (bandDrafts.lightGreen?.label ?? "").trim(),
        lightGreenDescription: (bandDrafts.lightGreen?.description ?? "").trim(),
        greenLabel: (bandDrafts.green?.label ?? "").trim(),
        greenDescription: (bandDrafts.green?.description ?? "").trim(),
      });
      if (res.error) {
        setError(res.error.message);
        setSaving(false);
        return;
      }
      if (res.data) setSettings(res.data.settings);
    }

    setSaving(false);
    setIsEditing(false);
    setSuccess("Changes saved. They apply to assessments submitted from now on.");
  };

  const handleReset = () => {
    setWeightDraft(Object.fromEntries(pillars.map((p) => [p.id, p.weight])));
    if (settings) {
      setOrangeMinDraft(String(settings.orangeMin ?? 31));
      setAmberMinDraft(String(settings.amberMin ?? 51));
      setLightGreenMinDraft(String(settings.lightGreenMin ?? 71));
      setGreenMinDraft(String(settings.greenMin ?? 91));
      setBandDrafts({
        red: { label: settings.redLabel ?? "Reactive", description: settings.redDescription ?? "" },
        orange: { label: settings.orangeLabel ?? "Foundational Emergent", description: settings.orangeDescription ?? "" },
        amber: { label: settings.amberLabel ?? "Operationally Sound", description: settings.amberDescription ?? "" },
        lightGreen: { label: settings.lightGreenLabel ?? "Strategically Fortified", description: settings.lightGreenDescription ?? "" },
        green: { label: settings.greenLabel ?? "Future-Proofed", description: settings.greenDescription ?? "" },
      });
    }
    setError(null);
    setSuccess(null);
    setIsEditing(false);
  };

  const setWeight = (pillarId: string, value: number) => {
    setSuccess(null);
    setWeightDraft((current) => ({ ...current, [pillarId]: value }));
  };

  const setBandDraft = (key: BandKey, patch: Partial<BandDraft>) => {
    setSuccess(null);
    setBandDrafts((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  };

  // Band rows rendered from drafts so cutoff edits preview live.
  const bands = useMemo(() => {
    const orange = Number(orangeMinDraft) || 0;
    const amber = Number(amberMinDraft) || 0;
    const lightGreen = Number(lightGreenMinDraft) || 0;
    const green = Number(greenMinDraft) || 0;
    return [
      {
        key: "red" as BandKey,
        range: `0 – ${Math.max(orange - 1, 0)}`,
        labelColor: "text-red-400",
        barColor: "bg-red-500",
        border: "border-red-500/20 bg-red-500/5",
      },
      {
        key: "orange" as BandKey,
        range: `${orange} – ${Math.max(amber - 1, 0)}`,
        labelColor: "text-orange-400",
        barColor: "bg-orange-500",
        border: "border-orange-500/20 bg-orange-500/5",
      },
      {
        key: "amber" as BandKey,
        range: `${amber} – ${Math.max(lightGreen - 1, 0)}`,
        labelColor: "text-amber-400",
        barColor: "bg-amber-500",
        border: "border-amber-500/20 bg-amber-500/5",
      },
      {
        key: "lightGreen" as BandKey,
        range: `${lightGreen} – ${Math.max(green - 1, 0)}`,
        labelColor: "text-lime-400",
        barColor: "bg-lime-500",
        border: "border-lime-500/20 bg-lime-500/5",
      },
      {
        key: "green" as BandKey,
        range: `${green} – 100`,
        labelColor: "text-emerald-400",
        barColor: "bg-emerald-500",
        border: "border-emerald-500/20 bg-emerald-500/5",
      },
    ];
  }, [orangeMinDraft, amberMinDraft, lightGreenMinDraft, greenMinDraft]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            System Configuration
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Scoring</h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Balance pillar weights and configure how total scores are
            interpreted. Changes only affect assessments submitted after
            saving — existing results never change.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          {!isEditing ? (
            <button
              onClick={() => {
                setSuccess(null);
                setError(null);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" /> Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty || saving || Boolean(validationError)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {!error && validationError && dirty && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm text-amber-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {validationError}
        </div>
      )}
      {success && !dirty && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-sm text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Pillar Weights */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">Pillar Weights</h2>
            <Scale className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mb-6">
            Weights are relative — each pillar counts for its share of the
            total. The percentage shows its effective influence on the overall
            score.
          </p>

          <div className="space-y-5">
            {pillars.map((pillar, i) => {
              const color = PILLAR_COLORS[i % PILLAR_COLORS.length];
              const weight = weightDraft[pillar.id] ?? pillar.weight;
              const effectivePct =
                totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
              const sliderPct =
                ((Math.min(Math.max(weight, WEIGHT_MIN), WEIGHT_MAX) -
                  WEIGHT_MIN) /
                  (WEIGHT_MAX - WEIGHT_MIN)) *
                100;

              return (
                <div key={pillar.id}>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-200 truncate">
                        {pillar.name}
                      </span>
                      <span className="text-[10px] font-mono text-gray-600 flex-shrink-0">
                        {pillar.code}
                      </span>
                      {pillar.activeQuestionCount === 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-400 flex-shrink-0">
                          <AlertTriangle className="w-3 h-3" /> No active
                          questions
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="number"
                        min={WEIGHT_MIN}
                        max={WEIGHT_MAX}
                        step={0.01}
                        value={weight}
                        disabled={!isEditing}
                        onChange={(e) =>
                          setWeight(pillar.id, Number(e.target.value))
                        }
                        className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white text-right focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span
                        className={`text-sm font-bold w-14 text-right ${color.text}`}
                      >
                        {effectivePct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={WEIGHT_MIN}
                    max={WEIGHT_MAX}
                    step={0.5}
                    value={Math.min(Math.max(weight, WEIGHT_MIN), WEIGHT_MAX)}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setWeight(pillar.id, Number(e.target.value))
                    }
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: `linear-gradient(to right, ${color.hex} 0%, ${color.hex} ${sliderPct}%, #ffffff15 ${sliderPct}%, #ffffff15 100%)`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-600 mt-6">
            Weight changes apply to future submissions only — saved assessment
            scores are never recomputed.
          </p>
        </div>

        {/* Score Interpretation */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-1">
            Score Interpretation
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Total scores (0–100) are mapped to a color band by the cutoffs
            below.
          </p>

          {/* Cutoffs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-1.5">
                Orange starts at
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={orangeMinDraft}
                disabled={!isEditing}
                onChange={(e) => {
                  setSuccess(null);
                  setOrangeMinDraft(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-1.5">
                Amber starts at
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={amberMinDraft}
                disabled={!isEditing}
                onChange={(e) => {
                  setSuccess(null);
                  setAmberMinDraft(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-lime-400 mb-1.5">
                Lt Green starts at
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={lightGreenMinDraft}
                disabled={!isEditing}
                onChange={(e) => {
                  setSuccess(null);
                  setLightGreenMinDraft(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-lime-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1.5">
                Green starts at
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={greenMinDraft}
                disabled={!isEditing}
                onChange={(e) => {
                  setSuccess(null);
                  setGreenMinDraft(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Bands */}
          <div className="space-y-3">
            {bands.map((band) => {
              const currentDraft = bandDrafts[band.key] ?? { label: "", description: "" };
              const desc = currentDraft.description ?? "";
              const label = currentDraft.label ?? "";

              return (
                <div
                  key={band.key}
                  className={`rounded-xl border p-4 ${band.border}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-1 h-16 rounded-full flex-shrink-0 mt-1 ${band.barColor}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-gray-400 flex-shrink-0">
                          {band.range}:
                        </span>
                        <input
                          type="text"
                          maxLength={50}
                          value={label}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setBandDraft(band.key, { label: e.target.value })
                          }
                          className={`flex-1 min-w-0 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase focus:outline-none focus:border-white/30 disabled:opacity-60 disabled:cursor-not-allowed ${band.labelColor}`}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 mb-1">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">
                          Overall Band Description (Page 2 PDF Summary)
                        </span>
                        <span className={`text-[10px] ${desc.length >= 180 ? 'text-amber-400 font-semibold' : 'text-gray-500'}`}>
                          {desc.length} / 200 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={200}
                        value={desc}
                        disabled={!isEditing}
                        onChange={(e) =>
                          setBandDraft(band.key, { description: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 focus:outline-none focus:border-white/30 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-600 mt-6">
            Applies to assessments submitted after saving — existing results
            keep their stored band.
          </p>
        </div>
      </div>
    </div>
  );
}
