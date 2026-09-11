# PRE-BUILD AUDIT: IMNCI-Safe

**Project Name:** IMNCI-Safe  
**Lead Engineer & Product Builder Audit**  
**Date:** September 11, 2026  

---

## A. Files Discovered
The workspace contains 14 specification and audit markdown files:
1. `README.md`
2. `01_PRD.md`
3. `02_ARCHITECTURE.md`
4. `03_RULES.md`
5. `04_PHASES.md`
6. `05_DESIGN.md`
7. `06_MEMORY.md`
8. `07_RESEARCH_EVIDENCE.md`
9. `08_JUDGE_SCORECARD.md`
10. `09_AI_PROMPTS.md`
11. `10_DEMO_SCRIPT.md`
12. `11_API_AND_DATA.md`
13. `12_BUILD_CHECKLIST.md`
14. `FINAL_PRE_BUILD_AUDIT.md`

---

## B. What Each File Contributes
- `README.md`: High-level overview, repo index, and core project tagline.
- `01_PRD.md`: Vision, problem statement, solution boundaries, target persona (ASHA workers), clinical scope (Sick Child 2–59m), killer feature (protocol-safe refusal), and non-goals.
- `02_ARCHITECTURE.md`: Tech stack (Next.js, Tailwind, Gemini Flash, TypeScript rules engine), data flow pipeline, and protocol invariants.
- `03_RULES.md`: Implementation rules (age-dependent fast breathing cutoffs, 4 General Danger Signs, zero AI diagnosis, `"unknown"` mandate, non-chat UI requirement, fallback policy).
- `04_PHASES.md`: 6-phase strategic build roadmap.
- `05_DESIGN.md`: Visual design system (IMNCI colors: Pink, Yellow, Green, Amber) and 3-panel dashboard layout architecture.
- `06_MEMORY.md`: Living repository memory and active implementation context.
- `07_RESEARCH_EVIDENCE.md`: Clinical guidelines citations (Indian NHM & WHO IMCI) and competitor analysis (HealthVaani/Wadhwani AI, Sahay).
- `08_JUDGE_SCORECARD.md`: Defensive Q&A framework addressing AI direct classification vs extraction, safety over chatbots, and deterministic logic benefits.
- `09_AI_PROMPTS.md`: Production-ready extraction system prompt and JSON Schema template.
- `10_DEMO_SCRIPT.md`: Rehearsed 3-minute pitch timeline featuring the 18-month missing-data demo case.
- `11_API_AND_DATA.md`: API configuration, environment variable requirements (`GEMINI_API_KEY`), clinical sources, and 3 deterministic test fixtures.
- `12_BUILD_CHECKLIST.md`: Step-by-step feature execution checklist.
- `FINAL_PRE_BUILD_AUDIT.md`: Pre-existing audit documenting prior corrections (e.g. flat >50 breathing cutoff bug, missing 4th danger sign, missing chest indrawing & stridor).

---

## C. Source-of-Truth Hierarchy
When specification files overlap or conflict, authority is determined by the following hierarchy:
1. **`FINAL_PRE_BUILD_AUDIT.md`**: Highest authority for clinical safety logic and corrected IMNCI protocol rules.
2. **`03_RULES.md` & `09_AI_PROMPTS.md`**: Authority for deterministic evaluation rules and Gemini API JSON schema contracts.
3. **`01_PRD.md` & `02_ARCHITECTURE.md`**: Authority for product boundaries, tech stack, and pipeline architecture.
4. **`05_DESIGN.md` & `10_DEMO_SCRIPT.md`**: Authority for UI aesthetics, layout panels, and pitch presentation flow.
5. **`04_PHASES.md` & `12_BUILD_CHECKLIST.md`**: Authority for project task ordering.

---

## D. Requirements Understood

### 1. Product Vision & Separation of Concerns
- **Gemini AI Role:** Pure natural language fact extraction from noisy Hindi/English field notes into structured JSON. AI **never** computes triage colors or clinical classifications.
- **Rules Engine Role:** Pure TypeScript logic in `lib/imnci-rules.ts` that deterministically computes IMNCI classifications based strictly on official NHM guidelines.

### 2. Clinical Protocol Rules (Sick Child: 2–59 Months)
- **Age Brackets & Respiratory Rate Cutoffs:**
  - **2 months up to 12 months (2–11m):** Fast breathing is $\ge 50$ breaths/min.
  - **12 months up to 5 years (12–59m):** Fast breathing is $\ge 40$ breaths/min.
- **The 4 General Danger Signs (GDS):**
  1. Unable to drink or breastfeed
  2. Vomiting everything
  3. History of convulsions during this illness (or convulsing now)
  4. Lethargic or unconscious
- **Physical Severe Signs:** Chest indrawing, Stridor in a calm child.
- **Triage Classifications:**
  - **PINK (Severe Pneumonia / Very Severe Disease):** Urgent hospital referral. Triggered if ANY General Danger Sign = `true` OR Chest Indrawing = `true` OR Stridor = `true`.
  - **YELLOW (Pneumonia):** Outpatient medical care. Triggered if Fast Breathing = `true` AND no Pink signs.
  - **GREEN (No Pneumonia: Cough or Cold):** Home care advice. Triggered if Cough = `true`, Fast Breathing = `false`, AND no Pink signs.
  - **AMBER (Classification Blocked):** Triggered if any required clinical field is `"unknown"`.

### 3. Safety & Refusal Mandate
- Silence or missing data in input text MUST strictly extract as `"unknown"`. Unmentioned fields must NEVER be assumed `false`.
- If age is unknown, OR if cough is present but respiratory rate is `"unknown"`, OR if any General Danger Sign is `"unknown"`, the rules engine **refuses classification**, locks the referral card in Amber, and presents targeted confirmation buttons for the ASHA worker.

---

## E. Critical Contradictions & Discrepancies

1. **Audio/Voice Processing vs Text Input Scope:**
   - `01_PRD.md` and `05_DESIGN.md` mention audio input / voice notes.
   - `02_ARCHITECTURE.md`, `09_AI_PROMPTS.md`, and `11_API_AND_DATA.md` specify passing text transcripts to `/api/extract`.
   - *Resolution:* Build primary UI with text field notes and pre-configured demo buttons; add client-side Web Speech API microphone input if supported by browser, but rely on text payload for guaranteed stability.

2. **JSON Schema Key Representation:**
   - `09_AI_PROMPTS.md` specifies `unable_to_drink_or_breastfeed` as a boolean under `danger_signs`, whereas `FINAL_PRE_BUILD_AUDIT.md` refers to positive danger sign flags.
   - *Resolution:* Explicitly standardize all JSON keys to boolean flags where `true` indicates sign present, `false` indicates sign absent, and `"unknown"` indicates omitted.

3. **Age Boundary Inclusivity (12 Months):**
   - Text references "2-11m" and "12-59m".
   - *Resolution:* Implement exact boundary logic: `ageInMonths < 12` uses $\ge 50$; `12 <= ageInMonths && ageInMonths <= 59` uses $\ge 40$.

4. **Missing Cough vs Missing Breathing Rate:**
   - What if a child has NO cough (`has_cough_or_difficult_breathing: false`)?
   - *Resolution:* If cough is `false`, respiratory rate is not required for pneumonia assessment, but General Danger Signs are still evaluated. If `has_cough_or_difficult_breathing` is `"unknown"`, assessment is blocked.

---

## F. Missing Requirements

1. **Out-of-Cohort Age Handling:**
   - Age < 2 months (0–1 month) or Age > 59 months (>5 years) is outside the 2–59m IMNCI Sick Child module.
   - *Resolution:* Add explicit `OUT_OF_COHORT` status in rules engine with user notification.

2. **Nonsensical / Out-of-Bounds Respiratory Rate Validation:**
   - Valid respiratory rate range must be bounded (e.g. 10 to 150 breaths/min).

3. **Client-Side State Mutation Flow:**
   - UI needs instant local state updates when worker clicks interactive confirmation badges (e.g., clicking "Confirm RR: 44") to re-evaluate `imnci-rules.ts` without making redundant Gemini API calls.

---

## G. Technical Risks
- **Gemini API Latency / Failure during Live Demo:** Network lag or API key quota limits could stall the pitch.
  - *Mitigation:* Implement instant offline mock toggle and automated fallback fixture logic as defined in `03_RULES.md`.
- **JSON Parsing Errors:** LLM responses failing strict JSON schema parsing.
  - *Mitigation:* Use Gemini Structured Outputs schema enforcement and server-side Zod validation in `/api/extract`.

---

## H. Clinical / Protocol Risks
- **Misclassifying Toddler Tachypnea:** Applying flat $>50$ cutoff across all children would miss pneumonia in 12–59 month toddlers with RR 40–49.
  - *Mitigation:* Enforce strict age-bracket check in `lib/imnci-rules.ts` with dedicated unit tests.
- **False Reassurance from Omission:** Defaulting unmentioned symptoms to `false` would conceal active danger signs.
  - *Mitigation:* Enforce strict `"unknown"` extraction mandate.

---

## I. Gemini / AI Risks
- **LLM Diagnostic Drift:** Gemini hallucinating triage classifications or providing treatment advice.
  - *Mitigation:* System prompt strictly prohibits diagnosis; response JSON schema excludes classification fields.

---

## J. UX Risks
- **Chatbot Confusion:** Interface resembling a conversational chat interface instead of a clinical triage dashboard.
  - *Mitigation:* Enforce 3-column structured dashboard layout with clear audit trail cards.

---

## K. Hackathon / Judge Risks
- **Skepticism of AI Safety in Healthcare:** Judges questioning AI reliability for pediatric triage.
  - *Mitigation:* Highlight the "Protocol-Safe Refusal" feature during the 60–100s mark of the demo.

---

## L. Recommended Changes Before Implementation
1. **Unify TypeScript Interfaces & Data Models:** Define single authoritative source for `ImnciAssessmentData` and `ImnciResult` in `lib/types.ts`.
2. **Standardize Schema Keys:** Use uniform naming across `09_AI_PROMPTS.md` and `lib/imnci-rules.ts`.
3. **Establish Offline Fallback Engine:** Build `lib/fixtures.ts` containing the 3 demo cases for guaranteed offline presentation.

---

## M. Final Implementation Plan

### Phase 1: Core Types & Deterministic Rules Engine
- Create `lib/types.ts` with complete data schemas.
- Create `lib/imnci-rules.ts` with age-bracket checking, GDS evaluation, and respiratory classification.
- Create `lib/fixtures.ts` with 3 demo cases.

### Phase 2: Gemini API Integration Layer
- Create `/api/extract` route using `@google/genai` or standard Gemini API fetch.
- Enforce JSON Schema structured output with `"unknown"` fallbacks.

### Phase 3: 3-Column Triage Dashboard UI
- Build Panel 1: Messy Input (Text area, demo buttons, mic toggle).
- Build Panel 2: Verification & Audit Trail (Extracted facts, verbatim quotes, unknown interactive badges).
- Build Panel 3: Deterministic Referral Card (Amber locked state vs Pink/Yellow/Green unlocked referral card).

### Phase 4: Verification & Demo Polish
- Test 18-month missing data flow (Amber -> Yellow).
- Verify fallback fixture switch for live pitch reliability.

---

## N. First Build Phase
**Phase 1: Core Types, Deterministic Rules Engine (`lib/imnci-rules.ts`), and Test Fixtures (`lib/fixtures.ts`).**

---

## O. Definition of Done
1. `imnci-rules.ts` passes deterministic test cases for Pink, Yellow, Green, and Amber (Blocked) classifications.
2. `/api/extract` successfully parses code-mixed Hindi/English text into validated JSON with `"unknown"` for unstated fields.
3. UI clearly displays 3 panels and correctly blocks referral card generation when data is missing.
4. Interactive worker confirmation badges successfully update state and unlock referral card.
5. Demo fallback fixture operates seamlessly offline.
