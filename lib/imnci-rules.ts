import { 
  ImnciAssessment, 
  ProtocolResult, 
  MissingFieldRequirement 
} from "./types";

/**
 * IMNCI Protocol Deterministic Rules Engine
 * Scope: Prototype Rule Subset based on Ministry of Health & Family Welfare / WHO-UNICEF IMNCI Guidelines.
 * 
 * Rules in this prototype subset:
 * - IMNCI-AGE-01: Age verification (2 months up to 59 months cohort gating)
 * - IMNCI-GDS-01: General Danger Signs assessment (Convulsions, Inability to feed, Vomiting everything, Lethargy)
 * - IMNCI-RESP-01: Severe chest indrawing / Stridor in calm child (Urgent referral)
 * - IMNCI-PNEU-01: Pneumonia - Age-dependent fast breathing threshold (>=50 for 2-11m, >=40 for 12-59m)
 * - IMNCI-NO-URGENT-01: No urgent referral trigger detected from complete supplied facts
 * - IMNCI-INCOMPLETE-01: Information missing - Classification blocked
 */

export const PROTOTYPE_RULE_SUBSET_NAME = "Indian IMNCI Chart Booklet (Prototype Subset)";

function determineNextPriorityQuestion(
  missingFields: MissingFieldRequirement[],
  facts: ImnciAssessment["facts"]
): string {
  // Priority 1: Age clarification
  if (missingFields.some((m) => m.field === "patient_age_months")) {
    return "What is the child's exact age in completed months?";
  }

  // Priority 2: General danger sign - Ability to drink
  if (missingFields.some((m) => m.field === "unable_to_drink_or_breastfeed")) {
    return "Can the child drink or breastfeed normally?";
  }

  // Priority 3: General danger sign - Convulsions
  if (missingFields.some((m) => m.field === "has_convulsions")) {
    return "Has the child had convulsions (fits or seizures) during this illness?";
  }

  // Priority 4: Respiratory rate if coughing
  if (facts.has_cough_or_difficult_breathing === true && missingFields.some((m) => m.field === "respiratory_rate")) {
    return "What is the measured respiratory rate counted over a full 60 seconds?";
  }

  // Priority 5: Chest indrawing
  if (missingFields.some((m) => m.field === "chest_indrawing")) {
    return "Is there visible lower chest wall indrawing when the child breathes in?";
  }

  // Priority 6: Vomiting everything
  if (missingFields.some((m) => m.field === "vomits_everything")) {
    return "Does the child vomit everything they try to ingest?";
  }

  // Fallback
  return missingFields.length > 0
    ? `Please confirm: ${missingFields[0].reason}`
    : "Review all extracted observations with the caregiver.";
}

export function evaluateImnciProtocol(assessment: ImnciAssessment): ProtocolResult {
  const { facts, evidence, structuredExtraction } = assessment;
  const missingFields: MissingFieldRequirement[] = [];
  const fieldsUsed: string[] = [];
  const triggeringFields: string[] = [];
  const evidenceList: string[] = [];

  // Check if Gemini or input detected an age conflict
  if (structuredExtraction?.age_conflict) {
    return {
      status: "NEEDS_CONFIRMATION",
      classification_status: "NEEDS_CONFIRMATION",
      classification_name: "CANNOT CLASSIFY SAFELY: Age Conflict",
      urgentReferral: false,
      triage_color: "AMBER",
      matchedRule: "IMNCI-AGE-CONFLICT",
      rule_id: "IMNCI-AGE-CONFLICT",
      rule_description: "Conflicting age statements detected in clinical notes. IMNCI thresholds depend strictly on age.",
      evidence: ["Conflicting ages reported in input"],
      triggering_fields: ["patient_age_months"],
      fields_used: ["patient_age_months"],
      missing_fields: [
        {
          field: "patient_age_months",
          reason: "Please resolve the contradictory age statements to apply the correct IMNCI cohort rules.",
          priority: "high"
        }
      ],
      missing_parameters: ["patient_age_months"],
      danger_sign_present: false,
      treatment_instruction: "Resolve contradictory age statements before applying protocol.",
      nextQuestion: "Please confirm the child's single, accurate age in months.",
      protocol_citation: "IMNCI Chart Booklet: Gating Criteria",
      is_safe_to_refer: false,
      requires_human_confirmation: true
    };
  }

  // 1. Age Validation
  if (facts.patient_age_months === "unknown") {
    missingFields.push({
      field: "patient_age_months",
      reason: "Exact age in months is required to select the correct cohort and respiratory rate threshold.",
      priority: "high"
    });
  } else if (typeof facts.patient_age_months === "number") {
    fieldsUsed.push(`Age: ${facts.patient_age_months} months`);
    if (evidence?.age_evidence) evidenceList.push(`Age evidence: "${evidence.age_evidence}"`);

    if (facts.patient_age_months < 2 || facts.patient_age_months > 59) {
      return {
        status: "OUT_OF_COHORT",
        classification_status: "OUT_OF_COHORT",
        classification_name: "OUT OF COHORT (2 - 59 MONTHS)",
        urgentReferral: false,
        triage_color: "AMBER",
        matchedRule: "IMNCI-AGE-01",
        rule_id: "IMNCI-AGE-01",
        rule_description: `Patient age (${facts.patient_age_months} months) is outside the 2 to 59 month IMNCI child protocol scope. Young infants under 2 months follow the 0-2 month sick infant protocol.`,
        evidence: evidence?.age_evidence ? [`"${evidence.age_evidence}"`] : [`Age: ${facts.patient_age_months}mo`],
        triggering_fields: ["patient_age_months"],
        fields_used: fieldsUsed,
        missing_fields: [],
        missing_parameters: [],
        danger_sign_present: false,
        treatment_instruction: "Patient age is outside 2-59 months scope. Refer to age-appropriate protocol.",
        nextQuestion: facts.patient_age_months < 2 
          ? "Apply young infant (0-2 months) protocol for possible serious bacterial infection." 
          : "Refer to pediatric or adult clinic according to age.",
        protocol_citation: "IMNCI Chart Booklet: Cohort Selection (Page 2)",
        is_safe_to_refer: false,
        requires_human_confirmation: true
      };
    }
  }

  // 2. Check Danger Signs
  const gds = facts.danger_signs;
  if (gds.unable_to_drink_or_breastfeed === "unknown") {
    missingFields.push({
      field: "unable_to_drink_or_breastfeed",
      reason: "Must determine if child is unable to drink or breastfeed (General Danger Sign).",
      priority: "high"
    });
  } else {
    fieldsUsed.push(`Unable to drink: ${gds.unable_to_drink_or_breastfeed}`);
    if (gds.unable_to_drink_or_breastfeed === true) {
      triggeringFields.push("unable_to_drink_or_breastfeed");
      evidenceList.push("General Danger Sign: Unable to drink or breastfeed");
    }
  }

  if (gds.vomits_everything === "unknown") {
    missingFields.push({
      field: "vomits_everything",
      reason: "Must confirm whether child vomits everything ingested.",
      priority: "medium"
    });
  } else {
    fieldsUsed.push(`Vomits everything: ${gds.vomits_everything}`);
    if (gds.vomits_everything === true) {
      triggeringFields.push("vomits_everything");
      evidenceList.push("General Danger Sign: Vomits everything");
    }
  }

  if (gds.has_convulsions === "unknown") {
    missingFields.push({
      field: "has_convulsions",
      reason: "Must verify if convulsions occurred during this illness (General Danger Sign).",
      priority: "high"
    });
  } else {
    fieldsUsed.push(`Convulsions: ${gds.has_convulsions}`);
    if (gds.has_convulsions === true) {
      triggeringFields.push("has_convulsions");
      evidenceList.push("General Danger Sign: History of convulsions or currently convulsing");
    }
  }

  if (gds.lethargic_or_unconscious === "unknown") {
    missingFields.push({
      field: "lethargic_or_unconscious",
      reason: "Must assess alertness / whether lethargic or unconscious (General Danger Sign).",
      priority: "high"
    });
  } else {
    fieldsUsed.push(`Lethargic/unconscious: ${gds.lethargic_or_unconscious}`);
    if (gds.lethargic_or_unconscious === true) {
      triggeringFields.push("lethargic_or_unconscious");
      evidenceList.push("General Danger Sign: Abnormally sleepy or unresponsive");
    }
  }

  // 3. Severe Physical Signs
  if (facts.chest_indrawing === "unknown") {
    missingFields.push({
      field: "chest_indrawing",
      reason: "Must examine for lower chest wall indrawing.",
      priority: "high"
    });
  } else {
    fieldsUsed.push(`Chest indrawing: ${facts.chest_indrawing}`);
    if (facts.chest_indrawing === true) {
      triggeringFields.push("chest_indrawing");
      evidenceList.push("Severe respiratory sign: Lower chest wall indrawing");
    }
  }

  if (facts.stridor_in_calm_child === "unknown") {
    missingFields.push({
      field: "stridor_in_calm_child",
      reason: "Must check for harsh stridor sound while child is calm.",
      priority: "medium"
    });
  } else {
    fieldsUsed.push(`Stridor in calm child: ${facts.stridor_in_calm_child}`);
    if (facts.stridor_in_calm_child === true) {
      triggeringFields.push("stridor_in_calm_child");
      evidenceList.push("Severe sign: Stridor in a calm child");
    }
  }

  // 4. Cough / Respiratory Rate Evaluation
  let hasFastBreathing = false;
  if (facts.has_cough_or_difficult_breathing === "unknown") {
    missingFields.push({
      field: "has_cough_or_difficult_breathing",
      reason: "Must ask caregiver if child has cough or difficult breathing.",
      priority: "high"
    });
  } else if (facts.has_cough_or_difficult_breathing === true) {
    fieldsUsed.push("Cough/difficult breathing: Yes");
    if (evidence?.cough_evidence) evidenceList.push(`Cough evidence: "${evidence.cough_evidence}"`);

    if (facts.respiratory_rate === "unknown") {
      missingFields.push({
        field: "respiratory_rate",
        reason: "Counted respiratory rate for 1 full minute is mandatory when cough or difficult breathing is reported.",
        priority: "high"
      });
    } else if (typeof facts.patient_age_months === "number" && typeof facts.respiratory_rate === "number") {
      const threshold = facts.patient_age_months < 12 ? 50 : 40;
      hasFastBreathing = facts.respiratory_rate >= threshold;
      fieldsUsed.push(`Measured RR: ${facts.respiratory_rate} bpm (threshold: ${threshold} bpm)`);
      if (evidence?.respiratory_evidence) evidenceList.push(`RR evidence: "${evidence.respiratory_evidence}"`);
      if (hasFastBreathing) {
        triggeringFields.push("respiratory_rate");
      }
    }
  } else {
    fieldsUsed.push("Cough/difficult breathing: No");
  }

  // Append danger signs specific evidence if available
  if (evidence?.danger_signs_evidence) {
    evidenceList.push(`Reported signs evidence: "${evidence.danger_signs_evidence}"`);
  }

  // EVALUATE EXPLICIT DANGER SIGN TRIGGERS
  // If an explicit general danger sign or severe physical sign is verified, an urgent referral pathway is triggered.
  const generalDangerSigns = [
    "unable_to_drink_or_breastfeed",
    "vomits_everything",
    "has_convulsions",
    "lethargic_or_unconscious"
  ];
  const severePhysicalSigns = ["chest_indrawing", "stridor_in_calm_child"];

  const verifiedDangerSigns = triggeringFields.filter((f) => generalDangerSigns.includes(f));
  const verifiedSevereSigns = triggeringFields.filter((f) => severePhysicalSigns.includes(f));
  const hasUrgentTrigger = verifiedDangerSigns.length > 0 || verifiedSevereSigns.length > 0;

  if (hasUrgentTrigger) {
    const isGds = verifiedDangerSigns.length > 0;
    const ruleId = isGds ? "IMNCI-GDS-01" : "IMNCI-RESP-01";
    const activeUrgentFields = [...verifiedDangerSigns, ...verifiedSevereSigns];
    const ruleDesc = isGds
      ? `General Danger Sign verified (${verifiedDangerSigns.join(", ")}). Any general danger sign indicates severe illness requiring immediate pre-referral treatment and hospital handover.`
      : `Severe physical sign verified (${verifiedSevereSigns.join(", ")}). Severe respiratory distress requires urgent hospital referral.`;

    return {
      status: "CLASSIFIED",
      classification_status: "CLASSIFIED",
      classification_name: "URGENT REFERRAL TRIGGER VERIFIED",
      urgentReferral: true,
      triage_color: "PINK",
      matchedRule: ruleId,
      rule_id: ruleId,
      rule_description: ruleDesc,
      evidence: evidenceList,
      triggering_fields: activeUrgentFields,
      fields_used: fieldsUsed,
      missing_fields: missingFields,
      missing_parameters: missingFields.map((m) => m.field),
      danger_sign_present: true,
      pre_referral_actions: [
        "Give first dose of appropriate antibiotic",
        "Treat to prevent low blood sugar",
        "Keep child warm during transit",
        "Urgent referral to nearest hospital"
      ],
      treatment_instruction: "Urgent referral to hospital after pre-referral treatment.",
      nextQuestion: missingFields.length > 0 
        ? determineNextPriorityQuestion(missingFields, facts) 
        : "Proceed with pre-referral stabilization steps per local protocol.",
      protocol_citation: "IMNCI Chart Booklet: General Danger Signs & Severe Disease (Pink Row)",
      is_safe_to_refer: true,
      requires_human_confirmation: true
    };
  }

  // IF NO DANGER SIGNS, BUT DATA IS INCOMPLETE:
  // We MUST NOT say "safe" or "no urgent trigger" when critical fields are unknown.
  if (missingFields.length > 0) {
    const nextQ = determineNextPriorityQuestion(missingFields, facts);
    return {
      status: "NEEDS_CONFIRMATION",
      classification_status: "NEEDS_CONFIRMATION",
      classification_name: "CANNOT CLASSIFY SAFELY YET",
      urgentReferral: false,
      triage_color: "AMBER",
      matchedRule: "IMNCI-INCOMPLETE-01",
      rule_id: "IMNCI-INCOMPLETE-01",
      rule_description: `Incomplete data: ${missingFields.length} critical clinical item(s) are unconfirmed. IMNCI protocol strictly prohibits assuming absent symptoms are negative.`,
      evidence: evidenceList.length > 0 ? evidenceList : ["Partial observations recorded"],
      triggering_fields: [],
      fields_used: fieldsUsed,
      missing_fields: missingFields,
      missing_parameters: missingFields.map((m) => m.field),
      danger_sign_present: false,
      pre_referral_actions: [],
      treatment_instruction: "Please confirm the missing information before classification.",
      nextQuestion: nextQ,
      protocol_citation: "IMNCI Chart Booklet: Complete Assessment Mandate",
      is_safe_to_refer: false,
      requires_human_confirmation: true
    };
  }

  // ALL REQUIRED FIELDS ARE COMPLETE AND CONFIRMED
  // Check Pneumonia (Yellow) vs No Pneumonia (Green)
  if (facts.has_cough_or_difficult_breathing === true && hasFastBreathing) {
    const threshold = typeof facts.patient_age_months === "number" && facts.patient_age_months < 12 ? 50 : 40;
    return {
      status: "CLASSIFIED",
      classification_status: "CLASSIFIED",
      classification_name: "PNEUMONIA: OUTPATIENT PATHWAY",
      urgentReferral: false,
      triage_color: "YELLOW",
      matchedRule: "IMNCI-PNEU-01",
      rule_id: "IMNCI-PNEU-01",
      rule_description: `Fast breathing verified: Counted RR ${facts.respiratory_rate} bpm meets or exceeds the age threshold of ${threshold} bpm for age ${facts.patient_age_months} months. Outpatient oral antibiotic protocol indicated under health worker guidance.`,
      evidence: evidenceList,
      triggering_fields: ["respiratory_rate"],
      fields_used: fieldsUsed,
      missing_fields: [],
      missing_parameters: [],
      danger_sign_present: false,
      pre_referral_actions: [
        "Give appropriate oral antibiotic for 5 days",
        "Soothe the throat and relieve cough with safe remedy",
        "Advise caregiver when to return immediately",
        "Follow up in 2 days"
      ],
      treatment_instruction: "Give appropriate oral antibiotic for 5 days. Soothe throat and relieve cough. Advise caregiver when to return immediately.",
      nextQuestion: "Advise caregiver on proper administration, fluid intake, and return immediately if danger signs appear.",
      protocol_citation: "IMNCI Chart Booklet: Cough or Difficult Breathing (Yellow Row)",
      is_safe_to_refer: true,
      requires_human_confirmation: true
    };
  }

  // GREEN: No urgent trigger detected from supplied facts
  return {
    status: "CLASSIFIED",
    classification_status: "CLASSIFIED",
    classification_name: "NO URGENT TRIGGER DETECTED FROM SUPPLIED FACTS",
    urgentReferral: false,
    triage_color: "GREEN",
    matchedRule: "IMNCI-NO-URGENT-01",
    rule_id: "IMNCI-NO-URGENT-01",
    rule_description: "All general danger signs negative. No severe chest indrawing or stridor. Respiratory rate is within normal limits for age cohort. Prototype subset reveals no immediate urgent referral criteria from the supplied data.",
    evidence: evidenceList.length > 0 ? evidenceList : ["All assessed signs negative and normal"],
    triggering_fields: [],
    fields_used: fieldsUsed,
    missing_fields: [],
    missing_parameters: [],
    danger_sign_present: false,
    pre_referral_actions: [],
    treatment_instruction: "Counsel caregiver on home care, feeding, fluids, and return immediately if any danger sign develops.",
    nextQuestion: "Counsel caregiver on home care, feeding, fluids, and return immediately if any danger sign develops.",
    protocol_citation: "IMNCI Chart Booklet: Cough or Cold / No Fast Breathing (Green Row)",
    is_safe_to_refer: true,
    requires_human_confirmation: true
  };
}

export const evaluateImnciRules = evaluateImnciProtocol;

