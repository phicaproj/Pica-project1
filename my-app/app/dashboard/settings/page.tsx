"use client";

export default function DashboardSettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="rounded-2xl border border-white/5 bg-[#111827] p-8 md:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400">
          Settings
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-white">
          Workspace settings are on the way.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400">
          This placeholder route keeps dashboard navigation stable while we wire the
          actual settings experience. Your account and scan data remain unchanged.
        </p>
      </div>
    </div>
  );
}
