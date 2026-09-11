# Architecture Specification

## System Overview
A lightweight, serverless web application separating natural language extraction from clinical decision logic.

## Tech Stack
- **Frontend:** React / Next.js (App Router, Tailwind CSS).
- **Backend:** Next.js API Routes (TypeScript).
- **AI Engine:** Google Gemini API (`gemini-1.5-flash` or `gemini-2.5-flash`) with JSON Schema Structured Outputs.
- **Rules Engine:** Pure, deterministic TypeScript logic (`lib/imnci-rules.ts`) executing official NHM IMNCI guidelines.
- **State Management:** Client React state (no database, no persistent tracking).

## Data Flow (The Safety Pipeline)
```text
User (Messy Code-Mixed Field Note)
  ↓
Gemini 1.5/2.5 Flash (Structured Extraction)
  ↓
Strict JSON Schema (Missing values set to "unknown")
  ↓
Deterministic IMNCI Rules Engine (TypeScript)
  ├─ If any critical sign is "unknown" → BLOCKED: Refuse classification & highlight next question
  └─ If all critical signs known → COMPLETED: Deterministic Color Classification (Pink/Yellow/Green)
  ↓
Human Worker Confirms / Completes Input
  ↓
Validated Official Referral Card (Auditable Evidence Linked)
```

## Protocol Invariant
`No protocol rule match OR missing critical field → No classification generated.`
