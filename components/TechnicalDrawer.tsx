"use client";

import React, { useState } from "react";
import { 
  X, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  FileJson,
  Layers
} from "lucide-react";
import type { 
  GeminiExtractionResponse, 
  ProtocolResult, 
  ImnciAssessment 
} from "@/lib/types";

interface TechnicalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  extraction: GeminiExtractionResponse | null;
  assessment?: ImnciAssessment | null;
  result: ProtocolResult | null;
  latencyMs?: number | null;
  modelUsed?: string;
}

export function TechnicalDrawer({
  isOpen,
  onClose,
  extraction,
  result,
  latencyMs,
  modelUsed = "gemini-2.5-flash",
}: TechnicalDrawerProps) {
  const [activeTab, setActiveTab] = useState<"json" | "rules" | "safety">("json");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-[#10232D] border-l border-[rgba(160,220,216,0.16)] shadow-2xl flex flex-col transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#0B1720] text-[#EAF7F5] border-b border-[rgba(160,220,216,0.16)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#15313A] border border-[rgba(160,220,216,0.2)] flex items-center justify-center text-[#2BB7A9]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#EAF7F5]">
              Technical Trace & Protocol Engine
            </h3>
            <span className="text-[11px] text-[#78979B]">
              Deterministic rule trace & Gemini response inspection
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#78979B] hover:text-[#EAF7F5] hover:bg-[#15313A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Meta Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#15313A] text-[#A8C3C5] text-xs border-b border-[rgba(160,220,216,0.1)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#2BB7A9]" />
            <span>Model: <strong className="text-[#EAF7F5] font-mono">{modelUsed}</strong></span>
          </span>
          {latencyMs && (
            <span className="text-[#78979B]">
              Latency: <strong className="text-[#73DED0] font-mono">{latencyMs}ms</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#49C589] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Strict Schema Verified</span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-[rgba(160,220,216,0.1)] bg-[#0B1720] px-4">
        <button
          onClick={() => setActiveTab("json")}
          className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "json"
              ? "border-[#2BB7A9] text-[#73DED0] bg-[#10232D]"
              : "border-transparent text-[#78979B] hover:text-[#EAF7F5]"
          }`}
        >
          <FileJson className="w-3.5 h-3.5" />
          <span>Gemini Structured Output</span>
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "rules"
              ? "border-[#2BB7A9] text-[#73DED0] bg-[#10232D]"
              : "border-transparent text-[#78979B] hover:text-[#EAF7F5]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Deterministic Rule Trace</span>
        </button>
        <button
          onClick={() => setActiveTab("safety")}
          className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "safety"
              ? "border-[#2BB7A9] text-[#73DED0] bg-[#10232D]"
              : "border-transparent text-[#78979B] hover:text-[#EAF7F5]"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Safety Architecture</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 font-mono text-xs bg-[#10232D]">
        {/* Tab 1: Gemini JSON */}
        {activeTab === "json" && (
          <div className="space-y-4 font-sans">
            <div className="flex items-center justify-between text-xs text-[#A8C3C5]">
              <span>Structured extraction returned via Google GenAI responseSchema:</span>
              <span className="text-[10px] text-[#73DED0] font-semibold bg-[#15313A] px-2 py-0.5 rounded border border-[rgba(160,220,216,0.2)]">
                JSON Type-Safe
              </span>
            </div>

            {extraction ? (
              <pre className="bg-[#0B1720] text-[#EAF7F5] p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed border border-[rgba(160,220,216,0.16)] font-mono">
                {JSON.stringify(extraction, null, 2)}
              </pre>
            ) : (
              <div className="text-[#78979B] p-8 text-center italic bg-[#15313A] rounded-lg border border-[rgba(160,220,216,0.1)]">
                Run an assessment in Step 1 to inspect the Gemini structured output.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Deterministic Rule Trace */}
        {activeTab === "rules" && (
          <div className="space-y-4 font-sans text-xs">
            <div className="bg-[#15313A] border border-[rgba(160,220,216,0.16)] rounded-lg p-3">
              <div className="font-bold text-[#EAF7F5] mb-1">
                Deterministic Rule Engine: <span className="font-mono text-[#73DED0]">lib/imnci-rules.ts</span>
              </div>
              <p className="text-[#A8C3C5] text-[11px]">
                The rule engine evaluates structured facts purely through deterministic code logic. Zero LLM in triage classification.
              </p>
            </div>

            {result ? (
              <div className="space-y-3">
                <div className="border border-[rgba(160,220,216,0.16)] rounded-lg p-4 bg-[#15313A] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#EAF7F5]">Triggered Rule:</span>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#0B1720] text-[#73DED0] border border-[rgba(160,220,216,0.2)]">
                      {result.rule_id || result.matchedRule || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#78979B] block text-[11px]">Classification Name:</span>
                    <span className="font-bold text-[#EAF7F5]">{result.classification_name}</span>
                  </div>
                  <div>
                    <span className="text-[#78979B] block text-[11px]">Triage Color:</span>
                    <span className={`font-bold font-mono ${
                      result.triage_color === "PINK" ? "text-[#E75D5D]" :
                      result.triage_color === "YELLOW" || result.triage_color === "AMBER" ? "text-[#F2B84B]" :
                      "text-[#49C589]"
                    }`}>
                      {result.triage_color}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#78979B] block text-[11px]">Rule Rationale:</span>
                    <span className="text-[#A8C3C5]">{result.rule_description}</span>
                  </div>
                  <div>
                    <span className="text-[#78979B] block text-[11px]">Protocol Citation:</span>
                    <span className="text-[#78979B] italic">{result.protocol_citation}</span>
                  </div>
                </div>

                {/* Missing Parameters */}
                {(result.missing_parameters?.length ?? 0) > 0 && (
                  <div className="border border-[#F2B84B]/40 bg-[#0B1720] rounded-lg p-3">
                    <span className="font-bold text-[#F2B84B] block mb-1">
                      Missing Parameters Triggering Protocol Gating:
                    </span>
                    <ul className="list-disc list-inside text-[#A8C3C5] space-y-0.5">
                      {result.missing_parameters?.map((p, i) => (
                        <li key={i} className="font-mono text-[11px]">{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[#78979B] p-8 text-center italic bg-[#15313A] rounded-lg border border-[rgba(160,220,216,0.1)]">
                Confirm clinical facts to view the execution trace.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Safety Architecture */}
        {activeTab === "safety" && (
          <div className="space-y-4 font-sans text-xs text-[#A8C3C5] leading-relaxed">
            <div className="bg-[#15313A] border border-[rgba(160,220,216,0.2)] rounded-lg p-3 text-[#EAF7F5]">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-[#73DED0]">
                <ShieldCheck className="w-4 h-4 text-[#2BB7A9]" />
                <span>The Core Universal Bridge Paradigm</span>
              </div>
              <p className="text-[11px] text-[#A8C3C5]">
                Frontline healthcare workers think and communicate in natural, messy, multilingual dialect. Clinical protocols require rigid boolean criteria. Gemini bridges the human intent, and a deterministic code layer enforces protocol integrity.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-[#EAF7F5]">Why LLMs Do Not Classify Triage:</div>
              <p>
                1. <strong className="text-[#EAF7F5]">Deterministic Reproducibility:</strong> Clinical rules (WHO/Indian IMNCI guidelines) have strict, zero-tolerance branch paths. LLM temperature introduces stochastic variability unacceptable in clinical triage.
              </p>
              <p>
                2. <strong className="text-[#EAF7F5]">Gating Safety:</strong> An LLM might hallucinate that an unmentioned symptom is &quot;safe&quot; or &quot;normal&quot;. Our deterministic rules engine treats unknown parameters as <em>insufficient information</em>, blocking routine triage until the health worker verifies the child.
              </p>
              <p>
                3. <strong className="text-[#EAF7F5]">Human in the Loop:</strong> The health worker remains the primary clinical authority. They inspect extracted facts, check verbatim quotes, correct counts, and explicitly authorize the handoff.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-[#0B1720] border-t border-[rgba(160,220,216,0.12)] flex items-center justify-between text-[11px] text-[#78979B]">
        <span>IMNCI Safe Hackathon Decision Support</span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-[#15313A] border border-[rgba(160,220,216,0.2)] rounded text-[#EAF7F5] font-semibold hover:bg-[#10232D]"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}

