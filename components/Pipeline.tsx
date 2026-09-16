"use client";

import React from "react";
import { FileText, SearchCheck, ShieldAlert, ChevronRight } from "lucide-react";

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

const STEPS = [
  { step: 1, label: "Input", sublabel: "Clinical observations", icon: FileText },
  { step: 2, label: "Verify", sublabel: "Review extracted facts", icon: SearchCheck },
  { step: 3, label: "Result", sublabel: "Protocol classification", icon: ShieldAlert },
];

export function Pipeline({
  activeStep = 1,
  onSelectStep,
  canNavigateToStep,
}: PipelineProps) {
  return (
    <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3">
      <nav aria-label="Clinical workflow progress" className="w-full">
        <ol className="flex items-center" role="list">
          {STEPS.map((item, idx) => {
            const isCurrent = activeStep === item.step;
            const canNav = canNavigateToStep ? canNavigateToStep(item.step as 1 | 2 | 3) : true;
            const isCompleted = activeStep > item.step;
            const Icon = item.icon;

            return (
              <React.Fragment key={item.step}>
                <li role="listitem" className="flex-1">
                  <button
                    type="button"
                    onClick={() => onSelectStep && canNav && onSelectStep(item.step as 1 | 2 | 3)}
                    disabled={!canNav}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all ${
                      isCurrent
                        ? "bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/30"
                        : canNav
                        ? "border border-transparent hover:bg-[var(--color-card)] cursor-pointer"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                        isCurrent
                          ? "bg-[var(--color-brand)] text-white"
                          : isCompleted
                          ? "bg-[var(--color-green)] text-white"
                          : "bg-[var(--color-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${isCurrent ? "text-[var(--color-brand-light)]" : "text-[var(--color-text)]"}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] hidden sm:block truncate">
                        {item.sublabel}
                      </div>
                    </div>
                  </button>
                </li>
                {idx < STEPS.length - 1 && (
                  <li aria-hidden="true" className="px-1 shrink-0">
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]/30" />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
