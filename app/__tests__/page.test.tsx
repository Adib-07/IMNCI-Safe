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
  Pipeline: ({ activeStep }: { activeStep: number }) => (
    <nav data-testid="pipeline" aria-label="Clinical workflow steps">
      <span>Step: {activeStep}</span>
    </nav>
  ),
}));

vi.mock("@/components/InputPanel", () => ({
  InputPanel: () => (
    <section data-testid="input-panel">
      <textarea placeholder="clinical notes" />
      <button>Analyze Notes</button>
    </section>
  ),
}));

vi.mock("@/components/VerificationPanel", () => ({
  VerificationPanel: () => (
    <section data-testid="verification-panel">Verification Panel</section>
  ),
}));

vi.mock("@/components/ReferralCard", () => ({
  ReferralCard: () => (
    <section data-testid="referral-card">Referral Card</section>
  ),
}));

vi.mock("@/components/ReferralHandoffModal", () => ({
  ReferralHandoffModal: () => null,
}));

vi.mock("@/components/TechnicalDrawer", () => ({
  TechnicalDrawer: () => null,
}));

vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import the page component after mocks
import ImnciDashboard from "@/app/page";

describe("ImnciDashboard Page", () => {
  it("renders the main heading", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText(/Frontline Protocol Decision Support/)).toBeInTheDocument();
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

  it("renders the clinical decision support prototype badge", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText("CLINICAL DECISION SUPPORT PROTOTYPE")).toBeInTheDocument();
  });

  it("renders the footer disclaimer", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText(/Clinical decision support only/)).toBeInTheDocument();
  });

  it("renders the IMNCI protocol scope section", () => {
    render(<ImnciDashboard />);
    expect(screen.getByText(/WHO \/ Ministry of Health/)).toBeInTheDocument();
  });
});
