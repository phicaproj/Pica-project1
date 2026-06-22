"use client";

import { useMemo, useState } from "react";
import { X, ArrowRight, Lock, Check } from "lucide-react";
import { formatMoney, type Currency } from "@/lib/utils";

type PillarForPicker = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string;
};

type DiscountConfig = {
  pctPerPillar: number;
  maxPillars: number;
};

interface PillarPickerModalProps {
  onClose: () => void;
  pillars: PillarForPicker[];
  ownedPillarIds: Set<string>;
  // BE-1 — multi-pillar bundle: the picker is now multi-select and reports the
  // full chosen set. The discount schedule drives the live savings preview.
  discount: DiscountConfig;
  onConfirm: (pillarIds: string[]) => void;
}

// Pillar rows arrive tagged with the currency the pricing API returned. Any
// unknown value falls through to USD (the catalogue base).
function formatPrice(amount: number | null | undefined, currency: string = "USD") {
  const c: Currency = currency === "NGN" ? "NGN" : "USD";
  return formatMoney(amount, c);
}

// Mirror of the backend resolvePhase2BBundlePrice formula:
//   discountPct = min(count - 1, maxPillars - 1) × pctPerPillar  (capped 100)
// applied ONLY to the first maxPillars by selection order — extras pay full
// price so the dollar savings plateau at the cap. The percentage cap is
// intentionally not surfaced in copy — the customer just sees the result.
function bundleQuote(
  pricesInSelectionOrder: number[],
  discount: DiscountConfig,
): { pct: number; savings: number; total: number; base: number } {
  const base =
    Math.round(pricesInSelectionOrder.reduce((s, p) => s + p, 0) * 100) / 100;
  if (pricesInSelectionOrder.length === 0) {
    return { pct: 0, savings: 0, total: 0, base: 0 };
  }
  const discountedCount = Math.min(pricesInSelectionOrder.length, discount.maxPillars);
  const discountedBase = pricesInSelectionOrder
    .slice(0, discountedCount)
    .reduce((s, p) => s + p, 0);
  const pct = Math.min(100, Math.max(0, discountedCount - 1) * discount.pctPerPillar);
  const savings = Math.round(((discountedBase * pct) / 100) * 100) / 100;
  const total = Math.round((base - savings) * 100) / 100;
  return { pct, savings, total, base };
}

export function PillarPickerModal({
  onClose,
  pillars,
  ownedPillarIds,
  discount,
  onConfirm,
}: PillarPickerModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // A pillar is selectable when it isn't already owned and has a configured price.
  const selectablePillars = useMemo(
    () =>
      pillars.filter(
        (p) => !ownedPillarIds.has(p.id) && p.price !== null && p.price !== undefined,
      ),
    [pillars, ownedPillarIds],
  );

  const currency = pillars.find((p) => p.currency)?.currency ?? "USD";

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    selectablePillars.length > 0 && selected.size === selectablePillars.length;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectablePillars.map((p) => p.id)));
  };

  const { count, base, discountPct, total, savings } = useMemo(() => {
    // Iterate `selected` (a Set — insertion-order preserved) rather than the
    // catalogue so the first N picks are the ones the discount applies to.
    // That matches the backend rule: extras beyond `discount.maxPillars` are
    // added at full price.
    const byId = new Map(pillars.map((p) => [p.id, p]));
    const pricesInOrder: number[] = [];
    for (const id of selected) {
      const p = byId.get(id);
      if (p?.price != null) pricesInOrder.push(p.price);
    }
    const quote = bundleQuote(pricesInOrder, discount);
    return {
      count: selected.size,
      base: quote.base,
      discountPct: quote.pct,
      total: quote.total,
      savings: quote.savings,
    };
  }, [pillars, selected, discount]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0d1117] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Select Deep Dive Modules</h2>
            <p className="text-sm text-gray-500">
              Pick one or more pillars — bundle more to save more.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectablePillars.length > 0 && (
          <div className="flex items-center justify-between px-6 pt-4">
            <span className="text-xs text-gray-500">
              {selected.size} of {selectablePillars.length} selected
            </span>
            <button
              onClick={toggleAll}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
        )}

        <div className="p-6 pt-3 overflow-y-auto space-y-3">
          {pillars.map((pillar) => {
            const isOwned = ownedPillarIds.has(pillar.id);
            const hasPrice = pillar.price !== null && pillar.price !== undefined;
            const disabled = isOwned || !hasPrice;
            const isSelected = selected.has(pillar.id);

            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => !disabled && toggle(pillar.id)}
                disabled={disabled}
                className={`relative w-full text-left rounded-xl border p-5 flex flex-col sm:flex-row gap-4 transition-all ${
                  disabled
                    ? "bg-white/5 border-white/5 opacity-60 cursor-not-allowed"
                    : isSelected
                      ? "bg-[#151e2e] border-orange-500/70"
                      : "bg-[#111827] border-white/10 hover:border-orange-500/40 hover:bg-[#151e2e]"
                }`}
              >
                <div
                  className={`mt-1 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition ${
                    isSelected
                      ? "bg-orange-500 border-orange-500"
                      : "border-white/20 bg-transparent"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">{pillar.name}</h3>
                    {isOwned && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-500/20 text-teal-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Owned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{pillar.description}</p>
                </div>

                <div className="flex items-center sm:flex-col sm:justify-center sm:items-end gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold">
                      {isOwned ? "Already owned" : hasPrice ? "Price" : "Unavailable"}
                    </p>
                    <p className="text-lg font-bold text-orange-400">
                      {hasPrice ? formatPrice(pillar.price, pillar.currency) : "—"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live total + savings strip */}
        <div className="border-t border-white/5 p-6 space-y-3">
          {count > 0 && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span>
                  {count} module{count > 1 ? "s" : ""} · subtotal
                </span>
                <span>{formatPrice(base, currency)}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Bundle discount ({discountPct}% off)</span>
                  <span>− {formatPrice(savings, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-white font-bold text-base pt-1">
                <span>Total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
              {count >= 2 && discountPct === 0 && (
                <p className="text-xs text-gray-500">
                  Add more pillars to unlock a bundle discount.
                </p>
              )}
              {count === 1 && discount.pctPerPillar > 0 && (
                <p className="text-xs text-gray-500">
                  Add a 2nd pillar to save {discount.pctPerPillar}%.
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => onConfirm(Array.from(selected))}
            disabled={count === 0}
            className={`w-full px-4 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
              count === 0
                ? "bg-white/5 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {count === 0
              ? "Select at least one module"
              : `Continue with ${count} module${count > 1 ? "s" : ""}`}
            {count > 0 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
