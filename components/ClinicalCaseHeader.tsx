"use client";

import React from "react";
import {
  User,
  Clock,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import type { ImnciAssessment, ProtocolResult } from "@/lib/types";

interface ClinicalCaseHeaderProps {
  caseId: string;
  assessment: ImnciAssessment | null;
  result: ProtocolResult | null;
  activeStep: 1 | 2 | 3;
  hasUserModified: boolean;
  isConfirmed: boolean;
}

export function ClinicalCaseHeader({
  caseId,
  assessment,
  result,
  activeStep,
  hasUserModified,
  isConfirmed,
}: ClinicalCaseHeaderProps) {
  const ageMonths = assessment?.age_months ?? assessment?.facts?.patient_age_months;
  const ageDisplay =
    typeof ageMonths === "number"
      ? `${ageMonths} months (${ageMonths < 12 ? "Cohort: 2–11m" : "Cohort: 12–59m"})`
      : "Pending Observation";

  // Determine clinical encounter status
  let statusText = "Awaiting Clinical Observations";
  let statusBadgeClass = "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]";
  let StatusIcon = Clock;

  if (activeStep === 1) {
    if (assessment) {
      statusText = "Observations Recorded • Ready to Verify";
      statusBadgeClass = "bg-[var(--color-brand)]/15 text-[var(--color-brand-light)] border-[var(--color-brand)]/30";
      StatusIcon = CheckCircle2;
    }
  } else if (activeStep === 2) {
    const unconfirmedCount = result?.missing_fields?.length || 0;
    if (unconfirmedCount > 0) {
      statusText = `${unconfirmedCount} Clinical Fact${unconfirmedCount > 1 ? "s" : ""} Require Human Review`;
      statusBadgeClass = "bg-[var(--color-yellow-bg)] text-[var(--color-yellow)] border-[var(--color-yellow-border)]";
      StatusIcon = AlertTriangle;
    } else {
      statusText = "Verified Facts Ready for Protocol Classification";
      statusBadgeClass = "bg-[var(--color-green-bg)] text-[var(--color-green)] border-[var(--color-green-border)]";
      StatusIcon = CheckCircle2;
    }
  } else if (activeStep === 3 && result) {
    if (result.triage_color === "PINK") {
      statusText = "Protocol Classification: Urgent Referral (Pink)";
      statusBadgeClass = "bg-[var(--color-pink-bg)] text-[var(--color-pink)] border-[var(--color-pink-border)]";
      StatusIcon = AlertTriangle;
    } else if (result.triage_color === "AMBER") {
      statusText = "Protocol Gating: Insufficient Data for Safe Classification";
      statusBadgeClass = "bg-[var(--color-yellow-bg)] text-[var(--color-yellow)] border-[var(--color-yellow-border)]";
      StatusIcon = HelpCircle;
    } else if (result.triage_color === "YELLOW") {
      statusText = "Protocol Classification: Outpatient Pneumonia (Yellow)";
      statusBadgeClass = "bg-[var(--color-yellow-bg)] text-[var(--color-yellow)] border-[var(--color-yellow-border)]";
      StatusIcon = ShieldCheck;
    } else {
      statusText = "Protocol Classification: Home Care (Green)";
      statusBadgeClass = "bg-[var(--color-green-bg)] text-[var(--color-green)] border-[var(--color-green-border)]";
      StatusIcon = CheckCircle2;
    }
  }

  return (
    <section
      aria-label="Clinical Encounter Header"
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Encounter Identification */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-brand-light)] shrink-0 mt-0.5">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Child Clinical Assessment
              </span>
              <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                {caseId}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--color-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                Synthetic Demo Case • Non-PHI
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
              <div className="text-base sm:text-lg font-bold text-[var(--color-text)]">
                Patient Age:{" "}
                <span className="font-semibold text-[var(--color-brand-light)]">
                  {ageDisplay}
                </span>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Primary Health Centre (PHC) Triage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Encounter State & Guidelines */}
        <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusBadgeClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{statusText}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] bg-[var(--color-card)] px-2.5 py-1.5 rounded-lg border border-[var(--color-border)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-green)]" />
            <span>
              {isConfirmed
                ? "Human Clinician Authorized"
                : hasUserModified
                ? "Human Edited"
                : "Human Verification Required"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
