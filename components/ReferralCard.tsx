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
    glow: string;
    icon: React.ElementType;
  }
> = {
  PINK: {
    bg: "bg-pink-500/5",
    border: "border-pink-500/30",
    text: "text-pink-400",
    glow: "shadow-pink-500/20",
    icon: AlertTriangle,
  },
  YELLOW: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
    icon: Activity,
  },
  GREEN: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/20",
    icon: CheckCircle2,
  },
  AMBER: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
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
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800/60 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
            <Info className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Protocol Classification</h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-4 relative">
              <Info className="w-6 h-6 text-slate-600" />
              <div className="absolute inset-0 rounded-full border border-slate-700/30 animate-pulse" />
            </div>
            <p className="text-sm text-slate-400 font-medium mb-1">
              Complete verification to reveal classification
            </p>
            <p className="text-xs text-slate-600">
              Or run a case from the input panel
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

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-800/60 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Protocol Classification</h2>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div
          className={`rounded-xl border-2 p-5 transition-all duration-300 ${
            isBlocked
              ? "bg-amber-500/5 border-amber-500/30"
              : isOoc
                ? "bg-slate-800/30 border-slate-700/50"
                : `${cfg.bg} ${cfg.border}`
          } ${animating ? "animate-unlock" : ""}`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            {isBlocked ? (
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
            ) : isOoc ? (
              <div className="w-11 h-11 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-slate-500" />
              </div>
            ) : (
              <div className={`w-11 h-11 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shadow-lg ${cfg.glow}`}>
                <Icon className={`w-5 h-5 ${cfg.text}`} />
              </div>
            )}
            <div>
              <h3
                className={`text-base font-semibold ${
                  isBlocked
                    ? "text-amber-400"
                    : isOoc
                      ? "text-slate-300"
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
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[0.625rem] font-semibold ${cfg.text} bg-current/10`}
                  style={{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }}
                >
                  {result.triage_color}
                </div>
              )}
            </div>
          </div>

          {/* Blocked State */}
          {isBlocked && (
            <div className="space-y-3">
              <p className="text-sm text-amber-400/80">
                {result.treatment_instruction}
              </p>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                <p className="text-[0.625rem] font-semibold text-amber-400 mb-2 tracking-wider">
                  MISSING {result.missing_fields.length} REQUIRED{" "}
                  {result.missing_fields.length === 1 ? "FACT" : "FACTS"}
                </p>
                <ul className="space-y-1.5">
                  {result.missing_fields.map((mf, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-amber-300">
                          {mf.field
                            .replace("danger_signs.", "")
                            .replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-amber-400/50 block">
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
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-3">
                  <p className="text-[0.625rem] font-semibold text-slate-500 mb-1 tracking-wider">
                    RULE FIRED
                  </p>
                  <p className={`text-sm font-medium ${cfg.text}`}>
                    {firedRule}
                  </p>
                </div>
              )}
              <p className={`text-sm font-medium ${cfg.text}`}>
                {result.treatment_instruction}
              </p>
            </div>
          )}

          {/* Out of Cohort */}
          {isOoc && (
            <p className="text-sm text-slate-400">
              Patient is outside the 2-59 month age cohort for this IMNCI
              module.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Deterministic TypeScript logic
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Zero LLM in classification
          </div>
        </div>
      </div>
    </section>
  );
}
