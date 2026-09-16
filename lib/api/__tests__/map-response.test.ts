import { describe, it, expect } from "vitest";
import { mapRawToAssessment } from "../map-response";
import type { RawGeminiExtraction } from "../types";

describe("mapRawToAssessment", () => {
  const makeRaw = (overrides: Partial<RawGeminiExtraction> = {}): RawGeminiExtraction => ({
    patient_age_months: 18,
    age_group: "child_2_months_to_5_years",
    age_conflict: false,
    ambiguous_terms: [],
    findings: [
      {
        field: "patient_age_months",
        label: "Child Age",
        value: "18",
        status: "reported",
        evidence: "18 month old child",
        confidence: 0.95,
      },
      {
        field: "has_cough_or_difficult_breathing",
        label: "Cough",
        value: "true",
        status: "reported",
        evidence: "cough for 2 days",
        confidence: 0.9,
      },
      {
        field: "respiratory_rate",
        label: "Respiratory Rate",
        value: "32",
        status: "measured",
        evidence: "32 breaths per minute",
        confidence: 0.95,
      },
      {
        field: "chest_indrawing",
        label: "Chest Indrawing",
        value: "false",
        status: "observed",
        evidence: "No chest indrawing",
        confidence: 0.9,
      },
      {
        field: "stridor_in_calm_child",
        label: "Stridor",
        value: "false",
        status: "observed",
        evidence: "no stridor",
        confidence: 0.9,
      },
      {
        field: "unable_to_drink_or_breastfeed",
        label: "Unable to Drink",
        value: "false",
        status: "observed",
        evidence: "drinking well",
        confidence: 0.9,
      },
      {
        field: "vomits_everything",
        label: "Vomiting",
        value: "false",
        status: "observed",
        evidence: "no vomiting",
        confidence: 0.9,
      },
      {
        field: "has_convulsions",
        label: "Convulsions",
        value: "false",
        status: "reported",
        evidence: "no convulsions",
        confidence: 0.95,
      },
      {
        field: "lethargic_or_unconscious",
        label: "Lethargy",
        value: "false",
        status: "observed",
        evidence: "alert and playful",
        confidence: 0.95,
      },
    ],
    missing_critical_information: [],
    candidate_protocol_rules: [],
    safe_to_classify: true,
    next_best_question: null,
    requires_human_confirmation: true,
    ...overrides,
  });

  it("maps age correctly", () => {
    const result = mapRawToAssessment(makeRaw());
    expect(result.facts.patient_age_months).toBe(18);
    expect(result.age_months).toBe(18);
  });

  it("maps boolean fields correctly", () => {
    const result = mapRawToAssessment(makeRaw());
    expect(result.facts.has_cough_or_difficult_breathing).toBe(true);
    expect(result.facts.chest_indrawing).toBe(false);
    expect(result.facts.stridor_in_calm_child).toBe(false);
  });

  it("maps respiratory rate correctly", () => {
    const result = mapRawToAssessment(makeRaw());
    expect(result.facts.respiratory_rate).toBe(32);
  });

  it("maps danger signs correctly", () => {
    const result = mapRawToAssessment(makeRaw());
    expect(result.facts.danger_signs.has_convulsions).toBe(false);
    expect(result.facts.danger_signs.unable_to_drink_or_breastfeed).toBe(false);
    expect(result.facts.danger_signs.vomits_everything).toBe(false);
    expect(result.facts.danger_signs.lethargic_or_unconscious).toBe(false);
  });

  it("maps evidence correctly", () => {
    const result = mapRawToAssessment(makeRaw());
    expect(result.evidence.age_evidence).toBe("18 month old child");
    expect(result.evidence.cough_evidence).toBe("cough for 2 days");
    expect(result.evidence.respiratory_evidence).toBe("32 breaths per minute");
  });

  it("returns unknown for missing findings", () => {
    const raw = makeRaw({
      patient_age_months: null,
      findings: [],
    });
    const result = mapRawToAssessment(raw);
    expect(result.facts.patient_age_months).toBe("unknown");
    expect(result.facts.respiratory_rate).toBe("unknown");
    expect(result.facts.chest_indrawing).toBe("unknown");
  });

  it("handles null patient_age_months", () => {
    const raw = makeRaw({ patient_age_months: null });
    const result = mapRawToAssessment(raw);
    expect(result.structuredExtraction.patient_age_months).toBeNull();
  });

  it("handles missing arrays gracefully", () => {
    const raw = makeRaw({
      findings: undefined,
      missing_critical_information: undefined,
      candidate_protocol_rules: undefined,
      ambiguous_terms: undefined,
    });
    const result = mapRawToAssessment(raw);
    expect(result.structuredExtraction.findings).toEqual([]);
    expect(result.structuredExtraction.missing_critical_information).toEqual([]);
    expect(result.structuredExtraction.candidate_protocol_rules).toEqual([]);
    expect(result.structuredExtraction.ambiguous_terms).toEqual([]);
  });

  it("preserves requires_human_confirmation as true", () => {
    const result = mapRawToAssessment(makeRaw());
    expect(result.structuredExtraction.requires_human_confirmation).toBe(true);
  });

  it("maps danger_signs evidence from any danger sign field", () => {
    const raw = makeRaw({
      findings: [
        {
          field: "has_convulsions",
          label: "Convulsions",
          value: "true",
          status: "reported",
          evidence: "had convulsions",
          confidence: 0.95,
        },
      ],
    });
    const result = mapRawToAssessment(raw);
    expect(result.evidence.danger_signs_evidence).toBe("had convulsions");
  });
});
