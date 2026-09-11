import { 
  ImnciAssessment, 
  ProtocolResult, 
  MissingFieldRequirement 
} from "./types";

/**
 * IMNCI Protocol Rule IDs based on Government of India IMNCI guidelines.
 * 
 * Rule 1A: Age validation (2-59 months cohort)
 * Rule 2A: General Danger Signs assessment
 * Rule 3A: Severe Pneumonia / Very Severe Disease (PINK)
 * Rule 4A: Pneumonia - Fast breathing (YELLOW)
 * Rule 5A: No Pneumonia - Cough or Cold (GREEN)
 * Rule 6A: Incomplete data - Classification blocked (AMBER)
 */

export function evaluateImnciProtocol(assessment: ImnciAssessment): ProtocolResult {
  const { facts } = assessment;
  const missingFields: MissingFieldRequirement[] = [];
  
  // 1. Age Validation & Out of Cohort Check
  if (facts.patient_age_months === "unknown") {
    missingFields.push({
      field: "patient_age_months",
      reason: "Exact age in months is required to determine the correct respiratory rate threshold."
    });
  } else if (typeof facts.patient_age_months === "number" && (facts.patient_age_months < 2 || facts.patient_age_months > 59)) {
    return {
      status: "OUT_OF_COHORT",
      triage_color: null,
      classification_name: null,
      treatment_instruction: null,
      missing_fields: [],
      is_safe_to_refer: false,
      rule_id: "IMNCI-1A",
      rule_description: "Age outside 2-59 month cohort. IMNCI protocol not applicable."
    };
  }

  // 2. Evaluate General Danger Signs (GDS)
  const gds = facts.danger_signs;
  if (gds.unable_to_drink_or_breastfeed === "unknown") {
    missingFields.push({ field: "unable_to_drink_or_breastfeed", reason: "Must confirm if child can drink or breastfeed." });
  }
  if (gds.vomits_everything === "unknown") {
    missingFields.push({ field: "vomits_everything", reason: "Must confirm if child vomits everything." });
  }
  if (gds.has_convulsions === "unknown") {
    missingFields.push({ field: "has_convulsions", reason: "Must confirm if child has convulsions." });
  }
  if (gds.lethargic_or_unconscious === "unknown") {
    missingFields.push({ field: "lethargic_or_unconscious", reason: "Must confirm if child is lethargic or unconscious." });
  }

  // 3. Evaluate Physical Signs
  if (facts.chest_indrawing === "unknown") {
    missingFields.push({ field: "chest_indrawing", reason: "Must check for chest indrawing." });
  }
  if (facts.stridor_in_calm_child === "unknown") {
    missingFields.push({ field: "stridor_in_calm_child", reason: "Must check for stridor in a calm child." });
  }

  // 4. Cough / Respiratory Rate Evaluation
  let hasFastBreathing = false;
  if (facts.has_cough_or_difficult_breathing === "unknown") {
    missingFields.push({ field: "has_cough_or_difficult_breathing", reason: "Must confirm if child has cough or difficult breathing." });
  } else if (facts.has_cough_or_difficult_breathing === true) {
    if (facts.respiratory_rate === "unknown") {
      missingFields.push({ field: "respiratory_rate", reason: "Respiratory rate must be explicitly measured for a child with cough." });
    } else if (typeof facts.patient_age_months === "number" && typeof facts.respiratory_rate === "number") {
      if (facts.patient_age_months < 12) {
        hasFastBreathing = facts.respiratory_rate >= 50;
      } else {
        hasFastBreathing = facts.respiratory_rate >= 40;
      }
    }
  }

  // If ANY missing fields, return blocked Amber state
  if (missingFields.length > 0) {
    return {
      status: "NEEDS_CONFIRMATION",
      triage_color: "AMBER",
      classification_name: "CLASSIFICATION BLOCKED: Missing Data",
      treatment_instruction: "Please confirm the missing information before classification.",
      missing_fields: missingFields,
      is_safe_to_refer: false,
      rule_id: "IMNCI-6A",
      rule_description: `Incomplete data: ${missingFields.length} required field(s) missing. Classification cannot proceed without complete clinical information.`
    };
  }

  // ALL REQUIRED FIELDS ARE KNOWN (boolean or number)
  const anyDangerSign = 
    gds.unable_to_drink_or_breastfeed === true || 
    gds.vomits_everything === true || 
    gds.has_convulsions === true || 
    gds.lethargic_or_unconscious === true;

  const anySeverePhysicalSign = 
    facts.chest_indrawing === true || 
    facts.stridor_in_calm_child === true;

  // PINK: Severe Pneumonia / Very Severe Disease
  if (anyDangerSign || anySeverePhysicalSign) {
    const reasons: string[] = [];
    if (gds.unable_to_drink_or_breastfeed === true) reasons.push("unable to drink/breastfeed");
    if (gds.vomits_everything === true) reasons.push("vomits everything");
    if (gds.has_convulsions === true) reasons.push("convulsions");
    if (gds.lethargic_or_unconscious === true) reasons.push("lethargic/unconscious");
    if (facts.chest_indrawing === true) reasons.push("chest indrawing");
    if (facts.stridor_in_calm_child === true) reasons.push("stridor in calm child");

    return {
      status: "CLASSIFIED",
      triage_color: "PINK",
      classification_name: "SEVERE PNEUMONIA OR VERY SEVERE DISEASE",
      treatment_instruction: "Urgent referral to hospital.",
      missing_fields: [],
      is_safe_to_refer: true,
      rule_id: "IMNCI-3A",
      rule_description: `Severe disease detected: ${reasons.join(", ")}. Any general danger sign or severe physical sign triggers PINK classification.`
    };
  }

  // YELLOW: Pneumonia
  if (facts.has_cough_or_difficult_breathing === true && hasFastBreathing) {
    const threshold = typeof facts.patient_age_months === "number" && facts.patient_age_months < 12 ? 50 : 40;
    return {
      status: "CLASSIFIED",
      triage_color: "YELLOW",
      classification_name: "PNEUMONIA",
      treatment_instruction: "Outpatient medical treatment and advice.",
      missing_fields: [],
      is_safe_to_refer: true,
      rule_id: "IMNCI-4A",
      rule_description: `Fast breathing detected: RR ${facts.respiratory_rate} >= ${threshold} bpm (age ${facts.patient_age_months}mo). Matches pneumonia criterion.`
    };
  }

  // GREEN: No Pneumonia: Cough or Cold
  return {
    status: "CLASSIFIED",
    triage_color: "GREEN",
    classification_name: "NO PNEUMONIA: COUGH OR COLD",
    treatment_instruction: "Home care advice.",
    missing_fields: [],
    is_safe_to_refer: true,
    rule_id: "IMNCI-5A",
    rule_description: `No fast breathing (RR ${facts.respiratory_rate} < ${typeof facts.patient_age_months === "number" && facts.patient_age_months < 12 ? 50 : 40} bpm), no danger signs, no severe physical signs.`
  };
}
