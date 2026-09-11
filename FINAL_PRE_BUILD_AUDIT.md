# FINAL PRE-BUILD CLINICAL & TECHNICAL AUDIT

## 1. Critical Errors Found in Previous Specification
- **CRITICAL CLINICAL LOGIC ERROR:** In `03_RULES.md`, the specification stated: `Age 2mo-5yrs with respiratory rate >50 = Fast Breathing`. This is scientifically and clinically incorrect under Indian NHM IMNCI and WHO IMCI guidelines.
  - **Correction:** Under official IMNCI guidelines:
    - **2 months up to 12 months:** Fast breathing is **50 breaths per minute or more** ($\ge 50$).
    - **12 months up to 5 years (12 to 59 months):** Fast breathing is **40 breaths per minute or more** ($\ge 40$).
    - Using a flat >50 threshold across the entire 2m–5y bracket would miss tachypnea in toddlers (12–59 months) breathing between 40 and 49 breaths/min, causing false-negative non-referrals for pneumonia.
- **GENERAL DANGER SIGN OMISSION:** In `09_AI_PROMPTS.md`, only three general danger signs were asked (`able_to_drink`, `vomits_everything`, `has_convulsions`). Under official IMNCI guidelines, there are **FOUR** core General Danger Signs for the 2 months to 5 years cohort:
  1. Not able to drink or breastfeed
  2. Vomiting everything
  3. Convulsions (history of convulsions during this illness or convulsing now)
  4. **Lethargic or unconscious**
- **COUGH / RESPIRATORY SIGNS INCOMPLETE:** The schema omitted **Chest Indrawing** and **Stridor in a calm child**, which are the definitive physical signs separating **Severe Pneumonia / Very Severe Disease (Pink - Urgent Referral)** from **Pneumonia (Yellow - Outpatient Treatment)**.

---

## 2. Clinical / Protocol Corrections (Authoritative IMNCI 2023 Rules)

### A. Age Brackets
- Targeted Cohort: **Sick Child: Age 2 months up to 5 years (2–59 months)**.
- Sub-brackets for Fast Breathing:
  - `2_to_11_months` (or `2_months_up_to_12_months`): threshold $\ge 50$ breaths/min.
  - `12_to_59_months` (or `12_months_up_to_5_years`): threshold $\ge 40$ breaths/min.

### B. The 4 General Danger Signs (GDS)
Any **ONE** positive GDS classifies the child as **VERY SEVERE DISEASE** (Pink Category - Urgent Hospital Referral):
1. Unable to drink or breastfeed
2. Vomits everything
3. Convulsions (during this illness or convulsing now)
4. Lethargic or unconscious

### C. Cough or Difficult Breathing Assessment
If the child has cough or difficult breathing:
1. **PINK: SEVERE PNEUMONIA OR VERY SEVERE DISEASE (Urgent Referral)**
   - Any General Danger Sign **OR**
   - Chest indrawing **OR**
   - Stridor in calm child
2. **YELLOW: PNEUMONIA (Outpatient Care / Health Facility)**
   - Fast breathing ($\ge 50$ for 2–11m; $\ge 40$ for 12–59m) **AND** No danger signs, No chest indrawing, No stridor.
3. **GREEN: NO PNEUMONIA: COUGH OR COLD (Home Care)**
   - No signs of pneumonia or very severe disease (Normal breathing rate, no danger signs, no indrawing, no stridor).

---

## 3. Architecture Corrections
- **Deterministic Rules Engine (`imnci-rules.ts`):** Must implement two explicit functions:
  1. `checkGeneralDangerSigns(data: ImnciAssessment): EvaluationResult`
  2. `classifyRespiratory(data: ImnciAssessment): ClassificationResult`
- **Missingness Guard:** If age is missing, or if cough is present but respiratory rate is `"unknown"`, or if any of the 4 general danger signs is `"unknown"`, the system returns `status: "BLOCKED_INCOMPLETE"` and identifies the exact minimal set of missing questions.

---

## 4. AI & Prompt Corrections
- System prompt updated with complete IMNCI extraction schema.
- Explicit prohibition against converting silence/omission to `false`. Missing fields must strictly be `"unknown"`.
- Added `lethargic_or_unconscious`, `chest_indrawing`, and `stridor_in_calm_child` to extraction schema.

---

## 5. UX & Demo Corrections
- Demo flow aligned with the 18-month-old child case in `10_DEMO_SCRIPT.md`:
  - At 18 months, respiratory rate threshold is $\ge 40$.
  - Demo audio mentions "saans tez hai" (breathing fast). The system extracts `fast_breathing_reported: true`, but flags `respiratory_rate: "unknown"` and GDS questions as `"unknown"`.
  - Killer demo moment: The UI halts, refuses classification, asks the worker to count the respiratory rate and check the 4 danger signs, and only classifies upon input.

---

## 6. Action Items Breakdown
- **MUST FIX:**
  1. Fix respiratory rate logic in `03_RULES.md`, `04_PHASES.md`, and `09_AI_PROMPTS.md`.
  2. Add the 4th danger sign (`lethargic_or_unconscious`) and physical signs (`chest_indrawing`, `stridor`) across all files.
  3. Ensure `01_PRD.md` through `12_BUILD_CHECKLIST.md` are 100% synchronized and free of conflicting clinical assertions.
- **SHOULD FIX:**
  1. Standardize code terms to TypeScript interfaces.
  2. Maintain fallback mock fixtures that accurately reflect the corrected rules.
- **OPTIONAL:**
  1. Offline PWA caching (post-hackathon).
  2. Additional modules like Diarrhea / Dehydration (post-hackathon).
