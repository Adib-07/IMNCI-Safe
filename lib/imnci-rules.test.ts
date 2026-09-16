import { describe, it, expect } from "vitest";
import { evaluateImnciProtocol } from "./imnci-rules";
import {
  FIXTURE_SAFE_COMPLETE,
  FIXTURE_UNSAFE_INCOMPLETE,
  FIXTURE_HIGH_RISK,
  FIXTURE_AGE_EDGE_11M,
  FIXTURE_AGE_EDGE_12M,
} from "./fixtures";
import { ImnciAssessment } from "./types";

// Helper to get a clean base assessment (all signs confirmed negative, complete data)
const getBaseAssessment = (): ImnciAssessment =>
  JSON.parse(JSON.stringify(FIXTURE_SAFE_COMPLETE));

// Helper to build assessment with overrides
const build = (overrides: Partial<ImnciAssessment["facts"]>): ImnciAssessment => {
  const base = getBaseAssessment();
  return {
    ...base,
    facts: { ...base.facts, ...overrides },
  };
};

describe("IMNCI Deterministic Rules Engine", () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // A. UNKNOWN HANDLING — Safety Invariants
  // ═══════════════════════════════════════════════════════════════════════════
  describe("A. Unknown Handling (Safety Invariants)", () => {
    it("refuses classification if age is unknown", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.classification).toBeNull();
      expect(result.missing_fields.map((m) => m.field)).toContain("patient_age_months");
    });

    it("refuses classification if a general danger sign is unknown (UNSAFE / INCOMPLETE)", () => {
      const result = evaluateImnciProtocol(FIXTURE_UNSAFE_INCOMPLETE);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.classification).toBeNull();
      expect(result.missing_fields.length).toBeGreaterThan(0);
      expect(result.missing_fields.map((m) => m.field)).toContain("unable_to_drink_or_breastfeed");
      expect(result.missing_fields.map((m) => m.field)).toContain("respiratory_rate");
    });

    it("UNKNOWN ≠ FALSE (Danger sign UNKNOWN does not assume FALSE)", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.lethargic_or_unconscious = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.classification).toBeNull();
      expect(result.missing_fields.map((m) => m.field)).toContain("lethargic_or_unconscious");
    });

    it("UNKNOWN for chest_indrawing blocks classification", () => {
      const data = getBaseAssessment();
      data.facts.chest_indrawing = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.classification).toBeNull();
      expect(result.missing_fields.map((m) => m.field)).toContain("chest_indrawing");
    });

    it("UNKNOWN for stridor blocks classification", () => {
      const data = getBaseAssessment();
      data.facts.stridor_in_calm_child = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.classification).toBeNull();
      expect(result.missing_fields.map((m) => m.field)).toContain("stridor_in_calm_child");
    });

    it("UNKNOWN for cough blocks classification", () => {
      const data = getBaseAssessment();
      data.facts.has_cough_or_difficult_breathing = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.classification).toBeNull();
      expect(result.missing_fields.map((m) => m.field)).toContain("has_cough_or_difficult_breathing");
    });

    it("UNKNOWN for RR when cough present blocks classification", () => {
      const data = getBaseAssessment();
      data.facts.has_cough_or_difficult_breathing = true;
      data.facts.respiratory_rate = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.triage_color).toBe("AMBER");
      expect(result.missing_fields.map((m) => m.field)).toContain("respiratory_rate");
    });

    it("multiple unknowns list all missing fields", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.has_convulsions = "unknown";
      data.facts.danger_signs.unable_to_drink_or_breastfeed = "unknown";
      data.facts.chest_indrawing = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("AMBER");
      const fields = result.missing_fields.map((m) => m.field);
      expect(fields).toContain("has_convulsions");
      expect(fields).toContain("unable_to_drink_or_breastfeed");
      expect(fields).toContain("chest_indrawing");
    });

    it("AMBER response includes structured reason", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.classification).toBeNull();
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(10);
    });

    it("AMBER response includes nextQuestion", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.nextQuestion).toBeTruthy();
      expect(typeof result.nextQuestion).toBe("string");
    });

    it("AMBER response has is_safe_to_refer: false", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.is_safe_to_refer).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // B. Age & Out of Cohort Logic
  // ═══════════════════════════════════════════════════════════════════════════
  describe("B. Age & Out of Cohort Logic", () => {
    it("returns OUT_OF_COHORT for age < 2 months", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 1;
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("OUT_OF_COHORT");
      expect(result.classification).toBeNull();
      expect(result.triage_color).toBe("AMBER");
    });

    it("returns OUT_OF_COHORT for age > 59 months", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 60;
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("OUT_OF_COHORT");
      expect(result.classification).toBeNull();
    });

    it("age 0 months is OUT_OF_COHORT", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 0;
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("OUT_OF_COHORT");
    });

    it("age 2 months is IN cohort (lower boundary)", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 2;
      const result = evaluateImnciProtocol(data);
      // Should not be OUT_OF_COHORT — full assessment proceeds
      expect(result.status).not.toBe("OUT_OF_COHORT");
    });

    it("age 59 months is IN cohort (upper boundary)", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 59;
      const result = evaluateImnciProtocol(data);
      expect(result.status).not.toBe("OUT_OF_COHORT");
    });

    it("age 1 month is OUT_OF_COHORT (below lower boundary)", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 1;
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("OUT_OF_COHORT");
    });

    it("age 60 months is OUT_OF_COHORT (above upper boundary)", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 60;
      const result = evaluateImnciProtocol(data);
      expect(result.status).toBe("OUT_OF_COHORT");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // C. Age-specific Respiratory Thresholds
  // ═══════════════════════════════════════════════════════════════════════════
  describe("C. Age-specific Respiratory Thresholds", () => {
    // 2-11 months: threshold = 50 bpm
    it("at 2 months, RR 49 is NOT fast breathing (Green)", () => {
      const data = build({ patient_age_months: 2, respiratory_rate: 49 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
      expect(result.classification).toBe("GREEN");
    });

    it("at 2 months, RR 50 IS fast breathing (Yellow)", () => {
      const data = build({ patient_age_months: 2, respiratory_rate: 50 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
      expect(result.classification).toBe("YELLOW");
    });

    it("at 6 months, RR 49 is NOT fast breathing (Green)", () => {
      const data = build({ patient_age_months: 6, respiratory_rate: 49 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });

    it("at 6 months, RR 50 IS fast breathing (Yellow)", () => {
      const data = build({ patient_age_months: 6, respiratory_rate: 50 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });

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

    // 12-59 months: threshold = 40 bpm
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

    it("at 24 months, RR 39 is NOT fast breathing (Green)", () => {
      const data = build({ patient_age_months: 24, respiratory_rate: 39 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });

    it("at 24 months, RR 40 IS fast breathing (Yellow)", () => {
      const data = build({ patient_age_months: 24, respiratory_rate: 40 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });

    it("at 59 months, RR 39 is NOT fast breathing (Green)", () => {
      const data = build({ patient_age_months: 59, respiratory_rate: 39 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });

    it("at 59 months, RR 40 IS fast breathing (Yellow)", () => {
      const data = build({ patient_age_months: 59, respiratory_rate: 40 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });

    it("no cough means GREEN even with high RR (pneumonia requires cough)", () => {
      const data = build({
        patient_age_months: 24,
        respiratory_rate: 60,
        has_cough_or_difficult_breathing: false,
      });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
      expect(result.classification).toBe("GREEN");
    });

    it("cough with normal RR is GREEN", () => {
      const data = build({
        patient_age_months: 24,
        respiratory_rate: 30,
        has_cough_or_difficult_breathing: true,
      });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // D. General Danger Signs (Pink/Severe Disease)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("D. General Danger Signs (Pink/Severe Disease)", () => {
    const dangerSignsKeys = [
      "unable_to_drink_or_breastfeed",
      "vomits_everything",
      "has_convulsions",
      "lethargic_or_unconscious",
    ] as const;

    dangerSignsKeys.forEach((key) => {
      it(`evaluates ${key} correctly as PINK`, () => {
        const data = getBaseAssessment();
        data.facts.danger_signs[key] = true;
        const result = evaluateImnciProtocol(data);
        expect(result.triage_color).toBe("PINK");
        expect(result.classification).toBe("PINK");
      });
    });

    it("classifies as PINK when multiple danger signs are true", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.vomits_everything = true;
      data.facts.danger_signs.has_convulsions = true;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
      expect(result.classification).toBe("PINK");
    });

    it("PINK response has urgentReferral: true", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.has_convulsions = true;
      const result = evaluateImnciProtocol(data);
      expect(result.urgentReferral).toBe(true);
      expect(result.is_safe_to_refer).toBe(true);
    });

    it("PINK response includes pre_referral_actions", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.has_convulsions = true;
      const result = evaluateImnciProtocol(data);
      expect(result.pre_referral_actions).toBeDefined();
      expect(result.pre_referral_actions!.length).toBeGreaterThan(0);
    });

    it("PINK response includes danger_sign_present: true", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.has_convulsions = true;
      const result = evaluateImnciProtocol(data);
      expect(result.danger_sign_present).toBe(true);
    });

    it("all four danger signs simultaneously → PINK", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.has_convulsions = true;
      data.facts.danger_signs.unable_to_drink_or_breastfeed = true;
      data.facts.danger_signs.vomits_everything = true;
      data.facts.danger_signs.lethargic_or_unconscious = true;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
      expect(result.classification).toBe("PINK");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // E. Severe Physical Signs (Pink)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("E. Severe Physical Signs (Pink)", () => {
    it("classifies chest indrawing as PINK", () => {
      const data = getBaseAssessment();
      data.facts.chest_indrawing = true;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
      expect(result.classification).toBe("PINK");
    });

    it("classifies stridor in calm child as PINK", () => {
      const data = getBaseAssessment();
      data.facts.stridor_in_calm_child = true;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
      expect(result.classification).toBe("PINK");
    });

    it("chest indrawing + stridor together → PINK", () => {
      const data = getBaseAssessment();
      data.facts.chest_indrawing = true;
      data.facts.stridor_in_calm_child = true;
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // F. Complete Assessment
  // ═══════════════════════════════════════════════════════════════════════════
  describe("F. Complete Assessment", () => {
    it("processes FIXTURE_SAFE_COMPLETE correctly to YELLOW", () => {
      const result = evaluateImnciProtocol(FIXTURE_SAFE_COMPLETE);
      expect(result.status).toBe("CLASSIFIED");
      expect(result.triage_color).toBe("YELLOW");
      expect(result.classification).toBe("YELLOW");
      expect(result.missing_fields.length).toBe(0);
    });

    it("processes FIXTURE_HIGH_RISK correctly to PINK", () => {
      const result = evaluateImnciProtocol(FIXTURE_HIGH_RISK);
      expect(result.status).toBe("CLASSIFIED");
      expect(result.triage_color).toBe("PINK");
      expect(result.classification).toBe("PINK");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // G. Explainability — Structured Reasons
  // ═══════════════════════════════════════════════════════════════════════════
  describe("G. Explainability (Structured Reasons)", () => {
    it("every return path includes reason field", () => {
      // Test all paths
      const inputs: ImnciAssessment[] = [
        // AMBER: age unknown
        (() => { const d = getBaseAssessment(); d.facts.patient_age_months = "unknown"; return d; })(),
        // AMBER: danger sign unknown
        FIXTURE_UNSAFE_INCOMPLETE,
        // PINK: danger sign present
        (() => { const d = getBaseAssessment(); d.facts.danger_signs.has_convulsions = true; return d; })(),
        // YELLOW: pneumonia
        FIXTURE_SAFE_COMPLETE,
        // GREEN: no urgent trigger
        (() => { const d = getBaseAssessment(); d.facts.has_cough_or_difficult_breathing = false; d.facts.respiratory_rate = 30; return d; })(),
        // AMBER: out of cohort
        (() => { const d = getBaseAssessment(); d.facts.patient_age_months = 1; return d; })(),
      ];

      for (const input of inputs) {
        const result = evaluateImnciProtocol(input);
        expect(result.reason).toBeDefined();
        expect(typeof result.reason).toBe("string");
        expect(result.reason.length).toBeGreaterThan(5);
      }
    });

    it("every return path includes classification field", () => {
      const inputs: ImnciAssessment[] = [
        (() => { const d = getBaseAssessment(); d.facts.patient_age_months = "unknown"; return d; })(),
        FIXTURE_UNSAFE_INCOMPLETE,
        (() => { const d = getBaseAssessment(); d.facts.danger_signs.has_convulsions = true; return d; })(),
        FIXTURE_SAFE_COMPLETE,
        (() => { const d = getBaseAssessment(); d.facts.patient_age_months = 1; return d; })(),
      ];

      for (const input of inputs) {
        const result = evaluateImnciProtocol(input);
        expect(result.classification).toBeDefined();
      }
    });

    it("PINK reason mentions the triggering danger sign", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.has_convulsions = true;
      const result = evaluateImnciProtocol(data);
      expect(result.reason.toLowerCase()).toContain("convulsions");
    });

    it("YELLOW reason mentions respiratory rate and threshold", () => {
      const result = evaluateImnciProtocol(FIXTURE_SAFE_COMPLETE);
      expect(result.reason).toContain("45");
      expect(result.reason).toContain("40");
    });

    it("GREEN reason mentions no danger signs", () => {
      const data = getBaseAssessment();
      data.facts.has_cough_or_difficult_breathing = false;
      const result = evaluateImnciProtocol(data);
      expect(result.reason.toLowerCase()).toContain("danger sign");
    });

    it("AMBER reason lists missing fields", () => {
      const result = evaluateImnciProtocol(FIXTURE_UNSAFE_INCOMPLETE);
      expect(result.reason).toContain("unconfirmed");
    });

    it("result includes evidence array", () => {
      const result = evaluateImnciProtocol(FIXTURE_SAFE_COMPLETE);
      expect(result.evidence).toBeDefined();
      expect(Array.isArray(result.evidence)).toBe(true);
    });

    it("result includes fields_used array", () => {
      const result = evaluateImnciProtocol(FIXTURE_SAFE_COMPLETE);
      expect(result.fields_used).toBeDefined();
      expect(Array.isArray(result.fields_used)).toBe(true);
      expect(result.fields_used!.length).toBeGreaterThan(0);
    });

    it("result includes protocol_citation", () => {
      const result = evaluateImnciProtocol(FIXTURE_SAFE_COMPLETE);
      expect(result.protocol_citation).toBeDefined();
      expect(typeof result.protocol_citation).toBe("string");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // H. Determinism — Identical Input → Identical Output
  // ═══════════════════════════════════════════════════════════════════════════
  describe("H. Determinism (No AI/Randomness/Network)", () => {
    it("produces identical result for identical input (10 runs)", () => {
      const data = getBaseAssessment();
      const results = Array.from({ length: 10 }, () => evaluateImnciProtocol(data));
      const first = JSON.stringify(results[0]);
      for (const r of results) {
        expect(JSON.stringify(r)).toBe(first);
      }
    });

    it("produces identical PINK for identical danger sign input", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.has_convulsions = true;
      const results = Array.from({ length: 5 }, () => evaluateImnciProtocol(data));
      for (const r of results) {
        expect(r.triage_color).toBe("PINK");
        expect(r.classification).toBe("PINK");
        expect(r.classification_name).toBe(results[0].classification_name);
      }
    });

    it("produces identical AMBER for identical incomplete input", () => {
      const results = Array.from({ length: 5 }, () => evaluateImnciProtocol(FIXTURE_UNSAFE_INCOMPLETE));
      for (const r of results) {
        expect(r.triage_color).toBe("AMBER");
        expect(r.classification).toBeNull();
      }
    });

    it("no Date.now() or Math.random() in classification logic", () => {
      // The function should be pure — same input always gives same output
      const data = getBaseAssessment();
      const r1 = evaluateImnciProtocol(data);
      const r2 = evaluateImnciProtocol(data);
      expect(r1).toEqual(r2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // I. Triage Color Pathway Coverage
  // ═══════════════════════════════════════════════════════════════════════════
  describe("I. Triage Color Pathway Coverage", () => {
    it("PINK via general danger sign (convulsions)", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.has_convulsions = true;
      expect(evaluateImnciProtocol(data).triage_color).toBe("PINK");
    });

    it("PINK via general danger sign (unable to drink)", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.unable_to_drink_or_breastfeed = true;
      expect(evaluateImnciProtocol(data).triage_color).toBe("PINK");
    });

    it("PINK via general danger sign (vomits everything)", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.vomits_everything = true;
      expect(evaluateImnciProtocol(data).triage_color).toBe("PINK");
    });

    it("PINK via general danger sign (lethargic)", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.lethargic_or_unconscious = true;
      expect(evaluateImnciProtocol(data).triage_color).toBe("PINK");
    });

    it("PINK via chest indrawing", () => {
      const data = getBaseAssessment();
      data.facts.chest_indrawing = true;
      expect(evaluateImnciProtocol(data).triage_color).toBe("PINK");
    });

    it("PINK via stridor", () => {
      const data = getBaseAssessment();
      data.facts.stridor_in_calm_child = true;
      expect(evaluateImnciProtocol(data).triage_color).toBe("PINK");
    });

    it("YELLOW via fast breathing + cough", () => {
      const data = build({ patient_age_months: 24, respiratory_rate: 45 });
      expect(evaluateImnciProtocol(data).triage_color).toBe("YELLOW");
    });

    it("GREEN via no cough", () => {
      const data = build({ has_cough_or_difficult_breathing: false, respiratory_rate: 30 });
      expect(evaluateImnciProtocol(data).triage_color).toBe("GREEN");
    });

    it("GREEN via cough with normal RR", () => {
      const data = build({ respiratory_rate: 30 });
      expect(evaluateImnciProtocol(data).triage_color).toBe("GREEN");
    });

    it("AMBER via age unknown", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = "unknown";
      expect(evaluateImnciProtocol(data).triage_color).toBe("AMBER");
    });

    it("AMBER via incomplete danger signs", () => {
      expect(evaluateImnciProtocol(FIXTURE_UNSAFE_INCOMPLETE).triage_color).toBe("AMBER");
    });

    it("AMBER via out of cohort", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 1;
      expect(evaluateImnciProtocol(data).triage_color).toBe("AMBER");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // J. Mixed/Complex Scenarios
  // ═══════════════════════════════════════════════════════════════════════════
  describe("J. Mixed/Complex Scenarios", () => {
    it("one confirmed danger sign + other unknowns → PINK (danger sign overrides)", () => {
      const data = getBaseAssessment();
      data.facts.danger_signs.has_convulsions = true;
      data.facts.danger_signs.unable_to_drink_or_breastfeed = "unknown";
      data.facts.danger_signs.vomits_everything = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
      expect(result.classification).toBe("PINK");
    });

    it("chest indrawing confirmed + unknown danger signs → PINK", () => {
      const data = getBaseAssessment();
      data.facts.chest_indrawing = true;
      data.facts.danger_signs.has_convulsions = "unknown";
      data.facts.danger_signs.unable_to_drink_or_breastfeed = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("PINK");
    });

    it("all danger signs false + fast breathing → YELLOW", () => {
      const data = build({
        patient_age_months: 24,
        respiratory_rate: 45,
        has_cough_or_difficult_breathing: true,
        chest_indrawing: false,
        stridor_in_calm_child: false,
        danger_signs: {
          has_convulsions: false,
          unable_to_drink_or_breastfeed: false,
          vomits_everything: false,
          lethargic_or_unconscious: false,
        },
      });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });

    it("all danger signs false + normal RR → GREEN", () => {
      const data = build({
        patient_age_months: 24,
        respiratory_rate: 30,
        has_cough_or_difficult_breathing: true,
        chest_indrawing: false,
        stridor_in_calm_child: false,
        danger_signs: {
          has_convulsions: false,
          unable_to_drink_or_breastfeed: false,
          vomits_everything: false,
          lethargic_or_unconscious: false,
        },
      });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });

    it("fast breathing but no cough → GREEN (pneumonia requires cough)", () => {
      const data = build({
        patient_age_months: 24,
        respiratory_rate: 50,
        has_cough_or_difficult_breathing: false,
      });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });

    it("age conflict detected via structuredExtraction → AMBER", () => {
      const data = getBaseAssessment();
      data.structuredExtraction = {
        ...data.structuredExtraction!,
        age_conflict: true,
      };
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("AMBER");
      expect(result.classification).toBeNull();
      expect(result.status).toBe("NEEDS_CONFIRMATION");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // K. Regression Tests
  // ═══════════════════════════════════════════════════════════════════════════
  describe("K. Regression Tests", () => {
    it("FIXTURE_SAFE_COMPLETE (24mo, RR 45, cough=true) → YELLOW", () => {
      const result = evaluateImnciProtocol(FIXTURE_SAFE_COMPLETE);
      expect(result.triage_color).toBe("YELLOW");
      expect(result.status).toBe("CLASSIFIED");
      expect(result.missing_fields.length).toBe(0);
      expect(result.classification).toBe("YELLOW");
    });

    it("FIXTURE_HIGH_RISK (14mo, convulsions+unable to drink+lethargic) → PINK", () => {
      const result = evaluateImnciProtocol(FIXTURE_HIGH_RISK);
      expect(result.triage_color).toBe("PINK");
      expect(result.status).toBe("CLASSIFIED");
      expect(result.classification).toBe("PINK");
    });

    it("FIXTURE_UNSAFE_INCOMPLETE (18mo, missing RR/danger signs) → AMBER", () => {
      const result = evaluateImnciProtocol(FIXTURE_UNSAFE_INCOMPLETE);
      expect(result.triage_color).toBe("AMBER");
      expect(result.status).toBe("NEEDS_CONFIRMATION");
      expect(result.classification).toBeNull();
    });

    it("FIXTURE_AGE_EDGE_11M (11mo, RR 49) → GREEN (49 < 50 threshold)", () => {
      const result = evaluateImnciProtocol(FIXTURE_AGE_EDGE_11M);
      expect(result.triage_color).toBe("GREEN");
      expect(result.classification).toBe("GREEN");
    });

    it("FIXTURE_AGE_EDGE_12M (12mo, RR 49) → YELLOW (49 >= 40 threshold)", () => {
      const result = evaluateImnciProtocol(FIXTURE_AGE_EDGE_12M);
      expect(result.triage_color).toBe("YELLOW");
      expect(result.classification).toBe("YELLOW");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // L. Next Question Priority
  // ═══════════════════════════════════════════════════════════════════════════
  describe("L. Next Question Priority", () => {
    it("asks about age first when age is unknown", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.nextQuestion).toContain("age");
    });

    it("asks about drinking when age known but drinking unknown", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 18;
      data.facts.danger_signs.unable_to_drink_or_breastfeed = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.nextQuestion?.toLowerCase()).toContain("drink");
    });

    it("asks about convulsions when convulsions unknown", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 18;
      data.facts.danger_signs.unable_to_drink_or_breastfeed = false;
      data.facts.danger_signs.has_convulsions = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.nextQuestion?.toLowerCase()).toContain("convuls");
    });

    it("asks about RR when cough present and RR unknown", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 18;
      data.facts.danger_signs.unable_to_drink_or_breastfeed = false;
      data.facts.danger_signs.has_convulsions = false;
      data.facts.has_cough_or_difficult_breathing = true;
      data.facts.respiratory_rate = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.nextQuestion?.toLowerCase()).toContain("respiratory rate");
    });

    it("asks about chest indrawing when unknown", () => {
      const data = getBaseAssessment();
      data.facts.patient_age_months = 18;
      data.facts.danger_signs.unable_to_drink_or_breastfeed = false;
      data.facts.danger_signs.has_convulsions = false;
      data.facts.danger_signs.vomits_everything = false;
      data.facts.danger_signs.lethargic_or_unconscious = false;
      data.facts.has_cough_or_difficult_breathing = true;
      data.facts.respiratory_rate = 30;
      data.facts.chest_indrawing = "unknown";
      const result = evaluateImnciProtocol(data);
      expect(result.nextQuestion?.toLowerCase()).toContain("chest wall indrawing");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // M. Safety Invariant — fast_breathing_reported Does NOT Influence Classification
  // ═══════════════════════════════════════════════════════════════════════════
  describe("M. fast_breathing_reported Does NOT Influence Classification", () => {
    it("fast_breathing_reported=true with normal measured RR → GREEN", () => {
      const data = build({
        patient_age_months: 24,
        respiratory_rate: 30,
        has_cough_or_difficult_breathing: true,
        fast_breathing_reported: true,
      });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });

    it("fast_breathing_reported=false with high measured RR → YELLOW", () => {
      const data = build({
        patient_age_months: 24,
        respiratory_rate: 45,
        has_cough_or_difficult_breathing: true,
        fast_breathing_reported: false,
      });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // N. All Danger Signs Negative → GREEN Path
  // ═══════════════════════════════════════════════════════════════════════════
  describe("N. All Danger Signs Negative → GREEN Path", () => {
    it("all danger signs false + no cough → GREEN", () => {
      const data = build({
        has_cough_or_difficult_breathing: false,
        respiratory_rate: 30,
        chest_indrawing: false,
        stridor_in_calm_child: false,
        danger_signs: {
          has_convulsions: false,
          unable_to_drink_or_breastfeed: false,
          vomits_everything: false,
          lethargic_or_unconscious: false,
        },
      });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
      expect(result.classification).toBe("GREEN");
      expect(result.urgentReferral).toBe(false);
      expect(result.is_safe_to_refer).toBe(true);
    });

    it("all danger signs false + cough + normal RR → GREEN", () => {
      const data = build({
        has_cough_or_difficult_breathing: true,
        respiratory_rate: 30,
        chest_indrawing: false,
        stridor_in_calm_child: false,
        danger_signs: {
          has_convulsions: false,
          unable_to_drink_or_breastfeed: false,
          vomits_everything: false,
          lethargic_or_unconscious: false,
        },
      });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // O. Edge Cases — Exact Boundary Values
  // ═══════════════════════════════════════════════════════════════════════════
  describe("O. Edge Cases — Exact Boundary Values", () => {
    it("age 2 months (minimum valid) with normal RR → GREEN", () => {
      const data = build({ patient_age_months: 2, respiratory_rate: 30, has_cough_or_difficult_breathing: true });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
      expect(result.status).not.toBe("OUT_OF_COHORT");
    });

    it("age 59 months (maximum valid) with normal RR → GREEN", () => {
      const data = build({ patient_age_months: 59, respiratory_rate: 30, has_cough_or_difficult_breathing: true });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
      expect(result.status).not.toBe("OUT_OF_COHORT");
    });

    it("age 11 months, RR 49 (below 50 threshold) → GREEN", () => {
      const data = build({ patient_age_months: 11, respiratory_rate: 49 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });

    it("age 11 months, RR 50 (at 50 threshold) → YELLOW", () => {
      const data = build({ patient_age_months: 11, respiratory_rate: 50 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });

    it("age 12 months, RR 39 (below 40 threshold) → GREEN", () => {
      const data = build({ patient_age_months: 12, respiratory_rate: 39 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("GREEN");
    });

    it("age 12 months, RR 40 (at 40 threshold) → YELLOW", () => {
      const data = build({ patient_age_months: 12, respiratory_rate: 40 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });

    it("age 59 months, RR 40 (at 40 threshold) → YELLOW", () => {
      const data = build({ patient_age_months: 59, respiratory_rate: 40 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });

    it("age 2 months, RR 50 (at 50 threshold) → YELLOW", () => {
      const data = build({ patient_age_months: 2, respiratory_rate: 50 });
      const result = evaluateImnciProtocol(data);
      expect(result.triage_color).toBe("YELLOW");
    });
  });
});
