"use client";

import React from "react";
import {
  FileText,
  Cpu,
  ClipboardCheck,
  UserCheck,
} from "lucide-react";

interface PipelineProps {
  currentStage: "input" | "extract" | "verify" | "classify" | "idle";
}

const STAGES = [
  { key: "input" as const, label: "Input", sublabel: "Paste notes", icon: FileText },
  { key: "extract" as const, label: "Extract", sublabel: "AI reads fields", icon: Cpu },
  { key: "verify" as const, label: "Verify", sublabel: "Check protocol", icon: ClipboardCheck },
  { key: "classify" as const, label: "Confirm", sublabel: "Human decides", icon: UserCheck },
];

export function Pipeline({ currentStage }: PipelineProps) {
  const stageOrder = ["idle", "input", "extract", "verify", "classify"];
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <nav aria-label="Classification pipeline" className="w-full">
      <ol className="flex items-stretch gap-0">
        {STAGES.map((stage, i) => {
          const stageIndex = stageOrder.indexOf(stage.key);
          const isActive = currentIndex === stageIndex;
          const isComplete = currentIndex > stageIndex;
          const Icon = stage.icon;

          return (
            <React.Fragment key={stage.key}>
              <li
                className={`flex-1 flex flex-col items-center text-center px-2 py-3 transition-colors duration-200 ${
                  isActive
                    ? "text-ink"
                    : isComplete
                      ? "text-triage-homecare"
                      : "text-ink-muted"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 transition-all duration-200 ${
                    isActive
                      ? "bg-ink text-ink-inverse"
                      : isComplete
                        ? "bg-triage-homecare text-white"
                        : "bg-surface-inset text-ink-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <span className="type-micro block leading-tight">{stage.label}</span>
                <span className="text-[0.625rem] leading-tight text-ink-muted mt-0.5 hidden sm:block">
                  {stage.sublabel}
                </span>
              </li>
              {i < STAGES.length - 1 && (
                <li className="flex items-center" aria-hidden="true">
                  <div
                    className={`w-8 sm:w-12 h-px transition-colors duration-200 ${
                      currentIndex > stageIndex
                        ? "bg-triage-homecare"
                        : "bg-rule-strong"
                    }`}
                  />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
