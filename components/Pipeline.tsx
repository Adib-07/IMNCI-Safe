"use client";

import React from "react";
import {
  FileText,
  SearchCheck,
  ShieldAlert
} from "lucide-react";

export type PipelineStageKey = 
  | "input" 
  | "extract" 
  | "verify"
  | "confirm"
  | "structured" 
  | "missing_check" 
  | "rules_engine" 
  | "confirmed";

interface PipelineProps {
  currentStage?: PipelineStageKey | "idle";
  activeStep?: 1 | 2 | 3;
  onSelectStep?: (step: 1 | 2 | 3) => void;
  canNavigateToStep?: (step: 1 | 2 | 3) => boolean;
}

const THREE_AREAS = [
  { step: 1, label: "1. Assess", sublabel: "Messy field input & Gemini extraction", icon: FileText },
  { step: 2, label: "2. Review", sublabel: "Structured findings & protocol questions", icon: SearchCheck },
  { step: 3, label: "3. Handoff", sublabel: "Deterministic triage & authorized slip", icon: ShieldAlert },
];

export function Pipeline({ 
  activeStep = 1,
  onSelectStep,
  canNavigateToStep,
}: PipelineProps) {
  return (
    <div className="w-full bg-[#10232D] border border-[rgba(160,220,216,0.16)] rounded-xl p-3 sm:p-4 shadow-md text-[#EAF7F5]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#EAF7F5] uppercase tracking-wider">
            Frontline Protocol Workflow
          </span>
          <span className="text-[11px] text-[#78979B] hidden md:inline">
            &bull; Step-by-step decision support with deterministic gating
          </span>
        </div>
        <div className="text-[11px] font-medium text-[#73DED0] bg-[#15313A] px-2 py-0.5 rounded border border-[rgba(160,220,216,0.2)]">
          Deterministic Gating Active
        </div>
      </div>

      <nav aria-label="Workflow Steps" className="w-full">
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {THREE_AREAS.map((item) => {
            const isCurrent = activeStep === item.step;
            const canNav = canNavigateToStep ? canNavigateToStep(item.step as 1 | 2 | 3) : true;
            const Icon = item.icon;

            return (
              <li key={item.step}>
                <button
                  type="button"
                  onClick={() => onSelectStep && canNav && onSelectStep(item.step as 1 | 2 | 3)}
                  disabled={!canNav}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-3 ${
                    isCurrent
                      ? "bg-[#15313A] border-[#2BB7A9] shadow-sm"
                      : canNav
                      ? "bg-[#0B1720] border-[rgba(160,220,216,0.12)] hover:border-[rgba(160,220,216,0.25)] hover:bg-[#15313A]/60 cursor-pointer"
                      : "bg-[#0B1720]/50 border-[rgba(160,220,216,0.06)] opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isCurrent
                        ? "bg-[#2BB7A9] text-[#0B1720]"
                        : "bg-[#15313A] text-[#73DED0] border border-[rgba(160,220,216,0.2)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#EAF7F5] truncate">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-[#A8C3C5] truncate">
                      {item.sublabel}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}


