"use client";

import React, { useState } from "react";
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

export default function ImnciDashboard() {
  const [inputText, setInputText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [assessment, setAssessment] = useState<ImnciAssessment | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const protocolResult = assessment ? evaluateImnciProtocol(assessment) : null;

  const pipelineStage = isExtracting
    ? "extract"
    : assessment
      ? "verify"
      : "idle";

  const handleExtract = async (overrideText?: string, useMockId?: string) => {
    const textToAnalyze = overrideText !== undefined ? overrideText : inputText;
    if (!textToAnalyze.trim()) return;

    setIsExtracting(true);
    setAssessment(null);
    setError(null);
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
    } finally {
      setIsExtracting(false);
    }
  };

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
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <Header onReset={resetAll} showReset={!!assessment || isExtracting} isFallback={assessment ? isFallback : null} />

      {/* ── Hero ── */}
      <section className="border-b border-rule bg-surface-page">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="max-w-3xl">
            <p className="type-label text-triage-urgent mb-3">
              Government of India IMNCI Protocol
            </p>
            <h1 className="type-display text-ink mb-4">
              Every child assessed against the protocol. Every result cited. Every decision confirmed by a human.
            </h1>
            <p className="type-subtitle max-w-2xl mb-3">
              IMNCI-Safe takes messy field notes from community health workers and runs a deterministic classification against the official Integrated Management of Neonatal and Childhood Illness danger-sign protocol.
            </p>
            <p className="type-body-sm text-ink-muted max-w-2xl">
              AI reads the notes. The rules engine decides the classification. A health worker confirms the result. No autonomous decisions. No AI opinions.
            </p>
          </div>
        </div>
      </section>

      {/* ── Tool Section ── */}
      <section className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-6 py-6">
        {/* Pipeline */}
        <div className="mb-5 border border-rule bg-surface-card rounded-sm px-4 py-2">
          <Pipeline currentStage={pipelineStage} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-triage-blocked-bg border border-triage-blocked-border rounded-sm px-4 py-3 flex items-start gap-3 mb-4 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-triage-blocked mt-0.5 flex-shrink-0" />
            <div>
              <p className="type-body-sm font-medium text-triage-blocked">{error}</p>
              <p className="type-caption text-triage-blocked/70 mt-0.5">
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
            onInputChange={setInputText}
            onExtract={handleExtract}
            isExtracting={isExtracting}
            isDisabled={false}
          />

          {/* Panel 2: Verification */}
          {assessment && (
            <VerificationPanel
              assessment={assessment}
              isExtracting={isExtracting}
              isFallback={isFallback}
              onUpdateFact={updateFact}
            />
          )}

          {!assessment && !isExtracting && (
            <div className="hidden lg:flex bg-surface-card border border-rule items-center justify-center py-12">
              <div className="text-center px-6">
                <div className="w-12 h-12 rounded-full bg-surface-inset flex items-center justify-center mx-auto mb-3">
                  <ClipboardCheck className="w-6 h-6 text-ink-muted" />
                </div>
                <p className="type-body-sm text-ink-secondary mb-1">
                  Paste clinical notes and extract
                </p>
                <p className="type-caption text-ink-muted">
                  Or select a demo case to begin
                </p>
              </div>
            </div>
          )}

          {!assessment && !isExtracting && (
            <div className="lg:hidden" />
          )}

          {/* Panel 3: Classification */}
          <ReferralCard result={protocolResult} assessment={assessment} />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-rule bg-surface-card">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-14">
          <h2 className="type-display-sm text-ink mb-8">
            How IMNCI-Safe classifies a sick child
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-0 border border-rule rounded-sm overflow-hidden">
            {[
              {
                step: "01",
                title: "Paste clinical notes",
                body: "A community health worker pastes their field notes or a voice transcript into the tool. The notes can be messy, in mixed languages, or abbreviated.",
                icon: FileText,
              },
              {
                step: "02",
                title: "AI extracts structured facts",
                body: "A language model reads the free-text notes and pulls out specific clinical values: age in months, respiratory rate, presence of cough, danger signs, and chest indrawing.",
                icon: Cpu,
              },
              {
                step: "03",
                title: "Rules engine checks the protocol",
                body: "A deterministic TypeScript engine evaluates every extracted fact against the official IMNCI danger-sign algorithm. No LLM is involved in this step. Every result cites the exact threshold or rule that fired.",
                icon: ClipboardCheck,
              },
              {
                step: "04",
                title: "Human confirms the classification",
                body: "A health worker reviews every extracted fact, corrects any errors, and confirms the classification. The system never acts autonomously.",
                icon: UserCheck,
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className={`p-5 border-b lg:border-b-0 lg:border-r border-rule last:border-r-0 last:border-b-0 ${
                    i === 0 ? "bg-surface-page" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-ink text-ink-inverse flex items-center justify-center type-micro">
                      {s.step}
                    </div>
                    <Icon className="w-4 h-4 text-ink-muted" />
                  </div>
                  <h3 className="type-body-sm font-semibold text-ink mb-1.5">
                    {s.title}
                  </h3>
                  <p className="type-caption text-ink-secondary leading-relaxed">
                    {s.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why It's Trustworthy ── */}
      <section className="border-t border-rule">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-14">
          <h2 className="type-display-sm text-ink mb-3">
            Why health programs trust IMNCI-Safe
          </h2>
          <p className="type-body text-ink-secondary max-w-2xl mb-8">
            The system is designed around one principle: no child&apos;s classification should depend on an AI&apos;s judgment. Every design decision flows from that.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Grounded in the official protocol",
                body: "Every classification result is produced by a deterministic rules engine that implements the Government of India\u2019s published IMNCI algorithm. The engine checks age-specific respiratory rate thresholds, general danger signs, and physical severity signs exactly as the protocol specifies. Each result cites the specific rule that fired.",
              },
              {
                icon: Lock,
                title: "Missing data blocks classification",
                body: "When a field cannot be extracted with confidence, the system marks it as unknown and blocks the classification entirely. It does not guess, default to a safe value, or skip the field. A health worker must confirm every fact before the protocol can run.",
              },
              {
                icon: Shield,
                title: "A human confirms every result",
                body: "IMNCI-Safe never acts autonomously. Every extracted fact is shown to a health worker for review. Every classification is presented as a recommendation that requires human confirmation. The tool supports clinical judgment; it does not replace it.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="border border-rule rounded-sm p-5 bg-surface-card">
                  <div className="w-9 h-9 rounded-full bg-surface-inset flex items-center justify-center mb-3">
                    <Icon className="w-4.5 h-4.5 text-ink" />
                  </div>
                  <h3 className="type-body-sm font-semibold text-ink mb-2">
                    {item.title}
                  </h3>
                  <p className="type-caption text-ink-secondary leading-relaxed">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Triage color legend */}
          <div className="mt-10 border border-rule rounded-sm bg-surface-card p-5">
            <h3 className="type-micro text-ink-muted mb-3">
              IMNCI TRIAGE COLOUR CODING
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-sm bg-triage-urgent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="type-body-sm font-semibold text-triage-urgent">PINK</p>
                  <p className="type-caption text-ink-secondary">Severe pneumonia or very severe disease. Urgent referral to hospital.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-sm bg-triage-treatment flex-shrink-0 mt-0.5" />
                <div>
                  <p className="type-body-sm font-semibold text-triage-treatment">YELLOW</p>
                  <p className="type-caption text-ink-secondary">Pneumonia. Outpatient medical treatment and advice.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-sm bg-triage-homecare flex-shrink-0 mt-0.5" />
                <div>
                  <p className="type-body-sm font-semibold text-triage-homecare">GREEN</p>
                  <p className="type-caption text-ink-secondary">No pneumonia: cough or cold. Home care advice.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-rule bg-surface-card">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-ink" />
                <span className="type-body-sm font-semibold text-ink">IMNCI-Safe</span>
              </div>
              <p className="type-caption text-ink-muted">
                Clinical decision support for community health workers. Classifications are grounded in the Government of India IMNCI protocol.
              </p>
            </div>
            <p className="type-caption text-ink-muted">
              Not a replacement for clinical judgment. A human confirms every result.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
