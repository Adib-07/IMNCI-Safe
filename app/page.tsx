"use client";

import React, { useState, useCallback } from "react";
import { ImnciAssessment } from "@/lib/types";
import { evaluateImnciProtocol } from "@/lib/imnci-rules";
import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { VerificationPanel } from "@/components/VerificationPanel";
import { ReferralCard } from "@/components/ReferralCard";
import { Pipeline } from "@/components/Pipeline";
import {
  AlertCircle,
  FileText,
  Cpu,
  ClipboardCheck,
  UserCheck,
  Shield,
  BookOpen,
  Lock,
} from "lucide-react";

type PipelineStage = "idle" | "input" | "extract" | "verify" | "classify";

export default function ImnciDashboard() {
  const [inputText, setInputText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [assessment, setAssessment] = useState<ImnciAssessment | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [inputError, setInputError] = useState<string | null>(null);

  const protocolResult = assessment ? evaluateImnciProtocol(assessment) : null;

  const clearError = useCallback(() => {
    setInputError(null);
    setError(null);
  }, []);

  const handleProcessNotes = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setInputError("Please enter clinical notes before processing.");
      return;
    }
    setInputError(null);
    setError(null);
    setAssessment(null);
    setIsFallback(false);

    // Step 2: Extract (1.5s delay)
    setPipelineStage("extract");
    setIsExtracting(true);

    setTimeout(() => {
      // Step 3: Verify — still extracting (loading skeletons in right card)
      setPipelineStage("verify");

      setTimeout(() => {
        // Step 4: Confirm — show success with mock parsed data
        setPipelineStage("classify");
        setIsExtracting(false);
        setIsFallback(true);
        setAssessment({
          facts: {
            patient_age_months: 14,
            has_cough_or_difficult_breathing: true,
            respiratory_rate: 48,
            fast_breathing_reported: true,
            chest_indrawing: false,
            stridor_in_calm_child: false,
            danger_signs: {
              unable_to_drink_or_breastfeed: true,
              vomits_everything: false,
              has_convulsions: false,
              lethargic_or_unconscious: false,
            },
          },
        });
      }, 1000);
    }, 1500);
  }, [inputText]);

  const handleExtract = useCallback(
    async (overrideText?: string, useMockId?: string) => {
      const textToAnalyze = overrideText !== undefined ? overrideText : inputText;
      if (!textToAnalyze.trim()) return;

      setInputError(null);
      setError(null);
      setIsExtracting(true);
      setAssessment(null);
      setPipelineStage("extract");

      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: useMockId ? useMockId : textToAnalyze,
            useMock: !!useMockId,
          }),
        });
        if (!res.ok) {
          throw new Error(`Extraction failed (${res.status})`);
        }
        const data = await res.json();
        setAssessment(data.assessment);
        setIsFallback(data.isFallback);
        setPipelineStage("classify");
      } catch (err) {
        console.error(err);
        setError("Extraction failed. Using fallback fixture for demo.");
        setIsFallback(true);
        setAssessment({
          facts: {
            patient_age_months: "unknown",
            has_cough_or_difficult_breathing: "unknown",
            respiratory_rate: "unknown",
            fast_breathing_reported: "unknown",
            chest_indrawing: "unknown",
            stridor_in_calm_child: "unknown",
            danger_signs: {
              unable_to_drink_or_breastfeed: "unknown",
              vomits_everything: "unknown",
              has_convulsions: "unknown",
              lethargic_or_unconscious: "unknown",
            },
          },
        });
        setPipelineStage("classify");
      } finally {
        setIsExtracting(false);
      }
    },
    [inputText]
  );

  const updateFact = (
    key: string,
    val: string | number | boolean,
    isDangerSign: boolean = false
  ) => {
    if (!assessment) return;
    setError(null);
    const newAssessment = JSON.parse(
      JSON.stringify(assessment)
    ) as ImnciAssessment;
    if (isDangerSign) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newAssessment.facts.danger_signs as any)[key] = val;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newAssessment.facts as any)[key] = val;
    }
    setAssessment(newAssessment);
  };

  const resetAll = () => {
    setInputText("");
    setAssessment(null);
    setIsFallback(false);
    setError(null);
    setInputError(null);
    setPipelineStage("idle");
    setIsExtracting(false);
  };

  const showVerification = !!assessment;

  return (
    <div className="min-h-screen bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#0B0F19] to-[#0B0F19] flex flex-col">
      <Header onReset={resetAll} showReset={!!assessment || isExtracting} isFallback={assessment ? isFallback : null} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0B0F19] to-[#0B0F19]" />
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 py-12 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              GOVERNMENT OF INDIA IMNCI PROTOCOL
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-tight tracking-tight mb-5">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Every child assessed against the protocol.
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300">
                Every result cited. Every decision confirmed.
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mb-4">
              IMNCI-Safe takes messy field notes from community health workers and runs a deterministic classification against the official Integrated Management of Neonatal and Childhood Illness danger-sign protocol.
            </p>
            <p className="text-sm text-slate-500 max-w-2xl">
              AI reads the notes. The rules engine decides the classification. A health worker confirms the result. No autonomous decisions. No AI opinions.
            </p>
          </div>
        </div>
      </section>

      {/* ── Tool Section ── */}
      <section className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-6 py-6 relative z-10">
        {/* Pipeline */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl px-4 py-3">
          <Pipeline currentStage={pipelineStage} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl px-4 py-3 flex items-start gap-3 mb-4 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">{error}</p>
              <p className="text-xs text-amber-400/60 mt-0.5">
                The system fell back to a demo fixture. Reset and try again with a valid API key.
              </p>
            </div>
          </div>
        )}

        {/* Three-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1.5fr] gap-4 md:gap-5 items-start">
          {/* Panel 1: Input */}
          <InputPanel
            inputText={inputText}
            onInputChange={(text) => {
              setInputText(text);
              if (inputError) setInputError(null);
            }}
            onExtract={handleExtract}
            onProcessNotes={handleProcessNotes}
            inputError={inputError}
            isExtracting={isExtracting}
            isProcessing={isExtracting}
            isDisabled={false}
          />

          {/* Panel 2: Verification */}
          {showVerification && (
            <VerificationPanel
              assessment={assessment}
              isExtracting={isExtracting}
              isFallback={isFallback}
              onUpdateFact={updateFact}
            />
          )}

          {!showVerification && (
            <div className="hidden lg:flex rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-xl items-center justify-center py-12">
              <div className="text-center px-6">
                <div className="w-14 h-14 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-4 relative">
                  <ClipboardCheck className="w-6 h-6 text-slate-500" />
                  <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-pulse" />
                </div>
                <p className="text-sm text-slate-400 mb-1 font-medium">
                  Paste clinical notes and extract
                </p>
                <p className="text-xs text-slate-600">
                  Or select a demo case to begin
                </p>
              </div>
            </div>
          )}

          {!showVerification && (
            <div className="lg:hidden" />
          )}

          {/* Panel 3: Classification */}
          <ReferralCard result={protocolResult} assessment={assessment} isExtracting={isExtracting} />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative border-t border-slate-800/60">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 md:py-16">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-3">
            How IMNCI-Safe classifies a sick child
          </h2>
          <p className="text-sm text-slate-500 mb-10 max-w-xl">
            Four-step deterministic pipeline. Zero autonomous decisions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Paste clinical notes",
                body: "A community health worker pastes their field notes or a voice transcript. The notes can be messy, in mixed languages, or abbreviated.",
                icon: FileText,
                color: "from-blue-500 to-cyan-500",
                glow: "bg-blue-500/10 border-blue-500/20",
              },
              {
                step: "02",
                title: "AI extracts structured facts",
                body: "A language model reads the free-text notes and pulls out specific clinical values: age, respiratory rate, danger signs, and chest indrawing.",
                icon: Cpu,
                color: "from-violet-500 to-purple-500",
                glow: "bg-violet-500/10 border-violet-500/20",
              },
              {
                step: "03",
                title: "Rules engine checks protocol",
                body: "A deterministic TypeScript engine evaluates every extracted fact against the official IMNCI danger-sign algorithm. No LLM involved.",
                icon: ClipboardCheck,
                color: "from-emerald-500 to-teal-500",
                glow: "bg-emerald-500/10 border-emerald-500/20",
              },
              {
                step: "04",
                title: "Human confirms classification",
                body: "A health worker reviews every extracted fact, corrects any errors, and confirms the classification. The system never acts autonomously.",
                icon: UserCheck,
                color: "from-amber-500 to-orange-500",
                glow: "bg-amber-500/10 border-amber-500/20",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className={`group relative rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-xl p-5 hover:-translate-y-1 transition-all duration-300 hover:border-slate-700`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[0.625rem] font-bold text-slate-600 tracking-widest">STEP {s.step}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {s.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why It's Trustworthy ── */}
      <section className="relative border-t border-slate-800/60">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 md:py-16">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-3">
            Why health programs trust IMNCI-Safe
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mb-10">
            The system is designed around one principle: no child&apos;s classification should depend on an AI&apos;s judgment. Every design decision flows from that.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: "Grounded in the official protocol",
                body: "Every classification result is produced by a deterministic rules engine that implements the Government of India\u2019s published IMNCI algorithm. Each result cites the specific rule that fired.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Lock,
                title: "Missing data blocks classification",
                body: "When a field cannot be extracted with confidence, the system marks it as unknown and blocks the classification entirely. It does not guess, default, or skip.",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: Shield,
                title: "A human confirms every result",
                body: "IMNCI-Safe never acts autonomously. Every extracted fact is shown to a health worker for review. The tool supports clinical judgment; it does not replace it.",
                color: "from-emerald-500 to-teal-500",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="group rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-xl p-5 hover:-translate-y-1 transition-all duration-300 hover:border-slate-700">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Triage color legend */}
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-xl p-5">
            <h3 className="text-[0.6875rem] font-semibold tracking-widest text-slate-500 mb-4">
              IMNCI TRIAGE COLOUR CODING
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-pink-500 flex-shrink-0 mt-0.5 shadow-lg shadow-pink-500/30" />
                <div>
                  <p className="text-sm font-semibold text-pink-400">PINK</p>
                  <p className="text-xs text-slate-500">Severe pneumonia or very severe disease. Urgent referral to hospital.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-amber-400 flex-shrink-0 mt-0.5 shadow-lg shadow-amber-400/30" />
                <div>
                  <p className="text-sm font-semibold text-amber-400">YELLOW</p>
                  <p className="text-xs text-slate-500">Pneumonia. Outpatient medical treatment and advice.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex-shrink-0 mt-0.5 shadow-lg shadow-emerald-500/30" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">GREEN</p>
                  <p className="text-xs text-slate-500">No pneumonia: cough or cold. Home care advice.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 bg-[#0B0F19]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">IMNCI-Safe</span>
              </div>
              <p className="text-xs text-slate-600">
                Clinical decision support for community health workers. Classifications grounded in the Government of India IMNCI protocol.
              </p>
            </div>
            <p className="text-xs text-slate-600">
              Not a replacement for clinical judgment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
