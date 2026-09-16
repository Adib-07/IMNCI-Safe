import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Pipeline } from "../Pipeline";

describe("Pipeline Component", () => {
  it("renders all three workflow steps", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByText("Input")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });

  it("renders step sublabels", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByText(/Clinical observations/)).toBeInTheDocument();
    expect(screen.getByText(/Review extracted facts/)).toBeInTheDocument();
    expect(screen.getByText(/Protocol classification/)).toBeInTheDocument();
  });

  it("highlights the active step", () => {
    render(<Pipeline activeStep={2} />);
    const reviewButton = screen.getByText("Verify").closest("button");
    expect(reviewButton).toHaveAttribute("aria-current", "step");
  });

  it("has proper accessibility label", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByLabelText("Clinical workflow progress")).toBeInTheDocument();
  });

  it("disables steps that cannot be navigated to", () => {
    render(
      <Pipeline
        activeStep={1}
        canNavigateToStep={(step) => step <= 1}
      />
    );
    const verifyButton = screen.getByText("Verify").closest("button");
    expect(verifyButton).toBeDisabled();
  });
});
