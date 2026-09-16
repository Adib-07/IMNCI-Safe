import { describe, it, expect } from "vitest";
import { extractDeterministically } from "../extract-deterministic";

describe("extractDeterministically", () => {
  describe("age extraction", () => {
    it("extracts age in months", () => {
      const result = extractDeterministically("18 month old child with cough");
      expect(result.facts.patient_age_months).toBe(18);
    });

    it("extracts age in years and converts to months", () => {
      const result = extractDeterministically("2 year old child");
      expect(result.facts.patient_age_months).toBe(24);
    });

    it("detects contradictory ages", () => {
      const result = extractDeterministically(
        "Child is 6 months old and also 4 years old"
      );
      expect(result.facts.patient_age_months).toBe("unknown");
      expect(result.ambiguousTerms.some((t) => t.includes("Contradictory"))).toBe(
        true
      );
    });

    it("returns unknown for missing age", () => {
      const result = extractDeterministically("Child has cough and fever");
      expect(result.facts.patient_age_months).toBe("unknown");
      expect(
        result.missingInfo.some((m) => m.field === "patient_age_months")
      ).toBe(true);
    });
  });

  describe("cough detection", () => {
    it("detects cough present", () => {
      const result = extractDeterministically(
        "18 month old with cough for 2 days"
      );
      expect(result.facts.has_cough_or_difficult_breathing).toBe(true);
    });

    it("detects cough denied", () => {
      const result = extractDeterministically(
        "18 month old, no cough, fever only"
      );
      expect(result.facts.has_cough_or_difficult_breathing).toBe(false);
    });

    it("returns unknown when cough not mentioned", () => {
      const result = extractDeterministically("18 month old child");
      expect(result.facts.has_cough_or_difficult_breathing).toBe("unknown");
    });
  });

  describe("respiratory rate extraction", () => {
    it("extracts RR with label", () => {
      const result = extractDeterministically(
        "18 month old with cough, respiratory rate: 45"
      );
      expect(result.facts.respiratory_rate).toBe(45);
    });

    it("extracts RR with bpm suffix", () => {
      const result = extractDeterministically(
        "18 month old with cough, 50 bpm"
      );
      expect(result.facts.respiratory_rate).toBe(50);
    });

    it("requires RR when cough present", () => {
      const result = extractDeterministically(
        "18 month old with cough"
      );
      expect(result.facts.respiratory_rate).toBe("unknown");
      expect(
        result.missingInfo.some((m) => m.field === "respiratory_rate")
      ).toBe(true);
    });
  });

  describe("danger signs", () => {
    it("detects convulsions present", () => {
      const result = extractDeterministically(
        "18 month old with convulsions"
      );
      expect(result.facts.danger_signs.has_convulsions).toBe(true);
    });

    it("detects convulsions denied", () => {
      const result = extractDeterministically(
        "18 month old, no convulsions"
      );
      expect(result.facts.danger_signs.has_convulsions).toBe(false);
    });

    it("detects unable to drink", () => {
      const result = extractDeterministically(
        "18 month old, unable to drink"
      );
      expect(result.facts.danger_signs.unable_to_drink_or_breastfeed).toBe(
        true
      );
    });

    it("detects vomits everything", () => {
      const result = extractDeterministically(
        "18 month old, vomits everything"
      );
      expect(result.facts.danger_signs.vomits_everything).toBe(true);
    });

    it("detects lethargic", () => {
      const result = extractDeterministically(
        "18 month old, lethargic"
      );
      expect(result.facts.danger_signs.lethargic_or_unconscious).toBe(true);
    });

    it("returns unknown for unmentioned danger signs", () => {
      const result = extractDeterministically(
        "18 month old with cough"
      );
      expect(result.facts.danger_signs.has_convulsions).toBe("unknown");
      expect(result.facts.danger_signs.unable_to_drink_or_breastfeed).toBe(
        "unknown"
      );
      expect(result.facts.danger_signs.vomits_everything).toBe("unknown");
      expect(result.facts.danger_signs.lethargic_or_unconscious).toBe(
        "unknown"
      );
    });

    it("marks unmentioned danger signs as missing", () => {
      const result = extractDeterministically(
        "18 month old with cough"
      );
      const missingFields = result.missingInfo.map((m) => m.field);
      expect(missingFields).toContain("has_convulsions");
      expect(missingFields).toContain("unable_to_drink_or_breastfeed");
      expect(missingFields).toContain("vomits_everything");
      expect(missingFields).toContain("lethargic_or_unconscious");
    });
  });

  describe("chest indrawing", () => {
    it("detects chest indrawing present", () => {
      const result = extractDeterministically(
        "18 month old with chest indrawing"
      );
      expect(result.facts.chest_indrawing).toBe(true);
    });

    it("detects chest indrawing absent", () => {
      const result = extractDeterministically(
        "18 month old, no chest indrawing"
      );
      expect(result.facts.chest_indrawing).toBe(false);
    });
  });

  describe("stridor", () => {
    it("detects stridor present", () => {
      const result = extractDeterministically(
        "18 month old with stridor"
      );
      expect(result.facts.stridor_in_calm_child).toBe(true);
    });

    it("detects stridor absent", () => {
      const result = extractDeterministically(
        "18 month old, no stridor"
      );
      expect(result.facts.stridor_in_calm_child).toBe(false);
    });
  });

  describe("ambiguous terms", () => {
    it("detects vague phrases", () => {
      const result = extractDeterministically(
        "18 month old, child looks very weak"
      );
      expect(result.ambiguousTerms).toContain("very weak / kamzor");
    });

    it("detects multiple vague phrases", () => {
      const result = extractDeterministically(
        "18 month old, child looks very weak and thoda sust"
      );
      expect(result.ambiguousTerms.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("safe_to_classify", () => {
    it("returns false when fields are missing", () => {
      const result = extractDeterministically("18 month old child");
      expect(result.structuredExtraction.safe_to_classify).toBe(false);
    });

    it("returns true when all fields present", () => {
      const result = extractDeterministically(
        "18 month old child with cough, respiratory rate 32, no chest indrawing, no stridor, alert and playful, drinking well, no vomiting, no convulsions"
      );
      expect(result.structuredExtraction.safe_to_classify).toBe(true);
    });
  });

  describe("candidate rules", () => {
    it("suggests IMNCI-GDS-01 for danger signs", () => {
      const result = extractDeterministically(
        "18 month old with convulsions"
      );
      const ruleIds = result.candidateRules.map((r) => r.rule_id);
      expect(ruleIds).toContain("IMNCI-GDS-01");
    });

    it("suggests IMNCI-RESP-01 for chest indrawing", () => {
      const result = extractDeterministically(
        "18 month old with chest indrawing"
      );
      const ruleIds = result.candidateRules.map((r) => r.rule_id);
      expect(ruleIds).toContain("IMNCI-RESP-01");
    });
  });

  describe("evidence collection", () => {
    it("collects evidence for extracted fields", () => {
      const result = extractDeterministically(
        "18 month old with cough, respiratory rate 45"
      );
      expect(result.evidence.age_months).toBeDefined();
      expect(result.evidence.cough).toBeDefined();
      expect(result.evidence.respiratory_rate).toBeDefined();
    });

    it("returns null evidence for unknown fields", () => {
      const result = extractDeterministically("18 month old child");
      expect(result.evidence.cough).toBeFalsy();
      expect(result.evidence.respiratory_rate).toBeFalsy();
    });
  });
});
