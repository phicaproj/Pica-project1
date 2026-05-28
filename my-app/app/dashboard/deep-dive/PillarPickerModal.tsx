"use client";

import { X, ArrowRight, Lock } from "lucide-react";

export const PHASE2B_PILLAR_PRICE_NGN = 50000;

interface PillarPickerModalProps {
  onClose: () => void;
  pillars: any[];
  ownedPillarIds: Set<string>;
  onSelect: (pillarId: string) => void;
}

export function PillarPickerModal({ onClose, pillars, ownedPillarIds, onSelect }: PillarPickerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0d1117] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Select a Deep Dive Module</h2>
            <p className="text-sm text-gray-500">Choose an architectural pillar to begin your analysis.</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {pillars.map((pillar) => {
            const isOwned = ownedPillarIds.has(pillar.id);
            return (
              <div
                key={pillar.id}
                className={`relative rounded-xl border p-5 flex flex-col sm:flex-row gap-4 transition-all ${
                  isOwned
                    ? "bg-white/5 border-white/5 opacity-60"
                    : "bg-[#111827] border-white/10 hover:border-orange-500/50 hover:bg-[#151e2e]"
                }`}
              >
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
                    <p className="text-xs text-gray-500 uppercase font-bold">Fixed Price</p>
                    <p className="text-lg font-bold text-orange-400">
                      ₦{PHASE2B_PILLAR_PRICE_NGN.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelect(pillar.id)}
                    disabled={isOwned}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${
                      isOwned
                        ? "bg-white/5 text-gray-500 cursor-not-allowed"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    {isOwned ? "Already Owned" : "Select Module"}
                    {!isOwned && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
