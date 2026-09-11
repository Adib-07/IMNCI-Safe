"use client";

import React from "react";
import { ClipboardList, AlertCircle, Activity, Zap } from "lucide-react";

interface InputPanelProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onExtract: (overrideText?: string, useMockId?: string) => void;
  isExtracting: boolean;
  isDisabled: boolean;
}

const DEMO_CASES = [
  {
    label: "Incomplete \u2014 Missing Data",
    description: "18mo, cough, no RR, unknown signs",
    text: "Baccha 18 months ka hai, 2 din se tez khansi aur saans tez chal rahi hai, thoda doodh piya tha...",
    useMockId: "FIXTURE_UNSAFE",
    icon: AlertCircle,
    triageClass: "border-l-triage-blocked",
    textClass: "text-triage-blocked",
  },
  {
    label: "Complete \u2014 Pneumonia",
    description: "18mo, RR 44, all signs confirmed",
    text: "Child is 18 months old. Has a cough. Measured respiratory rate is 44. No convulsions, child is drinking normally, not vomiting, and is alert. No indrawing or stridor.",
    useMockId: "FIXTURE_SAFE",
    icon: Activity,
    triageClass: "border-l-triage-treatment",
    textClass: "text-triage-treatment",
  },
  {
    label: "High Risk \u2014 Severe",
    description: "8mo, RR 55, chest indrawing",
    text: "8 month old infant with cough. Breathing is very fast, counted 55 breaths per minute. Noticeable chest indrawing. Has not vomited and no convulsions.",
    useMockId: "FIXTURE_HIGH_RISK",
    icon: Zap,
    triageClass: "border-l-triage-urgent",
    textClass: "text-triage-urgent",
  },
];

export function InputPanel({
  inputText,
  onInputChange,
  onExtract,
  isExtracting,
  isDisabled,
}: InputPanelProps) {
  return (
    <section className="bg-surface-card border border-rule flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-rule flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-ink-muted" />
        <h2 className="type-label">Clinical Notes Input</h2>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <label className="type-caption text-ink-secondary">
            Paste field notes or voice transcript
          </label>
          <textarea
            className="w-full min-h-[180px] p-3 type-body text-ink bg-surface-inset border border-rule rounded-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-rule-strong resize-none placeholder:text-ink-muted"
            placeholder="e.g. Baccha 18 months ka hai, 2 din se khansi..."
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={isExtracting}
          />
        </div>

        <button
          onClick={() => onExtract()}
          disabled={!inputText.trim() || isExtracting || isDisabled}
          className="w-full py-2.5 px-4 type-label bg-ink hover:bg-ink-secondary disabled:opacity-40 disabled:cursor-not-allowed text-ink-inverse rounded-sm flex items-center justify-center gap-2 transition-colors focus-ring"
        >
          {isExtracting ? (
            <>
              <div className="spinner !w-4 !h-4 !border-[1.5px] !border-white/30 !border-t-white" />
              Extracting facts from assessment...
            </>
          ) : (
            "Run this case"
          )}
        </button>

        <div className="border-t border-rule pt-3">
          <p className="type-micro text-ink-muted mb-2.5">
            DEMO CASES
          </p>
          <div className="flex flex-col gap-1.5">
            {DEMO_CASES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.useMockId}
                  onClick={() => {
                    onInputChange(c.text);
                    onExtract(c.text, c.useMockId);
                  }}
                  disabled={isExtracting}
                  className={`group text-left px-3 py-2.5 rounded-sm border border-rule border-l-[3px] ${c.triageClass} hover:border-rule-strong hover:bg-surface-inset transition-colors disabled:opacity-40`}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.textClass}`}
                    />
                    <div>
                      <span className="type-body-sm font-medium text-ink block group-hover:text-triage-treatment transition-colors">
                        {c.label}
                      </span>
                      <span className="type-caption text-ink-muted">
                        {c.description}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
