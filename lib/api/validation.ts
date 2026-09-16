/**
 * Request body validation for the extraction API.
 *
 * Validates:
 * - Request body structure
 * - Text input presence and length
 * - Image data format
 * - Demo case IDs
 * - Input modality values
 */

import { ExtractionRequest, API_CONFIG } from "./types";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fields?: Record<string, string>;
  sanitized?: ExtractionRequest & { text: string };
}

/**
 * Validate and sanitize an extraction request body.
 * Returns either a validated request or structured error info.
 */
export function validateExtractionRequest(
  body: unknown
): ValidationResult {
  if (!body || typeof body !== "object") {
    return {
      valid: false,
      error: "Request body must be a JSON object.",
    };
  }

  const record = body as Record<string, unknown>;

  // Extract and validate fields
  const text =
    typeof record.text === "string" ? record.text.trim() : "";
  const image =
    typeof record.image === "string" ? record.image : undefined;
  const demoCaseId =
    typeof record.demoCaseId === "string" ? record.demoCaseId.trim() : undefined;
  const rawModality = record.inputModality;

  // Validate modality
  const inputModality: "voice" | "text" | "photo" =
    rawModality === "voice" || rawModality === "photo" || rawModality === "text"
      ? rawModality
      : "text";

  // If demo case, validate and return early
  if (demoCaseId) {
    const validDemoIds = [
      "case-incomplete",
      "case-urgent",
      "case-no-urgent",
    ];
    const isPartialMatch = validDemoIds.some((id) => demoCaseId.includes(id.replace("case-", "")));

    if (!isPartialMatch) {
      return {
        valid: false,
        error: `Unknown demo case ID: "${demoCaseId}". Valid IDs: ${validDemoIds.join(", ")}`,
        fields: { demoCaseId: "Invalid demo case ID" },
      };
    }

    // Demo cases don't need text input
    return {
      valid: true,
      sanitized: {
        text: "",
        image: undefined,
        demoCaseId,
        inputModality: "text",
      },
    };
  }

  // Validate text input presence
  if (text.length === 0 && !image) {
    return {
      valid: false,
      error: "Please provide clinical notes, speech transcript, or a note photo.",
      fields: { text: "Required — provide clinical notes" },
    };
  }

  // Validate text length
  if (text.length > API_CONFIG.MAX_INPUT_LENGTH) {
    return {
      valid: false,
      error: `Input exceeds maximum length of ${API_CONFIG.MAX_INPUT_LENGTH} characters.`,
      fields: { text: `Maximum ${API_CONFIG.MAX_INPUT_LENGTH} characters` },
    };
  }

  // Validate image format if provided
  if (image) {
    const imageMatch = image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (!imageMatch) {
      return {
        valid: false,
        error: "Image must be a valid base64 data URI (data:image/...;base64,...).",
        fields: { image: "Invalid image format" },
      };
    }

    // Check base64 data isn't suspiciously large (rough check: > 10MB base64)
    if (imageMatch[2].length > 13_333_334) {
      return {
        valid: false,
        error: "Image is too large. Maximum image size is approximately 10MB.",
        fields: { image: "Image too large" },
      };
    }
  }

  // Validate text minimum length
  if (text.length > 0 && text.length < API_CONFIG.MIN_INPUT_LENGTH) {
    return {
      valid: false,
      error: `Input is too short. Please provide at least ${API_CONFIG.MIN_INPUT_LENGTH} characters of clinical detail.`,
      fields: { text: `Minimum ${API_CONFIG.MIN_INPUT_LENGTH} characters` },
    };
  }

  return {
    valid: true,
    sanitized: {
      text,
      image,
      demoCaseId: undefined,
      inputModality,
    },
  };
}

/**
 * Check for common injection patterns in text input.
 * Returns true if the input appears safe.
 */
export function isInputSafe(text: string): boolean {
  const dangerousPatterns = [
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ];

  return !dangerousPatterns.some((p) => p.test(text));
}
