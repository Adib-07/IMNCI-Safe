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
    <header className="sticky top-0 z-20 backdrop-blur-md bg-[#0B0F19]/80 border-b border-slate-800/60">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            <div className="absolute -inset-px rounded-xl border border-emerald-400/30 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-none tracking-tight">
              IMNCI-Safe
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[0.625rem] font-semibold text-emerald-400 tracking-wider uppercase hidden sm:block">
                Protocol Engine Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-300">AI extracts</span>
            <span className="text-slate-700">&rarr;</span>
            <span className="font-medium text-slate-300">rules decide</span>
            <span className="text-slate-700">&rarr;</span>
            <span className="font-medium text-slate-300">you confirm</span>
          </div>

          {showReset && (
            <div className="flex items-center gap-2">
              {isFallback !== null && (
                <span
                  className={`text-[0.625rem] font-semibold px-2 py-0.5 rounded-full border ${
                    isFallback
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  }`}
                >
                  {isFallback ? "DEMO" : "LIVE"}
                </span>
              )}
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-3 py-1.5 rounded-full transition-all duration-200 hover:text-white focus-ring"
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
