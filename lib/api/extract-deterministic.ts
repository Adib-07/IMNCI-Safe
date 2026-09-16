/**
 * Deterministic text extraction fallback.
 *
 * Used when:
 * - GEMINI_API_KEY is not configured
 * - Gemini API call fails or times out
 *
 * This module extracts clinical facts using regex pattern matching.
 * It NEVER classifies — it only extracts structured observations.
 *
 * Missing information becomes "unknown". Never inferred as false/negative.
 */

import {
  RawGeminiExtraction,
  ExtractedField,
  MissingCriticalField,
  CandidateRule,
  UnknownValue,
} from "./types";

// ── Ambiguous Patterns ────────────────────────────────────────────────────

const AMBIGUOUS_PATTERNS: Array<{ pattern: RegExp; phrase: string }> = [
  { pattern: /\b(very weak|kamzor|kamzori)\b/i, phrase: "very weak / kamzor" },
  {
    pattern: /\b(thoda sust|slightly dull|a bit sluggish)\b/i,
    phrase: "thoda sust / slightly dull",
  },
  {
    pattern: /\b(not well|unwell|theek nahi hai)\b/i,
    phrase: "unwell / not feeling well",
  },
  {
    pattern: /\b(feverish|bukhar sa lag raha)\b/i,
    phrase: "feverish / subjective fever without thermometry",
  },
];

// ── Danger Sign Parser ────────────────────────────────────────────────────

interface DangerSignResult {
  value: boolean | UnknownValue;
  evidence: string | null;
  candidateRule?: CandidateRule;
}

function parseDangerSign(
  rawText: string,
  posPattern: RegExp,
  negPattern: RegExp,
  field: string,
  ruleReason: string
): DangerSignResult {
  if (negPattern.test(rawText)) {
    return {
      value: false,
      evidence: "Negative/denied in input",
    };
  }

  const match = rawText.match(posPattern);
  if (match) {
    return {
      value: true,
      evidence: match[0],
      candidateRule: {
        rule_id: "IMNCI-GDS-01",
        reason: ruleReason,
        evidence_fields: [field],
      },
    };
  }

  return {
    value: "unknown",
    evidence: null,
  };
}

// ── Main Extraction Function ──────────────────────────────────────────────

export interface DeterministicResult {
  structuredExtraction: RawGeminiExtraction;
  findings: ExtractedField[];
  missingInfo: MissingCriticalField[];
  candidateRules: CandidateRule[];
  ambiguousTerms: string[];
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
  evidence: Record<string, string | null>;
}

/**
 * Extract clinical facts from raw text using deterministic pattern matching.
 * This is the safety fallback when the AI provider is unavailable.
 */
export function extractDeterministically(rawText: string): DeterministicResult {
  const findings: ExtractedField[] = [];
  const missingInfo: MissingCriticalField[] = [];
  const candidateRules: CandidateRule[] = [];
  const ambiguousTerms: string[] = [];
  const evidence: Record<string, string | null> = {};

  // 1. Detect ambiguous phrases
  for (const { pattern, phrase } of AMBIGUOUS_PATTERNS) {
    if (pattern.test(rawText)) {
      ambiguousTerms.push(phrase);
    }
  }

  // 2. Age extraction with conflict detection
  let patientAge: number | UnknownValue = "unknown";
  let ageConflict = false;
  const ageMonthsMatch = rawText.match(
    /\b(\d+)\s*(?:months?|month|mo|m|mahine|mahina)\b/i
  );
  const ageYearsMatch = rawText.match(
    /\b(\d+)\s*(?:years?|year|yr|yrs|saal)\b/i
  );

  if (ageMonthsMatch && ageYearsMatch) {
    const mo = parseInt(ageMonthsMatch[1], 10);
    const yrInMo = parseInt(ageYearsMatch[1], 10) * 12;
    if (Math.abs(mo - yrInMo) > 3) {
      ageConflict = true;
      patientAge = "unknown";
      ambiguousTerms.push(
        `Contradictory ages stated: ${ageMonthsMatch[0]} vs ${ageYearsMatch[0]}`
      );
    } else {
      patientAge = mo;
      evidence.age_months = ageMonthsMatch[0];
    }
  } else if (ageMonthsMatch) {
    patientAge = parseInt(ageMonthsMatch[1], 10);
    evidence.age_months = ageMonthsMatch[0];
  } else if (ageYearsMatch) {
    patientAge = parseInt(ageYearsMatch[1], 10) * 12;
    evidence.age_months = ageYearsMatch[0];
  }

  if (patientAge === "unknown") {
    missingInfo.push({
      field: "patient_age_months",
      reason: ageConflict
        ? "Contradictory age statements detected. Resolve exact child age in months."
        : "Child age in months is mandatory to govern IMNCI cohort and respiratory rate thresholds.",
      priority: "high",
    });
  } else {
    findings.push({
      field: "patient_age_months",
      label: "Child Age",
      value: patientAge,
      status: "reported",
      evidence: evidence.age_months || "",
      confidence: 0.95,
    });
  }

  // 3. Cough or difficult breathing
  let hasCough: boolean | UnknownValue = "unknown";
  if (
    /\b(no cough|khansi nahi|nahin hai khansi|without cough|denies cough)\b/i.test(
      rawText
    )
  ) {
    hasCough = false;
    evidence.cough = "Denies cough or difficult breathing";
  } else if (
    /\b(cough|khansi|difficult breathing|saans lene me dikkat|saans lene mein takleef|breathing fast|gasping)\b/i.test(
      rawText
    )
  ) {
    hasCough = true;
    const match = rawText.match(
      /\b(cough|khansi|difficult breathing|saans lene me dikkat|saans lene mein takleef)\b/i
    );
    evidence.cough = match ? match[0] : "Cough/breathing difficulty reported";
  }

  if (hasCough === "unknown") {
    missingInfo.push({
      field: "has_cough_or_difficult_breathing",
      reason: "Must ask caregiver if the child has cough or difficult breathing.",
      priority: "high",
    });
  }

  // 4. Respiratory Rate
  let respiratoryRate: number | UnknownValue = "unknown";
  const rrMatch =
    rawText.match(
      /\b(?:rr|respiratory rate|breaths?|breaths\/min|rate)[:\s]*(\d{2,3})\b/i
    ) ||
    rawText.match(/\b(\d{2,3})\s*(?:bpm|breaths per minute|breaths\/min)\b/i);

  if (rrMatch) {
    const parsed = parseInt(rrMatch[1], 10);
    if (parsed >= 10 && parsed <= 140) {
      respiratoryRate = parsed;
      evidence.respiratory_rate = rrMatch[0];
      findings.push({
        field: "respiratory_rate",
        label: "Respiratory Rate",
        value: respiratoryRate,
        status: "measured",
        evidence: rrMatch[0],
        confidence: 0.95,
      });
    }
  }

  if (hasCough === true && respiratoryRate === "unknown") {
    missingInfo.push({
      field: "respiratory_rate",
      reason:
        "Counted breaths for 1 full minute is mandatory when cough or difficult breathing is reported.",
      priority: "high",
    });
  }

  // 5. Chest Indrawing
  let chestIndrawing: boolean | UnknownValue = "unknown";
  if (
    /\b(no chest indrawing|pasli nahi chal|no subcostal retraction|chest clear|no retractions)\b/i.test(
      rawText
    )
  ) {
    chestIndrawing = false;
    evidence.chest_indrawing = "Chest indrawing reported absent";
  } else if (
    /\b(chest indrawing|pasli chal rahi|pasli chalna|subcostal retraction|chest sucking in)\b/i.test(
      rawText
    )
  ) {
    chestIndrawing = true;
    const match = rawText.match(
      /\b(chest indrawing|pasli chal rahi|pasli chalna|subcostal retraction)\b/i
    );
    evidence.chest_indrawing = match ? match[0] : "Chest indrawing present";
    candidateRules.push({
      rule_id: "IMNCI-RESP-01",
      reason: "Chest indrawing verified as severe respiratory distress",
      evidence_fields: ["chest_indrawing"],
    });
  }

  if (chestIndrawing === "unknown") {
    missingInfo.push({
      field: "chest_indrawing",
      reason: "Physical examination for lower chest wall indrawing is mandatory.",
      priority: "high",
    });
  }

  // 6. Stridor
  let stridor: boolean | UnknownValue = "unknown";
  if (
    /\b(no stridor|stridor absent|no harsh sound)\b/i.test(rawText)
  ) {
    stridor = false;
    evidence.stridor = "Stridor absent";
  } else if (
    /\b(stridor|harsh sound while calm|khar-khar)\b/i.test(rawText)
  ) {
    stridor = true;
    evidence.stridor = "Stridor present in calm child";
    candidateRules.push({
      rule_id: "IMNCI-RESP-01",
      reason: "Stridor in calm child indicates upper airway obstruction",
      evidence_fields: ["stridor_in_calm_child"],
    });
  }

  if (stridor === "unknown") {
    missingInfo.push({
      field: "stridor_in_calm_child",
      reason: "Examine for harsh stridor sound when child is calm.",
      priority: "medium",
    });
  }

  // 7. Danger Signs
  const convulsions = parseDangerSign(
    rawText,
    /\b(convulsion|convulsions|seizure|seizures|fit|fits|jhatke|daura|mirgi)\b/i,
    /\b(no convulsion|no convulsions|no seizure|no fit|jhatke nahi|daura nahi|no fits)\b/i,
    "has_convulsions",
    "Convulsions detected: General Danger Sign requires urgent pre-referral stabilization"
  );

  const unableToDrink = parseDangerSign(
    rawText,
    /\b(unable to drink|cannot drink|cannot breastfeed|unable to breastfeed|doodh nahi pee|doodh bilkul nahi|refusing all feeds|not drinking)\b/i,
    /\b(drinking well|breastfeeding well|doodh pee raha|able to drink|feeds well|accepting feeds)\b/i,
    "unable_to_drink_or_breastfeed",
    "Unable to drink or breastfeed: General Danger Sign"
  );

  const vomitsEverything = parseDangerSign(
    rawText,
    /\b(vomit everything|vomits everything|vomiting everything|sab ulti|har cheez ulti|cannot keep anything down)\b/i,
    /\b(no vomit|no vomiting|not vomiting|ulti nahi|does not vomit)\b/i,
    "vomits_everything",
    "Vomits everything: General Danger Sign"
  );

  const lethargic = parseDangerSign(
    rawText,
    /\b(lethargic|unconscious|behosh|abnormally sleepy|difficult to wake|floppy|unresponsive)\b/i,
    /\b(alert|active|playful|awake|not lethargic|responsive|chust)\b/i,
    "lethargic_or_unconscious",
    "Lethargic or unconscious: General Danger Sign"
  );

  // Collect danger sign findings
  const dangerSigns = {
    unable_to_drink_or_breastfeed: unableToDrink.value,
    vomits_everything: vomitsEverything.value,
    has_convulsions: convulsions.value,
    lethargic_or_unconscious: lethargic.value,
  };

  // Add danger sign findings
  const dangerSignEntries = [
    { key: "has_convulsions", label: "Convulsions", result: convulsions },
    { key: "unable_to_drink_or_breastfeed", label: "Unable to Drink/Breastfeed", result: unableToDrink },
    { key: "vomits_everything", label: "Vomits Everything", result: vomitsEverything },
    { key: "lethargic_or_unconscious", label: "Lethargic/Unconscious", result: lethargic },
  ];

  for (const { key, label, result } of dangerSignEntries) {
    evidence[key] = result.evidence;
    if (result.candidateRule) {
      candidateRules.push(result.candidateRule);
    }

    if (result.value === "unknown") {
      missingInfo.push({
        field: key,
        reason: `Must explicitly verify ${label} (General Danger Sign). Missing cannot be assumed negative.`,
        priority: "high",
      });
    } else {
      findings.push({
        field: key,
        label,
        value: result.value,
        status: result.value === true ? "reported" : "reported",
        evidence: result.evidence || "",
        confidence: result.value === true ? 0.95 : 0.9,
      });
    }
  }

  const safeToClassify = missingInfo.length === 0 && !ageConflict;

  const structuredExtraction: RawGeminiExtraction = {
    patient_age_months:
      typeof patientAge === "number" ? patientAge : null,
    age_group:
      typeof patientAge === "number" && patientAge < 2
        ? "young_infant"
        : "child_2_months_to_5_years",
    age_conflict: ageConflict,
    ambiguous_terms: ambiguousTerms,
    findings,
    missing_critical_information: missingInfo,
    candidate_protocol_rules: candidateRules,
    safe_to_classify: safeToClassify,
    next_best_question: missingInfo.length > 0 ? missingInfo[0].reason : null,
    requires_human_confirmation: true,
  };

  return {
    structuredExtraction,
    findings,
    missingInfo,
    candidateRules,
    ambiguousTerms,
    facts: {
      patient_age_months: patientAge,
      has_cough_or_difficult_breathing: hasCough,
      respiratory_rate: respiratoryRate,
      fast_breathing_reported: "unknown",
      chest_indrawing: chestIndrawing,
      stridor_in_calm_child: stridor,
      danger_signs: dangerSigns,
    },
    evidence,
  };
}
