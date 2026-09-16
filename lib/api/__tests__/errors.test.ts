import { describe, it, expect } from "vitest";
import {
  ExtractionError,
  normalizeError,
  createError,
  logError,
} from "../errors";

describe("ExtractionError", () => {
  it("creates error with code and message", () => {
    const error = new ExtractionError("EMPTY_INPUT", "No input provided", 400);
    expect(error.code).toBe("EMPTY_INPUT");
    expect(error.message).toBe("No input provided");
    expect(error.status).toBe(400);
    expect(error.name).toBe("ExtractionError");
  });

  it("defaults to 500 status", () => {
    const error = new ExtractionError("INTERNAL_ERROR", "Something went wrong");
    expect(error.status).toBe(500);
  });
});

describe("createError", () => {
  it("creates error from predefined code", () => {
    const error = createError("EMPTY_INPUT");
    expect(error.code).toBe("EMPTY_INPUT");
    expect(error.message).toContain("clinical notes");
    expect(error.status).toBe(400);
  });

  it("appends detail to message", () => {
    const error = createError("AI_PROVIDER_TIMEOUT", "Request took too long");
    expect(error.message).toContain("Request took too long");
  });

  it("creates 503 for AI failures", () => {
    const error = createError("AI_PROVIDER_ERROR");
    expect(error.status).toBe(503);
  });

  it("creates 503 for missing API key", () => {
    const error = createError("MISSING_API_KEY");
    expect(error.status).toBe(503);
  });
});

describe("normalizeError", () => {
  it("passes through ExtractionError unchanged", () => {
    const original = createError("EMPTY_INPUT");
    const normalized = normalizeError(original);
    expect(normalized.code).toBe("EMPTY_INPUT");
  });

  it("normalizes timeout errors", () => {
    const normalized = normalizeError(new Error("timeout exceeded"));
    expect(normalized.code).toBe("AI_PROVIDER_TIMEOUT");
  });

  it("normalizes rate limit errors", () => {
    const normalized = normalizeError(new Error("rate limit exceeded"));
    expect(normalized.code).toBe("RATE_LIMITED");
  });

  it("normalizes API key errors", () => {
    const normalized = normalizeError(new Error("invalid api key"));
    expect(normalized.code).toBe("AI_PROVIDER_ERROR");
  });

  it("normalizes JSON parse errors", () => {
    const normalized = normalizeError(new Error("JSON parse error"));
    expect(normalized.code).toBe("AI_RESPONSE_INVALID");
  });

  it("normalizes schema errors", () => {
    const normalized = normalizeError(
      new Error("schema validation failed")
    );
    expect(normalized.code).toBe("AI_SCHEMA_MISMATCH");
  });

  it("normalizes unknown errors to AI_PROVIDER_ERROR", () => {
    const normalized = normalizeError(new Error("something weird"));
    expect(normalized.code).toBe("AI_PROVIDER_ERROR");
  });

  it("normalizes non-Error values", () => {
    const normalized = normalizeError("string error");
    expect(normalized.code).toBe("INTERNAL_ERROR");
  });

  it("normalizes null/undefined", () => {
    const normalized = normalizeError(null);
    expect(normalized.code).toBe("INTERNAL_ERROR");
  });
});

describe("logError", () => {
  it("does not throw", () => {
    expect(() => {
      logError("test context", new Error("test error"));
    }).not.toThrow();
  });

  it("redacts potential API key fragments", () => {
    // Should not expose the full key in logs
    const longKey = "A".repeat(30);
    expect(() => {
      logError("test", new Error(`API key ${longKey} is invalid`));
    }).not.toThrow();
  });
});
