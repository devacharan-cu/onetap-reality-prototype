# OneTap Reality

> **SEE → UNDERSTAND → VERIFY → ACT**  
> A phone-first multimodal AI assistant that extracts verified facts from the physical world and transforms them into instant mobile actions.

Built as a high-performance prototype for the **iQOO Hackathon 2026**.

---

## Overview

Traditional computer vision stops at describing an image. **OneTap Reality** completes the loop:
1. **Point your camera** at an event poster, business card, product, transit sign, or foreign-language document.
2. **Understand the scene** using Gemini Vision multimodal intelligence.
3. **Verify the facts** through strict evidence checks and trusted web grounding with zero hallucinations.
4. **Take action in one tap** — pre-fill Google Calendar, route in Google Maps, call verified phone numbers, compose emails, translate multilingual text, or search contextual entities.

---

## Core Architecture & Pipeline

```
┌─────────────────┐
│  Camera / File  │
└────────┬────────┘
         │ (Client Canvas Optimization)
         ▼
┌─────────────────────────┐
│ Gemini 3.7/3.6 Vision   │  → Scene Intelligence & Verbatim Evidence Extraction
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Hard Evidence Validator │  → Rejects Placeholders & Unsubstantiated Facts
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Trusted Web Grounding   │  → Fills Missing Details ONLY for Identifiable Real Entities
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Action Synthesis Engine │  → Calendar, Maps, Call, Email, Web, Search, Translate
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Phone-First Interface   │  → Field Badges, Google Calendar, History, Follow-up Q&A
└─────────────────────────┘
```

---

## Key Features

- 🔍 **Zero-Hallucination Evidence Layer:** Every factual field is validated against verbatim visual evidence (`FROM IMAGE`), trusted online sources (`WEB VERIFIED`), or marked strictly as `NOT MENTIONED`.
- 🚫 **Placeholder Rejection:** Rejects template filler and fake numbers (e.g. `123-456-7890`, `123 Anywhere St`, `reallygreatsite.com`).
- 📅 **Google Calendar Integration:** Primary action opens a pre-filled Google Calendar event with verified dates, times, and venues, with an `.ics` file download fallback.
- 🌐 **Smart Contextual Search:** Automatically combines multiple verified entities (e.g. `[Organization] + [Event Name]`) into high-intent web queries instead of generic terms.
- 💬 **Grounded Multilingual Chat & Translation:** Ask natural language follow-up questions or translate verified content without hallucinating absent details across English, Hindi, Tamil, Spanish, and more.
- 🌓 **Dark & Light Mode System:** Premium cinematic dark mode and warm off-white light mode with persistent theme preference and zero flash on load.
- 📱 **Mobile-First Experience:** Direct camera capture (`capture="environment"`), touch-optimized action cards, native Web Share API, and safe `tel:` links.
- 🕒 **Client-Side Scan History:** Locally stored recent scans with instant restore and privacy-first design.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI Library:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **Multimodal AI:** Google Gemini 3.7 Flash & 3.6 Flash via `@google/genai`
- **Icons:** Lucide React

---

## Getting Started

### 1. Prerequisites
- Node.js 20+ installed
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Configuration
Create a `.env.local` file in the root directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Installation & Development Server
```bash
# Install dependencies
npm install

# Start development server on port 3001
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your mobile browser or emulator.

---

## Project Structure

```
onetap-reality/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts     # Multimodal vision, evidence validation & action synthesis
│   │   └── chat/
│   │       └── route.ts     # Zero-hallucination structured follow-up Q&A
│   ├── globals.css          # Dark/Light theme design tokens & root styles
│   ├── layout.tsx           # Theme initialization script & root layout
│   └── page.tsx             # OneTap Reality phone-first UI & interaction flow
├── public/                  # Static assets
├── .env.local               # Private server environment configuration
├── package.json             # Scripts & dependency definitions (locked to port 3001)
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

---

## Safety & Verification Principles

- **No Ghost Actions:** Actions are rendered only when supported by verified, non-placeholder data.
- **Server-Side API Key Isolation:** `GEMINI_API_KEY` is strictly accessed in server-side route handlers.
- **Client Privacy:** Images are processed in-memory and scan history is saved locally on device.

---

## Roadmap

- [x] Multimodal Vision & Entity Extraction
- [x] Zero-Hallucination Evidence Validation
- [x] Google Calendar Pre-filled Events
- [x] Smart Contextual Search
- [x] Multilingual Translation & Follow-up Q&A
- [x] Dark & Light Theme System
- [ ] On-device offline OCR caching
- [ ] Direct NFC / QR smart action triggering
- [ ] Multi-turn camera live stream scanning

---

## License

Private Prototype for iQOO Hackathon 2026.
