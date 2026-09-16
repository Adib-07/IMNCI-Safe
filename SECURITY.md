# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Architecture Security Principles

IMNCI-Safe is a **clinical decision-support prototype**, not a medical device.

### AI Model Boundary

- **Gemini (LLM)**: Extracts and structures clinical observations only.
- **Deterministic rules engine**: Produces all triage classifications (Pink/Yellow/Green/AMBER).
- The LLM **never** determines the final IMNCI classification.

### Data Handling

- **No patient PII storage**: All processing is in-memory. No database, no persistence.
- **No API key exposure**: `GEMINI_API_KEY` is server-side only. It never reaches the browser.
- **Input sanitization**: All user input is stripped of HTML/script tags before processing.
- **Injection prevention**: Pattern-based detection blocks script injection attempts.

### Unknown Values

- Missing clinical information becomes `"unknown"` — never `false` or `normal`.
- If any critical field is unknown, the system **refuses to classify** (AMBER).

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue.
2. Email the maintainers or use GitHub's private vulnerability reporting.
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

## Security Checklist for Contributors

- [ ] Never commit `.env`, `.env.local`, or files containing API keys.
- [ ] Never log `GEMINI_API_KEY` or other secrets.
- [ ] Never expose server-side environment variables to client components.
- [ ] All user input must go through `sanitizeInput()` before processing.
- [ ] API routes must validate request bodies before processing.
- [ ] Error responses must not leak internal stack traces or provider details.
