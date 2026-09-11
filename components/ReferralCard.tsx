"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  XCircle,
  Info,
} from "lucide-react";
import type { ProtocolResult, TriageColor, ImnciAssessment } from "@/lib/types";

interface ReferralCardProps {
  result: ProtocolResult | null;
  assessment: ImnciAssessment | null;
}

const COLOR_CONFIG: Record<
  TriageColor,
  {
    bg: string;
    border: string;
    text: string;
    badge: string;
    badgeText: string;
    icon: React.ElementType;
  }
> = {
  PINK: {
    bg: "bg-triage-urgent-bg",
    border: "border-triage-urgent-border",
    text: "text-triage-urgent",
    badge: "bg-triage-urgent",
    badgeText: "text-white",
    icon: AlertTriangle,
  },
  YELLOW: {
    bg: "bg-triage-treatment-bg",
    border: "border-triage-treatment-border",
    text: "text-triage-treatment",
    badge: "bg-triage-treatment",
    badgeText: "text-white",
    icon: Activity,
  },
  GREEN: {
    bg: "bg-triage-homecare-bg",
    border: "border-triage-homecare-border",
    text: "text-triage-homecare",
    badge: "bg-triage-homecare",
    badgeText: "text-white",
    icon: CheckCircle2,
  },
  AMBER: {
    bg: "bg-triage-blocked-bg",
    border: "border-triage-blocked-border",
    text: "text-triage-blocked",
    badge: "bg-triage-blocked",
    badgeText: "text-white",
    icon: Lock,
  },
};

function buildFiredRuleText(result: ProtocolResult, assessment: ImnciAssessment | null): string {
  if (result.triage_color === "PINK") {
    const reasons: string[] = [];
    const f = assessment?.facts;
    if (f) {
      const gds = f.danger_signs;
      if (gds.unable_to_drink_or_breastfeed === true) reasons.push("unable to drink/breastfeed");
      if (gds.vomits_everything === true) reasons.push("vomits everything");
      if (gds.has_convulsions === true) reasons.push("convulsions");
      if (gds.lethargic_or_unconscious === true) reasons.push("lethargic/unconscious");
      if (f.chest_indrawing === true) reasons.push("chest indrawing");
      if (f.stridor_in_calm_child === true) reasons.push("stridor in calm child");
    }
    return reasons.length > 0
      ? `Severe: ${reasons.join(", ")}`
      : "General danger sign(s) or severe physical sign present";
  }

  if (result.triage_color === "YELLOW") {
    const f = assessment?.facts;
    if (f && typeof f.patient_age_months === "number" && typeof f.respiratory_rate === "number") {
      const threshold = f.patient_age_months < 12 ? 50 : 40;
      return `RR ${f.respiratory_rate} >= ${threshold} bpm (age ${f.patient_age_months}mo) -- Fast breathing`;
    }
    return "Fast breathing detected for age cohort";
  }

  if (result.triage_color === "GREEN") {
    const f = assessment?.facts;
    if (f && typeof f.patient_age_months === "number" && typeof f.respiratory_rate === "number") {
      const threshold = f.patient_age_months < 12 ? 50 : 40;
      return `RR ${f.respiratory_rate} < ${threshold} bpm (age ${f.patient_age_months}mo) -- No fast breathing`;
    }
    return "No fast breathing, no danger signs, no severe physical signs";
  }

  return "";
}

export function ReferralCard({ result, assessment }: ReferralCardProps) {
  const [animating, setAnimating] = useState(false);
  const prevWasBlocked = useRef(false);

  useEffect(() => {
    const wasBlocked = prevWasBlocked.current;
    const isNowClassified = result?.status === "CLASSIFIED";
    if (wasBlocked && isNowClassified) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 500);
      return () => clearTimeout(timer);
    }
    prevWasBlocked.current = result?.status === "NEEDS_CONFIRMATION";
  }, [result]);

  if (!result) {
    return (
      <section className="bg-surface-card border border-rule border-t-[3px] border-t-ink-muted flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-rule flex items-center gap-2">
          <Info className="w-4 h-4 text-ink-muted" />
          <h2 className="type-label">Protocol Classification</h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-surface-inset flex items-center justify-center mx-auto mb-2">
              <Info className="w-5 h-5 text-ink-muted" />
            </div>
            <p className="type-body-sm text-ink-secondary">
              Complete verification to reveal classification
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isBlocked = result.status === "NEEDS_CONFIRMATION";
  const isOoc = result.status === "OUT_OF_COHORT";
  const color = result.triage_color || "AMBER";
  const cfg = COLOR_CONFIG[color];
  const Icon = cfg.icon;
  const firedRule = buildFiredRuleText(result, assessment);

  const topBorderColor = isBlocked
    ? "var(--color-triage-blocked)"
    : isOoc
      ? "var(--color-ink-muted)"
      : `var(--color-triage-${color === "PINK" ? "urgent" : color === "YELLOW" ? "treatment" : "homecare"})`;

  return (
    <section className="bg-surface-card border border-rule rounded-sm flex flex-col overflow-hidden" style={{ borderTopColor: topBorderColor, borderTopWidth: "3px" }}>
      <div className="px-4 py-2.5 border-b border-rule flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-ink-muted" />
        <h2 className="type-label">Protocol Classification</h2>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div
          className={`rounded-sm border-2 p-5 transition-all duration-300 ${
            isBlocked
              ? "bg-triage-blocked-bg border-triage-blocked-border"
              : isOoc
                ? "bg-surface-inset border-rule-strong"
                : `${cfg.bg} ${cfg.border}`
          } ${animating ? "animate-unlock" : ""}`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            {isBlocked ? (
              <div className="w-10 h-10 rounded-full bg-triage-blocked/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-triage-blocked" />
              </div>
            ) : isOoc ? (
              <div className="w-10 h-10 rounded-full bg-surface-page flex items-center justify-center">
                <XCircle className="w-5 h-5 text-ink-secondary" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${cfg.text}`} />
              </div>
            )}
            <div>
              <h3
                className={`type-title ${
                  isBlocked
                    ? "text-triage-blocked"
                    : isOoc
                      ? "text-ink"
                      : cfg.text
                }`}
              >
                {isBlocked
                  ? "Classification Blocked"
                  : isOoc
                    ? "Out of Cohort"
                    : result.classification_name}
              </h3>
              {!isBlocked && !isOoc && (
                <div
                  className={`inline-block mt-1 px-2 py-0.5 rounded-sm type-micro ${cfg.badge} ${cfg.badgeText}`}
                >
                  {result.triage_color}
                </div>
              )}
            </div>
          </div>

          {/* Blocked State */}
          {isBlocked && (
            <div className="space-y-3">
              <p className="type-body-sm text-triage-blocked/80">
                {result.treatment_instruction}
              </p>
              <div className="bg-white/50 rounded-sm p-3">
                <p className="type-micro text-triage-blocked mb-2">
                  MISSING {result.missing_fields.length} REQUIRED{" "}
                  {result.missing_fields.length === 1 ? "FACT" : "FACTS"}
                </p>
                <ul className="space-y-1.5">
                  {result.missing_fields.map((mf, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-triage-blocked mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="type-body-sm font-medium text-triage-blocked">
                          {mf.field
                            .replace("danger_signs.", "")
                            .replace(/_/g, " ")}
                        </span>
                        <span className="type-caption text-triage-blocked/60 block">
                          {mf.reason}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Classified State */}
          {!isBlocked && !isOoc && (
            <div className="space-y-3">
              {firedRule && (
                <div className="bg-white/40 rounded-sm p-3 border border-white/60">
                  <p className="type-micro text-ink-secondary mb-1">
                    RULE FIRED
                  </p>
                  <p className={`type-body-sm font-medium ${cfg.text}`}>
                    {firedRule}
                  </p>
                </div>
              )}
              <p className={`type-body-sm font-medium ${cfg.text}`}>
                {result.treatment_instruction}
              </p>
            </div>
          )}

          {/* Out of Cohort */}
          {isOoc && (
            <p className="type-body-sm text-ink-secondary">
              Patient is outside the 2-59 month age cohort for this IMNCI
              module.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-rule flex items-center gap-4">
          <div className="flex items-center gap-1.5 type-caption text-ink-muted">
            <div className="w-1.5 h-1.5 rounded-full bg-triage-homecare" />
            Deterministic TypeScript logic
          </div>
          <div className="flex items-center gap-1.5 type-caption text-ink-muted">
            <div className="w-1.5 h-1.5 rounded-full bg-triage-homecare" />
            Zero LLM in classification
          </div>
        </div>
      </div>
    </section>
  );
}
