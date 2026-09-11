# Build Phases

## Phase Breakdown
- **PHASE 1 (Foundation):** Init Next.js + Tailwind; configure Gemini API client.
- **PHASE 2 (The Deterministic Rules Engine):**
  - Implement `imnci-rules.ts`.
  - Define data structures and verify age-specific thresholds ($\ge 50$ for 2–11m, $\ge 40$ for 12–59m).
  - Implement 4 General Danger Signs logic and Cough/Breathing classification.
- **PHASE 3 (Gemini Structured Extraction API):**
  - Create `/api/extract` route with Gemini Structured Outputs enforcing `"unknown"` for unstated fields.
- **PHASE 4 (Core Interactive UI):**
  - Build 3-column layout: (1) Input notes, (2) Protocol verification checklist with evidence quotes, (3) Referral Card.
- **PHASE 5 (The Killer Refusal Feature):**
  - Wire the blocker logic: if any critical field is `"unknown"`, disable the Referral Card, display an amber warning, and render inline buttons for worker confirmation.
- **PHASE 6 (Demo & Polish):**
  - Wire pre-configured test fixtures, test the 18-month demo case, and prepare emergency offline fallbacks.
