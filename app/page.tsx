"use client";

import React, { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Pipeline, PipelineStageKey } from "@/components/Pipeline";
import { InputPanel } from "@/components/InputPanel";
import { VerificationPanel } from "@/components/VerificationPanel";
import { ReferralCard } from "@/components/ReferralCard";
import { ReferralHandoffModal } from "@/components/ReferralHandoffModal";
import { TechnicalDrawer } from "@/components/TechnicalDrawer";
import { evaluateImnciRules } from "@/lib/imnci-rules";
import { GUIDED_DEMO_CASES, DemoCaseMeta } from "@/lib/fixtures";
import { 
  ShieldCheck, 
  Columns,
  Maximize2
} from "lucide-react";
import type { 
  ImnciAssessment, 
  GeminiExtractionResponse, 
  ProtocolResult 
} from "@/lib/types";

export default function ImnciDashboard() {
  // Navigation & Step tracking: 1 = Assess, 2 = Review, 3 = Handoff
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [viewMode, setViewMode] = useState<"step" | "all">("all");

  // Core input & execution state
  const [inputText, setInputText] = useState("");
  const [selectedDemoCaseId, setSelectedDemoCaseId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Extracted clinical facts & deterministic rules result
  const [extraction, setExtraction] = useState<GeminiExtractionResponse | null>(null);
  const [assessment, setAssessment] = useState<ImnciAssessment | null>(null);
  const [protocolResult, setProtocolResult] = useState<ProtocolResult | null>(null);
  const [hasUserModified, setHasUserModified] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Pipeline stage tracking
  const [pipelineStage, setPipelineStage] = useState<PipelineStageKey | "idle">("idle");

  // Technical drawer & handoff modal visibility
  const [isTechnicalViewOpen, setIsTechnicalViewOpen] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);

  // Check if user can navigate to given step
  const canNavigateToStep = useCallback((step: 1 | 2 | 3) => {
    if (step === 1) return true;
    if (step === 2) return Boolean(assessment || extraction || isExtracting);
    if (step === 3) return Boolean(protocolResult || assessment);
    return false;
  }, [assessment, extraction, isExtracting, protocolResult]);

  // Handle guided demo selection
  const handleSelectDemoCase = useCallback((demoCase: DemoCaseMeta) => {
    setSelectedDemoCaseId(demoCase.id);
    setInputText(demoCase.text || demoCase.sampleText || "");
    setInputError(null);
    setIsConfirmed(false);
  }, []);

  // Handle Extraction request
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
        setInputError("Please enter clinical observations, record speech, or select a demo scenario.");
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
          body: JSON.stringify({
            text: textToExtract,
            demoCaseId: activeDemoId,
            imageBase64,
            inputModality: modality,
          }),
        });

        const data = await response.json();
        const duration = Date.now() - startTime;
        setLatencyMs(duration);

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to extract clinical facts");
        }

        const ext: GeminiExtractionResponse = data.extraction || data.assessment?.structuredExtraction;
        const baseAssessment: ImnciAssessment = data.assessment;

        setExtraction(ext);
        setAssessment(baseAssessment);
        setIsFallback(data.isFallback || false);
        setHasUserModified(false);

        // Advance pipeline stage and active step
        const missingCount = (ext?.missing_critical_fields && ext.missing_critical_fields.length) || 
                             (ext?.missing_critical_information && ext.missing_critical_information.length) || 0;
        setPipelineStage(missingCount > 0 ? "missing_check" : "structured");

        // Evaluate deterministic rules immediately
        const evaluatedResult = evaluateImnciRules(baseAssessment);
        setProtocolResult(evaluatedResult);

        // Automatically progress to Step 2 (Review) so the frontline health worker reviews the facts
        setActiveStep(2);
      } catch (err: unknown) {
        console.error("Extraction failed:", err);
        const errorMsg = err instanceof Error ? err.message : "Extraction service temporarily unavailable. Please try again or load a demo scenario.";
        setInputError(errorMsg);
        setPipelineStage("input");
      } finally {
        setIsExtracting(false);
      }
    },
    [inputText, selectedDemoCaseId]
  );

  // Handle manual field adjustments in Verification Panel
  const handleUpdateField = useCallback(
    (key: string, value: boolean | string | number | null, isDangerSign = false) => {
      if (!assessment) return;

      setIsConfirmed(false);
      setAssessment((prev) => {
        if (!prev) return prev;
        const updated: ImnciAssessment = { 
          ...prev,
          facts: {
            ...prev.facts,
            danger_signs: { ...prev.facts.danger_signs }
          }
        };

        if (isDangerSign) {
          const booleanVal = value === "unknown" ? "unknown" : Boolean(value);
          updated.danger_signs = {
            ...updated.danger_signs,
            [key]: booleanVal,
          };
          if (key === "convulsions" || key === "has_convulsions") {
            updated.facts.danger_signs.has_convulsions = booleanVal;
          } else if (key === "unable_to_drink" || key === "unable_to_drink_or_breastfeed") {
            updated.facts.danger_signs.unable_to_drink_or_breastfeed = booleanVal;
          } else if (key === "vomiting_everything" || key === "vomits_everything") {
            updated.facts.danger_signs.vomits_everything = booleanVal;
          } else if (key === "lethargic_or_unconscious") {
            updated.facts.danger_signs.lethargic_or_unconscious = booleanVal;
          }
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

        // Re-evaluate deterministic rules immediately
        const newResult = evaluateImnciRules(updated);
        setProtocolResult(newResult);

        return updated;
      });

      setHasUserModified(true);
      setPipelineStage("rules_engine");
    },
    [assessment]
  );

  // Worker confirms facts explicitly
  const handleConfirmAndEvaluate = useCallback(() => {
    if (!assessment) return;
    const finalResult = evaluateImnciRules(assessment);
    setProtocolResult(finalResult);
    setIsConfirmed(true);
    setPipelineStage("confirmed");
    setActiveStep(3); // Progress to Handoff step
  }, [assessment]);

  const handleConfirmDecision = useCallback(() => {
    setIsConfirmed((prev) => !prev);
  }, []);

  // Reset entire assessment
  const handleReset = useCallback(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1720] text-[#EAF7F5] flex flex-col font-sans selection:bg-[#2BB7A9] selection:text-[#0B1720]">
      {/* Header */}
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

      {/* Main Clinical Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">
        {/* Workspace Top Banner / Purpose Statement */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(160,220,216,0.14)] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-[#15313A] text-[#73DED0] border border-[rgba(160,220,216,0.2)] uppercase">
                CLINICAL DECISION SUPPORT PROTOTYPE
              </span>
              <span className="text-[11px] text-[#A8C3C5] font-medium hidden sm:inline">
                Integrated Management of Neonatal and Childhood Illness
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#EAF7F5] tracking-tight">
              Frontline Protocol Decision Support
            </h1>
            <p className="text-xs text-[#A8C3C5] mt-1 max-w-2xl leading-relaxed">
              Turns messy field observations into a structured IMNCI assessment. Gemini extracts clinical facts; a transparent protocol-checking layer verifies missing information and evaluates a limited rule subset. Frontline workers confirm facts before referral handoff.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {/* View Mode Switcher: 3-Area Overview vs Focused Step */}
            <div className="hidden lg:flex items-center bg-[#10232D] border border-[rgba(160,220,216,0.16)] rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                  viewMode === "all"
                    ? "bg-[#2BB7A9] text-[#0B1720]"
                    : "text-[#A8C3C5] hover:text-[#EAF7F5]"
                }`}
                title="View all 3 areas simultaneously"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>3-Area Layout</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("step")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                  viewMode === "step"
                    ? "bg-[#2BB7A9] text-[#0B1720]"
                    : "text-[#A8C3C5] hover:text-[#EAF7F5]"
                }`}
                title="Focus on current active step"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Focused Step</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsTechnicalViewOpen(true)}
              className="text-xs font-semibold text-[#A8C3C5] hover:text-[#EAF7F5] bg-[#10232D] hover:bg-[#15313A] border border-[rgba(160,220,216,0.2)] px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Inspection & Trace
            </button>
          </div>
        </div>

        {/* Safety Pipeline Stepper */}
        <div>
          <Pipeline 
            currentStage={pipelineStage} 
            activeStep={activeStep}
            onSelectStep={(s) => setActiveStep(s)}
            canNavigateToStep={canNavigateToStep}
          />
        </div>

        {/* Clinical Workspace Areas (Responsive Layout) */}
        {viewMode === "all" ? (
          /* 3-Column / 3-Area Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Area 1: Assess (Messy Observations) */}
            <div className={`lg:col-span-4 flex flex-col gap-4 ${activeStep === 1 ? "ring-1 ring-[#2BB7A9]/40 rounded-xl" : ""}`}>
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

            {/* Area 2: Review (Structured Clinical Findings) */}
            <div className={`lg:col-span-4 flex flex-col gap-4 ${activeStep === 2 ? "ring-1 ring-[#2BB7A9]/40 rounded-xl" : ""}`}>
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

            {/* Area 3: Handoff (Deterministic Triage & Handoff Card) */}
            <div className={`lg:col-span-4 flex flex-col gap-4 ${activeStep === 3 ? "ring-1 ring-[#2BB7A9]/40 rounded-xl" : ""}`}>
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
        ) : (
          /* Focused Step View (Single area with clean navigation) */
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
            {activeStep === 1 && (
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
            )}

            {activeStep === 2 && (
              <div className="flex flex-col gap-4">
                <VerificationPanel
                  extraction={extraction}
                  assessment={assessment}
                  protocolResult={protocolResult}
                  isExtracting={isExtracting}
                  onUpdateField={handleUpdateField}
                  onConfirmAndEvaluate={handleConfirmAndEvaluate}
                  hasUserModified={hasUserModified}
                />
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs text-[#A8C3C5] hover:text-[#EAF7F5] bg-[#10232D] border border-[rgba(160,220,216,0.16)] px-3 py-1.5 rounded-lg"
                  >
                    &larr; Back to Step 1 (Assess)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    disabled={!protocolResult}
                    className="text-xs text-[#0B1720] font-bold bg-[#2BB7A9] hover:bg-[#73DED0] px-4 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    Proceed to Step 3 (Handoff) &rarr;
                  </button>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="flex flex-col gap-4">
                <ReferralCard
                  result={protocolResult}
                  assessment={assessment}
                  isConfirmed={isConfirmed}
                  onConfirmDecision={handleConfirmDecision}
                  onOpenHandoffModal={() => setIsHandoffModalOpen(true)}
                  onReset={handleReset}
                  isExtracting={isExtracting}
                />
                <div className="flex items-center justify-start pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="text-xs text-[#A8C3C5] hover:text-[#EAF7F5] bg-[#10232D] border border-[rgba(160,220,216,0.16)] px-3 py-1.5 rounded-lg"
                  >
                    &larr; Back to Step 2 (Review)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Medical Protocol Scope & Safeguards Reference Bar */}
        <div className="mt-4 bg-[#10232D] border border-[rgba(160,220,216,0.14)] rounded-xl p-4 sm:p-5 text-xs text-[#A8C3C5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2BB7A9]" />
              <strong className="text-[#EAF7F5] font-semibold">
                WHO / Ministry of Health and Family Welfare (India) IMNCI Protocol Scope
              </strong>
            </div>
            <p className="text-[11px] text-[#78979B] leading-relaxed">
              Limited prototype subset: <em>Acute Respiratory Infection & General Danger Signs for Children 2–59 Months</em>. Evaluates chest indrawing, stridor, and respiratory rate against age-specific thresholds (&ge;50 bpm for 2–11 mo; &ge;40 bpm for 12–59 mo).
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 text-[11px] text-[#73DED0] bg-[#15313A] px-3 py-1.5 rounded-lg border border-[rgba(160,220,216,0.2)]">
            <ShieldCheck className="w-4 h-4 text-[#2BB7A9]" />
            <span>Not an AI Doctor &bull; Human Confirmation Mandatory</span>
          </div>
        </div>
      </main>

      {/* Modals & Technical Drawers */}
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
      <footer className="border-t border-[rgba(160,220,216,0.12)] bg-[#0B1720] py-3.5 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#78979B]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#A8C3C5]">IMNCI-Safe</span>
            <span>&bull;</span>
            <span>Frontline Child-Health Decision Support Prototype</span>
          </div>
          <div className="text-[11px] text-[#78979B]">
            Clinical decision support only. Never replaces qualified clinical judgment.
          </div>
        </div>
      </footer>
    </div>
  );
}
