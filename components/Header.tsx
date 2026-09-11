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
    <header className="sticky top-0 z-20 border-b border-border-default bg-surface-card/95 backdrop-blur-sm">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-action-primary text-action-primary-text">
            <Shield className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-2.5">
            <h1 className="type-title text-text-primary leading-none">
              IMNCI-Safe
            </h1>
            <span className="hidden sm:inline-block type-micro text-text-tertiary">Clinical Decision Support</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1 type-micro text-text-secondary tracking-tight" style={{ fontFamily: "var(--font-mono), monospace" }}>
            <span className="font-semibold text-text-primary">AI</span>
            <span>Extracts</span>
            <span className="text-text-tertiary mx-0.5">&middot;</span>
            <span className="font-semibold text-text-primary">Rules</span>
            <span>Decide</span>
            <span className="text-text-tertiary mx-0.5">&middot;</span>
            <span className="font-semibold text-text-primary">You</span>
            <span>Confirm</span>
          </div>

          {showReset && (
            <div className="flex items-center gap-2">
              {isFallback !== null && (
                <span
                  className={`type-micro px-2 py-0.5 rounded ${
                    isFallback
                      ? "text-amber-accent bg-amber-bg border border-amber-border"
                      : "text-green-accent bg-green-bg border border-green-border"
                  }`}
                >
                  {isFallback ? "Demo Fallback" : "Live"}
                </span>
              )}
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 type-caption text-white bg-neutral-dark hover:bg-neutral-dark-hover px-2.5 py-1.5 rounded-[4px] transition-colors"
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
