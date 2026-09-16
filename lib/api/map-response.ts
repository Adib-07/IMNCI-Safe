/**
 * Map raw Gemini extraction output to the standardized ImnciAssessment format.
 *
 * Handles type coercion, missing fields, and ensures unknown values
 * propagate correctly through the mapping pipeline.
 */

import {
  RawGeminiExtraction,
  ExtractedField,
  MissingCriticalField,
  CandidateRule,
  UnknownValue,
} from "./types";

// ── Helper: Extract field value with type coercion ────────────────────────

function getFieldValue(
  findings: Map<string, ExtractedField>,
  field: string
): boolean | number | UnknownValue {
  const f = findings.get(field);
  if (!f) return "unknown";

  const v = String(f.value).toLowerCase().trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "unknown" || v === "null" || v === "") return "unknown";

  const num = Number(v);
  return isNaN(num) ? "unknown" : num;
}

function getEvidence(
  findings: Map<string, ExtractedField>,
  field: string
): string | null {
  const f = findings.get(field);
  return f && f.evidence ? String(f.evidence) : null;
}

// ── Main Mapping Function ─────────────────────────────────────────────────

export interface MappedAssessment {
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
  structuredExtraction: {
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
  };
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
}

/**
 * Map a raw Gemini extraction response to assessment facts and evidence.
 */
export function mapRawToAssessment(raw: RawGeminiExtraction): MappedAssessment {
  // Build findings map for O(1) lookup
  const findingsMap = new Map<string, ExtractedField>();
  if (Array.isArray(raw.findings)) {
    for (const f of raw.findings) {
      findingsMap.set(f.field, {
        field: f.field,
        label: f.label || f.field,
        value: f.value ?? null,
        status: (f.status as ExtractedField["status"]) || "reported",
        evidence: f.evidence || "",
        confidence: typeof f.confidence === "number" ? f.confidence : 0.85,
      });
    }
  }

  // Extract typed values
  const patientAge =
    typeof raw.patient_age_months === "number"
      ? raw.patient_age_months
      : (getFieldValue(findingsMap, "patient_age_months") as number | "unknown");

  const respiratoryRate = getFieldValue(
    findingsMap,
    "respiratory_rate"
  ) as number | "unknown";
  const cough = getFieldValue(
    findingsMap,
    "has_cough_or_difficult_breathing"
  ) as boolean | "unknown";
  const chestIndrawing = getFieldValue(
    findingsMap,
    "chest_indrawing"
  ) as boolean | "unknown";
  const stridor = getFieldValue(
    findingsMap,
    "stridor_in_calm_child"
  ) as boolean | "unknown";

  const dangerSigns = {
    unable_to_drink_or_breastfeed: getFieldValue(
      findingsMap,
      "unable_to_drink_or_breastfeed"
    ) as boolean | "unknown",
    vomits_everything: getFieldValue(
      findingsMap,
      "vomits_everything"
    ) as boolean | "unknown",
    has_convulsions: getFieldValue(
      findingsMap,
      "has_convulsions"
    ) as boolean | "unknown",
    lethargic_or_unconscious: getFieldValue(
      findingsMap,
      "lethargic_or_unconscious"
    ) as boolean | "unknown",
  };

  // Map findings array
  const structuredFindings: ExtractedField[] = Array.isArray(raw.findings)
    ? raw.findings.map((f) => ({
        field: f.field,
        label: f.label || f.field,
        value:
          f.value === "true"
            ? true
            : f.value === "false"
              ? false
              : f.value === "unknown"
                ? null
                : isNaN(Number(String(f.value)))
                  ? (f.value ?? null)
                  : Number(String(f.value)),
        status: (f.status as ExtractedField["status"]) || "reported",
        evidence: f.evidence || "",
        confidence:
          typeof f.confidence === "number" ? f.confidence : 0.85,
      }))
    : [];

  // Map missing fields
  const missingInfo: MissingCriticalField[] = Array.isArray(
    raw.missing_critical_information
  )
    ? raw.missing_critical_information.map((m) => ({
        field: m.field,
        reason: m.reason,
        priority: (m.priority as MissingCriticalField["priority"]) || "high",
      }))
    : [];

  // Map candidate rules
  const candidateRules: CandidateRule[] = Array.isArray(
    raw.candidate_protocol_rules
  )
    ? raw.candidate_protocol_rules.map((r) => ({
        rule_id: r.rule_id,
        reason: r.reason,
        evidence_fields: Array.isArray(r.evidence_fields)
          ? r.evidence_fields
          : [],
      }))
    : [];

  // Build structured extraction
  const structuredExtraction = {
    patient_age_months:
      typeof raw.patient_age_months === "number"
        ? raw.patient_age_months
        : null,
    age_group: raw.age_group || "child_2_months_to_5_years",
    age_conflict: Boolean(raw.age_conflict),
    ambiguous_terms: Array.isArray(raw.ambiguous_terms)
      ? raw.ambiguous_terms
      : [],
    findings: structuredFindings,
    missing_critical_information: missingInfo,
    candidate_protocol_rules: candidateRules,
    safe_to_classify: Boolean(raw.safe_to_classify),
    next_best_question: raw.next_best_question || null,
    requires_human_confirmation: true,
    missing_critical_fields: missingInfo.map((m) => m.field),
    verbatim_quotes: ((raw as Record<string, unknown>).verbatim_quotes as
      | Record<string, string>
      | undefined) || {},
  };

  return {
    facts: {
      patient_age_months: patientAge,
      has_cough_or_difficult_breathing: cough,
      respiratory_rate: respiratoryRate,
      fast_breathing_reported: getFieldValue(
        findingsMap,
        "fast_breathing_reported"
      ) as boolean | "unknown",
      chest_indrawing: chestIndrawing,
      stridor_in_calm_child: stridor,
      danger_signs: dangerSigns,
    },
    evidence: {
      age_evidence: getEvidence(findingsMap, "patient_age_months"),
      cough_evidence: getEvidence(
        findingsMap,
        "has_cough_or_difficult_breathing"
      ),
      respiratory_evidence: getEvidence(findingsMap, "respiratory_rate"),
      danger_signs_evidence:
        getEvidence(findingsMap, "has_convulsions") ||
        getEvidence(findingsMap, "unable_to_drink_or_breastfeed") ||
        getEvidence(findingsMap, "lethargic_or_unconscious") ||
        getEvidence(findingsMap, "vomits_everything"),
      chest_indrawing_evidence: getEvidence(
        findingsMap,
        "chest_indrawing"
      ),
      stridor_evidence: getEvidence(findingsMap, "stridor_in_calm_child"),
    },
    structuredExtraction,
    age_months: patientAge,
    respiratory_rate: respiratoryRate,
    chest_indrawing: chestIndrawing,
    stridor: stridor,
    danger_signs: dangerSigns,
  };
}
