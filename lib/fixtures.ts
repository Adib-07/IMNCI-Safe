import { ImnciAssessment } from "./types";

export interface DemoCaseMeta {
  id: string;
  number: number;
  label: string;
  tag: string;
  badgeColor: string;
  text: string;
  sampleText?: string;
  description: string;
  expectedOutcome: string;
  assessment: ImnciAssessment;
}

// ── CASE 1: MISSING CRITICAL INFORMATION ──
// Messy code-mixed field notes missing counted RR and danger sign confirmations.
// Deterministic engine MUST refuse classification and display amber warning.
export const DEMO_CASE_INCOMPLETE: DemoCaseMeta = {
  id: "case-incomplete",
  number: 1,
  label: "Missing critical information",
  tag: "Gating safety",
  badgeColor: "text-amber-700 bg-amber-50 border-amber-300",
  text: "Baccha 18 months ka hai, kal se saans tez hai, doodh thoda le raha hai… bas.",
  description: "Code-mixed notes where caregiver reports fast breathing but no RR was counted, and danger signs remain unconfirmed.",
  expectedOutcome: "Classification blocked (Amber). Identifies missing RR and feeding status. Asks highest-priority question.",
  assessment: {
    rawInput: "Baccha 18 months ka hai, kal se saans tez hai, doodh thoda le raha hai… bas.",
    modality: "text",
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
    },
    evidence: {
      age_evidence: "Baccha 18 months ka hai",
      cough_evidence: "saans tez hai",
      respiratory_evidence: null,
      danger_signs_evidence: "doodh thoda le raha hai (unclear if unable to drink)",
      chest_indrawing_evidence: null,
      stridor_evidence: null
    },
    structuredExtraction: {
      patient_age_months: 18,
      age_group: "child_2_months_to_5_years",
      findings: [
        {
          field: "patient_age_months",
          label: "Patient Age",
          value: 18,
          status: "reported",
          evidence: "Baccha 18 months ka hai",
          confidence: 0.98
        },
        {
          field: "fast_breathing_reported",
          label: "Caregiver Reported Fast Breathing",
          value: true,
          status: "reported",
          evidence: "kal se saans tez hai",
          confidence: 0.95
        },
        {
          field: "respiratory_rate",
          label: "Measured Respiratory Rate",
          value: null,
          status: "unknown",
          evidence: "Not counted in 60s",
          confidence: 0.0
        },
        {
          field: "unable_to_drink_or_breastfeed",
          label: "Ability to Drink/Breastfeed",
          value: null,
          status: "unknown",
          evidence: "doodh thoda le raha hai (vague)",
          confidence: 0.4
        },
        {
          field: "has_convulsions",
          label: "Convulsions History",
          value: null,
          status: "unknown",
          evidence: "Not mentioned",
          confidence: 0.0
        },
        {
          field: "chest_indrawing",
          label: "Lower Chest Wall Indrawing",
          value: null,
          status: "unknown",
          evidence: "Not examined",
          confidence: 0.0
        }
      ],
      missing_critical_information: [
        {
          field: "respiratory_rate",
          reason: "Mandatory counted breaths/min over 60 seconds to evaluate pneumonia threshold (40 bpm for 18mo).",
          priority: "high"
        },
        {
          field: "unable_to_drink_or_breastfeed",
          reason: "General danger sign: Must confirm if child is able to ingest liquids.",
          priority: "high"
        },
        {
          field: "has_convulsions",
          reason: "General danger sign: Must ask if child experienced fits or seizures.",
          priority: "high"
        },
        {
          field: "chest_indrawing",
          reason: "Physical sign of severe respiratory distress: Must visually check lower chest wall.",
          priority: "high"
        }
      ],
      candidate_protocol_rules: [
        {
          rule_id: "IMNCI-INCOMPLETE-01",
          reason: "Protocol cannot classify without complete danger sign check and respiratory count.",
          evidence_fields: ["respiratory_rate", "unable_to_drink_or_breastfeed"]
        }
      ],
      safe_to_classify: false,
      next_best_question: "Can the child drink or breastfeed normally?",
      requires_human_confirmation: true
    }
  }
};

// ── CASE 2: URGENT REFERRAL PATHWAY ──
// General danger signs explicitly present (Convulsions + Inability to breastfeed).
// Deterministic engine MUST trigger urgent referral (Pink row) with exact cited evidence.
export const DEMO_CASE_URGENT: DemoCaseMeta = {
  id: "case-urgent",
  number: 2,
  label: "Urgent referral pathway",
  tag: "General danger sign",
  badgeColor: "text-rose-700 bg-rose-50 border-rose-300",
  text: "Baccha 14 months ka hai. 2 din se tez bukhar aur khansi hai. Aaj subah se jhatke (convulsions) aaye hain aur doodh bilkul nahi pee raha. Baccha behosh jaisa lag raha hai.",
  description: "Explicit general danger signs reported by caregiver: convulsions, inability to drink, and lethargy.",
  expectedOutcome: "Urgent referral verified (Pink). Matched Rule IMNCI-GDS-01. Human confirmation required before handoff.",
  assessment: {
    rawInput: "Baccha 14 months ka hai. 2 din se tez bukhar aur khansi hai. Aaj subah se jhatke (convulsions) aaye hain aur doodh bilkul nahi pee raha. Baccha behosh jaisa lag raha hai.",
    modality: "text",
    facts: {
      patient_age_months: 14,
      has_cough_or_difficult_breathing: true,
      respiratory_rate: 48,
      fast_breathing_reported: true,
      chest_indrawing: false,
      stridor_in_calm_child: false,
      danger_signs: {
        unable_to_drink_or_breastfeed: true,
        vomits_everything: false,
        has_convulsions: true,
        lethargic_or_unconscious: true
      }
    },
    evidence: {
      age_evidence: "Baccha 14 months ka hai",
      cough_evidence: "2 din se tez bukhar aur khansi hai",
      respiratory_evidence: "Measured 48 bpm",
      danger_signs_evidence: "Aaj subah se jhatke (convulsions) aaye hain aur doodh bilkul nahi pee raha. Baccha behosh jaisa lag raha hai",
      chest_indrawing_evidence: null,
      stridor_evidence: null
    },
    structuredExtraction: {
      patient_age_months: 14,
      age_group: "child_2_months_to_5_years",
      findings: [
        {
          field: "patient_age_months",
          label: "Patient Age",
          value: 14,
          status: "reported",
          evidence: "Baccha 14 months ka hai",
          confidence: 0.99
        },
        {
          field: "has_convulsions",
          label: "Convulsions (Jhatke)",
          value: true,
          status: "reported",
          evidence: "Aaj subah se jhatke (convulsions) aaye hain",
          confidence: 0.99
        },
        {
          field: "unable_to_drink_or_breastfeed",
          label: "Unable to Drink/Breastfeed",
          value: true,
          status: "reported",
          evidence: "doodh bilkul nahi pee raha",
          confidence: 0.98
        },
        {
          field: "lethargic_or_unconscious",
          label: "Lethargic / Abnormally Sleepy",
          value: true,
          status: "reported",
          evidence: "behosh jaisa lag raha hai",
          confidence: 0.92
        },
        {
          field: "has_cough_or_difficult_breathing",
          label: "Cough or Difficult Breathing",
          value: true,
          status: "reported",
          evidence: "2 din se tez bukhar aur khansi hai",
          confidence: 0.97
        }
      ],
      missing_critical_information: [],
      candidate_protocol_rules: [
        {
          rule_id: "IMNCI-GDS-01",
          reason: "General danger signs present: convulsions, unable to drink, lethargic state.",
          evidence_fields: ["has_convulsions", "unable_to_drink_or_breastfeed", "lethargic_or_unconscious"]
        }
      ],
      safe_to_classify: true,
      next_best_question: null,
      requires_human_confirmation: true
    }
  }
};

// ── CASE 3: NO URGENT SIGN DETECTED FROM SUPPLIED FACTS ──
// Complete observations within normal parameters.
// Engine evaluates green row, explicitly stating this is NOT a diagnosis or guarantee of safety.
export const DEMO_CASE_NO_URGENT: DemoCaseMeta = {
  id: "case-no-urgent",
  number: 3,
  label: "No urgent trigger detected",
  tag: "Complete observations",
  badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-300",
  text: "24 month old child brought with mild runny nose and cough for 2 days. Counted respiratory rate is 32 breaths per minute. No chest indrawing, no stridor. Child is alert, playful, drinking water well, no vomiting, no convulsions.",
  description: "Complete clinical facts recorded: normal respiratory rate (32 < 40 bpm cutoff), all danger signs ruled out.",
  expectedOutcome: "Verified no urgent trigger from supplied data (Green). Clearly notes prototype limitations & home-care counseling.",
  assessment: {
    rawInput: "24 month old child brought with mild runny nose and cough for 2 days. Counted respiratory rate is 32 breaths per minute. No chest indrawing, no stridor. Child is alert, playful, drinking water well, no vomiting, no convulsions.",
    modality: "text",
    facts: {
      patient_age_months: 24,
      has_cough_or_difficult_breathing: true,
      respiratory_rate: 32,
      fast_breathing_reported: false,
      chest_indrawing: false,
      stridor_in_calm_child: false,
      danger_signs: {
        unable_to_drink_or_breastfeed: false,
        vomits_everything: false,
        has_convulsions: false,
        lethargic_or_unconscious: false
      }
    },
    evidence: {
      age_evidence: "24 month old child",
      cough_evidence: "cough for 2 days",
      respiratory_evidence: "Counted respiratory rate is 32 breaths per minute",
      danger_signs_evidence: "drinking water well, no vomiting, no convulsions, child is alert",
      chest_indrawing_evidence: "No chest indrawing",
      stridor_evidence: "no stridor"
    },
    structuredExtraction: {
      patient_age_months: 24,
      age_group: "child_2_months_to_5_years",
      findings: [
        {
          field: "patient_age_months",
          label: "Patient Age",
          value: 24,
          status: "measured",
          evidence: "24 month old child",
          confidence: 0.99
        },
        {
          field: "respiratory_rate",
          label: "Measured Respiratory Rate",
          value: 32,
          status: "measured",
          evidence: "Counted respiratory rate is 32 breaths per minute",
          confidence: 0.98
        },
        {
          field: "chest_indrawing",
          label: "Chest Indrawing",
          value: false,
          status: "observed",
          evidence: "No chest indrawing",
          confidence: 0.97
        },
        {
          field: "stridor_in_calm_child",
          label: "Stridor in Calm Child",
          value: false,
          status: "observed",
          evidence: "no stridor",
          confidence: 0.97
        },
        {
          field: "unable_to_drink_or_breastfeed",
          label: "Unable to Drink",
          value: false,
          status: "observed",
          evidence: "drinking water well",
          confidence: 0.98
        },
        {
          field: "has_convulsions",
          label: "Convulsions",
          value: false,
          status: "reported",
          evidence: "no convulsions",
          confidence: 0.99
        },
        {
          field: "lethargic_or_unconscious",
          label: "Lethargy",
          value: false,
          status: "observed",
          evidence: "Child is alert, playful",
          confidence: 0.98
        }
      ],
      missing_critical_information: [],
      candidate_protocol_rules: [
        {
          rule_id: "IMNCI-NO-URGENT-01",
          reason: "No danger signs, normal respiratory rate (32 bpm is below 40 bpm cutoff for 24 months).",
          evidence_fields: ["respiratory_rate", "danger_signs"]
        }
      ],
      safe_to_classify: true,
      next_best_question: null,
      requires_human_confirmation: true
    }
  }
};

export const GUIDED_DEMO_CASES = [
  DEMO_CASE_INCOMPLETE,
  DEMO_CASE_URGENT,
  DEMO_CASE_NO_URGENT,
];

// Backwards compatibility for existing unit tests
export const FIXTURE_SAFE_COMPLETE: ImnciAssessment = {
  ...DEMO_CASE_NO_URGENT.assessment,
  facts: {
    ...DEMO_CASE_NO_URGENT.assessment.facts,
    patient_age_months: 24,
    respiratory_rate: 45,
    has_cough_or_difficult_breathing: true
  }
};
export const FIXTURE_UNSAFE_INCOMPLETE: ImnciAssessment = DEMO_CASE_INCOMPLETE.assessment;
export const FIXTURE_HIGH_RISK: ImnciAssessment = DEMO_CASE_URGENT.assessment;

export const FIXTURE_AGE_EDGE_11M: ImnciAssessment = {
  ...DEMO_CASE_NO_URGENT.assessment,
  facts: {
    ...DEMO_CASE_NO_URGENT.assessment.facts,
    patient_age_months: 11,
    respiratory_rate: 49,
    has_cough_or_difficult_breathing: true
  }
};

export const FIXTURE_AGE_EDGE_12M: ImnciAssessment = {
  ...DEMO_CASE_NO_URGENT.assessment,
  facts: {
    ...DEMO_CASE_NO_URGENT.assessment.facts,
    patient_age_months: 12,
    respiratory_rate: 49,
    has_cough_or_difficult_breathing: true
  }
};

