/**
 * API Layer — barrel exports
 *
 * Import from "@/lib/api" to access:
 *   - Types: ExtractionRequest, ExtractionResponse, etc.
 *   - Validation: validateExtractionRequest, isInputSafe
 *   - Errors: ExtractionError, normalizeError, errorResponse, logError
 *   - AI Provider: createGeminiProvider, createMockProvider
 *   - Deterministic: extractDeterministically
 *   - Mapping: mapRawToAssessment
 */

// Types
export type {
  ExtractionRequest,
  ExtractionResponse,
  StructuredExtractionResponse,
  ExtractedField,
  MissingCriticalField,
  CandidateRule,
  RawGeminiExtraction,
  ApiErrorCode,
  ApiError,
  UnknownValue,
} from "./types";
export { UNKNOWN, API_CONFIG } from "./types";

// Validation
export { validateExtractionRequest, isInputSafe } from "./validation";
export type { ValidationResult } from "./validation";

// Errors
export { ExtractionError, normalizeError, errorResponse, validationErrorResponse, logError, createError } from "./errors";

// AI Provider
export { createGeminiProvider, createMockProvider, EXTRACTION_SCHEMA, SYSTEM_PROMPT } from "./ai-provider";
export type { AiProvider, AiProviderResult } from "./ai-provider";

// Deterministic Extraction
export { extractDeterministically } from "./extract-deterministic";
export type { DeterministicResult } from "./extract-deterministic";

// Response Mapping
export { mapRawToAssessment } from "./map-response";
export type { MappedAssessment } from "./map-response";
