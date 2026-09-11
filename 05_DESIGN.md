# Visual Design System

## Concept
"Clinical, Auditable, and Safe." A high-trust, structured healthcare interface adhering strictly to official Indian IMNCI color-coding.

## Official IMNCI Color Coding
- **Pink (Urgent Hospital Referral / Severe Disease):**
  - Background: `#FEE2E2` (Red-100), Border/Accent: `#DC2626` (Red-600)
- **Yellow (Pneumonia / Outpatient Medical Treatment):**
  - Background: `#FEF9C3` (Yellow-100), Border/Accent: `#CA8A04` (Yellow-600)
- **Green (No Pneumonia / Home Care):**
  - Background: `#DCFCE7` (Green-100), Border/Accent: `#16A34A` (Green-600)
- **Amber (Incomplete / Blocked Classification):**
  - Background: `#FFEDD5` (Orange-100), Border/Accent: `#EA580C` (Orange-600)

## Layout Architecture
- **Panel 1 (Messy Input):** Text box + Mic button for voice notes. Pre-load buttons for 3 synthetic demo cases.
- **Panel 2 (Audit & Verification Layer):**
  - Shows extracted patient parameters (Age, Respiratory rate, Danger signs).
  - Highlights verbatim quote evidence.
  - Interactive "Requires Worker Clarification" badges for `"unknown"` values.
- **Panel 3 (Classification & Referral Card):**
  - Shows deterministic IMNCI classification.
  - Actionable referral instructions and handoff notes.
