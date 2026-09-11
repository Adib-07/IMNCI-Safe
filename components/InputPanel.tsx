"use client";

import React from "react";
import { ClipboardList, AlertCircle, Activity, Zap, Thermometer, Stethoscope, Play } from "lucide-react";

interface InputPanelProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onExtract: (overrideText?: string, useMockId?: string) => void;
  onProcessNotes: () => void;
  inputError: string | null;
  isExtracting: boolean;
  isProcessing: boolean;
  isDisabled: boolean;
}

const QUICK_FILL_CASES = [
  {
    label: "Sample Case: Fever",
    text: "2 year old child with high fever for 3 days. Has a cough and is breathing fast. Measured respiratory rate is 42. No chest indrawing. Child is drinking fluids and alert. No convulsions, no vomiting.",
    icon: Thermometer,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/15",
  },
  {
    label: "Sample Case: Cough",
    text: "14 month old infant with persistent cough for 5 days. Breathing fast, counted 48 breaths per minute. No chest indrawing, no stridor. Child is lethargic and unable to drink breastmilk. No convulsions.",
    icon: Stethoscope,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-500/15",
  },
];

const DEMO_CASES = [
  {
    label: "Incomplete",
    description: "Missing data",
    text: "Baccha 18 months ka hai, 2 din se tez khansi aur saans tez chal rahi hai, thoda doodh piya tha...",
    useMockId: "FIXTURE_UNSAFE",
    icon: AlertCircle,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    hoverColor: "hover:border-amber-500/40 hover:bg-amber-500/15",
  },
  {
    label: "Pneumonia",
    description: "All signs confirmed",
    text: "Child is 18 months old. Has a cough. Measured respiratory rate is 44. No convulsions, child is drinking normally, not vomiting, and is alert. No indrawing or stridor.",
    useMockId: "FIXTURE_SAFE",
    icon: Activity,
    color: "text-amber-300 bg-amber-400/10 border-amber-400/20",
    hoverColor: "hover:border-amber-400/40 hover:bg-amber-400/15",
  },
  {
    label: "High Risk",
    description: "Severe case",
    text: "8 month old infant with cough. Breathing is very fast, counted 55 breaths per minute. Noticeable chest indrawing. Has not vomited and no convulsions.",
    useMockId: "FIXTURE_HIGH_RISK",
    icon: Zap,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    hoverColor: "hover:border-pink-500/40 hover:bg-pink-500/15",
  },
];

export function InputPanel({
  inputText,
  onInputChange,
  onExtract,
  onProcessNotes,
  inputError,
  isExtracting,
  isProcessing,
  isDisabled,
}: InputPanelProps) {
  const isBusy = isExtracting || isProcessing;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl backdrop-blur-xl p-6 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Clinical Notes Input</h2>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-500 font-medium">
            Paste field notes or voice transcript
          </label>
          <textarea
            className={`w-full min-h-[180px] p-3 text-sm text-slate-200 bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none placeholder:text-slate-600 transition-all duration-200 ${
              inputError
                ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50"
                : "border-slate-700/50"
            }`}
            placeholder="e.g. Baccha 18 months ka hai, 2 din se khansi..."
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={isBusy}
          />
          {inputError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 animate-fade-in">
              <AlertCircle className="w-3 h-3" />
              {inputError}
            </p>
          )}
        </div>

        {/* Process Notes — primary CTA */}
        <button
          onClick={onProcessNotes}
          disabled={!inputText.trim() || isBusy || isDisabled}
          className="w-full py-2.5 px-4 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          {isBusy ? (
            <>
              <div className="spinner !w-4 !h-4 !border-[1.5px] !border-white/30 !border-t-white" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" fill="currentColor" />
              Process Notes
            </>
          )}
        </button>

        {/* Run this case — secondary CTA */}
        <button
          onClick={() => onExtract()}
          disabled={!inputText.trim() || isBusy || isDisabled}
          className="w-full py-2 px-4 text-xs font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
        >
          Or run with live API
        </button>

        <div className="border-t border-slate-800/60 pt-3">
          <p className="text-[0.625rem] font-semibold text-slate-600 tracking-widest mb-2.5">
            QUICK FILL
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FILL_CASES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.label}
                  onClick={() => onInputChange(c.text)}
                  disabled={isBusy}
                  className={`group inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 ${c.color}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-3">
          <p className="text-[0.625rem] font-semibold text-slate-600 tracking-widest mb-2.5">
            QUICK CASES
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_CASES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.useMockId}
                  onClick={() => {
                    onInputChange(c.text);
                    onExtract(c.text, c.useMockId);
                  }}
                  disabled={isBusy}
                  className={`group inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 ${c.color} ${c.hoverColor}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{c.label}</span>
                  <span className="text-slate-600">&middot;</span>
                  <span className="text-slate-600 group-hover:text-slate-500 transition-colors">{c.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
