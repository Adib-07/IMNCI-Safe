import { ImnciAssessment } from "./types";

// CASE 1: SAFE / COMPLETE
// Capable of producing a valid classification (Yellow - Pneumonia)
export const FIXTURE_SAFE_COMPLETE: ImnciAssessment = {
  facts: {
    patient_age_months: 18,
    has_cough_or_difficult_breathing: true,
    respiratory_rate: 44,
    fast_breathing_reported: true,
    chest_indrawing: false,
    stridor_in_calm_child: false,
    danger_signs: {
      unable_to_drink_or_breastfeed: false,
      vomits_everything: false,
      has_convulsions: false,
      lethargic_or_unconscious: false
    }
  }
};

// CASE 2: UNSAFE / INCOMPLETE
// Messy input missing respiratory rate and danger signs. 
// System MUST refuse classification.
export const FIXTURE_UNSAFE_INCOMPLETE: ImnciAssessment = {
  facts: {
    patient_age_months: 18,
    has_cough_or_difficult_breathing: true,
    respiratory_rate: "unknown",
    fast_breathing_reported: true,
    chest_indrawing: "unknown",
    stridor_in_calm_child: "unknown",
    danger_signs: {
      unable_to_drink_or_breastfeed: "unknown",
      vomits_everything: "unknown",
      has_convulsions: "unknown",
      lethargic_or_unconscious: "unknown"
    }
  }
};

// CASE 3: HIGH-RISK
// A synthetic case containing a severe physical sign (chest indrawing).
// Should produce Pink - Severe Pneumonia
export const FIXTURE_HIGH_RISK: ImnciAssessment = {
  facts: {
    patient_age_months: 8,
    has_cough_or_difficult_breathing: true,
    respiratory_rate: 55,
    fast_breathing_reported: true,
    chest_indrawing: true,
    stridor_in_calm_child: false,
    danger_signs: {
      unable_to_drink_or_breastfeed: false,
      vomits_everything: false,
      has_convulsions: false,
      lethargic_or_unconscious: false
    }
  }
};

// CASE 4: AGE-THRESHOLD EDGE CASES
// Proves the engine uses age-dependent rules, not flat >50.

// At 11 months, threshold is >=50. RR 49 should be Green (No Pneumonia)
export const FIXTURE_AGE_EDGE_11M: ImnciAssessment = {
  facts: {
    patient_age_months: 11,
    has_cough_or_difficult_breathing: true,
    respiratory_rate: 49,
    fast_breathing_reported: false,
    chest_indrawing: false,
    stridor_in_calm_child: false,
    danger_signs: {
      unable_to_drink_or_breastfeed: false,
      vomits_everything: false,
      has_convulsions: false,
      lethargic_or_unconscious: false
    }
  }
};

// At 12 months, threshold is >=40. RR 49 should be Yellow (Pneumonia)
export const FIXTURE_AGE_EDGE_12M: ImnciAssessment = {
  facts: {
    patient_age_months: 12,
    has_cough_or_difficult_breathing: true,
    respiratory_rate: 49,
    fast_breathing_reported: true,
    chest_indrawing: false,
    stridor_in_calm_child: false,
    danger_signs: {
      unable_to_drink_or_breastfeed: false,
      vomits_everything: false,
      has_convulsions: false,
      lethargic_or_unconscious: false
    }
  }
};
