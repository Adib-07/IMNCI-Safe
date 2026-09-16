"use client";

import React, { useState } from "react";
import {
  X,
  Terminal,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  FileJson,
  Layers,
} from "lucide-react";
import type {
  GeminiExtractionResponse,
  ProtocolResult,
  ImnciAssessment,
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
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-brand)]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text)]">Technical Trace</h3>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Rule trace &amp; extraction inspection
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[var(--color-card)] text-xs border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <Cpu className="w-3.5 h-3.5 text-[var(--color-brand)]" />
            <span>Model: <strong className="text-[var(--color-text)] font-mono">{modelUsed}</strong></span>
          </span>
          {latencyMs && (
            <span className="text-[var(--color-text-muted)]">
              Latency: <strong className="text-[var(--color-brand-light)] font-mono">{latencyMs}ms</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[var(--color-green)] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Schema Validated</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4">
        {([
          { key: "json" as const, icon: FileJson, label: "Extraction" },
          { key: "rules" as const, icon: Layers, label: "Rules Trace" },
          { key: "safety" as const, icon: ShieldCheck, label: "Safety" },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === key
                ? "border-[var(--color-brand)] text-[var(--color-brand-light)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 text-xs bg-[var(--color-surface)]">
        {activeTab === "json" && (
          <div className="space-y-4">
            {extraction ? (
              <pre className="bg-[var(--color-bg)] text-[var(--color-text)] p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed border border-[var(--color-border)] font-mono">
                {JSON.stringify(extraction, null, 2)}
              </pre>
            ) : (
              <div className="text-[var(--color-text-muted)] p-8 text-center italic bg-[var(--color-card)] rounded-lg border border-[var(--color-border)]">
                Run an assessment to inspect the extraction output.
              </div>
            )}
          </div>
        )}

        {activeTab === "rules" && (
          <div className="space-y-4">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-3">
              <div className="font-bold text-[var(--color-text)] mb-1">
                Deterministic Rule Engine
              </div>
              <p className="text-[var(--color-text-secondary)] text-[11px]">
                Pure TypeScript logic — zero LLM calls in the classification path.
              </p>
            </div>
            {result ? (
              <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-card)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--color-text)]">Rule:</span>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-brand-light)] border border-[var(--color-border)]">
                    {result.rule_id || result.matchedRule || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Classification:</span>
                  <span className="font-bold text-[var(--color-text)]">{result.classification_name}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Triage:</span>
                  <span className={`font-bold font-mono ${
                    result.triage_color === "PINK" ? "text-[var(--color-pink)]" :
                    result.triage_color === "YELLOW" || result.triage_color === "AMBER" ? "text-[var(--color-yellow)]" :
                    "text-[var(--color-green)]"
                  }`}>
                    {result.triage_color}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Rationale:</span>
                  <span className="text-[var(--color-text-secondary)]">{result.rule_description}</span>
                </div>
              </div>
            ) : (
              <div className="text-[var(--color-text-muted)] p-8 text-center italic bg-[var(--color-card)] rounded-lg border border-[var(--color-border)]">
                Confirm facts to view the rule trace.
              </div>
            )}
          </div>
        )}

        {activeTab === "safety" && (
          <div className="space-y-4 text-[var(--color-text-secondary)] leading-relaxed">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-3">
              <div className="font-bold text-[var(--color-text)] mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[var(--color-brand)]" />
                Safety Architecture
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                AI extracts. Human verifies. Deterministic rules decide.
              </p>
            </div>
            <div className="space-y-2 text-[11px]">
              <p><strong className="text-[var(--color-text)]">Why LLMs Don&apos;t Classify:</strong> Clinical rules have strict branch paths. LLM temperature introduces stochastic variability unacceptable in triage.</p>
              <p><strong className="text-[var(--color-text)]">Unknown Safety:</strong> An LLM might hallucinate that an unmentioned symptom is &quot;safe&quot;. Our rules engine treats unknown as insufficient information, blocking classification.</p>
              <p><strong className="text-[var(--color-text)]">Human Authority:</strong> The health worker inspects facts, corrects counts, and explicitly authorizes handoff.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
        <span>IMNCI-Safe</span>
        <button onClick={onClose} className="px-3 py-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded text-[var(--color-text)] text-xs font-semibold hover:bg-[var(--color-surface)]">
          Close
        </button>
      </div>
    </div>
  );
}
