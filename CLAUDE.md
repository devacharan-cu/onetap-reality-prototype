# OneTap Reality Guidelines

OneTap Reality is a phone-first multimodal AI application built for the iQOO Hackathon 2026.
Core Flow: SEE → UNDERSTAND → VERIFY → ACT

## Development
- Dev Server: `npm run dev` (runs on http://localhost:3001)
- Build: `npm run build`
- Lint: `npm run lint`
- Type Check: `npx tsc --noEmit`

## Strict Core Rules
1. **Zero-Hallucination:** Factual values must have verified image or web evidence. Missing fields must be "Not mentioned".
2. **Placeholder Rejection:** Reject generic dummy templates (e.g. 123 Anywhere St, 123-456-7890, reallygreatsite.com).
3. **Evidence-Gated Actions:** Actions (Calendar, Maps, Call, Email, Web) appear only when supported by verified data.
4. **Calendar:** Primary action opens Google Calendar pre-filled event link. Secondary action downloads .ics file.
5. **Contextual Search:** Combine verified entities (e.g. [Organization] + [Event Name]) for search queries.
6. **Chat Follow-up:** Chat uses structured verified evidence only (never hallucinates absent details).
7. **Security:** GEMINI_API_KEY is server-side only.
