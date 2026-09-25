# IMNCI-Safe

AI-assisted IMNCI assessment prototype for frontline child-health workers.

**AI extracts. Human verifies. Rules decide.**

## Why IMNCI-Safe?

Frontline health workers screening sick children rely on the IMNCI chart booklet from India's National Health Mission. The protocol requires evaluating 4 general danger signs, measuring respiratory rate against age-specific thresholds, and checking for chest indrawing and stridor — all under time pressure with paper-based workflows.

Most AI chatbot approaches attempt to both extract and classify clinical data in a single step. This creates a safety risk: the LLM may hallucinate classifications, silently convert missing information into negative findings, or apply incorrect age-specific thresholds.

IMNCI-Safe separates extraction from classification into a strict three-layer architecture.

## Safety-First Architecture

| Layer | Role | Never does |
|-------|------|------------|
| **LLM (Gemini)** | Parses multilingual notes, extracts clinical observations into structured JSON | Classify, diagnose, or determine triage color |
| **Human** | Reviews extracted facts, confirms or corrects observations | — |
| **Deterministic rules** | Evaluates verified facts against IMNCI protocol rules in pure TypeScript | Call external services, use randomness, or infer from incomplete data |

The rules engine is the only component that produces a triage classification. It is a pure function: same input always yields same output.

**Core invariant: `UNKNOWN` is never converted to `false`.** Missing critical information triggers an AMBER refusal. The system blocks classification rather than producing a result from incomplete data.

## Product Workflow

```
Clinical Note Input → AI Extraction → Human Verification → Deterministic Rules → Classification
```

1. **Input** — Health worker enters observations in Hindi, English, or mixed language
2. **AI Extraction** — Gemini parses the note into structured clinical facts with verbatim evidence
3. **Human Verification** — Worker reviews, corrects, and confirms extracted findings
4. **Protocol Evaluation** — Pure TypeScript rules engine classifies against IMNCI protocol
5. **Result** — PINK (urgent referral), YELLOW (pneumonia), GREEN (home care), or AMBER (blocked — incomplete data)

## Features

- **Structured extraction** — Gemini parses multilingual clinical notes into typed JSON with verbatim evidence quotes
- **Deterministic classification** — Pure TypeScript rules engine, zero LLM calls in the classification path
- **Protocol-safe refusal** — Blocks classification when critical fields are unknown
- **Age-specific thresholds** — Fast breathing evaluated at ≥50 bpm (2–11 months) and ≥40 bpm (12–59 months)
- **4 general danger signs** — Convulsions, inability to drink/breastfeed, vomiting everything, lethargic/unconscious
- **3 demo fixtures** — Pre-built test cases for urgent referral, incomplete data, and normal findings
- **Deterministic fallback** — When Gemini API is unavailable, regex-based extraction provides safe offline operation
- **245 tests** — Rules engine boundaries, API validation, error handling, unknown value propagation, determinism verification

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
  imnci-rules.ts               # Deterministic rules engine
  types.ts                     # Shared TypeScript types
  fixtures.ts                  # 3 demo cases with expected outcomes
  sanitize.ts                  # Input sanitization
  api/
    validation.ts              # Request body validation
    errors.ts                  # Structured error handling
    ai-provider.ts             # Gemini SDK wrapper with timeout
    extract-deterministic.ts   # Regex-based fallback extraction
    map-response.ts            # Raw Gemini output → typed assessment
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4 |
| AI | Google Gemini API (`gemini-2.5-flash`) via `@google/genai` |
| Testing | Vitest, Testing Library, jsdom |
| Linting | ESLint 9 with `eslint-config-next` |
| Deployment | Vercel (default), or standalone output for Docker/Fly.io/Railway |

## Quick Start

```bash
git clone https://github.com/Adib-07/IMNCI-Safe.git
cd IMNCI-Safe
npm install
cp .env.example .env
# Add your Gemini API key to .env (optional — app works without it)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Environment | Description |
|----------|----------|-------------|-------------|
| `GEMINI_API_KEY` | No | All | Google Gemini API key. Without it, the app uses deterministic regex-based extraction. |
| `GEMINI_MODEL` | No | All | Override the Gemini model. Defaults to `gemini-2.5-flash`. |

See `.env.example` for the template. Never commit `.env` or `.env.local` files.

## Testing

```bash
npm test              # Run all 245 tests
npm run test:coverage # Run with coverage report
npm run lint          # ESLint (0 errors)
npx tsc --noEmit      # TypeScript type check
npm run build         # Production build
```

## Deployment

### Vercel (Recommended)

Push to GitHub and connect the repository to Vercel. `next.config.ts` already sets `output: "standalone"`, which Vercel handles automatically — no special configuration needed.

**Environment variables in Vercel dashboard:**

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your Gemini API key (optional) |

### Docker / Fly.io / Railway

The app supports `output: "standalone"` for container deployment. This is already enabled in `next.config.ts`:

```ts
output: "standalone",
```

## Security

- API keys stored server-side only, never exposed to the client
- Content Security Policy headers configured
- Input sanitization on all user-provided text
- HSTS, nosniff, and XSS protection headers
- No sensitive data logged
- See [SECURITY.md](SECURITY.md) for vulnerability reporting

## Safety & Clinical Limitations

- **Not a medical device** — This is a software prototype for clinical decision support
- **Protocol subset** — Implements Acute Respiratory Infection & General Danger Signs for children 2–59 months only
- **No fever, diarrhea, or ear/throat modules** — Additional IMNCI modules are not covered
- **Human confirmation mandatory** — A qualified health worker must always review and confirm
- **UNKNOWN blocks classification** — Missing critical information prevents the system from producing a result

## Project Structure

```
├── app/                  # Next.js pages and API routes
├── components/           # React UI components
├── lib/                  # Core logic (rules engine, types, fixtures)
│   └── api/              # API layer (validation, errors, AI provider)
├── tests/                # Test setup
├── .github/workflows/    # CI pipeline
├── SECURITY.md           # Security policy
└── .env.example          # Environment variable template
```

## Documentation

| Document | Description |
|----------|-------------|
| [01_PRD.md](01_PRD.md) | Product requirements |
| [02_ARCHITECTURE.md](02_ARCHITECTURE.md) | System architecture |
| [03_RULES.md](03_RULES.md) | Clinical protocol rules |
| [07_RESEARCH_EVIDENCE.md](07_RESEARCH_EVIDENCE.md) | Clinical evidence sources |
| [SECURITY.md](SECURITY.md) | Security policy |

## Roadmap

- Additional IMNCI modules (fever, diarrhea)
- Multilingual UI localization
- Voice input with real-time transcription
- Photo capture for respiratory rate counting
- Offline-first capability
- Persistent session logging (opt-in, anonymized)

## License

Licensed under the [MIT License](LICENSE).
