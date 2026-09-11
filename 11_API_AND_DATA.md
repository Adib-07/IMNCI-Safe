# API & Data Infrastructure

## APIs & Models
- **Extraction API:** Google Gemini API (`gemini-1.5-flash` or `gemini-2.5-flash`).
  - Strict JSON output mode enabled.
  - Temperature: 0.0 (maximum determinism).
- **Environment Variables:** `GEMINI_API_KEY`.

## Official Data & Ground Truth
- **Clinical Source:** Ministry of Health & Family Welfare (MoHFW) / National Health Mission (NHM) Government of India IMNCI Chart Booklet (2023 Guidelines).
- **Cohort:** Children aged 2 months up to 5 years (2 to 59 months).

## Deterministic Test Fixtures (Demo Fallback)
1. **Urgent Referral (Pink):** 8-month-old infant, cough, respiratory rate 54, chest indrawing present. -> Classified as SEVERE PNEUMONIA OR VERY SEVERE DISEASE.
2. **Missing Information Flow (Amber -> Yellow):** 18-month-old child, cough reported, fast breathing reported but uncounted, danger signs unmentioned. -> System BLOCKS referral until RR (44) is entered -> Classified as PNEUMONIA.
3. **Home Care (Green):** 3-year-old child, cough for 1 day, respiratory rate 28, no danger signs, no indrawing, no stridor. -> Classified as NO PNEUMONIA: COUGH OR COLD.
