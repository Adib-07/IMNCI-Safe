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

  const handleCopy = () => {
    const age = assessment?.age_months || assessment?.facts?.patient_age_months;
    const text = `IMNCI REFERRAL HANDOFF
Status: ${isConfirmed ? "VERIFIED" : "DRAFT"}
Age: ${age ? `${age} months` : "Unknown"}
Triage: ${result.triage_color} — ${result.classification_name}
Rule: ${result.rule_id || result.matchedRule}
RR: ${assessment?.respiratory_rate ? `${assessment.respiratory_rate} bpm` : "Not counted"}
Chest Indrawing: ${assessment?.chest_indrawing === true ? "Present" : "Absent"}
Stridor: ${assessment?.stridor === true ? "Present" : "Absent"}
Convulsions: ${assessment?.danger_signs?.has_convulsions ? "Yes" : "No"}
Unable to drink: ${assessment?.danger_signs?.unable_to_drink_or_breastfeed ? "Yes" : "No"}
Vomits everything: ${assessment?.danger_signs?.vomits_everything ? "Yes" : "No"}
Lethargic: ${assessment?.danger_signs?.lethargic_or_unconscious ? "Yes" : "No"}
Action: ${result.treatment_instruction}
Generated: ${new Date().toLocaleString()}
*Clinical decision-support prototype. Requires human verification.*`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg)]/80 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-brand)]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text)]">Referral Handoff</h3>
              <span className="text-[10px] text-[var(--color-text-muted)]">FRU Transfer Document</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        {!isConfirmed ? (
          <div className="px-5 py-2.5 bg-[var(--color-yellow-bg)] border-b border-[var(--color-yellow-border)] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[var(--color-yellow)]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Unconfirmed draft</span>
            </div>
            {onConfirm && (
              <button onClick={() => onConfirm(true)} className="px-2.5 py-1 rounded bg-[var(--color-yellow)] text-[var(--color-text-inverse)] font-bold text-[11px]">
                Confirm
              </button>
            )}
          </div>
        ) : (
          <div className="px-5 py-2 bg-[var(--color-green-bg)] border-b border-[var(--color-green-border)] flex items-center gap-2 text-xs text-[var(--color-green)] font-bold">
            <CheckSquare className="w-4 h-4" />
            <span>Verified — Authorized for handoff</span>
          </div>
        )}

        {/* Printable Content */}
        <div className="p-5 overflow-y-auto bg-[var(--color-bg)]">
          <div className="border-2 border-slate-700 rounded-lg p-5 bg-white text-slate-900 font-sans shadow-md">
            <div className={`p-2 mb-3 rounded border text-center text-[11px] font-bold uppercase tracking-wider ${
              isConfirmed
                ? "bg-emerald-50 text-emerald-900 border-emerald-400"
                : "bg-amber-100 text-amber-950 border-amber-400"
            }`}>
              {isConfirmed ? "VERIFIED REFERRAL" : "UNCONFIRMED DRAFT"}
            </div>

            <div className="border-b-2 border-slate-800 pb-3 mb-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                IMNCI Referral Handoff Slip
              </div>
              <div className="text-[9px] text-slate-400 mt-1">
                {new Date().toLocaleString()} — Child 2–59 months
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Age</span>
                <span className="font-bold">{assessment?.age_months ? `${assessment.age_months} months` : "Not recorded"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Triage</span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold border ${
                  result.triage_color === "PINK" ? "bg-rose-100 text-rose-900 border-rose-300" :
                  result.triage_color === "YELLOW" ? "bg-amber-100 text-amber-900 border-amber-300" :
                  result.triage_color === "AMBER" ? "bg-amber-100 text-amber-900 border-amber-300" :
                  "bg-emerald-100 text-emerald-900 border-emerald-300"
                }`}>
                  {result.triage_color}: {result.classification_name}
                </span>
              </div>
            </div>

            <div className="mb-4 bg-rose-50/80 border border-rose-200 rounded p-3 text-xs">
              <span className="text-rose-950 block text-[10px] uppercase font-extrabold">Classification</span>
              <div className="font-bold text-rose-900 text-sm mt-0.5">{result.classification_name}</div>
              <p className="text-slate-700 mt-1 text-[11px]">{result.rule_description}</p>
            </div>

            <div className="mb-4 text-xs">
              <div className="font-bold text-slate-800 mb-1.5 uppercase text-[10px]">Assessment Parameters</div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px]">
                <div><span className="text-slate-500">RR:</span> <strong>{assessment?.respiratory_rate ? `${assessment.respiratory_rate} bpm` : "Missing"}</strong></div>
                <div><span className="text-slate-500">Chest Indrawing:</span> <strong>{assessment?.chest_indrawing ? "Present" : "Absent"}</strong></div>
                <div><span className="text-slate-500">Stridor:</span> <strong>{assessment?.stridor ? "Present" : "Absent"}</strong></div>
                <div><span className="text-slate-500">Danger Signs:</span> <strong>{result.danger_sign_present ? "Present" : "None"}</strong></div>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Referred to: FRU</span>
              <span>Worker: __________________</span>
            </div>
            <div className="mt-2 text-[9px] text-center text-slate-400 italic">
              IMNCI-Safe Prototype — Requires human verification
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] transition-colors">
            Close
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} disabled={!isConfirmed} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
              isConfirmed ? "bg-[var(--color-card)] border border-[var(--color-border-strong)] text-[var(--color-text)]" : "opacity-50 cursor-not-allowed text-[var(--color-text-muted)]"
            }`}>
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-green)]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button onClick={handlePrint} disabled={!isConfirmed} className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold ${
              isConfirmed ? "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white" : "opacity-50 cursor-not-allowed text-[var(--color-text-muted)]"
            }`}>
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
