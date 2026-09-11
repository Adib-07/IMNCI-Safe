import { describe, it, expect } from "vitest";
import { evaluateImnciProtocol } from "./imnci-rules";
import { FIXTURE_SAFE_COMPLETE, FIXTURE_UNSAFE_INCOMPLETE, FIXTURE_HIGH_RISK, FIXTURE_AGE_EDGE_11M, FIXTURE_AGE_EDGE_12M } from "./fixtures";
import { ImnciAssessment } from "./types";

// Helper to get a clean base assessment
const getBaseAssessment = (): ImnciAssessment => JSON.parse(JSON.stringify(FIXTURE_SAFE_COMPLETE));

describe("IMNCI Deterministic Rules Engine", () => {

  describe("A. Unknown Handling (Safety Invariants)", () => {
    it("refuses classification if age is unknown", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.missing_fields.map(m => m.field)).toContain("patient_age_months");
    });

    it("refuses classification if a general danger sign is unknown (UNSAFE / INCOMPLETE)", () => {
      const result = evaluateImnciProtocol(FIXTURE_UNSAFE_INCOMPLETE);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.missing_fields.length).toBeGreaterThan(0);
      expect(result.missing_fields.map(m => m.field)).toContain("unable_to_drink_or_breastfeed");
      expect(result.missing_fields.map(m => m.field)).toContain("respiratory_rate");
    });

    it("UNKNOWN ≠ FALSE (Danger sign UNKNOWN does not assume FALSE)", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.lethargic_or_unconscious = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.missing_fields.map(m => m.field)).toContain("lethargic_or_unconscious");
    });
  });

  describe("B. Age & Out of Cohort Logic", () => {
    it("returns OUT_OF_COHORT for age < 2 months", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 1;
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("OUT_OF_COHORT");
    });

    it("returns OUT_OF_COHORT for age > 59 months", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 60;
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("OUT_OF_COHORT");
    });
  });

  describe("C. Age-specific Respiratory Thresholds", () => {
    it("at 11 months, RR 49 is NOT fast breathing (Green)", () => {
      const result = evaluateImnciProtocol(FIXTURE_AGE_EDGE_11M);
      expect(result.status).toBe("CLASSIFIED");
      expect(result.triage_color).toBe("GREEN");
    });

    it("at 11 months, RR 50 IS fast breathing (Yellow)", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 11;
      data.facts.respiratory_rate = 50;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });

    it("at 12 months, RR 39 is NOT fast breathing (Green)", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 12;
      data.facts.respiratory_rate = 39;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });

    it("at 12 months, RR 40 IS fast breathing (Yellow)", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 12;
      data.facts.respiratory_rate = 40;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });

    it("at 12 months, RR 49 IS fast breathing (Yellow)", () => {
      const result = evaluateImnciProtocol(FIXTURE_AGE_EDGE_12M);
      expect(result.status).toBe("CLASSIFIED");
      expect(result.triage_color).toBe("YELLOW");
    });
  });

  describe("D. General Danger Signs (Pink/Severe Disease)", () => {
    const dangerSignsKeys = [
      "unable_to_drink_or_breastfeed",
      "vomits_everything",
      "has_convulsions",
      "lethargic_or_unconscious"
    ] as const;

    dangerSignsKeys.forEach((key) => {
      it(`evaluates ${key} correctly as PINK`, () => {
        const data = getBaseAssessment();
        data.facts.danger_signs[key] = true;
        const result = evaluateImnciProtocol(data);
        expect(result.triage_color).toBe("PINK");
      });
    });

    it("classifies as PINK when multiple danger signs are true", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.vomits_everything = true;
      data.facts.danger_signs.has_convulsions = true;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
    });
  });

  describe("E. Severe Physical Signs (Pink)", () => {
    it("classifies chest indrawing as PINK", () => {
      const data = getBaseAssessment();
      data.facts.chest_indrawing = true;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
    });

    it("classifies stridor in calm child as PINK", () => {
      const data = getBaseAssessment();
      data.facts.stridor_in_calm_child = true;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
    });
  });

  describe("F. Complete Assessment", () => {
    it("processes FIXTURE_SAFE_COMPLETE correctly to YELLOW", () => {
      const result = evaluateImnciProtocol(FIXTURE_SAFE_COMPLETE);
      expect(result.status).toBe("CLASSIFIED");
      expect(result.triage_color).toBe("YELLOW");
      expect(result.missing_fields.length).toBe(0);
    });

    it("processes FIXTURE_HIGH_RISK correctly to PINK", () => {
      const result = evaluateImnciProtocol(FIXTURE_HIGH_RISK);
      expect(result.status).toBe("CLASSIFIED");
      expect(result.triage_color).toBe("PINK");
    });
  });
});
