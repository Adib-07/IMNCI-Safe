/**
 * AI Provider Layer — Gemini Integration
 *
 * ARCHITECTURE BOUNDARY:
 *   Gemini role:  parse, extract, structure, quote evidence
 *   Gemini NEVER: classify, override protocol rules, invent observations, decide color
 *
 * This module wraps the @google/genai SDK and enforces:
 *   - Structured JSON output with schema validation
 *   - Temperature 0.0 for deterministic extraction
 *   - System prompt with explicit safety invariants
 *   - Timeout and error handling
 */

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RawGeminiExtraction, API_CONFIG } from "./types";

// ── Schema Definition ─────────────────────────────────────────────────────

/**
 * The structured output schema for Gemini.
 * Forces the model to return a well-typed JSON object matching
 * our extraction contract. Missing fields become null/unknown.
 */
export const EXTRACTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    patient_age_months: {
      type: Type.INTEGER,
      nullable: true,
      description:
        "Patient age in completed months (2 to 59). Set to null if unknown or not stated.",
    },
    age_group: {
      type: Type.STRING,
      enum: ["young_infant", "child_2_months_to_5_years", "unknown"],
      description:
        "Classification of age cohort: 'young_infant' if < 2 months, 'child_2_months_to_5_years' if 2-59 months, otherwise 'unknown'.",
    },
    age_conflict: {
      type: Type.BOOLEAN,
      description:
        'Set to true if input contains contradictory or conflicting ages (e.g. "6 months and 4 years").',
    },
    ambiguous_terms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "List of clinically vague phrases from input that cannot be safely converted to formal danger signs without clarification.",
    },
    findings: {
      type: Type.ARRAY,
      description: "Array of extracted clinical facts and observations.",
      items: {
        type: Type.OBJECT,
        properties: {
          field: {
            type: Type.STRING,
            description:
              "Standard field key (e.g. 'patient_age_months', 'respiratory_rate', 'has_convulsions').",
          },
          label: {
            type: Type.STRING,
            description: "Human-readable label.",
          },
          value: {
            type: Type.STRING,
            description:
              "Extracted value as string ('true', 'false', '44', or 'unknown').",
          },
          status: {
            type: Type.STRING,
            enum: ["reported", "observed", "measured", "inferred", "unknown"],
            description:
              "How the fact was obtained.",
          },
          evidence: {
            type: Type.STRING,
            description:
              "Exact verbatim phrase or quote from input supporting this finding.",
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence score between 0.0 and 1.0.",
          },
        },
        required: ["field", "label", "value", "status", "evidence", "confidence"],
      },
    },
    missing_critical_information: {
      type: Type.ARRAY,
      description: "Critical IMNCI protocol fields that were NOT supplied or are unknown.",
      items: {
        type: Type.OBJECT,
        properties: {
          field: { type: Type.STRING, description: "The missing field identifier." },
          reason: {
            type: Type.STRING,
            description: "Why this field is clinically required under IMNCI protocol.",
          },
          priority: {
            type: Type.STRING,
            enum: ["high", "medium", "low"],
            description: "Safety priority of obtaining this missing piece of data.",
          },
        },
        required: ["field", "reason", "priority"],
      },
    },
    candidate_protocol_rules: {
      type: Type.ARRAY,
      description:
        "IMNCI candidate rules that might apply based solely on the extracted observations.",
      items: {
        type: Type.OBJECT,
        properties: {
          rule_id: { type: Type.STRING },
          reason: { type: Type.STRING },
          evidence_fields: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["rule_id", "reason", "evidence_fields"],
      },
    },
    safe_to_classify: {
      type: Type.BOOLEAN,
      description:
        "Set to false if ANY required IMNCI field is missing or unknown.",
    },
    next_best_question: {
      type: Type.STRING,
      nullable: true,
      description:
        "The single most critical follow-up question to resolve missing data.",
    },
    requires_human_confirmation: {
      type: Type.BOOLEAN,
      description: "Must always be true.",
    },
  },
  required: [
    "patient_age_months",
    "age_group",
    "age_conflict",
    "ambiguous_terms",
    "findings",
    "missing_critical_information",
    "candidate_protocol_rules",
    "safe_to_classify",
    "next_best_question",
    "requires_human_confirmation",
  ],
};

// ── System Prompt ─────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `
You are an expert clinical protocol-extraction assistant specialized in the Indian National Health Mission (NHM) / WHO-UNICEF Integrated Management of Neonatal and Childhood Illness (IMNCI) protocol for children aged 2 months to 5 years (2-59 months).

Your ONLY role is to act as a universal bridge between messy human intent (multilingual Hindi/English speech, informal field notes, transcribed audio, or photos of clinic slips) and structured IMNCI assessment facts.

ARCHITECTURE BOUNDARY — YOU MUST NEVER:
1. NEVER diagnose diseases.
2. NEVER calculate drug dosages.
3. NEVER dictate medical treatments.
4. NEVER classify the child as Pink, Yellow, or Green.
5. NEVER override or interpret protocol rules.
6. NEVER infer that an unmentioned symptom is "absent" or "false".
7. NEVER invent clinical observations not present in the input.

SAFETY INVARIANTS:
1. If a symptom or danger sign is NOT mentioned, its value MUST be "unknown" and its status MUST be "unknown".
2. If an input contains contradictory age information, set "age_conflict": true and "safe_to_classify": false.
3. If a statement is vague (e.g. "child looks very weak"), list it under "ambiguous_terms", mark the status as "unknown" or "inferred with low confidence", and ask a clarifying question.
4. If the child has a reported cough or difficulty breathing, a counted respiratory rate is MANDATORY under IMNCI. If not explicitly counted, mark "respiratory_rate" as "unknown" and set "safe_to_classify": false.
5. Extract exact verbatim evidence quotes from the input for every finding.
6. "requires_human_confirmation" MUST always be true.
`;

// ── Provider Interface ────────────────────────────────────────────────────

export interface AiProviderResult {
  parsed: RawGeminiExtraction;
  modelUsed: string;
}

export interface AiProvider {
  extract(text: string, image?: string): Promise<AiProviderResult>;
}

// ── Gemini Implementation ─────────────────────────────────────────────────

/**
 * Create a Gemini-based AI provider.
 * Throws ExtractionError on timeout, provider failure, or schema mismatch.
 */
export function createGeminiProvider(apiKey: string): AiProvider {
  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || API_CONFIG.DEFAULT_MODEL;

  return {
    async extract(text: string, image?: string): Promise<AiProviderResult> {
      const contentParts: Array<
        string | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (text) {
        contentParts.push(text);
      }

      if (image) {
        const match = image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        if (match) {
          contentParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      // Wrap in a timeout race
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("timeout: Gemini API request exceeded time limit")),
          API_CONFIG.AI_TIMEOUT_MS
        );
      });

      const extractPromise = ai.models.generateContent({
        model: modelName,
        contents: contentParts,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: EXTRACTION_SCHEMA,
          temperature: 0.0,
        },
      });

      const response = await Promise.race([extractPromise, timeoutPromise]);

      if (!response.text) {
        throw new Error("Empty response received from Gemini.");
      }

      let parsed: RawGeminiExtraction;
      try {
        parsed = JSON.parse(response.text) as RawGeminiExtraction;
      } catch {
        throw new Error("Gemini response was not valid JSON matching the extraction schema.");
      }

      // Validate minimum required fields
      if (
        typeof parsed.safe_to_classify !== "boolean" ||
        typeof parsed.requires_human_confirmation !== "boolean"
      ) {
        throw new Error("Gemini response missing required boolean fields.");
      }

      return { parsed, modelUsed: modelName };
    },
  };
}

// ── Mock Provider (for testing / offline) ─────────────────────────────────

/**
 * Create a mock provider that returns a fixed extraction result.
 * Used in tests and when GEMINI_API_KEY is not configured.
 */
export function createMockProvider(result: RawGeminiExtraction): AiProvider {
  return {
    async extract(): Promise<AiProviderResult> {
      return { parsed: result, modelUsed: "mock-provider" };
    },
  };
}
