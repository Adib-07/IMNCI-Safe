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
    <header className="sticky top-0 z-30 bg-[#10232D] border-b border-[rgba(160,220,216,0.16)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => onSelectStep && onSelectStep(1)}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            title="IMNCI Safe Home"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2BB7A9] text-[#0B1720] shadow-sm font-bold group-hover:bg-[#73DED0] transition-colors">
              <Shield className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#EAF7F5] tracking-tight leading-tight">
                  IMNCI-Safe
                </span>
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-[#15313A] text-[#73DED0] border border-[rgba(160,220,216,0.16)]">
                  Demo Mode
                </span>
              </div>
              <p className="text-[11px] text-[#78979B] hidden sm:block">
                Protocol support for frontline child-health assessment
              </p>
            </div>
          </button>
        </div>

        {/* Primary Areas Navigation: Assess -> Review -> Handoff */}
        <nav aria-label="Workflow Areas" className="flex items-center gap-1 sm:gap-2 p-1 bg-[#0B1720] border border-[rgba(160,220,216,0.16)] rounded-lg">
          <button
            type="button"
            onClick={() => onSelectStep && onSelectStep(1)}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              currentStep === 1
                ? "bg-[#2BB7A9] text-[#0B1720] shadow-sm"
                : "text-[#A8C3C5] hover:text-[#EAF7F5] hover:bg-[#15313A]"
            }`}
          >
            1. Assess
          </button>
          <button
            type="button"
            onClick={() => {
              if (onSelectStep && (canNavigateToStep ? canNavigateToStep(2) : true)) {
                onSelectStep(2);
              }
            }}
            disabled={canNavigateToStep ? !canNavigateToStep(2) : false}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              currentStep === 2
                ? "bg-[#2BB7A9] text-[#0B1720] shadow-sm"
                : (canNavigateToStep && !canNavigateToStep(2))
                ? "text-[#78979B]/50 cursor-not-allowed"
                : "text-[#A8C3C5] hover:text-[#EAF7F5] hover:bg-[#15313A]"
            }`}
          >
            2. Review
          </button>
          <button
            type="button"
            onClick={() => {
              if (onSelectStep && (canNavigateToStep ? canNavigateToStep(3) : true)) {
                onSelectStep(3);
              }
            }}
            disabled={canNavigateToStep ? !canNavigateToStep(3) : false}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              currentStep === 3
                ? "bg-[#2BB7A9] text-[#0B1720] shadow-sm"
                : (canNavigateToStep && !canNavigateToStep(3))
                ? "text-[#78979B]/50 cursor-not-allowed"
                : "text-[#A8C3C5] hover:text-[#EAF7F5] hover:bg-[#15313A]"
            }`}
          >
            3. Handoff
          </button>
        </nav>

        {/* Right Side: Demo Mode, Technical Details & Clear */}
        <div className="flex items-center gap-2">
          {/* Fallback indicator */}
          {isFallback !== null && (
            <span
              className={`hidden md:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${
                isFallback
                  ? "bg-[#1B3B43] text-[#F2B84B] border-[rgba(242,184,75,0.4)]"
                  : "bg-[#15313A] text-[#73DED0] border-[rgba(115,222,208,0.3)]"
              }`}
            >
              {isFallback ? "Demo Fallback Active" : "Gemini Extraction"}
            </span>
          )}

          {/* Quick Guided Demo Button */}
          <button
            type="button"
            onClick={onOpenGuidedDemo}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#EAF7F5] bg-[#15313A] border border-[rgba(160,220,216,0.2)] hover:bg-[#1B3B43] hover:border-[#2BB7A9] transition-colors"
            title="Load Guided Demo Cases"
          >
            <Play className="w-3 h-3 text-[#2BB7A9] fill-current" />
            <span className="hidden sm:inline">Guided Demo</span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* Technical Details Drawer Trigger */}
          <button
            type="button"
            onClick={onToggleTechnicalView}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
              showTechnicalView
                ? "bg-[#2BB7A9] text-[#0B1720] border-[#2BB7A9]"
                : "bg-[#15313A] text-[#A8C3C5] border-[rgba(160,220,216,0.16)] hover:text-[#EAF7F5] hover:border-[#73DED0]"
            }`}
            title="Collapsible technical details and rule trace"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Technical details</span>
          </button>

          {/* Clear Session / Reset */}
          {showReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#A8C3C5] bg-[#15313A] border border-[rgba(160,220,216,0.16)] hover:text-[#EAF7F5] hover:border-[#E75D5D] transition-colors"
              title="Clear current session"
            >
              <RotateCcw className="w-3 h-3 text-[#E75D5D]" />
              <span className="hidden sm:inline">Clear session</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}


