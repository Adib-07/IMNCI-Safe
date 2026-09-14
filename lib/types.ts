export type UnknownValue = "unknown";

export type FindingStatus = 
  | "reported" 
  | "observed" 
  | "measured" 
  | "inferred" 
  | "unknown"
  | "denied"
  | "unclear"
  | "not_recorded";

export interface FindingItem {
  field: string;
  label: string;
  value: string | number | boolean | null;
  status: FindingStatus;
  evidence: string;
  confidence: number;
}

export interface MissingCriticalField {
  field: string;
  reason: string;
  priority: "high" | "medium" | "low" | "critical";
}

export interface CandidateProtocolRule {
  rule_id: string;
  reason: string;
  evidence_fields: string[];
}

export interface GeminiExtractionResponse {
  patient_age_months: number | null;
  age_group: "young_infant" | "child_2_months_to_5_years" | "unknown" | "infant_under_2_months";
  findings: FindingItem[];
  missing_critical_information: MissingCriticalField[];
  candidate_protocol_rules: CandidateProtocolRule[];
  safe_to_classify: boolean;
  next_best_question: string | null;
  requires_human_confirmation: boolean;
  age_conflict?: boolean;
  ambiguous_terms?: string[];
  // Extended fields for UI rendering
  missing_critical_fields?: string[];
  extraction_confidence?: number;
  detected_language?: string;
  verbatim_quotes?: Record<string, string>;
}

export interface DangerSigns {
  unable_to_drink_or_breastfeed?: boolean | UnknownValue;
  vomits_everything?: boolean | UnknownValue;
  has_convulsions?: boolean | UnknownValue;
  lethargic_or_unconscious?: boolean | UnknownValue;
  convulsions?: boolean | UnknownValue;
  unable_to_drink?: boolean | UnknownValue;
  vomiting_everything?: boolean | UnknownValue;
}

export interface ExtractedFacts {
  patient_age_months: number | UnknownValue;
  has_cough_or_difficult_breathing: boolean | UnknownValue;
  respiratory_rate: number | UnknownValue;
  fast_breathing_reported: boolean | UnknownValue;
  chest_indrawing: boolean | UnknownValue;
  stridor_in_calm_child: boolean | UnknownValue;
  danger_signs: DangerSigns;
}

export interface ExtractedEvidence {
  age_evidence: string | null;
  cough_evidence: string | null;
  respiratory_evidence: string | null;
  danger_signs_evidence: string | null;
  chest_indrawing_evidence: string | null;
  stridor_evidence: string | null;
}

export interface ImnciAssessment {
  facts: ExtractedFacts;
  evidence?: ExtractedEvidence;
  structuredExtraction?: GeminiExtractionResponse;
  rawInput?: string;
  modality?: "voice" | "text" | "photo";

  // Flat ergonomic accessors for UI components
  age_months?: number | UnknownValue;
  respiratory_rate?: number | UnknownValue;
  chest_indrawing?: boolean | UnknownValue;
  stridor?: boolean | UnknownValue;
  cough_duration_days?: number | null;
  danger_signs?: DangerSigns;
}

export type TriageColor = "PINK" | "YELLOW" | "GREEN" | "AMBER";

export type RuleEvaluationStatus =
  | "insufficient_information"
  | "verified_rule_match"
  | "verified_no_urgent_trigger_from_supplied_facts"
  | "out_of_cohort"
  | "CLASSIFIED"
  | "NEEDS_CONFIRMATION"
  | "OUT_OF_COHORT";

export interface MissingFieldRequirement {
  field: string;
  reason: string;
  priority?: "high" | "medium" | "low" | "critical";
}

export interface ProtocolResult {
  status: RuleEvaluationStatus;
  classification_name: string;
  urgentReferral?: boolean;
  triage_color: TriageColor;
  matchedRule?: string | null;
  rule_description?: string;
  evidence?: string[];
  triggering_fields?: string[];
  fields_used?: string[];
  missing_fields: MissingFieldRequirement[];
  nextQuestion?: string | null;
  protocol_citation?: string;
  is_safe_to_refer?: boolean;
  requires_human_confirmation?: boolean;

  // Extended properties for UI & test backward compatibility
  classification_status?: "CLASSIFIED" | "NEEDS_CONFIRMATION" | "OUT_OF_COHORT" | string;
  rule_id?: string;
  missing_parameters?: string[];
  danger_sign_present?: boolean;
  pre_referral_actions?: string[];
  treatment_instruction?: string;
}

