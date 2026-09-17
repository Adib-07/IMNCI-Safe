"use client";

import React from "react";
import { Shield, RotateCcw, Terminal, Play } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
  showReset: boolean;
  isFallback: boolean | null;
  onToggleTechnicalView: () => void;
  showTechnicalView: boolean;
  onOpenGuidedDemo: () => void;
  currentStep?: 1 | 2 | 3;
  onSelectStep?: (step: 1 | 2 | 3) => void;
  canNavigateToStep?: (step: 1 | 2 | 3) => boolean;
}

export function Header({
  onReset,
  showReset,
  isFallback,
  onToggleTechnicalView,
  showTechnicalView,
  onOpenGuidedDemo,
  currentStep = 1,
  onSelectStep,
  canNavigateToStep,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)] shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & System Orientation */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectStep && onSelectStep(1)}
              className="flex items-center gap-2.5 text-left focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] rounded-lg transition-opacity hover:opacity-95"
              aria-label="IMNCI-Safe clinical home"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-brand)] text-white shadow-sm ring-1 ring-white/10">
                <Shield className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[var(--color-text)] tracking-tight">
                    IMNCI-Safe
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[var(--color-brand)]/15 text-[var(--color-brand-light)] border border-[var(--color-brand)]/30">
                    CDS
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] text-[var(--color-text-muted)] leading-none mt-0.5">
                  Pediatric Clinical Decision Support
                </span>
              </div>
            </button>
            <div className="hidden lg:block h-5 w-px bg-[var(--color-border)] mx-1" />
            <span className="hidden lg:block text-xs text-[var(--color-text-secondary)] font-medium">
              WHO / MoHFW IMNCI Protocol
            </span>
          </div>

          {/* Clinical Workflow Stepper */}
          <nav aria-label="Clinical workflow steps" className="flex items-center gap-1 p-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg">
            {([1, 2, 3] as const).map((step) => {
              const labels = { 1: "Observation", 2: "Verification", 3: "Protocol Decision" };
              const isActive = currentStep === step;
              const canNav = canNavigateToStep ? canNavigateToStep(step) : true;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (onSelectStep && canNav) onSelectStep(step);
                  }}
                  disabled={!canNav}
                  aria-current={isActive ? "step" : undefined}
                  aria-disabled={!canNav}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[var(--color-brand)] text-white shadow-sm"
                      : !canNav
                      ? "text-[var(--color-text-muted)]/40 cursor-not-allowed"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)]"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                  }`}>
                    {step}
                  </span>
                  <span className="hidden md:inline">{labels[step]}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Utility Controls */}
          <div className="flex items-center gap-2">
            {/* System AI / Fallback Status Indicator (informative, calm, not alarmist) */}
            {isFallback !== null && (
              <div
                role="status"
                className={`hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border ${
                  isFallback
                    ? "bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border)]"
                    : "bg-[var(--color-brand-subtle)] text-[var(--color-brand-light)] border-[var(--color-brand)]/25"
                }`}
                title={isFallback ? "Operating with deterministic baseline logic" : "Powered by server-side Gemini 2.5 Flash"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isFallback ? "bg-[var(--color-yellow)]" : "bg-[var(--color-green)]"}`} />
                <span>{isFallback ? "Deterministic Mode" : "Live AI Active"}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenGuidedDemo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[var(--color-text)] bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-elevated)] hover:border-[var(--color-border-strong)] transition-all"
              aria-label="Open guided synthetic demo cases"
            >
              <Play className="w-3.5 h-3.5 text-[var(--color-brand-light)]" />
              <span className="hidden sm:inline">Demo Scenarios</span>
            </button>

            <button
              type="button"
              onClick={onToggleTechnicalView}
              aria-pressed={showTechnicalView}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                showTechnicalView
                  ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-xs"
                  : "bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)]"
              }`}
              title="Audit trail, schema validation, and technical telemetry"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Audit Trace</span>
            </button>

            {showReset && (
              <button
                type="button"
                onClick={onReset}
                aria-label="Start new clinical assessment case"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-card)] border border-[var(--color-border)] hover:text-[var(--color-pink)] hover:border-[var(--color-pink-border)] hover:bg-[var(--color-elevated)] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Case</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
