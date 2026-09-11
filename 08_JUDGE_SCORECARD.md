# Judge Attack & Defense Strategy

## Simulated Judge Questions & Rock-Solid Answers

**Q: "Why didn't you just let Gemini classify the disease directly?"**
**A:** "Because LLMs make logical and numerical threshold errors. Under IMNCI, an 11-month-old breathing at 45 breaths/min is normal, while a 13-month-old breathing at 45 breaths/min has Pneumonia. LLMs frequently hallucinate or confuse these age-dependent cutoffs. We use Gemini exclusively for multilingual semantic extraction and enforce clinical logic deterministically in code."

**Q: "What makes your tool safer than existing solutions like HealthVaani?"**
**A:** "HealthVaani and other competitors use conversational chat interfaces. In high-stress triage, chat can provide false reassurance if a worker forgets to mention a sign. Our tool detects missing fields, halts classification, and prompts for the exact unstated danger sign before any referral card is generated."
