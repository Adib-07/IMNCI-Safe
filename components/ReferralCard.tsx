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
  Sparkles,
  Lock,
  CheckSquare
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
    const next = !confirmedState;
    setLocalConfirmed(next);
    if (onConfirmDecision) {
      onConfirmDecision();
    }
  };

  const toggleChecklistItem = (key: keyof typeof preReferralChecklist) => {
    setPreReferralChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopySBAR = () => {
    if (!result) return;
    const age = assessment?.age_months || assessment?.facts?.patient_age_months;
    const sbarText = `
IMNCI SBAR REFERRAL HANDOFF NOTE
---------------------------------
[S] SITUATION:
- Patient Age: ${age ? `${age} months` : "Not recorded"}
- Reason for Referral: ${result.classification_name} (${result.triage_color})
- Triage Priority: ${result.triage_color === "PINK" ? "URGENT HOSPITAL REFERRAL" : result.triage_color}

[B] BACKGROUND:
- Evaluation Protocol: WHO / Government of India IMNCI Rules Engine (Acute Respiratory)
- Rule Triggered: ${result.rule_id || result.matchedRule || "IMNCI-PNEU-01"}
- Trigger Rationale: ${result.rule_description || result.classification_name}

[A] ASSESSMENT (VERIFIED CLINICAL FINDINGS):
- Respiratory Rate: ${assessment?.respiratory_rate ? `${assessment.respiratory_rate} bpm` : "Not counted"}
- Chest Indrawing: ${assessment?.chest_indrawing === true ? "PRESENT" : assessment?.chest_indrawing === false ? "Absent" : "Unknown"}
- Stridor in Calm State: ${assessment?.stridor === true ? "PRESENT" : assessment?.stridor === false ? "Absent" : "Unknown"}
- Danger Signs:
  * Unable to drink/breastfeed: ${assessment?.danger_signs?.unable_to_drink_or_breastfeed === true ? "YES" : "No"}
  * Vomits everything: ${assessment?.danger_signs?.vomits_everything === true ? "YES" : "No"}
  * Convulsions: ${assessment?.danger_signs?.has_convulsions === true ? "YES" : "No"}
  * Lethargic / Unconscious: ${assessment?.danger_signs?.lethargic_or_unconscious === true ? "YES" : "No"}

[R] RECOMMENDATION & PRE-REFERRAL ACTIONS:
- Immediate Action: ${result.treatment_instruction || "Refer urgently to First Referral Unit (FRU)"}
- First dose antibiotic administered: ${preReferralChecklist.antibiotic ? "YES" : "Pending at post"}
- Hypothermia protection during transit: ${preReferralChecklist.warmth ? "CONFIRMED" : "Pending"}
- Fluid / Feeding maintenance: ${preReferralChecklist.breastfeeding ? "CONFIRMED" : "Pending"}
- Transport arranged: ${preReferralChecklist.transport ? "ARRANGED" : "Pending"}

Verified & Authorized By: Frontline Health Worker
Time of Handoff: ${new Date().toLocaleString()}
*Decision-support prototype. Requires qualified human verification.*
`.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(sbarText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1. Loading State
  if (isExtracting) {
    return (
      <div 
        data-testid="referral-card" 
        className="bg-[#15313A] border border-[rgba(160,220,216,0.16)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center shadow-lg"
      >
        <div className="w-14 h-14 rounded-full bg-[#10232D] border border-[rgba(160,220,216,0.2)] flex items-center justify-center text-[#2BB7A9] mb-4">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-sm font-semibold text-[#EAF7F5]">
          Evaluating IMNCI protocol rules...
        </h3>
        <p className="text-xs text-[#A8C3C5] max-w-sm mt-1">
          Running deterministic IMNCI safety rules on verified clinical parameters.
        </p>
      </div>
    );
  }

  // 2. Empty State
  if (!result) {
    return (
      <div 
        data-testid="referral-card"
        className="bg-[#15313A] border border-dashed border-[rgba(160,220,216,0.2)] rounded-xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center"
      >
        <div className="w-12 h-12 rounded-full bg-[#10232D] border border-[rgba(160,220,216,0.16)] flex items-center justify-center text-[#78979B] mb-3">
          <HeartPulse className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-[#EAF7F5]">
          Waiting for Clinical Facts
        </h3>
        <p className="text-xs text-[#A8C3C5] max-w-sm mt-1">
          Complete Step 1 (Assess) and confirm facts in Step 2 (Review) to evaluate the deterministic IMNCI protocol.
        </p>
      </div>
    );
  }

  // Determine triage category
  const isBlocked = 
    result.status === "insufficient_information" || 
    result.status === "NEEDS_CONFIRMATION" ||
    result.triage_color === "AMBER";

  const isUrgent = result.triage_color === "PINK";
  const isTreatment = result.triage_color === "YELLOW";
  const isHomecare = result.triage_color === "GREEN";

  const missingList = result.missing_fields || [];
  const missingCount = missingList.length || result.missing_parameters?.length || 0;

  return (
    <div 
      data-testid="referral-card" 
      className="flex flex-col gap-4 bg-[#15313A] border border-[rgba(160,220,216,0.16)] rounded-xl p-4 sm:p-5 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[rgba(160,220,216,0.1)] pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            isBlocked ? "bg-[#F2B84B]" : isUrgent ? "bg-[#E75D5D]" : isTreatment ? "bg-[#F2B84B]" : "bg-[#49C589]"
          }`} />
          <h2 className="text-sm font-bold text-[#EAF7F5] uppercase tracking-wider">
            3. Protocol Classification & Referral Handoff
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-[#10232D] text-[#73DED0] border-[rgba(160,220,216,0.2)]">
            {result.matchedRule || result.rule_id ? `ID: ${result.matchedRule || result.rule_id}` : "PROTOCOL EVAL"}
          </span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-[11px] text-[#A8C3C5] hover:text-[#E75D5D] bg-[#10232D] hover:bg-[#0B1720] px-2 py-1 rounded border border-[rgba(160,220,216,0.1)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Start Over</span>
            </button>
          )}
        </div>
      </div>

      {/* Deterministic Logic Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#10232D] border border-[rgba(160,220,216,0.16)] rounded-lg text-[11px] text-[#A8C3C5]">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2BB7A9]" />
          <span>Deterministic TypeScript Logic Engine</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#73DED0] font-semibold bg-[#15313A] px-2 py-0.5 rounded border border-[rgba(160,220,216,0.2)]">
          <span>Zero LLM in Triage Classification</span>
        </div>
      </div>

      {/* STATE: CANNOT CLASSIFY SAFELY YET / AMBER ALERT */}
      {isBlocked && (
        <div className="bg-[#10232D] border-2 border-[#F2B84B] rounded-xl p-4 sm:p-5 text-[#EAF7F5] flex flex-col gap-3.5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(242,184,75,0.2)] border border-[#F2B84B] text-[#F2B84B] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-[#F2B84B]/20 text-[#F2B84B] px-2 py-0.5 rounded border border-[#F2B84B]/40 mb-1">
                CANNOT CLASSIFY SAFELY YET (AMBER)
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#EAF7F5] leading-tight">
                {result.classification_name || "Protocol evaluation blocked due to incomplete examination parameters."}
              </h3>
              <p className="text-xs text-[#A8C3C5] mt-1 leading-relaxed">
                Why this classification: {result.rule_description || "Missing critical clinical fields required by the Government of India IMNCI decision tree."}
              </p>
            </div>
          </div>

          {/* Missing Required Count Badge */}
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F2B84B] bg-[#15313A] border border-[rgba(242,184,75,0.3)] px-3 py-1 rounded-md w-fit">
            <Clock className="w-3.5 h-3.5 text-[#F2B84B]" />
            <span>MISSING {missingCount || 1} REQUIRED FACT{missingCount === 1 ? "" : "S"}</span>
          </div>

          {/* What to do next */}
          {result.treatment_instruction && (
            <div className="bg-[#15313A] border border-[rgba(242,184,75,0.3)] rounded-lg p-3 text-xs text-[#EAF7F5]">
              <div className="font-bold text-[#F2B84B] mb-1">What to do next:</div>
              <p className="text-[#A8C3C5]">{result.treatment_instruction}</p>
            </div>
          )}
        </div>
      )}

      {/* STATE: URGENT REFERRAL TRIGGER VERIFIED (PINK) */}
      {isUrgent && (
        <div className="bg-[#10232D] border-2 border-[#E75D5D] rounded-xl p-4 sm:p-5 text-[#EAF7F5] flex flex-col gap-3.5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E75D5D] text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#E75D5D]/20 text-[#E75D5D] px-2 py-0.5 rounded border border-[#E75D5D]/40">
                  URGENT REFERRAL (PINK)
                </span>
                <span className="text-[10px] font-bold text-[#A8C3C5]">
                  DETERMINISTIC RULE FIRED
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#EAF7F5] leading-tight">
                {result.classification_name}
              </h3>
              <p className="text-xs text-[#E75D5D] font-semibold mt-1">
                Why this classification: {result.rule_description || "Critical IMNCI urgent referral trigger identified (General Danger Sign or severe chest indrawing/stridor)."}
              </p>
            </div>
          </div>

          {/* What to do next: Immediate pre-referral treatment steps */}
          {result.treatment_instruction && (
            <div className="bg-[#15313A] border border-[rgba(231,93,93,0.3)] rounded-lg p-3 text-xs">
              <div className="font-bold text-[#E75D5D] mb-1">What to do next (Protocol Action Mandate):</div>
              <p className="text-[#EAF7F5] leading-relaxed font-semibold">
                {result.treatment_instruction}
              </p>
            </div>
          )}

          {/* Mandatory Pre-Referral Stabilization Checklist */}
          <div className="bg-[#15313A] border border-[rgba(231,93,93,0.2)] rounded-lg p-3 text-xs">
            <div className="font-bold text-[#E75D5D] mb-2 flex items-center justify-between">
              <span>Mandatory Pre-Referral Stabilization Steps:</span>
              <span className="text-[10px] text-[#A8C3C5] font-normal">Mark when administered</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preReferralChecklist.antibiotic}
                  onChange={() => toggleChecklistItem("antibiotic")}
                  className="mt-0.5 rounded border-[#E75D5D]/40 text-[#E75D5D] focus:ring-[#E75D5D] bg-[#0B1720]"
                />
                <span className="text-xs text-[#A8C3C5] leading-tight">
                  <strong className="text-[#EAF7F5]">Administer first dose of recommended antibiotic</strong> (Amoxicillin or per facility orders)
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preReferralChecklist.warmth}
                  onChange={() => toggleChecklistItem("warmth")}
                  className="mt-0.5 rounded border-[#E75D5D]/40 text-[#E75D5D] focus:ring-[#E75D5D] bg-[#0B1720]"
                />
                <span className="text-xs text-[#A8C3C5] leading-tight">
                  <strong className="text-[#EAF7F5]">Prevent hypothermia</strong> — Keep child warm with dry blanket / kangaroo care during transit
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preReferralChecklist.breastfeeding}
                  onChange={() => toggleChecklistItem("breastfeeding")}
                  className="mt-0.5 rounded border-[#E75D5D]/40 text-[#E75D5D] focus:ring-[#E75D5D] bg-[#0B1720]"
                />
                <span className="text-xs text-[#A8C3C5] leading-tight">
                  <strong className="text-[#EAF7F5]">Continue frequent breastfeeding</strong> or sips of fluids if child can suckle and swallow
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preReferralChecklist.transport}
                  onChange={() => toggleChecklistItem("transport")}
                  className="mt-0.5 rounded border-[#E75D5D]/40 text-[#E75D5D] focus:ring-[#E75D5D] bg-[#0B1720]"
                />
                <span className="text-xs text-[#A8C3C5] leading-tight">
                  <strong className="text-[#EAF7F5]">Arrange urgent transport</strong> to designated First Referral Unit (FRU) / Sub-District Hospital
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STATE: OUTPATIENT CARE (YELLOW) */}
      {isTreatment && (
        <div className="bg-[#10232D] border-2 border-[#F2B84B] rounded-xl p-4 sm:p-5 text-[#EAF7F5] flex flex-col gap-3.5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F2B84B] text-[#0B1720] flex items-center justify-center shrink-0 shadow-md">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#F2B84B]/20 text-[#F2B84B] px-2 py-0.5 rounded border border-[#F2B84B]/40">
                  OUTPATIENT CARE (YELLOW)
                </span>
                <span className="text-[10px] font-bold text-[#A8C3C5]">
                  DETERMINISTIC RULE FIRED
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#EAF7F5] leading-tight">
                {result.classification_name}
              </h3>
              <p className="text-xs text-[#F2B84B] mt-1 font-medium">
                Why this classification: {result.rule_description || "Fast breathing detected without danger signs, requiring oral outpatient antibiotic therapy."}
              </p>
            </div>
          </div>

          {result.treatment_instruction && (
            <div className="bg-[#15313A] border border-[rgba(242,184,75,0.3)] rounded-lg p-3 text-xs">
              <div className="font-bold text-[#F2B84B] mb-1">What to do next:</div>
              <p className="text-[#EAF7F5] font-medium">{result.treatment_instruction}</p>
            </div>
          )}

          <div className="bg-[#15313A] border border-[rgba(242,184,75,0.2)] rounded-lg p-3 text-xs space-y-2">
            <div className="font-bold text-[#F2B84B]">Recommended Outpatient Actions:</div>
            <ul className="list-disc list-inside space-y-1 text-[#A8C3C5]">
              <li>Give appropriate oral antibiotic for 5 days as per national dosage chart.</li>
              <li>Soothe the throat and relieve cough with warm fluids (safe home remedies).</li>
              <li>Advise mother when to return immediately if child develops any danger sign.</li>
              <li>Schedule mandatory follow-up in <strong className="text-[#EAF7F5]">2 days (48 hours)</strong> to re-evaluate.</li>
            </ul>
          </div>
        </div>
      )}

      {/* STATE: HOME CARE (GREEN) */}
      {isHomecare && (
        <div className="bg-[#10232D] border-2 border-[#49C589] rounded-xl p-4 sm:p-5 text-[#EAF7F5] flex flex-col gap-3.5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#49C589] text-[#0B1720] flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#49C589]/20 text-[#49C589] px-2 py-0.5 rounded border border-[#49C589]/40">
                  HOME CARE (GREEN)
                </span>
                <span className="text-[10px] font-bold text-[#A8C3C5]">
                  DETERMINISTIC RULE FIRED
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#EAF7F5] leading-tight">
                {result.classification_name}
              </h3>
              <p className="text-xs text-[#49C589] mt-1 font-medium">
                Why this classification: {result.rule_description || "No urgent danger sign or fast breathing present; routine viral cough/cold care indicated."}
              </p>
            </div>
          </div>

          {result.treatment_instruction && (
            <div className="bg-[#15313A] border border-[rgba(73,197,137,0.3)] rounded-lg p-3 text-xs">
              <div className="font-bold text-[#49C589] mb-1">What to do next:</div>
              <p className="text-[#EAF7F5] font-medium">{result.treatment_instruction}</p>
            </div>
          )}

          <div className="bg-[#15313A] border border-[rgba(73,197,137,0.2)] rounded-lg p-3 text-xs space-y-2">
            <div className="font-bold text-[#49C589]">Home Care Instructions:</div>
            <ul className="list-disc list-inside space-y-1 text-[#A8C3C5]">
              <li>No antibiotics needed for simple viral cold or cough.</li>
              <li>Continue frequent breastfeeding and feeding during illness.</li>
              <li>Keep child comfortable and clear nasal blockages with saline drops if needed.</li>
              <li>Advise caregiver to return immediately if breathing becomes fast or difficult.</li>
            </ul>
          </div>
        </div>
      )}

      {/* HUMAN CONFIRMATION GATE */}
      <div className={`p-4 rounded-xl border transition-all ${
        confirmedState 
          ? "bg-[#10232D] border-[#2BB7A9] text-[#EAF7F5]" 
          : "bg-[#0B1720] border-[rgba(160,220,216,0.2)] text-[#A8C3C5]"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              confirmedState ? "bg-[#2BB7A9] text-[#0B1720]" : "bg-[#15313A] text-[#78979B]"
            }`}>
              {confirmedState ? <CheckSquare className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#EAF7F5]">
                  Human-in-the-Loop Confirmation Gate
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  confirmedState ? "bg-[#2BB7A9]/20 text-[#73DED0] border border-[#2BB7A9]/30" : "bg-[#F2B84B]/20 text-[#F2B84B] border border-[#F2B84B]/30"
                }`}>
                  {confirmedState ? "VERIFIED & CONFIRMED" : "CONFIRMATION MANDATORY"}
                </span>
              </div>
              <p className="text-[11px] text-[#A8C3C5] mt-0.5">
                {confirmedState 
                  ? "Health worker verified facts and authorized protocol referral handoff." 
                  : "Frontline health worker must review and confirm extracted facts before handoff can be generated."}
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#15313A] border border-[rgba(160,220,216,0.25)] hover:border-[#2BB7A9] cursor-pointer shadow-md select-none transition-colors">
            <input
              type="checkbox"
              checked={confirmedState}
              onChange={handleConfirmToggle}
              className="w-4 h-4 rounded border-[rgba(160,220,216,0.3)] text-[#2BB7A9] focus:ring-[#2BB7A9] bg-[#0B1720]"
            />
            <span className="text-xs font-bold text-[#EAF7F5]">
              Confirm Decision
            </span>
          </label>
        </div>
      </div>

      {/* REFERRAL HANDOFF ACTIONS — GATED BY HUMAN CONFIRMATION */}
      <div className="flex flex-col gap-2 pt-1">
        {!confirmedState && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0B1720] border border-[rgba(160,220,216,0.16)] text-[#A8C3C5] text-xs">
            <Lock className="w-4 h-4 text-[#F2B84B] shrink-0" />
            <span className="leading-tight">
              <strong>Referral Handoff Gated:</strong> Frontline health worker must review and confirm extracted facts before handoff can be generated.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopySBAR}
            disabled={!confirmedState}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
              confirmedState
                ? "bg-[#10232D] border border-[rgba(160,220,216,0.3)] text-[#73DED0] hover:bg-[#15313A] cursor-pointer active:scale-95"
                : "bg-[#10232D]/50 border border-[rgba(160,220,216,0.08)] text-[#78979B] cursor-not-allowed opacity-50"
            }`}
            title={confirmedState ? "Copy official SBAR handoff note" : "Requires confirmation above"}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#49C589]" /> : <Copy className="w-3.5 h-3.5 text-[#2BB7A9]" />}
            <span>{copied ? "Copied SBAR to Clipboard" : "Copy SBAR Handoff Note"}</span>
          </button>

          {onOpenHandoffModal && (
            <button
              type="button"
              onClick={onOpenHandoffModal}
              disabled={!confirmedState}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                confirmedState
                  ? "bg-[#2BB7A9] hover:bg-[#73DED0] text-[#0B1720] cursor-pointer active:scale-95"
                  : "bg-[#10232D]/50 text-[#78979B] cursor-not-allowed opacity-50 border border-[rgba(160,220,216,0.08)]"
              }`}
              title={confirmedState ? "View & Print official referral handoff slip" : "Requires confirmation above"}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export / Print Referral Slip</span>
            </button>
          )}
        </div>
      </div>

      {/* Safety & Protocol Disclaimers */}
      <div className="bg-[#10232D] border border-[rgba(160,220,216,0.12)] rounded-lg p-3 text-[11px] text-[#A8C3C5] flex flex-col gap-1">
        <div className="flex items-center gap-1.5 font-bold text-[#EAF7F5]">
          <Info className="w-3.5 h-3.5 text-[#2BB7A9]" />
          <span>Clinical Decision-Support Safeguards & Limited Scope</span>
        </div>
        <p className="text-[#78979B]">
          &bull; <strong>IMNCI Rule Subset:</strong> Evaluates Government of India IMNCI module for <em>Acute Respiratory Infection & General Danger Signs (Children 2–59 months)</em>. Other modules (Diarrhea, Fever/Malaria, Ear, Malnutrition, and 0–2 Month Infants) are not covered in this prototype.
        </p>
        <p className="text-[#78979B]">
          &bull; <strong>Human Gate Mandatory:</strong> Requires clinical verification by a frontline health worker. This prototype is never an AI doctor, autonomous triage, or diagnostic system.
        </p>
      </div>
    </div>
  );
}

