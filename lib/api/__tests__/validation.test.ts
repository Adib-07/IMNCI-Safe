import { describe, it, expect } from "vitest";
import { validateExtractionRequest, isInputSafe } from "../validation";

describe("validateExtractionRequest", () => {
  describe("valid requests", () => {
    it("accepts valid text input", () => {
      const result = validateExtractionRequest({
        text: "18 month old child with cough and fever for 2 days",
      });
      expect(result.valid).toBe(true);
      expect(result.sanitized?.text).toBe(
        "18 month old child with cough and fever for 2 days"
      );
    });

    it("accepts text with image", () => {
      const result = validateExtractionRequest({
        text: "Child has fever",
        image: "data:image/png;base64,abc123",
      });
      expect(result.valid).toBe(true);
      expect(result.sanitized?.image).toBe("data:image/png;base64,abc123");
    });

    it("accepts valid demo case IDs", () => {
      for (const id of [
        "case-incomplete",
        "case-urgent",
        "case-no-urgent",
      ]) {
        const result = validateExtractionRequest({ demoCaseId: id });
        expect(result.valid).toBe(true);
        expect(result.sanitized?.demoCaseId).toBe(id);
      }
    });

    it("accepts partial demo case ID matches", () => {
      const result = validateExtractionRequest({ demoCaseId: "incomplete" });
      expect(result.valid).toBe(true);
    });

    it("validates input modality", () => {
      const voice = validateExtractionRequest({
        text: "Child has fever and cough",
        inputModality: "voice",
      });
      expect(voice.sanitized?.inputModality).toBe("voice");

      const photo = validateExtractionRequest({
        text: "Clinical notes from photo",
        inputModality: "photo",
      });
      expect(photo.sanitized?.inputModality).toBe("photo");
    });

    it("defaults text modality for invalid values", () => {
      const result = validateExtractionRequest({
        text: "Child has fever",
        inputModality: "invalid",
      });
      expect(result.sanitized?.inputModality).toBe("text");
    });
  });

  describe("invalid requests", () => {
    it("rejects null body", () => {
      const result = validateExtractionRequest(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("JSON object");
    });

    it("rejects undefined body", () => {
      const result = validateExtractionRequest(undefined);
      expect(result.valid).toBe(false);
    });

    it("rejects string body", () => {
      const result = validateExtractionRequest("not an object");
      expect(result.valid).toBe(false);
    });

    it("rejects empty text without image", () => {
      const result = validateExtractionRequest({ text: "" });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("clinical notes");
    });

    it("rejects whitespace-only text without image", () => {
      const result = validateExtractionRequest({ text: "   " });
      expect(result.valid).toBe(false);
    });

    it("rejects text exceeding max length", () => {
      const result = validateExtractionRequest({
        text: "a".repeat(6001),
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("6000");
    });

    it("rejects text below minimum length", () => {
      const result = validateExtractionRequest({ text: "short" });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10");
    });

    it("rejects invalid image format", () => {
      const result = validateExtractionRequest({
        text: "Child has fever",
        image: "not-a-data-uri",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("data URI");
    });

    it("rejects oversized image", () => {
      const result = validateExtractionRequest({
        text: "Child has fever",
        image: "data:image/png;base64," + "a".repeat(14_000_000),
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too large");
    });

    it("rejects unknown demo case ID", () => {
      const result = validateExtractionRequest({
        demoCaseId: "case-nonexistent",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unknown demo case");
    });
  });
});

describe("isInputSafe", () => {
  it("accepts normal clinical text", () => {
    expect(isInputSafe("18 month old child with cough")).toBe(true);
  });

  it("accepts Hindi/English mixed text", () => {
    expect(isInputSafe("Baccha 18 months ka hai, khansi hai")).toBe(true);
  });

  it("rejects script tags", () => {
    expect(isInputSafe("<script>alert('xss')</script>")).toBe(false);
  });

  it("rejects javascript protocol", () => {
    expect(isInputSafe("javascript:alert(1)")).toBe(false);
  });

  it("rejects event handlers", () => {
    expect(isInputSafe('img onerror="alert(1)"')).toBe(false);
  });

  it("rejects data:text/html", () => {
    expect(isInputSafe("data:text/html,<script>alert(1)</script>")).toBe(
      false
    );
  });

  it("rejects vbscript", () => {
    expect(isInputSafe("vbscript:MsgBox(1)")).toBe(false);
  });

  it("rejects expression()", () => {
    expect(isInputSafe("expression(alert(1))")).toBe(false);
  });
});
