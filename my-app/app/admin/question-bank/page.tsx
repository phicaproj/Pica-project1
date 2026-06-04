"use client";

import { useState } from "react";
import {
  SlidersHorizontal,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Trash2,
  Copy,
  Download,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

const QUESTIONS = [
  {
    id: "Q-8829",
    tag: "INFRASTRUCTURE",
    tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    text: "Does the current server architecture utilize auto-scaling protocols during peak loads?",
    meta: "4 Options • Scale Type",
  },
  {
    id: "Q-8801",
    tag: "COMPLIANCE",
    tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    text: "Are GDPR data processing agreements signed with all third-party vendors?",
    meta: "Yes/No",
  },
  {
    id: "Q-8775",
    tag: "SECURITY",
    tagColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    text: "Frequency of automated vulnerability scanning on the production environment?",
    meta: "Multiple Choice",
  },
];

const ANSWER_OPTIONS = [
  {
    score: 10,
    label: "Fully Automated Scaling",
    description: "Architecture demonstrates high resilience and dynamic elasticity.",
    recommendation: "Maintain current standards and review cost efficiency monthly.",
  },
  {
    score: 5,
    label: "Partial Manual Scaling",
    description: "Manual intervention required during spikes.",
    recommendation: "Implement basic horizontal pod autoscaling to reduce response time delay.",
  },
];

const QUESTION_TYPES = ["Scale (0-10)", "Yes/No", "Multiple Choice", "Free Text", "Numeric"];
const PILLAR_CATEGORIES = ["Infrastructure", "Compliance", "Security", "Finance", "HR & Culture", "Operations"];
const PILLARS = ["All Pillars", "Infrastructure", "Compliance", "Security", "Finance", "HR & Culture"];

export default function QuestionBankPage() {
  const [activeQ, setActiveQ] = useState(QUESTIONS[0]);
  const [selectedPillar, setSelectedPillar] = useState("All Pillars");
  const [questionType, setQuestionType] = useState("Scale (0-10)");
  const [pillarCategory, setPillarCategory] = useState("Infrastructure");

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Question Bank</h1>
          <p className="text-gray-400 text-sm max-w-lg">
            Configure the logic and diagnostic content for the PICA engine. Changes here propagate to all active assessments.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" /> Export Library
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm text-white font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Question
          </button>
        </div>
      </div>

      {/* Split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — list + filters */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Search & filter */}
          <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-4 space-y-3">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Search & Filter</div>
            <div className="relative">
              <SlidersHorizontal className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Filter by keyword..."
                className="w-full bg-[#111318] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            </div>
            <div className="relative">
              <select value={selectedPillar} onChange={(e) => setSelectedPillar(e.target.value)}
                className="w-full appearance-none bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 pr-8">
                {PILLARS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Question cards */}
          <div className="space-y-3">
            {QUESTIONS.map((q) => (
              <div key={q.id} onClick={() => setActiveQ(q)}
                className={`bg-[#1C1F2E] rounded-2xl border p-4 cursor-pointer transition-all ${
                  activeQ.id === q.id ? "border-blue-500/40 bg-blue-500/5" : "border-white/5 hover:border-white/10"
                }`}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${q.tagColor}`}>{q.tag}</span>
                  <button className="text-gray-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed mb-3">{q.text}</p>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{q.meta}</p>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Architecture Tip</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Use "Scale" type questions for maturity assessments. This allows for more granular scoring compared to binary Yes/No responses.
            </p>
          </div>
        </div>

        {/* Right — edit panel */}
        <div className="lg:col-span-3 bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <div>
              <h2 className="text-lg font-semibold text-white">Edit Question</h2>
              <p className="text-xs text-gray-500 mt-0.5">ID: {activeQ.id} • Last modified 2 hours ago</p>
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Question text */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Question Text</label>
              <textarea defaultValue={activeQ.text} rows={3}
                className="w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-blue-500/50 transition-colors leading-relaxed" />
            </div>

            {/* Type + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Question Type</label>
                <div className="relative">
                  <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full appearance-none bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 pr-8">
                    {QUESTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Pillar Category</label>
                <div className="relative">
                  <select value={pillarCategory} onChange={(e) => setPillarCategory(e.target.value)}
                    className="w-full appearance-none bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 pr-8">
                    {PILLAR_CATEGORIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Help text */}
            <div className="bg-[#111318] rounded-xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Help Text & Guidance</span>
                </div>
                <span className="text-[10px] text-gray-600">Shown to end-users during assessment</span>
              </div>
              <textarea defaultValue="Explain how auto-scaling groups are configured. Provide examples like AWS ASG or Kubernetes relevant to the technical scope." rows={2}
                className="w-full bg-transparent text-sm text-gray-300 resize-none focus:outline-none leading-relaxed" />
            </div>

            {/* Answer options */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Answer Options & Scoring Logic</label>
                <button className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              </div>
              <div className="space-y-3">
                {ANSWER_OPTIONS.map((opt, i) => (
                  <div key={i} className="bg-[#111318] rounded-xl border border-white/5 p-4">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="col-span-1 flex flex-col items-start gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Score</span>
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg font-bold text-white">{opt.score}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm font-semibold text-white mb-2">{opt.label}</div>
                        <textarea defaultValue={opt.description} rows={2}
                          className="w-full bg-[#1C1F2E] border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-300 resize-none focus:outline-none focus:border-blue-500/30" />
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Recommendation</div>
                        <textarea defaultValue={opt.recommendation} rows={2}
                          className="w-full bg-[#1C1F2E] border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-300 resize-none focus:outline-none focus:border-blue-500/30" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
            <button className="px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white text-sm font-semibold rounded-xl transition-colors">
              Discard Changes
            </button>
            <button className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors">
              Publish Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}