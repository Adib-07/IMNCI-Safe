export type UnknownValue = "unknown";

export interface DangerSigns {
  unable_to_drink_or_breastfeed: boolean | UnknownValue;
  vomits_everything: boolean | UnknownValue;
  has_convulsions: boolean | UnknownValue;
  lethargic_or_unconscious: boolean | UnknownValue;
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
}

export interface ImnciAssessment {
  facts: ExtractedFacts;
  evidence?: ExtractedEvidence;
}

export type TriageColor = "PINK" | "YELLOW" | "GREEN" | "AMBER";
export type AssessmentStatus = "CLASSIFIED" | "NEEDS_CONFIRMATION" | "OUT_OF_COHORT";

export interface MissingFieldRequirement {
  field: string;
  reason: string;
}

export interface ProtocolResult {
  status: AssessmentStatus;
  triage_color: TriageColor | null;
  classification_name: string | null;
  treatment_instruction: string | null;
  missing_fields: MissingFieldRequirement[];
  is_safe_to_refer: boolean;
}
