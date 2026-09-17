"use client";

import React, { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Pipeline, PipelineStageKey } from "@/components/Pipeline";
import { InputPanel } from "@/components/InputPanel";
import { VerificationPanel } from "@/components/VerificationPanel";
import { ReferralCard } from "@/components/ReferralCard";
import { ReferralHandoffModal } from "@/components/ReferralHandoffModal";
import { TechnicalDrawer } from "@/components/TechnicalDrawer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClinicalCaseHeader } from "@/components/ClinicalCaseHeader";
import { evaluateImnciRules } from "@/lib/imnci-rules";
import { GUIDED_DEMO_CASES, DemoCaseMeta } from "@/lib/fixtures";
import { ShieldCheck, AlertCircle } from "lucide-react";
import type {
  ImnciAssessment,
  GeminiExtractionResponse,
  ProtocolResult,
} from "@/lib/types";

export default function ImnciDashboard() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [caseId] = useState(() => `CASE-DEMO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [inputText, setInputText] = useState("");
  const [selectedDemoCaseId, setSelectedDemoCaseId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [extraction, setExtraction] = useState<GeminiExtractionResponse | null>(null);
  const [assessment, setAssessment] = useState<ImnciAssessment | null>(null);
  const [protocolResult, setProtocolResult] = useState<ProtocolResult | null>(null);
  const [hasUserModified, setHasUserModified] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStageKey | "idle">("idle");
  const [isTechnicalViewOpen, setIsTechnicalViewOpen] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const canNavigateToStep = useCallback((step: 1 | 2 | 3) => {
    if (step === 1) return true;
    if (step === 2) return Boolean(assessment || extraction || isExtracting);
    if (step === 3) return Boolean(protocolResult || assessment);
    return false;
  }, [assessment, extraction, isExtracting, protocolResult]);

  const handleSelectDemoCase = useCallback((demoCase: DemoCaseMeta) => {
    setSelectedDemoCaseId(demoCase.id);
    setInputText(demoCase.text || demoCase.sampleText || "");
    setInputError(null);
    setIsConfirmed(false);
  }, []);

  const handleExtract = useCallback(
    async (
      overrideText?: string,
      demoCaseIdOverride?: string,
      imageBase64?: string | null,
      modality: "voice" | "text" | "photo" = "text"
    ) => {
      const textToExtract = (overrideText ?? inputText).trim();
      const activeDemoId = demoCaseIdOverride ?? selectedDemoCaseId;
      if (!textToExtract && !imageBase64 && !activeDemoId) {
        setInputError("Enter observations, record speech, or select a demo case.");
        return;
      }
      setInputError(null);
      setIsExtracting(true);
      setIsConfirmed(false);
      setPipelineStage("extract");
      try {
        const startTime = Date.now();
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToExtract, demoCaseId: activeDemoId, imageBase64, inputModality: modality }),
        });
        const data = await response.json();
        setLatencyMs(Date.now() - startTime);
        if (!response.ok || !data.success) throw new Error(data.error || "Extraction failed");
        const ext: GeminiExtractionResponse = data.extraction || data.assessment?.structuredExtraction;
        const baseAssessment: ImnciAssessment = data.assessment;
        setExtraction(ext);
        setAssessment(baseAssessment);
        setIsFallback(data.isFallback || false);
        setHasUserModified(false);
        const missingCount = (ext?.missing_critical_fields && ext.missing_critical_fields.length) || 0;
        setPipelineStage(missingCount > 0 ? "missing_check" : "structured");
        const evaluatedResult = evaluateImnciRules(baseAssessment);
        setProtocolResult(evaluatedResult);
        setActiveStep(2);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Extraction service unavailable. Try a demo case.";
        setInputError(errorMsg);
        setPipelineStage("input");
      } finally {
        setIsExtracting(false);
      }
    },
    [inputText, selectedDemoCaseId]
  );

  const handleUpdateField = useCallback(
    (key: string, value: boolean | string | number | null, isDangerSign = false) => {
      if (!assessment) return;
      setIsConfirmed(false);
      setAssessment((prev) => {
        if (!prev) return prev;
        const updated: ImnciAssessment = {
          ...prev,
          facts: { ...prev.facts, danger_signs: { ...prev.facts.danger_signs } },
        };
        if (isDangerSign) {
          const booleanVal = value === "unknown" ? "unknown" : Boolean(value);
          updated.danger_signs = { ...updated.danger_signs, [key]: booleanVal };
          if (key === "convulsions" || key === "has_convulsions") updated.facts.danger_signs.has_convulsions = booleanVal;
          else if (key === "unable_to_drink" || key === "unable_to_drink_or_breastfeed") updated.facts.danger_signs.unable_to_drink_or_breastfeed = booleanVal;
          else if (key === "vomiting_everything" || key === "vomits_everything") updated.facts.danger_signs.vomits_everything = booleanVal;
          else if (key === "lethargic_or_unconscious") updated.facts.danger_signs.lethargic_or_unconscious = booleanVal;
        } else if (key === "age_months" || key === "patient_age_months") {
          const numVal = value === null || value === "" || value === "unknown" ? "unknown" : Number(value);
          updated.age_months = numVal;
          updated.facts.patient_age_months = numVal;
        } else if (key === "respiratory_rate") {
          const numVal = value === null || value === "" || value === "unknown" ? "unknown" : Number(value);
          updated.respiratory_rate = numVal;
          updated.facts.respiratory_rate = numVal;
        } else if (key === "chest_indrawing") {
          const boolVal = value === "unknown" ? "unknown" : Boolean(value);
          updated.chest_indrawing = boolVal;
          updated.facts.chest_indrawing = boolVal;
        } else if (key === "stridor" || key === "stridor_in_calm_child") {
          const boolVal = value === "unknown" ? "unknown" : Boolean(value);
          updated.stridor = boolVal;
          updated.facts.stridor_in_calm_child = boolVal;
        } else if (key === "cough_duration_days") {
          updated.cough_duration_days = value === null || value === "" ? null : Number(value);
        }
        const newResult = evaluateImnciRules(updated);
        setProtocolResult(newResult);
        return updated;
      });
      setHasUserModified(true);
      setPipelineStage("rules_engine");
    },
    [assessment]
  );

  const handleConfirmAndEvaluate = useCallback(() => {
    if (!assessment) return;
    const finalResult = evaluateImnciRules(assessment);
    setProtocolResult(finalResult);
    setIsConfirmed(true);
    setPipelineStage("confirmed");
    setActiveStep(3);
  }, [assessment]);

  const handleConfirmDecision = useCallback(() => {
    setIsConfirmed((prev) => !prev);
  }, []);

  const performReset = useCallback(() => {
    setInputText("");
    setSelectedDemoCaseId(null);
    setExtraction(null);
    setAssessment(null);
    setProtocolResult(null);
    setInputError(null);
    setIsFallback(null);
    setIsConfirmed(false);
    setPipelineStage("idle");
    setHasUserModified(false);
    setActiveStep(1);
    setShowResetConfirmModal(false);
  }, []);

  const handleReset = useCallback(() => {
    if (assessment || inputText.trim().length > 0) {
      setShowResetConfirmModal(true);
    } else {
      performReset();
    }
  }, [assessment, inputText, performReset]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col font-sans">
        <Header
          onReset={handleReset}
          showReset={!!assessment || !!inputText}
          isFallback={isFallback}
          onToggleTechnicalView={() => setIsTechnicalViewOpen((prev) => !prev)}
          showTechnicalView={isTechnicalViewOpen}
          onOpenGuidedDemo={() => {
            const firstDemo = GUIDED_DEMO_CASES[0];
            handleSelectDemoCase(firstDemo);
            setActiveStep(1);
          }}
          currentStep={activeStep}
          onSelectStep={(s) => setActiveStep(s)}
          canNavigateToStep={canNavigateToStep}
        />

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
          {/* Clinical Encounter Case Header */}
          <ClinicalCaseHeader
            caseId={caseId}
            assessment={assessment}
            result={protocolResult}
            activeStep={activeStep}
            hasUserModified={hasUserModified}
            isConfirmed={isConfirmed}
          />

          {/* Workflow Pipeline */}
          <Pipeline
            currentStage={pipelineStage}
            activeStep={activeStep}
            onSelectStep={(s) => setActiveStep(s)}
            canNavigateToStep={canNavigateToStep}
          />

          {/* Main 3-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Step 1: Input */}
            <div className={`flex flex-col gap-4 ${activeStep === 1 ? "ring-2 ring-[var(--color-brand)]/40 rounded-xl" : ""}`}>
              <InputPanel
                inputText={inputText}
                onInputChange={(text) => {
                  setInputText(text);
                  if (selectedDemoCaseId) setSelectedDemoCaseId(null);
                }}
                onExtract={handleExtract}
                onProcessNotes={() => handleExtract()}
                inputError={inputError}
                isExtracting={isExtracting}
                selectedDemoCaseId={selectedDemoCaseId}
                onSelectDemoCase={handleSelectDemoCase}
              />
            </div>

            {/* Step 2: Verify */}
            <div className={`flex flex-col gap-4 ${activeStep === 2 ? "ring-2 ring-[var(--color-brand)]/40 rounded-xl" : ""}`}>
              <VerificationPanel
                extraction={extraction}
                assessment={assessment}
                protocolResult={protocolResult}
                isExtracting={isExtracting}
                onUpdateField={handleUpdateField}
                onConfirmAndEvaluate={handleConfirmAndEvaluate}
                hasUserModified={hasUserModified}
              />
            </div>

            {/* Step 3: Result */}
            <div className={`flex flex-col gap-4 ${activeStep === 3 ? "ring-2 ring-[var(--color-brand)]/40 rounded-xl" : ""}`}>
              <ReferralCard
                result={protocolResult}
                assessment={assessment}
                isConfirmed={isConfirmed}
                onConfirmDecision={handleConfirmDecision}
                onOpenHandoffModal={() => setIsHandoffModalOpen(true)}
                onReset={handleReset}
                isExtracting={isExtracting}
              />
            </div>
          </div>

          {/* Protocol Scope Banner */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[var(--color-brand)] shrink-0 mt-0.5" />
              <div>
                <span className="type-caption text-[var(--color-text)]">IMNCI Protocol Scope</span>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Prototype subset: Acute Respiratory Infection &amp; General Danger Signs (2–59 months). Evaluates chest indrawing, stridor, and respiratory rate against age-specific thresholds.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-brand-light)] bg-[var(--color-card)] px-2.5 py-1 rounded-md border border-[var(--color-border)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]" />
              Human Confirmation Mandatory
            </div>
          </div>
        </main>

        {/* Reset Confirmation Modal */}
        {showResetConfirmModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
          >
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-pink-bg)] text-[var(--color-pink)] flex items-center justify-center shrink-0 border border-[var(--color-pink-border)]">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="reset-dialog-title" className="text-base font-bold text-[var(--color-text)]">
                    Start New Clinical Assessment?
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    Starting a new encounter will clear current observations and verified clinical parameters. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-elevated)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={performReset}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[var(--color-pink)] hover:opacity-90 text-white transition-opacity shadow-sm"
                >
                  Confirm &amp; Reset Case
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals & Drawers */}
        <ReferralHandoffModal
          isOpen={isHandoffModalOpen}
          onClose={() => setIsHandoffModalOpen(false)}
          result={protocolResult}
          assessment={assessment}
          isConfirmed={isConfirmed}
          onConfirm={handleConfirmDecision}
        />
        <TechnicalDrawer
          isOpen={isTechnicalViewOpen}
          onClose={() => setIsTechnicalViewOpen(false)}
          extraction={extraction}
          assessment={assessment}
          result={protocolResult}
          latencyMs={latencyMs}
        />

        {/* Footer */}
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] py-4 px-4 sm:px-6 mt-auto">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--color-text-secondary)]">IMNCI-Safe</span>
              <span>&bull;</span>
              <span>AI-assisted IMNCI assessment prototype</span>
            </div>
            <span>Clinical decision support only. Never replaces qualified clinical judgment.</span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
