"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader,
  Plus,
  RefreshCw,
  Save,
  Search,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  getAdminCoupons,
  updateAdminCoupon,
  type AdminCoupon,
} from "@/lib/authClient";

type DiscountMode = "AMOUNT" | "PERCENT";

type CouponDraft = {
  code: string;
  description: string;
  userId: string;
  discountMode: DiscountMode;
  discountValue: string;
  isActive: boolean;
};

const initialDraft: CouponDraft = {
  code: "",
  description: "",
  userId: "",
  discountMode: "PERCENT",
  discountValue: "",
  isActive: true,
};

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-[#111318] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/50";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDiscount(coupon: AdminCoupon) {
  if (coupon.percentOff > 0) return `${coupon.percentOff}% off`;
  return `N${new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(coupon.amountOff)} off`;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [userFilter, setUserFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<CouponDraft>(initialDraft);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await getAdminCoupons({
      userId: userFilter.trim() || undefined,
      isActive:
        activeFilter === "ALL" ? undefined : activeFilter === "ACTIVE",
    });

    if (res.error) {
      setError(res.error.message);
      setCoupons([]);
    } else if (res.data) {
      setCoupons(res.data.coupons);
    }

    setLoading(false);
  }, [activeFilter, userFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCoupons();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadCoupons]);

  const filteredCoupons = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return coupons;

    return coupons.filter((coupon) => {
      const target = [
        coupon.code,
        coupon.description ?? "",
        coupon.userId ?? "",
        coupon.userEmail ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return target.includes(term);
    });
  }, [coupons, search]);

  const activeCount = coupons.filter((coupon) => coupon.isActive).length;
  const userScopedCount = coupons.filter((coupon) => coupon.userId).length;

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  };

  const createCoupon = async () => {
    const value = Number(draft.discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a discount value greater than 0.");
      return;
    }

    if (draft.discountMode === "PERCENT" && value > 100) {
      setError("Percent discount cannot exceed 100.");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await createAdminCoupon({
      ...(draft.code.trim() ? { code: draft.code.trim() } : {}),
      ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
      ...(draft.userId.trim() ? { userId: draft.userId.trim() } : {}),
      isActive: draft.isActive,
      ...(draft.discountMode === "PERCENT"
        ? { percentOff: value }
        : { amountOff: value }),
    });

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      setCoupons((current) => [res.data.coupon, ...current]);
      setDraft(initialDraft);
      setModalOpen(false);
      showNotice("Coupon created.");
    }

    setSaving(false);
  };

  const toggleCoupon = async (coupon: AdminCoupon) => {
    setSaving(true);
    setError(null);

    const res = await updateAdminCoupon(coupon.id, {
      isActive: !coupon.isActive,
    });

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      setCoupons((current) =>
        current.map((row) => (row.id === coupon.id ? res.data.coupon : row)),
      );
      showNotice(res.data.coupon.isActive ? "Coupon activated." : "Coupon disabled.");
    }

    setSaving(false);
  };

  const updateDescription = async (coupon: AdminCoupon, description: string) => {
    setSaving(true);
    setError(null);

    const res = await updateAdminCoupon(coupon.id, {
      description: description.trim(),
    });

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      setCoupons((current) =>
        current.map((row) => (row.id === coupon.id ? res.data.coupon : row)),
      );
      showNotice("Description updated.");
    }

    setSaving(false);
  };

  const removeCoupon = async (coupon: AdminCoupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;

    setSaving(true);
    setError(null);

    const res = await deleteAdminCoupon(coupon.id);

    if (res.error) {
      setError(res.error.message);
    } else {
      setCoupons((current) => current.filter((row) => row.id !== coupon.id));
      showNotice("Coupon deleted.");
    }

    setSaving(false);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showNotice("Coupon code copied.");
    } catch {
      setError("Could not copy coupon code.");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Coupons</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Create global or user-specific checkout discounts for PICA payments.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadCoupons()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            New Coupon
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
          <div className="text-xs font-semibold uppercase text-gray-500">Coupons Loaded</div>
          <div className="mt-2 text-2xl font-bold text-white">{coupons.length}</div>
          <div className="mt-1 text-xs text-gray-500">Matches backend filters</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-5">
          <div className="text-xs font-semibold uppercase text-gray-500">Active</div>
          <div className="mt-2 text-2xl font-bold text-white">{activeCount}</div>
          <div className="mt-1 text-xs text-gray-500">Can be used at checkout</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-5">
          <div className="text-xs font-semibold uppercase text-gray-500">User Scoped</div>
          <div className="mt-2 text-2xl font-bold text-white">{userScopedCount}</div>
          <div className="mt-1 text-xs text-gray-500">Bound to a single account</div>
        </div>
      </div>

      <section className="rounded-xl border border-white/5 bg-[#1C1F2E] p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search code, description, user ID, or email"
              className={`${fieldClass} pl-9`}
            />
          </div>
          <select
            value={activeFilter}
            onChange={(event) =>
              setActiveFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")
            }
            className={fieldClass}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </select>
          <input
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            placeholder="Filter by exact user ID"
            className={fieldClass}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/5 bg-[#1C1F2E]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Code", "Discount", "Scope", "Description", "Status", "Created", "Actions"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-500"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader className="mx-auto h-6 w-6 animate-spin text-blue-300" />
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">
                    No coupons match the current filters.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-sm font-bold text-blue-300">
                          {coupon.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyCode(coupon.code)}
                          className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {formatDiscount(coupon)}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.userId ? (
                        <div>
                          <div className="text-sm font-medium text-white">User</div>
                          <div className="max-w-[180px] truncate text-xs text-gray-500">
                            {coupon.userEmail || coupon.userId}
                          </div>
                        </div>
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          Global
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <EditableDescription
                        coupon={coupon}
                        disabled={saving}
                        onSave={(description) => void updateDescription(coupon, description)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => void toggleCoupon(coupon)}
                        disabled={saving}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-60 ${
                          coupon.isActive
                            ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(coupon.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => void removeCoupon(coupon)}
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#1C1F2E] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-300">
                  <TicketPercent className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white">New Coupon</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Leave code blank to let the backend generate one.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Code
                  </label>
                  <input
                    value={draft.code}
                    onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                    placeholder="Optional"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    User ID
                  </label>
                  <input
                    value={draft.userId}
                    onChange={(event) => setDraft({ ...draft, userId: event.target.value })}
                    placeholder="Optional exact user UUID"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                  Description
                </label>
                <input
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="Internal note"
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-[#111318] p-1">
                    {(["PERCENT", "AMOUNT"] as DiscountMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDraft({ ...draft, discountMode: mode })}
                        className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                          draft.discountMode === mode
                            ? "bg-white text-gray-950"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {mode === "PERCENT" ? "Percent" : "Amount"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={draft.discountMode === "PERCENT" ? 100 : undefined}
                    value={draft.discountValue}
                    onChange={(event) =>
                      setDraft({ ...draft, discountValue: event.target.value })
                    }
                    placeholder={draft.discountMode === "PERCENT" ? "20" : "10000"}
                    className={fieldClass}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) =>
                    setDraft({ ...draft, isActive: event.target.checked })
                  }
                  className="h-4 w-4 accent-blue-500"
                />
                Active immediately
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createCoupon()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
              >
                {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableDescription({
  coupon,
  disabled,
  onSave,
}: {
  coupon: AdminCoupon;
  disabled: boolean;
  onSave: (description: string) => void;
}) {
  const [value, setValue] = useState(coupon.description ?? "");

  useEffect(() => {
    setValue(coupon.description ?? "");
  }, [coupon.description]);

  const dirty = value.trim() !== (coupon.description ?? "").trim();

  return (
    <div className="flex min-w-[260px] items-center gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="No description"
        className="w-full rounded-lg border border-white/10 bg-[#111318] px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/50"
      />
      <button
        type="button"
        onClick={() => onSave(value)}
        disabled={disabled || !dirty}
        className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Save className="h-4 w-4" />
      </button>
    </div>
  );
}
