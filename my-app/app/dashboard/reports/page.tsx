"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Plus,
  Calendar,
  TrendingUp,
  ArrowRight,
  Sparkles,
  FileText,
  ChevronRight,
  Lock,
  Database,
  Globe,
  Clock,
  Loader,
  Search,
  Activity,
  Filter,
  ArrowLeftRight,
  Building2,
  ChevronDown
} from "lucide-react";
import { getAccessToken } from "@/lib/authClient";
import { ReportsListSkeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/ThemeContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://pica-project1.onrender.com/api";

type ColorBand = "RED" | "AMBER" | "GREEN";

function normalizeColorBand(value: unknown): ColorBand {
  if (typeof value !== "string") return "AMBER";
  const normalized = value.trim().toUpperCase();
  if (normalized === "GREEN" || normalized === "AMBER" || normalized === "RED") {
    return normalized;
  }
  if (normalized === "YELLOW") return "AMBER";
  return "AMBER";
}

function formatDate(isoString: string | null) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isResultResponse(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    message?: unknown;
    paywalled?: unknown;
    result?: { pillarScores?: unknown; totalScore?: unknown } | null;
  };
  return (
    typeof candidate.message === "string" &&
    typeof candidate.paywalled === "boolean" &&
    !!candidate.result &&
    Array.isArray(candidate.result.pillarScores)
  );
}

// ─── Decorative SVG for Empty State ─────────────────────────────────────────
function NetworkIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto mb-6">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="100"
          cy="100"
          r="90"
          stroke="rgba(20,184,166,0.15)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx="100"
          cy="100"
          r="70"
          stroke="rgba(20,184,166,0.25)"
          strokeWidth="1.5"
        />
        <circle cx="100" cy="100" r="50" fill="rgba(20,184,166,0.08)" />
        <circle
          cx="100"
          cy="100"
          r="50"
          stroke="rgba(20,184,166,0.3)"
          strokeWidth="1.5"
        />

        <circle cx="100" cy="60" r="4" fill="rgba(20,184,166,0.6)" />
        <circle cx="130" cy="85" r="3" fill="rgba(20,184,166,0.5)" />
        <circle cx="120" cy="120" r="3.5" fill="rgba(20,184,166,0.5)" />
        <circle cx="80" cy="115" r="3" fill="rgba(20,184,166,0.5)" />
        <circle cx="75" cy="82" r="4" fill="rgba(20,184,166,0.6)" />
        <circle cx="100" cy="100" r="5" fill="rgba(20,184,166,0.8)" />

        <line x1="100" y1="60" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
        <line x1="130" y1="85" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
        <line x1="120" y1="120" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
        <line x1="80" y1="115" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
        <line x1="75" y1="82" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />

        <circle cx="100" cy="10" r="2.5" fill="rgba(20,184,166,0.3)" />
        <circle cx="160" cy="40" r="2" fill="rgba(20,184,166,0.25)" />
        <circle cx="185" cy="105" r="2.5" fill="rgba(20,184,166,0.3)" />
        <circle cx="145" cy="170" r="2" fill="rgba(20,184,166,0.25)" />
        <circle cx="55" cy="170" r="2.5" fill="rgba(20,184,166,0.3)" />
        <circle cx="20" cy="105" r="2" fill="rgba(20,184,166,0.25)" />
        <circle cx="40" cy="40" r="2.5" fill="rgba(20,184,166,0.3)" />
      </svg>

      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-teal-400" />
      </div>

      <div className="absolute bottom-4 left-2 w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
        <FileText className="w-4 h-4 text-teal-400" />
      </div>
    </div>
  );
}

// ─── Skeleton Placeholder Cards ─────────────────────────────────────────────
function SkeletonCards() {
  const { dark: d } = useTheme();
  return (
    <div className="flex gap-3 justify-center my-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-40 h-24 rounded-lg border p-3 flex flex-col justify-between ${
            d ? "bg-[#0d1117] border-white/5" : "bg-gray-100/80 border-gray-200"
          }`}
        >
          <div className="space-y-1.5">
            <div className={`h-2 rounded-full w-3/4 ${d ? "bg-white/10" : "bg-gray-300"}`} />
            <div className={`h-2 rounded-full w-1/2 ${d ? "bg-white/5" : "bg-gray-200"}`} />
          </div>
          <div className="space-y-1.5">
            <div className={`h-1.5 rounded-full w-full ${d ? "bg-white/5" : "bg-gray-200"}`} />
            <div className={`h-1.5 rounded-full w-2/3 ${d ? "bg-white/5" : "bg-gray-200"}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PAGE EXPORT ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { dark } = useTheme();
  const d = dark;
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedScore, setSelectedScore] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  useEffect(() => {
    const fetchResults = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/result/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          let items: unknown[] = [];
          if (Array.isArray(json)) items = json;
          else if (json && Array.isArray(json.results)) items = json.results;
          else if (json && Array.isArray(json.data)) items = json.data;

          const validResults = items.filter(isResultResponse);
          // Sort by creation date descending
          validResults.sort((a: any, b: any) => {
            const dateA = new Date(a.result.createdAt).getTime();
            const dateB = new Date(b.result.createdAt).getTime();
            return dateB - dateA;
          });
          setResults(validResults);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return <ReportsListSkeleton />;
  }

  // ─── METRIC COMPUTATIONS ───────────────────────────────────────────────────
  const totalAssessments = results.length;

  // Average Health Score
  const completedScores = results.map(r => r.result?.totalScore || 0);
  const healthScore = totalAssessments > 0 
    ? Math.round(completedScores.reduce((a, b) => a + b, 0) / totalAssessments)
    : 0;

  let healthStatusLabel = "N/A";
  let healthStatusColor = d
    ? "text-gray-500 bg-gray-500/10 border-gray-500/20"
    : "text-gray-600 bg-gray-100 border-gray-200";
  if (totalAssessments > 0) {
    if (healthScore >= 70) {
      healthStatusLabel = "HEALTHY";
      healthStatusColor = d
        ? "text-teal-400 bg-teal-500/10 border-teal-500/20"
        : "text-teal-700 bg-teal-50 border-teal-200";
    } else if (healthScore >= 40) {
      healthStatusLabel = "NEEDS ATTENTION";
      healthStatusColor = d
        ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
        : "text-orange-700 bg-orange-50 border-orange-200";
    } else {
      healthStatusLabel = "CRITICAL RISK";
      healthStatusColor = d
        ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
        : "text-rose-700 bg-rose-50 border-rose-200";
    }
  }

  // Score Trend Delta
  let trendLabel = "Stable";
  let trendDelta = "0%";
  let trendColor = d ? "text-gray-400" : "text-gray-500";
  if (totalAssessments >= 2) {
    const newestScore = results[0]?.result?.totalScore || 0;
    const prevScore = results[1]?.result?.totalScore || 0;
    const diff = newestScore - prevScore;
    if (diff > 0) {
      trendLabel = "Improving";
      trendDelta = `+${diff}%`;
      trendColor = d ? "text-teal-400" : "text-teal-600";
    } else if (diff < 0) {
      trendLabel = "Declining";
      trendDelta = `${diff}%`;
      trendColor = d ? "text-rose-400" : "text-rose-600";
    }
  } else if (totalAssessments === 1) {
    trendLabel = "Baseline Set";
    trendDelta = "0%";
    trendColor = d ? "text-gray-400" : "text-gray-500";
  }

  // Small bar chart data (up to last 6 assessments)
  const chartScores = [...results].slice(0, 6).reverse().map(r => r.result?.totalScore || 0);

  // Last Assessment Date
  const lastAssessmentDate = totalAssessments > 0 
    ? formatDate(results[0]?.result?.createdAt)
    : "No records";

  // Days since last assessment
  let daysAgoLabel = "Start today";
  if (totalAssessments > 0) {
    const lastTime = new Date(results[0]?.result?.createdAt).getTime();
    const diffDays = Math.max(0, Math.round((Date.now() - lastTime) / (1000 * 60 * 60 * 24)));
    daysAgoLabel = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
  }

  // ─── FILTER LOGIC ──────────────────────────────────────────────────────────
  const filteredResults = results.filter((item) => {
    const res = item.result;
    
    // Keyword search (Session ID or Pillar Names)
    const matchesSearch = 
      res.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.pillarScores || []).some((ps: any) => 
        ps.pillar?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Diagnostic Type
    const isStrategic = (res.pillarScores || []).length > 1;
    const matchesType = 
      selectedType === "ALL" ||
      (selectedType === "STRATEGIC" && isStrategic) ||
      (selectedType === "DEEP_DIVE" && !isStrategic);

    // Score Range
    const score = res.totalScore || 0;
    const matchesScore =
      selectedScore === "ALL" ||
      (selectedScore === "HIGH" && score >= 70) ||
      (selectedScore === "MEDIUM" && score >= 40 && score < 70) ||
      (selectedScore === "LOW" && score < 40);

    // Lock Status
    const matchesStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "LOCKED" && item.paywalled) ||
      (selectedStatus === "UNLOCKED" && !item.paywalled);

    return matchesSearch && matchesType && matchesScore && matchesStatus;
  });

  return (
    <div className={`max-w-7xl mx-auto px-4 md:px-6 py-6 min-h-screen space-y-8 ${d ? 'text-white bg-[#0d1117]' : 'text-gray-900 bg-gray-50'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl md:text-4xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>
            Reports & Assessments
          </h1>
          <p className={`text-sm ${d ? 'text-gray-400' : 'text-gray-600'} max-w-2xl`}>
            Track your business health and progress over time with data-driven architectural insights.
          </p>
        </div>
        <div>
          <button 
            onClick={() => window.location.href = "/dashboard/strategic-scan"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.2)] text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Take New Assessment
          </button>
        </div>
      </div>

      {totalAssessments === 0 ? (
        /* Empty State */
        <div className="space-y-8 max-w-full">
          <div className={`rounded-2xl border p-8 md:p-12 text-center relative overflow-hidden ${
            d 
              ? 'bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border-white/5' 
              : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 border-gray-200 shadow-sm'
          }`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <NetworkIllustration />

              <h2 className={`text-2xl md:text-3xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-4`}>
                Your Intelligence Archive is Ready
              </h2>

              <p className={`${d ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base max-w-2xl mx-auto mb-2 leading-relaxed`}>
                Initialize your data streams to activate advanced analytics. After completing the{" "}
                <span className={d ? 'text-teal-400' : 'text-teal-600 font-medium'}>Strategic Scan</span>, you will unlock high-fidelity reports, including competitive delta analysis and personalized insights.
              </p>

              <SkeletonCards />

              <button
                onClick={() => window.location.href = "/dashboard/strategic-scan"}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition mt-2 shadow-lg shadow-orange-500/20"
              >
                Start Strategic Scan 🚀
              </button>

              <p className={`text-[10px] ${d ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest font-bold mt-4`}>
                Estimated Processing Time: 120 Seconds
              </p>
            </div>
          </div>

          {/* Decorative Bottom Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`rounded-xl border p-5 text-center ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Database className={`w-4 h-4 ${d ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-2xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>2.4TB</p>
              <p className={`text-[10px] ${d ? 'text-gray-500' : 'text-gray-500'} uppercase font-bold tracking-wider mt-1`}>Processed</p>
            </div>
            <div className={`rounded-xl border p-5 text-center ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Globe className={`w-4 h-4 ${d ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-2xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>140+</p>
              <p className={`text-[10px] ${d ? 'text-gray-500' : 'text-gray-500'} uppercase font-bold tracking-wider mt-1`}>Global Sources</p>
            </div>
            <div className={`rounded-xl border p-5 text-center ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className={`w-4 h-4 ${d ? 'text-teal-400' : 'text-teal-600'}`} />
              </div>
              <p className={`text-2xl font-bold ${d ? 'text-teal-400' : 'text-teal-600'}`}>Real-time</p>
              <p className={`text-[10px] ${d ? 'text-gray-500' : 'text-gray-500'} uppercase font-bold tracking-wider mt-1`}>Latency</p>
            </div>
            <div className={`rounded-xl border p-5 text-center ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Lock className={`w-4 h-4 ${d ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-2xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>Encrypted</p>
              <p className={`text-[10px] ${d ? 'text-gray-500' : 'text-gray-500'} uppercase font-bold tracking-wider mt-1`}>Security</p>
            </div>
          </div>
        </div>
      ) : (
        /* Full Dashboard Reports View */
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-xl border p-5 flex flex-col justify-between ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`text-[10px] font-bold uppercase tracking-wider ${d ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                TOTAL ASSESSMENTS
              </h3>
              <div className="flex items-end gap-3">
                <span className={`text-4xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>{totalAssessments}</span>
                <span className={`text-xs font-semibold ${d ? 'text-teal-400' : 'text-teal-600'} mb-1 flex items-center`}>
                  <Activity className="w-3.5 h-3.5 mr-1" />
                  active
                </span>
              </div>
            </div>

            <div className={`rounded-xl border p-5 flex flex-col justify-between ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`text-[10px] font-bold uppercase tracking-wider ${d ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                HEALTH SCORE
              </h3>
              <div className="flex flex-col gap-1">
                <div className="flex items-end gap-3">
                  <span className={`text-4xl font-bold ${d ? 'text-teal-400' : 'text-teal-600'}`}>{healthScore}%</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthStatusColor}`}>
                    {healthStatusLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-5 flex flex-col justify-between ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`text-[10px] font-bold uppercase tracking-wider ${d ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                LAST ASSESSMENT
              </h3>
              <div>
                <p className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'} mb-1`}>{lastAssessmentDate}</p>
                <p className={`text-xs ${d ? 'text-gray-500' : 'text-gray-500'} mb-3`}>{daysAgoLabel}</p>
                <div className={`h-1.5 rounded-full ${d ? 'bg-white/5' : 'bg-gray-100'} overflow-hidden`}>
                  <div className="h-full bg-indigo-500 w-[100%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${d ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by keyword or session ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-full border text-sm focus:outline-none transition ${
                  d 
                    ? 'bg-[#111827] border-white/5 text-white placeholder:text-gray-500 focus:border-white/20' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-300'
                }`}
              />
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap gap-2">
              {/* Type Select */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className={`appearance-none border text-sm px-4 py-3 pr-10 rounded-full transition focus:outline-none ${
                    d 
                      ? 'bg-[#111827] border-white/5 text-gray-300 hover:bg-white/5' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  <option value="ALL" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>All Types</option>
                  <option value="STRATEGIC" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>Strategic Scan</option>
                  <option value="DEEP_DIVE" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>Deep Dive</option>
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${d ? 'text-gray-500' : 'text-gray-400'} pointer-events-none`} />
              </div>

              {/* Score Range Select */}
              <div className="relative">
                <select
                  value={selectedScore}
                  onChange={(e) => setSelectedScore(e.target.value)}
                  className={`appearance-none border text-sm px-4 py-3 pr-10 rounded-full transition focus:outline-none ${
                    d 
                      ? 'bg-[#111827] border-white/5 text-gray-300 hover:bg-white/5' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  <option value="ALL" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>All Scores</option>
                  <option value="HIGH" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>High (&gt;=70%)</option>
                  <option value="MEDIUM" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>Medium (40% - 69%)</option>
                  <option value="LOW" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>Critical (&lt;40%)</option>
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${d ? 'text-gray-500' : 'text-gray-400'} pointer-events-none`} />
              </div>

              {/* Status Select */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`appearance-none border text-sm px-4 py-3 pr-10 rounded-full transition focus:outline-none ${
                    d 
                      ? 'bg-[#111827] border-white/5 text-gray-300 hover:bg-white/5' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  <option value="ALL" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>All Statuses</option>
                  <option value="UNLOCKED" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>Unlocked</option>
                  <option value="LOCKED" className={d ? 'bg-[#111827] text-white' : 'bg-white text-gray-900'}>Locked</option>
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${d ? 'text-gray-500' : 'text-gray-400'} pointer-events-none`} />
              </div>
            </div>
          </div>

          {/* Dynamic Recent History List */}
          <div className="space-y-4">
            <h3 className={`text-[10px] font-bold uppercase tracking-wider ${d ? 'text-gray-500' : 'text-gray-500'}`}>
              RECENT HISTORY ({filteredResults.length})
            </h3>
            
            {filteredResults.length === 0 ? (
              <div className={`rounded-xl border p-10 text-center ${
                d ? 'border-white/5 bg-[#111827]/50' : 'border-gray-200 bg-white shadow-sm'
              }`}>
                <p className={`${d ? 'text-gray-400' : 'text-gray-600'} text-sm`}>No assessments match your current filter options.</p>
              </div>
            ) : (
              filteredResults.map((item) => {
                const res = item.result;
                const isStrategic = (res.pillarScores || []).length > 1;
                
                // Get display properties
                let title = "Strategic Scan Summary";
                let iconColor = d 
                  ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" 
                  : "text-indigo-600 bg-indigo-50 border-indigo-200";
                let iconElement = <Activity className="w-5 h-5" />;

                if (!isStrategic && res.pillarScores?.[0]) {
                  const pillar = res.pillarScores[0].pillar;
                  title = `${pillar.name} Deep Dive`;
                  iconColor = d 
                    ? "text-orange-400 bg-orange-500/10 border-orange-500/20" 
                    : "text-orange-600 bg-orange-50 border-orange-200";
                  iconElement = <Building2 className="w-5 h-5" />;
                }

                // Normalise scoring band
                const band = normalizeColorBand(res.colorBand);
                let badgeLabel: string = band;
                let badgeStyle = d 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                  : "bg-amber-50 border-amber-200 text-amber-700";
                if (band === "GREEN") {
                  badgeLabel = "Healthy";
                  badgeStyle = d 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-emerald-50 border-emerald-200 text-emerald-700";
                } else if (band === "RED") {
                  badgeLabel = "Critical Risk";
                  badgeStyle = d 
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                    : "bg-rose-50 border-rose-200 text-rose-700";
                }

                const scoreVal = Math.round(res.totalScore || 0);

                return (
                  <div 
                    key={res.sessionId} 
                    className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border gap-4 transition ${
                      d 
                        ? 'bg-[#111827] border-white/5 hover:border-white/10 hover:bg-[#161f33]' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                        {iconElement}
                      </div>
                      <div>
                        <h4 className={`text-base font-bold ${d ? 'text-white' : 'text-gray-900'} mb-1`}>{title}</h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(res.createdAt)}
                          </span>
                          <span className="text-[10px] text-gray-500 tracking-wider font-mono">
                            ID: {res.sessionId.substring(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 mt-2 md:mt-0">
                      {/* Status */}
                      <div className="text-left md:text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">STATUS</p>
                        {item.paywalled ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${
                            d 
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}>
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">SCORE</p>
                        <p className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>{scoreVal}%</p>
                      </div>

                      {/* Navigation Actions */}
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/dashboard/reports/${res.sessionId}`}
                          className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white transition block"
                        >
                          View Report
                        </Link>
                        
                        {/* Download Trigger */}
                        {res.reportPdfUrl && !item.paywalled ? (
                          <a 
                            href={res.reportPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-lg transition block ${
                              d 
                                ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' 
                                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                            title="Download PDF Report"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        ) : (
                          <div className={`p-2 rounded-lg pointer-events-none cursor-not-allowed ${
                            d ? 'bg-white/[0.02] text-gray-700' : 'bg-gray-50 text-gray-300'
                          }`}>
                            <Download className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Call to Action Box */}
          <div className={`rounded-2xl border border-dashed p-10 flex flex-col items-center justify-center text-center mt-6 ${
            d ? 'border-white/5 bg-[#111827]/50' : 'border-gray-200 bg-white shadow-sm'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              d ? 'bg-white/5' : 'bg-gray-100'
            }`}>
              <Clock className={`w-6 h-6 ${d ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>Build Your Data Timeline</h3>
            <p className={`text-sm ${d ? 'text-gray-400' : 'text-gray-600'} max-w-md mx-auto mb-6`}>
              Take regular assessments to see how your business health evolves. Consistent reporting unlocks predictive trends and deep-benchmarking.
            </p>
            <button 
              onClick={() => window.location.href = "/dashboard/strategic-scan"}
              className={`text-sm font-semibold transition flex items-center gap-2 ${
                d ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
              }`}
            >
              Start new assessment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
