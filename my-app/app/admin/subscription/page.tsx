"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Edit3,
  Layers3,
  Loader,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  createAdminPricing,
  deleteAdminPricing,
  getAdminPillars,
  getAdminPricing,
  updateAdminPricing,
  type PillarMeta,
  type PricingPlan,
  type PricingRow,
} from "@/lib/authClient";
import { formatMoney } from "@/lib/utils";

const FEATURE_STORAGE_KEY = "pica.admin.subscriptionFeatures";

const DEFAULT_FEATURES: Record<PricingPlan, string[]> = {
  PHASE2A: [
    "Full Phase 2A strategic diagnostic",
    "Scored report and recommendations",
    "Downloadable PDF report",
  ],
  PHASE2B_PILLAR: [
    "One paid pillar deep dive",
    "Pillar-specific findings",
    "Downloadable PDF report",
  ],
};

// Admin pricing screens always display the catalogue in USD — the base
// currency. The NGN view is for end-users (NG country) only and gets the
// usdToNgn conversion at render time on the dashboard.
function formatPrice(amount: number | null | undefined) {
  return formatMoney(amount, "USD");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not saved";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not saved";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function parseFeatureDraft(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function sortPrices(rows: PricingRow[]) {
  return [...rows].sort((a, b) => {
    if (a.plan !== b.plan) return a.plan.localeCompare(b.plan);
    return (a.pillarName ?? "").localeCompare(b.pillarName ?? "");
  });
}

function readStoredFeatures(): Record<PricingPlan, string[]> {
  if (typeof window === "undefined") return DEFAULT_FEATURES;

  try {
    const raw = window.localStorage.getItem(FEATURE_STORAGE_KEY);
    if (!raw) return DEFAULT_FEATURES;
    const parsed = JSON.parse(raw) as Partial<Record<PricingPlan, string[]>>;

    return {
      PHASE2A:
        Array.isArray(parsed.PHASE2A) && parsed.PHASE2A.length > 0
          ? parsed.PHASE2A
          : DEFAULT_FEATURES.PHASE2A,
      PHASE2B_PILLAR:
        Array.isArray(parsed.PHASE2B_PILLAR) && parsed.PHASE2B_PILLAR.length > 0
          ? parsed.PHASE2B_PILLAR
          : DEFAULT_FEATURES.PHASE2B_PILLAR,
    };
  } catch {
    return DEFAULT_FEATURES;
  }
}

export default function SubscriptionPage() {
  const [prices, setPrices] = useState<PricingRow[]>([]);
  const [pillars, setPillars] = useState<PillarMeta[]>([]);
  const [features, setFeatures] = useState<Record<PricingPlan, string[]>>(
    DEFAULT_FEATURES,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<PricingPlan>("PHASE2A");
  const [priceDraft, setPriceDraft] = useState("");
  const [featureDraft, setFeatureDraft] = useState("");
  const [selectedPillarId, setSelectedPillarId] = useState("");

  const phase2APrice = useMemo(
    () => prices.find((row) => row.plan === "PHASE2A") ?? null,
    [prices],
  );

  const phase2BPrices = useMemo(
    () => prices.filter((row) => row.plan === "PHASE2B_PILLAR"),
    [prices],
  );

  const phase2BByPillarId = useMemo(() => {
    const map = new Map<string, PricingRow>();
    for (const row of phase2BPrices) {
      if (row.pillarId) map.set(row.pillarId, row);
    }
    return map;
  }, [phase2BPrices]);

  const selectedPillarPrice = selectedPillarId
    ? phase2BByPillarId.get(selectedPillarId) ?? null
    : null;

  const configured2BCount = phase2BPrices.length;
  const lowest2BPrice =
    phase2BPrices.length > 0
      ? Math.min(...phase2BPrices.map((row) => row.price))
      : null;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [pricingRes, pillarsRes] = await Promise.all([
      getAdminPricing(),
      getAdminPillars(),
    ]);

    if (pricingRes.error || pillarsRes.error) {
      setError(
        pricingRes.error?.message ||
          pillarsRes.error?.message ||
          "Unable to load subscription pricing",
      );
    }

    if (pricingRes.data) setPrices(sortPrices(pricingRes.data.prices));
    if (pillarsRes.data) setPillars(pillarsRes.data.pillars);
    setLoading(false);
  }, []);

  useEffect(() => {
    setFeatures(readStoredFeatures());
    void loadData();
  }, [loadData]);

  const openEditor = (plan: PricingPlan, pillarId?: string | null) => {
    setActivePlan(plan);
    setError(null);
    setFeatureDraft(features[plan].join("\n"));

    if (plan === "PHASE2A") {
      setSelectedPillarId("");
      setPriceDraft(phase2APrice ? String(phase2APrice.price) : "");
    } else {
      const nextPillarId = pillarId || phase2BPrices[0]?.pillarId || pillars[0]?.id || "";
      const existing = nextPillarId ? phase2BByPillarId.get(nextPillarId) : null;
      setSelectedPillarId(nextPillarId);
      setPriceDraft(existing ? String(existing.price) : "");
    }

    setModalOpen(true);
  };

  const handlePillarChange = (pillarId: string) => {
    const existing = phase2BByPillarId.get(pillarId);
    setSelectedPillarId(pillarId);
    setPriceDraft(existing ? String(existing.price) : "");
  };

  const closeModal = () => {
    if (saving || deleting) return;
    setModalOpen(false);
    setError(null);
  };

  const upsertPrice = (row: PricingRow) => {
    setPrices((current) => {
      const next = current.some((price) => price.id === row.id)
        ? current.map((price) => (price.id === row.id ? row : price))
        : [...current, row];
      return sortPrices(next);
    });
  };

  const savePlan = async () => {
    const amount = Number(priceDraft);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid price greater than 0.");
      return;
    }

    if (activePlan === "PHASE2B_PILLAR" && !selectedPillarId) {
      setError("Select the pillar type for this Plan 2B price.");
      return;
    }

    setSaving(true);
    setError(null);

    const nextFeatures = {
      ...features,
      [activePlan]: parseFeatureDraft(featureDraft),
    };

    const existing =
      activePlan === "PHASE2A" ? phase2APrice : selectedPillarPrice;

    const response = existing
      ? await updateAdminPricing(existing.id, {
          price: amount,
          ...(activePlan === "PHASE2B_PILLAR"
            ? { pillarId: selectedPillarId }
            : {}),
        })
      : await createAdminPricing({
          plan: activePlan,
          price: amount,
          ...(activePlan === "PHASE2B_PILLAR"
            ? { pillarId: selectedPillarId }
            : { pillarId: null }),
        });

    if (response.error) {
      setError(response.error.message);
      setSaving(false);
      return;
    }

    if (response.data) {
      upsertPrice(response.data.price);
      setFeatures(nextFeatures);
      window.localStorage.setItem(
        FEATURE_STORAGE_KEY,
        JSON.stringify(nextFeatures),
      );
    }

    setSaving(false);
    setModalOpen(false);
  };

  const removeSelectedPillarPrice = async () => {
    if (!selectedPillarPrice) return;
    const confirmed = window.confirm(
      "Remove the configured price for this pillar?",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    const response = await deleteAdminPricing(selectedPillarPrice.id);

    if (response.error) {
      setError(response.error.message);
      setDeleting(false);
      return;
    }

    setPrices((current) =>
      current.filter((price) => price.id !== selectedPillarPrice.id),
    );
    setPriceDraft("");
    setDeleting(false);
  };

  const PlanCard = ({
    plan,
    title,
    subtitle,
    priceLabel,
    meta,
    featured,
  }: {
    plan: PricingPlan;
    title: string;
    subtitle: string;
    priceLabel: string;
    meta: string;
    featured?: boolean;
  }) => (
    <section
      className={`rounded-xl border p-6 bg-[#1C1F2E] ${
        featured ? "border-blue-500/40" : "border-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <span
            className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
              featured
                ? "bg-blue-500/10 text-blue-300"
                : "bg-white/5 text-gray-400"
            }`}
          >
            {plan === "PHASE2A" ? "Plan 2A" : "Plan 2B"}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
        </div>
        {plan === "PHASE2A" ? (
          <CreditCard className="h-6 w-6 text-blue-300" />
        ) : (
          <Layers3 className="h-6 w-6 text-emerald-300" />
        )}
      </div>

      <div className="mb-6">
        <div className="text-3xl font-bold text-white">{priceLabel}</div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
          {meta}
        </div>
      </div>

      <ul className="mb-6 space-y-2">
        {features[plan].map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => openEditor(plan)}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
          featured
            ? "bg-white text-gray-950 hover:bg-gray-100"
            : "border border-white/10 text-gray-200 hover:bg-white/5"
        }`}
      >
        <Edit3 className="h-4 w-4" />
        Edit Features
      </button>
    </section>
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscription Pricing</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Manage the two paid diagnostics. Plan 2A has one global price, while
            Plan 2B is priced per pillar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && !modalOpen && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Plan 2A Price
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {formatPrice(phase2APrice?.price)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Updated {formatDate(phase2APrice?.updatedAt)}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Plan 2B Pillars
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {configured2BCount}/{pillars.length || 0}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Active pillars with configured pricing
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Plan 2B Starting Price
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {formatPrice(lowest2BPrice)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Lowest configured pillar price
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-white/5 bg-[#1C1F2E]">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Loader className="h-5 w-5 animate-spin text-blue-300" />
            Loading pricing
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PlanCard
              plan="PHASE2A"
              title="Strategic Scan"
              subtitle="One backend-owned price for the paid Phase 2A assessment."
              priceLabel={formatPrice(phase2APrice?.price)}
              meta="One-time payment"
              featured
            />
            <PlanCard
              plan="PHASE2B_PILLAR"
              title="Pillar Deep Dive"
              subtitle="Plan 2B charges users for the pillar they choose."
              priceLabel={
                lowest2BPrice === null
                  ? "Not configured"
                  : `From ${formatPrice(lowest2BPrice)}`
              }
              meta="Per pillar"
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-white/5 bg-[#1C1F2E]">
            <div className="flex flex-col gap-4 border-b border-white/5 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Plan 2B Pillar Pricing
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Set the price that checkout and the landing page receive from
                  the backend.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEditor("PHASE2B_PILLAR")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                <Edit3 className="h-4 w-4" />
                Edit Pillar Price
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Pillar Type", "Current Price", "Status", "Updated", "Action"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pillars.map((pillar) => {
                    const row = phase2BByPillarId.get(pillar.id);
                    return (
                      <tr
                        key={pillar.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-white">
                            {pillar.name}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">
                            {pillar.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          {formatPrice(row?.price)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              row
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-amber-500/10 text-amber-300"
                            }`}
                          >
                            {row ? "Configured" : "Missing"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatDate(row?.updatedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => openEditor("PHASE2B_PILLAR", pillar.id)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-blue-200"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pillars.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-gray-500"
                      >
                        No active pillars were returned by the backend.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-xl border border-white/10 bg-[#1C1F2E] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Edit {activePlan === "PHASE2A" ? "Plan 2A" : "Plan 2B"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {activePlan === "PHASE2A"
                    ? "Set the global Strategic Scan price."
                    : "Choose the pillar type and set its Deep Dive price."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {activePlan === "PHASE2B_PILLAR" && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Pillar Type
                  </label>
                  <select
                    value={selectedPillarId}
                    onChange={(event) => handlePillarChange(event.target.value)}
                    className="w-full appearance-none rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50"
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
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Price (NGN)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={priceDraft}
                  onChange={(event) => setPriceDraft(event.target.value)}
                  placeholder="50000"
                  className="w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Feature Bullets
                </label>
                <textarea
                  value={featureDraft}
                  onChange={(event) => setFeatureDraft(event.target.value)}
                  rows={5}
                  placeholder="One feature per line"
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#111318] px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/50"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {activePlan === "PHASE2B_PILLAR" && selectedPillarPrice && (
                  <button
                    type="button"
                    onClick={() => void removeSelectedPillarPrice()}
                    disabled={saving || deleting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remove Price
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving || deleting}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void savePlan()}
                  disabled={saving || deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
