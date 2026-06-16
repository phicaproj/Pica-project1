"use client";

// Helper tab components for /admin/subscription. Kept in a sibling file so
// the page route stays focused on the tab shell + pay-per-use logic.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Edit3,
  ExternalLink,
  Inbox,
  Loader,
  MessageSquare,
  Plus,
  Save,
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
  adminListConsultationBookings,
  adminListConsultationTiers,
  adminListSubscriptionPlans,
  adminUpdateConsultationBookingStatus,
  adminUpdateConsultationTier,
  adminUpdateSubscriptionPlan,
  type AdminBookingRow,
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
    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      priceUsd: editing.priceUsd,
      phase2aPerMonth: editing.phase2aPerMonth,
      phase2bPerMonth: editing.phase2bPerMonth,
      consultationsPerMonth: editing.consultationsPerMonth,
      features: editing.features.split("\n").map((s) => s.trim()).filter(Boolean),
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

    setSaving(true);
    setError(null);
    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      priceUsd: editing.priceUsd,
      durationMinutes: editing.durationMinutes,
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
}: {
  booking: AdminBookingRow;
  busy: boolean;
  onConfirm: () => void;
  onMarkAttended: () => void;
  onMarkNoShow: () => void;
  onCancel: () => void;
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

      <div className="mt-4 flex flex-wrap gap-2">
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
