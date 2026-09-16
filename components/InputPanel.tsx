"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Volume2,
  Info
} from "lucide-react";
import { GUIDED_DEMO_CASES, DemoCaseMeta } from "@/lib/fixtures";

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
  };
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
  onExtract?: (overrideText?: string, demoCaseId?: string, imageBase64?: string | null, modality?: "voice" | "text" | "photo") => void;
  onProcessNotes?: () => void;
  inputError?: string | null;
  isExtracting?: boolean;
  isProcessing?: boolean;
  isDisabled?: boolean;
  shakeInput?: boolean;
  selectedDemoCaseId?: string | null;
  onSelectDemoCase?: (demoCase: DemoCaseMeta) => void;
}

// Sample synthetic handwritten clinic slip encoded as SVG data URL
const SAMPLE_CLINIC_SLIP_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23fffef8" stroke="%23cbd5e1" stroke-width="2"/><line x1="40" y1="60" x2="560" y2="60" stroke="%2394a3b8" stroke-dasharray="4"/><line x1="40" y1="120" x2="560" y2="120" stroke="%23cbd5e1"/><line x1="40" y1="180" x2="560" y2="180" stroke="%23cbd5e1"/><line x1="40" y1="240" x2="560" y2="240" stroke="%23cbd5e1"/><line x1="40" y1="300" x2="560" y2="300" stroke="%23cbd5e1"/><text x="50" y="45" font-family="monospace" font-size="14" fill="%230f766e" font-weight="bold">SUB-CENTRE CLINICAL FIELD SLIP - SYNTHETIC</text><text x="50" y="105" font-family="cursive, sans-serif" font-size="18" fill="%231e293b">Patient: Baby of Sunita | Age: 18 months</text><text x="50" y="165" font-family="cursive, sans-serif" font-size="18" fill="%231e293b">Chief Complaint: Cough and fever for 3 days</text><text x="50" y="225" font-family="cursive, sans-serif" font-size="18" fill="%231e293b">Exam: Fast breathing reported by mother</text><text x="50" y="285" font-family="cursive, sans-serif" font-size="18" fill="%23b45309">RR: Not yet counted (Child crying)</text><text x="50" y="345" font-family="cursive, sans-serif" font-size="16" fill="%2364748b">Danger Signs: Doodh thoda leta hai, no convulsions</text></svg>`;

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
  onSelectDemoCase
}: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<"voice" | "text" | "photo">("text");

  // Voice recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    const windowObj = window as unknown as Record<string, unknown>;
    return Boolean(windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition);
  });
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const busy = isExtracting || isProcessing;

  // Helper to get SpeechRecognition constructor
  const getSpeechRecognitionClass = useCallback((): (new () => BrowserSpeechRecognition) | null => {
    if (typeof window === "undefined") return null;
    const windowObj = window as unknown as Record<string, unknown>;
    const ctor = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;
    return typeof ctor === "function" ? (ctor as unknown as new () => BrowserSpeechRecognition) : null;
  }, []);

  // Voice recording timer
  useEffect(() => {
    if (!isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = useCallback(() => {
    setSpeechError(null);
    setRecordingSeconds(0);
    const SpeechRecognitionClass = getSpeechRecognitionClass();

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      setSpeechError("Speech recognition is not supported in this browser. Please use text input or test the audio sample.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Support Hindi / Hinglish and Indian English
      recognition.lang = "hi-IN";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        if (transcript.trim()) {
          onInputChange(transcript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setSpeechError("Microphone access was denied or is unavailable. You can type notes directly or load a guided demo case.");
        } else if (event.error !== "no-speech") {
          setSpeechError(`Speech recognition issue: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech init error:", err);
      setSpeechError("Could not initialize microphone input.");
      setIsRecording(false);
    }
  }, [getSpeechRecognitionClass, onInputChange]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleSimulateVoice = () => {
    const sampleSpeech = "Mera baccha 14 mahine ka hai, subah se jhatke aa rahe the aur doodh bilkul nahi pee pa raha hai, bahot behosh jaisa hai.";
    onInputChange(sampleSpeech);
    setActiveTab("voice");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image size exceeds 5MB limit. Please upload a smaller photo or take a clearer compressed picture.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("Invalid file type. Please upload a valid clinical note image (PNG, JPG, or WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      setPhotoPreview(base64Str);
      setPhotoError(null);
      if (!inputText.trim()) {
        onInputChange("Child note slip photo attached. Please extract clinical facts.");
      }
    };
    reader.onerror = () => {
      setPhotoError("Failed to read the selected photo file. Please try selecting the file again.");
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSampleSlip = () => {
    setPhotoError(null);
    setPhotoPreview(SAMPLE_CLINIC_SLIP_SVG);
    onInputChange("Patient: Baby of Sunita, 18 months. Cough and fever for 3 days. Fast breathing reported. RR not yet counted. Doodh thoda leta hai, no convulsions.");
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleProcessClick = () => {
    if (isRecording) {
      stopRecording();
    }
    if (onProcessNotes) {
      onProcessNotes();
    } else if (onExtract) {
      onExtract(undefined, undefined, photoPreview, activeTab);
    }
  };

  const handleSelectCase = (caseId: string) => {
    const found = GUIDED_DEMO_CASES.find(c => c.id === caseId || c.id.includes(caseId));
    if (found && onSelectDemoCase) {
      onSelectDemoCase(found);
    } else if (onExtract) {
      onExtract(undefined, caseId);
    }
  };

  return (
    <div 
      data-testid="input-panel" 
      className={`flex flex-col gap-4 bg-[#15313A] border border-[rgba(160,220,216,0.16)] rounded-xl p-4 sm:p-5 shadow-lg transition-transform ${
        shakeInput ? "animate-shake" : ""
      }`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2BB7A9]" />
            <h2 className="text-sm font-bold text-[#EAF7F5] uppercase tracking-wider">
              1. Input Field Observations
            </h2>
          </div>
          <span className="text-[11px] font-medium text-[#78979B]">
            Multilingual speech, text, or clinic notes
          </span>
        </div>
        <p className="text-xs text-[#A8C3C5] mt-1">
          Frontline workers rarely enter structured medical jargon. Enter Hindi, English, or mixed observations as spoken by the caregiver.
        </p>
      </div>

      {/* Guided Demo Cases Quick Picker */}
      <div className="bg-[#10232D] border border-[rgba(160,220,216,0.16)] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2BB7A9]" />
            <span className="text-xs font-semibold text-[#EAF7F5]">
              Guided Demo Cases (Synthetic)
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSelectCase("case-incomplete")}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(242,184,75,0.15)] text-[#F2B84B] hover:bg-[rgba(242,184,75,0.25)] border border-[rgba(242,184,75,0.3)] transition-colors"
            >
              Incomplete
            </button>
            <button
              type="button"
              onClick={() => handleSelectCase("case-no-urgent")}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(73,197,137,0.15)] text-[#49C589] hover:bg-[rgba(73,197,137,0.25)] border border-[rgba(73,197,137,0.3)] transition-colors"
            >
              Pneumonia
            </button>
            <button
              type="button"
              onClick={() => handleSelectCase("case-urgent")}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(231,93,93,0.15)] text-[#E75D5D] hover:bg-[rgba(231,93,93,0.25)] border border-[rgba(231,93,93,0.3)] transition-colors"
            >
              High Risk
            </button>
          </div>
        </div>

        {GUIDED_DEMO_CASES && GUIDED_DEMO_CASES.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            {GUIDED_DEMO_CASES.map((demo) => {
              const isSelected = selectedDemoCaseId === demo.id;
              return (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => onSelectDemoCase ? onSelectDemoCase(demo) : handleSelectCase(demo.id)}
                  className={`p-2.5 text-left rounded-md border transition-all ${
                    isSelected
                      ? "bg-[#1B3B43] border-[#2BB7A9] ring-1 ring-[#2BB7A9]/40 shadow-xs"
                      : "bg-[#15313A] border-[rgba(160,220,216,0.16)] hover:border-[#73DED0]/40 hover:bg-[#1B3B43]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-[#EAF7F5]">
                      Case {demo.number}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded border bg-[#10232D] text-[#73DED0] border-[rgba(160,220,216,0.2)]">
                      {demo.tag}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-[#A8C3C5] leading-snug truncate">
                    {demo.label}
                  </div>
                  <p className="text-[10px] text-[#78979B] line-clamp-2 mt-1">
                    {demo.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[rgba(160,220,216,0.1)] text-[10px] text-[#78979B]">
          <Info className="w-3 h-3 text-[#78979B] shrink-0" />
          <span>Synthetic demonstration case data — not from real patients.</span>
        </div>
      </div>

      {/* Input Modality Segmented Control */}
      <div className="flex p-1 bg-[#10232D] border border-[rgba(160,220,216,0.16)] rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab("voice")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded transition-colors ${
            activeTab === "voice"
              ? "bg-[#2BB7A9] text-[#0B1720] shadow-sm font-bold"
              : "text-[#A8C3C5] hover:text-[#EAF7F5] hover:bg-[#15313A]"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Speak</span>
          {isRecording && (
            <span className="w-2 h-2 rounded-full bg-[#E75D5D] animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("text")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded transition-colors ${
            activeTab === "text"
              ? "bg-[#2BB7A9] text-[#0B1720] shadow-sm font-bold"
              : "text-[#A8C3C5] hover:text-[#EAF7F5] hover:bg-[#15313A]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Type</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("photo")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded transition-colors ${
            activeTab === "photo"
              ? "bg-[#2BB7A9] text-[#0B1720] shadow-sm font-bold"
              : "text-[#A8C3C5] hover:text-[#EAF7F5] hover:bg-[#15313A]"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Add photo</span>
          {photoPreview && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#73DED0]" />
          )}
        </button>
      </div>

      {/* Tab 1: Voice Recording Mode */}
      {activeTab === "voice" && (
        <div className="flex flex-col gap-3 p-3.5 bg-[#10232D] border border-[rgba(160,220,216,0.16)] rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E75D5D] text-white hover:bg-[#ff7676] animate-pulse transition-colors shadow-sm"
                  title="Stop recording"
                >
                  <MicOff className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2BB7A9] text-[#0B1720] hover:bg-[#73DED0] font-bold transition-colors shadow-sm"
                  title="Start live microphone recording"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#EAF7F5]">
                    {isRecording ? "Listening to Caregiver / Worker..." : "Microphone Input"}
                  </span>
                  {isRecording && (
                    <span className="font-mono text-xs font-bold text-[#E75D5D] bg-[#15313A] px-2 py-0.5 rounded border border-[rgba(231,93,93,0.3)]">
                      {formatSeconds(recordingSeconds)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#A8C3C5]">
                  {isRecording
                    ? "Speak in Hindi, English, or mixed dialect. Transcript updates live below."
                    : "Press the microphone button to dictate observations in any language."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateVoice}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#EAF7F5] bg-[#15313A] hover:bg-[#1B3B43] border border-[rgba(160,220,216,0.16)] rounded-md transition-colors"
                title="Test with pre-recorded voice audio sample"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#2BB7A9]" />
                <span>Sample Voice Demo</span>
              </button>
            </div>
          </div>

          {speechError && (
            <div className="flex items-start gap-2 p-2.5 bg-[rgba(242,184,75,0.15)] border border-[rgba(242,184,75,0.3)] rounded-md text-xs text-[#F2B84B]">
              <AlertCircle className="w-4 h-4 text-[#F2B84B] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Microphone notice: </span>
                <span>{speechError}</span>
              </div>
            </div>
          )}

          {!speechSupported && (
            <div className="p-2.5 bg-[#15313A] border border-[rgba(160,220,216,0.16)] rounded-md text-xs text-[#A8C3C5]">
              Note: Web Speech API is not supported in this browser. Please use the Sample Voice Demo button or Type tab.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Note Photo Mode */}
      {activeTab === "photo" && (
        <div className="flex flex-col gap-3 p-3.5 bg-[#10232D] border border-[rgba(160,220,216,0.16)] rounded-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#EAF7F5]">
              Handwritten Clinic Slip or Paper Register Photo
            </span>
            <button
              type="button"
              onClick={handleLoadSampleSlip}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#73DED0] bg-[#15313A] border border-[rgba(160,220,216,0.2)] rounded hover:bg-[#1B3B43] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#2BB7A9]" />
              <span>Load Sample Clinical Slip</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {photoError && (
            <div className="flex items-start justify-between gap-2 p-2.5 bg-[rgba(231,93,93,0.15)] border border-[rgba(231,93,93,0.3)] rounded-md text-xs text-[#E75D5D]">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#E75D5D] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Photo upload notice: </span>
                  <span>{photoError}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoError(null)}
                className="text-[#E75D5D] hover:text-white p-0.5"
                title="Dismiss photo warning"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {photoPreview ? (
            <div className="relative border border-[rgba(160,220,216,0.2)] rounded-lg overflow-hidden bg-[#15313A] p-2">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(160,220,216,0.1)]">
                <span className="text-[11px] font-semibold text-[#EAF7F5]">Attached Slip Preview</span>
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="p-1 text-[#78979B] hover:text-[#EAF7F5] rounded"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-48 overflow-hidden flex items-center justify-center bg-[#10232D] rounded mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Clinical note preview"
                  className="max-h-48 object-contain rounded"
                />
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[rgba(160,220,216,0.2)] rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#2BB7A9] hover:bg-[#15313A] transition-all text-center"
            >
              <Upload className="w-6 h-6 text-[#78979B]" />
              <div className="text-xs font-medium text-[#EAF7F5]">
                Click to upload clinic register photo or drag & drop
              </div>
              <p className="text-[11px] text-[#78979B]">
                Supports PNG, JPG, or PDF slips up to 5MB
              </p>
            </div>
          )}

          <div className="flex items-start gap-1.5 text-[11px] text-[#78979B]">
            <Info className="w-3.5 h-3.5 text-[#78979B] shrink-0 mt-0.5" />
            <span>A photo can help read recorded notes. It cannot replace clinical examination.</span>
          </div>
        </div>
      )}

      {/* Main Textarea Area (Also displays live voice transcript) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="field-input" className="text-xs font-semibold text-[#EAF7F5]">
            {activeTab === "voice" ? "Live Voice Transcript (Editable)" : "Clinical Observations & Notes"}
          </label>
          <div className="flex items-center gap-2">
            {inputText.trim().length > 0 && (
              <button
                type="button"
                onClick={() => onInputChange("")}
                className="text-[11px] text-[#78979B] hover:text-[#EAF7F5] flex items-center gap-1"
                title="Clear input"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
            <span className="text-[11px] font-mono text-[#78979B]">
              {inputText.length} chars
            </span>
          </div>
        </div>

        <div className="relative">
          <textarea
            id="field-input"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={busy || isDisabled}
            placeholder="Baccha 18 months ka hai, kal se saans tez hai, doodh thoda le raha hai… bas."
            rows={4}
            className="w-full text-sm font-sans text-[#EAF7F5] bg-[#10232D] border border-[rgba(160,220,216,0.16)] rounded-lg p-3 focus:border-[#2BB7A9] focus:ring-1 focus:ring-[#2BB7A9] placeholder-[#78979B] transition-colors resize-y min-h-[96px]"
          />
        </div>

        {/* Quick fill phrase helpers */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-[#78979B]">Quick inserts:</span>
          <button
            type="button"
            onClick={() => onInputChange("Baby is 14 months old, high fever, coughing, and had convulsions this morning. Cannot breastfeed.")}
            className="text-[11px] text-[#A8C3C5] bg-[#10232D] hover:bg-[#1B3B43] hover:text-[#EAF7F5] border border-[rgba(160,220,216,0.16)] px-2 py-0.5 rounded transition-colors"
          >
            Sample Case: Fever
          </button>
          <button
            type="button"
            onClick={() => onInputChange("Baccha 18 months ka hai, kal se saans tez hai, doodh thoda le raha hai… bas.")}
            className="text-[11px] text-[#A8C3C5] bg-[#10232D] hover:bg-[#1B3B43] hover:text-[#EAF7F5] border border-[rgba(160,220,216,0.16)] px-2 py-0.5 rounded transition-colors"
          >
            Sample Case: Cough
          </button>
          <button
            type="button"
            onClick={() => onInputChange("24 month old child, runny nose and cough. Respiratory rate counted 32 bpm. No chest indrawing, no stridor, alert and drinking well.")}
            className="text-[11px] text-[#A8C3C5] bg-[#10232D] hover:bg-[#1B3B43] hover:text-[#EAF7F5] border border-[rgba(160,220,216,0.16)] px-2 py-0.5 rounded transition-colors"
          >
            Normal observations
          </button>
        </div>
      </div>

      {/* Input Error Message */}
      {inputError && (
        <div className="flex items-start gap-2 p-3 bg-[rgba(231,93,93,0.15)] border border-[rgba(231,93,93,0.3)] rounded-lg text-xs text-[#E75D5D]">
          <AlertCircle className="w-4 h-4 text-[#E75D5D] shrink-0 mt-0.5" />
          <span>{inputError}</span>
        </div>
      )}

      {/* Primary CTA */}
      <div className="pt-2 border-t border-[rgba(160,220,216,0.1)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-[#78979B]">
          Extraction identifies clinical facts. Final evaluation is governed by deterministic rules.
        </div>

        <button
          type="button"
          onClick={handleProcessClick}
          disabled={busy || isDisabled || (!inputText.trim() && !photoPreview)}
          aria-label={busy ? "Processing clinical notes" : "Analyze clinical notes with AI extraction"}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2BB7A9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15313A] ${
            busy || isDisabled || (!inputText.trim() && !photoPreview)
              ? "bg-[#10232D] border border-[rgba(160,220,216,0.1)] text-[#78979B] cursor-not-allowed"
              : "bg-[#2BB7A9] hover:bg-[#73DED0] text-[#0B1720] active:scale-[0.98]"
          }`}
        >
          {busy ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[#0B1720]/30 border-t-[#0B1720] rounded-full animate-spin" aria-hidden="true" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Analyze Notes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
