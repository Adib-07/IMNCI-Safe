"use client";

import React from "react";
import { Search, HelpCircle, Check } from "lucide-react";
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

function FieldRow({
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
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isConfirmed ? (
              <Check className="w-3.5 h-3.5 text-green-accent flex-shrink-0" />
            ) : (
              <HelpCircle className="w-3.5 h-3.5 text-amber-accent flex-shrink-0" />
            )}
            <span className="type-body font-medium text-text-primary truncate">
              {label}
            </span>
          </div>
          {evidence && isConfirmed && (
            <p className="type-caption text-text-tertiary mt-1 ml-5 italic border-l-2 border-border-default pl-2">
              &quot;{evidence}&quot;
            </p>
          )}
        </div>
      </div>
      <div className="ml-5">{children}</div>
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
      className="w-full max-w-[120px] px-2.5 py-1.5 type-body text-text-primary bg-surface-inset border border-border-default rounded-[4px] focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-border-strong placeholder:text-text-tertiary tabular-nums"
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
    <section className="bg-surface-card border border-border-default rounded-[6px] flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border-default flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-text-tertiary" />
          <h2 className="type-label">Verification</h2>
        </div>
        {isFallback && (
          <span className="type-micro text-amber-accent bg-amber-bg border border-amber-border px-2 py-0.5 rounded">
            DEMO FALLBACK
          </span>
        )}
      </div>

      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar max-h-[calc(100vh-220px)]">
        {!assessment && !isExtracting && (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary gap-2">
            <HelpCircle className="w-8 h-8 opacity-20" />
            <p className="type-body">Awaiting extraction</p>
          </div>
        )}

        {isExtracting && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="spinner" />
            <p className="type-body text-text-secondary animate-pulse">
              Extracting facts from assessment…
            </p>
            <p className="type-caption text-text-tertiary">
              Gemini is analyzing clinical notes
            </p>
          </div>
        )}

        {assessment && !isExtracting && (
          <div className="space-y-6 animate-fade-in">
            {/* Patient Information */}
            <div>
              <h3 className="type-micro text-text-tertiary uppercase mb-3">
                Patient Information
              </h3>
              <div className="space-y-3">
                <FieldRow
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
                </FieldRow>

                <FieldRow
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
                </FieldRow>

                {f.has_cough_or_difficult_breathing !== false && (
                  <FieldRow
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
                  </FieldRow>
                )}
              </div>
            </div>

            {/* Danger Signs */}
            <div>
              <h3 className="type-micro text-text-tertiary uppercase mb-3">
                4 General Danger Signs
              </h3>
              <div className="space-y-3">
                <FieldRow
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
                </FieldRow>

                <FieldRow
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
                </FieldRow>

                <FieldRow
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
                </FieldRow>

                <FieldRow
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
                </FieldRow>
              </div>
            </div>

            {/* Physical Severity Signs */}
            <div>
              <h3 className="type-micro text-text-tertiary uppercase mb-3">
                Respiratory Assessment
              </h3>
              <div className="space-y-3">
                <FieldRow
                  label="Chest Indrawing"
                  value={f.chest_indrawing}
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
                </FieldRow>

                <FieldRow
                  label="Stridor in calm child"
                  value={f.stridor_in_calm_child}
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
                </FieldRow>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
