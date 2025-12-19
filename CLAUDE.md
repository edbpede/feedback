# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Guidelines

When writing or modifying TypeScript, Astro, SolidJS, or UnoCSS code, consult the detailed coding standards in `.augment/rules/astro-typescript-solidjs-unocss.md`. This file contains authoritative patterns and conventions for this project.

## Codebase Search

**Always use the `mcp__auggie-mcp__codebase-retrieval` tool as the primary method for:**

- Exploring the codebase and understanding architecture
- Finding existing patterns before implementing new features
- Locating relevant code when the exact file location is unknown
- Gathering context before making edits
- Planning tasks in plan mode

This semantic search tool provides better results than grep/find for understanding code relationships. Use grep only for finding exact string matches or all occurrences of a known identifier.

## Project Overview

Danish AI-powered educational chatbot ("Feedback Bot til Studerende") for students in grades 7-9. Provides formative pedagogical feedback on schoolwork without giving direct answers. Acts as a sparring partner using guiding questions.

## Commands

```bash
bun run dev          # Start development server
bun run build        # Production build
bun run preview      # Preview production build
bun run format       # Format code with Prettier
bun run format:check # Check code formatting
```

## Tech Stack

- **Astro 5.x** - Static site generation with SSR
- **SolidJS 1.9** - Reactive UI (signals, not React hooks)
- **UnoCSS** - Atomic CSS with Tailwind presets
- **Kobalte UI** - Accessible component library for Solid
- **TypeScript** - Strict mode enabled

## Path Aliases

```
@/*           → src/*
@components/* → src/components/*
@lib/*        → src/lib/*
@config/*     → src/config/*
```

## Architecture

### User Flow
```
PasswordGate → OnboardingFlow → ChatWindow
```

1. **Authentication**: Password verified against SHA-256 hash, HMAC-signed session cookie (7-day expiry)
2. **Onboarding**: Multi-step wizard (model path → subject/grade → assignment → student work → anonymization → model selection)
3. **Chat**: Streaming AI responses with markdown rendering, cost tracking, retry logic

### Two Model Paths
- **Privacy-first**: TEE (Trusted Execution Environment) models - no PII detection needed
- **Enhanced-quality**: Commercial models - requires PII detection/anonymization before sending

### Key Directories
```
src/
├── components/          # SolidJS components
│   ├── ui/              # Reusable primitives (button, input, card, etc.)
│   ├── onboarding/      # Wizard steps
│   └── pii/             # PII detection & review
├── pages/
│   ├── index.astro      # Main entry
│   └── api/             # Server endpoints (auth, chat, pii-detect, balance)
├── lib/                 # Utilities (api, auth, storage, i18n, fileParser)
└── config/
    ├── systemPrompt.ts  # Main pedagogical prompt
    ├── models.ts        # Model definitions & pricing
    ├── subjectPrompts.ts
    └── systemPrompts/   # Subject-specific prompts (13 Danish subjects)
```

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api/auth` | Password authentication |
| `/api/chat` | Stream AI feedback |
| `/api/pii-detect` | Detect PII with fallback models |
| `/api/balance` | Fetch NanoGPT account balance |
| `/api/verify-session` | Check session validity |

### State Management
- **SolidJS signals** for reactive UI state
- **localStorage** for persistence: messages, costs, onboarding state, theme, language

### Streaming & Rendering
- Markdown rendered server-side with `marked` + `highlight.js`
- API responses streamed via `ReadableStream`
- Lazy-loaded: PDF.js, mammoth (DOCX), highlight.js

## Environment Variables

Required in `.env`:
```
PASSWORD_HASH         # SHA-256 of access password
SESSION_SECRET        # HMAC signing key (32+ chars)
NANO_GPT_API_KEY      # LLM provider API key
```

Optional:
```
NANO_GPT_MODEL        # Default model (defaults to TEE/deepseek-v3.2)
API_BASE_URL          # NanoGPT endpoint
ENHANCED_QUALITY_PASSWORD_HASH  # Separate auth for premium models
```

## Internationalization

- Danish (primary) and English locales in `src/lib/i18n/locales/`
- Translation keys support nested paths and interpolation
- Language preference persisted in localStorage

## SolidJS Patterns

Use Solid idioms, not React:
- `createSignal()` not `useState()`
- `createEffect()` not `useEffect()`
- `createMemo()` not `useMemo()`
- Props accessed directly (no destructuring in function signature)
- Fine-grained reactivity - signals don't cause full re-renders
