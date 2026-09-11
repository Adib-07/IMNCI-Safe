# Strict Implementation Rules

## Clinical Protocol Integrity (Official Indian NHM IMNCI Guidelines)
1. **ACCURATE RESPIRATORY THRESHOLDS:**
   - For age **2 months up to 12 months** (2–11 months): Fast breathing is **50 breaths per minute or more**.
   - For age **12 months up to 5 years** (12–59 months): Fast breathing is **40 breaths per minute or more**.
   - NEVER apply a flat >50 threshold across the whole cohort.
2. **THE 4 GENERAL DANGER SIGNS:**
   - Must evaluate all 4 signs: (1) Unable to drink/breastfeed, (2) Vomits everything, (3) Convulsions, (4) Lethargic or unconscious.
3. **ZERO AI DIAGNOSIS:**
   - The Gemini model MUST NOT calculate the triage color (Pink/Yellow/Green) or clinical classification.
   - Gemini only extracts clinical variables, observation status, and evidence quotes.
4. **THE "UNKNOWN" MANDATE:**
   - Unmentioned symptoms must strictly be assigned `"unknown"`. Never default unmentioned fields to `false`.
5. **UI IS NOT A CHAT:**
   - The UI must look like an interactive, self-filling digital assessment form with clear audit trails, not a conversational chatbot.
6. **NO MOCKED RESULTS:**
   - Call the live Gemini API. If the API fails, fall back to a hardcoded fixture with an explicit banner: `[DEMO FALLBACK FIXTURE]`.
