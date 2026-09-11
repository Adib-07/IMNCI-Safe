# Actionable Build Checklist

- [ ] **FOUNDATION:** Set up Next.js project with Tailwind CSS and TypeScript.
- [ ] **CLINICAL LOGIC (`lib/imnci-rules.ts`):**
  - [ ] Implement fast breathing cutoffs ($\ge 50$ for 2–11m, $\ge 40$ for 12–59m).
  - [ ] Implement all 4 General Danger Signs.
  - [ ] Implement chest indrawing and stridor flags.
  - [ ] Unit test logic against all 3 IMNCI categories (Pink, Yellow, Green).
- [ ] **AI EXTRACTION API (`/api/extract`):**
  - [ ] Call Gemini API with structured JSON Schema.
  - [ ] Ensure missing fields strictly parse as `"unknown"`.
- [ ] **UI COMPONENTS:**
  - [ ] Messy input panel with sample fixtures.
  - [ ] Extraction verification panel with verbatim quotation tags.
  - [ ] Refusal alert banner when fields are `"unknown"`.
  - [ ] Official color-coded Referral Card.
- [ ] **DEMO READINESS:**
  - [ ] Rehearse 3-minute demo script with 18-month-old missing data test case.
  - [ ] Verify offline/fallback button functions without network.
