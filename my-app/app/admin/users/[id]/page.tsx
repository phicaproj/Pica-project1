"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader,
  X,
} from "lucide-react";
import {
  getAdminSessionDetails,
  getAdminUserDetails,
  getAdminUserPayments,
  getAdminUserSessions,
  type AdminSessionDetail,
  type AdminUserDetails,
  type AdminUserPaymentsResponse,
  type AdminUserSessionsResponse,
} from "@/lib/authClient";
import { formatMoney } from "@/lib/utils";

const SUB_PAGE_SIZE = 5;

// ── Display helpers ───────────────────────────────────────────

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "N/A";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusBadge = (status: string) =>
  status === "COMPLETED" || status === "REPORT_GENERATED" || status === "PAID"
    ? "bg-emerald-500/10 text-emerald-400"
    : "bg-amber-500/10 text-amber-400";

const paymentBadge = (status: string) =>
  status === "SUCCESS"
    ? "bg-emerald-500/10 text-emerald-400"
    : status === "PENDING"
      ? "bg-amber-500/10 text-amber-400"
      : "bg-red-500/10 text-red-400";

const bandBadge = (band: "RED" | "AMBER" | "GREEN" | null) => {
  if (band === "GREEN") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (band === "AMBER") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (band === "RED") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-white/5 text-gray-500 border-white/10";
};

const riskBadge = (risk: "NORMAL" | "RISK" | "KNOCKOUT") =>
  risk === "NORMAL"
    ? "bg-emerald-500/10 text-emerald-400"
    : risk === "RISK"
      ? "bg-amber-500/10 text-amber-400"
      : "bg-red-500/10 text-red-400";

const phaseLabel = (phase: string) =>
  phase === "PHASE1" ? "Phase 1" : phase === "PHASE2A" ? "Phase 2A" : "Phase 2B";

// ── Shared pagination footer for the two tables ───────────────

function SubPagination({
  page,
  totalPages,
  total,
  label,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  label: string;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
      <span className="text-xs text-gray-500">
        {total.toLocaleString()} {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 text-xs text-gray-400">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;

  const [details, setDetails] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<AdminUserSessionsResponse | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [payments, setPayments] = useState<AdminUserPaymentsResponse | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(
    async (page: number) => {
      setSessionsLoading(true);
      const res = await getAdminUserSessions(userId, { page, pageSize: SUB_PAGE_SIZE });
      if (res.data) setSessions(res.data);
      setSessionsLoading(false);
    },
    [userId],
  );

  const loadPayments = useCallback(
    async (page: number) => {
      setPaymentsLoading(true);
      const res = await getAdminUserPayments(userId, { page, pageSize: SUB_PAGE_SIZE });
      if (res.data) setPayments(res.data);
      setPaymentsLoading(false);
    },
    [userId],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const res = await getAdminUserDetails(userId);
      if (cancelled) return;
      if (res.error) setError(res.error.message);
      else if (res.data) setDetails(res.data.user);
      setLoading(false);
    }
    void load();
    void loadSessions(1);
    void loadPayments(1);
    return () => {
      cancelled = true;
    };
  }, [userId, loadSessions, loadPayments]);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="max-w-xl mx-auto mt-12 rounded-2xl border border-red-500/20 bg-[#1C1F2E] p-8 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Unable to load user</h2>
        <p className="text-sm text-red-400 mb-6">{error || "User not found"}</p>
        <button
          onClick={() => router.push("/admin/users")}
          className="rounded-lg bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
        >
          Back to users
        </button>
      </div>
    );
  }

  const name =
    `${details.firstName ?? ""} ${details.lastName ?? ""}`.trim() || details.email;

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push("/admin/users")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to users
        </button>
        <div className="flex items-center gap-4">
          {details.avatarUrl ? (
            <img
              src={details.avatarUrl}
              alt={name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xl font-bold text-white">
              {name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <p className="text-sm text-gray-400">{details.email}</p>
            {details.phone && (
              <p className="text-xs text-gray-500 mt-0.5">{details.phone}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${details.isActive ? "bg-emerald-500" : "bg-red-500"}`}
            />
            <span
              className={`text-xs font-medium ${details.isActive ? "text-emerald-400" : "text-red-400"}`}
            >
              {details.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Business Profile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-2xl border border-white/5 bg-[#1C1F2E] p-5">
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Business Name
          </span>
          <span className="text-sm text-white font-medium">
            {details.businessName || "Unspecified"}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Business Size
          </span>
          <span className="text-xs text-white font-semibold px-2.5 py-0.5 border border-white/10 rounded-full bg-white/5 inline-block mt-0.5">
            {details.businessSize || "Unspecified"}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Industry
          </span>
          <span className="text-sm text-white font-medium">
            {details.industry || "Unspecified"}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Plan / Subscription
          </span>
          <span className="text-sm text-blue-400 font-semibold">
            {details.subscriptionPlan || "FREE"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: details.totalSessions },
          { label: "Completed Sessions", value: details.completedSessions },
          { label: "Successful Payments", value: details.totalSuccessfulPayments },
          {
            label: "Total Spent",
            // Admin-facing roll-up always in USD (base currency). Per-payment
            // rows below still render in their captured currency.
            value: formatMoney(details.totalSpent, "USD"),
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-[#1C1F2E] p-4 text-center"
          >
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              {stat.label}
            </div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Sessions (paginated) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Assessment Sessions
        </h3>
        <div className="rounded-2xl border border-white/5 bg-[#1C1F2E] overflow-hidden">
          {sessionsLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          ) : !sessions || sessions.sessions.length === 0 ? (
            <div className="text-xs text-gray-500 italic py-10 text-center">
              No sessions found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-gray-400">
                      <th className="px-4 py-3">Phase / ID</th>
                      <th className="px-4 py-3">Pillar</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Updated</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.sessions.map((session) => (
                      <tr
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">
                            {phaseLabel(session.phase)}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {session.id}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {session.pillarName || "All Pillars"}
                        </td>
                        <td className="px-4 py-3">
                          {session.totalScore !== null ? (
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${bandBadge(session.colorBand)}`}
                            >
                              {session.totalScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {formatDate(session.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge(session.status)}`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {session.reportPdfUrl ? (
                            <a
                              href={session.reportPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Download
                            </a>
                          ) : (
                            <span className="text-gray-600">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <SubPagination
                page={sessions.page}
                totalPages={sessions.totalPages}
                total={sessions.total}
                label="sessions"
                onPage={(p) => void loadSessions(p)}
              />
            </>
          )}
        </div>
        <p className="text-[11px] text-gray-600 mt-2">
          Click a session to see its score breakdown and answers.
        </p>
      </div>

      {/* Payments (paginated) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Payments
        </h3>
        <div className="rounded-2xl border border-white/5 bg-[#1C1F2E] overflow-hidden">
          {paymentsLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          ) : !payments || payments.payments.length === 0 ? (
            <div className="text-xs text-gray-500 italic py-10 text-center">
              No payments found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-gray-400">
                      <th className="px-4 py-3">Reference / Plan</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid At</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">
                            {payment.plan === "PHASE2A" ? "Phase 2A" : "Phase 2B"}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {payment.reference}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {payment.currency}{" "}
                          {new Intl.NumberFormat("en-NG").format(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {formatDate(payment.paidAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${paymentBadge(payment.status)}`}
                          >
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <SubPagination
                page={payments.page}
                totalPages={payments.totalPages}
                total={payments.total}
                label="payments"
                onPage={(p) => void loadPayments(p)}
              />
            </>
          )}
        </div>
      </div>

      {/* Session detail modal */}
      {selectedSessionId && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}

// ── Session detail modal ──────────────────────────────────────

function SessionDetailModal({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const [session, setSession] = useState<AdminSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const res = await getAdminSessionDetails(sessionId);
      if (cancelled) return;
      if (res.error) setError(res.error.message);
      else if (res.data) setSession(res.data.session);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="flex flex-col max-h-[90vh] w-full max-w-5xl rounded-2xl border border-white/10 bg-[#1C1F2E] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5 bg-[#171923]">
          <div>
            <h2 className="text-lg font-bold text-white">
              {session
                ? `${phaseLabel(session.phase)} Session${session.pillarName ? ` — ${session.pillarName}` : ""}`
                : "Session Details"}
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-1">{sessionId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : error || !session ? (
            <div className="py-12 text-center text-sm text-red-400">
              {error || "Failed to load session"}
            </div>
          ) : (
            <>
              {/* Session meta + overall result */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Total Score
                  </div>
                  {session.result ? (
                    <span
                      className={`inline-block px-3 py-1 rounded-full border text-lg font-bold ${bandBadge(session.result.colorBand)}`}
                    >
                      {session.result.totalScore.toFixed(1)}
                    </span>
                  ) : (
                    <div className="text-lg font-bold text-gray-600">—</div>
                  )}
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Status
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(session.status)}`}
                  >
                    {session.status}
                  </span>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Started
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {formatDate(session.startedAt)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Completed
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {formatDate(session.completedAt)}
                  </div>
                </div>
              </div>

              {session.result?.hasAnyKnockout && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  This session triggered at least one knockout answer.
                </div>
              )}

              {/* Pillar scores */}
              {session.pillarScores.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                    Pillar Scores
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-gray-400">
                          <th className="px-4 py-3">Pillar</th>
                          <th className="px-4 py-3">Raw Score</th>
                          <th className="px-4 py-3">Weighted (0–100)</th>
                          <th className="px-4 py-3">Band</th>
                          <th className="px-4 py-3">Knockout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.pillarScores.map((score) => (
                          <tr
                            key={score.pillarId}
                            className="border-b border-white/5 last:border-0"
                          >
                            <td className="px-4 py-3">
                              <span className="font-semibold text-white">
                                {score.pillarName}
                              </span>
                              <span className="text-[10px] font-mono text-gray-500 ml-2">
                                {score.pillarCode}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-300">
                              {score.rawScore} / {score.maxPossibleScore}
                            </td>
                            <td className="px-4 py-3 text-white font-medium">
                              {score.weightedScore.toFixed(1)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${bandBadge(score.colorBand)}`}
                              >
                                {score.colorBand}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {score.hasKnockout ? (
                                <span className="text-red-400 font-semibold">Yes</span>
                              ) : (
                                <span className="text-gray-600">No</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Answered questions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Answered Questions ({session.responses.length})
                </h3>
                {session.responses.length === 0 ? (
                  <div className="text-xs text-gray-500 italic py-8 text-center border border-dashed border-white/10 rounded-xl">
                    No answers recorded for this session yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-gray-400">
                          <th className="px-4 py-3">Pillar</th>
                          <th className="px-4 py-3">Question</th>
                          <th className="px-4 py-3">Selected Answer</th>
                          <th className="px-4 py-3">Score</th>
                          <th className="px-4 py-3">Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.responses.map((response) => (
                          <tr
                            key={response.questionId}
                            className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] align-top"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-semibold text-white">
                                {response.pillarCode}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-sm">
                              <div className="text-gray-200">{response.questionText}</div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                {response.questionCode}
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-sm">
                              <span className="font-bold text-white mr-1.5">
                                {response.selectedLabel}.
                              </span>
                              <span className="text-gray-300">{response.selectedText}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-white font-medium">
                              {response.scoreAtTime} / {response.maxScore}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${riskBadge(response.riskTypeAtTime)}`}
                              >
                                {response.riskTypeAtTime}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-white/5 px-6 py-4 bg-[#171923]">
          <button
            onClick={onClose}
            className="rounded-lg bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
