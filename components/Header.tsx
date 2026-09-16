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
    <header className="sticky top-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectStep && onSelectStep(1)}
              className="flex items-center gap-2.5 text-left focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] rounded-lg"
              aria-label="IMNCI-Safe home"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--color-brand)] text-white shadow-sm">
                <Shield className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-bold text-[var(--color-text)] tracking-tight">
                  IMNCI-Safe
                </span>
                <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  Prototype
                </span>
              </div>
            </button>
            <div className="hidden md:block h-5 w-px bg-[var(--color-border-strong)]" />
            <span className="hidden md:block text-xs text-[var(--color-text-muted)]">
              AI-assisted IMNCI assessment
            </span>
          </div>

          {/* Workflow Steps */}
          <nav aria-label="Clinical workflow" className="flex items-center gap-0.5 p-0.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg">
            {([1, 2, 3] as const).map((step) => {
              const labels = { 1: "Input", 2: "Verify", 3: "Result" };
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
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? "bg-[var(--color-brand)] text-white shadow-sm"
                      : !canNav
                      ? "text-[var(--color-text-muted)]/40 cursor-not-allowed"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)]"
                  }`}
                >
                  <span className="mr-1 tabular-nums">{step}</span>
                  <span className="hidden sm:inline">{labels[step]}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {isFallback !== null && (
              <span
                role="status"
                className={`hidden lg:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isFallback
                    ? "bg-[var(--color-yellow-bg)] text-[var(--color-yellow)] border-[var(--color-yellow-border)]"
                    : "bg-[var(--color-green-bg)] text-[var(--color-green)] border-[var(--color-green-border)]"
                }`}
              >
                {isFallback ? "Fallback Mode" : "AI Active"}
              </span>
            )}

            <button
              type="button"
              onClick={onOpenGuidedDemo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[var(--color-text)] bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-elevated)] transition-colors"
              aria-label="Load guided demo cases"
            >
              <Play className="w-3 h-3 text-[var(--color-brand)]" />
              <span className="hidden sm:inline">Demo</span>
            </button>

            <button
              type="button"
              onClick={onToggleTechnicalView}
              aria-pressed={showTechnicalView}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                showTechnicalView
                  ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)]"
                  : "bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text)]"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Trace</span>
            </button>

            {showReset && (
              <button
                type="button"
                onClick={onReset}
                aria-label="Clear session and start over"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-card)] border border-[var(--color-border)] hover:text-[var(--color-pink)] hover:border-[var(--color-pink-border)] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
