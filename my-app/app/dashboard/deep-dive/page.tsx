"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lock,
  Banknote,
  Users,
  Globe,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
  Plus,
  Loader,
  Play,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  getMe,
  getMyPhase2BPillars,
  getMyCompletedResults,
  getAllPillars,
  getPublicPricing,
  Phase2BPillarSession,
  PricingRow,
  getSessionResponses,
  startPhase2B,
  type MeUser,
} from "@/lib/authClient";
import { convertFromUsd, resolveDisplayCurrency } from "@/lib/utils";
import { PillarPickerModal } from "./PillarPickerModal";

const PILLAR_ICONS: Record<string, any> = {
  FINANCE: Banknote,
  OPERATIONS: Users,
  MARKET: Globe,
  DEFAULT: Zap,
};

export default function DeepDivePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pillarsData, setPillarsData] = useState<Phase2BPillarSession[]>([]);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [allPillars, setAllPillars] = useState<any[]>([]);
  // `me.profileComplete` mirrors the BE's Phase 2B gate (needs a resolved
  // businessSize). When false we keep the "Start" / picker triggers disabled
  // and surface a banner pointing at settings.
  const [me, setMe] = useState<MeUser | null>(null);
  
  const [showPicker, setShowPicker] = useState(false);
  const [showPainPoints, setShowPainPoints] = useState(false);
  const [startingPillarId, setStartingPillarId] = useState<string | null>(null);
  
  // Progress state for the active (IN_PROGRESS) session, if any
  const [activeProgress, setActiveProgress] = useState<{
    answeredCount: number;
    totalCount: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getMe();
      if (cancelled) return;
      if (res.data) setMe(res.data.user);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load pillars metadata and public pricing.
        const [pillarsRes, pricingRes] = await Promise.all([
          getAllPillars(),
          getPublicPricing(),
        ]);
        const priceMap = new Map<string, PricingRow>();
        let usdToNgn = 1;
        if (pricingRes.data) {
          usdToNgn = pricingRes.data.usdToNgn ?? 1;
          for (const row of pricingRes.data.phase2B) {
            if (row.pillarId) priceMap.set(row.pillarId, row);
          }
        }
        // Display currency is derived from the user's country. `me` may still
        // be loading in the sibling effect; fall back to USD which the user
        // will see corrected once /auth/me lands (this effect re-runs on me).
        const display = resolveDisplayCurrency(me?.country ?? null);
        if (pillarsRes.data) {
          setAllPillars((pillarsRes.data.pillars || []).map((pillar: any) => {
            const row = priceMap.get(pillar.id);
            return {
              ...pillar,
              price: convertFromUsd(row?.price ?? null, display, usdToNgn),
              currency: display,
            };
          }));
        }

        // Load user's unlocked pillars (Phase2B sessions)
        const myPillarsRes = await getMyPhase2BPillars();
        if (myPillarsRes.data) {
          setPillarsData(myPillarsRes.data.pillars || []);
        }

        // Load completed results
        const resultsRes = await getMyCompletedResults();
        if (resultsRes.data) {
          // Filter results to only phase2b ones if needed, or assume they are mixed but we match by pillar
          setResultsData(resultsRes.data.results || []);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Deep Dive data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // Re-run when the user's country resolves so the picker shows the right
    // currency without a full page reload.
  }, [me?.country]);

  // Fetch progress for the active session when pillarsData updates
  useEffect(() => {
    const activeSession = pillarsData.find((p) => p.status === "IN_PROGRESS");
    if (activeSession && activeSession.sessionId) {
      getSessionResponses(activeSession.sessionId)
        .then((res) => {
          if (res.data) {
            setActiveProgress({
              answeredCount: res.data.answeredCount,
              totalCount: res.data.totalCount,
            });
          }
        })
        .catch(console.error);
    }
  }, [pillarsData]);

  const activeSession = pillarsData.find((p) => p.status === "IN_PROGRESS");
  const ownedPillarIds = new Set(pillarsData.filter(p => p.status === "OPEN").map((p) => p.pillarId));
  
  // Extract findings from completed Phase2B sessions
  const allFindings = resultsData
    .filter((r) => r.phase === "PHASE2B")
    .flatMap((r) => r.pillarScores.flatMap((ps: any) => 
       (ps.findings || []).map((f: any) => ({ ...f, pillarName: ps.pillarName }))
    ));

  const topFindings = allFindings.slice(0, 3);

  const handlePillarSelect = (pillarId: string) => {
    router.push(`/dashboard/subscription?plan=PHASE2B_PILLAR&pillarId=${pillarId}&autoCheckout=1`);
  };

  const handlePillarAction = async (session: Phase2BPillarSession) => {
    if (session.status === "OPEN") {
      try {
        setStartingPillarId(session.pillarId);
        const res = await startPhase2B({ pillarId: session.pillarId });
        if (res.error || !res.data) {
          setError(res.error?.message || "Failed to start Deep Dive.");
          setStartingPillarId(null);
          return;
        }
        router.push(`/dashboard/deep-dive/${res.data.sessionId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start Deep Dive.");
        setStartingPillarId(null);
      }
    } else if (session.status === "IN_PROGRESS") {
      router.push(`/dashboard/deep-dive/${session.sessionId}`);
    } else if (session.status === "COMPLETED") {
      router.push(`/dashboard/reports/${session.sessionId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  // Default to "complete" while /auth/me is in flight so we don't briefly
  // grey out the CTA for users whose profile is fine.
  const profileIncomplete = me ? !me.profileComplete : false;

  return (
    <div className="space-y-6 max-w-full">
      {error && (
        <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      )}

      {profileIncomplete && (
        <div className="px-4 py-3 rounded-xl border border-orange-500/30 bg-orange-500/10 text-sm text-orange-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="flex-1">
            Finish your business profile to unlock Deep Dive modules — we need
            your staff size first.
          </span>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap"
          >
            Complete profile <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Top area: Main card + Pain points */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Action Card (Left) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#111827] border border-white/5 p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            {activeSession ? (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400">
                    Ongoing Analysis
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {activeSession.pillarName}
                </h2>
                <h3 className="text-2xl font-bold text-orange-400 mb-3">Deep Dive</h3>
                <p className="text-sm text-gray-400 max-w-lg mb-8">
                  You have an active Deep Dive session in progress. Continue answering the diagnostic questions to uncover detailed insights and recommendations.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => handlePillarAction(activeSession)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
                  >
                    <Play className="w-4 h-4" /> Resume Module
                  </button>
                  {activeProgress && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Progress</span>
                      <div className="w-32 h-1.5 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-teal-400"
                          style={{
                            width: `${(activeProgress.answeredCount / activeProgress.totalCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-teal-400 font-mono">
                        {Math.round((activeProgress.answeredCount / activeProgress.totalCount) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-500/20 text-teal-400">
                    High-Fidelity Diagnostics
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Architectural Intelligence
                </h2>
                <p className="text-sm text-gray-400 max-w-lg mb-8">
                  The Deep Dive Modules provide granular, high-fidelity insights into your business ecosystem. Select a specific pillar to establish your baseline and generate actionable findings.
                </p>
                <button
                  onClick={() => setShowPicker(true)}
                  disabled={profileIncomplete}
                  title={profileIncomplete ? "Complete your business profile first" : undefined}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition shadow-lg shadow-orange-500/20"
                >
                  Start New Module <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Critical Pain Points */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Critical Pain Points</h3>
            {allFindings.length > 0 && (
              <button 
                onClick={() => setShowPainPoints(true)}
                className="text-orange-400 text-xs font-semibold hover:text-orange-300"
              >
                View All
              </button>
            )}
          </div>
          
          <div className="space-y-3 flex-1">
            {topFindings.length > 0 ? (
              topFindings.map((finding: any, i: number) => {
                const Icon = finding.riskType === "Critical" ? AlertTriangle : Zap;
                const severityColor = finding.riskType === "Critical" ? "text-red-400 bg-red-400/10" : "text-orange-400 bg-orange-400/10";
                
                return (
                  <div key={i} className="rounded-xl bg-[#111827] border border-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Icon className={`w-4 h-4 ${severityColor.split(" ")[0]}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase ${severityColor.split(" ")[0]}`}>
                            {finding.pillarName} • {finding.riskType || "Finding"}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white truncate" title={finding.observation}>
                          {finding.observation}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {finding.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl bg-[#111827] border border-white/5 p-6 flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-8 h-8 text-gray-600 mb-3" />
                <p className="text-sm text-gray-400">
                  Complete a Deep Dive to surface findings here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Architectural Modules Sidebar (Bottom/Full width) */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Architectural Modules</h2>
            <p className="text-xs text-gray-500">
              Your purchased and completed Deep Dive modules.
            </p>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            disabled={profileIncomplete}
            title={profileIncomplete ? "Complete your business profile first" : undefined}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" /> New Pillar Deep Dive
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillarsData.length > 0 ? (
            pillarsData.map((session) => {
              const Icon = PILLAR_ICONS[session.pillarCode.toUpperCase()] || PILLAR_ICONS.DEFAULT;
              let statusColor = "";
              let statusLabel = "";
              
              if (session.status === "OPEN") {
                statusColor = "text-gray-400 bg-white/5";
                statusLabel = "Ready to Start";
              } else if (session.status === "IN_PROGRESS") {
                statusColor = "text-orange-400 bg-orange-400/10";
                statusLabel = "In Progress";
              } else {
                statusColor = "text-teal-400 bg-teal-400/10";
                statusLabel = "Completed";
              }

              return (
                <div key={session.pillarId} className="rounded-xl bg-[#111827] border border-white/5 p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{session.pillarName}</h3>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">{session.pillarCode}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${statusColor}`}>
                      {statusLabel}
                    </span>
                    <button
                      onClick={() => handlePillarAction(session)}
                      disabled={startingPillarId === session.pillarId}
                      className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition disabled:opacity-50"
                    >
                      {startingPillarId === session.pillarId ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-xl bg-[#111827] border border-white/5 p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No active modules</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-sm">
                You haven't started any Deep Dive modules yet. Choose a pillar to begin your in-depth architectural analysis.
              </p>
              <button
                onClick={() => setShowPicker(true)}
                disabled={profileIncomplete}
                title={profileIncomplete ? "Complete your business profile first" : undefined}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                Start your first Deep Dive
              </button>
            </div>
          )}
        </div>
      </div>

      {showPicker && (
        <PillarPickerModal
          pillars={allPillars}
          ownedPillarIds={ownedPillarIds}
          onClose={() => setShowPicker(false)}
          onSelect={handlePillarSelect}
        />
      )}

      {showPainPoints && (
        <PainPointsModal
          findings={allFindings}
          onClose={() => setShowPainPoints(false)}
        />
      )}
    </div>
  );
}

function PainPointsModal({ findings, onClose }: { findings: any[]; onClose: () => void }) {
  const grouped = findings.reduce((acc: any, f: any) => {
    if (!acc[f.pillarName]) acc[f.pillarName] = [];
    acc[f.pillarName].push(f);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl bg-[#0d1117] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">All Critical Pain Points</h2>
            <p className="text-sm text-gray-500">Comprehensive findings from your Deep Dive modules.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-8">
          {Object.keys(grouped).map(pillarName => (
            <div key={pillarName}>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">{pillarName}</h3>
              <div className="space-y-3">
                {grouped[pillarName].map((finding: any, i: number) => {
                  const Icon = finding.riskType === "Critical" ? AlertTriangle : Zap;
                  const severityColor = finding.riskType === "Critical" ? "text-red-400 bg-red-400/10" : "text-orange-400 bg-orange-400/10";
                  return (
                    <div key={i} className="rounded-xl bg-[#111827] border border-white/5 p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Icon className={`w-4 h-4 ${severityColor.split(" ")[0]}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase ${severityColor.split(" ")[0]}`}>
                            {finding.riskType || "Finding"}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white">{finding.observation}</p>
                        <p className="text-xs text-gray-500 mt-1">{finding.recommendation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
