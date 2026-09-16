/**
 * Unified types for the IMNCI extraction API layer.
 *
 * ARCHITECTURE PRINCIPLE:
 *   Gemini = extraction only (parse, structure, quote evidence)
 *   Deterministic rules = clinical classification
 *
 * The LLM must NEVER classify the child as Pink/Yellow/Green.
 */

// ── Unknown sentinel ──────────────────────────────────────────────────────

/** Missing clinical information must become "unknown", NEVER false/negative. */
export const UNKNOWN = "unknown" as const;
export type UnknownValue = typeof UNKNOWN;

// ── Extraction Request ────────────────────────────────────────────────────

export interface ExtractionRequest {
  text?: string;
  image?: string;
  demoCaseId?: string;
  inputModality?: "voice" | "text" | "photo";
}

// ── Clinical Field Extraction ─────────────────────────────────────────────

export type FindingStatus =
  | "reported"
  | "observed"
  | "measured"
  | "inferred"
  | "unknown";

/**
 * A single extracted clinical observation.
 * Every field must include verbatim evidence from the source note.
 * Evidence must NOT be invented by the model.
 */
export interface ExtractedField {
  field: string;
  label: string;
  value: string | number | boolean | null;
  status: FindingStatus;
  /** Verbatim quote from the user's input supporting this finding. */
  evidence: string;
  confidence: number;
}

export interface MissingCriticalField {
  field: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface CandidateRule {
  rule_id: string;
  reason: string;
  evidence_fields: string[];
}

// ── Gemini Structured Output (raw) ────────────────────────────────────────
// This is the shape Gemini returns via structured JSON output.
// It is intentionally NOT the same as ImnciAssessment — the mapping
// happens in map-response.ts.

export interface RawGeminiExtraction {
  patient_age_months?: number | null;
  age_group?: "young_infant" | "child_2_months_to_5_years" | "unknown";
  age_conflict?: boolean;
  ambiguous_terms?: string[];
  findings?: Array<{
    field: string;
    label?: string;
    value?: string | number | boolean | null;
    status?: string;
    evidence?: string;
    confidence?: number;
  }>;
  missing_critical_information?: Array<{
    field: string;
    reason: string;
    priority?: string;
  }>;
  candidate_protocol_rules?: Array<{
    rule_id: string;
    reason: string;
    evidence_fields?: string[];
  }>;
  safe_to_classify?: boolean;
  next_best_question?: string | null;
  requires_human_confirmation?: boolean;
}

// ── Structured Extraction Response ────────────────────────────────────────

export interface StructuredExtractionResponse {
  patient_age_months: number | null;
  age_group: string;
  age_conflict: boolean;
  ambiguous_terms: string[];
  findings: ExtractedField[];
  missing_critical_information: MissingCriticalField[];
  candidate_protocol_rules: CandidateRule[];
  safe_to_classify: boolean;
  next_best_question: string | null;
  requires_human_confirmation: boolean;
  missing_critical_fields: string[];
  verbatim_quotes: Record<string, string>;
}

// ── Final API Response ────────────────────────────────────────────────────

export interface ExtractionResponse {
  success: boolean;
  error?: string;
  assessment: {
    rawInput: string;
    modality: "voice" | "text" | "photo";
    facts: {
      patient_age_months: number | UnknownValue;
      has_cough_or_difficult_breathing: boolean | UnknownValue;
      respiratory_rate: number | UnknownValue;
      fast_breathing_reported: boolean | UnknownValue;
      chest_indrawing: boolean | UnknownValue;
      stridor_in_calm_child: boolean | UnknownValue;
      danger_signs: {
        unable_to_drink_or_breastfeed: boolean | UnknownValue;
        vomits_everything: boolean | UnknownValue;
        has_convulsions: boolean | UnknownValue;
        lethargic_or_unconscious: boolean | UnknownValue;
      };
    };
    evidence: {
      age_evidence: string | null;
      cough_evidence: string | null;
      respiratory_evidence: string | null;
      danger_signs_evidence: string | null;
      chest_indrawing_evidence: string | null;
      stridor_evidence: string | null;
    };
    structuredExtraction: StructuredExtractionResponse;
    age_months: number | UnknownValue;
    respiratory_rate: number | UnknownValue;
    chest_indrawing: boolean | UnknownValue;
    stridor: boolean | UnknownValue;
    danger_signs: {
      unable_to_drink_or_breastfeed: boolean | UnknownValue;
      vomits_everything: boolean | UnknownValue;
      has_convulsions: boolean | UnknownValue;
      lethargic_or_unconscious: boolean | UnknownValue;
    };
  };
  extraction: StructuredExtractionResponse;
  isFallback: boolean;
  modelUsed: string;
  latencyMs: number;
}

// ── API Error Types ───────────────────────────────────────────────────────

export type ApiErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_REQUEST"
  | "INPUT_TOO_LONG"
  | "EMPTY_INPUT"
  | "AI_PROVIDER_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "AI_RESPONSE_INVALID"
  | "AI_SCHEMA_MISMATCH"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  status: number;
}

// ── Configuration ─────────────────────────────────────────────────────────

export const API_CONFIG = {
  /** Maximum characters accepted for text input. */
  MAX_INPUT_LENGTH: 6000,
  /** Minimum characters for clinically meaningful input. */
  MIN_INPUT_LENGTH: 10,
  /** Request timeout for Gemini API calls (ms). */
  AI_TIMEOUT_MS: 30_000,
  /** Default Gemini model if GEMINI_MODEL env is not set. */
  DEFAULT_MODEL: "gemini-2.5-flash",
} as const;
