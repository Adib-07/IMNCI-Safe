import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ReferralCard } from "../ReferralCard";
import type { ProtocolResult } from "@/lib/types";

const classifiedResult: ProtocolResult = {
  status: "CLASSIFIED",
  triage_color: "PINK",
  classification_name: "SEVERE PNEUMONIA OR VERY SEVERE DISEASE",
  treatment_instruction: "Urgent referral to hospital.",
  missing_fields: [],
  is_safe_to_refer: true,
};

const blockedResult: ProtocolResult = {
  status: "NEEDS_CONFIRMATION",
  triage_color: "AMBER",
  classification_name: "CLASSIFICATION BLOCKED: Missing Data",
  treatment_instruction: "Please confirm the missing information before classification.",
  missing_fields: [
    { field: "respiratory_rate", reason: "Respiratory rate must be explicitly measured." },
  ],
  is_safe_to_refer: false,
};

describe("ReferralCard Component", () => {
  it("renders empty state when no result", () => {
    render(<ReferralCard result={null} assessment={null} />);
    expect(screen.getByText("Waiting for clinical input")).toBeInTheDocument();
  });

  it("renders loading state when extracting", () => {
    render(<ReferralCard result={null} assessment={null} isExtracting={true} />);
    expect(screen.getByText("Evaluating IMNCI protocol rules...")).toBeInTheDocument();
  });

  it("renders classified result with triage color", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.getByText("SEVERE PNEUMONIA OR VERY SEVERE DISEASE")).toBeInTheDocument();
    expect(screen.getByText("PINK")).toBeInTheDocument();
  });

  it("renders rule fired text for classified result", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.getByText("RULE FIRED")).toBeInTheDocument();
  });

  it("renders treatment instruction", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.getByText("Urgent referral to hospital.")).toBeInTheDocument();
  });

  it("renders confirm decision checkbox", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.getByText("Confirm Decision")).toBeInTheDocument();
  });

  it("renders blocked state with missing fields", () => {
    render(<ReferralCard result={blockedResult} assessment={null} />);
    expect(screen.getByText("Classification Blocked")).toBeInTheDocument();
    expect(screen.getByText("MISSING 1 REQUIRED FACT")).toBeInTheDocument();
  });

  it("renders deterministic logic badge", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.getByText("Deterministic TypeScript logic")).toBeInTheDocument();
    expect(screen.getByText("Zero LLM in classification")).toBeInTheDocument();
  });

  it("renders clear button when onReset provided", () => {
    const onReset = vi.fn();
    render(<ReferralCard result={classifiedResult} assessment={null} onReset={onReset} />);
    expect(screen.getByText("Clear / Start Over")).toBeInTheDocument();
  });

  it("does not render clear button when onReset not provided", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.queryByText("Clear / Start Over")).not.toBeInTheDocument();
  });
});
