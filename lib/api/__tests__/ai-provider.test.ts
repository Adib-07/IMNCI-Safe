import { describe, it, expect } from "vitest";
import { createMockProvider, EXTRACTION_SCHEMA } from "../ai-provider";
import type { RawGeminiExtraction } from "../types";

describe("AI Provider", () => {
  describe("createMockProvider", () => {
    const mockExtraction: RawGeminiExtraction = {
      patient_age_months: 18,
      age_group: "child_2_months_to_5_years",
      age_conflict: false,
      ambiguous_terms: [],
      findings: [],
      missing_critical_information: [],
      candidate_protocol_rules: [],
      safe_to_classify: true,
      next_best_question: null,
      requires_human_confirmation: true,
    };

    it("returns the fixed extraction result", async () => {
      const provider = createMockProvider(mockExtraction);
      const result = await provider.extract("any text");
      expect(result.parsed).toBe(mockExtraction);
      expect(result.modelUsed).toBe("mock-provider");
    });

    it("always returns requires_human_confirmation: true", async () => {
      const provider = createMockProvider(mockExtraction);
      const result = await provider.extract("");
      expect(result.parsed.requires_human_confirmation).toBe(true);
    });
  });

  describe("EXTRACTION_SCHEMA", () => {
    it("is a valid schema object", () => {
      expect(EXTRACTION_SCHEMA).toBeDefined();
      expect(EXTRACTION_SCHEMA.type).toBe("OBJECT");
    });

    it("has all required fields", () => {
      const props = EXTRACTION_SCHEMA.properties as Record<string, unknown>;
      expect(props.patient_age_months).toBeDefined();
      expect(props.age_group).toBeDefined();
      expect(props.findings).toBeDefined();
      expect(props.missing_critical_information).toBeDefined();
      expect(props.safe_to_classify).toBeDefined();
      expect(props.requires_human_confirmation).toBeDefined();
    });
  });
});
