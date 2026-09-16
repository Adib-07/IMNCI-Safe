"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Copy,
  Check,
  Printer,
  HeartPulse,
  Info,
  RotateCcw,
  Lock,
  CheckSquare,
} from "lucide-react";
import type { ProtocolResult, ImnciAssessment } from "@/lib/types";

interface ReferralCardProps {
  result: ProtocolResult | null;
  assessment: ImnciAssessment | null;
  isConfirmed?: boolean;
  onConfirmDecision?: () => void;
  onOpenHandoffModal?: () => void;
  onReset?: () => void;
  isExtracting?: boolean;
}

export function ReferralCard({
  result,
  assessment,
  isConfirmed = false,
  onConfirmDecision,
  onOpenHandoffModal,
  onReset,
  isExtracting = false,
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [localConfirmed, setLocalConfirmed] = useState(false);
  const [preReferralChecklist, setPreReferralChecklist] = useState({
    antibiotic: false,
    warmth: false,
    breastfeeding: false,
    transport: false,
  });

  const confirmedState = isConfirmed || localConfirmed;

  const handleConfirmToggle = () => {
    setLocalConfirmed(!confirmedState);
    if (onConfirmDecision) onConfirmDecision();
  };

  const toggleChecklistItem = (key: keyof typeof preReferralChecklist) => {
    setPreReferralChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopySBAR = () => {
    if (!result) return;
    const age = assessment?.age_months || assessment?.facts?.patient_age_months;
    const text = `IMNCI REFERRAL — ${result.triage_color}
Age: ${age ? `${age} months` : "Unknown"}
Classification: ${result.classification_name}
Rule: ${result.rule_id || result.matchedRule}
RR: ${assessment?.respiratory_rate ? `${assessment.respiratory_rate} bpm` : "Not counted"}
Chest Indrawing: ${assessment?.chest_indrawing === true ? "Present" : "Absent"}
Stridor: ${assessment?.stridor === true ? "Present" : "Absent"}
Danger Signs: Convulsions=${assessment?.danger_signs?.has_convulsions ? "Y" : "N"}, Drink=${assessment?.danger_signs?.unable_to_drink_or_breastfeed ? "Y" : "N"}, Vomit=${assessment?.danger_signs?.vomits_everything ? "Y" : "N"}, Lethargy=${assessment?.danger_signs?.lethargic_or_unconscious ? "Y" : "N"}
Action: ${result.treatment_instruction}
*Clinical decision-support prototype. Requires human verification.*`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading
  if (isExtracting) {
    return (
      <div data-testid="referral-card" className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="spinner mb-4" style={{ width: 32, height: 32 }} />
        <h3 className="type-h3 text-[var(--color-text)]">Evaluating Protocol Rules…</h3>
        <p className="type-small text-[var(--color-text-secondary)] max-w-sm mt-1">
          Running deterministic IMNCI rules on verified clinical parameters.
        </p>
      </div>
    );
  }

  // Empty
  if (!result) {
    return (
      <div data-testid="referral-card" className="bg-[var(--color-card)] border border-dashed border-[var(--color-border-strong)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] mb-3">
          <HeartPulse className="w-5 h-5" />
        </div>
        <h3 className="type-h3 text-[var(--color-text)]">Awaiting Classification</h3>
        <p className="type-small text-[var(--color-text-secondary)] max-w-sm mt-1">
          Complete input and verification to evaluate the IMNCI protocol.
        </p>
      </div>
    );
  }

  const isBlocked = result.status === "insufficient_information" || result.status === "NEEDS_CONFIRMATION" || result.triage_color === "AMBER";
  const isUrgent = result.triage_color === "PINK";
  const isTreatment = result.triage_color === "YELLOW";
  const isHomecare = result.triage_color === "GREEN";
  const missingList = result.missing_fields || [];
  const missingCount = missingList.length || result.missing_parameters?.length || 0;

  return (
    <div data-testid="referral-card" className="flex flex-col gap-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isBlocked ? "bg-[var(--color-yellow)]" : isUrgent ? "bg-[var(--color-pink)]" : isTreatment ? "bg-[var(--color-yellow)]" : "bg-[var(--color-green)]"}`} />
          <h2 className="type-h3 text-[var(--color-text)]">Protocol Classification</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="type-micro text-[var(--color-text-muted)] font-mono bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)]">
            {result.matchedRule || result.rule_id || "EVAL"}
          </span>
          {onReset && (
            <button onClick={onReset} className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-pink)] flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Deterministic Badge */}
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)]" />
        <span>Deterministic rules engine — zero LLM in classification</span>
      </div>

      {/* AMBER — Blocked */}
      {isBlocked && (
        <div className="bg-[var(--color-yellow-bg)] border border-[var(--color-yellow-border)] rounded-lg p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-yellow)]/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[var(--color-yellow)]" />
            </div>
            <div>
              <span className="type-label text-[var(--color-yellow)]">Classification Blocked</span>
              <h3 className="type-h2 text-[var(--color-text)] mt-1">
                {result.classification_name || "Incomplete examination parameters"}
              </h3>
              <p className="type-small text-[var(--color-text-secondary)] mt-1">
                {result.rule_description || "Missing critical fields required by the IMNCI decision tree."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-yellow)] mt-3 bg-[var(--color-card)] border border-[var(--color-border)] px-3 py-1.5 rounded-md w-fit">
            <Clock className="w-3.5 h-3.5" />
            <span>Missing {missingCount || 1} Required Fact{missingCount === 1 ? "" : "s"}</span>
          </div>
          {result.treatment_instruction && (
            <div className="mt-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-xs">
              <span className="font-bold text-[var(--color-yellow)]">Next step: </span>
              <span className="text-[var(--color-text-secondary)]">{result.treatment_instruction}</span>
            </div>
          )}
        </div>
      )}

      {/* PINK — Urgent */}
      {isUrgent && (
        <div className="bg-[var(--color-pink-bg)] border border-[var(--color-pink-border)] rounded-lg p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-pink)] flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="type-label text-[var(--color-pink)]">Urgent Referral — Pink</span>
              <h3 className="type-h2 text-[var(--color-text)] mt-1">{result.classification_name}</h3>
              <p className="type-small text-[var(--color-pink)] mt-1 font-medium">
                {result.rule_description || "Danger sign or severe physical sign verified."}
              </p>
            </div>
          </div>
          {result.treatment_instruction && (
            <div className="mt-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-xs">
              <span className="font-bold text-[var(--color-pink)]">Action: </span>
              <span className="text-[var(--color-text)] font-medium">{result.treatment_instruction}</span>
            </div>
          )}
          <div className="mt-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-xs">
            <div className="font-bold text-[var(--color-pink)] mb-2 flex items-center justify-between">
              <span>Pre-Referral Stabilization</span>
              <span className="text-[var(--color-text-muted)] font-normal text-[10px]">Check when done</span>
            </div>
            <div className="space-y-1.5">
              {([
                { key: "antibiotic" as const, label: "First dose antibiotic administered" },
                { key: "warmth" as const, label: "Hypothermia protection (keep warm)" },
                { key: "breastfeeding" as const, label: "Continue breastfeeding / fluids" },
                { key: "transport" as const, label: "Transport to FRU arranged" },
              ]).map(({ key, label }) => (
                <label key={key} className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preReferralChecklist[key]}
                    onChange={() => toggleChecklistItem(key)}
                    className="mt-0.5 rounded"
                  />
                  <span className="text-[var(--color-text-secondary)] leading-tight">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* YELLOW — Pneumonia */}
      {isTreatment && (
        <div className="bg-[var(--color-yellow-bg)] border border-[var(--color-yellow-border)] rounded-lg p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-yellow)] flex items-center justify-center shrink-0 shadow-md">
              <HeartPulse className="w-5 h-5 text-[var(--color-text-inverse)]" />
            </div>
            <div>
              <span className="type-label text-[var(--color-yellow)]">Pneumonia — Outpatient</span>
              <h3 className="type-h2 text-[var(--color-text)] mt-1">{result.classification_name}</h3>
              <p className="type-small text-[var(--color-yellow)] mt-1 font-medium">
                {result.rule_description || "Fast breathing without danger signs."}
              </p>
            </div>
          </div>
          {result.treatment_instruction && (
            <div className="mt-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-xs">
              <span className="font-bold text-[var(--color-yellow)]">Action: </span>
              <span className="text-[var(--color-text)]">{result.treatment_instruction}</span>
            </div>
          )}
          <div className="mt-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-xs space-y-1.5">
            <span className="font-bold text-[var(--color-yellow)]">Outpatient actions:</span>
            <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
              <li>Oral antibiotic for 5 days per national dosage chart</li>
              <li>Warm fluids for throat comfort</li>
              <li>Advise caregiver on return indicators</li>
              <li>Follow-up in <strong className="text-[var(--color-text)]">48 hours</strong></li>
            </ul>
          </div>
        </div>
      )}

      {/* GREEN — Home Care */}
      {isHomecare && (
        <div className="bg-[var(--color-green-bg)] border border-[var(--color-green-border)] rounded-lg p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-green)] flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="type-label text-[var(--color-green)]">No Urgent Trigger — Home Care</span>
              <h3 className="type-h2 text-[var(--color-text)] mt-1">{result.classification_name}</h3>
              <p className="type-small text-[var(--color-green)] mt-1 font-medium">
                {result.rule_description || "No urgent referral criteria met."}
              </p>
            </div>
          </div>
          {result.treatment_instruction && (
            <div className="mt-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-xs">
              <span className="font-bold text-[var(--color-green)]">Action: </span>
              <span className="text-[var(--color-text)]">{result.treatment_instruction}</span>
            </div>
          )}
        </div>
      )}

      {/* Human Confirmation Gate */}
      <div className={`p-4 rounded-lg border transition-all ${
        confirmedState
          ? "bg-[var(--color-green-bg)] border-[var(--color-green-border)]"
          : "bg-[var(--color-surface)] border-[var(--color-border)]"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
              confirmedState ? "bg-[var(--color-green)] text-white" : "bg-[var(--color-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
            }`}>
              {confirmedState ? <CheckSquare className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-text)]">Human Verification Gate</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  confirmedState
                    ? "bg-[var(--color-green)]/15 text-[var(--color-green)]"
                    : "bg-[var(--color-yellow)]/15 text-[var(--color-yellow)]"
                }`}>
                  {confirmedState ? "VERIFIED" : "REQUIRED"}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                {confirmedState
                  ? "Facts confirmed. Ready for handoff."
                  : "Review and confirm before handoff."}
              </p>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-brand)] cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={confirmedState}
              onChange={handleConfirmToggle}
              className="w-4 h-4 rounded"
            />
            <span className="text-xs font-bold text-[var(--color-text)]">Confirm</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {!confirmedState && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
            <Lock className="w-4 h-4 text-[var(--color-yellow)] shrink-0" />
            <span>Confirm above to enable handoff actions.</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopySBAR}
            disabled={!confirmedState}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              confirmedState
                ? "bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-elevated)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-50 cursor-not-allowed"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-green)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Summary"}</span>
          </button>
          {onOpenHandoffModal && (
            <button
              type="button"
              onClick={onOpenHandoffModal}
              disabled={!confirmedState}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                confirmedState
                  ? "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white shadow-md"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-50 cursor-not-allowed"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Referral Slip</span>
            </button>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-3 text-[11px] text-[var(--color-text-muted)] flex items-start gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-brand)]" />
        <span>
          Prototype subset: Acute Respiratory Infection &amp; General Danger Signs (2–59 months).
          Not an autonomous diagnostic system. Human confirmation mandatory.
        </span>
      </div>
    </div>
  );
}
