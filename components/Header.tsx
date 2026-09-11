"use client";

import React from "react";
import { Shield, RotateCcw } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
  showReset: boolean;
  isFallback: boolean | null;
}

export function Header({ onReset, showReset, isFallback }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-surface-page/95 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-ink text-ink-inverse">
            <Shield className="w-4.5 h-4.5" strokeWidth={2} />
          </div>
          <div>
            <h1 className="type-title text-ink leading-none">
              IMNCI-Safe
            </h1>
            <p className="type-caption text-ink-muted mt-0.5 hidden sm:block">
              Clinical Decision Support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 type-caption text-ink-secondary">
            <span className="font-semibold text-ink">AI extracts</span>
            <span className="text-ink-muted">&rarr;</span>
            <span className="font-semibold text-ink">rules decide</span>
            <span className="text-ink-muted">&rarr;</span>
            <span className="font-semibold text-ink">you confirm</span>
          </div>

          {showReset && (
            <div className="flex items-center gap-2">
              {isFallback !== null && (
                <span
                  className={`type-micro px-2 py-0.5 rounded-sm ${
                    isFallback
                      ? "text-triage-blocked bg-triage-blocked-bg border border-triage-blocked-border"
                      : "text-triage-homecare bg-triage-homecare-bg border border-triage-homecare-border"
                  }`}
                >
                  {isFallback ? "Demo" : "Live"}
                </span>
              )}
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 type-caption text-ink-inverse bg-ink hover:bg-ink-secondary px-3 py-1.5 rounded-sm transition-colors focus-ring"
                title="Start New Case"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Case</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
