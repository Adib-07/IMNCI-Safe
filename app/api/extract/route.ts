/**
 * POST /api/extract
 *
 * Clinical note extraction endpoint.
 *
 * ARCHITECTURE:
 *   1. Validate request
 *   2. Handle demo fixtures (deterministic, labeled as such)
 *   3. If GEMINI_API_KEY present → AI extraction → map response
 *   4. If GEMINI_API_KEY missing → deterministic fallback
 *   5. On AI failure → deterministic fallback (never crash)
 *
 * SAFETY:
 *   - Gemini extracts observations only; never classifies
 *   - Missing information → "unknown", never false
 *   - Deterministic rules engine classifies downstream (not in this route)
 */

import { NextResponse } from "next/server";
import { validateExtractionRequest, isInputSafe } from "@/lib/api/validation";
import {
  extractDeterministically,
  type DeterministicResult,
} from "@/lib/api/extract-deterministic";
import { mapRawToAssessment } from "@/lib/api/map-response";
import {
  createGeminiProvider,
  type AiProvider,
} from "@/lib/api/ai-provider";
import {
  normalizeError,
  errorResponse,
  logError,
} from "@/lib/api/errors";
import {
  DEMO_CASE_INCOMPLETE,
  DEMO_CASE_URGENT,
  DEMO_CASE_NO_URGENT,
} from "@/lib/fixtures";
import { sanitizeInput } from "@/lib/sanitize";
import type { ExtractionResponse, RawGeminiExtraction } from "@/lib/api/types";

// ── Demo Case Handler ─────────────────────────────────────────────────────

const DEMO_CASES = new Map<
  string,
  { assessment: ExtractionResponse["assessment"]; label: string }
>([
  [
    "case-incomplete",
    {
      assessment: DEMO_CASE_INCOMPLETE.assessment as ExtractionResponse["assessment"],
      label: "synthetic-fixture",
    },
  ],
  [
    "case-urgent",
    {
      assessment: DEMO_CASE_URGENT.assessment as ExtractionResponse["assessment"],
      label: "synthetic-fixture",
    },
  ],
  [
    "case-no-urgent",
    {
      assessment: DEMO_CASE_NO_URGENT.assessment as ExtractionResponse["assessment"],
      label: "synthetic-fixture",
    },
  ],
]);

function handleDemoCase(
  demoCaseId: string,
  startTime: number
): NextResponse {
  for (const [pattern, data] of DEMO_CASES) {
    if (demoCaseId === pattern || demoCaseId.includes(pattern.replace("case-", ""))) {
      return NextResponse.json({
        success: true,
        assessment: data.assessment,
        extraction: data.assessment.structuredExtraction,
        isFallback: false,
        modelUsed: data.label,
        latencyMs: Date.now() - startTime,
      });
    }
  }

  return errorResponse("INVALID_REQUEST", `Unknown demo case: "${demoCaseId}".`);
}

// ── Build Assessment from Deterministic Result ────────────────────────────

function buildAssessmentFromDeterministic(
  result: DeterministicResult,
  rawInput: string,
  modality: "voice" | "text" | "photo"
): ExtractionResponse {
  return {
    success: true,
    assessment: {
      rawInput,
      modality,
      facts: {
        ...result.facts,
      },
      evidence: {
        age_evidence: result.evidence.age_months || null,
        cough_evidence: result.evidence.cough || null,
        respiratory_evidence: result.evidence.respiratory_rate || null,
        danger_signs_evidence:
          result.evidence.has_convulsions ||
          result.evidence.unable_to_drink_or_breastfeed ||
          result.evidence.vomits_everything ||
          result.evidence.lethargic_or_unconscious ||
          null,
        chest_indrawing_evidence: result.evidence.chest_indrawing || null,
        stridor_evidence: result.evidence.stridor || null,
      },
      structuredExtraction: {
        patient_age_months:
          typeof result.facts.patient_age_months === "number"
            ? result.facts.patient_age_months
            : null,
        age_group:
          typeof result.facts.patient_age_months === "number" &&
          result.facts.patient_age_months < 2
            ? "young_infant"
            : "child_2_months_to_5_years",
        age_conflict: result.ambiguousTerms.some((t) =>
          t.includes("Contradictory ages")
        ),
        ambiguous_terms: result.ambiguousTerms,
        findings: result.findings,
        missing_critical_information: result.missingInfo,
        candidate_protocol_rules: result.candidateRules,
        safe_to_classify: result.missingInfo.length === 0,
        next_best_question:
          result.missingInfo.length > 0 ? result.missingInfo[0].reason : null,
        requires_human_confirmation: true,
        missing_critical_fields: result.missingInfo.map((m) => m.field),
        verbatim_quotes: {},
      },
      age_months: result.facts.patient_age_months,
      respiratory_rate: result.facts.respiratory_rate,
      chest_indrawing: result.facts.chest_indrawing,
      stridor: result.facts.stridor_in_calm_child,
      danger_signs: result.facts.danger_signs,
    },
    extraction: {
      patient_age_months:
        typeof result.facts.patient_age_months === "number"
          ? result.facts.patient_age_months
          : null,
      age_group:
        typeof result.facts.patient_age_months === "number" &&
        result.facts.patient_age_months < 2
          ? "young_infant"
          : "child_2_months_to_5_years",
      age_conflict: result.ambiguousTerms.some((t) =>
        t.includes("Contradictory ages")
      ),
      ambiguous_terms: result.ambiguousTerms,
      findings: result.findings,
      missing_critical_information: result.missingInfo,
      candidate_protocol_rules: result.candidateRules,
      safe_to_classify: result.missingInfo.length === 0,
      next_best_question:
        result.missingInfo.length > 0 ? result.missingInfo[0].reason : null,
      requires_human_confirmation: true,
      missing_critical_fields: result.missingInfo.map((m) => m.field),
      verbatim_quotes: {},
    },
    isFallback: true,
    modelUsed: "deterministic-safe-extractor",
    latencyMs: 0,
  };
}

// ── AI Extraction Flow ────────────────────────────────────────────────────

async function runAiExtraction(
  text: string,
  image: string | undefined,
  modality: "voice" | "text" | "photo",
  rawInput: string,
  aiProvider: AiProvider,
  startTime: number
): Promise<NextResponse> {
  const { parsed, modelUsed } = await aiProvider.extract(text, image);

  const mapped = mapRawToAssessment(parsed as RawGeminiExtraction);

  const response: ExtractionResponse = {
    success: true,
    assessment: {
      rawInput,
      modality,
      facts: mapped.facts,
      evidence: mapped.evidence,
      structuredExtraction: {
        ...mapped.structuredExtraction,
        verbatim_quotes: mapped.structuredExtraction.verbatim_quotes || {},
      },
      age_months: mapped.age_months,
      respiratory_rate: mapped.respiratory_rate,
      chest_indrawing: mapped.chest_indrawing,
      stridor: mapped.stridor,
      danger_signs: mapped.danger_signs,
    },
    extraction: {
      ...mapped.structuredExtraction,
      verbatim_quotes: mapped.structuredExtraction.verbatim_quotes || {},
    },
    isFallback: false,
    modelUsed,
    latencyMs: Date.now() - startTime,
  };

  return NextResponse.json(response);
}

// ── Route Handler ─────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("INVALID_REQUEST", "Request body must be valid JSON.");
    }

    // 2. Validate request
    const validation = validateExtractionRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          code: "INVALID_REQUEST",
          fields: validation.fields,
        },
        { status: 400 }
      );
    }

    const { text, image, demoCaseId, inputModality } = validation.sanitized!;

    // 3. Handle demo fixtures
    if (demoCaseId) {
      return handleDemoCase(demoCaseId, startTime);
    }

    // 4. Sanitize text
    const sanitizedText = sanitizeInput(text);
    const rawInput = sanitizedText || "Multimodal note photo";

    // 5. Safety check for injection patterns
    if (sanitizedText && !isInputSafe(sanitizedText)) {
      return errorResponse(
        "INVALID_REQUEST",
        "Input contains potentially unsafe content."
      );
    }

    // 6. Determine modality for assessment
    const modality: "voice" | "text" | "photo" = inputModality || "text";

    // 7. Try AI extraction, fall back to deterministic
    if (process.env.GEMINI_API_KEY) {
      try {
        const aiProvider = createGeminiProvider(process.env.GEMINI_API_KEY);
        return await runAiExtraction(
          sanitizedText,
          image,
          modality,
          rawInput,
          aiProvider,
          startTime
        );
      } catch (error: unknown) {
        logError("Gemini extraction failed, falling back to deterministic", error);
        // Fall through to deterministic
      }
    }

    // 8. Deterministic fallback (no API key or AI failed)
    const deterministicResult = extractDeterministically(sanitizedText);
    const response = buildAssessmentFromDeterministic(
      deterministicResult,
      rawInput,
      modality
    );
    response.latencyMs = Date.now() - startTime;

    return NextResponse.json(response);
  } catch (error: unknown) {
    logError("Extraction route error", error);

    const normalized = normalizeError(error);

    // Try to provide a deterministic fallback on unexpected errors
    try {
      const fallbackResult = extractDeterministically("");
      const fallbackResponse = buildAssessmentFromDeterministic(
        fallbackResult,
        "",
        "text"
      );
      fallbackResponse.success = false;
      fallbackResponse.error = normalized.message;
      fallbackResponse.latencyMs = Date.now() - startTime;

      return NextResponse.json(fallbackResponse, { status: 503 });
    } catch {
      return errorResponse(normalized.code);
    }
  }
}
