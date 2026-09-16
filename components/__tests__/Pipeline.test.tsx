import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Pipeline } from "../Pipeline";

describe("Pipeline Component", () => {
  it("renders all three workflow steps", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByText("1. Assess")).toBeInTheDocument();
    expect(screen.getByText("2. Review")).toBeInTheDocument();
    expect(screen.getByText("3. Handoff")).toBeInTheDocument();
  });

  it("renders step sublabels", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByText(/Messy field input/)).toBeInTheDocument();
    expect(screen.getByText(/Structured findings/)).toBeInTheDocument();
    expect(screen.getByText(/Deterministic triage/)).toBeInTheDocument();
  });

  it("highlights the active step", () => {
    render(<Pipeline activeStep={2} />);
    const reviewButton = screen.getByText("2. Review").closest("button");
    expect(reviewButton).toHaveAttribute("aria-current", "step");
  });

  it("has proper accessibility label", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByLabelText("Clinical workflow steps")).toBeInTheDocument();
  });

  it("renders deterministic gating badge", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByText("Deterministic Gating Active")).toBeInTheDocument();
  });

  it("disables steps that cannot be navigated to", () => {
    render(
      <Pipeline 
        activeStep={1} 
        canNavigateToStep={(step) => step <= 1}
      />
    );
    const reviewButton = screen.getByText("2. Review").closest("button");
    expect(reviewButton).toBeDisabled();
  });
});
