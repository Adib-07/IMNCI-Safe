# 3-Minute Competition Demo Script

- **0–30s (The Real-World Context):**
  "Over 1 million ASHA workers in India triage sick children using the official NHM IMNCI protocol. AI chatbots have entered this space, but generative AI hallucinations on clinical thresholds create fatal risks."
- **30–60s (The Messy Input):**
  "Watch IMNCI-Safe in action. We enter noisy code-mixed Hindi/English field notes:
  *'Baccha 18 months ka hai, 2 din se tez khansi aur saans tez chal rahi hai, thoda doodh piya tha...'* (Child is 18 months old, cough and fast breathing for 2 days, drank a little milk)."
- **60–100s (The WOW Moment - Refusal to Classify):**
  "Look at the screen: Gemini extracted the age (18 months) and cough. But the referral card is **LOCKED IN AMBER**. The system displays:
  **'CLASSIFICATION BLOCKED: Missing Measured Respiratory Rate & 4 General Danger Signs.'**
  Because the child is 18 months old, the fast-breathing cutoff is $\ge 40$ breaths/min. The system refused to guess."
- **100–140s (Interactive Human-in-the-Loop Completion):**
  "The ASHA worker measures the breath count (44) and checks: No convulsions, Not vomiting everything, Child is alert. With two clicks, the worker confirms the facts."
- **140–180s (Deterministic Classification & Safe Referral):**
  "Instantly, our deterministic rules engine executes the official protocol. Because respiratory rate is 44 ($\ge 40$), the child is classified as **PNEUMONIA (Yellow Category)**. The verified referral card is generated with zero AI hallucinations."
