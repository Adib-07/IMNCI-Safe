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
    console.error("IMNCI-Safe ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-[60vh] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-[#15313A] border border-[rgba(231,93,93,0.3)] rounded-xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-[rgba(231,93,93,0.15)] border border-[rgba(231,93,93,0.3)] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-[#E75D5D]" />
            </div>
            <h2 className="text-sm font-bold text-[#EAF7F5] mb-1">
              {this.props.fallbackLabel || "Something went wrong"}
            </h2>
            <p className="text-xs text-[#A8C3C5] mb-4 leading-relaxed">
              The application encountered an unexpected error. Your clinical data
              has not been lost. Please try resetting the session.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-[#0B1720] bg-[#2BB7A9] hover:bg-[#73DED0] transition-colors shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Session
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
