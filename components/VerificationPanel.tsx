"use client";

import React from "react";
import { Search, HelpCircle, Cpu, ScanSearch } from "lucide-react";
import { SegmentedControl } from "./SegmentedControl";
import type { ImnciAssessment } from "@/lib/types";

interface MockEntity {
  label: string;
  value: string;
  color: string;
}

interface VerificationPanelProps {
  assessment: ImnciAssessment | null;
  isExtracting: boolean;
  isFallback: boolean;
  onUpdateFact: (
    key: string,
    val: string | number | boolean,
    isDangerSign?: boolean
  ) => void;
  pipelineStage?: "idle" | "input" | "extract" | "verify" | "classify";
  cascadingEntities?: MockEntity[];
}

function ChartFieldRow({
  label,
  value,
  evidence,
  children,
}: {
  label: string;
  value: string | number | boolean;
  evidence?: string | null;
  children: React.ReactNode;
}) {
  const isConfirmed = value !== "unknown";

  return (
    <div className="chart-row">
      <div className="chart-row-label">
        <div className={`check-indicator ${isConfirmed ? "checked" : ""}`} />
        <div className="min-w-0">
          <span className="text-sm font-medium text-slate-200 block">
            {label}
          </span>
          {evidence && isConfirmed && (
            <p className="text-[0.6875rem] text-slate-500 mt-0.5 italic border-l-2 border-slate-700 pl-2 ml-5">
              &quot;{evidence}&quot;
            </p>
          )}
        </div>
      </div>
      <div className="chart-row-control">
        {children}
      </div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | "unknown";
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const displayVal = value === "unknown" ? "" : String(value);
  return (
    <input
      type="text"
      inputMode="numeric"
      className="w-full max-w-[110px] px-2.5 py-1.5 text-sm text-slate-200 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none placeholder:text-slate-600 tabular-nums transition-all duration-200"
      placeholder={placeholder || "unknown"}
      value={displayVal}
      onChange={(e) => onChange(e.target.value || "unknown")}
    />
  );
}

export function VerificationPanel({
  assessment,
  isExtracting,
  isFallback,
  onUpdateFact,
  pipelineStage,
  cascadingEntities = [],
}: VerificationPanelProps) {
  const f = assessment?.facts;
  const ev = assessment?.evidence;

  const parseNum = (v: string): number | "unknown" => {
    if (v === "unknown") return "unknown";
    const num = parseInt(v, 10);
    return isNaN(num) ? "unknown" : num;
  };

  // Step 2: Cascading entity extraction view
  if (pipelineStage === "extract" && cascadingEntities.length > 0) {
    return (
      <section className="rounded-2xl border border-emerald-500/20 bg-slate-900/50 backdrop-blur-xl flex flex-col overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        <div className="px-5 py-3 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ScanSearch className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Extracting Facts</h2>
          </div>
          <span className="text-[0.625rem] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">
            AI READING
          </span>
        </div>

        <div className="p-5 flex-1">
          <div className="space-y-2.5">
            {cascadingEntities.map((entity, i) => (
              <div
                key={`${entity.label}-${i}`}
                className="animate-cascade-enter flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[0.625rem] font-bold tracking-wider px-2 py-0.5 rounded-md border ${entity.color}`}>
                    {entity.label.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {entity.value}
                  </span>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-2">
            <div className="spinner !w-3 !h-3 !border-[1px]" />
            <span className="text-xs text-slate-500">
              {cascadingEntities.length} of 8 facts extracted...
            </span>
          </div>
        </div>
      </section>
    );
  }

  // Step 2/3: Loading / Extracting view (spinner + skeleton)
  if (isExtracting && (!assessment || pipelineStage === "verify")) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Search className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Extracted Facts</h2>
          </div>
          {isFallback && (
            <span className="text-[0.625rem] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              DEMO FIXTURE
            </span>
          )}
        </div>

        <div className="p-5 flex-1">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
              <Cpu className="w-5 h-5 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-300 font-medium animate-pulse">
                {pipelineStage === "verify" ? "Verifying against IMNCI protocol..." : "Extracting facts from assessment..."}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {pipelineStage === "verify" ? "Running deterministic rules engine" : "AI is analyzing clinical notes"}
              </p>
            </div>
          </div>

          {/* Skeleton loader */}
          <div className="space-y-3 mt-2">
            <div className="animate-skeleton-pulse">
              <div className="h-3 w-24 bg-slate-800 rounded mb-2" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded border border-slate-700 bg-slate-800/50" />
                    <div className="flex-1">
                      <div className="h-3 bg-slate-800/50 rounded w-2/3 mb-1.5" />
                      <div className="h-2 bg-slate-800/30 rounded w-1/3" />
                    </div>
                    <div className="w-20 h-6 bg-slate-800/50 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col overflow-hidden hover:border-slate-700/80 transition-colors duration-300">
      <div className="px-5 py-3 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Search className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Extracted Facts</h2>
        </div>
        {isFallback && (
          <span className="text-[0.625rem] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            DEMO FIXTURE
          </span>
        )}
      </div>

      <div className="p-5 overflow-y-auto flex-1 custom-scrollbar max-h-[calc(100vh-220px)]">
        {assessment && (
          <div className="animate-fade-in">
            {/* Patient Information */}
            <div className="mb-4">
              <h3 className="text-[0.6875rem] font-semibold text-slate-500 tracking-widest mb-3">
                PATIENT INFORMATION
              </h3>
              <div>
                <ChartFieldRow
                  label="Age (months)"
                  value={f!.patient_age_months}
                  evidence={ev?.age_evidence}
                >
                  <NumberInput
                    value={f!.patient_age_months}
                    onChange={(v) =>
                      onUpdateFact("patient_age_months", parseNum(v))
                    }
                  />
                </ChartFieldRow>

                <ChartFieldRow
                  label="Cough / Difficult Breathing"
                  value={f!.has_cough_or_difficult_breathing}
                  evidence={ev?.cough_evidence}
                >
                  <SegmentedControl
                    value={f!.has_cough_or_difficult_breathing}
                    onChange={(v) =>
                      onUpdateFact(
                        "has_cough_or_difficult_breathing",
                        v === "unknown" ? "unknown" : v
                      )
                    }
                  />
                </ChartFieldRow>

                {f!.has_cough_or_difficult_breathing !== false && (
                  <ChartFieldRow
                    label="Respiratory Rate (breaths/min)"
                    value={f!.respiratory_rate}
                    evidence={ev?.respiratory_evidence}
                  >
                    <NumberInput
                      value={f!.respiratory_rate}
                      onChange={(v) =>
                        onUpdateFact("respiratory_rate", parseNum(v))
                      }
                      placeholder="counted bpm"
                    />
                  </ChartFieldRow>
                )}
              </div>
            </div>

            <hr className="border-t border-slate-800/60 my-3" />

            {/* Danger Signs */}
            <div className="mb-4">
              <h3 className="text-[0.6875rem] font-semibold text-slate-500 tracking-widest mb-3">
                4 GENERAL DANGER SIGNS
              </h3>
              <div>
                <ChartFieldRow
                  label="Unable to drink or breastfeed"
                  value={f!.danger_signs.unable_to_drink_or_breastfeed}
                  evidence={ev?.danger_signs_evidence}
                >
                  <SegmentedControl
                    value={f!.danger_signs.unable_to_drink_or_breastfeed}
                    onChange={(v) =>
                      onUpdateFact(
                        "unable_to_drink_or_breastfeed",
                        v === "unknown" ? "unknown" : v,
                        true
                      )
                    }
                  />
                </ChartFieldRow>

                <ChartFieldRow
                  label="Vomits everything"
                  value={f!.danger_signs.vomits_everything}
                  evidence={ev?.danger_signs_evidence}
                >
                  <SegmentedControl
                    value={f!.danger_signs.vomits_everything}
                    onChange={(v) =>
                      onUpdateFact(
                        "vomits_everything",
                        v === "unknown" ? "unknown" : v,
                        true
                      )
                    }
                  />
                </ChartFieldRow>

                <ChartFieldRow
                  label="Has convulsions"
                  value={f!.danger_signs.has_convulsions}
                  evidence={ev?.danger_signs_evidence}
                >
                  <SegmentedControl
                    value={f!.danger_signs.has_convulsions}
                    onChange={(v) =>
                      onUpdateFact(
                        "has_convulsions",
                        v === "unknown" ? "unknown" : v,
                        true
                      )
                    }
                  />
                </ChartFieldRow>

                <ChartFieldRow
                  label="Lethargic or unconscious"
                  value={f!.danger_signs.lethargic_or_unconscious}
                  evidence={ev?.danger_signs_evidence}
                >
                  <SegmentedControl
                    value={f!.danger_signs.lethargic_or_unconscious}
                    onChange={(v) =>
                      onUpdateFact(
                        "lethargic_or_unconscious",
                        v === "unknown" ? "unknown" : v,
                        true
                      )
                    }
                  />
                </ChartFieldRow>
              </div>
            </div>

            <hr className="border-t border-slate-800/60 my-3" />

            {/* Respiratory Assessment */}
            <div>
              <h3 className="text-[0.6875rem] font-semibold text-slate-500 tracking-widest mb-3">
                RESPIRATORY ASSESSMENT
              </h3>
              <div>
                <ChartFieldRow
                  label="Chest Indrawing"
                  value={f!.chest_indrawing}
                  evidence={ev?.chest_indrawing_evidence}
                >
                  <SegmentedControl
                    value={f!.chest_indrawing}
                    onChange={(v) =>
                      onUpdateFact(
                        "chest_indrawing",
                        v === "unknown" ? "unknown" : v
                      )
                    }
                  />
                </ChartFieldRow>

                <ChartFieldRow
                  label="Stridor in calm child"
                  value={f!.stridor_in_calm_child}
                  evidence={ev?.stridor_evidence}
                >
                  <SegmentedControl
                    value={f!.stridor_in_calm_child}
                    onChange={(v) =>
                      onUpdateFact(
                        "stridor_in_calm_child",
                        v === "unknown" ? "unknown" : v
                      )
                    }
                  />
                </ChartFieldRow>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
