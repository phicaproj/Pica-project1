"use client";

// Singleton app-settings editor — today this is just the USD→NGN FX rate
// admins set manually (no live FX feed yet). The same value is read by
// /payment/pricing, /consultation/tiers, /subscription/tiers, and every
// charge flow on the BE, so changing it here moves every Naira-rendered
// price in lock-step. Audit metadata (updatedBy, updatedAt) surfaces below
// the input so the team knows when the last change happened.

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader,
  Save,
  Settings2,
} from "lucide-react";
import {
  getAdminAppSettings,
  updateAdminAppSettings,
  type AppSettingsPayload,
} from "@/lib/authClient";

const formatNgnPreview = (usd: number, rate: number) => {
  if (!Number.isFinite(usd) || !Number.isFinite(rate)) return "—";
  const ngn = usd * rate;
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

export default function AppSettingsAdminPage() {
  const [settings, setSettings] = useState<AppSettingsPayload | null>(null);
  const [draftRate, setDraftRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
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
  };

  useEffect(() => {
    void load();
  }, []);

  const parsedRate = Number(draftRate);
  const rateValid = Number.isFinite(parsedRate) && parsedRate > 0 && parsedRate <= 1_000_000;
  const dirty = settings ? Math.abs(parsedRate - settings.usdToNgn) > 0.0001 : false;

  const handleSave = async () => {
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

  return (
    <div className="min-h-screen bg-[#0d1117] text-white py-10">
      <div className="max-w-3xl mx-auto px-4">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="w-5 h-5 text-orange-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold">App Settings</h1>
          </div>
          <p className="text-sm text-gray-400 max-w-2xl">
            The platform charges in USD by default and converts to Naira at
            this rate when a Nigerian user pays. Changing the rate here moves
            every Naira-displayed price (pricing page, subscription tiers,
            consultation tiers, checkout) in real time.
          </p>
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

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="rounded-2xl bg-[#111827] border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-orange-400" />
              <h2 className="text-base font-bold text-white">USD → NGN exchange rate</h2>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Used wherever the BE quotes a Naira charge. Keep it close to the
              true bank/Paystack rate; large drifts will refund-loop or
              under-collect.
            </p>

            <label className="block mb-2">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                1 USD =
              </span>
              <div className="flex items-stretch">
                <span className="inline-flex items-center px-3 rounded-l-lg bg-[#0d1117] border border-white/10 border-r-0 text-sm text-gray-400">
                  ₦
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={draftRate}
                  disabled={saving}
                  onChange={(e) => setDraftRate(e.target.value)}
                  className="flex-1 bg-[#0d1117] border border-white/10 rounded-r-lg px-3 py-2 text-sm text-white"
                />
              </div>
              {!rateValid && (
                <span className="block text-[10px] text-rose-300 mt-1">
                  Rate must be a positive number ≤ 1,000,000.
                </span>
              )}
            </label>

            {/* Live preview so the admin sees what the change does to a real
                price they recognise without having to load the public pricing
                page. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
              <PreviewRow usd={50} rate={parsedRate} label="Quick Consult" />
              <PreviewRow usd={100} rate={parsedRate} label="Strategy Session" />
              <PreviewRow usd={1200} rate={parsedRate} label="Phase 2A" />
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
                disabled={saving || !dirty}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition disabled:opacity-40"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !dirty || !rateValid}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save rate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ usd, rate, label }: { usd: number; rate: number; label: string }) {
  return (
    <div className="rounded-lg bg-[#0d1117] border border-white/5 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">
        ${usd.toLocaleString()}{" "}
        <span className="text-gray-500 font-normal">→</span>{" "}
        <span className="text-orange-300">{formatNgnPreview(usd, rate)}</span>
      </p>
    </div>
  );
}
