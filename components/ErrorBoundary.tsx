"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("IMNCI-Safe ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-[var(--color-card)] border border-[var(--color-pink-border)] rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-pink-bg)] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-[var(--color-pink)]" />
            </div>
            <h2 className="type-h3 text-[var(--color-text)] mb-1">
              {this.props.fallbackLabel || "Something went wrong"}
            </h2>
            <p className="type-small text-[var(--color-text-secondary)] mb-4">
              Clinical data has not been lost. Try resetting the session.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
