"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Quote,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Edit3,
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
  const [showOriginalNotes, setShowOriginalNotes] = useState(false);

  if (isExtracting) {
    return (
      <div
        data-testid="verification-panel"
        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center"
      >
        <div className="relative w-14 h-14 mb-4">
          <div className="w-14 h-14 rounded-full border-[3px] border-[var(--color-brand)]/20 border-t-[var(--color-brand)] animate-spin" />
          <Brain className="w-6 h-6 text-[var(--color-brand)] absolute inset-0 m-auto" />
        </div>
        <h3 className="type-h3 text-[var(--color-text)]">Extracting Clinical Facts…</h3>
        <p className="type-small text-[var(--color-text-secondary)] max-w-md mt-1.5">
          Parsing observations, mapping verbatim quotations, and evaluating IMNCI age cohort parameters.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-[var(--color-brand-light)] bg-[var(--color-surface)] px-3.5 py-1.5 rounded-full border border-[var(--color-border)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Deterministic schema validation active</span>
        </div>
      </div>
    );
  }

  if (!extraction || !assessment) {
    return (
      <div
        data-testid="verification-panel"
        className="bg-[var(--color-card)] border border-dashed border-[var(--color-border-strong)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center"
      >
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] mb-3">
          <Quote className="w-5 h-5" />
        </div>
        <h3 className="type-h3 text-[var(--color-text)]">No Facts Extracted Yet</h3>
        <p className="type-small text-[var(--color-text-secondary)] max-w-sm mt-1">
          Enter clinical observations or select a demo scenario in Step 1 to extract structured clinical facts.
        </p>
      </div>
    );
  }

  const ageMonths = assessment.age_months ?? assessment.facts?.patient_age_months;
  const rr = assessment.respiratory_rate ?? assessment.facts?.respiratory_rate;

  let rrCutoff = 40;
  let isFastBreathing = false;
  if (typeof ageMonths === "number") {
    if (ageMonths >= 2 && ageMonths <= 11) {
      rrCutoff = 50;
      if (typeof rr === "number" && rr >= 50) isFastBreathing = true;
    } else if (ageMonths >= 12) {
      rrCutoff = 40;
      if (typeof rr === "number" && rr >= 40) isFastBreathing = true;
    }
  }

  // Determine critical unconfirmed or missing items with clinical rationale
  interface UnconfirmedItem {
    id: string;
    fieldKey: string;
    label: string;
    isDangerSign: boolean;
    whyItMatters: string;
    ifUnknown: string;
    options: { label: string; value: boolean | number | string; style?: string }[];
  }

  const unconfirmedItems: UnconfirmedItem[] = [];

  const unableToDrink = assessment.danger_signs?.unable_to_drink_or_breastfeed ?? assessment.facts?.danger_signs?.unable_to_drink_or_breastfeed;
  if (unableToDrink === "unknown" || unableToDrink === null || unableToDrink === undefined) {
    unconfirmedItems.push({
      id: "drink",
      fieldKey: "unable_to_drink",
      label: "Ability to Drink or Breastfeed",
      isDangerSign: true,
      whyItMatters: "General Danger Sign: Severe dehydration, systemic sepsis, or inability to take oral medications.",
      ifUnknown: "Protocol safely refuses classification (Amber) to prevent missed hospital admission.",
      options: [
        { label: "Drinks Normally", value: false, style: "hover:bg-[var(--color-green)] hover:text-white" },
        { label: "Cannot Drink (Danger)", value: true, style: "hover:bg-[var(--color-pink)] hover:text-white" },
        { label: "Keep Unknown", value: "unknown" },
      ],
    });
  }

  if (rr === "unknown" || rr === null || rr === undefined) {
    unconfirmedItems.push({
      id: "rr",
      fieldKey: "respiratory_rate",
      label: "Counted Respiratory Rate (breaths/min in 60s)",
      isDangerSign: false,
      whyItMatters: `Mandatory IMNCI pneumonia metric. Threshold for ${typeof ageMonths === "number" && ageMonths < 12 ? "2–11 months is ≥50" : "12–59 months is ≥40"} breaths/min.`,
      ifUnknown: "Cannot evaluate pneumonia classification without measured breath count.",
      options: [
        { label: "Normal (32 bpm)", value: 32 },
        { label: `Fast (${typeof ageMonths === "number" && ageMonths < 12 ? "54" : "44"} bpm)`, value: typeof ageMonths === "number" && ageMonths < 12 ? 54 : 44 },
        { label: "Very Fast (64 bpm)", value: 64 },
      ],
    });
  }

  const convulsions = assessment.danger_signs?.has_convulsions ?? assessment.facts?.danger_signs?.has_convulsions;
  if (convulsions === "unknown" || convulsions === null || convulsions === undefined) {
    unconfirmedItems.push({
      id: "convulsions",
      fieldKey: "convulsions",
      label: "History of Convulsions / Fits",
      isDangerSign: true,
      whyItMatters: "General Danger Sign: Indicates CNS involvement, meningitis, cerebral malaria, or severe febrile seizure.",
      ifUnknown: "Protocol blocks classification (Amber) to prevent discharging a child with neurological danger signs.",
      options: [
        { label: "No Convulsions", value: false },
        { label: "Had Convulsions (Danger)", value: true, style: "hover:bg-[var(--color-pink)] hover:text-white" },
        { label: "Keep Unknown", value: "unknown" },
      ],
    });
  }

  const indrawing = assessment.chest_indrawing ?? assessment.facts?.chest_indrawing;
  if (indrawing === "unknown" || indrawing === null || indrawing === undefined) {
    unconfirmedItems.push({
      id: "chest_indrawing",
      fieldKey: "chest_indrawing",
      label: "Lower Chest Wall Indrawing",
      isDangerSign: false,
      whyItMatters: "Physical sign of severe respiratory distress: Lower chest wall moves in when child breathes in.",
      ifUnknown: "Required to rule out Severe Pneumonia (Pink pathway).",
      options: [
        { label: "No Indrawing", value: false },
        { label: "Present (Severe Sign)", value: true, style: "hover:bg-[var(--color-pink)] hover:text-white" },
        { label: "Keep Unknown", value: "unknown" },
      ],
    });
  }

  const stridor = assessment.stridor ?? assessment.facts?.stridor_in_calm_child;
  if (stridor === "unknown" || stridor === null || stridor === undefined) {
    unconfirmedItems.push({
      id: "stridor",
      fieldKey: "stridor",
      label: "Stridor in Calm Child",
      isDangerSign: false,
      whyItMatters: "Harsh sound during inspiration in a calm child indicates upper airway obstruction (croup/foreign body).",
      ifUnknown: "Required to rule out upper airway emergency.",
      options: [
        { label: "No Stridor", value: false },
        { label: "Present (Emergency)", value: true, style: "hover:bg-[var(--color-pink)] hover:text-white" },
        { label: "Keep Unknown", value: "unknown" },
      ],
    });
  }

  const lethargic = assessment.danger_signs?.lethargic_or_unconscious ?? assessment.facts?.danger_signs?.lethargic_or_unconscious;
  if (lethargic === "unknown" || lethargic === null || lethargic === undefined) {
    unconfirmedItems.push({
      id: "lethargic",
      fieldKey: "lethargic_or_unconscious",
      label: "Lethargic or Unconscious State",
      isDangerSign: true,
      whyItMatters: "General Danger Sign: Child is not alert, abnormally drowsy, or difficult to awaken.",
      ifUnknown: "Must be confirmed to rule out altered mental status.",
      options: [
        { label: "Alert / Normal", value: false },
        { label: "Lethargic (Danger)", value: true, style: "hover:bg-[var(--color-pink)] hover:text-white" },
        { label: "Keep Unknown", value: "unknown" },
      ],
    });
  }

  const vomits = assessment.danger_signs?.vomits_everything ?? assessment.facts?.danger_signs?.vomits_everything;
  if (vomits === "unknown" || vomits === null || vomits === undefined) {
    unconfirmedItems.push({
      id: "vomits",
      fieldKey: "vomiting_everything",
      label: "Vomiting Everything",
      isDangerSign: true,
      whyItMatters: "General Danger Sign: Child cannot retain any food, liquids, or oral medications.",
      ifUnknown: "Must be confirmed before considering outpatient therapy.",
      options: [
        { label: "Retains Fluids", value: false },
        { label: "Vomits Everything (Danger)", value: true, style: "hover:bg-[var(--color-pink)] hover:text-white" },
        { label: "Keep Unknown", value: "unknown" },
      ],
    });
  }

  // Master findings list for table
  interface TableRowItem {
    key: string;
    label: string;
    category: "Demographics" | "Respiratory" | "Danger Signs";
    valueDisplay: string;
    valueType: "number" | "three_way";
    status: "Verified" | "Needs Review" | "Unknown" | "Danger Sign" | "User Modified";
    sourceQuote: string;
    isDanger: boolean;
    currentVal: boolean | number | string | null | undefined;
  }

  const tableRows: TableRowItem[] = [
    {
      key: "age_months",
      label: "Child Age",
      category: "Demographics",
      valueDisplay: typeof ageMonths === "number" ? `${ageMonths} mo (${ageMonths < 12 ? "2–11m cohort" : "12–59m cohort"})` : "Unknown / Missing",
      valueType: "number",
      status: typeof ageMonths === "number" ? (hasUserModified ? "User Modified" : "Verified") : "Unknown",
      sourceQuote: extraction.verbatim_quotes?.age_months || extraction.verbatim_quotes?.patient_age_months || assessment.evidence?.age_evidence || "Extracted from note",
      isDanger: false,
      currentVal: ageMonths,
    },
    {
      key: "respiratory_rate",
      label: "Counted Respiratory Rate",
      category: "Respiratory",
      valueDisplay:
        typeof rr === "number"
          ? `${rr} bpm ${isFastBreathing ? `⚠ Fast (≥${rrCutoff} bpm)` : `Normal (<${rrCutoff} bpm)`}`
          : "Not Counted (Unknown)",
      valueType: "number",
      status:
        typeof rr === "number"
          ? (isFastBreathing ? "Needs Review" : (hasUserModified ? "User Modified" : "Verified"))
          : "Unknown",
      sourceQuote: extraction.verbatim_quotes?.respiratory_rate || assessment.evidence?.respiratory_evidence || "Measured breaths/min in 60s",
      isDanger: false,
      currentVal: rr,
    },
    {
      key: "chest_indrawing",
      label: "Lower Chest Wall Indrawing",
      category: "Respiratory",
      valueDisplay: indrawing === true ? "Present (Severe Sign)" : indrawing === false ? "Absent (Normal)" : "Unknown / Unassessed",
      valueType: "three_way",
      status: indrawing === true ? "Danger Sign" : indrawing === false ? "Verified" : "Unknown",
      sourceQuote: extraction.verbatim_quotes?.chest_indrawing || assessment.evidence?.chest_indrawing_evidence || "Visual inspection of chest",
      isDanger: false,
      currentVal: indrawing,
    },
    {
      key: "stridor",
      label: "Stridor in Calm Child",
      category: "Respiratory",
      valueDisplay: stridor === true ? "Present (Emergency)" : stridor === false ? "Absent (Normal)" : "Unknown / Unassessed",
      valueType: "three_way",
      status: stridor === true ? "Danger Sign" : stridor === false ? "Verified" : "Unknown",
      sourceQuote: extraction.verbatim_quotes?.stridor || assessment.evidence?.stridor_evidence || "Auscultation / auditory check",
      isDanger: false,
      currentVal: stridor,
    },
    {
      key: "convulsions",
      label: "History of Convulsions",
      category: "Danger Signs",
      valueDisplay: convulsions === true ? "Present (General Danger Sign)" : convulsions === false ? "Absent" : "Unknown",
      valueType: "three_way",
      status: convulsions === true ? "Danger Sign" : convulsions === false ? "Verified" : "Unknown",
      sourceQuote: extraction.verbatim_quotes?.convulsions || assessment.evidence?.danger_signs_evidence || "Caregiver history of seizures",
      isDanger: true,
      currentVal: convulsions,
    },
    {
      key: "unable_to_drink",
      label: "Unable to Drink / Breastfeed",
      category: "Danger Signs",
      valueDisplay: unableToDrink === true ? "Cannot Drink (General Danger Sign)" : unableToDrink === false ? "Drinking Normally" : "Unknown",
      valueType: "three_way",
      status: unableToDrink === true ? "Danger Sign" : unableToDrink === false ? "Verified" : "Unknown",
      sourceQuote: extraction.verbatim_quotes?.unable_to_drink || assessment.evidence?.danger_signs_evidence || "Oral fluid test / intake history",
      isDanger: true,
      currentVal: unableToDrink,
    },
    {
      key: "vomiting_everything",
      label: "Vomits Everything",
      category: "Danger Signs",
      valueDisplay: vomits === true ? "Vomits Everything (General Danger Sign)" : vomits === false ? "Retains Fluids" : "Unknown",
      valueType: "three_way",
      status: vomits === true ? "Danger Sign" : vomits === false ? "Verified" : "Unknown",
      sourceQuote: extraction.verbatim_quotes?.vomiting_everything || assessment.evidence?.danger_signs_evidence || "Caregiver report of vomiting",
      isDanger: true,
      currentVal: vomits,
    },
    {
      key: "lethargic_or_unconscious",
      label: "Lethargic or Unconscious",
      category: "Danger Signs",
      valueDisplay: lethargic === true ? "Lethargic / Unconscious (General Danger Sign)" : lethargic === false ? "Alert & Playful" : "Unknown",
      valueType: "three_way",
      status: lethargic === true ? "Danger Sign" : lethargic === false ? "Verified" : "Unknown",
      sourceQuote: extraction.verbatim_quotes?.lethargic_or_unconscious || assessment.evidence?.danger_signs_evidence || "Consciousness / alertness check",
      isDanger: true,
      currentVal: lethargic,
    },
  ];

  const statusBadgeStyle = (status: TableRowItem["status"]) => {
    switch (status) {
      case "Verified":
        return "bg-[var(--color-green-bg)] text-[var(--color-green)] border-[var(--color-green-border)]";
      case "Needs Review":
        return "bg-[var(--color-yellow-bg)] text-[var(--color-yellow)] border-[var(--color-yellow-border)]";
      case "Unknown":
        return "bg-[var(--color-amber-bg)] text-[var(--color-amber)] border-[var(--color-amber-border)]";
      case "Danger Sign":
        return "bg-[var(--color-pink-bg)] text-[var(--color-pink)] border-[var(--color-pink-border)] font-bold";
      case "User Modified":
        return "bg-[var(--color-brand)]/15 text-[var(--color-brand-light)] border-[var(--color-brand)]/30";
      default:
        return "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]";
    }
  };

  const getStatusLabelWithIcon = (status: TableRowItem["status"]) => {
    switch (status) {
      case "Verified":
        return "✓ Verified";
      case "Needs Review":
        return "⚠ Review";
      case "Unknown":
        return "○ Unknown";
      case "Danger Sign":
        return "! Urgent Sign";
      case "User Modified":
        return "✓ Clinician Edited";
      default:
        return status;
    }
  };

  const totalParams = tableRows.length;
  const confirmedCount = tableRows.filter((r) => r.status === "Verified" || r.status === "Danger Sign" || r.status === "User Modified" || r.status === "Needs Review").length;
  const unknownCount = totalParams - confirmedCount;

  return (
    <div
      data-testid="verification-panel"
      className="flex flex-col gap-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 sm:p-5"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" />
            <h2 className="type-h3 text-[var(--color-text)]">
              Step 2: Verify Extracted Clinical Facts
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {hasUserModified && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--color-brand)]/15 text-[var(--color-brand-light)] border border-[var(--color-brand)]/30">
                User Modified
              </span>
            )}
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              unknownCount === 0
                ? "bg-[var(--color-green-bg)] text-[var(--color-green)] border-[var(--color-green-border)]"
                : "bg-[var(--color-amber-bg)] text-[var(--color-amber)] border-[var(--color-amber-border)]"
            }`}>
              {confirmedCount}/{totalParams} Confirmed
            </span>
          </div>
        </div>
        <p className="type-small text-[var(--color-text-secondary)]">
          Inspect every extracted fact before protocol evaluation. <strong className="text-[var(--color-text)]">Safety Invariant: UNKNOWN ≠ FALSE.</strong> Missing findings must be explicitly confirmed or left as Unknown to block premature discharge.
        </p>
      </div>

      {/* Raw Caregiver Observation Accordion */}
      {assessment.rawInput && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOriginalNotes((prev) => !prev)}
            className="w-full flex items-center justify-between p-2.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-[var(--color-brand-light)]" />
              <span className="font-semibold">Original Caregiver Observation Notes</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
              <span>{showOriginalNotes ? "Hide" : "Show"} reference</span>
              {showOriginalNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
          </button>
          {showOriginalNotes && (
            <div className="px-3 pb-3 pt-1 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text)] bg-[var(--color-card)] p-2.5 rounded border border-[var(--color-border)] font-mono leading-relaxed whitespace-pre-wrap">
                &ldquo;{assessment.rawInput}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Structured "Verification Required" Area */}
      {unconfirmedItems.length > 0 && (
        <div className="bg-[var(--color-amber-bg)] border border-[var(--color-amber-border)] rounded-lg p-4 animate-fade-in">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--color-amber)] shrink-0" />
              <span className="text-xs font-bold text-[var(--color-amber)] uppercase tracking-wider">
                Verification Required: {unconfirmedItems.length} Unconfirmed Clinical Item{unconfirmedItems.length > 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              Gating Safety Active
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed mb-3">
            The IMNCI decision tree requires explicit evaluation of critical signs. Missing items are preserved as <strong className="text-[var(--color-amber)]">UNKNOWN</strong>, which will safely refuse classification (Amber status) to prevent false-negative discharge.
          </p>

          <div className="space-y-2.5">
            {unconfirmedItems.map((item) => (
              <div
                key={item.id}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber)]" />
                    <span className="text-xs font-bold text-[var(--color-text)]">{item.label}</span>
                    {item.isDangerSign && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-pink-bg)] text-[var(--color-pink)] border border-[var(--color-pink-border)]">
                        Danger Sign
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] italic">
                    {item.ifUnknown}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)] mb-2.5">
                  <strong className="text-[var(--color-text)]">Why it matters:</strong> {item.whyItMatters}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                    Confirm finding:
                  </span>
                  {item.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onUpdateField(item.fieldKey, opt.value, item.isDangerSign)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-brand)] transition-all ${
                        opt.style || "hover:bg-[var(--color-brand)] hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Findings Table: FIELD | VALUE | SOURCE | STATUS | ACTION */}
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
        <div className="px-3.5 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-[var(--color-brand-light)]" />
            <span className="type-caption text-[var(--color-text)]">Clinical Findings Matrix</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Click Yes / No / ? to update parameter
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" role="table" aria-label="Extracted clinical findings">
            <thead>
              <tr className="bg-[var(--color-card)]/50 border-b border-[var(--color-border)]">
                <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)]">Field</th>
                <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)]">Value</th>
                <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)] hidden md:table-cell">Source / Evidence</th>
                <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)]">Status</th>
                <th scope="col" className="py-2.5 px-3 type-label text-[var(--color-text-muted)] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-card)]">
              {tableRows.map((row) => (
                <tr key={row.key} className="hover:bg-[var(--color-surface)]/70 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-[var(--color-text)] text-[13px]">{row.label}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">{row.category}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-[var(--color-text)]">
                    {row.valueDisplay}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--color-text-muted)] hidden md:table-cell max-w-[200px] truncate" title={row.sourceQuote}>
                    &ldquo;{row.sourceQuote}&rdquo;
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeStyle(row.status)}`}>
                      {getStatusLabelWithIcon(row.status)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {row.valueType === "three_way" ? (
                      <fieldset
                        className="inline-flex items-center rounded-md border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]"
                        aria-label={`Edit ${row.label}`}
                      >
                        <legend className="sr-only">{row.label}</legend>
                        {(["Yes", "No", "?"] as const).map((label, i) => {
                          const val = i === 0 ? true : i === 1 ? false : "unknown";
                          const isActive =
                            row.currentVal === val ||
                            (val === "unknown" && (row.currentVal === "unknown" || row.currentVal === null || row.currentVal === undefined));
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => onUpdateField(row.key, val, row.isDanger)}
                              aria-pressed={isActive}
                              title={label === "?" ? "Explicitly set as Unknown (Preserves Safety)" : label === "Yes" ? "Sign is Present" : "Sign is Absent"}
                              className={`px-2 py-1 text-[11px] font-bold transition-all ${
                                isActive
                                  ? label === "Yes"
                                    ? row.isDanger || row.key === "chest_indrawing" || row.key === "stridor"
                                      ? "bg-[var(--color-pink)] text-white shadow-sm"
                                      : "bg-[var(--color-brand)] text-white shadow-sm"
                                    : label === "No"
                                    ? "bg-[var(--color-green)] text-white shadow-sm"
                                    : "bg-[var(--color-amber)] text-black shadow-sm"
                                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)]"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </fieldset>
                    ) : (
                      <div className="inline-flex items-center gap-1 justify-end">
                        <input
                          type="number"
                          value={typeof row.currentVal === "number" ? row.currentVal : ""}
                          onChange={(e) => onUpdateField(row.key, e.target.value ? parseInt(e.target.value, 10) : "unknown")}
                          placeholder="—"
                          aria-label={`Enter ${row.label}`}
                          className="w-16 px-2 py-1 text-xs text-center font-mono bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)]"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateField(row.key, "unknown")}
                          title="Mark as unknown"
                          className="px-1.5 py-1 text-[10px] font-bold rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                        >
                          ?
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Summary & Confirm CTA */}
      <div className="pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-[11px] text-[var(--color-text-muted)]">
          {unknownCount === 0 ? (
            <span className="text-[var(--color-green)] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All parameters verified. Ready for definitive IMNCI protocol evaluation.
            </span>
          ) : (
            <span className="text-[var(--color-amber)] font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {unknownCount} parameter{unknownCount > 1 ? "s" : ""} unknown. Rules engine will safely block classification.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onConfirmAndEvaluate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-all shadow-md active:scale-[0.98]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirm Facts &amp; Run Protocol</span>
        </button>
      </div>
    </div>
  );
}
