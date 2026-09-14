"use client";

import React from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Quote, 
  Brain, 
  Sparkles,
  HelpCircle,
  RotateCcw
} from "lucide-react";
import type { 
  GeminiExtractionResponse, 
  ProtocolResult, 
  ImnciAssessment
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
  onResetSession?: () => void;
}

export function VerificationPanel({
  extraction,
  assessment,
  isExtracting,
  onUpdateField,
  onConfirmAndEvaluate,
  hasUserModified,
  onResetSession,
}: VerificationPanelProps) {

  if (isExtracting) {
    return (
      <div className="bg-[#15313A] border border-[rgba(160,220,216,0.16)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center shadow-lg">
        <div className="relative w-14 h-14 mb-4">
          <div className="w-14 h-14 rounded-full border-3 border-[#2BB7A9]/20 border-t-[#2BB7A9] animate-spin" />
          <Brain className="w-6 h-6 text-[#2BB7A9] absolute inset-0 m-auto" />
        </div>
        <h3 className="text-base font-bold text-[#EAF7F5]">
          Extracting Clinical Evidence...
        </h3>
        <p className="text-xs text-[#A8C3C5] max-w-md mt-1.5 leading-relaxed">
          Gemini is parsing medical observations, identifying clinical symptoms, mapping exact verbatim quotations, and verifying age cohort parameters.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-[#73DED0] bg-[#10232D] px-3.5 py-1.5 rounded-full border border-[rgba(160,220,216,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-[#2BB7A9]" />
          <span>Structured clinical schema validation active</span>
        </div>
      </div>
    );
  }

  if (!extraction || !assessment) {
    return (
      <div className="bg-[#15313A] border border-dashed border-[rgba(160,220,216,0.2)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-12 h-12 rounded-full bg-[#10232D] border border-[rgba(160,220,216,0.16)] flex items-center justify-center text-[#78979B] mb-3">
          <Quote className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-[#EAF7F5]">
          No Clinical Facts Extracted Yet
        </h3>
        <p className="text-xs text-[#A8C3C5] max-w-sm mt-1">
          Select a guided demo case on the left or enter field observations to extract structured clinical facts against the IMNCI protocol.
        </p>
      </div>
    );
  }

  // Calculate fast breathing cutoff and status
  const ageMonths = assessment.age_months;
  const rr = assessment.respiratory_rate;
  let fastBreathingThresholdText = "Age required to evaluate cutoff";
  let isFastBreathing = false;

  if (typeof ageMonths === "number") {
    if (ageMonths < 2) {
      fastBreathingThresholdText = "Young Infant (0–2 mo): cutoff ≥ 60 bpm (refer immediately)";
    } else if (ageMonths <= 11) {
      fastBreathingThresholdText = "Infant (2–11 mo): Fast breathing cutoff is ≥ 50 bpm";
      if (typeof rr === "number" && rr >= 50) isFastBreathing = true;
    } else {
      fastBreathingThresholdText = "Child (12–59 mo): Fast breathing cutoff is ≥ 40 bpm";
      if (typeof rr === "number" && rr >= 40) isFastBreathing = true;
    }
  }

  const missingFields = extraction.missing_critical_fields || [];
  const hasMissing = missingFields.length > 0;

  // Identify ONE primary next question to complete the protocol
  let primaryNextQuestion: {
    title: string;
    description: string;
    fieldKey: string;
    isDangerSign: boolean;
    options: { label: string; value: boolean | number | string }[];
  } | null = null;

  if (assessment.danger_signs?.unable_to_drink === "unknown" || assessment.danger_signs?.unable_to_drink === null) {
    primaryNextQuestion = {
      title: "Can the child drink or breastfeed normally?",
      description: "Inability to drink or breastfeed is an IMNCI General Danger Sign requiring urgent hospital referral.",
      fieldKey: "unable_to_drink",
      isDangerSign: true,
      options: [
        { label: "Yes, drinks normally", value: false },
        { label: "No, cannot drink / vomits", value: true },
        { label: "Cannot determine yet", value: "unknown" },
      ]
    };
  } else if (assessment.respiratory_rate === null || assessment.respiratory_rate === undefined) {
    primaryNextQuestion = {
      title: "What is the child's respiratory rate in 1 minute?",
      description: "Count breaths for full 60 seconds with child calm. Governs pneumonia classification.",
      fieldKey: "respiratory_rate",
      isDangerSign: false,
      options: [
        { label: "Normal (32 bpm)", value: 32 },
        { label: "Fast (46 bpm)", value: 46 },
        { label: "Very fast (62 bpm)", value: 62 },
      ]
    };
  } else if (assessment.danger_signs?.convulsions === "unknown" || assessment.danger_signs?.convulsions === null) {
    primaryNextQuestion = {
      title: "Did the child have convulsions or fits during this illness?",
      description: "Convulsions indicate central nervous system involvement or severe malaria.",
      fieldKey: "convulsions",
      isDangerSign: true,
      options: [
        { label: "No convulsions", value: false },
        { label: "Yes, had convulsions", value: true },
      ]
    };
  } else if (assessment.chest_indrawing === "unknown" || assessment.chest_indrawing === null) {
    primaryNextQuestion = {
      title: "Is chest indrawing (subcostal retraction) present?",
      description: "Lower chest wall moves in when the child breathes in.",
      fieldKey: "chest_indrawing",
      isDangerSign: false,
      options: [
        { label: "No chest indrawing", value: false },
        { label: "Yes, chest indrawing present", value: true },
      ]
    };
  }

  // Define structured table rows: Field | Value | Source | Status
  const tableRows = [
    {
      key: "age_months",
      label: "Child Age",
      valueDisplay: typeof assessment.age_months === "number" ? `${assessment.age_months} months` : "Missing",
      valueType: "number",
      quote: extraction.verbatim_quotes?.age_months || "Extracted from text",
      status: typeof assessment.age_months === "number" ? "Verified" : "Missing",
      statusColor: typeof assessment.age_months === "number" ? "bg-[rgba(73,197,137,0.15)] text-[#49C589]" : "bg-[rgba(242,184,75,0.15)] text-[#F2B84B]",
      isDanger: false,
      currentVal: assessment.age_months,
    },
    {
      key: "respiratory_rate",
      label: "Respiratory Rate",
      valueDisplay: typeof assessment.respiratory_rate === "number" ? `${assessment.respiratory_rate} bpm (${isFastBreathing ? "Fast" : "Normal"})` : "Not Counted",
      valueType: "number",
      quote: extraction.verbatim_quotes?.respiratory_rate ? `${extraction.verbatim_quotes.respiratory_rate} • ${fastBreathingThresholdText}` : fastBreathingThresholdText,
      status: typeof assessment.respiratory_rate === "number" ? (isFastBreathing ? "Trigger (Fast)" : "Normal") : "Missing",
      statusColor: typeof assessment.respiratory_rate === "number" 
        ? (isFastBreathing ? "bg-[rgba(231,93,93,0.15)] text-[#E75D5D]" : "bg-[rgba(73,197,137,0.15)] text-[#49C589]")
        : "bg-[rgba(242,184,75,0.15)] text-[#F2B84B]",
      isDanger: false,
      currentVal: assessment.respiratory_rate,
    },
    {
      key: "chest_indrawing",
      label: "Chest Indrawing",
      valueDisplay: assessment.chest_indrawing === true ? "Present" : assessment.chest_indrawing === false ? "Absent" : "Unknown",
      valueType: "three_way",
      quote: extraction.verbatim_quotes?.chest_indrawing || "Observation",
      status: assessment.chest_indrawing === true ? "Urgent Trigger" : assessment.chest_indrawing === false ? "Absent" : "Unknown",
      statusColor: assessment.chest_indrawing === true 
        ? "bg-[rgba(231,93,93,0.15)] text-[#E75D5D]" 
        : assessment.chest_indrawing === false 
        ? "bg-[rgba(73,197,137,0.15)] text-[#49C589]" 
        : "bg-[rgba(242,184,75,0.15)] text-[#F2B84B]",
      isDanger: false,
      currentVal: assessment.chest_indrawing,
    },
    {
      key: "stridor",
      label: "Stridor in Calm State",
      valueDisplay: assessment.stridor === true ? "Present" : assessment.stridor === false ? "Absent" : "Unknown",
      valueType: "three_way",
      quote: extraction.verbatim_quotes?.stridor || "Observation",
      status: assessment.stridor === true ? "Urgent Trigger" : assessment.stridor === false ? "Absent" : "Unknown",
      statusColor: assessment.stridor === true 
        ? "bg-[rgba(231,93,93,0.15)] text-[#E75D5D]" 
        : assessment.stridor === false 
        ? "bg-[rgba(73,197,137,0.15)] text-[#49C589]" 
        : "bg-[rgba(242,184,75,0.15)] text-[#F2B84B]",
      isDanger: false,
      currentVal: assessment.stridor,
    },
    {
      key: "convulsions",
      label: "Convulsions (Seizures)",
      valueDisplay: assessment.danger_signs?.convulsions === true ? "Present" : assessment.danger_signs?.convulsions === false ? "Absent" : "Unknown",
      valueType: "three_way",
      quote: extraction.verbatim_quotes?.convulsions || "Caregiver history",
      status: assessment.danger_signs?.convulsions === true ? "Danger Sign" : assessment.danger_signs?.convulsions === false ? "Absent" : "Unknown",
      statusColor: assessment.danger_signs?.convulsions === true 
        ? "bg-[rgba(231,93,93,0.15)] text-[#E75D5D]" 
        : assessment.danger_signs?.convulsions === false 
        ? "bg-[rgba(73,197,137,0.15)] text-[#49C589]" 
        : "bg-[rgba(242,184,75,0.15)] text-[#F2B84B]",
      isDanger: true,
      currentVal: assessment.danger_signs?.convulsions,
    },
    {
      key: "unable_to_drink",
      label: "Unable to drink / breastfeed",
      valueDisplay: assessment.danger_signs?.unable_to_drink === true ? "Cannot drink" : assessment.danger_signs?.unable_to_drink === false ? "Drinking normally" : "Unknown",
      valueType: "three_way",
      quote: extraction.verbatim_quotes?.unable_to_drink || "Caregiver history",
      status: assessment.danger_signs?.unable_to_drink === true ? "Danger Sign" : assessment.danger_signs?.unable_to_drink === false ? "Absent" : "Unknown",
      statusColor: assessment.danger_signs?.unable_to_drink === true 
        ? "bg-[rgba(231,93,93,0.15)] text-[#E75D5D]" 
        : assessment.danger_signs?.unable_to_drink === false 
        ? "bg-[rgba(73,197,137,0.15)] text-[#49C589]" 
        : "bg-[rgba(242,184,75,0.15)] text-[#F2B84B]",
      isDanger: true,
      currentVal: assessment.danger_signs?.unable_to_drink,
    },
    {
      key: "vomiting_everything",
      label: "Vomits everything",
      valueDisplay: assessment.danger_signs?.vomiting_everything === true ? "Present" : assessment.danger_signs?.vomiting_everything === false ? "Absent" : "Unknown",
      valueType: "three_way",
      quote: extraction.verbatim_quotes?.vomiting_everything || "Caregiver history",
      status: assessment.danger_signs?.vomiting_everything === true ? "Danger Sign" : assessment.danger_signs?.vomiting_everything === false ? "Absent" : "Unknown",
      statusColor: assessment.danger_signs?.vomiting_everything === true 
        ? "bg-[rgba(231,93,93,0.15)] text-[#E75D5D]" 
        : assessment.danger_signs?.vomiting_everything === false 
        ? "bg-[rgba(73,197,137,0.15)] text-[#49C589]" 
        : "bg-[rgba(242,184,75,0.15)] text-[#F2B84B]",
      isDanger: true,
      currentVal: assessment.danger_signs?.vomiting_everything,
    },
    {
      key: "lethargic_or_unconscious",
      label: "Abnormally sleepy / Lethargic",
      valueDisplay: assessment.danger_signs?.lethargic_or_unconscious === true ? "Present" : assessment.danger_signs?.lethargic_or_unconscious === false ? "Alert" : "Unknown",
      valueType: "three_way",
      quote: extraction.verbatim_quotes?.lethargic_or_unconscious || "Observation",
      status: assessment.danger_signs?.lethargic_or_unconscious === true ? "Danger Sign" : assessment.danger_signs?.lethargic_or_unconscious === false ? "Absent" : "Unknown",
      statusColor: assessment.danger_signs?.lethargic_or_unconscious === true 
        ? "bg-[rgba(231,93,93,0.15)] text-[#E75D5D]" 
        : assessment.danger_signs?.lethargic_or_unconscious === false 
        ? "bg-[rgba(73,197,137,0.15)] text-[#49C589]" 
        : "bg-[rgba(242,184,75,0.15)] text-[#F2B84B]",
      isDanger: true,
      currentVal: assessment.danger_signs?.lethargic_or_unconscious,
    },
  ];

  return (
    <div data-testid="verification-panel" className="flex flex-col gap-4 bg-[#15313A] border border-[rgba(160,220,216,0.16)] rounded-xl p-4 sm:p-5 shadow-lg">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2BB7A9]" />
            <h2 className="text-sm font-bold text-[#EAF7F5] uppercase tracking-wider">
              2. Review Extracted Facts
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {hasUserModified && (
              <span className="text-[10px] font-semibold text-[#73DED0] bg-[#10232D] px-2 py-0.5 rounded border border-[rgba(160,220,216,0.2)]">
                Worker Modified
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-[#10232D] text-[#A8C3C5] border-[rgba(160,220,216,0.16)]">
              Confidence: {extraction.extraction_confidence || "High"}
            </span>
          </div>
        </div>
        <p className="text-xs text-[#A8C3C5] mt-1">
          Every clinical finding is verified against verbatim source quotes. The frontline health worker retains final authority to edit or override any parameter.
        </p>
      </div>

      {/* THE MOST IMPORTANT UX STATE: CANNOT CLASSIFY SAFELY YET */}
      {hasMissing && (
        <div className="bg-[#10232D] border-2 border-[#F2B84B] rounded-xl p-4 sm:p-5 text-[#EAF7F5] shadow-md">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[rgba(242,184,75,0.2)] text-[#F2B84B]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F2B84B] uppercase tracking-wider">
                CANNOT CLASSIFY SAFELY YET
              </div>
              <p className="text-xs text-[#A8C3C5]">
                Missing {missingFields.length} critical protocol item{missingFields.length > 1 ? "s" : ""}. Under IMNCI rules, an unexamined symptom is an unknown risk.
              </p>
            </div>
          </div>

          {/* Known facts summary chip list */}
          <div className="mt-3 pt-3 border-t border-[rgba(160,220,216,0.1)] flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-[#78979B]">Known facts:</span>
            {typeof assessment.age_months === "number" && (
              <span className="px-2 py-0.5 rounded bg-[#15313A] text-[#73DED0] border border-[rgba(160,220,216,0.16)] text-[11px]">
                Age: {assessment.age_months}m
              </span>
            )}
            {typeof assessment.respiratory_rate === "number" && (
              <span className="px-2 py-0.5 rounded bg-[#15313A] text-[#73DED0] border border-[rgba(160,220,216,0.16)] text-[11px]">
                RR: {assessment.respiratory_rate} bpm
              </span>
            )}
            {assessment.chest_indrawing !== "unknown" && assessment.chest_indrawing !== null && (
              <span className="px-2 py-0.5 rounded bg-[#15313A] text-[#73DED0] border border-[rgba(160,220,216,0.16)] text-[11px]">
                Indrawing: {assessment.chest_indrawing ? "Yes" : "No"}
              </span>
            )}
            {missingFields.map((field, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-[rgba(242,184,75,0.15)] text-[#F2B84B] border border-[rgba(242,184,75,0.3)] text-[11px] font-mono">
                ? {field}
              </span>
            ))}
          </div>

          {/* ONE Next Question & Quick Answer Buttons */}
          {primaryNextQuestion && (
            <div className="mt-4 p-3.5 bg-[#15313A] border border-[rgba(242,184,75,0.4)] rounded-lg">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#F2B84B] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#EAF7F5]">
                    {primaryNextQuestion.title}
                  </div>
                  <p className="text-[11px] text-[#A8C3C5] mt-0.5">
                    Why this matters: <span className="text-[#F2B84B] font-medium">{primaryNextQuestion.description}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {primaryNextQuestion.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onUpdateField(primaryNextQuestion!.fieldKey, opt.value, primaryNextQuestion!.isDangerSign)}
                        className="px-3 py-1.5 text-xs font-bold rounded bg-[#10232D] text-[#73DED0] border border-[rgba(160,220,216,0.2)] hover:bg-[#2BB7A9] hover:text-[#0B1720] hover:border-[#2BB7A9] transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions: Answer question, Edit extracted facts, Start over */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[rgba(160,220,216,0.1)] text-xs">
            <span className="text-[11px] text-[#78979B]">
              Protocol cannot classify until required facts are confirmed.
            </span>
            {onResetSession && (
              <button
                type="button"
                onClick={onResetSession}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A8C3C5] hover:text-[#E75D5D] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Start over</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Extraction Language & Verbatim Metadata */}
      {extraction.detected_language && (
        <div className="flex items-center justify-between px-3 py-2 bg-[#10232D] border border-[rgba(160,220,216,0.16)] rounded-lg text-xs text-[#A8C3C5]">
          <div className="flex items-center gap-2">
            <Quote className="w-3.5 h-3.5 text-[#2BB7A9]" />
            <span>
              Extracted from: <strong className="text-[#EAF7F5] font-semibold">{extraction.detected_language}</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#78979B]">
            Verbatim quotes attached
          </span>
        </div>
      )}

      {/* Compact Table: Field | Value | Source | Status */}
      <div className="border border-[rgba(160,220,216,0.16)] rounded-lg overflow-hidden bg-[#10232D]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0B1720] border-b border-[rgba(160,220,216,0.16)] text-[#78979B] font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Field</th>
              <th className="py-2.5 px-3">Value</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Source Quote</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(160,220,216,0.08)]">
            {tableRows.map((row) => (
              <tr key={row.key} className="hover:bg-[#15313A]/60 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-[#EAF7F5]">
                  {row.label}
                </td>
                <td className="py-2.5 px-3 text-[#A8C3C5]">
                  {row.valueDisplay}
                </td>
                <td className="py-2.5 px-3 text-[#78979B] italic hidden md:table-cell max-w-[200px] truncate">
                  &ldquo;{row.quote}&rdquo;
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${row.statusColor}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {row.valueType === "three_way" ? (
                    <div className="inline-flex items-center rounded border border-[rgba(160,220,216,0.16)] overflow-hidden bg-[#0B1720] p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateField(row.key, true, row.isDanger)}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          row.currentVal === true
                            ? "bg-[#E75D5D] text-white"
                            : "text-[#78979B] hover:text-[#EAF7F5]"
                        }`}
                        title="Mark Present"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateField(row.key, false, row.isDanger)}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          row.currentVal === false
                            ? "bg-[#2BB7A9] text-[#0B1720]"
                            : "text-[#78979B] hover:text-[#EAF7F5]"
                        }`}
                        title="Mark Absent"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateField(row.key, "unknown", row.isDanger)}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          row.currentVal === "unknown" || row.currentVal === null
                            ? "bg-[#F2B84B] text-[#0B1720]"
                            : "text-[#78979B] hover:text-[#EAF7F5]"
                        }`}
                        title="Mark Unknown"
                      >
                        ?
                      </button>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={typeof row.currentVal === "number" ? row.currentVal : ""}
                      onChange={(e) => onUpdateField(row.key, e.target.value ? parseInt(e.target.value, 10) : null)}
                      placeholder="Enter"
                      className="w-16 px-1.5 py-0.5 text-xs text-center font-mono bg-[#0B1720] border border-[rgba(160,220,216,0.2)] rounded text-[#EAF7F5] focus:border-[#2BB7A9] focus:outline-none"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation CTA */}
      <div className="pt-2 border-t border-[rgba(160,220,216,0.1)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-[#78979B]">
          Frontline worker verification ensures clinical fidelity before rule classification.
        </div>

        <button
          type="button"
          onClick={onConfirmAndEvaluate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-[#0B1720] bg-[#2BB7A9] hover:bg-[#73DED0] transition-colors shadow-md active:scale-[0.98]"
        >
          <CheckCircle2 className="w-4 h-4 text-[#0B1720]" />
          <span>Confirm Facts & Run Rules Engine</span>
        </button>
      </div>
    </div>
  );
}

