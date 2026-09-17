"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Building2,
  Clock,
} from "lucide-react";
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
  const [copied, setCopied] = useState(false);
  const [caseId] = useState(() => `IMNCI-${Math.floor(100000 + Math.random() * 900000)}`);
  const [generatedDate] = useState(() => new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }));

  if (!isOpen || !result) return null;

  const ageMonths = assessment?.age_months ?? assessment?.facts?.patient_age_months;
  const rr = assessment?.respiratory_rate ?? assessment?.facts?.respiratory_rate;
  const indrawing = assessment?.chest_indrawing ?? assessment?.facts?.chest_indrawing;
  const stridor = assessment?.stridor ?? assessment?.facts?.stridor_in_calm_child;
  const convulsions = assessment?.danger_signs?.has_convulsions ?? assessment?.facts?.danger_signs?.has_convulsions;
  const unableToDrink = assessment?.danger_signs?.unable_to_drink_or_breastfeed ?? assessment?.facts?.danger_signs?.unable_to_drink_or_breastfeed;
  const vomits = assessment?.danger_signs?.vomits_everything ?? assessment?.facts?.danger_signs?.vomits_everything;
  const lethargy = assessment?.danger_signs?.lethargic_or_unconscious ?? assessment?.facts?.danger_signs?.lethargic_or_unconscious;

  const handlePrint = () => {
    window.print();
  };

  const sbarSituation = `${typeof ageMonths === "number" ? `${ageMonths}-month-old child` : "Pediatric patient (2–59m)"} evaluated under IMNCI protocol for acute respiratory infection. Protocol Classification: ${result.classification_name} (${result.triage_color}).`;
  const sbarBackground = `Caregiver notes: "${assessment?.rawInput || "Clinical observations provided at triage"}". Evaluated using deterministic IMNCI guidelines with health worker verification.`;
  const sbarAssessment = `Triage status: ${result.triage_color}. RR: ${typeof rr === "number" ? `${rr} bpm` : "Unknown"}. Chest Indrawing: ${indrawing === true ? "Present" : indrawing === false ? "Absent" : "Unknown"}. Stridor: ${stridor === true ? "Present" : stridor === false ? "Absent" : "Unknown"}. Danger Signs: Convulsions=${convulsions === true ? "YES" : "NO"}, Unable to drink=${unableToDrink === true ? "YES" : "NO"}, Vomits all=${vomits === true ? "YES" : "NO"}, Lethargy=${lethargy === true ? "YES" : "NO"}.`;
  const sbarRecommendation = `${result.treatment_instruction} Handover to receiving facility for immediate clinical review and continuation of stabilized therapy.`;

  const handleCopy = () => {
    const text = `=====================================================
IMNCI CLINICAL REFERRAL & HANDOFF SLIP
Case ID: ${caseId} | Status: ${isConfirmed ? "VERIFIED" : "UNCONFIRMED DRAFT"}
Timestamp: ${generatedDate}
=====================================================

PATIENT INFORMATION:
- Age: ${typeof ageMonths === "number" ? `${ageMonths} months (${ageMonths < 12 ? "2–11 months" : "12–59 months"})` : "Unknown"}
- Destination: First Referral Unit (FRU) / Pediatric Ward

CHIEF OBSERVATIONS:
"${assessment?.rawInput || "None recorded"}"

VERIFIED FINDINGS:
- Respiratory Rate: ${typeof rr === "number" ? `${rr} breaths/min` : "Not counted (Unknown)"}
- Lower Chest Wall Indrawing: ${indrawing === true ? "Present (Severe)" : indrawing === false ? "Absent" : "Unknown"}
- Stridor in Calm Child: ${stridor === true ? "Present (Emergency)" : stridor === false ? "Absent" : "Unknown"}
- History of Convulsions: ${convulsions === true ? "PRESENT (Danger Sign)" : convulsions === false ? "Absent" : "Unknown"}
- Inability to Drink/Breastfeed: ${unableToDrink === true ? "PRESENT (Danger Sign)" : unableToDrink === false ? "Absent" : "Unknown"}
- Vomits Everything: ${vomits === true ? "PRESENT (Danger Sign)" : vomits === false ? "Absent" : "Unknown"}
- Lethargic or Unconscious: ${lethargy === true ? "PRESENT (Danger Sign)" : lethargy === false ? "Absent" : "Unknown"}

PROTOCOL CLASSIFICATION:
- Classification: ${result.classification_name}
- Triage Category: ${result.triage_color}
- Matched Rule: ${result.rule_id || result.matchedRule || "EVAL-IMNCI"}
- Rationale: ${result.rule_description || result.reason}
- Protocol Instruction: ${result.treatment_instruction}

SBAR CLINICAL SUMMARY:
S: ${sbarSituation}
B: ${sbarBackground}
A: ${sbarAssessment}
R: ${sbarRecommendation}

VERIFICATION:
- Status: ${isConfirmed ? "Human Verification Completed & Authorized" : "Unverified Preliminary Draft"}
- Engine: IMNCI Deterministic Rules Engine (Zero LLM Classification)
=====================================================`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-modal-title"
    >
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto print-document-container">
        {/* Modal App Chrome Header (Hidden when printing) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand)]/15 border border-[var(--color-brand)]/30 flex items-center justify-center text-[var(--color-brand-light)]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 id="referral-modal-title" className="text-sm font-bold text-[var(--color-text)]">
                Clinical Referral &amp; Handoff Report
              </h3>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Official First Referral Unit (FRU) Transfer Document &bull; Case {caseId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-green)]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied SBAR" : "Copy SBAR"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close referral slip modal"
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verification Status Warning (Hidden in print) */}
        {!isConfirmed && (
          <div className="no-print px-5 py-2.5 bg-[var(--color-yellow-bg)] border-b border-[var(--color-yellow-border)] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[var(--color-yellow)]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Unconfirmed Draft:</strong> The health worker has not marked this case as verified yet.
              </span>
            </div>
            {onConfirm && (
              <button
                type="button"
                onClick={() => onConfirm(true)}
                className="px-3 py-1 rounded bg-[var(--color-yellow)] text-black font-bold text-xs hover:opacity-90 shrink-0"
              >
                Mark Verified
              </button>
            )}
          </div>
        )}

        {/* ── PRINTABLE CLINICAL REFERRAL REPORT ── */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-[var(--color-bg)]">
          <div className="print-slip-paper bg-white text-slate-900 font-sans rounded-xl p-6 sm:p-8 border border-slate-300 shadow-lg text-[13px] leading-normal">
            {/* Clinical Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold tracking-wider uppercase text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-800 shrink-0" />
                    <span>Integrated Management of Neonatal &amp; Childhood Illness (IMNCI)</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                    CLINICAL REFERRAL &amp; HANDOFF SLIP
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Primary Health Centre / Sub-Centre &rarr; First Referral Unit (FRU) Transfer
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-slate-300 sm:pl-4">
                  <div className="text-xs font-mono font-bold text-slate-900">
                    CASE ID: {caseId}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{generatedDate}</span>
                  </div>
                  <div className={`mt-1.5 inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                    isConfirmed
                      ? "bg-emerald-100 text-emerald-950 border-emerald-500"
                      : "bg-amber-100 text-amber-950 border-amber-500"
                  }`}>
                    {isConfirmed ? "VERIFIED CLINICAL REFERRAL" : "UNCONFIRMED DRAFT"}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Patient & Case Demographics */}
            <div className="mb-5 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
                1. Patient &amp; Encounter Identifiers
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Patient Age</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {typeof ageMonths === "number" ? `${ageMonths} months` : "Not recorded"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {typeof ageMonths === "number" && ageMonths < 12 ? "Cohort: 2–11m" : "Cohort: 12–59m"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Clinical Modality</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {assessment?.modality || "Text notes"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Destination Facility</span>
                  <span className="font-bold text-slate-900">
                    FRU / Pediatric Emergency
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Protocol Scope</span>
                  <span className="font-bold text-slate-900">
                    ARI &amp; General Danger Signs
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Chief Complaint & Caregiver Observation */}
            <div className="mb-5">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                2. Recorded Observations &amp; Caregiver Complaint
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                &ldquo;{assessment?.rawInput || "No verbatim notes available."}&rdquo;
              </div>
            </div>

            {/* Section 3: Verified Clinical Examination Findings */}
            <div className="mb-5">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                3. Verified Clinical Examination Parameters
              </div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-3 text-left border-r border-slate-300">Clinical Parameter</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Finding / Value</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">IMNCI Diagnostic Significance</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 px-3 font-semibold border-r border-slate-300">Measured Respiratory Rate</td>
                    <td className="py-2 px-3 font-mono font-bold border-r border-slate-300">
                      {typeof rr === "number" ? `${rr} breaths/min` : "Not counted (Unknown)"}
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-300">
                      Cutoff: ≥{typeof ageMonths === "number" && ageMonths < 12 ? "50" : "40"} bpm for pneumonia.
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        typeof rr === "number" ? "bg-slate-100 text-slate-800" : "bg-amber-100 text-amber-900"
                      }`}>
                        {typeof rr === "number" ? "Recorded" : "Unknown"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold border-r border-slate-300">Lower Chest Wall Indrawing</td>
                    <td className="py-2 px-3 font-bold border-r border-slate-300">
                      {indrawing === true ? "PRESENT ⚠" : indrawing === false ? "Absent" : "Unknown"}
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-300">
                      Physical sign of severe respiratory distress / severe pneumonia.
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        indrawing === true ? "bg-rose-100 text-rose-900" : indrawing === false ? "bg-slate-100 text-slate-800" : "bg-amber-100 text-amber-900"
                      }`}>
                        {indrawing === true ? "Severe Sign" : indrawing === false ? "Normal" : "Unknown"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold border-r border-slate-300">Stridor in Calm Child</td>
                    <td className="py-2 px-3 font-bold border-r border-slate-300">
                      {stridor === true ? "PRESENT ⚠" : stridor === false ? "Absent" : "Unknown"}
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-300">
                      Upper airway obstruction / croup emergency.
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        stridor === true ? "bg-rose-100 text-rose-900" : stridor === false ? "bg-slate-100 text-slate-800" : "bg-amber-100 text-amber-900"
                      }`}>
                        {stridor === true ? "Severe Sign" : stridor === false ? "Normal" : "Unknown"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold border-r border-slate-300">General Danger Signs Check</td>
                    <td className="py-2 px-3 font-bold border-r border-slate-300">
                      {convulsions === true || unableToDrink === true || vomits === true || lethargy === true
                        ? "PRESENT ⚠"
                        : convulsions === false && unableToDrink === false && vomits === false && lethargy === false
                        ? "All Ruled Out"
                        : "Incomplete / Unknown"}
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-300">
                      Convulsions: {convulsions === true ? "YES" : "No"} | Drink: {unableToDrink === true ? "CANNOT" : "Normal"} | Vomits: {vomits === true ? "YES" : "No"} | Alert: {lethargy === true ? "LETHARGIC" : "Alert"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        convulsions === true || unableToDrink === true || vomits === true || lethargy === true
                          ? "bg-rose-100 text-rose-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}>
                        {convulsions === true || unableToDrink === true || vomits === true || lethargy === true ? "Danger Sign" : "Cleared"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: Deterministic IMNCI Protocol Classification */}
            <div className="mb-5">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                4. Deterministic IMNCI Classification &amp; Referral Decision
              </div>
              <div className={`p-4 rounded-lg border-2 ${
                result.triage_color === "PINK"
                  ? "bg-rose-50 border-rose-500 text-rose-950"
                  : result.triage_color === "YELLOW"
                  ? "bg-amber-50 border-amber-500 text-amber-950"
                  : result.triage_color === "AMBER"
                  ? "bg-amber-50 border-amber-500 text-amber-950"
                  : "bg-emerald-50 border-emerald-500 text-emerald-950"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-2 mb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block">
                      IMNCI Classification (Triage Category: {result.triage_color})
                    </span>
                    <h2 className="text-lg font-black tracking-tight">
                      {result.classification_name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono bg-white/80 px-2 py-1 rounded border border-black/10 font-bold">
                      Rule: {result.rule_id || result.matchedRule || "IMNCI-EVAL"}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  <strong>Clinical Rationale:</strong> {result.rule_description || result.reason}
                </p>
                <div className="mt-2 text-xs font-bold bg-white/70 p-2.5 rounded border border-black/10">
                  <span>Required Clinical Action: </span>
                  <span className="font-semibold">{result.treatment_instruction}</span>
                </div>
              </div>
            </div>

            {/* Section 5: Pre-Referral Stabilization Plan */}
            <div className="mb-5">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
                5. Pre-Referral Stabilization Checklist (Before Hospital Transport)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded p-2.5">
                  <div className="w-4 h-4 rounded border-2 border-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">First Dose Appropriate Antibiotic</span>
                    <span className="text-[11px] text-slate-600">Administered prior to transfer for severe pneumonia / danger signs.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded p-2.5">
                  <div className="w-4 h-4 rounded border-2 border-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Hypothermia Prevention</span>
                    <span className="text-[11px] text-slate-600">Keep child warm with blanket/skin-to-skin contact during transit.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded p-2.5">
                  <div className="w-4 h-4 rounded border-2 border-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Frequent Sips / Breastfeeding</span>
                    <span className="text-[11px] text-slate-600">Prevent hypoglycemia during journey if child is able to swallow safely.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded p-2.5">
                  <div className="w-4 h-4 rounded border-2 border-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Rapid Transport Arrangement</span>
                    <span className="text-[11px] text-slate-600">Ambulance / prioritized local vehicle mobilized to FRU.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: SBAR Structured Handoff Notes for Receiving Clinician */}
            <div className="mb-5 bg-slate-50 border border-slate-300 rounded-lg p-3.5">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2">
                6. SBAR Clinical Handoff Summary (For Receiving Medical Officer)
              </div>
              <div className="space-y-1.5 text-xs text-slate-800">
                <div>
                  <strong className="text-slate-950 font-mono">S (Situation): </strong>
                  <span>{sbarSituation}</span>
                </div>
                <div>
                  <strong className="text-slate-950 font-mono">B (Background): </strong>
                  <span>{sbarBackground}</span>
                </div>
                <div>
                  <strong className="text-slate-950 font-mono">A (Assessment): </strong>
                  <span>{sbarAssessment}</span>
                </div>
                <div>
                  <strong className="text-slate-950 font-mono">R (Recommendation): </strong>
                  <span>{sbarRecommendation}</span>
                </div>
              </div>
            </div>

            {/* Section 7: Health Worker Verification & Signatures */}
            <div className="border-t-2 border-slate-400 pt-4 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-800">
                <div className="space-y-3">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                    Referring Healthcare Worker
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>Verification Status: </span>
                    <strong className={isConfirmed ? "text-emerald-700" : "text-amber-700"}>
                      {isConfirmed ? "Confirmed & Authorized" : "Pending Confirmation"}
                    </strong>
                  </div>
                  <div className="border-b border-slate-400 pb-1 pt-4 text-slate-400">
                    Name &amp; Designation: _________________________________
                  </div>
                  <div className="border-b border-slate-400 pb-1 pt-2 text-slate-400">
                    Signature: ______________________ Date/Time: __________
                  </div>
                </div>
                <div className="space-y-3 sm:border-l sm:border-slate-300 sm:pl-6">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                    Receiving Facility Acknowledgement
                  </div>
                  <div className="border-b border-slate-400 pb-1 pt-2 text-slate-400">
                    Receiving Facility: __________________________________
                  </div>
                  <div className="border-b border-slate-400 pb-1 pt-4 text-slate-400">
                    Admitting Officer: ___________________________________
                  </div>
                  <div className="border-b border-slate-400 pb-1 pt-2 text-slate-400">
                    Signature: ______________________ Arrival Time: ________
                  </div>
                </div>
              </div>

              {/* Section 8: System Transparency Disclaimer */}
              <div className="mt-5 pt-3 border-t border-slate-200 text-[10px] text-slate-500 text-center leading-relaxed">
                <p>
                  <strong>IMNCI-Safe Decision Support Protocol Prototype (v1.0.0)</strong> &bull; Zero LLM in classification &bull; Deterministic rules engine evaluated verified clinical parameters &bull; Requires human clinical judgment &bull; Complies with WHO / National IMNCI Guidelines.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden in print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-card)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-green)]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy SBAR Text"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
