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
    expect(screen.getByPlaceholderText(/18-month-old/)).toBeInTheDocument();
  });

  it("renders the Extract Clinical Findings button", () => {
    render(<InputPanel {...defaultProps} />);
    expect(screen.getByText("Extract Clinical Findings")).toBeInTheDocument();
  });

  it("renders quick case demo buttons", () => {
    render(<InputPanel {...defaultProps} />);
    expect(screen.getByText(/Gating safety/)).toBeInTheDocument();
    expect(screen.getByText(/General danger sign/)).toBeInTheDocument();
    expect(screen.getByText(/Complete observations/)).toBeInTheDocument();
  });

  it("calls onProcessNotes when Extract is clicked", () => {
    const onProcessNotes = vi.fn();
    render(<InputPanel {...defaultProps} inputText="18 month old child with cough" onProcessNotes={onProcessNotes} />);
    fireEvent.click(screen.getByText("Extract Clinical Findings"));
    expect(onProcessNotes).toHaveBeenCalledTimes(1);
  });

  it("displays input error when provided", () => {
    render(<InputPanel {...defaultProps} inputError="Enter observations or select a demo." />);
    expect(screen.getByText("Enter observations or select a demo.")).toBeInTheDocument();
  });

  it("disables buttons when extracting", () => {
    render(<InputPanel {...defaultProps} isExtracting={true} />);
    const processButton = screen.getByText("Extracting…").closest("button");
    expect(processButton).toBeDisabled();
  });

  it("calls onInputChange when textarea value changes", () => {
    const onInputChange = vi.fn();
    render(<InputPanel {...defaultProps} onInputChange={onInputChange} />);
    const textarea = screen.getByPlaceholderText(/18-month-old/);
    fireEvent.change(textarea, { target: { value: "test input" } });
    expect(onInputChange).toHaveBeenCalledWith("test input");
  });
});
