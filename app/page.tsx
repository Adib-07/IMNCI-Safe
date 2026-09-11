"use client";

import React, { useState } from "react";
import { ImnciAssessment } from "@/lib/types";
import { evaluateImnciProtocol } from "@/lib/imnci-rules";
import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { VerificationPanel } from "@/components/VerificationPanel";
import { ReferralCard } from "@/components/ReferralCard";

export default function ImnciDashboard() {
  const [inputText, setInputText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [assessment, setAssessment] = useState<ImnciAssessment | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const protocolResult = assessment ? evaluateImnciProtocol(assessment) : null;

  const handleExtract = async (overrideText?: string, useMockId?: string) => {
    const textToAnalyze = overrideText !== undefined ? overrideText : inputText;
    if (!textToAnalyze.trim()) return;

    setIsExtracting(true);
    setAssessment(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: useMockId ? useMockId : textToAnalyze,
          useMock: !!useMockId,
        }),
      });
      const data = await res.json();
      setAssessment(data.assessment);
      setIsFallback(data.isFallback);
    } catch (err) {
      console.error(err);
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
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <Header onReset={resetAll} showReset={!!assessment || isExtracting} />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[2fr_2fr_1.5fr] gap-4 md:gap-5 items-start">
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
          <div className="hidden lg:flex bg-surface-card border border-border-default rounded-[6px] items-center justify-center py-10">
            <div className="text-center px-6">
              <div className="w-12 h-12 rounded-full bg-surface-inset flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-text-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5m-4.25-11.396c.251.023.501.05.75.082M12 21a8.966 8.966 0 0 1-5.982-2.275M12 21a8.966 8.966 0 0 0 5.982-2.275M15.75 3.186a24.287 24.287 0 0 1 2.25.114M12 21c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3Z"
                  />
                </svg>
              </div>
              <p className="type-body text-text-secondary mb-1">
                Paste clinical notes and extract
              </p>
              <p className="type-caption text-text-tertiary">
                Or select a demo case to begin
              </p>
            </div>
          </div>
        )}

        {!assessment && !isExtracting && (
          <div className="lg:hidden" />
        )}

        {/* Panel 3: Referral Card */}
        <ReferralCard result={protocolResult} />
      </main>
    </div>
  );
}
