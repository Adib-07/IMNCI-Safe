import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ReferralCard } from "../ReferralCard";
import type { ProtocolResult } from "@/lib/types";

const classifiedResult: ProtocolResult = {
  status: "CLASSIFIED",
  triage_color: "PINK",
  classification_name: "SEVERE PNEUMONIA OR VERY SEVERE DISEASE",
  classification: "PINK",
  reason: "Urgent referral triggered. General Danger Sign verified: has_convulsions.",
  treatment_instruction: "Urgent referral to hospital.",
  missing_fields: [],
  is_safe_to_refer: true,
};

const blockedResult: ProtocolResult = {
  status: "NEEDS_CONFIRMATION",
  triage_color: "AMBER",
  classification_name: "CANNOT CLASSIFY SAFELY YET",
  classification: null,
  reason: "Incomplete data: 1 critical clinical item(s) are unconfirmed.",
  treatment_instruction: "Please confirm the missing information before classification.",
  missing_fields: [
    { field: "respiratory_rate", reason: "Respiratory rate must be explicitly measured." },
  ],
  is_safe_to_refer: false,
};

describe("ReferralCard Component", () => {
  it("renders empty state when no result", () => {
    render(<ReferralCard result={null} assessment={null} />);
    expect(screen.getByText("Awaiting Classification")).toBeInTheDocument();
  });

  it("renders loading state when extracting", () => {
    render(<ReferralCard result={null} assessment={null} isExtracting={true} />);
    expect(screen.getByText(/Evaluating Protocol Rules/)).toBeInTheDocument();
  });

  it("renders classified result with triage color", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.getByText("SEVERE PNEUMONIA OR VERY SEVERE DISEASE")).toBeInTheDocument();
    expect(screen.getByText(/Urgent Referral — Pink/)).toBeInTheDocument();
  });

  it("renders deterministic badge", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.getByText(/Deterministic rules engine/)).toBeInTheDocument();
  });

  it("renders treatment instruction", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.getByText("Urgent referral to hospital.")).toBeInTheDocument();
  });

  it("renders confirm checkbox", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("renders blocked state with missing fields", () => {
    render(<ReferralCard result={blockedResult} assessment={null} />);
    expect(screen.getByText("CANNOT CLASSIFY SAFELY YET")).toBeInTheDocument();
    expect(screen.getByText(/Missing 1 Required Fact/)).toBeInTheDocument();
  });

  it("renders reset button when onReset provided", () => {
    const onReset = vi.fn();
    render(<ReferralCard result={classifiedResult} assessment={null} onReset={onReset} />);
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("does not render reset button when onReset not provided", () => {
    render(<ReferralCard result={classifiedResult} assessment={null} />);
    expect(screen.queryByText("Reset")).not.toBeInTheDocument();
  });
});
