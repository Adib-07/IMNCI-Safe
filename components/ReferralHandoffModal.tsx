"use client";

import React from "react";
import { X, Printer, Copy, Check, FileText, CheckSquare, AlertTriangle } from "lucide-react";
import type { ProtocolResult, ImnciAssessment } from "@/lib/types";

interface ReferralHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ProtocolResult | null;
  assessment: ImnciAssessment | null;
  isConfirmed?: boolean;
  onConfirm?: (confirmed: boolean) => void;
}

export function ReferralHandoffModal({
  isOpen,
  onClose,
  result,
  assessment,
  isConfirmed = false,
  onConfirm,
}: ReferralHandoffModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !result) return null;

  const handlePrint = () => {
    if (!isConfirmed) return;
    window.print();
  };

  const handleCopySBAR = () => {
    const age = assessment?.age_months || assessment?.facts?.patient_age_months;
    const statusHeader = isConfirmed
      ? "AUTHORIZED CLINICAL REFERRAL HANDOFF"
      : "UNCONFIRMED DRAFT — NOT AUTHORIZED FOR HOSPITAL HANDOFF";

    const sbarText = `
IMNCI SBAR REFERRAL HANDOFF SLIP
===========================================================
STATUS: [${statusHeader}]
GOVERNMENT OF INDIA & WHO IMNCI PROTOCOL (CHILDREN 2-59 MONTHS)
-----------------------------------------------------------
Date & Time: ${new Date().toLocaleString()}
Patient Age: ${age ? `${age} Months` : "Unknown"}
Triage Priority: ${result.triage_color === "PINK" ? "PINK — URGENT HOSPITAL REFERRAL" : result.triage_color}
Primary Classification: ${result.classification_name}

[S] SITUATION:
- Urgent Referral Needed: ${result.triage_color === "PINK" ? "YES" : "NO"}
- Trigger Description: ${result.rule_description}
- Rule ID: ${result.rule_id || result.matchedRule || "IMNCI-PNEU-01"}

[B] BACKGROUND:
- Evaluation: Integrated Management of Neonatal & Childhood Illness (IMNCI)
- Protocol Scope: Acute Respiratory Infection & General Danger Signs Module
- Protocol Citation: ${result.protocol_citation || "WHO / MoHFW India Guidelines"}

[A] ASSESSMENT (VERIFIED CLINICAL FINDINGS):
- Respiratory Rate: ${assessment?.respiratory_rate ? `${assessment.respiratory_rate} bpm` : "Not recorded"}
- Chest Indrawing: ${assessment?.chest_indrawing === true ? "PRESENT" : assessment?.chest_indrawing === false ? "Absent" : "Unknown"}
- Stridor in Calm State: ${assessment?.stridor === true ? "PRESENT" : assessment?.stridor === false ? "Absent" : "Unknown"}
- Danger Signs:
  * Convulsions: ${assessment?.danger_signs?.has_convulsions ? "YES" : "No"}
  * Unable to drink/breastfeed: ${assessment?.danger_signs?.unable_to_drink_or_breastfeed ? "YES" : "No"}
  * Vomiting everything: ${assessment?.danger_signs?.vomits_everything ? "YES" : "No"}
  * Lethargic or unconscious: ${assessment?.danger_signs?.lethargic_or_unconscious ? "YES" : "No"}

[R] RECOMMENDATION & PRE-REFERRAL STABILIZATION:
- Action Mandate: ${result.treatment_instruction || "Refer child urgently to First Referral Unit (FRU)"}
- First dose antibiotic administered
- Kept warm during transport (hypothermia protection)
- Continued frequent breastfeeding/fluids if able
- Emergency transport coordinated to FRU

-----------------------------------------------------------
HEALTH WORKER AUTHORIZATION:
Worker Status: ${isConfirmed ? "VERIFIED & CONFIRMED BY FRONTLINE WORKER" : "UNCONFIRMED - REQUIRES MANUAL SIGN-OFF"}
Worker Signature: _______________________ Date: ____________
*Clinical decision-support prototype. Requires qualified human verification.*
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(sbarText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1720]/80 backdrop-blur-xs">
      <div className="bg-[#10232D] border border-[rgba(160,220,216,0.2)] rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#EAF7F5]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(160,220,216,0.16)] bg-[#0B1720]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#15313A] border border-[rgba(160,220,216,0.2)] flex items-center justify-center text-[#2BB7A9]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#EAF7F5]">
                IMNCI Referral Handoff Slip
              </h3>
              <span className="text-[10px] text-[#78979B]">
                Hospital First Referral Unit (FRU) Transfer Document
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#78979B] hover:text-[#EAF7F5] hover:bg-[#15313A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Status Warning Bar */}
        {!isConfirmed ? (
          <div className="px-5 py-2.5 bg-[#0B1720] border-b border-[#F2B84B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#F2B84B]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F2B84B] shrink-0" />
              <span className="font-semibold">Unconfirmed Draft: Frontline health worker sign-off is required before handoff.</span>
            </div>
            {onConfirm && (
              <button
                type="button"
                onClick={() => onConfirm(true)}
                className="px-2.5 py-1 rounded bg-[#F2B84B] hover:bg-[#F2B84B]/90 text-[#0B1720] font-bold text-[11px] transition-colors self-start sm:self-auto cursor-pointer"
              >
                Confirm Decision
              </button>
            )}
          </div>
        ) : (
          <div className="px-5 py-2 bg-[#15313A] border-b border-[#2BB7A9]/30 flex items-center gap-2 text-xs text-[#73DED0] font-bold">
            <CheckSquare className="w-4 h-4 text-[#2BB7A9]" />
            <span>Verified Decision: Authorized for First Referral Unit (FRU) transfer.</span>
          </div>
        )}

        {/* Printable Slip Content (High contrast white paper style for printing and legibility) */}
        <div className="p-5 overflow-y-auto print:p-0 bg-[#0B1720]">
          <div className="border-2 border-slate-700 rounded-lg p-5 bg-white text-slate-900 font-sans shadow-md">
            {/* Status Stamp */}
            <div className={`p-2 mb-3 rounded border text-center text-[11px] font-bold uppercase tracking-wider ${
              isConfirmed 
                ? "bg-emerald-50 text-emerald-900 border-emerald-400" 
                : "bg-amber-100/90 text-amber-950 border-amber-400"
            }`}>
              {isConfirmed 
                ? "✓ OFFICIAL REFERRAL HANDOFF — VERIFIED BY HEALTHCARE WORKER" 
                : "⚠️ UNCONFIRMED DRAFT — NOT AUTHORIZED FOR HOSPITAL HANDOFF"}
            </div>

            {/* Header branding on slip */}
            <div className="border-b-2 border-slate-800 pb-3 mb-4 text-center">
              <div className="text-[11px] uppercase tracking-widest text-slate-600 font-bold">
                Government of India &bull; National Health Mission
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                IMNCI URGENT REFERRAL HANDOFF SLIP
              </h2>
              <div className="text-[10px] text-slate-500 mt-1">
                Generated: {new Date().toLocaleString()} &bull; Child 2–59 Months Protocol Module
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5 italic">
                Scope Subset: Acute Respiratory Infection & General Danger Signs. Other IMNCI modules are not evaluated.
              </div>
            </div>

            {/* Core Patient Data */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Cohort</span>
                <span className="font-bold text-slate-900">
                  {assessment?.age_months ? `${assessment.age_months} Months Infant/Child` : "Age not recorded"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Triage Category</span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold border ${
                  result.triage_color === "PINK" ? "bg-rose-100 text-rose-900 border-rose-300" :
                  result.triage_color === "YELLOW" ? "bg-amber-100 text-amber-900 border-amber-300" :
                  "bg-emerald-100 text-emerald-900 border-emerald-300"
                }`}>
                  {result.triage_color}: {result.classification_name}
                </span>
              </div>
            </div>

            {/* Referral Reason */}
            <div className="mb-4 bg-rose-50/80 border border-rose-200 rounded p-3 text-xs">
              <span className="text-rose-950 block text-[10px] uppercase font-extrabold tracking-wider">
                Primary Classification & Trigger
              </span>
              <div className="font-bold text-rose-900 text-sm mt-0.5">
                {result.classification_name}
              </div>
              <p className="text-slate-700 mt-1 text-[11px] leading-relaxed">
                {result.rule_description}
              </p>
              <div className="text-[10px] text-slate-500 mt-1">
                Protocol: {result.protocol_citation} (Rule ID: {result.rule_id})
              </div>
            </div>

            {/* Findings summary table */}
            <div className="mb-4 text-xs">
              <div className="font-bold text-slate-800 mb-1.5 uppercase text-[10px]">
                Recorded Assessment Parameters
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500">Respiratory Rate:</span>{" "}
                  <strong>{assessment?.respiratory_rate ? `${assessment.respiratory_rate} bpm` : "Missing"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Chest Indrawing:</span>{" "}
                  <strong>{assessment?.chest_indrawing ? "PRESENT" : "Absent"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Stridor:</span>{" "}
                  <strong>{assessment?.stridor ? "PRESENT" : "Absent"}</strong>
                </div>
                <div>
                  <span className="text-slate-500">General Danger Signs:</span>{" "}
                  <strong className={result.danger_sign_present ? "text-rose-700" : "text-slate-700"}>
                    {result.danger_sign_present ? "Trigger Present" : "None Detected"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Pre-referral actions checklist box */}
            <div className="mb-4 border border-slate-300 rounded p-3 text-xs bg-slate-50/50">
              <div className="font-bold text-slate-900 uppercase text-[10px] mb-2">
                Mandatory Pre-Referral Stabilization Checklist
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded flex items-center justify-center text-[9px]">✓</div>
                  <span>First dose of oral or injectable antibiotic administered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded flex items-center justify-center text-[9px]">✓</div>
                  <span>Prevented hypothermia during transit (dry warm wrap)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded flex items-center justify-center text-[9px]">✓</div>
                  <span>Advised mother to continue frequent breastfeeding if able</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded flex items-center justify-center text-[9px]">✓</div>
                  <span>Transport arranged to First Referral Unit (FRU)</span>
                </div>
              </div>
            </div>

            {/* Sign-off footer */}
            <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[11px] text-slate-500">
              <div>
                <span>Referred to: First Referral Unit (FRU)</span>
              </div>
              <div>
                <span>Worker Signature: __________________</span>
              </div>
            </div>

            <div className="mt-2 text-[9px] text-center text-slate-400 italic">
              Government of India IMNCI Clinical Decision Support Prototype &bull; Requires frontline health worker confirmation
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(160,220,216,0.16)] bg-[#0B1720]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-[rgba(160,220,216,0.2)] text-xs text-[#A8C3C5] hover:text-[#EAF7F5] hover:bg-[#15313A] transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySBAR}
              disabled={!isConfirmed}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isConfirmed
                  ? "bg-[#15313A] border border-[rgba(160,220,216,0.3)] text-[#73DED0] hover:bg-[#10232D] cursor-pointer"
                  : "bg-[#15313A]/40 text-[#78979B] border border-[rgba(160,220,216,0.08)] cursor-not-allowed opacity-50"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#49C589]" /> : <Copy className="w-3.5 h-3.5 text-[#2BB7A9]" />}
              <span>{copied ? "Copied SBAR" : "Copy SBAR"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!isConfirmed}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isConfirmed
                  ? "bg-[#2BB7A9] hover:bg-[#73DED0] text-[#0B1720] cursor-pointer"
                  : "bg-[#15313A]/40 text-[#78979B] cursor-not-allowed opacity-50 border border-[rgba(160,220,216,0.08)]"
              }`}
              title={isConfirmed ? "Print official referral slip" : "Requires confirmation first"}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
