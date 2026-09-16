"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  FileText,
  Camera,
  AlertCircle,
  Sparkles,
  Upload,
  X,
  RotateCcw,
  Info,
} from "lucide-react";
import { GUIDED_DEMO_CASES, DemoCaseMeta } from "@/lib/fixtures";

interface SpeechRecognitionResultItem {
  transcript: string;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: { [index: number]: SpeechRecognitionResultItem };
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent {
  error: string;
}
interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

export interface InputPanelProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onExtract?: (
    overrideText?: string,
    demoCaseId?: string,
    imageBase64?: string | null,
    modality?: "voice" | "text" | "photo"
  ) => void;
  onProcessNotes?: () => void;
  inputError?: string | null;
  isExtracting?: boolean;
  isProcessing?: boolean;
  isDisabled?: boolean;
  shakeInput?: boolean;
  selectedDemoCaseId?: string | null;
  onSelectDemoCase?: (demoCase: DemoCaseMeta) => void;
}

export function InputPanel({
  inputText,
  onInputChange,
  onExtract,
  onProcessNotes,
  inputError = null,
  isExtracting = false,
  isProcessing = false,
  isDisabled = false,
  shakeInput = false,
  selectedDemoCaseId = null,
  onSelectDemoCase,
}: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<"voice" | "text" | "photo">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  });
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const busy = isExtracting || isProcessing;

  const getSpeechRecognitionClass = useCallback((): (new () => BrowserSpeechRecognition) | null => {
    if (typeof window === "undefined") return null;
    const w = window as unknown as Record<string, unknown>;
    const ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    return typeof ctor === "function" ? (ctor as unknown as new () => BrowserSpeechRecognition) : null;
  }, []);

  const startRecording = useCallback(() => {
    setSpeechError(null);
    setRecordingSeconds(0);
    const SR = getSpeechRecognitionClass();
    if (!SR) {
      setSpeechSupported(false);
      setSpeechError("Speech recognition not supported. Use text input or a demo case.");
      return;
    }
    try {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "hi-IN";
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        if (transcript.trim()) onInputChange(transcript.trim());
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setSpeechError("Microphone access denied. Type notes or use a demo case.");
        } else if (event.error !== "no-speech") {
          setSpeechError(`Speech error: ${event.error}`);
        }
      };
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechError("Could not start microphone.");
      setIsRecording(false);
    }
  }, [getSpeechRecognitionClass, onInputChange]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleProcessClick = () => {
    if (isRecording) stopRecording();
    if (onProcessNotes) onProcessNotes();
    else if (onExtract) onExtract(undefined, undefined, photoPreview, activeTab);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image exceeds 5MB limit.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPhotoError("Upload a valid image (PNG, JPG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      if (!inputText.trim()) onInputChange("Clinical note photo attached.");
    };
    reader.onerror = () => setPhotoError("Failed to read photo.");
    reader.readAsDataURL(file);
  };

  return (
    <div
      data-testid="input-panel"
      className={`flex flex-col gap-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 sm:p-5 ${
        shakeInput ? "animate-shake" : ""
      }`}
    >
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]" />
          <h2 className="type-h3 text-[var(--color-text)]">
            Clinical Observations
          </h2>
        </div>
        <p className="type-small text-[var(--color-text-secondary)]">
          Enter observations in Hindi, English, or mixed language exactly as spoken by the caregiver.
        </p>
      </div>

      {/* Demo Cases */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand)]" />
          <span className="type-caption text-[var(--color-text)]">Quick Demo Cases</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {GUIDED_DEMO_CASES.map((demo) => {
            const isSelected = selectedDemoCaseId === demo.id;
            return (
              <button
                key={demo.id}
                type="button"
                onClick={() => onSelectDemoCase ? onSelectDemoCase(demo) : undefined}
                className={`p-2.5 text-left rounded-md border transition-all ${
                  isSelected
                    ? "bg-[var(--color-brand)]/10 border-[var(--color-brand)]/40"
                    : "bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-elevated)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="type-micro text-[var(--color-text)]">{demo.label}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    demo.tag === "Urgent" ? "bg-[var(--color-pink-bg)] text-[var(--color-pink)] border-[var(--color-pink-border)]" :
                    demo.tag === "Incomplete" ? "bg-[var(--color-yellow-bg)] text-[var(--color-yellow)] border-[var(--color-yellow-border)]" :
                    "bg-[var(--color-green-bg)] text-[var(--color-green)] border-[var(--color-green-border)]"
                  }`}>
                    {demo.tag}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] line-clamp-2 leading-snug">
                  {demo.description}
                </p>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)]">
          <Info className="w-3 h-3 shrink-0" />
          <span>Synthetic data only — not from real patients.</span>
        </div>
      </div>

      {/* Input Modality Tabs */}
      <div className="flex p-0.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
        {([
          { key: "text" as const, icon: FileText, label: "Type" },
          { key: "voice" as const, icon: Mic, label: "Speak" },
          { key: "photo" as const, icon: Camera, label: "Photo" },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-md transition-all ${
              activeTab === key
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Voice Tab */}
      {activeTab === "voice" && (
        <div className="flex flex-col gap-3 p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                isRecording
                  ? "bg-[var(--color-pink)] text-white animate-pulse"
                  : "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]"
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text)]">
                  {isRecording ? "Listening..." : "Microphone Input"}
                </span>
                {isRecording && (
                  <span className="font-mono text-xs font-bold text-[var(--color-pink)] bg-[var(--color-card)] px-2 py-0.5 rounded border border-[var(--color-pink-border)]">
                    {formatSeconds(recordingSeconds)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {isRecording ? "Transcript updates live below." : "Press mic to dictate."}
              </p>
            </div>
          </div>
          {speechError && (
            <div className="flex items-start gap-2 p-2.5 bg-[var(--color-yellow-bg)] border border-[var(--color-yellow-border)] rounded-md text-xs text-[var(--color-yellow)]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{speechError}</span>
            </div>
          )}
          {!speechSupported && (
            <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-card)] p-2.5 rounded-md border border-[var(--color-border)]">
              Speech not supported in this browser. Use Type tab or demo cases.
            </div>
          )}
        </div>
      )}

      {/* Photo Tab */}
      {activeTab === "photo" && (
        <div className="flex flex-col gap-3 p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg animate-fade-in">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          {photoError && (
            <div className="flex items-start gap-2 p-2.5 bg-[var(--color-pink-bg)] border border-[var(--color-pink-border)] rounded-md text-xs text-[var(--color-pink)]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{photoError}</span>
              <button onClick={() => setPhotoError(null)} className="ml-auto p-0.5"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {photoPreview ? (
            <div className="relative border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-card)] p-2">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                <span className="text-[11px] font-semibold text-[var(--color-text)]">Attached Photo</span>
                <button onClick={() => setPhotoPreview(null)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X className="w-4 h-4" /></button>
              </div>
              <div className="max-h-40 overflow-hidden flex items-center justify-center bg-[var(--color-surface)] rounded mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Clinical note" className="max-h-40 object-contain" />
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--color-border-strong)] rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--color-brand)] hover:bg-[var(--color-card)] transition-all text-center"
            >
              <Upload className="w-6 h-6 text-[var(--color-text-muted)]" />
              <span className="text-xs font-medium text-[var(--color-text)]">Click to upload or drag & drop</span>
              <p className="text-[11px] text-[var(--color-text-muted)]">PNG, JPG up to 5MB</p>
            </div>
          )}
        </div>
      )}

      {/* Textarea */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="field-input" className="text-xs font-semibold text-[var(--color-text)]">
            {activeTab === "voice" ? "Live Transcript (editable)" : "Clinical Notes"}
          </label>
          <div className="flex items-center gap-2">
            {inputText.trim().length > 0 && (
              <button
                type="button"
                onClick={() => onInputChange("")}
                className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
            <span className="text-[11px] font-mono text-[var(--color-text-muted)] tabular-nums">
              {inputText.length}
            </span>
          </div>
        </div>
        <textarea
          id="field-input"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={busy || isDisabled}
          placeholder="e.g. 18-month-old child, cough for 3 days, fast breathing, not drinking well…"
          rows={5}
          className="w-full text-sm text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-border-focus)] placeholder-[var(--color-text-muted)] transition-colors resize-y min-h-[120px]"
        />
      </div>

      {/* Error */}
      {inputError && (
        <div className="flex items-start gap-2 p-3 bg-[var(--color-pink-bg)] border border-[var(--color-pink-border)] rounded-lg text-xs text-[var(--color-pink)]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{inputError}</span>
        </div>
      )}

      {/* CTA */}
      <div className="pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <p className="text-[11px] text-[var(--color-text-muted)] sm:max-w-xs">
          AI extracts facts. Rules decide the classification. You verify everything.
        </p>
        <button
          type="button"
          onClick={handleProcessClick}
          disabled={busy || isDisabled || (!inputText.trim() && !photoPreview)}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            busy || isDisabled || (!inputText.trim() && !photoPreview)
              ? "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
              : "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white shadow-md hover:shadow-lg active:scale-[0.98]"
          }`}
        >
          {busy ? (
            <>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              <span>Extracting…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Extract Clinical Findings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
