"use client";

import React from "react";
import { 
  Shield, 
  ArrowRight, 
  AlertTriangle, 
  Mic, 
  UserCheck, 
  Info,
  Check,
  XCircle
} from "lucide-react";

interface LandingHeroProps {
  onStartAssessment: () => void;
  onLoadGuidedDemo: (demoId: string) => void;
}

export function LandingHero({ onStartAssessment, onLoadGuidedDemo }: LandingHeroProps) {
  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Hero Headline & Value Proposition Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle clinical accent top bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600" />

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5 text-teal-700" />
            <span>AI Safety & Public Health Hackathon Prototype</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Universal Bridge Between Frontline Intent & Clinical Safety Protocols
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed font-sans">
            Frontline child-health workers (ASHAs and ANMs) observe symptoms in messy dialects, voice memos, and hurried register notes. 
            <strong> IMNCI Safe</strong> leverages Gemini to extract structured clinical facts, strictly gates on missing observations, and evaluates deterministic Government of India IMNCI guidelines.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onStartAssessment}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Open Clinical Assessment Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onLoadGuidedDemo("DEMO_CASE_INCOMPLETE")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-semibold transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Test Case 1: Missing Data Gating</span>
            </button>
          </div>
        </div>

        {/* 3 Core Value Propositions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-3">
              <Mic className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Multilingual Messy Input Bridge
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Accepts spoken Hindi, English, and code-mixed Hinglish voice recordings or clinical slips. Normalizes informal statements into structured observations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Protocol Gating Safety
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Missing information blocks routine classification. Under IMNCI rules, unmeasured symptoms cannot be hallucinated or presumed normal.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Frontline Decision Support
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Generates pre-referral checklists and printable facility handoff slips. The human health worker confirms every fact and retains clinical authority.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Workflow Diagram */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Six-Stage Safety Pipeline Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              How messy human intent safely transforms into protocol-grounded referral actions
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
            Zero Hallucinated Triage
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Stage 1</div>
              <div className="text-xs font-bold text-slate-900 mt-1">Messy Input</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Caregiver speaks in Hinglish or worker photographs clinic register slip.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-teal-800 font-semibold flex items-center gap-1">
              <span>Voice / Text / Slip</span>
            </div>
          </div>

          <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-teal-700 uppercase">Stage 2</div>
              <div className="text-xs font-bold text-slate-900 mt-1">Gemini Extraction</div>
              <p className="text-[11px] text-slate-600 mt-1">
                LLM extracts symptoms and grounds every fact in verbatim text quotes.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-teal-800 font-semibold flex items-center gap-1">
              <span>Strict Schema</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Stage 3</div>
              <div className="text-xs font-bold text-slate-900 mt-1">Assessment Facts</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Structured clinical parameters: age cohort, danger signs, and breathing count.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-slate-600 font-semibold flex items-center gap-1">
              <span>Mapped Evidence</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-amber-800 uppercase">Stage 4</div>
              <div className="text-xs font-bold text-amber-950 mt-1">Missing Info Check</div>
              <p className="text-[11px] text-amber-900 mt-1">
                If breathing rate or danger signs are missing, routine triage is blocked.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-amber-800 font-semibold flex items-center gap-1">
              <span>Gating Protection</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Stage 5</div>
              <div className="text-xs font-bold text-slate-900 mt-1">IMNCI Rules Engine</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Deterministic code evaluates GoI guidelines. No LLM randomness.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-slate-600 font-semibold flex items-center gap-1">
              <span>Rule Reproducibility</span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase">Stage 6</div>
              <div className="text-xs font-bold text-emerald-950 mt-1">Human Sign-off</div>
              <p className="text-[11px] text-emerald-900 mt-1">
                Health worker confirms findings, completes pre-referral steps, and prints handoff.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
              <span>Handoff Slip</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Boundaries: What this prototype does NOT do */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Clinical Safety Boundaries & Explicit Scope
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>What IMNCI Safe Does</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li>&bull; Normalizes unstructured frontline field language into structured protocol criteria.</li>
              <li>&bull; Grounds every single extracted finding in an exact verbatim quote from the input.</li>
              <li>&bull; Blocks completion when mandatory danger signs or respiratory rate are missing.</li>
              <li>&bull; Executes Government of India IMNCI guidelines through 100% deterministic code.</li>
              <li>&bull; Provides printable referral handoff documentation for district hospital transfers.</li>
            </ul>
          </div>

          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>What This Prototype Does NOT Do</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li>&bull; <strong>Protocol Scope Subset:</strong> Implements Child 2–59 Months Acute Respiratory Infection (Pneumonia/Cough/Cold) & General Danger Signs. Does NOT implement full IMNCI (Diarrhea/Dehydration, Fever/Malaria, Ear Infection, Malnutrition, and 0–2 Month Young Infant protocols are separate modules outside this prototype&apos;s evaluated subset).</li>
              <li>&bull; <strong>Not an Autonomous Diagnosis Device:</strong> Does not diagnose illnesses autonomously or prescribe medication without human sign-off.</li>
              <li>&bull; <strong>No Black-Box Triage:</strong> Gemini extracts observations; deterministic code assigns triage categories.</li>
              <li>&bull; <strong>No Storage of Real Patient Data:</strong> Operates strictly in-memory; no patient PII is stored.</li>
              <li>&bull; <strong>Does Not Replace Physical Examination:</strong> Worker must still count breaths for 1 full minute and examine the child.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
