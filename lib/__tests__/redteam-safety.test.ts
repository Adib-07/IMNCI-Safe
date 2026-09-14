import { describe, it, expect } from "vitest";
import { evaluateImnciProtocol } from "../imnci-rules";
import { ImnciAssessment } from "../types";
import { 
  FIXTURE_SAFE_COMPLETE, 
  FIXTURE_UNSAFE_INCOMPLETE, 
  FIXTURE_HIGH_RISK, 
  DEMO_CASE_URGENT, 
  DEMO_CASE_NO_URGENT 
} from "../fixtures";

const cloneAssessment = (src: ImnciAssessment): ImnciAssessment =>
  JSON.parse(JSON.stringify(src));

describe("RED-TEAM SAFETY AUDIT: IMNCI Protocol Decision Engine", () => {

  // TEST 1: Missing fields
  describe("1. Missing Fields Handling", () => {
    it("blocks classification and returns AMBER when age is missing", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      assessment.facts.patient_age_months = "unknown";
      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("AMBER");
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.missing_parameters).toContain("patient_age_months");
    });

    it("blocks classification when respiratory rate is missing and cough is present", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      assessment.facts.has_cough_or_difficult_breathing = true;
      assessment.facts.respiratory_rate = "unknown";
      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("AMBER");
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.missing_parameters).toContain("respiratory_rate");
    });

    it("blocks classification when any general danger sign is unknown", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      assessment.facts.danger_signs.unable_to_drink_or_breastfeed = "unknown";
      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("AMBER");
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.missing_parameters).toContain("unable_to_drink_or_breastfeed");
    });

    it("blocks classification when chest indrawing is unknown and no danger signs present", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      assessment.facts.chest_indrawing = "unknown";
      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("AMBER");
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.missing_parameters).toContain("chest_indrawing");
    });
  });

  // TEST 2: Contradictory facts
  describe("2. Contradictory Facts Handling", () => {
    it("flags age conflict and blocks triage when age conflict is detected", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      if (!assessment.structuredExtraction) {
        assessment.structuredExtraction = {
          patient_age_months: null,
          age_group: "child_2_months_to_5_years",
          age_conflict: true,
          ambiguous_terms: ["Contradictory age: 6 months vs 4 years"],
          findings: [],
          missing_critical_information: [],
          candidate_protocol_rules: [],
          safe_to_classify: false,
          next_best_question: "Confirm single age in months",
          requires_human_confirmation: true,
          missing_critical_fields: ["patient_age_months"],
          verbatim_quotes: {}
        };
      } else {
        assessment.structuredExtraction.age_conflict = true;
      }
      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("AMBER");
      expect(result.matchedRule).toBe("IMNCI-AGE-CONFLICT");
      expect(result.status).toBe("NEEDS_CONFIRMATION");
    });
  });

  // TEST 3: Vague symptoms
  describe("3. Vague Symptoms & Ambiguous Terms", () => {
    it("does not treat vague symptoms as negative danger signs", () => {
      const assessment = cloneAssessment(FIXTURE_UNSAFE_INCOMPLETE);
      // Vague input like 'child looks weak' does not clear convulsions or unable to drink
      expect(assessment.facts.danger_signs.unable_to_drink_or_breastfeed).toBe("unknown");
      const result = evaluateImnciProtocol(assessment);
      // Must NOT be Green!
      expect(result.triage_color).not.toBe("GREEN");
      expect(result.triage_color).toBe("AMBER");
    });
  });

  // TEST 4 & 5: No invented facts & Missing not negative
  describe("4. Invariant: Missing is NEVER treated as Negative", () => {
    it("ensures unknown danger signs are never treated as negative (false)", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      // Danger signs explicitly set to unknown
      assessment.facts.danger_signs.has_convulsions = "unknown";
      assessment.facts.danger_signs.vomits_everything = "unknown";
      assessment.facts.danger_signs.lethargic_or_unconscious = "unknown";
      assessment.facts.danger_signs.unable_to_drink_or_breastfeed = "unknown";

      const result = evaluateImnciProtocol(assessment);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.classification_name).toContain("CANNOT CLASSIFY SAFELY");
    });
  });

  // TEST 6: Urgent Trigger
  describe("5. Urgent Trigger Execution", () => {
    it("triggers Pink immediate referral when convulsions are present", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      assessment.facts.danger_signs.has_convulsions = true;
      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("PINK");
      expect(result.urgentReferral).toBe(true);
      expect(result.matchedRule).toBe("IMNCI-GDS-01");
      expect(result.danger_sign_present).toBe(true);
    });

    it("triggers Pink immediate referral when unable to drink or breastfeed", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      assessment.facts.danger_signs.unable_to_drink_or_breastfeed = true;
      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("PINK");
      expect(result.urgentReferral).toBe(true);
      expect(result.matchedRule).toBe("IMNCI-GDS-01");
    });

    it("triggers Pink immediate referral when chest indrawing is present", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      assessment.facts.chest_indrawing = true;
      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("PINK");
      expect(result.urgentReferral).toBe(true);
      expect(result.matchedRule).toBe("IMNCI-RESP-01");
    });

    it("triggers Pink immediate referral when stridor in calm child is present", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      assessment.facts.stridor_in_calm_child = true;
      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("PINK");
      expect(result.urgentReferral).toBe(true);
      expect(result.matchedRule).toBe("IMNCI-RESP-01");
    });
  });

  // TEST 7: No Urgent Trigger (Green)
  describe("6. No Urgent Trigger (Green State)", () => {
    it("returns GREEN only when all danger signs and required fields are complete and negative", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      // Age: 18 months, RR: 32 (normal for >12m where threshold is 40)
      assessment.facts.patient_age_months = 18;
      assessment.facts.respiratory_rate = 32;
      assessment.facts.has_cough_or_difficult_breathing = true;
      assessment.facts.chest_indrawing = false;
      assessment.facts.stridor_in_calm_child = false;
      assessment.facts.danger_signs = {
        unable_to_drink_or_breastfeed: false,
        vomits_everything: false,
        has_convulsions: false,
        lethargic_or_unconscious: false
      };

      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("GREEN");
      expect(result.urgentReferral).toBe(false);
      expect(result.matchedRule).toBe("IMNCI-NO-URGENT-01");
      expect(result.classification_name).toContain("NO URGENT TRIGGER DETECTED");
    });
  });

  // TEST 8: Fast Breathing Outpatient (Yellow)
  describe("7. Outpatient Pneumonia (Yellow State)", () => {
    it("returns YELLOW for child 18m with RR 44 bpm (threshold >= 40)", () => {
      const assessment = cloneAssessment(FIXTURE_SAFE_COMPLETE);
      assessment.facts.patient_age_months = 18;
      assessment.facts.respiratory_rate = 44;
      assessment.facts.has_cough_or_difficult_breathing = true;
      assessment.facts.chest_indrawing = false;
      assessment.facts.stridor_in_calm_child = false;
      assessment.facts.danger_signs = {
        unable_to_drink_or_breastfeed: false,
        vomits_everything: false,
        has_convulsions: false,
        lethargic_or_unconscious: false
      };

      const result = evaluateImnciProtocol(assessment);
      expect(result.triage_color).toBe("YELLOW");
      expect(result.urgentReferral).toBe(false);
      expect(result.matchedRule).toBe("IMNCI-PNEU-01");
      expect(result.classification_name).toContain("PNEUMONIA");
    });
  });

  // TEST 9: Invariant: NEVER calls output a diagnosis
  describe("8. Invariant: Output terminology is NEVER 'Diagnosis'", () => {
    it("classification name and instructions avoid the word 'diagnosis'", () => {
      const testCases = [
        FIXTURE_SAFE_COMPLETE,
        FIXTURE_UNSAFE_INCOMPLETE,
        FIXTURE_HIGH_RISK,
        DEMO_CASE_URGENT.assessment,
        DEMO_CASE_NO_URGENT.assessment
      ];

      for (const testCase of testCases) {
        const result = evaluateImnciProtocol(testCase);
        expect(result.classification_name.toLowerCase()).not.toContain("diagnosis");
        expect(result.treatment_instruction?.toLowerCase()).not.toContain("diagnosed");
      }
    });
  });

  // TEST 10: Human Confirmation Gate
  describe("9. Invariant: Requires Human Confirmation", () => {
    it("ensures requires_human_confirmation is always true", () => {
      const results = [
        evaluateImnciProtocol(FIXTURE_SAFE_COMPLETE),
        evaluateImnciProtocol(FIXTURE_UNSAFE_INCOMPLETE),
        evaluateImnciProtocol(FIXTURE_HIGH_RISK)
      ];

      for (const res of results) {
        expect(res.requires_human_confirmation).toBe(true);
      }
    });
  });
});
