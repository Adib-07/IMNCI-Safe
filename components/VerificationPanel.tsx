"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Quote,
  Brain,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import type {
  GeminiExtractionResponse,
  ProtocolResult,
  ImnciAssessment,
} from "@/lib/types";

interface VerificationPanelProps {
  extraction: GeminiExtractionResponse | null;
  assessment: ImnciAssessment | null;
  protocolResult: ProtocolResult | null;
  isExtracting: boolean;
  onUpdateField: (
    key: string,
    value: boolean | string | number | null,
    isDangerSign?: boolean
  ) => void;
  onConfirmAndEvaluate: () => void;
  hasUserModified: boolean;
}

export function VerificationPanel({
  extraction,
  assessment,
  isExtracting,
  onUpdateField,
  onConfirmAndEvaluate,
  hasUserModified,
}: VerificationPanelProps) {
  if (isExtracting) {
    return (
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="relative w-14 h-14 mb-4">
          <div className="w-14 h-14 rounded-full border-[3px] border-[var(--color-brand)]/20 border-t-[var(--color-brand)] animate-spin" />
          <Brain className="w-6 h-6 text-[var(--color-brand)] absolute inset-0 m-auto" />
        </div>
        <h3 className="type-h3 text-[var(--color-text)]">Extracting Clinical Facts…</h3>
        <p className="type-small text-[var(--color-text-secondary)] max-w-md mt-1.5">
          Parsing observations, mapping verbatim quotations, and verifying age cohort parameters.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-[var(--color-brand-light)] bg-[var(--color-surface)] px-3.5 py-1.5 rounded-full border border-[var(--color-border)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Structured schema validation active</span>
        </div>
      </div>
    );
  }

  if (!extraction || !assessment) {
    return (
      <div className="bg-[var(--color-card)] border border-dashed border-[var(--color-border-strong)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] mb-3">
          <Quote className="w-5 h-5" />
        </div>
        <h3 className="type-h3 text-[var(--color-text)]">No Facts Extracted Yet</h3>
        <p className="type-small text-[var(--color-text-secondary)] max-w-sm mt-1">
          Enter field observations or select a demo case to extract structured clinical facts.
        </p>
      </div>
    );
  }

  const ageMonths = assessment.age_months;
  const rr = assessment.respiratory_rate;
  let isFastBreathing = false;

  if (typeof ageMonths === "number") {
    if (ageMonths >= 2 && ageMonths <= 11) {
      if (typeof rr === "number" && rr >= 50) isFastBreathing = true;
    } else if (ageMonths >= 12) {
      if (typeof rr === "number" && rr >= 40) isFastBreathing = true;
    }
  }

  const missingFields = extraction.missing_critical_fields || [];
  const hasMissing = missingFields.length > 0;

  let primaryNextQuestion: {
    title: string;
    description: string;
    fieldKey: string;
    isDangerSign: boolean;
    options: { label: string; value: boolean | number | string }[];
  } | null = null;

  if (assessment.danger_signs?.unable_to_drink_or_breastfeed === "unknown" || assessment.danger_signs?.unable_to_drink_or_breastfeed === null) {
    primaryNextQuestion = {
      title: "Can the child drink or breastfeed normally?",
      description: "Inability to drink is a General Danger Sign — urgent referral required.",
      fieldKey: "unable_to_drink",
      isDangerSign: true,
      options: [
        { label: "Yes, drinks normally", value: false },
        { label: "No, cannot drink", value: true },
        { label: "Cannot determine", value: "unknown" },
      ],
    };
  } else if (assessment.respiratory_rate === null || assessment.respiratory_rate === undefined) {
    primaryNextQuestion = {
      title: "What is the respiratory rate (breaths per minute)?",
      description: "Count breaths for 60 seconds with child calm.",
      fieldKey: "respiratory_rate",
      isDangerSign: false,
      options: [
        { label: "32 bpm", value: 32 },
        { label: "46 bpm", value: 46 },
        { label: "62 bpm", value: 62 },
      ],
    };
  } else if (assessment.danger_signs?.has_convulsions === "unknown" || assessment.danger_signs?.has_convulsions === null) {
    primaryNextQuestion = {
      title: "Did the child have convulsions during this illness?",
      description: "Convulsions indicate severe illness or CNS involvement.",
      fieldKey: "convulsions",
      isDangerSign: true,
      options: [
        { label: "No convulsions", value: false },
        { label: "Yes, had convulsions", value: true },
      ],
    };
  } else if (assessment.chest_indrawing === "unknown" || assessment.chest_indrawing === null) {
    primaryNextQuestion = {
      title: "Is chest indrawing present?",
      description: "Lower chest wall moving inward during breathing.",
      fieldKey: "chest_indrawing",
      isDangerSign: false,
      options: [
        { label: "No indrawing", value: false },
        { label: "Yes, indrawing present", value: true },
      ],
    };
  }

  const tableRows = [
    {
      key: "age_months",
      label: "Child Age",
      valueDisplay: typeof assessment.age_months === "number" ? `${assessment.age_months} mo` : "—",
      valueType: "number",
      status: typeof assessment.age_months === "number" ? "Verified" : "Missing",
      isDanger: false,
      currentVal: assessment.age_months,
    },
    {
      key: "respiratory_rate",
      label: "Respiratory Rate",
      valueDisplay: typeof assessment.respiratory_rate === "number" ? `${assessment.respiratory_rate} bpm${isFastBreathing ? " ⚠" : ""}` : "—",
      valueType: "number",
      status: typeof assessment.respiratory_rate === "number" ? (isFastBreathing ? "Fast" : "Normal") : "Missing",
      isDanger: false,
      currentVal: assessment.respiratory_rate,
    },
    {
      key: "chest_indrawing",
      label: "Chest Indrawing",
      valueDisplay: assessment.chest_indrawing === true ? "Present" : assessment.chest_indrawing === false ? "Absent" : "Unknown",
      valueType: "three_way",
      status: assessment.chest_indrawing === true ? "Urgent" : assessment.chest_indrawing === false ? "Absent" : "Unknown",
      isDanger: false,
      currentVal: assessment.chest_indrawing,
    },
    {
      key: "stridor",
      label: "Stridor (Calm)",
      valueDisplay: assessment.stridor === true ? "Present" : assessment.stridor === false ? "Absent" : "Unknown",
      valueType: "three_way",
      status: assessment.stridor === true ? "Urgent" : assessment.stridor === false ? "Absent" : "Unknown",
      isDanger: false,
      currentVal: assessment.stridor,
    },
    {
      key: "convulsions",
      label: "Convulsions",
      valueDisplay: assessment.danger_signs?.has_convulsions === true ? "Present" : assessment.danger_signs?.has_convulsions === false ? "Absent" : "Unknown",
      valueType: "three_way",
      status: assessment.danger_signs?.has_convulsions === true ? "Danger" : assessment.danger_signs?.has_convulsions === false ? "Absent" : "Unknown",
      isDanger: true,
      currentVal: assessment.danger_signs?.has_convulsions,
    },
    {
      key: "unable_to_drink",
      label: "Unable to Drink",
      valueDisplay: assessment.danger_signs?.unable_to_drink_or_breastfeed === true ? "Cannot drink" : assessment.danger_signs?.unable_to_drink_or_breastfeed === false ? "Drinking" : "Unknown",
      valueType: "three_way",
      status: assessment.danger_signs?.unable_to_drink_or_breastfeed === true ? "Danger" : assessment.danger_signs?.unable_to_drink_or_breastfeed === false ? "Absent" : "Unknown",
      isDanger: true,
      currentVal: assessment.danger_signs?.unable_to_drink_or_breastfeed,
    },
    {
      key: "vomiting_everything",
      label: "Vomits Everything",
      valueDisplay: assessment.danger_signs?.vomits_everything === true ? "Present" : assessment.danger_signs?.vomits_everything === false ? "Absent" : "Unknown",
      valueType: "three_way",
      status: assessment.danger_signs?.vomits_everything === true ? "Danger" : assessment.danger_signs?.vomits_everything === false ? "Absent" : "Unknown",
      isDanger: true,
      currentVal: assessment.danger_signs?.vomits_everything,
    },
    {
      key: "lethargic_or_unconscious",
      label: "Lethargic / Unconscious",
      valueDisplay: assessment.danger_signs?.lethargic_or_unconscious === true ? "Present" : assessment.danger_signs?.lethargic_or_unconscious === false ? "Alert" : "Unknown",
      valueType: "three_way",
      status: assessment.danger_signs?.lethargic_or_unconscious === true ? "Danger" : assessment.danger_signs?.lethargic_or_unconscious === false ? "Absent" : "Unknown",
      isDanger: true,
      currentVal: assessment.danger_signs?.lethargic_or_unconscious,
    },
  ];

  const statusColor = (status: string) => {
    if (status === "Verified" || status === "Normal" || status === "Absent" || status === "Alert") return "bg-[var(--color-green-bg)] text-[var(--color-green)] border-[var(--color-green-border)]";
    if (status === "Missing" || status === "Unknown") return "bg-[var(--color-yellow-bg)] text-[var(--color-yellow)] border-[var(--color-yellow-border)]";
    if (status === "Fast" || status === "Urgent" || status === "Danger" || status === "Trigger") return "bg-[var(--color-pink-bg)] text-[var(--color-pink)] border-[var(--color-pink-border)]";
    return "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]";
  };

  return (
    <div data-testid="verification-panel" className="flex flex-col gap-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]" />
          <h2 className="type-h3 text-[var(--color-text)]">
            Verify Extracted Facts
          </h2>
          {hasUserModified && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-brand)]/10 text-[var(--color-brand-light)] border border-[var(--color-brand)]/30">
              Modified
            </span>
          )}
        </div>
        <p className="type-small text-[var(--color-text-secondary)]">
          Review AI-extracted findings. Correct any parameter. The rules engine runs on what you confirm.
        </p>
      </div>

      {/* Missing Warning */}
      {hasMissing && (
        <div className="bg-[var(--color-yellow-bg)] border border-[var(--color-yellow-border)] rounded-lg p-4 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-[var(--color-yellow)] shrink-0" />
            <span className="type-label text-[var(--color-yellow)]">
              Cannot Classify Yet — {missingFields.length} Required Field{missingFields.length > 1 ? "s" : ""} Missing
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {missingFields.map((field, i) => (
              <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-card)] text-[var(--color-yellow)] border border-[var(--color-yellow-border)]">
                ? {field}
              </span>
            ))}
          </div>

          {primaryNextQuestion && (
            <div className="mt-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[var(--color-brand)] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text)]">{primaryNextQuestion.title}</div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{primaryNextQuestion.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {primaryNextQuestion.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onUpdateField(primaryNextQuestion!.fieldKey, opt.value, primaryNextQuestion!.isDangerSign)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] transition-all"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Findings Table */}
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs" role="table" aria-label="Extracted clinical findings">
          <thead>
            <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
              <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)]">Field</th>
              <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)]">Value</th>
              <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)] hidden md:table-cell">Source</th>
              <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)]">Status</th>
              <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)] text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {tableRows.map((row) => (
              <tr key={row.key} className="hover:bg-[var(--color-surface)]/60 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-[var(--color-text)] text-[13px]">{row.label}</td>
                <td className="py-2.5 px-3 text-[var(--color-text-secondary)] font-mono tabular-nums">{row.valueDisplay}</td>
                <td className="py-2.5 px-3 text-[var(--color-text-muted)] hidden md:table-cell">
                  {extraction.verbatim_quotes?.[row.key as keyof typeof extraction.verbatim_quotes] || "—"}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {row.valueType === "three_way" ? (
                    <fieldset className="inline-flex items-center rounded border border-[var(--color-border)] overflow-hidden" aria-label={`Edit ${row.label}`}>
                      <legend className="sr-only">{row.label}</legend>
                      {(["Yes", "No", "?"] as const).map((label, i) => {
                        const val = i === 0 ? true : i === 1 ? false : "unknown";
                        const isActive = row.currentVal === val || (val === "unknown" && (row.currentVal === "unknown" || row.currentVal === null));
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => onUpdateField(row.key, val, row.isDanger)}
                            aria-pressed={isActive}
                            className={`px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                              isActive
                                ? label === "Yes" ? "bg-[var(--color-pink)] text-white"
                                  : label === "No" ? "bg-[var(--color-brand)] text-white"
                                  : "bg-[var(--color-yellow)] text-[var(--color-text-inverse)]"
                                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </fieldset>
                  ) : (
                    <input
                      type="number"
                      value={typeof row.currentVal === "number" ? row.currentVal : ""}
                      onChange={(e) => onUpdateField(row.key, e.target.value ? parseInt(e.target.value, 10) : null)}
                      placeholder="—"
                      aria-label={`Enter ${row.label}`}
                      className="w-16 px-1.5 py-0.5 text-xs text-center font-mono bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)]"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm CTA */}
      <div className="pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Your verification ensures clinical fidelity before protocol evaluation.
        </p>
        <button
          type="button"
          onClick={onConfirmAndEvaluate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-all shadow-md active:scale-[0.98]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirm Facts &amp; Run Protocol</span>
        </button>
      </div>
    </div>
  );
}
