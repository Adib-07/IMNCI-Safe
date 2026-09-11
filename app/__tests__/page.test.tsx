import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock Next.js font imports
vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "--font-fraunces", className: "" }),
  Source_Sans_3: () => ({ variable: "--font-source-sans", className: "" }),
}));

// Mock the page component's child components to avoid complex deps
vi.mock("@/components/Header", () => ({
  Header: ({ onReset, showReset }: { onReset: () => void; showReset: boolean }) => (
    <header data-testid="header">
      <span>IMNCI-Safe</span>
      {showReset && <button onClick={onReset}>New Case</button>}
    </header>
  ),
}));

vi.mock("@/components/Pipeline", () => ({
  Pipeline: ({ currentStage }: { currentStage: string }) => (
    <nav data-testid="pipeline" aria-label="Classification pipeline">
      <span>Stage: {currentStage}</span>
    </nav>
  ),
}));

vi.mock("@/components/InputPanel", () => ({
  InputPanel: (props: Record<string, unknown>) => (
    <section data-testid="input-panel">
      <textarea placeholder="clinical notes" />
      <button>Process Notes</button>
    </section>
  ),
}));

vi.mock("@/components/VerificationPanel", () => ({
  VerificationPanel: (props: Record<string, unknown>) => (
    <section data-testid="verification-panel">Verification Panel</section>
  ),
}));

vi.mock("@/components/ReferralCard", () => ({
  ReferralCard: (props: Record<string, unknown>) => (
    <section data-testid="referral-card">Referral Card</section>
  ),
}));

// Import the page component after mocks
import ImnciDashboard from "@/app/page";

describe("ImnciDashboard Page", () => {
  it("renders the main heading", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText(/Every child assessed against the protocol/)).toBeInTheDocument();
  });

  it("renders the header with IMNCI-Safe branding", () => {
    render(<ImnciDashboard />);
    const matches = screen.getAllByText("IMNCI-Safe");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the pipeline stepper", () => {
    render(<ImnciDashboard />);
    expect(screen.getByTestId("pipeline")).toBeInTheDocument();
  });

  it("renders the input panel", () => {
    render(<ImnciDashboard />);
    expect(screen.getByTestId("input-panel")).toBeInTheDocument();
  });

  it("renders the referral card", () => {
    render(<ImnciDashboard />);
    expect(screen.getByTestId("referral-card")).toBeInTheDocument();
  });

  it("renders the How It Works section", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText("How IMNCI-Safe classifies a sick child")).toBeInTheDocument();
  });

  it("renders the Why Trustworthy section", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText("Why health programs trust IMNCI-Safe")).toBeInTheDocument();
  });

  it("renders the triage color legend", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText("IMNCI TRIAGE COLOUR CODING")).toBeInTheDocument();
  });

  it("renders the footer disclaimer", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText("Not a replacement for clinical judgment.")).toBeInTheDocument();
  });

  it("renders the government protocol badge", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText("GOVERNMENT OF INDIA IMNCI PROTOCOL")).toBeInTheDocument();
  });
});
