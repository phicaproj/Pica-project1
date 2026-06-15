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
  getAdminPillars,
  getAllUsers,
  type AdminCoupon,
  type PillarMeta,
  type AdminUserRow,
} from "@/lib/authClient";
import { formatMoney } from "@/lib/utils";

type DiscountMode = "AMOUNT" | "PERCENT";

type CouponDraft = {
  code: string;
  description: string;
  userId: string;
  discountMode: DiscountMode;
  discountValue: string;
  isActive: boolean;
  plan: "PHASE2A" | "PHASE2B_PILLAR" | "";
  pillarId: string;
  // How many people can use the code. Defaults to 1 so a forgotten field
  // can't create an unlimited promo; locked to 1 while a user is selected.
  maxUses: string;
};

const initialDraft: CouponDraft = {
  code: "",
  description: "",
  userId: "",
  discountMode: "PERCENT",
  discountValue: "",
  isActive: true,
  plan: "",
  pillarId: "",
  maxUses: "1",
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
  // Coupon `amountOff` is stored in the base currency (USD) the same way
  // PlanPrice is. Admin-facing rollup → USD.
  return `${formatMoney(coupon.amountOff, "USD")} off`;
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

  const [pillars, setPillars] = useState<PillarMeta[]>([]);
  const [usersSearch, setUsersSearch] = useState("");
  const [searchResults, setSearchResults] = useState<AdminUserRow[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

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

  // Load coupons on mount/filter change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCoupons();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadCoupons]);

  // Load pillars on mount
  useEffect(() => {
    async function loadPillars() {
      try {
        const res = await getAdminPillars();
        if (res.data) {
          setPillars(res.data.pillars);
        }
      } catch {
        // ignore
      }
    }
    void loadPillars();
  }, []);

  // Search users effect
  useEffect(() => {
    if (!usersSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await getAllUsers({ search: usersSearch.trim(), pageSize: 10 });
        if (res.data) {
          setSearchResults(res.data.users);
        }
      } catch {
        // ignore
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [usersSearch]);

  const filteredCoupons = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return coupons;

    return coupons.filter((coupon) => {
      const target = [
        coupon.code,
        coupon.description ?? "",
        coupon.userId ?? "",
        coupon.userEmail ?? "",
        coupon.plan ?? "",
        coupon.pillarName ?? "",
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

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let generated = "";
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDraft((prev) => ({ ...prev, code: generated }));
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

    if (!draft.description.trim()) {
      setError("Description is required.");
      return;
    }

    const wordCount = draft.description.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 15) {
      setError("Description must be 15 words or less.");
      return;
    }

    if (draft.plan === "PHASE2B_PILLAR" && !draft.pillarId) {
      setError("Please select a target pillar for Phase 2B coupons.");
      return;
    }

    // User-scoped coupons are always single-use; otherwise default a blank
    // field back to 1 so a forgotten value can't create an unlimited promo.
    const maxUses = draft.userId.trim() ? 1 : Math.floor(Number(draft.maxUses) || 1);
    if (maxUses < 1) {
      setError("Number of uses must be at least 1.");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await createAdminCoupon({
      ...(draft.code.trim() ? { code: draft.code.trim().toUpperCase() } : {}),
      description: draft.description.trim(),
      ...(draft.userId.trim() ? { userId: draft.userId.trim() } : {}),
      isActive: draft.isActive,
      ...(draft.discountMode === "PERCENT"
        ? { percentOff: value }
        : { amountOff: value }),
      plan: draft.plan || null,
      pillarId: draft.plan === "PHASE2B_PILLAR" ? draft.pillarId : null,
      maxUses,
    });

    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      const createdCoupon = res.data.coupon;
      setCoupons((current) => [createdCoupon, ...current]);
      setDraft(initialDraft);
      setSelectedUser(null);
      setUsersSearch("");
      setModalOpen(false);
      showNotice("Coupon created and email notification dispatched.");
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
      const updatedCoupon = res.data.coupon;
      setCoupons((current) =>
        current.map((row) => (row.id === coupon.id ? updatedCoupon : row)),
      );
      showNotice(updatedCoupon.isActive ? "Coupon activated." : "Coupon disabled.");
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
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(initialDraft);
              setSelectedUser(null);
              setUsersSearch("");
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 cursor-pointer"
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
              placeholder="Search code, description, user ID, email, or plan..."
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
                {["Code", "Discount", "Scope / Target", "Usage", "Description", "Status", "Created", "Actions"].map(
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
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Loader className="mx-auto h-6 w-6 animate-spin text-blue-300" />
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-gray-500">
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
                        <span className={`rounded-md bg-blue-500/10 px-2.5 py-1 text-sm font-bold text-blue-300 ${
                          coupon.status === "USED" ? "line-through opacity-50" : ""
                        }`}>
                          {coupon.code}
                        </span>
                        {coupon.status !== "USED" && (
                          <button
                            type="button"
                            onClick={() => void copyCode(coupon.code)}
                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white cursor-pointer"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {formatDiscount(coupon)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {coupon.plan ? (
                          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                            coupon.plan === "PHASE2A" ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          }`}>
                            {coupon.plan === "PHASE2A" ? "Phase 2A" : `Phase 2B (${coupon.pillarCode || "Pillar"})`}
                          </span>
                        ) : (
                          <span className="inline-block rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                            Any Plan
                          </span>
                        )}
                        {coupon.userId ? (
                          <div className="text-xs text-gray-400">
                            User: <span className="font-mono text-gray-500 truncate block max-w-[150px]" title={coupon.userEmail || coupon.userId}>{coupon.userEmail || coupon.userId}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-400 font-semibold">Global User Access</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-white whitespace-nowrap">
                        {coupon.usedCount} / {coupon.maxUses}
                      </div>
                      <div className="mt-1 h-1.5 w-20 rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full ${
                            coupon.usedCount >= coupon.maxUses ? "bg-gray-500" : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(100, (coupon.usedCount / Math.max(1, coupon.maxUses)) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 text-[10px] text-gray-500">
                        {coupon.usedCount >= coupon.maxUses
                          ? "Fully used"
                          : `${coupon.maxUses - coupon.usedCount} left`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {coupon.description || <span className="text-gray-600 italic">No description</span>}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.status === "USED" ? (
                        <span className="inline-block font-bold rounded-lg px-3.5 py-1.5 text-xs bg-gray-700/50 text-gray-400 border border-white/5 shadow-md">
                          Used
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void toggleCoupon(coupon)}
                          disabled={saving}
                          className={`font-bold rounded-lg px-3.5 py-1.5 text-xs shadow-md border cursor-pointer hover:scale-105 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed ${
                            coupon.isActive
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30"
                              : "bg-red-600 hover:bg-red-500 text-white border-red-500/30"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Disabled"}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(coupon.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => void removeCoupon(coupon)}
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60 cursor-pointer"
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="flex flex-col max-h-[90vh] w-full max-w-2xl rounded-xl border border-white/10 bg-[#1C1F2E] shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-300">
                  <TicketPercent className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white">New Coupon</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Provide rules and codes. Leave code blank to let the backend generate one.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={draft.code}
                      onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                      placeholder="Optional"
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-3 py-2 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Target User (Optional)
                  </label>
                  {selectedUser ? (
                    <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-sm text-white">
                      <div className="flex flex-col">
                        <span className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</span>
                        <span className="text-[10px] text-gray-400">{selectedUser.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          setDraft((prev) => ({ ...prev, userId: "" }));
                        }}
                        className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          value={usersSearch}
                          onChange={(e) => setUsersSearch(e.target.value)}
                          placeholder="Search user by name/email..."
                          className={`${fieldClass} pl-9`}
                        />
                        {searchingUsers && (
                          <Loader className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500" />
                        )}
                      </div>
                      {searchResults.length > 0 && (
                        <div className="absolute z-[110] mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#1C1F2E] p-1 shadow-xl">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setSelectedUser(user);
                                // User-scoped coupons are single-use.
                                setDraft((prev) => ({ ...prev, userId: user.id, maxUses: "1" }));
                                setUsersSearch("");
                                setSearchResults([]);
                              }}
                              className="w-full rounded-md px-3 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                            >
                              <div className="font-semibold">{user.firstName} {user.lastName}</div>
                              <div className="text-[10px] text-gray-500">{user.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Target Phase (Optional)
                  </label>
                  <select
                    value={draft.plan}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        plan: e.target.value as "PHASE2A" | "PHASE2B_PILLAR" | "",
                        pillarId: "", // reset pillar
                      })
                    }
                    className={fieldClass}
                  >
                    <option value="">Any Phase (Global)</option>
                    <option value="PHASE2A">Phase 2A (Strategic Scan)</option>
                    <option value="PHASE2B_PILLAR">Phase 2B (Deep Dive Pillar)</option>
                  </select>
                </div>
                {draft.plan === "PHASE2B_PILLAR" && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                      Target Pillar
                    </label>
                    <select
                      value={draft.pillarId}
                      onChange={(e) => setDraft({ ...draft, pillarId: e.target.value })}
                      className={fieldClass}
                    >
                      <option value="" disabled>Select target pillar</option>
                      {pillars.map((pillar) => (
                        <option key={pillar.id} value={pillar.id}>
                          {pillar.name} ({pillar.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase text-gray-500">
                    Description (Required)
                  </label>
                  <span className="text-[10px] text-gray-500">
                    {draft.description.trim().split(/\s+/).filter(Boolean).length} / 15 words
                  </span>
                </div>
                <input
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="e.g. 20% discount on Founder Leadership scan"
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
                        className={`rounded-md px-3 py-2 text-sm font-semibold transition cursor-pointer ${
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Number of Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={selectedUser ? "1" : draft.maxUses}
                    disabled={Boolean(selectedUser)}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, maxUses: event.target.value }))
                    }
                    onBlur={() =>
                      setDraft((prev) => ({
                        ...prev,
                        // Snap blank/invalid input back to the safe default.
                        maxUses: String(Math.max(1, Math.floor(Number(prev.maxUses) || 1))),
                      }))
                    }
                    className={`${fieldClass} ${selectedUser ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  <p className="mt-1.5 text-[11px] text-gray-500">
                    {selectedUser
                      ? "Locked to 1 — remove the selected user to allow more people."
                      : "How many different people can redeem this code (each person once)."}
                  </p>
                </div>
                <div className="flex items-end pb-7">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, isActive: event.target.checked }))
                      }
                      className="h-4 w-4 accent-blue-500"
                    />
                    Active immediately
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-5 bg-[#171923]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createCoupon()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60 cursor-pointer"
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
