import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { InputPanel } from "../InputPanel";

const defaultProps = {
  inputText: "",
  onInputChange: vi.fn(),
  onExtract: vi.fn(),
  onProcessNotes: vi.fn(),
  inputError: null,
  isExtracting: false,
  isProcessing: false,
  isDisabled: false,
  shakeInput: false,
};

describe("InputPanel Component", () => {
  it("renders the clinical notes textarea", () => {
    render(<InputPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Baccha 18 months/)).toBeInTheDocument();
  });

  it("renders the Analyze Notes button", () => {
    render(<InputPanel {...defaultProps} />);
    expect(screen.getByText("Analyze Notes")).toBeInTheDocument();
  });

  it("renders quick fill buttons", () => {
    render(<InputPanel {...defaultProps} />);
    expect(screen.getByText(/Sample Case: Fever/)).toBeInTheDocument();
    expect(screen.getByText(/Sample Case: Cough/)).toBeInTheDocument();
  });

  it("renders quick case demo buttons", () => {
    render(<InputPanel {...defaultProps} />);
    expect(screen.getByText(/Incomplete/)).toBeInTheDocument();
    expect(screen.getByText(/Pneumonia/)).toBeInTheDocument();
    expect(screen.getByText(/High Risk/)).toBeInTheDocument();
  });

  it("calls onProcessNotes when Analyze Notes is clicked", () => {
    const onProcessNotes = vi.fn();
    render(<InputPanel {...defaultProps} inputText="18 month old child with cough" onProcessNotes={onProcessNotes} />);
    fireEvent.click(screen.getByText("Analyze Notes"));
    expect(onProcessNotes).toHaveBeenCalledTimes(1);
  });

  it("displays input error when provided", () => {
    render(<InputPanel {...defaultProps} inputError="Please enter clinical notes before processing." />);
    expect(screen.getByText("Please enter clinical notes before processing.")).toBeInTheDocument();
  });

  it("disables buttons when extracting", () => {
    render(<InputPanel {...defaultProps} isExtracting={true} />);
    const processButton = screen.getByText("Processing...").closest("button");
    expect(processButton).toBeDisabled();
  });

  it("calls onInputChange when textarea value changes", () => {
    const onInputChange = vi.fn();
    render(<InputPanel {...defaultProps} onInputChange={onInputChange} />);
    const textarea = screen.getByPlaceholderText(/Baccha 18 months/);
    fireEvent.change(textarea, { target: { value: "test input" } });
    expect(onInputChange).toHaveBeenCalledWith("test input");
  });
});
