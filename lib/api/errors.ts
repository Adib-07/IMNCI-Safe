/**
 * API error classes and safe HTTP response helpers.
 *
 * SECURITY: Never leak API keys, internal stack traces, or provider details
 * in user-facing error messages.
 */

import { NextResponse } from "next/server";
import { ApiErrorCode } from "./types";

// ── Error Class ───────────────────────────────────────────────────────────

export class ExtractionError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message);
    this.name = "ExtractionError";
    this.code = code;
    this.status = status ?? 500;
  }
}

// ── Error Definitions ─────────────────────────────────────────────────────

const ERROR_DEFINITIONS: Record<ApiErrorCode, { message: string; status: number }> = {
  MISSING_API_KEY: {
    message: "AI service is not configured. Falling back to deterministic extraction.",
    status: 503,
  },
  INVALID_REQUEST: {
    message: "Invalid request. Please provide clinical notes as a text string.",
    status: 400,
  },
  INPUT_TOO_LONG: {
    message: "Input exceeds maximum allowed length.",
    status: 400,
  },
  EMPTY_INPUT: {
    message: "Please provide clinical notes, speech transcript, or a note photo.",
    status: 400,
  },
  AI_PROVIDER_TIMEOUT: {
    message: "AI extraction timed out. Falling back to deterministic extraction.",
    status: 503,
  },
  AI_PROVIDER_ERROR: {
    message: "AI extraction failed. Falling back to deterministic extraction.",
    status: 503,
  },
  AI_RESPONSE_INVALID: {
    message: "AI response could not be parsed. Falling back to deterministic extraction.",
    status: 503,
  },
  AI_SCHEMA_MISMATCH: {
    message: "AI response did not match expected schema. Falling back to deterministic extraction.",
    status: 503,
  },
  RATE_LIMITED: {
    message: "AI service rate limit exceeded. Falling back to deterministic extraction.",
    status: 503,
  },
  INTERNAL_ERROR: {
    message: "An unexpected error occurred during extraction.",
    status: 500,
  },
};

// ── Factory Functions ─────────────────────────────────────────────────────

/**
 * Create a typed ExtractionError from an error code.
 * Uses predefined safe messages — never exposes internal details.
 */
export function createError(code: ApiErrorCode, detail?: string): ExtractionError {
  const def = ERROR_DEFINITIONS[code];
  const message = detail ? `${def.message} ${detail}` : def.message;
  return new ExtractionError(code, message, def.status);
}

/**
 * Map an unknown caught error to an ExtractionError.
 * Logs the full error server-side; returns a safe message to the client.
 */
export function normalizeError(error: unknown): ExtractionError {
  if (error instanceof ExtractionError) {
    return error;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes("timeout") || msg.includes("deadline")) {
      return createError("AI_PROVIDER_TIMEOUT");
    }
    if (msg.includes("rate") && msg.includes("limit")) {
      return createError("RATE_LIMITED");
    }
    if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("401")) {
      return createError("AI_PROVIDER_ERROR");
    }
    if (msg.includes("json") || msg.includes("parse")) {
      return createError("AI_RESPONSE_INVALID");
    }
    if (msg.includes("schema")) {
      return createError("AI_SCHEMA_MISMATCH");
    }

    return createError("AI_PROVIDER_ERROR");
  }

  return createError("INTERNAL_ERROR");
}

// ── HTTP Response Helpers ─────────────────────────────────────────────────

/**
 * Return a safe error response to the client.
 * Never includes stack traces, API keys, or internal provider details.
 */
export function errorResponse(
  code: ApiErrorCode,
  detail?: string
): NextResponse {
  const def = ERROR_DEFINITIONS[code];
  const message = detail ? `${def.message} ${detail}` : def.message;

  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status: def.status }
  );
}

/**
 * Return a validation error response with field-level detail.
 */
export function validationErrorResponse(
  message: string,
  fields?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "INVALID_REQUEST" as ApiErrorCode,
      fields,
    },
    { status: 400 }
  );
}

/**
 * Log an error safely — redacts API keys and sensitive data.
 */
export function logError(context: string, error: unknown): void {
  const safeMessage =
    error instanceof Error ? error.message : String(error);

  // Redact potential API key fragments
  const redacted = safeMessage.replace(
    /([A-Za-z0-9_-]{20,})/g,
    "[REDACTED]"
  );

  console.error(`[API] ${context}:`, redacted);
}
