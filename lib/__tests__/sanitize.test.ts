import { describe, it, expect } from "vitest";
import { sanitizeInput, validateClinicalInput, truncateText } from "../sanitize";

describe("Input Sanitization", () => {
  describe("sanitizeInput", () => {
    it("strips HTML tags from input", () => {
      const input = '<script>alert("xss")</script>Hello world';
      const result = sanitizeInput(input);
      // Sanitization removes tags but preserves text content
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
      expect(result).toContain("Hello world");
    });

    it("removes event handler attributes", () => {
      const input = '<img onerror="alert(1)" src="test.jpg">';
      const result = sanitizeInput(input);
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("alert");
    });

    it("preserves plain text medical notes", () => {
      const input = "18 month old child with cough. RR 48 bpm.";
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it("preserves newlines in clinical notes", () => {
      const input = "Line 1\nLine 2\nLine 3";
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it("removes null bytes", () => {
      const input = "Hello\x00World";
      const result = sanitizeInput(input);
      expect(result).toBe("HelloWorld");
    });

    it("truncates lines exceeding max line length", () => {
      const input = "a".repeat(600);
      const result = sanitizeInput(input);
      // MAX_LINE_LENGTH is 500
      expect(result.length).toBe(500);
    });

    it("decodes HTML entities and re-strips tags", () => {
      const input = "&lt;script&gt;test&lt;/script&gt;";
      const result = sanitizeInput(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
    });

    it("handles non-string input gracefully", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = sanitizeInput(123 as any);
      expect(result).toBe("");
    });

    it("removes control characters except newlines and tabs", () => {
      const input = "Hello\x08\x0B\x0C\x1FWorld\nTab\there";
      const result = sanitizeInput(input);
      expect(result).toBe("HelloWorld\nTab\there");
    });
  });

  describe("validateClinicalInput", () => {
    it("returns error for empty input", () => {
      const result = validateClinicalInput("");
      expect(result).toBe("Please enter clinical notes before processing.");
    });

    it("returns error for too short input", () => {
      const result = validateClinicalInput("short");
      expect(result).toBe("Input is too short. Please provide more clinical detail.");
    });

    it("returns null for valid clinical input", () => {
      const result = validateClinicalInput("18 month old child with cough for 3 days");
      expect(result).toBeNull();
    });

    it("detects script injection", () => {
      const result = validateClinicalInput('<script>alert("xss")</script>');
      expect(result).toContain("unsafe content");
    });

    it("detects event handler injection", () => {
      const result = validateClinicalInput('onload="alert(1)"');
      expect(result).toContain("unsafe content");
    });

    it("detects javascript: protocol", () => {
      const result = validateClinicalInput("javascript:alert(1)");
      expect(result).toContain("unsafe content");
    });

    it("returns null for valid multilingual input", () => {
      const result = validateClinicalInput("Baccha 18 months ka hai, 2 din se tez khansi");
      expect(result).toBeNull();
    });
  });

  describe("truncateText", () => {
    it("returns original text if within limit", () => {
      const result = truncateText("short text", 100);
      expect(result).toBe("short text");
    });

    it("truncates and adds ellipsis when exceeding limit", () => {
      const result = truncateText("a".repeat(100), 50);
      expect(result.length).toBe(50);
      expect(result.endsWith("...")).toBe(true);
    });

    it("returns original if exactly at limit", () => {
      const result = truncateText("a".repeat(50), 50);
      expect(result).toBe("a".repeat(50));
    });
  });
});
