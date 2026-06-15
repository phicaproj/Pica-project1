"use client";

// Admin CRUD for the recurring subscription tiers (Starter / Growth / Scale
// and any future additions). Distinct from /admin/subscription, which owns
// the one-off PHASE2A / PHASE2B_PILLAR pricing rows.
//
// Every numeric and text field is editable inline. Soft delete only — the
// "Deactivate" action flips isActive=false; existing UserSubscription rows
// keep working off the inactive plan until they expire. Tier numbers are
// immutable (changing one would shadow the displayOrder) so the form blocks
// edits to that field after create.

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Layers3,
  Loader,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  adminCreateSubscriptionPlan,
  adminDeleteSubscriptionPlan,
  adminListSubscriptionPlans,
  adminUpdateSubscriptionPlan,
  type CreateSubscriptionPlanInput,
  type SubscriptionPlanAdmin,
} from "@/lib/authClient";
import { formatMoney } from "@/lib/utils";

type DraftPlan = {
  id: string | null; // null = new row
  tier: number;
  name: string;
  description: string;
  priceUsd: number;
  phase2aPerMonth: number;
  phase2bPerMonth: number;
  consultationsPerMonth: number;
  features: string; // newline-separated for the textarea
  isActive: boolean;
  displayOrder: number;
};

function planToDraft(plan: SubscriptionPlanAdmin): DraftPlan {
  return {
    id: plan.id,
    tier: plan.tier,
    name: plan.name,
    description: plan.description,
    priceUsd: plan.priceUsd,
    phase2aPerMonth: plan.phase2aPerMonth,
    phase2bPerMonth: plan.phase2bPerMonth,
    consultationsPerMonth: plan.consultationsPerMonth,
    features: plan.features.join("\n"),
    isActive: plan.isActive,
    displayOrder: plan.displayOrder,
  };
}

function emptyDraft(suggestedTier: number): DraftPlan {
  return {
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
  };
}

function parseFeatures(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function SubscriptionTiersAdminPage() {
  const [plans, setPlans] = useState<SubscriptionPlanAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<DraftPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    const res = await adminListSubscriptionPlans();
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not load subscription tiers.");
      return;
    }
    setPlans(res.data.plans);
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  // Pull the next tier number from the existing rows so the New form opens
  // pre-populated with something sensible.
  const nextTier = useMemo(() => {
    const max = plans.reduce((acc, p) => Math.max(acc, p.tier), 0);
    return max + 1;
  }, [plans]);

  const handleEdit = (plan: SubscriptionPlanAdmin) => {
    setEditing(planToDraft(plan));
    setSuccess(null);
    setError(null);
  };

  const handleNew = () => {
    setEditing(emptyDraft(nextTier));
    setSuccess(null);
    setError(null);
  };

  const handleCancel = () => setEditing(null);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (editing.priceUsd <= 0) {
      setError("Price must be greater than zero.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      priceUsd: editing.priceUsd,
      phase2aPerMonth: editing.phase2aPerMonth,
      phase2bPerMonth: editing.phase2bPerMonth,
      consultationsPerMonth: editing.consultationsPerMonth,
      features: parseFeatures(editing.features),
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
    await loadPlans();
  };

  const handleDeactivate = async (plan: SubscriptionPlanAdmin) => {
    if (!plan.isActive) return;
    const confirmed = window.confirm(
      `Deactivate “${plan.name}”? New users won't see it in the picker, but existing subscribers keep their plan until they cancel or expire.`,
    );
    if (!confirmed) return;

    setDeletingId(plan.id);
    setError(null);
    const res = await adminDeleteSubscriptionPlan(plan.id);
    setDeletingId(null);
    if (res.error) {
      setError(res.error.message ?? "Could not deactivate tier.");
      return;
    }
    setSuccess(`${plan.name} deactivated.`);
    await loadPlans();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <header className="flex items-start justify-between flex-wrap gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers3 className="w-5 h-5 text-orange-400" />
              <h1 className="text-2xl md:text-3xl font-extrabold">
                Subscription Tiers
              </h1>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl">
              Recurring monthly plans. Edit prices and quotas inline. Paystack
              plan codes are populated automatically on the first save or first
              subscriber, whichever comes first.
            </p>
          </div>
          <button
            onClick={handleNew}
            disabled={editing !== null}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            New tier
          </button>
        </header>

        {error && (
          <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {editing && (
          <EditorCard
            draft={editing}
            saving={saving}
            onChange={setEditing}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl bg-[#111827] border border-white/5 p-10 text-center">
            <p className="text-gray-400 text-sm mb-4">
              No subscription tiers configured yet.
            </p>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Create the first tier
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                onEdit={() => handleEdit(plan)}
                onDeactivate={() => handleDeactivate(plan)}
                deactivating={deletingId === plan.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EDITOR CARD
// ─────────────────────────────────────────────────────────────────────────

function EditorCard({
  draft,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  draft: DraftPlan;
  saving: boolean;
  onChange: (draft: DraftPlan) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = <K extends keyof DraftPlan>(key: K, value: DraftPlan[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="mb-8 rounded-2xl bg-[#111827] border border-orange-500/30 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">
          {draft.id ? `Edit ${draft.name || "tier"}` : "New tier"}
        </h2>
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-gray-500 hover:text-white"
          aria-label="Close editor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <Field label="Tier number" hint={draft.id ? "Immutable after create" : ""}>
          <input
            type="number"
            min={1}
            value={draft.tier}
            disabled={Boolean(draft.id) || saving}
            onChange={(e) => set("tier", parseInt(e.target.value || "1", 10))}
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-60"
          />
        </Field>

        <Field label="Display order">
          <input
            type="number"
            min={0}
            value={draft.displayOrder}
            disabled={saving}
            onChange={(e) =>
              set("displayOrder", parseInt(e.target.value || "0", 10))
            }
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </Field>

        <Field label="Name">
          <input
            value={draft.name}
            disabled={saving}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Starter"
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </Field>

        <Field label="Monthly price (USD)">
          <input
            type="number"
            step="0.01"
            min={0}
            value={draft.priceUsd}
            disabled={saving}
            onChange={(e) =>
              set("priceUsd", parseFloat(e.target.value || "0"))
            }
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </Field>
      </div>

      <Field label="Description" hint="Renders inline above the feature list">
        <textarea
          value={draft.description}
          disabled={saving}
          rows={2}
          onChange={(e) => set("description", e.target.value)}
          placeholder="e.g. Solo founders and small teams getting their first read on the business."
          className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        <Field label="Phase 2A / month">
          <input
            type="number"
            min={0}
            value={draft.phase2aPerMonth}
            disabled={saving}
            onChange={(e) =>
              set("phase2aPerMonth", parseInt(e.target.value || "0", 10))
            }
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Phase 2B / month">
          <input
            type="number"
            min={0}
            value={draft.phase2bPerMonth}
            disabled={saving}
            onChange={(e) =>
              set("phase2bPerMonth", parseInt(e.target.value || "0", 10))
            }
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Consultations / month">
          <input
            type="number"
            min={0}
            value={draft.consultationsPerMonth}
            disabled={saving}
            onChange={(e) =>
              set("consultationsPerMonth", parseInt(e.target.value || "0", 10))
            }
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </Field>
      </div>

      <Field label="Bonus features (one per line)" hint="Optional bullets after the quota lines">
        <textarea
          value={draft.features}
          disabled={saving}
          rows={4}
          onChange={(e) => set("features", e.target.value)}
          placeholder="Downloadable PDF reports&#10;Priority email support"
          className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none font-mono"
        />
      </Field>

      <label className="flex items-center gap-2 mt-5 mb-6 select-none cursor-pointer">
        <input
          type="checkbox"
          checked={draft.isActive}
          disabled={saving}
          onChange={(e) => set("isActive", e.target.checked)}
          className="w-4 h-4 rounded border-white/20 bg-[#0d1117]"
        />
        <span className="text-sm text-gray-300">
          Active — show in the user-facing picker
        </span>
      </label>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60"
        >
          {saving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {draft.id ? "Save changes" : "Create tier"}
        </button>
      </div>
    </div>
  );
}

function Field({
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
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-gray-600 mt-1">{hint}</span>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PLAN ROW
// ─────────────────────────────────────────────────────────────────────────

function PlanRow({
  plan,
  onEdit,
  onDeactivate,
  deactivating,
}: {
  plan: SubscriptionPlanAdmin;
  onEdit: () => void;
  onDeactivate: () => void;
  deactivating: boolean;
}) {
  return (
    <div
      className={`bg-[#111827] border rounded-2xl p-5 ${
        plan.isActive ? "border-white/5" : "border-white/5 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Tier {plan.tier}
            </span>
            {!plan.isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-500/15 text-gray-300">
                Inactive
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          {plan.description && (
            <p className="text-sm text-gray-400 mt-1 max-w-xl">
              {plan.description}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-white">
            {formatMoney(plan.priceUsd, "USD")}
          </p>
          <p className="text-xs text-gray-500">/ month</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <Metric label="Phase 2A" value={plan.phase2aPerMonth} />
        <Metric label="Phase 2B" value={plan.phase2bPerMonth} />
        <Metric label="Consultations" value={plan.consultationsPerMonth} />
      </div>

      {plan.features.length > 0 && (
        <ul className="space-y-1 mb-4">
          {plan.features.map((feature) => (
            <li key={feature} className="text-xs text-gray-400 flex items-start gap-1.5">
              <span className="text-orange-400">•</span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="text-[10px] text-gray-600 font-mono mb-4 space-y-0.5">
        <p>
          USD plan code:{" "}
          <span className={plan.paystackPlanCodeUsd ? "text-emerald-400" : "text-amber-400"}>
            {plan.paystackPlanCodeUsd ?? "not synced"}
          </span>
        </p>
        <p>
          NGN plan code:{" "}
          <span className={plan.paystackPlanCodeNgn ? "text-emerald-400" : "text-gray-500"}>
            {plan.paystackPlanCodeNgn ?? "created on first NG subscriber"}
          </span>
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-white hover:bg-white/5 transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </button>
        {plan.isActive && (
          <button
            onClick={onDeactivate}
            disabled={deactivating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition disabled:opacity-60"
          >
            {deactivating ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Deactivate
          </button>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#0d1117] rounded-lg py-2">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-gray-500">
        {label}
      </p>
    </div>
  );
}
