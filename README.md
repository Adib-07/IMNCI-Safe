# IMNCI-Safe

A deterministic clinical decision-support prototype that transforms unstructured multilingual health worker notes into structured IMNCI triage assessments — without letting the AI make the classification.

## Problem

Frontline health workers screening sick children rely on the IMNCI (Integrated Management of Neonatal and Childhood Illness) chart booklet from India's National Health Mission. The protocol requires evaluating 4 general danger signs, measuring respiratory rate against age-specific thresholds, and checking for chest indrawing and stridor — all under time pressure with paper-based workflows.

Current AI chatbot approaches attempt to both extract and classify clinical data in a single step. This creates a safety risk: the LLM may hallucinate classifications, silently convert missing information into negative findings, or apply incorrect age-specific thresholds.

## Solution

IMNCI-Safe separates extraction from classification into a strict three-layer architecture:

| Layer | Role | Never does |
|-------|------|------------|
| **LLM (Gemini)** | Parses multilingual notes, extracts clinical observations into structured JSON with verbatim evidence | Classify, diagnose, or determine triage color |
| **Human** | Reviews extracted facts, confirms or corrects observations, provides missing measurements | — |
| **Deterministic rules engine** | Evaluates verified facts against official IMNCI protocol rules in pure TypeScript | Call external services, use randomness, or infer from incomplete data |

The rules engine is the only component that produces a triage classification. It is a pure function: same input always yields same output.

## Safety Principle

**`UNKNOWN` is never converted to `false`.**

If a symptom is not mentioned in the input, it is recorded as `"unknown"` — not assumed absent. When any critical field remains unknown, the system refuses to classify and returns an AMBER status with a structured explanation of what is missing and what question to ask next.

```
UNKNOWN ≠ FALSE
Missing critical information → Protocol-safe refusal (AMBER)
```

This is the core invariant. The system will actively block referral card generation rather than produce a classification from incomplete data.

## How It Works

```
Health Worker Note (code-mixed Hindi/English text)
  ↓
POST /api/extract
  ↓
Gemini Structured Extraction (JSON schema, temperature 0.0)
  ↓
Validated Findings + Evidence Quotes + Missing Fields
  ↓
Human Verification (review, confirm, correct)
  ↓
Deterministic IMNCI Rules Engine (lib/imnci-rules.ts)
  ├─ PINK:  Urgent referral (any danger sign or severe physical sign)
  ├─ YELLOW: Pneumonia — outpatient antibiotic pathway
  ├─ GREEN:  No urgent trigger — home care counseling
  └─ AMBER:  Refusal — missing data, classification blocked
  ↓
Referral Card with auditable evidence trail
```

## Key Features

- **Structured extraction** — Gemini parses multilingual clinical notes into typed JSON with verbatim evidence quotes
- **Deterministic classification** — Pure TypeScript rules engine, no AI calls in the classification path
- **Protocol-safe refusal** — Blocks classification when critical fields are unknown; never silently assumes negative findings
- **Age-specific thresholds** — Fast breathing evaluated at ≥50 bpm (2–11 months) and ≥40 bpm (12–59 months) per NHM IMNCI guidelines
- **4 general danger signs** — Convulsions, inability to drink/breastfeed, vomiting everything, lethargic/unconscious
- **3 demo fixtures** — Pre-built test cases for urgent referral, incomplete data, and normal findings
- **Deterministic fallback** — When Gemini API is unavailable, regex-based extraction provides safe offline operation
- **250 tests** — Rules engine boundaries, API validation, error handling, unknown value propagation, determinism verification

## Architecture

```
app/
  page.tsx                     # Client dashboard (3-step workflow)
  api/extract/route.ts         # POST /api/extract — thin orchestrator
components/
  Header.tsx                   # Navigation and status
  InputPanel.tsx               # Clinical note input + demo case selection
  VerificationPanel.tsx        # Review extracted facts, confirm/correct
  ReferralCard.tsx             # Triage result with evidence trail
  ReferralHandoffModal.tsx     # Handoff summary for medical officers
  TechnicalDrawer.tsx          # Raw extraction details
  Pipeline.tsx                 # 3-step workflow indicator
  ErrorBoundary.tsx            # Graceful error recovery
lib/
  imnci-rules.ts               # Deterministic rules engine (the classification authority)
  types.ts                     # Shared TypeScript types
  fixtures.ts                  # 3 demo cases with expected outcomes
  sanitize.ts                  # Input sanitization and XSS prevention
  api/
    types.ts                   # API request/response types
    validation.ts              # Request body validation
    errors.ts                  # Structured error handling (no secret leakage)
    ai-provider.ts             # Gemini SDK wrapper with timeout
    extract-deterministic.ts   # Regex-based fallback extraction
    map-response.ts            # Raw Gemini output → typed assessment
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4 |
| AI | Google Gemini API (`gemini-2.5-flash`) via `@google/genai` |
| Testing | Vitest, Testing Library, jsdom |
| Linting | ESLint 9 with `eslint-config-next` |
| Deployment | `output: "standalone"` (Docker/Fly.io/Railway compatible) |

## Screenshots

> Screenshots to be added. The application runs at `http://localhost:3000` after `npm run dev`.

## Getting Started

```bash
git clone https://github.com/Adib-07/IMNCI-Safe.git
cd IMNCI-Safe
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

The application works without `GEMINI_API_KEY` using deterministic fallback extraction (labeled as demo mode in the UI).

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google Gemini API key. If absent, the app uses deterministic regex-based extraction. |
| `GEMINI_MODEL` | No | Override the Gemini model. Defaults to `gemini-2.5-flash`. |

See `.env.example` for the template. Never commit `.env` or `.env.local` files.

## Testing

```bash
npm test              # Run all 250 tests
npm run test:coverage # Run with coverage report
npm run lint          # ESLint (0 errors, 0 warnings)
npm run build         # Production build (verifies TypeScript + bundling)
```

Test coverage spans:

| Area | What is tested |
|------|----------------|
| Rules engine | Age boundaries (2, 11, 12, 59 months), RR thresholds (39, 40, 49, 50 bpm), all 4 danger signs individually and simultaneously, chest indrawing, stridor, unknown handling, determinism (identical input → identical output), mixed scenarios |
| API validation | Request body structure, text length bounds, image format, demo case IDs, injection pattern detection |
| Error handling | Missing API key, provider timeout, malformed response, schema mismatch, rate limiting — all fall back safely |
| Deterministic extraction | Age parsing, cough detection, RR extraction, danger sign regex, ambiguous phrase detection, missing field propagation |
| Response mapping | Type coercion, missing field defaults, evidence propagation, unknown value handling |

## Project Structure

```
├── app/                  # Next.js pages and API routes
├── components/           # React UI components
├── lib/                  # Core logic (rules engine, types, fixtures)
│   └── api/              # API layer (validation, errors, AI provider, extraction)
├── public/               # Static assets
├── tests/                # Test setup
├── .github/workflows/    # CI pipeline
├── 01_PRD.md             # Product requirements
├── 02_ARCHITECTURE.md    # System architecture
├── 03_RULES.md           # Clinical protocol rules
├── 07_RESEARCH_EVIDENCE.md  # Clinical evidence sources
├── 11_API_AND_DATA.md    # API and data infrastructure
├── SECURITY.md           # Security policy
└── .env.example          # Environment variable template
```

## Safety / Limitations

**This is a prototype, not a medical device.**

- The deterministic rules engine implements a **subset** of the full IMNCI protocol (sick child 2–59 months: general danger signs + cough/breathing module only). It does not cover fever, diarrhea, or ear/throat assessments.
- The system does not store patient data. All processing is in-memory with no persistence.
- Classifications are decision-support outputs, not diagnoses. A qualified health worker must always review and confirm.
- The Gemini extraction layer may produce imperfect extractions from very noisy input. The human verification step exists specifically to catch and correct these.
- Fast breathing thresholds follow NHM India guidelines (≥50 bpm for 2–11 months, ≥40 bpm for 12–59 months). These are not universal — other countries may use different thresholds.

## Documentation

| Document | Description |
|----------|-------------|
| [01_PRD.md](01_PRD.md) | Product requirements and scope |
| [02_ARCHITECTURE.md](02_ARCHITECTURE.md) | System architecture and data flow |
| [03_RULES.md](03_RULES.md) | Clinical protocol implementation rules |
| [07_RESEARCH_EVIDENCE.md](07_RESEARCH_EVIDENCE.md) | Clinical evidence and NHM/WHO sources |
| [11_API_AND_DATA.md](11_API_AND_DATA.md) | API infrastructure and test fixtures |
| [10_DEMO_SCRIPT.md](10_DEMO_SCRIPT.md) | Demo walkthrough |
| [SECURITY.md](SECURITY.md) | Security policy and vulnerability reporting |

## Roadmap

- Additional IMNCI modules (fever, diarrhea)
- Multilingual UI localization
- Voice input with real-time transcription
- Photo capture for respiratory rate counting
- Offline-first capability with service worker
- Persistent session logging for quality improvement (opt-in, anonymized)

## License

No license has been specified for this repository. Contact the maintainers for usage terms.
