# Product Requirements Document (PRD)

## Product Vision
**IMNCI-Safe:** A deterministic protocol-completion and referral-safety layer for ASHA frontline child-health assessments. It transforms messy, multilingual code-mixed audio into structured, medically safe referral cards without ever using generative AI for diagnosis.

## The Problem
India's 1 million+ ASHA frontline workers are burdened with maintaining up to 11 paper registers. To triage sick children, they rely on the National Health Mission's IMNCI (Integrated Management of Neonatal and Childhood Illness) chart booklet. When overwhelmed, danger signs are missed. However, current AI solutions (chatbots) hallucinate clinical logic and fail to strictly adhere to age-bracketed protocol thresholds.

## Core Insight & Solution
Generative AI is terrible at strict threshold logic and protocol obedience, but exceptional at multilingual semantic extraction. 
**The Solution:** We separate the two completely:
1. **Gemini Extraction Layer:** Parses noisy rural Hindi/English audio and extracts facts into a validated JSON schema (with strict `"unknown"` values for missing data).
2. **Deterministic Protocol Engine:** TypeScript logic evaluates the extracted facts against official IMNCI rules. If any critical protocol field is missing, the system **refuses to classify** and blocks referral card generation until the worker confirms the missing facts.

## Target User & Personas
- **Primary:** ASHA/Anganwadi workers conducting home visits and screening children aged 2 months to 5 years (2–59 months).
- **Secondary:** Medical Officers reviewing structured referral cards at Primary Health Centers (PHCs).

## Clinical Scope (Sick Child: 2 Months to 5 Years)
- **The 4 General Danger Signs:**
  1. Unable to drink or breastfeed
  2. Vomiting everything
  3. History of convulsions during this illness (or convulsing now)
  4. Lethargic or unconscious
- **Cough / Difficult Breathing Module:**
  - Fast breathing thresholds:
    - **2 to 11 months:** $\ge 50$ breaths/min
    - **12 to 59 months:** $\ge 40$ breaths/min
  - Chest indrawing
  - Stridor in calm child
- **Triage Classifications:**
  - **PINK (Severe Pneumonia / Very Severe Disease):** Urgent referral to hospital.
  - **YELLOW (Pneumonia):** Outpatient treatment and advice.
  - **GREEN (No Pneumonia: Cough or Cold):** Home care advice.

## Killer Feature
**Protocol-Safe Refusal.** The AI will actively block a referral classification and highlight missing critical data. It does not guess. It forces the human into the loop.

## MVP Scope (Hackathon 1-Day Build)
- ONE IMNCI pathway: Sick Child (2–59 months) - General Danger Signs + Cough/Breathing.
- ONE primary input mode: Code-mixed Hindi/English field notes (audio transcript or text).
- ZERO database / ZERO auth: In-memory session state.
- ONE deterministic UI output: Color-coded IMNCI referral card with auditable reasoning.

## Non-Goals
- NOT an autonomous diagnostic tool or medical device.
- NO drug dosing or prescription generation.
- NO patient database or persistent PII storage.
