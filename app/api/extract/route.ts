import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ImnciAssessment } from "@/lib/types";
import { FIXTURE_UNSAFE_INCOMPLETE, FIXTURE_SAFE_COMPLETE, FIXTURE_HIGH_RISK } from "@/lib/fixtures";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    patient_age_months: { type: Type.STRING, description: "Age in months. E.g., '18'. If not explicitly mentioned, MUST be 'unknown'" },
    has_cough_or_difficult_breathing: { type: Type.STRING, description: "Must be 'true', 'false', or 'unknown'." },
    respiratory_rate: { type: Type.STRING, description: "Counted breaths per minute. E.g., '44'. If uncounted, MUST be 'unknown'." },
    fast_breathing_reported: { type: Type.STRING, description: "Must be 'true', 'false', or 'unknown'." },
    chest_indrawing: { type: Type.STRING, description: "Must be 'true', 'false', or 'unknown'." },
    stridor_in_calm_child: { type: Type.STRING, description: "Must be 'true', 'false', or 'unknown'." },
    danger_signs: {
      type: Type.OBJECT,
      properties: {
        unable_to_drink_or_breastfeed: { type: Type.STRING, description: "'true', 'false', or 'unknown'." },
        vomits_everything: { type: Type.STRING, description: "'true', 'false', or 'unknown'." },
        has_convulsions: { type: Type.STRING, description: "'true', 'false', or 'unknown'." },
        lethargic_or_unconscious: { type: Type.STRING, description: "'true', 'false', or 'unknown'." }
      }
    },
    evidence: {
      type: Type.OBJECT,
      properties: {
        age_evidence: { type: Type.STRING, nullable: true },
        cough_evidence: { type: Type.STRING, nullable: true },
        respiratory_evidence: { type: Type.STRING, nullable: true },
        danger_signs_evidence: { type: Type.STRING, nullable: true }
      }
    }
  },
  required: [
    "patient_age_months", "has_cough_or_difficult_breathing", "respiratory_rate",
    "fast_breathing_reported", "chest_indrawing", "stridor_in_calm_child", "danger_signs", "evidence"
  ]
};

const SYSTEM_PROMPT = `
You are an expert clinical data extraction assistant specialized in the Indian National Health Mission (NHM) IMNCI protocol.
Your ONLY responsibility is to extract clinical facts from field notes or transcripts into the specified JSON format.

CRITICAL INVARIANTS:
1. DO NOT diagnose, classify, or recommend treatment.
2. If a sign or value is NOT explicitly mentioned, set its value strictly to "unknown". NEVER assume "false".
3. Extract exact verbatim quotes from the input for the "evidence" field.

TARGET COHORT: Child aged 2 months up to 5 years (2 to 59 months).
`;

function parseExtractedString(val: string): boolean | "unknown" {
  if (val.toLowerCase() === "true") return true;
  if (val.toLowerCase() === "false") return false;
  return "unknown";
}

function parseExtractedNumber(val: string): number | "unknown" {
  if (val.toLowerCase() === "unknown") return "unknown";
  const num = parseInt(val, 10);
  return isNaN(num) ? "unknown" : num;
}

export async function POST(req: Request) {
  try {
    const { text, useMock } = await req.json();

    if (useMock) {
      if (text.includes("FIXTURE_SAFE")) {
        return NextResponse.json({ assessment: FIXTURE_SAFE_COMPLETE, isFallback: true });
      }
      if (text.includes("FIXTURE_HIGH_RISK")) {
        return NextResponse.json({ assessment: FIXTURE_HIGH_RISK, isFallback: true });
      }
      return NextResponse.json({ assessment: FIXTURE_UNSAFE_INCOMPLETE, isFallback: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY found, using fallback fixture.");
      return NextResponse.json({ assessment: FIXTURE_UNSAFE_INCOMPLETE, isFallback: true });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
        temperature: 0.0
      }
    });

    if (!response.text) {
      throw new Error("No response text from Gemini.");
    }

    const rawResult = JSON.parse(response.text);

    // Map strict string representation back to ImnciAssessment types
    const mappedAssessment: ImnciAssessment = {
      facts: {
        patient_age_months: parseExtractedNumber(rawResult.patient_age_months),
        has_cough_or_difficult_breathing: parseExtractedString(rawResult.has_cough_or_difficult_breathing),
        respiratory_rate: parseExtractedNumber(rawResult.respiratory_rate),
        fast_breathing_reported: parseExtractedString(rawResult.fast_breathing_reported),
        chest_indrawing: parseExtractedString(rawResult.chest_indrawing),
        stridor_in_calm_child: parseExtractedString(rawResult.stridor_in_calm_child),
        danger_signs: {
          unable_to_drink_or_breastfeed: parseExtractedString(rawResult.danger_signs?.unable_to_drink_or_breastfeed || "unknown"),
          vomits_everything: parseExtractedString(rawResult.danger_signs?.vomits_everything || "unknown"),
          has_convulsions: parseExtractedString(rawResult.danger_signs?.has_convulsions || "unknown"),
          lethargic_or_unconscious: parseExtractedString(rawResult.danger_signs?.lethargic_or_unconscious || "unknown")
        }
      },
      evidence: rawResult.evidence
    };

    return NextResponse.json({ assessment: mappedAssessment, isFallback: false });

  } catch (error) {
    console.error("Extraction error:", error);
    // Explicit Fallback on API failure
    return NextResponse.json({ assessment: FIXTURE_UNSAFE_INCOMPLETE, isFallback: true });
  }
}
