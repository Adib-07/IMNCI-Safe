import { 
  ImnciAssessment, 
  ProtocolResult, 
  MissingFieldRequirement 
} from "./types";

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
      is_safe_to_refer: false
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
      is_safe_to_refer: false
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
    return {
      status: "CLASSIFIED",
      triage_color: "PINK",
      classification_name: "SEVERE PNEUMONIA OR VERY SEVERE DISEASE",
      treatment_instruction: "Urgent referral to hospital.",
      missing_fields: [],
      is_safe_to_refer: true
    };
  }

  // YELLOW: Pneumonia
  if (facts.has_cough_or_difficult_breathing === true && hasFastBreathing) {
    return {
      status: "CLASSIFIED",
      triage_color: "YELLOW",
      classification_name: "PNEUMONIA",
      treatment_instruction: "Outpatient medical treatment and advice.",
      missing_fields: [],
      is_safe_to_refer: true
    };
  }

  // GREEN: No Pneumonia: Cough or Cold
  return {
    status: "CLASSIFIED",
    triage_color: "GREEN",
    classification_name: "NO PNEUMONIA: COUGH OR COLD",
    treatment_instruction: "Home care advice.",
    missing_fields: [],
    is_safe_to_refer: true
  };
}
