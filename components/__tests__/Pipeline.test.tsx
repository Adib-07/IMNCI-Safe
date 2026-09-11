import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Pipeline } from "../Pipeline";

describe("Pipeline Component", () => {
  it("renders all four pipeline stages", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByText("Input")).toBeInTheDocument();
    expect(screen.getByText("Extract")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("renders stage sublabels", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByText("Paste notes")).toBeInTheDocument();
    expect(screen.getByText("AI reads")).toBeInTheDocument();
    expect(screen.getByText("Check rules")).toBeInTheDocument();
    expect(screen.getByText("Human decides")).toBeInTheDocument();
  });

  it("highlights the active stage", () => {
    render(<Pipeline currentStage="extract" />);
    const extractStep = screen.getByText("Extract").closest("li");
    expect(extractStep).toHaveClass("text-white");
  });

  it("marks completed stages with emerald color", () => {
    render(<Pipeline currentStage="verify" />);
    const inputStep = screen.getByText("Input").closest("li");
    expect(inputStep).toHaveClass("text-emerald-400");
  });

  it("marks future stages with muted color", () => {
    render(<Pipeline currentStage="input" />);
    const confirmStep = screen.getByText("Confirm").closest("li");
    expect(confirmStep).toHaveClass("text-slate-600");
  });

  it("has proper accessibility label", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByLabelText("Classification pipeline")).toBeInTheDocument();
  });

  it("renders stage numbers in circles", () => {
    render(<Pipeline currentStage="idle" />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
