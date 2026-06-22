"use client";

// Helper tab components for /admin/subscription. Kept in a sibling file so
// the page route stays focused on the tab shell + pay-per-use logic.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Edit3,
  ExternalLink,
  Inbox,
  Loader,
  MessageSquare,
  Percent,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  adminConfirmConsultationBooking,
  adminCreateConsultationTier,
  adminCreateSubscriptionPlan,
  adminDeleteConsultationTier,
  adminDeleteSubscriptionPlan,
  adminGetClientHistory,
  adminListConsultationBookings,
  adminListConsultationTiers,
  adminListSubscriptionPlans,
  adminUpdateConsultationBookingNotes,
  adminUpdateConsultationBookingStatus,
  adminUpdateConsultationTier,
  adminUpdateSubscriptionPlan,
  getAdminAppSettings,
  updateAdminAppSettings,
  type AdminBookingRow,
  type AdminClientHistoryResponse,
  type AppSettingsPayload,
  type CompletedResultOption,
  type ConsultationBookingStatus,
  type ConsultationTierAdmin,
  type CreateConsultationTierInput,
  type CreateSubscriptionPlanInput,
  type SubscriptionPlanAdmin,
} from "@/lib/authClient";
import { formatMoney } from "@/lib/utils";

// ═════════════════════════════════════════════════════════════════════════
// Shared editor modal field
// ═════════════════════════════════════════════════════════════════════════

function ModalField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-gray-600">{hint}</span>}
    </label>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Subscription tiers tab
// ═════════════════════════════════════════════════════════════════════════

type SubDraft = {
  id: string | null;
  tier: number;
  name: string;
  description: string;
  priceUsd: number;
  phase2aPerMonth: number;
  phase2bPerMonth: number;
  consultationsPerMonth: number;
  features: string;
  // % off the monthly × 12 sticker when the user picks ANNUAL on the FE
  // toggle. 0 disables the annual option for this tier.
  annualDiscountPct: number;
  isActive: boolean;
  displayOrder: number;
};

const subPlanToDraft = (p: SubscriptionPlanAdmin): SubDraft => ({
  id: p.id,
  tier: p.tier,
  name: p.name,
  description: p.description,
  priceUsd: p.priceUsd,
  phase2aPerMonth: p.phase2aPerMonth,
  phase2bPerMonth: p.phase2bPerMonth,
  consultationsPerMonth: p.consultationsPerMonth,
  features: p.features.join("\n"),
  annualDiscountPct: p.annualDiscountPct,
  isActive: p.isActive,
  displayOrder: p.displayOrder,
});

const emptySubDraft = (suggestedTier: number): SubDraft => ({
  id: null,
  tier: suggestedTier,
  name: "",
  description: "",
  priceUsd: 0,
  phase2aPerMonth: 0,
  phase2bPerMonth: 0,
  consultationsPerMonth: 0,
  features: "",
  annualDiscountPct: 0,
  isActive: true,
  displayOrder: suggestedTier,
});

export function SubscriptionTiersTab() {
  const [plans, setPlans] = useState<SubscriptionPlanAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<SubDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListSubscriptionPlans();
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not load subscription tiers.");
      return;
    }
    setPlans(res.data.plans);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const nextTier = useMemo(
    () => plans.reduce((acc, p) => Math.max(acc, p.tier), 0) + 1,
    [plans],
  );

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return setError("Name is required.");
    if (editing.priceUsd <= 0) return setError("Price must be greater than zero.");

    setSaving(true);
    setError(null);
    if (editing.annualDiscountPct < 0 || editing.annualDiscountPct > 80) {
      return setError("Annual discount must be between 0 and 80%.");
    }
    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      priceUsd: editing.priceUsd,
      phase2aPerMonth: editing.phase2aPerMonth,
      phase2bPerMonth: editing.phase2bPerMonth,
      consultationsPerMonth: editing.consultationsPerMonth,
      features: editing.features.split("\n").map((s) => s.trim()).filter(Boolean),
      annualDiscountPct: editing.annualDiscountPct,
      isActive: editing.isActive,
      displayOrder: editing.displayOrder,
    };
    const res = editing.id
      ? await adminUpdateSubscriptionPlan(editing.id, payload)
      : await adminCreateSubscriptionPlan({
          ...payload,
          tier: editing.tier,
        } satisfies CreateSubscriptionPlanInput);
    setSaving(false);

    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not save tier.");
      return;
    }
    setSuccess(`Saved ${res.data.plan.name}.`);
    setEditing(null);
    await refresh();
  };

  const handleDeactivate = async (p: SubscriptionPlanAdmin) => {
    if (!p.isActive) return;
    if (!window.confirm(
      `Deactivate "${p.name}"? New users won't see it, but existing subscribers keep their plan until they cancel.`,
    )) return;
    setDeletingId(p.id);
    setError(null);
    const res = await adminDeleteSubscriptionPlan(p.id);
    setDeletingId(null);
    if (res.error) {
      setError(res.error.message ?? "Could not deactivate tier.");
      return;
    }
    setSuccess(`${p.name} deactivated.`);
    await refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Subscription tiers</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Recurring monthly plans. Paystack plan codes are populated
            automatically on first save (USD) or first NG subscriber (NGN).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(emptySubDraft(nextTier));
            setSuccess(null);
            setError(null);
          }}
          disabled={editing !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          New tier
        </button>
      </div>

      {error && !editing && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-white/5 bg-[#1C1F2E]">
          <Loader className="h-5 w-5 animate-spin text-blue-300" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-10 text-center text-sm text-gray-400">
          No subscription tiers configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan, idx) => (
            <SubscriptionTierCard
              key={plan.id}
              plan={plan}
              featured={idx === Math.floor(plans.length / 2)}
              onEdit={() => {
                setEditing(subPlanToDraft(plan));
                setSuccess(null);
                setError(null);
              }}
              onDeactivate={() => void handleDeactivate(plan)}
              deactivating={deletingId === plan.id}
            />
          ))}
        </div>
      )}

      {editing && (
        <SubscriptionEditorModal
          draft={editing}
          saving={saving}
          error={error}
          onChange={setEditing}
          onClose={() => {
            if (saving) return;
            setEditing(null);
            setError(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function SubscriptionTierCard({
  plan,
  featured,
  onEdit,
  onDeactivate,
  deactivating,
}: {
  plan: SubscriptionPlanAdmin;
  featured?: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  deactivating: boolean;
}) {
  return (
    <section
      className={`rounded-xl border p-6 bg-[#1C1F2E] ${
        plan.isActive
          ? featured
            ? "border-blue-500/40"
            : "border-white/5"
          : "border-white/5 opacity-60"
      }`}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
              featured ? "bg-blue-500/10 text-blue-300" : "bg-white/5 text-gray-400"
            }`}
          >
            Tier {plan.tier}
          </span>
          {!plan.isActive && (
            <span className="ml-2 inline-flex rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Inactive
            </span>
          )}
          <h3 className="mt-3 text-2xl font-bold text-white">{plan.name}</h3>
          {plan.description && (
            <p className="mt-1 text-sm text-gray-400">{plan.description}</p>
          )}
        </div>
        <Crown className="h-6 w-6 text-orange-300" />
      </div>

      <div className="mb-6">
        <div className="text-3xl font-bold text-white">
          {formatMoney(plan.priceUsd, "USD")}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Per month
        </div>
      </div>

      <ul className="mb-6 space-y-2">
        <li className="flex items-start gap-2 text-sm text-gray-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
          <span>{plan.phase2aPerMonth} Phase 2A per month</span>
        </li>
        <li className="flex items-start gap-2 text-sm text-gray-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
          <span>{plan.phase2bPerMonth} Phase 2B per month</span>
        </li>
        <li className="flex items-start gap-2 text-sm text-gray-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
          <span>{plan.consultationsPerMonth} consultations per month</span>
        </li>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mb-4 space-y-0.5 text-[10px] font-mono text-gray-600">
        <p>
          USD plan code:{" "}
          <span className={plan.paystackPlanCodeUsd ? "text-emerald-400" : "text-amber-400"}>
            {plan.paystackPlanCodeUsd ?? "not synced"}
          </span>
        </p>
        <p>
          NGN plan code:{" "}
          <span className={plan.paystackPlanCodeNgn ? "text-emerald-400" : "text-gray-500"}>
            {plan.paystackPlanCodeNgn ?? "lazy — on first NG subscriber"}
          </span>
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            featured
              ? "bg-white text-gray-950 hover:bg-gray-100"
              : "border border-white/10 text-gray-200 hover:bg-white/5"
          }`}
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
        {plan.isActive && (
          <button
            type="button"
            onClick={onDeactivate}
            disabled={deactivating}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 px-3 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
            aria-label="Deactivate tier"
          >
            {deactivating ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </section>
  );
}

function SubscriptionEditorModal({
  draft,
  saving,
  error,
  onChange,
  onClose,
  onSave,
}: {
  draft: SubDraft;
  saving: boolean;
  error: string | null;
  onChange: (d: SubDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const set = <K extends keyof SubDraft>(key: K, value: SubDraft[K]) =>
    onChange({ ...draft, [key]: value });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-white/10 bg-[#1C1F2E] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-white">
              {draft.id ? `Edit ${draft.name || "tier"}` : "New subscription tier"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Sets price + quotas for the recurring plan. Paystack plan codes
              are auto-managed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Tier number" hint={draft.id ? "Immutable after create" : ""}>
              <input
                type="number"
                min={1}
                value={draft.tier}
                disabled={Boolean(draft.id) || saving}
                onChange={(e) => set("tier", parseInt(e.target.value || "1", 10))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50 disabled:opacity-60"
              />
            </ModalField>
            <ModalField label="Display order">
              <input
                type="number"
                min={0}
                value={draft.displayOrder}
                disabled={saving}
                onChange={(e) => set("displayOrder", parseInt(e.target.value || "0", 10))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField label="Name">
              <input
                value={draft.name}
                disabled={saving}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Starter"
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField label="Monthly price (USD)">
              <input
                type="number"
                step="0.01"
                min={0}
                value={draft.priceUsd}
                disabled={saving}
                onChange={(e) => set("priceUsd", parseFloat(e.target.value || "0"))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField
              label="Annual discount (%)"
              hint={
                draft.annualDiscountPct > 0
                  ? `Annual sticker: $${(draft.priceUsd * 12 * (1 - draft.annualDiscountPct / 100)).toFixed(2)}`
                  : "0 hides the annual option for this tier"
              }
            >
              <input
                type="number"
                step={1}
                min={0}
                max={80}
                value={draft.annualDiscountPct}
                disabled={saving}
                onChange={(e) =>
                  set("annualDiscountPct", parseInt(e.target.value || "0", 10))
                }
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
          </div>

          <ModalField label="Description" hint="Renders inline above the feature list">
            <textarea
              value={draft.description}
              disabled={saving}
              rows={2}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Who this tier is for."
              className="w-full resize-none rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
            />
          </ModalField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ModalField label="Phase 2A / month">
              <input
                type="number"
                min={0}
                value={draft.phase2aPerMonth}
                disabled={saving}
                onChange={(e) => set("phase2aPerMonth", parseInt(e.target.value || "0", 10))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField label="Phase 2B / month">
              <input
                type="number"
                min={0}
                value={draft.phase2bPerMonth}
                disabled={saving}
                onChange={(e) => set("phase2bPerMonth", parseInt(e.target.value || "0", 10))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField label="Consultations / month">
              <input
                type="number"
                min={0}
                value={draft.consultationsPerMonth}
                disabled={saving}
                onChange={(e) => set("consultationsPerMonth", parseInt(e.target.value || "0", 10))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
          </div>

          <ModalField label="Bonus features (one per line)" hint="Rendered after the quota lines">
            <textarea
              value={draft.features}
              disabled={saving}
              rows={4}
              onChange={(e) => set("features", e.target.value)}
              placeholder="Downloadable PDF reports&#10;Priority email support"
              className="w-full resize-none rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm font-mono text-white outline-none transition focus:border-blue-500/50"
            />
          </ModalField>

          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={draft.isActive}
              disabled={saving}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#111318]"
            />
            <span className="text-sm text-gray-300">
              Active — show in the user-facing picker
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {draft.id ? "Save changes" : "Create tier"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Consultation tiers tab
// ═════════════════════════════════════════════════════════════════════════

type ConsultDraft = {
  id: string | null;
  tier: number;
  name: string;
  description: string;
  priceUsd: number;
  durationMinutes: number;
  // PICA 2A bonus per confirmed booking — 0 disables.
  freeP2ARuns: number;
  freeP2ACreditWindowDays: number;
  isActive: boolean;
  displayOrder: number;
};

const consultTierToDraft = (t: ConsultationTierAdmin): ConsultDraft => ({
  id: t.id,
  tier: t.tier,
  name: t.name,
  description: t.description,
  priceUsd: t.priceUsd,
  durationMinutes: t.durationMinutes,
  freeP2ARuns: t.freeP2ARuns,
  freeP2ACreditWindowDays: t.freeP2ACreditWindowDays,
  isActive: t.isActive,
  displayOrder: t.displayOrder,
});

const emptyConsultDraft = (suggestedTier: number): ConsultDraft => ({
  id: null,
  tier: suggestedTier,
  name: "",
  description: "",
  priceUsd: 0,
  durationMinutes: 30,
  freeP2ARuns: 5,
  freeP2ACreditWindowDays: 90,
  isActive: true,
  displayOrder: suggestedTier,
});

export function ConsultationTiersTab() {
  const [tiers, setTiers] = useState<ConsultationTierAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<ConsultDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListConsultationTiers();
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not load consultation tiers.");
      return;
    }
    setTiers(res.data.tiers);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const nextTier = useMemo(
    () => tiers.reduce((acc, t) => Math.max(acc, t.tier), 0) + 1,
    [tiers],
  );

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return setError("Name is required.");
    if (editing.priceUsd <= 0) return setError("Price must be greater than zero.");
    if (editing.durationMinutes < 5) return setError("Duration must be at least 5 minutes.");
    if (editing.freeP2ARuns < 0) return setError("Free 2A runs cannot be negative.");
    if (editing.freeP2ACreditWindowDays < 1 || editing.freeP2ACreditWindowDays > 365) {
      return setError("Credit window must be between 1 and 365 days.");
    }

    setSaving(true);
    setError(null);
    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      priceUsd: editing.priceUsd,
      durationMinutes: editing.durationMinutes,
      freeP2ARuns: editing.freeP2ARuns,
      freeP2ACreditWindowDays: editing.freeP2ACreditWindowDays,
      isActive: editing.isActive,
      displayOrder: editing.displayOrder,
    };
    const res = editing.id
      ? await adminUpdateConsultationTier(editing.id, payload)
      : await adminCreateConsultationTier({
          ...payload,
          tier: editing.tier,
        } satisfies CreateConsultationTierInput);
    setSaving(false);

    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not save tier.");
      return;
    }
    setSuccess(`Saved ${res.data.tier.name}.`);
    setEditing(null);
    await refresh();
  };

  const handleDeactivate = async (t: ConsultationTierAdmin) => {
    if (!t.isActive) return;
    if (!window.confirm(
      `Deactivate "${t.name}"? Users won't see it on the booking form, but existing bookings keep their tier.`,
    )) return;
    setDeletingId(t.id);
    setError(null);
    const res = await adminDeleteConsultationTier(t.id);
    setDeletingId(null);
    if (res.error) {
      setError(res.error.message ?? "Could not deactivate tier.");
      return;
    }
    setSuccess(`${t.name} deactivated.`);
    await refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Consultation tiers</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            One-off advisory calls. Subscribers consume their monthly
            consultation credits automatically; everyone else pays per booking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(emptyConsultDraft(nextTier));
            setSuccess(null);
            setError(null);
          }}
          disabled={editing !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          New tier
        </button>
      </div>

      {error && !editing && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-white/5 bg-[#1C1F2E]">
          <Loader className="h-5 w-5 animate-spin text-blue-300" />
        </div>
      ) : tiers.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-10 text-center text-sm text-gray-400">
          No consultation tiers configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {tiers.map((tier, idx) => (
            <ConsultationTierCard
              key={tier.id}
              tier={tier}
              featured={idx === Math.floor(tiers.length / 2)}
              onEdit={() => {
                setEditing(consultTierToDraft(tier));
                setSuccess(null);
                setError(null);
              }}
              onDeactivate={() => void handleDeactivate(tier)}
              deactivating={deletingId === tier.id}
            />
          ))}
        </div>
      )}

      {editing && (
        <ConsultationEditorModal
          draft={editing}
          saving={saving}
          error={error}
          onChange={setEditing}
          onClose={() => {
            if (saving) return;
            setEditing(null);
            setError(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ConsultationTierCard({
  tier,
  featured,
  onEdit,
  onDeactivate,
  deactivating,
}: {
  tier: ConsultationTierAdmin;
  featured?: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  deactivating: boolean;
}) {
  return (
    <section
      className={`rounded-xl border p-6 bg-[#1C1F2E] ${
        tier.isActive
          ? featured
            ? "border-blue-500/40"
            : "border-white/5"
          : "border-white/5 opacity-60"
      }`}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
              featured ? "bg-blue-500/10 text-blue-300" : "bg-white/5 text-gray-400"
            }`}
          >
            Tier {tier.tier}
          </span>
          {!tier.isActive && (
            <span className="ml-2 inline-flex rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Inactive
            </span>
          )}
          <h3 className="mt-3 text-2xl font-bold text-white">{tier.name}</h3>
          {tier.description && (
            <p className="mt-1 text-sm text-gray-400">{tier.description}</p>
          )}
        </div>
        <MessageSquare className="h-6 w-6 text-emerald-300" />
      </div>

      <div className="mb-6">
        <div className="text-3xl font-bold text-white">
          {formatMoney(tier.priceUsd, "USD")}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
          {tier.durationMinutes} min · one-time
        </div>
      </div>

      <ul className="mb-6 space-y-2">
        <li className="flex items-start gap-2 text-sm text-gray-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
          <span>{tier.durationMinutes}-minute working session</span>
        </li>
        <li className="flex items-start gap-2 text-sm text-gray-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
          <span>Covered by subscription credits when available</span>
        </li>
      </ul>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            featured
              ? "bg-white text-gray-950 hover:bg-gray-100"
              : "border border-white/10 text-gray-200 hover:bg-white/5"
          }`}
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
        {tier.isActive && (
          <button
            type="button"
            onClick={onDeactivate}
            disabled={deactivating}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 px-3 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
            aria-label="Deactivate tier"
          >
            {deactivating ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </section>
  );
}

function ConsultationEditorModal({
  draft,
  saving,
  error,
  onChange,
  onClose,
  onSave,
}: {
  draft: ConsultDraft;
  saving: boolean;
  error: string | null;
  onChange: (d: ConsultDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const set = <K extends keyof ConsultDraft>(key: K, value: ConsultDraft[K]) =>
    onChange({ ...draft, [key]: value });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-white/10 bg-[#1C1F2E] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-white">
              {draft.id ? `Edit ${draft.name || "tier"}` : "New consultation tier"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Sets price (USD) and duration. Customers in NG pay the NGN
              equivalent via the live FX rate.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Tier number" hint={draft.id ? "Immutable after create" : ""}>
              <input
                type="number"
                min={1}
                value={draft.tier}
                disabled={Boolean(draft.id) || saving}
                onChange={(e) => set("tier", parseInt(e.target.value || "1", 10))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50 disabled:opacity-60"
              />
            </ModalField>
            <ModalField label="Display order">
              <input
                type="number"
                min={0}
                value={draft.displayOrder}
                disabled={saving}
                onChange={(e) => set("displayOrder", parseInt(e.target.value || "0", 10))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField label="Name">
              <input
                value={draft.name}
                disabled={saving}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Strategy Session"
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField label="Price (USD)">
              <input
                type="number"
                step="0.01"
                min={0}
                value={draft.priceUsd}
                disabled={saving}
                onChange={(e) => set("priceUsd", parseFloat(e.target.value || "0"))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField label="Duration (minutes)">
              <input
                type="number"
                min={5}
                max={600}
                step={5}
                value={draft.durationMinutes}
                disabled={saving}
                onChange={(e) => set("durationMinutes", parseInt(e.target.value || "30", 10))}
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField
              label="Free PICA 2A runs per booking"
              hint="0 disables the bonus for this tier"
            >
              <input
                type="number"
                min={0}
                max={50}
                step={1}
                value={draft.freeP2ARuns}
                disabled={saving}
                onChange={(e) =>
                  set("freeP2ARuns", parseInt(e.target.value || "0", 10))
                }
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
            <ModalField
              label="Credit validity (days)"
              hint="How long after confirm the credits last"
            >
              <input
                type="number"
                min={1}
                max={365}
                step={1}
                value={draft.freeP2ACreditWindowDays}
                disabled={saving}
                onChange={(e) =>
                  set(
                    "freeP2ACreditWindowDays",
                    parseInt(e.target.value || "90", 10),
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
              />
            </ModalField>
          </div>

          <ModalField label="Description" hint="Shown inline above the booking form's tier card">
            <textarea
              value={draft.description}
              disabled={saving}
              rows={2}
              onChange={(e) => set("description", e.target.value)}
              placeholder="A 60-minute working session to walk through findings."
              className="w-full resize-none rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
            />
          </ModalField>

          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={draft.isActive}
              disabled={saving}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#111318]"
            />
            <span className="text-sm text-gray-300">
              Active — show on the booking form
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {draft.id ? "Save changes" : "Create tier"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Consultations inbox tab — admin booking list with status filter tabs.
// Ported wholesale from the prior standalone /admin/consultations page.
// ═════════════════════════════════════════════════════════════════════════

const STATUS_TABS: { key: ConsultationBookingStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "REQUESTED", label: "Requested" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "ATTENDED", label: "Attended" },
  { key: "NO_SHOW", label: "No show" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_TONE: Record<string, string> = {
  REQUESTED: "bg-amber-500/15 text-amber-300",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300",
  ATTENDED: "bg-blue-500/15 text-blue-300",
  NO_SHOW: "bg-rose-500/15 text-rose-300",
  CANCELLED: "bg-gray-500/15 text-gray-300",
};

const formatBookingDateTime = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatBookingDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const labelForResult = (r: CompletedResultOption) => {
  const phase = r.phase === "PHASE2B" ? "Phase 2B" : "Phase 2A";
  const pillar = r.pillarName ?? (r.phase === "PHASE2B" ? r.pillarCode ?? "Pillar" : "All pillars");
  return `${pillar} · ${phase} · ${formatBookingDate(r.generatedAt)} · ${Math.round(r.totalScore)} ${r.colorBand}`;
};

export function ConsultationsInboxTab() {
  const [filter, setFilter] = useState<ConsultationBookingStatus | "ALL">("ALL");
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<AdminBookingRow | null>(null);
  const [viewing, setViewing] = useState<AdminBookingRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListConsultationBookings(
      filter === "ALL" ? undefined : { status: filter, pageSize: 50 },
    );
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not load bookings.");
      return;
    }
    setBookings(res.data.bookings);
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of bookings) map[b.status] = (map[b.status] ?? 0) + 1;
    return map;
  }, [bookings]);

  const handleConfirm = async (
    booking: AdminBookingRow,
    scheduledAt: string,
    meetingLink: string,
  ) => {
    setBusyId(booking.id);
    setError(null);
    const res = await adminConfirmConsultationBooking(booking.id, {
      scheduledAt,
      meetingLink,
    });
    setBusyId(null);
    setConfirming(null);
    if (res.error) {
      setError(res.error.message ?? "Could not confirm booking.");
      return;
    }
    setSuccess(`Confirmed booking for ${booking.user.email}.`);
    await refresh();
  };

  const handleStatus = async (
    booking: AdminBookingRow,
    status: "ATTENDED" | "NO_SHOW" | "CANCELLED",
  ) => {
    const ok = status === "CANCELLED"
      ? window.confirm(`Cancel this booking for ${booking.user.email}?`)
      : true;
    if (!ok) return;

    setBusyId(booking.id);
    setError(null);
    const res = await adminUpdateConsultationBookingStatus(booking.id, status);
    setBusyId(null);
    if (res.error) {
      setError(res.error.message ?? "Could not update booking.");
      return;
    }
    setSuccess(`Booking marked ${status.toLowerCase().replace("_", " ")}.`);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Consultations inbox</h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Booking inbox. Confirm requested calls with a time and a meeting
          link; the user is emailed automatically.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-white/5">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === "ALL" ? bookings.length : counts[tab.key];
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition ${
                active ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
              {count ? (
                <span className="ml-2 font-mono text-[10px] text-gray-500">{count}</span>
              ) : null}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-white/5 bg-[#1C1F2E]">
          <Loader className="h-5 w-5 animate-spin text-blue-300" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-10 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">
            {filter === "ALL"
              ? "No bookings yet."
              : `No bookings in ${filter.toLowerCase().replace("_", " ")}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              busy={busyId === b.id}
              onConfirm={() => setConfirming(b)}
              onMarkAttended={() => handleStatus(b, "ATTENDED")}
              onMarkNoShow={() => handleStatus(b, "NO_SHOW")}
              onCancel={() => handleStatus(b, "CANCELLED")}
              onViewClient={() => setViewing(b)}
            />
          ))}
        </div>
      )}

      {confirming && (
        <ConfirmBookingModal
          booking={confirming}
          busy={busyId === confirming.id}
          onConfirm={(scheduledAt, meetingLink) =>
            handleConfirm(confirming, scheduledAt, meetingLink)
          }
          onClose={() => setConfirming(null)}
        />
      )}

      {viewing && (
        <ClientHistoryModal
          booking={viewing}
          onClose={() => setViewing(null)}
          onSaved={async (msg) => {
            setSuccess(msg);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function BookingRow({
  booking,
  busy,
  onConfirm,
  onMarkAttended,
  onMarkNoShow,
  onCancel,
  onViewClient,
}: {
  booking: AdminBookingRow;
  busy: boolean;
  onConfirm: () => void;
  onMarkAttended: () => void;
  onMarkNoShow: () => void;
  onCancel: () => void;
  onViewClient: () => void;
}) {
  const paymentPending =
    booking.payment !== null && booking.payment.status !== "SUCCESS";
  const userName = [booking.user.firstName, booking.user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1C1F2E] p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_TONE[booking.status] ?? ""}`}
            >
              {booking.status.replace("_", " ")}
            </span>
            {booking.coveredBySubscription && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-300">
                <Crown className="h-3 w-3" />
                Subscription
              </span>
            )}
            {paymentPending && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Payment pending
              </span>
            )}
            {booking.payment?.status === "SUCCESS" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                Paid {formatMoney(booking.payment.amount, booking.payment.currency === "NGN" ? "NGN" : "USD")}
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-white">{booking.topic}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            <span className="font-semibold text-gray-400">
              {userName || booking.user.businessName || booking.user.email}
            </span>{" "}
            · {booking.user.email}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>{booking.tier.name}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {booking.tier.durationMinutes} min
            </span>
            <span>· Requested {formatBookingDate(booking.requestedAt)}</span>
          </p>
        </div>
      </div>

      {booking.relatedResult && (
        <p className="mb-2 flex items-start gap-1.5 text-xs text-gray-400">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-orange-400" />
          <span>Related to {labelForResult(booking.relatedResult)}</span>
        </p>
      )}

      {booking.notes && (
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          <span className="font-semibold text-gray-500">Notes:</span> {booking.notes}
        </p>
      )}

      {booking.preferredTimes && (
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          <span className="font-semibold text-gray-500">Preferred:</span>{" "}
          {booking.preferredTimes}
        </p>
      )}

      {booking.status === "CONFIRMED" && booking.scheduledAt && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <Calendar className="h-3.5 w-3.5" />
            Scheduled
          </p>
          <p className="text-sm font-medium text-white">
            {formatBookingDateTime(booking.scheduledAt)}
          </p>
          {booking.meetingLink && (
            <a
              href={booking.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              {booking.meetingLink} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {booking.status === "REQUESTED" && !paymentPending && (
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Confirm
          </button>
        )}
        {booking.status === "CONFIRMED" && (
          <>
            <button
              onClick={onMarkAttended}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/10 disabled:opacity-60"
            >
              Mark attended
            </button>
            <button
              onClick={onMarkNoShow}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
            >
              Mark no-show
            </button>
          </>
        )}
        {/* View client — always available regardless of status, so admins can
            look back at history and add notes even on ATTENDED / CANCELLED
            rows. */}
        <button
          onClick={onViewClient}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/10"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          View client
        </button>
        {(booking.status === "REQUESTED" || booking.status === "CONFIRMED") && (
          <button
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:bg-white/5 disabled:opacity-60"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </button>
        )}
        {booking.adminNotes && booking.adminNotesUpdatedAt && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-indigo-300">
            <MessageSquare className="h-3 w-3" />
            Notes saved · {formatBookingDate(booking.adminNotesUpdatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function ConfirmBookingModal({
  booking,
  busy,
  onConfirm,
  onClose,
}: {
  booking: AdminBookingRow;
  busy: boolean;
  onConfirm: (scheduledAt: string, meetingLink: string) => void;
  onClose: () => void;
}) {
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [meetingLink, setMeetingLink] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    setLocalError(null);
    if (!scheduledAt) {
      setLocalError("Pick a date and time.");
      return;
    }
    if (!/^https?:\/\//i.test(meetingLink.trim())) {
      setLocalError("Meeting link must be a full URL (https://…).");
      return;
    }
    const iso = new Date(scheduledAt).toISOString();
    onConfirm(iso, meetingLink.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1C1F2E] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-xl font-bold text-white">Confirm booking</h2>
        <p className="mb-5 text-sm text-gray-400">
          {booking.user.email} · {booking.tier.name} ·{" "}
          {booking.tier.durationMinutes} min
        </p>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Scheduled at
          </span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Meeting link
          </span>
          <input
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className="w-full rounded-lg border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white"
          />
        </label>

        {localError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader className="h-4 w-4 animate-spin" />}
            Confirm & send email
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Client History modal — backs the "View client" button on each booking row.
// Fetches the booking user's identity + last 5 completed assessment sessions
// (with R2 PDF download links) and gives the admin a textarea to save free-
// form feedback against the booking. First non-empty save emails the user
// once; subsequent edits never re-email (single-shot gate lives on the BE).
// ═════════════════════════════════════════════════════════════════════════

function ClientHistoryModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: AdminBookingRow;
  onClose: () => void;
  onSaved: (message: string) => Promise<void> | void;
}) {
  const [history, setHistory] = useState<AdminClientHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notes, setNotes] = useState(booking.adminNotes ?? "");
  const [savedNotesAt, setSavedNotesAt] = useState<string | null>(
    booking.adminNotesUpdatedAt,
  );
  const [savedAuthor, setSavedAuthor] = useState(booking.adminNotesUpdatedBy);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await adminGetClientHistory(booking.id);
      if (cancelled) return;
      setLoading(false);
      if (res.error || !res.data) {
        setLoadError(res.error?.message ?? "Could not load client history.");
        return;
      }
      setHistory(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [booking.id]);

  const dirty = notes !== (booking.adminNotes ?? "");

  const submit = async () => {
    setSaveError(null);
    setSaving(true);
    const res = await adminUpdateConsultationBookingNotes(booking.id, notes);
    setSaving(false);
    if (res.error || !res.data) {
      setSaveError(res.error?.message ?? "Could not save notes.");
      return;
    }
    // Surface "Notes saved" inline + bubble a toast to the inbox via onSaved.
    setSavedNotesAt(res.data.booking.adminNotesUpdatedAt);
    setSavedAuthor(res.data.booking.adminNotesUpdatedBy);
    await onSaved(`Notes saved for ${booking.user.email}.`);
  };

  const userName = [history?.user.firstName, history?.user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1C1F2E] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Client history</h2>
            <p className="mt-1 text-xs text-gray-500">
              Booking: <span className="text-gray-300">{booking.topic}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User identity card. Pulled from history fetch so we don't trust
            the booking row alone (defensive: lets a later admin endpoint
            grow without forcing us to thread more fields through the row). */}
        {loading ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-white/5 bg-[#111318]">
            <Loader className="h-5 w-5 animate-spin text-blue-300" />
          </div>
        ) : loadError ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{loadError}</span>
          </div>
        ) : history ? (
          <>
            <div className="mb-5 rounded-xl border border-white/5 bg-[#111318] p-4">
              <p className="text-sm font-semibold text-white">
                {userName || history.user.businessName || history.user.email}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{history.user.email}</p>
              {history.user.businessName && userName && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {history.user.businessName}
                </p>
              )}
              <p className="mt-2 text-[11px] uppercase tracking-widest text-gray-600">
                Client since {formatBookingDate(history.user.createdAt)}
              </p>
            </div>

            {/* Last-5 sessions. Empty state is common for brand-new users —
                surface that explicitly so the admin doesn't think the
                request failed silently. */}
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Recent assessments
            </p>
            {history.results.length === 0 ? (
              <div className="mb-5 rounded-xl border border-white/5 bg-[#111318] p-4 text-xs text-gray-500">
                No completed assessments yet.
              </div>
            ) : (
              <div className="mb-5 space-y-2">
                {history.results.map((r) => (
                  <div
                    key={r.sessionResultId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#111318] p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white">
                        {r.phase} {r.pillarCode ? `· ${r.pillarCode}` : ""}
                      </p>
                      <p className="mt-0.5 text-gray-500">
                        {Math.round(r.totalScore)} · {r.colorBand}
                        {r.generatedAt && ` · ${formatBookingDate(r.generatedAt)}`}
                      </p>
                    </div>
                    {r.reportPdfUrl ? (
                      <a
                        href={r.reportPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 px-3 py-1.5 text-[11px] font-semibold text-indigo-300 transition hover:bg-indigo-500/10"
                      >
                        Download PDF
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-gray-600">
                        No PDF
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}

        {/* Notes textarea + save. Save button is disabled until the field is
            actually dirty so re-saves don't accidentally re-emit the "Notes
            saved" toast. Email gate lives on the BE (single-shot via
            adminNotesNotifiedAt). */}
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Admin notes (visible to the client)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="e.g. Discussed onboarding bottleneck. Recommended starting Phase 2B Talent pillar next month — will follow up after their next 2A."
          className="w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500/40 focus:outline-none"
        />
        <p className="mt-1 text-[10px] text-gray-600">
          {notes.length} / 5000 characters
        </p>

        {savedNotesAt && !dirty && (
          <p className="mt-2 text-[11px] text-emerald-300">
            Saved {formatBookingDate(savedNotesAt)}
            {savedAuthor && (savedAuthor.firstName || savedAuthor.lastName)
              ? ` by ${[savedAuthor.firstName, savedAuthor.lastName].filter(Boolean).join(" ")}`
              : ""}
            . The user is emailed only once — re-edits won&apos;t re-notify.
          </p>
        )}

        {saveError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-60"
          >
            Close
          </button>
          <button
            onClick={submit}
            disabled={saving || !dirty}
            className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save notes
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// App Settings tab — FX rate, storefront toggles, and the Phase 2B bundle
// discount (BE-1). Moved here from /admin/settings because it's all payment
// config; the page is gated by ledger:read/ledger:write.
// ═════════════════════════════════════════════════════════════════════════

export function AppSettingsTab() {
  const [settings, setSettings] = useState<AppSettingsPayload | null>(null);
  const [draftRate, setDraftRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingSection, setTogglingSection] = useState<
    "payPerUse" | "subscription" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Phase 2B bundle discount drafts.
  const [draftPct, setDraftPct] = useState("");
  const [draftMax, setDraftMax] = useState("");
  const [savingDiscount, setSavingDiscount] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getAdminAppSettings();
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not load app settings.");
      return;
    }
    setSettings(res.data.settings);
    setDraftRate(String(res.data.settings.usdToNgn));
    setDraftPct(String(res.data.settings.phase2bDiscountPctPerPillar));
    setDraftMax(String(res.data.settings.phase2bDiscountMaxPillars));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const parsedRate = Number(draftRate);
  const rateValid =
    Number.isFinite(parsedRate) && parsedRate > 0 && parsedRate <= 1_000_000;
  const rateDirty = settings ? Math.abs(parsedRate - settings.usdToNgn) > 0.0001 : false;

  const parsedPct = Number(draftPct);
  const parsedMax = Number(draftMax);
  const pctValid = Number.isInteger(parsedPct) && parsedPct >= 0 && parsedPct <= 100;
  const maxValid = Number.isInteger(parsedMax) && parsedMax >= 1 && parsedMax <= 7;
  const discountDirty = settings
    ? parsedPct !== settings.phase2bDiscountPctPerPillar ||
      parsedMax !== settings.phase2bDiscountMaxPillars
    : false;

  const formatNgnPreview = (usd: number) => {
    if (!Number.isFinite(usd) || !Number.isFinite(parsedRate)) return "—";
    const ngn = usd * parsedRate;
    return `₦${ngn.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };

  const formatUpdatedAt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleSaveRate = async () => {
    if (!rateValid) {
      setError("Enter a rate between 0 and 1,000,000.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const res = await updateAdminAppSettings({ usdToNgn: parsedRate });
    setSaving(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not save app settings.");
      return;
    }
    setSettings(res.data.settings);
    setDraftRate(String(res.data.settings.usdToNgn));
    setSuccess(`Rate updated — $1 = ₦${res.data.settings.usdToNgn.toLocaleString()}.`);
  };

  const handleSaveDiscount = async () => {
    if (!pctValid || !maxValid) {
      setError("Discount must be 0–100% and the cap 1–7 pillars.");
      return;
    }
    setSavingDiscount(true);
    setError(null);
    setSuccess(null);
    const res = await updateAdminAppSettings({
      phase2bDiscountPctPerPillar: parsedPct,
      phase2bDiscountMaxPillars: parsedMax,
    });
    setSavingDiscount(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not save discount config.");
      return;
    }
    setSettings(res.data.settings);
    setDraftPct(String(res.data.settings.phase2bDiscountPctPerPillar));
    setDraftMax(String(res.data.settings.phase2bDiscountMaxPillars));
    setSuccess("Phase 2B bundle discount updated.");
  };

  const handleToggleSection = async (
    key: "payPerUseActive" | "subscriptionActive",
    next: boolean,
  ) => {
    if (!settings) return;
    setTogglingSection(key === "payPerUseActive" ? "payPerUse" : "subscription");
    setError(null);
    setSuccess(null);
    const res = await updateAdminAppSettings({ [key]: next });
    setTogglingSection(null);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not update section toggle.");
      return;
    }
    setSettings(res.data.settings);
    const label = key === "payPerUseActive" ? "Pay-per-use" : "Subscription";
    setSuccess(`${label} section ${next ? "enabled" : "disabled"}.`);
  };

  // Live discount ladder preview for the drafted pct/cap. The cap is the point
  // beyond which the discount stops growing (not surfaced to customers).
  const ladder = useMemo(() => {
    if (!pctValid || !maxValid) return [];
    return [1, 2, 3, 4, 5, 6, 7].map((count) => {
      const extra = Math.max(0, Math.min(count, parsedMax) - 1);
      const pct = Math.min(100, extra * parsedPct);
      return { count, pct, capped: count > parsedMax };
    });
  }, [parsedPct, parsedMax, pctValid, maxValid]);

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {error && (
        <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* USD → NGN rate */}
      <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-6">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-blue-300" />
          <h2 className="text-base font-bold text-white">USD → NGN exchange rate</h2>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Used wherever the platform quotes a Naira charge. Keep it close to
          the live Paystack rate — large drifts will under-collect or refund-loop.
        </p>

        <label className="block mb-5">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            1 USD =
          </span>
          <div className="flex items-stretch max-w-xs">
            <span className="inline-flex items-center px-3 rounded-l-lg bg-[#111318] border border-white/10 border-r-0 text-sm text-gray-400">
              ₦
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={draftRate}
              disabled={saving}
              onChange={(e) => setDraftRate(e.target.value)}
              className="flex-1 bg-[#111318] border border-white/10 rounded-r-lg px-3 py-2 text-sm text-white"
            />
          </div>
          {!rateValid && (
            <span className="block text-[10px] text-rose-300 mt-1">
              Rate must be a positive number ≤ 1,000,000.
            </span>
          )}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
          {[
            { usd: 50, label: "Quick Consult" },
            { usd: 100, label: "Strategy Session" },
            { usd: 1200, label: "Phase 2A" },
          ].map((p) => (
            <div
              key={p.label}
              className="rounded-lg bg-[#111318] border border-white/5 px-3 py-2.5"
            >
              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                {p.label}
              </p>
              <p className="text-sm font-semibold text-white mt-0.5">
                ${p.usd.toLocaleString()}{" "}
                <span className="text-gray-500 font-normal">→</span>{" "}
                <span className="text-blue-300">{formatNgnPreview(p.usd)}</span>
              </p>
            </div>
          ))}
        </div>

        {settings && (
          <p className="text-[11px] text-gray-500 mb-5 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Last updated {formatUpdatedAt(settings.updatedAt)}
            {settings.updatedBy ? ` by ${settings.updatedBy}` : ""}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (settings) {
                setDraftRate(String(settings.usdToNgn));
                setError(null);
              }
            }}
            disabled={saving || !rateDirty}
            className="px-4 py-2.5 rounded-lg border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition disabled:opacity-40"
          >
            Reset
          </button>
          <button
            onClick={handleSaveRate}
            disabled={saving || !rateDirty || !rateValid}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save rate
          </button>
        </div>
      </div>

      {/* Phase 2B bundle discount (BE-1) */}
      <div className="mt-5 rounded-xl border border-white/5 bg-[#1C1F2E] p-6">
        <div className="flex items-center gap-2 mb-1">
          <Percent className="w-4 h-4 text-blue-300" />
          <h2 className="text-base font-bold text-white">Phase 2B bundle discount</h2>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          When a user buys multiple Phase 2B pillars in one checkout, each extra
          pillar shaves a percentage off the bundle total. The cap is the number
          of pillars beyond which the discount stops growing — customers are not
          told about it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
              % off per extra pillar
            </span>
            <div className="flex items-stretch">
              <input
                type="number"
                step="1"
                min={0}
                max={100}
                value={draftPct}
                disabled={savingDiscount}
                onChange={(e) => setDraftPct(e.target.value)}
                className="flex-1 bg-[#111318] border border-white/10 rounded-l-lg px-3 py-2 text-sm text-white"
              />
              <span className="inline-flex items-center px-3 rounded-r-lg bg-[#111318] border border-white/10 border-l-0 text-sm text-gray-400">
                %
              </span>
            </div>
            {!pctValid && (
              <span className="block text-[10px] text-rose-300 mt-1">
                Must be an integer 0–100.
              </span>
            )}
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
              Cap (max pillars counted)
            </span>
            <input
              type="number"
              step="1"
              min={1}
              max={7}
              value={draftMax}
              disabled={savingDiscount}
              onChange={(e) => setDraftMax(e.target.value)}
              className="w-full bg-[#111318] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
            {!maxValid && (
              <span className="block text-[10px] text-rose-300 mt-1">
                Must be an integer 1–7.
              </span>
            )}
          </label>
        </div>

        {/* Live ladder preview */}
        {ladder.length > 0 && (
          <div className="mb-5 rounded-lg border border-white/5 bg-[#111318] p-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
              Discount ladder preview
            </p>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {ladder.map(({ count, pct, capped }) => (
                <div
                  key={count}
                  className={`rounded-md px-1 py-1.5 ${
                    capped ? "bg-white/[0.02]" : "bg-white/5"
                  }`}
                  title={capped ? "Beyond the cap — discount no longer grows" : undefined}
                >
                  <p className="text-[10px] text-gray-500">{count}p</p>
                  <p className={`text-sm font-bold ${capped ? "text-gray-500" : "text-emerald-300"}`}>
                    {pct}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (settings) {
                setDraftPct(String(settings.phase2bDiscountPctPerPillar));
                setDraftMax(String(settings.phase2bDiscountMaxPillars));
                setError(null);
              }
            }}
            disabled={savingDiscount || !discountDirty}
            className="px-4 py-2.5 rounded-lg border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition disabled:opacity-40"
          >
            Reset
          </button>
          <button
            onClick={handleSaveDiscount}
            disabled={savingDiscount || !discountDirty || !pctValid || !maxValid}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {savingDiscount ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save discount
          </button>
        </div>
      </div>

      {/* Storefront sections */}
      {settings && (
        <div className="mt-5 rounded-xl border border-white/5 bg-[#1C1F2E] p-6">
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="w-4 h-4 text-blue-300" />
            <h2 className="text-base font-bold text-white">Storefront sections</h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Hide an entire section from the public pricing page. At least one
            section must stay live — the toggle for the last active section is
            locked.
          </p>

          <div className="space-y-3">
            <SectionToggleRow
              label="Pay-per-use"
              caption="One-off Phase 2A and Phase 2B charges."
              active={settings.payPerUseActive}
              busy={togglingSection === "payPerUse"}
              locked={settings.payPerUseActive && !settings.subscriptionActive}
              onToggle={(next) => void handleToggleSection("payPerUseActive", next)}
            />
            <SectionToggleRow
              label="Subscription"
              caption="Recurring monthly plans (Starter / Growth / Scale)."
              active={settings.subscriptionActive}
              busy={togglingSection === "subscription"}
              locked={settings.subscriptionActive && !settings.payPerUseActive}
              onToggle={(next) => void handleToggleSection("subscriptionActive", next)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionToggleRow({
  label,
  caption,
  active,
  busy,
  locked,
  onToggle,
}: {
  label: string;
  caption: string;
  active: boolean;
  busy: boolean;
  locked: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-white/5 bg-[#111318] px-4 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{label}</p>
          {locked && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
              Last live
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500">{caption}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!active)}
        disabled={busy || locked}
        aria-pressed={active}
        aria-label={`${active ? "Disable" : "Enable"} ${label}`}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
          active ? "bg-emerald-500" : "bg-white/10"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            active ? "translate-x-6" : "translate-x-1"
          }`}
        />
        {busy && (
          <Loader className="absolute -right-6 top-1 h-4 w-4 animate-spin text-blue-300" />
        )}
      </button>
    </div>
  );
}
