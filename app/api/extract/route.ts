import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ImnciAssessment, GeminiExtractionResponse, FindingItem, MissingCriticalField, CandidateProtocolRule } from "@/lib/types";
import { 
  DEMO_CASE_INCOMPLETE, 
  DEMO_CASE_URGENT, 
  DEMO_CASE_NO_URGENT 
} from "@/lib/fixtures";
import { sanitizeInput } from "@/lib/sanitize";

const MAX_API_INPUT_LENGTH = 6000;

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    patient_age_months: { 
      type: Type.INTEGER, 
      nullable: true, 
      description: "Patient age in completed months (2 to 59). Set to null if unknown or not stated." 
    },
    age_group: {
      type: Type.STRING,
      enum: ["young_infant", "child_2_months_to_5_years", "unknown"],
      description: "Classification of age cohort: 'young_infant' if < 2 months, 'child_2_months_to_5_years' if 2-59 months, otherwise 'unknown'."
    },
    age_conflict: {
      type: Type.BOOLEAN,
      description: "Set to true if input contains contradictory or conflicting ages (e.g. '6 months and 4 years')."
    },
    ambiguous_terms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of clinically vague phrases from input that cannot be safely converted to formal danger signs without clarification (e.g. 'looks weak', 'thoda sust')."
    },
    findings: {
      type: Type.ARRAY,
      description: "Array of extracted clinical facts and observations.",
      items: {
        type: Type.OBJECT,
        properties: {
          field: { type: Type.STRING, description: "Standard field key, e.g. 'patient_age_months', 'respiratory_rate', 'has_convulsions', 'unable_to_drink_or_breastfeed', 'chest_indrawing', 'stridor_in_calm_child'." },
          label: { type: Type.STRING, description: "Human-readable label, e.g. 'Convulsions', 'Respiratory Rate'." },
          value: { type: Type.STRING, description: "Extracted value as string ('true', 'false', '44', or 'unknown')." },
          status: { 
            type: Type.STRING, 
            enum: ["reported", "observed", "measured", "inferred", "unknown"],
            description: "How the fact was obtained: 'reported' (by caregiver), 'observed' (visual examination), 'measured' (counted/quantified), 'inferred' (unambiguously deduced), 'unknown' (not provided)."
          },
          evidence: { type: Type.STRING, description: "Exact verbatim phrase or quote from input supporting this finding." },
          confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0." }
        },
        required: ["field", "label", "value", "status", "evidence", "confidence"]
      }
    },
    missing_critical_information: {
      type: Type.ARRAY,
      description: "Critical IMNCI protocol fields that were NOT supplied or are unknown.",
      items: {
        type: Type.OBJECT,
        properties: {
          field: { type: Type.STRING, description: "The missing field identifier." },
          reason: { type: Type.STRING, description: "Why this field is clinically required under IMNCI protocol." },
          priority: { type: Type.STRING, enum: ["high", "medium", "low"], description: "Safety priority of obtaining this missing piece of data." }
        },
        required: ["field", "reason", "priority"]
      }
    },
    candidate_protocol_rules: {
      type: Type.ARRAY,
      description: "IMNCI candidate rules that might apply based solely on the extracted observations.",
      items: {
        type: Type.OBJECT,
        properties: {
          rule_id: { type: Type.STRING },
          reason: { type: Type.STRING },
          evidence_fields: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["rule_id", "reason", "evidence_fields"]
      }
    },
    safe_to_classify: {
      type: Type.BOOLEAN,
      description: "Set to false if ANY required IMNCI field (age, general danger signs, counted respiratory rate when coughing) is missing or unknown. IMNCI rules forbid assuming absent signs are negative."
    },
    next_best_question: {
      type: Type.STRING,
      nullable: true,
      description: "The single most critical follow-up question the frontline health worker should ask the caregiver next to resolve missing data."
    },
    requires_human_confirmation: {
      type: Type.BOOLEAN,
      description: "Must always be true. Health worker confirmation is mandatory before referral."
    }
  },
  required: [
    "patient_age_months",
    "age_group",
    "age_conflict",
    "ambiguous_terms",
    "findings",
    "missing_critical_information",
    "candidate_protocol_rules",
    "safe_to_classify",
    "next_best_question",
    "requires_human_confirmation"
  ]
};

const SYSTEM_PROMPT = `
You are an expert clinical protocol-extraction assistant specialized in the Indian National Health Mission (NHM) / WHO-UNICEF Integrated Management of Neonatal and Childhood Illness (IMNCI) protocol for children aged 2 months to 5 years (2-59 months).

Your ONLY role is to act as a universal bridge between messy human intent (multilingual Hindi/English speech, informal field notes, transcribed audio, or photos of clinic slips) and structured IMNCI assessment facts.

MANDATORY SAFETY INVARIANTS:
1. NEVER diagnose diseases, never calculate drug dosages, and never dictate medical treatments.
2. NEVER assume or infer "false" or "negative" for a symptom or danger sign simply because it was not mentioned. If an item is unmentioned, its value MUST be "unknown" and its status MUST be "unknown".
3. If an input contains contradictory age information (e.g., "baby is 6 months old and 4 years old"), set "age_conflict": true and "safe_to_classify": false.
4. If a statement is vague (e.g. "child looks very weak" or "thoda sust lag raha hai"), DO NOT automatically record it as "lethargic_or_unconscious: true". Instead, list it under "ambiguous_terms", mark the status as "unknown" or "inferred with low confidence", and ask a clarifying question.
5. If the child has a reported cough or difficulty breathing, a counted respiratory rate (breaths per minute over 60 seconds) is MANDATORY under IMNCI. If not explicitly counted, mark "respiratory_rate" as "unknown", list it under "missing_critical_information" with high priority, and set "safe_to_classify": false.
6. Extract exact verbatim evidence quotes from the input for every finding.
7. "requires_human_confirmation" MUST always be true.
`;

interface RawFinding {
  field: string;
  label?: string;
  value?: string | number | boolean | null;
  status?: "reported" | "observed" | "denied" | "unclear" | "not_recorded";
  evidence?: string;
  confidence?: number;
}

interface RawMissingInfo {
  field: string;
  reason: string;
  priority?: "critical" | "high" | "medium";
}

interface RawCandidateRule {
  rule_id: string;
  reason: string;
  evidence_fields?: string[];
}

interface RawGeminiExtraction {
  patient_age_months?: number | null;
  age_group?: "infant_under_2_months" | "child_2_months_to_5_years";
  age_conflict?: boolean;
  ambiguous_terms?: string[];
  findings?: RawFinding[];
  missing_critical_information?: RawMissingInfo[];
  candidate_protocol_rules?: RawCandidateRule[];
  verbatim_quotes?: Record<string, string>;
  caregiver_concerns?: string[];
  requires_human_confirmation?: boolean;
  safe_to_classify?: boolean;
  next_best_question?: string | null;
}

function extractDeterministicallyFromText(
  rawText: string,
  modality: "voice" | "text" | "photo"
): ImnciAssessment {
  const findings: FindingItem[] = [];
  const missingInfo: MissingCriticalField[] = [];
  const candidateRules: CandidateProtocolRule[] = [];
  const ambiguousTerms: string[] = [];
  const verbatimQuotes: Record<string, string> = {};

  // Check for ambiguous phrases that are clinically vague
  const ambiguousPatterns = [
    { pattern: /\b(very weak|kamzor|kamzori)\b/i, phrase: "very weak / kamzor" },
    { pattern: /\b(thoda sust|slightly dull|a bit sluggish)\b/i, phrase: "thoda sust / slightly dull" },
    { pattern: /\b(not well|unwell|theek nahi hai)\b/i, phrase: "unwell / not feeling well" },
    { pattern: /\b(feverish|bukhar sa lag raha)\b/i, phrase: "feverish / subjective fever without thermometry" },
  ];
  for (const { pattern, phrase } of ambiguousPatterns) {
    if (pattern.test(rawText)) {
      ambiguousTerms.push(phrase);
    }
  }

  // 1. Age extraction with conflict detection
  let patientAge: number | "unknown" = "unknown";
  let ageConflict = false;
  const ageMonthsMatch = rawText.match(/\b(\d+)\s*(?:months?|month|mo|m|mahine|mahina)\b/i);
  const ageYearsMatch = rawText.match(/\b(\d+)\s*(?:years?|year|yr|yrs|saal)\b/i);

  if (ageMonthsMatch && ageYearsMatch) {
    const mo = parseInt(ageMonthsMatch[1], 10);
    const yrInMo = parseInt(ageYearsMatch[1], 10) * 12;
    if (Math.abs(mo - yrInMo) > 3) {
      ageConflict = true;
      patientAge = "unknown";
      ambiguousTerms.push(`Contradictory ages stated: ${ageMonthsMatch[0]} vs ${ageYearsMatch[0]}`);
    } else {
      patientAge = mo;
      verbatimQuotes.age_months = ageMonthsMatch[0];
    }
  } else if (ageMonthsMatch) {
    patientAge = parseInt(ageMonthsMatch[1], 10);
    verbatimQuotes.age_months = ageMonthsMatch[0];
  } else if (ageYearsMatch) {
    patientAge = parseInt(ageYearsMatch[1], 10) * 12;
    verbatimQuotes.age_months = ageYearsMatch[0];
  }

  if (patientAge === "unknown") {
    missingInfo.push({
      field: "patient_age_months",
      reason: ageConflict 
        ? "Contradictory age statements detected. Resolve exact child age in months." 
        : "Child age in months is mandatory to govern IMNCI cohort and respiratory rate thresholds.",
      priority: "high"
    });
  } else {
    findings.push({
      field: "patient_age_months",
      label: "Child Age",
      value: patientAge,
      status: "reported",
      evidence: verbatimQuotes.age_months || "",
      confidence: 0.95
    });
  }

  // 2. Cough or difficult breathing
  let hasCough: boolean | "unknown" = "unknown";
  if (/\b(no cough|khansi nahi|nahin hai khansi|without cough|denies cough)\b/i.test(rawText)) {
    hasCough = false;
    verbatimQuotes.cough = "Denies cough or difficult breathing";
  } else if (/\b(cough|khansi|difficult breathing|saans lene me dikkat|saans lene mein takleef|breathing fast|gasping)\b/i.test(rawText)) {
    hasCough = true;
    const match = rawText.match(/\b(cough|khansi|difficult breathing|saans lene me dikkat|saans lene mein takleef)\b/i);
    verbatimQuotes.cough = match ? match[0] : "Cough/breathing difficulty reported";
  }

  if (hasCough === "unknown") {
    missingInfo.push({
      field: "has_cough_or_difficult_breathing",
      reason: "Must ask caregiver if the child has cough or difficult breathing.",
      priority: "high"
    });
  }

  // 3. Respiratory Rate (Counted Breaths per Minute)
  let respiratoryRate: number | "unknown" = "unknown";
  const rrMatch = rawText.match(/\b(?:rr|respiratory rate|breaths?|breaths\/min|rate)[:\s]*(\d{2,3})\b/i) ||
                  rawText.match(/\b(\d{2,3})\s*(?:bpm|breaths per minute|breaths\/min)\b/i);
  if (rrMatch) {
    const parsed = parseInt(rrMatch[1], 10);
    if (parsed >= 10 && parsed <= 140) {
      respiratoryRate = parsed;
      verbatimQuotes.respiratory_rate = rrMatch[0];
      findings.push({
        field: "respiratory_rate",
        label: "Respiratory Rate",
        value: respiratoryRate,
        status: "measured",
        evidence: rrMatch[0],
        confidence: 0.95
      });
    }
  }

  if (hasCough === true && respiratoryRate === "unknown") {
    missingInfo.push({
      field: "respiratory_rate",
      reason: "Counted breaths for 1 full minute is mandatory when cough or difficult breathing is reported.",
      priority: "high"
    });
  }

  // 4. Chest Indrawing
  let chestIndrawing: boolean | "unknown" = "unknown";
  if (/\b(no chest indrawing|pasli nahi chal|no subcostal retraction|chest clear|no retractions)\b/i.test(rawText)) {
    chestIndrawing = false;
    verbatimQuotes.chest_indrawing = "Chest indrawing reported absent";
  } else if (/\b(chest indrawing|pasli chal rahi|pasli chalna|subcostal retraction|chest sucking in)\b/i.test(rawText)) {
    chestIndrawing = true;
    const match = rawText.match(/\b(chest indrawing|pasli chal rahi|pasli chalna|subcostal retraction)\b/i);
    verbatimQuotes.chest_indrawing = match ? match[0] : "Chest indrawing present";
    candidateRules.push({
      rule_id: "IMNCI-RESP-01",
      reason: "Chest indrawing verified as severe respiratory distress",
      evidence_fields: ["chest_indrawing"]
    });
  }

  if (chestIndrawing === "unknown") {
    missingInfo.push({
      field: "chest_indrawing",
      reason: "Physical examination for lower chest wall indrawing is mandatory.",
      priority: "high"
    });
  }

  // 5. Stridor
  let stridor: boolean | "unknown" = "unknown";
  if (/\b(no stridor|stridor absent|no harsh sound)\b/i.test(rawText)) {
    stridor = false;
    verbatimQuotes.stridor = "Stridor absent";
  } else if (/\b(stridor|harsh sound while calm|khar-khar)\b/i.test(rawText)) {
    stridor = true;
    verbatimQuotes.stridor = "Stridor present in calm child";
    candidateRules.push({
      rule_id: "IMNCI-RESP-01",
      reason: "Stridor in calm child indicates upper airway obstruction",
      evidence_fields: ["stridor_in_calm_child"]
    });
  }

  if (stridor === "unknown") {
    missingInfo.push({
      field: "stridor_in_calm_child",
      reason: "Examine for harsh stridor sound when child is calm.",
      priority: "medium"
    });
  }

  // 6. Danger Signs
  const parseDangerSign = (
    posPattern: RegExp,
    negPattern: RegExp,
    field: string,
    label: string,
    ruleReason: string
  ): boolean | "unknown" => {
    if (negPattern.test(rawText)) {
      verbatimQuotes[field] = `Negative/denied in input`;
      return false;
    }
    const match = rawText.match(posPattern);
    if (match) {
      verbatimQuotes[field] = match[0];
      candidateRules.push({
        rule_id: "IMNCI-GDS-01",
        reason: ruleReason,
        evidence_fields: [field]
      });
      return true;
    }
    missingInfo.push({
      field,
      reason: `Must explicitly verify ${label} (General Danger Sign). Missing cannot be assumed negative.`,
      priority: "high"
    });
    return "unknown";
  };

  const gdsConvulsions = parseDangerSign(
    /\b(convulsion|convulsions|seizure|seizures|fit|fits|jhatke|daura|mirgi)\b/i,
    /\b(no convulsion|no convulsions|no seizure|no fit|jhatke nahi|daura nahi|no fits)\b/i,
    "has_convulsions",
    "history or presence of convulsions",
    "Convulsions detected: General Danger Sign requires urgent pre-referral stabilization"
  );

  const gdsUnableToDrink = parseDangerSign(
    /\b(unable to drink|cannot drink|cannot breastfeed|unable to breastfeed|doodh nahi pee|doodh bilkul nahi|refusing all feeds|not drinking)\b/i,
    /\b(drinking well|breastfeeding well|doodh pee raha|able to drink|feeds well|accepting feeds)\b/i,
    "unable_to_drink_or_breastfeed",
    "inability to drink or breastfeed",
    "Unable to drink or breastfeed: General Danger Sign"
  );

  const gdsVomitsEverything = parseDangerSign(
    /\b(vomit everything|vomits everything|vomiting everything|sab ulti|har cheez ulti|cannot keep anything down)\b/i,
    /\b(no vomit|no vomiting|not vomiting|ulti nahi|does not vomit)\b/i,
    "vomits_everything",
    "vomits everything ingested",
    "Vomits everything: General Danger Sign"
  );

  const gdsLethargic = parseDangerSign(
    /\b(lethargic|unconscious|behosh|abnormally sleepy|difficult to wake|floppy|unresponsive)\b/i,
    /\b(alert|active|playful|awake|not lethargic|responsive|chust)\b/i,
    "lethargic_or_unconscious",
    "lethargic or unconscious state",
    "Lethargic or unconscious: General Danger Sign"
  );

  const dangerSigns = {
    unable_to_drink_or_breastfeed: gdsUnableToDrink,
    vomits_everything: gdsVomitsEverything,
    has_convulsions: gdsConvulsions,
    lethargic_or_unconscious: gdsLethargic
  };

  const safeToClassify = missingInfo.length === 0 && !ageConflict;

  const structuredExtraction: GeminiExtractionResponse = {
    patient_age_months: typeof patientAge === "number" ? patientAge : null,
    age_group: typeof patientAge === "number" && patientAge < 2 ? "young_infant" : "child_2_months_to_5_years",
    age_conflict: ageConflict,
    ambiguous_terms: ambiguousTerms,
    findings,
    missing_critical_information: missingInfo,
    candidate_protocol_rules: candidateRules,
    safe_to_classify: safeToClassify,
    next_best_question: missingInfo.length > 0 ? missingInfo[0].reason : null,
    requires_human_confirmation: true,
    missing_critical_fields: missingInfo.map((m) => m.field),
    verbatim_quotes: verbatimQuotes
  };

  return {
    rawInput: rawText,
    modality,
    facts: {
      patient_age_months: patientAge,
      has_cough_or_difficult_breathing: hasCough,
      respiratory_rate: respiratoryRate,
      fast_breathing_reported: "unknown",
      chest_indrawing: chestIndrawing,
      stridor_in_calm_child: stridor,
      danger_signs: dangerSigns
    },
    evidence: {
      age_evidence: verbatimQuotes.age_months || null,
      cough_evidence: verbatimQuotes.cough || null,
      respiratory_evidence: verbatimQuotes.respiratory_rate || null,
      danger_signs_evidence: verbatimQuotes.has_convulsions || verbatimQuotes.unable_to_drink_or_breastfeed || verbatimQuotes.vomits_everything || verbatimQuotes.lethargic_or_unconscious || null,
      chest_indrawing_evidence: verbatimQuotes.chest_indrawing || null,
      stridor_evidence: verbatimQuotes.stridor || null
    },
    structuredExtraction,
    age_months: patientAge,
    respiratory_rate: respiratoryRate,
    chest_indrawing: chestIndrawing,
    stridor: stridor,
    danger_signs: {
      convulsions: gdsConvulsions,
      unable_to_drink: gdsUnableToDrink,
      vomiting_everything: gdsVomitsEverything,
      lethargic_or_unconscious: gdsLethargic
    }
  };
}

function mapRawExtractionToAssessment(
  raw: RawGeminiExtraction,
  rawInput: string,
  modality: "voice" | "text" | "photo"
): ImnciAssessment {
  const findingsMap = new Map<string, RawFinding>();
  if (Array.isArray(raw.findings)) {
    raw.findings.forEach((f: RawFinding) => {
      findingsMap.set(f.field, f);
    });
  }

  const getFieldValue = (field: string) => {
    const f = findingsMap.get(field);
    if (!f) return "unknown";
    const v = String(f.value).toLowerCase().trim();
    if (v === "true") return true;
    if (v === "false") return false;
    if (v === "unknown" || v === "null" || v === "") return "unknown";
    const num = Number(v);
    return isNaN(num) ? "unknown" : num;
  };

  const getEvidence = (field: string): string | null => {
    const f = findingsMap.get(field);
    return f && f.evidence ? String(f.evidence) : null;
  };

  const patientAge = typeof raw.patient_age_months === "number" 
    ? raw.patient_age_months 
    : (getFieldValue("patient_age_months") as number | "unknown");

  const respiratoryRate = getFieldValue("respiratory_rate") as number | "unknown";
  const cough = getFieldValue("has_cough_or_difficult_breathing") as boolean | "unknown";
  const chestIndrawing = getFieldValue("chest_indrawing") as boolean | "unknown";
  const stridor = getFieldValue("stridor_in_calm_child") as boolean | "unknown";

  const dangerSigns = {
    unable_to_drink_or_breastfeed: getFieldValue("unable_to_drink_or_breastfeed") as boolean | "unknown",
    vomits_everything: getFieldValue("vomits_everything") as boolean | "unknown",
    has_convulsions: getFieldValue("has_convulsions") as boolean | "unknown",
    lethargic_or_unconscious: getFieldValue("lethargic_or_unconscious") as boolean | "unknown"
  };

  // Structured findings with typed values
  const structuredFindings: FindingItem[] = Array.isArray(raw.findings)
    ? raw.findings.map((f: RawFinding) => {
        const val = f.value === "true" ? true : f.value === "false" ? false : f.value === "unknown" ? null : isNaN(Number(f.value)) ? (f.value ?? null) : Number(f.value);
        return {
          field: f.field,
          label: f.label || f.field,
          value: val,
          status: f.status || "reported",
          evidence: f.evidence || "",
          confidence: typeof f.confidence === "number" ? f.confidence : 0.85
        };
      })
    : [];

  const missingInfo: MissingCriticalField[] = Array.isArray(raw.missing_critical_information)
    ? raw.missing_critical_information.map((m: RawMissingInfo) => ({
        field: m.field,
        reason: m.reason,
        priority: m.priority || "high"
      }))
    : [];

  const candidateRules: CandidateProtocolRule[] = Array.isArray(raw.candidate_protocol_rules)
    ? raw.candidate_protocol_rules.map((r: RawCandidateRule) => ({
        rule_id: r.rule_id,
        reason: r.reason,
        evidence_fields: Array.isArray(r.evidence_fields) ? r.evidence_fields : []
      }))
    : [];

  const structuredExtraction: GeminiExtractionResponse = {
    patient_age_months: typeof raw.patient_age_months === "number" ? raw.patient_age_months : null,
    age_group: raw.age_group || "child_2_months_to_5_years",
    age_conflict: Boolean(raw.age_conflict),
    ambiguous_terms: Array.isArray(raw.ambiguous_terms) ? raw.ambiguous_terms : [],
    findings: structuredFindings,
    missing_critical_information: missingInfo,
    candidate_protocol_rules: candidateRules,
    safe_to_classify: Boolean(raw.safe_to_classify),
    next_best_question: raw.next_best_question || null,
    requires_human_confirmation: true,
    missing_critical_fields: missingInfo.map((m) => m.field),
    verbatim_quotes: raw.verbatim_quotes || {}
  };

  return {
    rawInput,
    modality,
    facts: {
      patient_age_months: patientAge,
      has_cough_or_difficult_breathing: cough,
      respiratory_rate: respiratoryRate,
      fast_breathing_reported: getFieldValue("fast_breathing_reported") as boolean | "unknown",
      chest_indrawing: chestIndrawing,
      stridor_in_calm_child: stridor,
      danger_signs: dangerSigns
    },
    evidence: {
      age_evidence: getEvidence("patient_age_months"),
      cough_evidence: getEvidence("has_cough_or_difficult_breathing"),
      respiratory_evidence: getEvidence("respiratory_rate"),
      danger_signs_evidence: getEvidence("has_convulsions") || getEvidence("unable_to_drink_or_breastfeed") || getEvidence("lethargic_or_unconscious") || getEvidence("vomits_everything"),
      chest_indrawing_evidence: getEvidence("chest_indrawing"),
      stridor_evidence: getEvidence("stridor_in_calm_child")
    },
    structuredExtraction,
    // Top-level flat fields for components
    age_months: patientAge,
    respiratory_rate: respiratoryRate,
    chest_indrawing: chestIndrawing,
    stridor: stridor,
    danger_signs: dangerSigns
  };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let inputSanitized = "";
  let inputModality: "voice" | "text" | "photo" = "text";

  try {
    const body = await req.json();
    const { text, image, useMock, demoCaseId, modality = "text" } = body;
    inputModality = modality === "voice" || modality === "photo" ? modality : "text";

    // Handle guided demo cases explicitly
    if (demoCaseId) {
      if (demoCaseId === "case-incomplete" || demoCaseId.includes("incomplete")) {
        return NextResponse.json({
          success: true,
          assessment: DEMO_CASE_INCOMPLETE.assessment,
          extraction: DEMO_CASE_INCOMPLETE.assessment.structuredExtraction,
          isFallback: false,
          modelUsed: "synthetic-fixture",
          latencyMs: 120,
          rawGeminiJson: DEMO_CASE_INCOMPLETE.assessment.structuredExtraction
        });
      }
      if (demoCaseId === "case-urgent" || demoCaseId.includes("urgent")) {
        return NextResponse.json({
          success: true,
          assessment: DEMO_CASE_URGENT.assessment,
          extraction: DEMO_CASE_URGENT.assessment.structuredExtraction,
          isFallback: false,
          modelUsed: "synthetic-fixture",
          latencyMs: 140,
          rawGeminiJson: DEMO_CASE_URGENT.assessment.structuredExtraction
        });
      }
      if (demoCaseId === "case-no-urgent" || demoCaseId.includes("no-urgent")) {
        return NextResponse.json({
          success: true,
          assessment: DEMO_CASE_NO_URGENT.assessment,
          extraction: DEMO_CASE_NO_URGENT.assessment.structuredExtraction,
          isFallback: false,
          modelUsed: "synthetic-fixture",
          latencyMs: 110,
          rawGeminiJson: DEMO_CASE_NO_URGENT.assessment.structuredExtraction
        });
      }
    }

    if (useMock) {
      if (text && (text.includes("jhatke") || text.includes("convulsion") || text.includes("seizure"))) {
        return NextResponse.json({
          success: true,
          assessment: DEMO_CASE_URGENT.assessment,
          extraction: DEMO_CASE_URGENT.assessment.structuredExtraction,
          isFallback: true,
          modelUsed: "synthetic-mock",
          latencyMs: 90,
          rawGeminiJson: DEMO_CASE_URGENT.assessment.structuredExtraction
        });
      }
      if (text && (text.includes("runny nose") || text.includes("32 bpm"))) {
        return NextResponse.json({
          success: true,
          assessment: DEMO_CASE_NO_URGENT.assessment,
          extraction: DEMO_CASE_NO_URGENT.assessment.structuredExtraction,
          isFallback: true,
          modelUsed: "synthetic-mock",
          latencyMs: 95,
          rawGeminiJson: DEMO_CASE_NO_URGENT.assessment.structuredExtraction
        });
      }
      return NextResponse.json({
        success: true,
        assessment: DEMO_CASE_INCOMPLETE.assessment,
        extraction: DEMO_CASE_INCOMPLETE.assessment.structuredExtraction,
        isFallback: true,
        modelUsed: "synthetic-mock",
        latencyMs: 80,
        rawGeminiJson: DEMO_CASE_INCOMPLETE.assessment.structuredExtraction
      });
    }

    const rawText = typeof text === "string" ? text : "";
    const sanitizedText = sanitizeInput(rawText);
    inputSanitized = sanitizedText;

    if (sanitizedText.length === 0 && !image) {
      return NextResponse.json(
        { error: "Please provide clinical notes, speech transcript, or a note photo." },
        { status: 400 }
      );
    }

    if (sanitizedText.length > MAX_API_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Input exceeds maximum length of ${MAX_API_INPUT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY found, performing deterministic safe extraction.");
      const deterministicAssessment = extractDeterministicallyFromText(sanitizedText, modality);

      return NextResponse.json({
        success: true,
        assessment: deterministicAssessment,
        extraction: deterministicAssessment.structuredExtraction,
        isFallback: true,
        modelUsed: "deterministic-safe-extractor",
        latencyMs: Date.now() - startTime,
        rawGeminiJson: deterministicAssessment.structuredExtraction
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const contentParts: Array<string | { inlineData: { mimeType: string; data: string } }> = [];
    if (sanitizedText) {
      contentParts.push(sanitizedText);
    }

    if (image && typeof image === "string") {
      // image is expected to be data:image/png;base64,...
      const match = image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        contentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contentParts,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
        temperature: 0.0
      }
    });

    if (!response.text) {
      throw new Error("Empty response received from Gemini.");
    }

    let parsedResult: RawGeminiExtraction;
    try {
      parsedResult = JSON.parse(response.text) as RawGeminiExtraction;
    } catch (parseErr) {
      console.error("JSON parse error from Gemini output:", parseErr, response.text);
      throw new Error("Gemini response was not valid JSON matching the extraction schema.");
    }

    const assessment = mapRawExtractionToAssessment(
      parsedResult, 
      sanitizedText || "Multimodal note photo",
      modality
    );

    return NextResponse.json({
      success: true,
      assessment,
      extraction: assessment.structuredExtraction,
      isFallback: false,
      modelUsed: modelName,
      latencyMs: Date.now() - startTime,
      rawGeminiJson: parsedResult
    });

  } catch (error: unknown) {
    console.error("Extraction route error:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to extract assessment facts.";
    
    // Safely parse the user's input deterministically rather than injecting pre-canned patient data
    const safeFallbackAssessment = extractDeterministicallyFromText(inputSanitized || "", inputModality);
    
    // Append the API error context
    if (safeFallbackAssessment.structuredExtraction) {
      safeFallbackAssessment.structuredExtraction.ambiguous_terms = [
        ...(safeFallbackAssessment.structuredExtraction.ambiguous_terms || []),
        `API Extraction Warning: ${errorMsg}. Fallback safe parser active.`
      ];
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMsg,
        assessment: safeFallbackAssessment,
        extraction: safeFallbackAssessment.structuredExtraction,
        isFallback: true,
        modelUsed: "offline-safety-fallback",
        latencyMs: Date.now() - startTime,
        rawGeminiJson: safeFallbackAssessment.structuredExtraction
      },
      { status: 200 }
    );
  }
}
