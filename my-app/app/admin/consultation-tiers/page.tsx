"use client";

// Admin CRUD for consultation tiers (Quick Consult / Strategy Session /
// Deep Dive Workshop and any future additions). Twin of
// /admin/subscription-tiers — same shape, swapping quotas for duration.
//
// Soft delete: "Deactivate" flips isActive=false; existing bookings keep
// pointing at the tier (FK is restrict on delete). Tier number is immutable
// after create for the same reason it is on subscription tiers — to keep
// display_order stable.

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  Loader,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  adminCreateConsultationTier,
  adminDeleteConsultationTier,
  adminListConsultationTiers,
  adminUpdateConsultationTier,
  type ConsultationTierAdmin,
  type CreateConsultationTierInput,
} from "@/lib/authClient";
import { formatMoney } from "@/lib/utils";

type DraftTier = {
  id: string | null;
  tier: number;
  name: string;
  description: string;
  priceUsd: number;
  durationMinutes: number;
  isActive: boolean;
  displayOrder: number;
};

function tierToDraft(t: ConsultationTierAdmin): DraftTier {
  return {
    id: t.id,
    tier: t.tier,
    name: t.name,
    description: t.description,
    priceUsd: t.priceUsd,
    durationMinutes: t.durationMinutes,
    isActive: t.isActive,
    displayOrder: t.displayOrder,
  };
}

function emptyDraft(suggestedTier: number): DraftTier {
  return {
    id: null,
    tier: suggestedTier,
    name: "",
    description: "",
    priceUsd: 0,
    durationMinutes: 30,
    isActive: true,
    displayOrder: suggestedTier,
  };
}

export default function ConsultationTiersAdminPage() {
  const [tiers, setTiers] = useState<ConsultationTierAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<DraftTier | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const res = await adminListConsultationTiers();
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not load consultation tiers.");
      return;
    }
    setTiers(res.data.tiers);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const nextTier = useMemo(() => {
    const max = tiers.reduce((acc, t) => Math.max(acc, t.tier), 0);
    return max + 1;
  }, [tiers]);

  const handleNew = () => {
    setEditing(emptyDraft(nextTier));
    setSuccess(null);
    setError(null);
  };

  const handleEdit = (t: ConsultationTierAdmin) => {
    setEditing(tierToDraft(t));
    setSuccess(null);
    setError(null);
  };

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
    if (editing.durationMinutes < 5) {
      setError("Duration must be at least 5 minutes.");
      return;
    }

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
    const ok = window.confirm(
      `Deactivate "${t.name}"? Users won't see it on the booking form, but existing bookings keep their tier.`,
    );
    if (!ok) return;
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
    <div className="min-h-screen bg-[#0d1117] text-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <header className="flex items-start justify-between flex-wrap gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-orange-400" />
              <h1 className="text-2xl md:text-3xl font-extrabold">
                Consultation Tiers
              </h1>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl">
              Edit prices and durations inline. Subscribers consume their
              monthly consultation credits automatically; everyone else pays
              one-off in USD or NGN (converted via the live FX rate).
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
            onCancel={() => setEditing(null)}
          />
        )}

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : tiers.length === 0 ? (
          <div className="rounded-xl bg-[#111827] border border-white/5 p-10 text-center">
            <p className="text-gray-400 text-sm mb-4">
              No consultation tiers configured yet.
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
            {tiers.map((t) => (
              <TierRow
                key={t.id}
                tier={t}
                onEdit={() => handleEdit(t)}
                onDeactivate={() => handleDeactivate(t)}
                deactivating={deletingId === t.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditorCard({
  draft,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  draft: DraftTier;
  saving: boolean;
  onChange: (draft: DraftTier) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = <K extends keyof DraftTier>(key: K, value: DraftTier[K]) =>
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
            placeholder="e.g. Strategy Session"
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Price (USD)">
          <input
            type="number"
            step="0.01"
            min={0}
            value={draft.priceUsd}
            disabled={saving}
            onChange={(e) => set("priceUsd", parseFloat(e.target.value || "0"))}
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Duration (minutes)">
          <input
            type="number"
            min={5}
            max={600}
            step={5}
            value={draft.durationMinutes}
            disabled={saving}
            onChange={(e) =>
              set("durationMinutes", parseInt(e.target.value || "30", 10))
            }
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </Field>
      </div>

      <Field label="Description" hint="Shown inline above the booking form's tier card">
        <textarea
          value={draft.description}
          disabled={saving}
          rows={2}
          onChange={(e) => set("description", e.target.value)}
          placeholder="e.g. A 60-minute working session to walk through findings and next steps."
          className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
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
          Active — show in the user-facing booking form
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
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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

function TierRow({
  tier,
  onEdit,
  onDeactivate,
  deactivating,
}: {
  tier: ConsultationTierAdmin;
  onEdit: () => void;
  onDeactivate: () => void;
  deactivating: boolean;
}) {
  return (
    <div className={`bg-[#111827] border rounded-2xl p-5 ${tier.isActive ? "border-white/5" : "border-white/5 opacity-60"}`}>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Tier {tier.tier}
            </span>
            {!tier.isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-500/15 text-gray-300">
                Inactive
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white">{tier.name}</h3>
          {tier.description && (
            <p className="text-sm text-gray-400 mt-1 max-w-xl">{tier.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-white">
            {formatMoney(tier.priceUsd, "USD")}
          </p>
          <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            {tier.durationMinutes} min
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-white hover:bg-white/5 transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </button>
        {tier.isActive && (
          <button
            onClick={onDeactivate}
            disabled={deactivating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition disabled:opacity-60"
          >
            {deactivating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Deactivate
          </button>
        )}
      </div>
    </div>
  );
}
