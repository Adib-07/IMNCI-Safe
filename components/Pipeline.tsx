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
  { key: "extract" as const, label: "Extract", sublabel: "AI reads", icon: Cpu },
  { key: "verify" as const, label: "Verify", sublabel: "Check rules", icon: ClipboardCheck },
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
                className={`flex-1 flex flex-col items-center text-center px-2 py-2 transition-all duration-300 ${
                  isActive
                    ? "text-white"
                    : isComplete
                      ? "text-emerald-400"
                      : "text-slate-600"
                }`}
              >
                <div
                  className={`group relative w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110"
                      : isComplete
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-full border border-blue-400/40 animate-pulse" />
                  )}
                  {isComplete ? (
                    <span className="text-sm font-bold">✓</span>
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                </div>
                <span className="text-[0.6875rem] font-semibold block leading-tight">{stage.label}</span>
                <span className="text-[0.5625rem] leading-tight text-slate-600 mt-0.5 hidden sm:block">
                  {stage.sublabel}
                </span>
              </li>
              {i < STAGES.length - 1 && (
                <li className="flex items-center" aria-hidden="true">
                  <div
                    className={`h-0.5 w-8 sm:w-14 rounded-full transition-all duration-500 ${
                      currentIndex > stageIndex
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : currentIndex === stageIndex
                          ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                          : "bg-slate-800"
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
