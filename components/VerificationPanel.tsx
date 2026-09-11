"use client";

import React from "react";
import { Search, HelpCircle } from "lucide-react";
import { SegmentedControl } from "./SegmentedControl";
import type { ImnciAssessment } from "@/lib/types";

interface VerificationPanelProps {
  assessment: ImnciAssessment;
  isExtracting: boolean;
  isFallback: boolean;
  onUpdateFact: (
    key: string,
    val: string | number | boolean,
    isDangerSign?: boolean
  ) => void;
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
          <span className="type-body-sm font-medium text-ink block">
            {label}
          </span>
          {evidence && isConfirmed && (
            <p className="type-caption text-ink-muted mt-0.5 italic border-l-2 border-rule pl-2 ml-5">
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
      className="w-full max-w-[110px] px-2.5 py-1.5 type-body-sm text-ink bg-surface-inset border border-rule rounded-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-rule-strong placeholder:text-ink-muted tabular-nums"
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
}: VerificationPanelProps) {
  const f = assessment.facts;
  const ev = assessment.evidence;

  const parseNum = (v: string): number | "unknown" => {
    if (v === "unknown") return "unknown";
    const num = parseInt(v, 10);
    return isNaN(num) ? "unknown" : num;
  };

  return (
    <section className="bg-surface-card border border-rule flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-rule flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-ink-muted" />
          <h2 className="type-label">Extracted Facts</h2>
        </div>
        {isFallback && (
          <span className="type-micro text-triage-blocked bg-triage-blocked-bg border border-triage-blocked-border px-2 py-0.5 rounded-sm">
            DEMO FIXTURE
          </span>
        )}
      </div>

      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar max-h-[calc(100vh-220px)]">
        {!assessment && !isExtracting && (
          <div className="flex flex-col items-center justify-center py-12 text-ink-muted gap-2">
            <HelpCircle className="w-8 h-8 opacity-20" />
            <p className="type-body-sm">Awaiting extraction</p>
          </div>
        )}

        {isExtracting && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="spinner" />
            <p className="type-body-sm text-ink-secondary animate-pulse">
              Extracting facts from assessment...
            </p>
            <p className="type-caption text-ink-muted">
              Gemini is analyzing clinical notes
            </p>
          </div>
        )}

        {assessment && !isExtracting && (
          <div className="animate-fade-in">
            {/* Patient Information */}
            <div className="mb-4">
              <h3 className="type-micro text-ink-muted mb-2">
                PATIENT INFORMATION
              </h3>
              <div>
                <ChartFieldRow
                  label="Age (months)"
                  value={f.patient_age_months}
                  evidence={ev?.age_evidence}
                >
                  <NumberInput
                    value={f.patient_age_months}
                    onChange={(v) =>
                      onUpdateFact("patient_age_months", parseNum(v))
                    }
                  />
                </ChartFieldRow>

                <ChartFieldRow
                  label="Cough / Difficult Breathing"
                  value={f.has_cough_or_difficult_breathing}
                  evidence={ev?.cough_evidence}
                >
                  <SegmentedControl
                    value={f.has_cough_or_difficult_breathing}
                    onChange={(v) =>
                      onUpdateFact(
                        "has_cough_or_difficult_breathing",
                        v === "unknown" ? "unknown" : v
                      )
                    }
                  />
                </ChartFieldRow>

                {f.has_cough_or_difficult_breathing !== false && (
                  <ChartFieldRow
                    label="Respiratory Rate (breaths/min)"
                    value={f.respiratory_rate}
                    evidence={ev?.respiratory_evidence}
                  >
                    <NumberInput
                      value={f.respiratory_rate}
                      onChange={(v) =>
                        onUpdateFact("respiratory_rate", parseNum(v))
                      }
                      placeholder="counted bpm"
                    />
                  </ChartFieldRow>
                )}
              </div>
            </div>

            <hr className="hairline-rule my-3" />

            {/* Danger Signs */}
            <div className="mb-4">
              <h3 className="type-micro text-ink-muted mb-2">
                4 GENERAL DANGER SIGNS
              </h3>
              <div>
                <ChartFieldRow
                  label="Unable to drink or breastfeed"
                  value={f.danger_signs.unable_to_drink_or_breastfeed}
                  evidence={ev?.danger_signs_evidence}
                >
                  <SegmentedControl
                    value={f.danger_signs.unable_to_drink_or_breastfeed}
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
                  value={f.danger_signs.vomits_everything}
                  evidence={ev?.danger_signs_evidence}
                >
                  <SegmentedControl
                    value={f.danger_signs.vomits_everything}
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
                  value={f.danger_signs.has_convulsions}
                  evidence={ev?.danger_signs_evidence}
                >
                  <SegmentedControl
                    value={f.danger_signs.has_convulsions}
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
                  value={f.danger_signs.lethargic_or_unconscious}
                  evidence={ev?.danger_signs_evidence}
                >
                  <SegmentedControl
                    value={f.danger_signs.lethargic_or_unconscious}
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

            <hr className="hairline-rule my-3" />

            {/* Respiratory Assessment */}
            <div>
              <h3 className="type-micro text-ink-muted mb-2">
                RESPIRATORY ASSESSMENT
              </h3>
              <div>
                <ChartFieldRow
                  label="Chest Indrawing"
                  value={f.chest_indrawing}
                  evidence={ev?.chest_indrawing_evidence}
                >
                  <SegmentedControl
                    value={f.chest_indrawing}
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
                  value={f.stridor_in_calm_child}
                  evidence={ev?.stridor_evidence}
                >
                  <SegmentedControl
                    value={f.stridor_in_calm_child}
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
