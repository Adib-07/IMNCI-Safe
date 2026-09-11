"use client";

import React from "react";
import {
  ClipboardList,
  ArrowRight,
  Zap,
  AlertCircle,
  Activity,
} from "lucide-react";

interface InputPanelProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onExtract: (overrideText?: string, useMockId?: string) => void;
  isExtracting: boolean;
  isDisabled: boolean;
}

const DEMO_CASES = [
  {
    label: "Incomplete — Missing Data",
    description: "18mo, cough, no RR, unknown signs",
    text: "Baccha 18 months ka hai, 2 din se tez khansi aur saans tez chal rahi hai, thoda doodh piya tha...",
    useMockId: "FIXTURE_UNSAFE",
    icon: AlertCircle,
    color: "text-amber-accent",
    accent: "border-l-amber-accent",
  },
  {
    label: "Complete — Pneumonia",
    description: "18mo, RR 44, all signs confirmed",
    text: "Child is 18 months old. Has a cough. Measured respiratory rate is 44. No convulsions, child is drinking normally, not vomiting, and is alert. No indrawing or stridor.",
    useMockId: "FIXTURE_SAFE",
    icon: Activity,
    color: "text-yellow-accent",
    accent: "border-l-yellow-accent",
  },
  {
    label: "High Risk — Severe",
    description: "8mo, RR 55, chest indrawing",
    text: "8 month old infant with cough. Breathing is very fast, counted 55 breaths per minute. Noticeable chest indrawing. Has not vomited and no convulsions.",
    useMockId: "FIXTURE_HIGH_RISK",
    icon: Zap,
    color: "text-pink-accent",
    accent: "border-l-pink-accent",
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
    <section className="bg-surface-card border border-border-default rounded-[6px] flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border-default flex items-center gap-2">
        <ClipboardList className="w-3.5 h-3.5 text-text-tertiary" />
        <h2 className="type-label">Input</h2>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <label className="type-caption text-text-secondary">
            Paste messy clinical field notes or audio transcript
          </label>
          <textarea
            className="w-full min-h-[180px] p-3 type-body text-text-primary bg-surface-inset border border-border-default rounded-[4px] focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-border-strong resize-none placeholder:text-text-tertiary"
            placeholder="e.g. Baccha 18 months ka hai, 2 din se khansi..."
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={isExtracting}
          />
        </div>

        <button
          onClick={() => onExtract()}
          disabled={!inputText.trim() || isExtracting || isDisabled}
          className="w-full py-2.5 px-4 type-label bg-neutral-dark hover:bg-neutral-dark-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-[4px] flex items-center justify-center gap-2 transition-colors"
        >
          {isExtracting ? (
            <>
              <div className="spinner !w-4 !h-4 !border-[1.5px] !border-white/30 !border-t-white" />
              Extracting facts from assessment…
            </>
          ) : (
            <>
              Extract
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="border-t border-border-default pt-3">
          <p className="type-micro text-text-tertiary uppercase mb-2.5">
            Demo Cases
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
                  className={`group text-left px-3 py-2.5 rounded-[4px] border border-border-default border-l-[3px] ${c.accent} hover:border-border-strong hover:bg-surface-inset transition-colors disabled:opacity-40`}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.color}`}
                    />
                    <div>
                      <span className="type-body font-medium text-text-primary block group-hover:text-action-primary transition-colors">
                        {c.label}
                      </span>
                      <span className="type-caption text-text-tertiary">
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
