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

Student Feedback Bot - A Danish AI-powered educational chatbot for grades 7-9 that provides formative guidance on schoolwork without giving direct answers. Built with Astro + SolidJS, deployed on Vercel.

## Development Commands

```bash
bun run dev          # Start development server
bun run build        # Production build
bun run preview      # Preview production build
bun run format       # Format code with Prettier
bun run format:check # Check formatting compliance
```

Package manager: **Bun** (uses `bun.lock`)

## Architecture

### Tech Stack
- **Framework:** Astro 5.x with SolidJS for reactive components
- **UI Library:** Kobalte (headless components)
- **Styling:** UnoCSS with Tailwind presets
- **Backend:** Astro server routes (Vercel adapter)
- **AI Provider:** NanoGPT API with streaming responses

### Key Directories
- `/src/components/` - SolidJS components (onboarding flow, chat, UI primitives)
- `/src/config/` - Model definitions, system prompt, pricing
- `/src/lib/` - Utilities, i18n, file parsing, storage
- `/src/pages/api/` - Server endpoints (auth, chat, balance)

### Data Flow
1. Password authentication → session cookie
2. 6-step onboarding: subject, grade, assignment, student work, grade preference, model selection
3. Streaming chat with NanoGPT API
4. Token costs tracked in localStorage

## Key Patterns

### State Management
- SolidJS reactive signals (`createSignal`, `createEffect`, `createMemo`)
- localStorage persistence for messages, onboarding state, costs, theme, language

### API Design
- Typed responses: `ApiResponse<T>` (success/error discriminated union)
- Session: HMAC-SHA256 signed tokens, HttpOnly cookies
- Streaming: Server-Sent Events for LLM responses
- Retry logic: 10 attempts with progressive backoff

### Error Handling
- 8 categories: network, timeout, rateLimit, serverError, authError, modelUnavailable, badRequest, unknown
- Structured `ErrorDetails` with status, message, type, code, retryable flag
- i18n-aware error messages

### File Processing
- PDF: pdfjs-dist (lazy-loaded)
- DOCX: mammoth (lazy-loaded)
- Dynamic imports optimize bundle size

### Model Selection
- 5 available models with subject-to-model recommendations
- Fallback selection when primary model fails
- Some models require strict user/assistant alternation (no system role)

### i18n
- Signal-based locale management (Danish/English)
- Translations in `/src/lib/i18n/locales/{da,en}.json`
- Template interpolation with `{{key}}` patterns

## Path Aliases

```typescript
@/*           → /src/*
@components/* → /src/components/*
@lib/*        → /src/lib/*
@config/*     → /src/config/*
```

## Environment Variables

```
PASSWORD_HASH      # SHA256 hash for session password
SESSION_SECRET     # HMAC signing key
NANO_GPT_API_KEY   # NanoGPT API key
NANO_GPT_MODEL     # Default model (default: TEE/deepseek-v3.2)
API_BASE_URL       # NanoGPT endpoint (default: https://nano-gpt.com/api/v1)
```

## Key Files for Common Changes

- **AI Models:** `/src/config/models.ts`
- **System Prompt:** `/src/config/systemPrompt.ts`
- **Token Pricing:** `/src/config/pricing.ts`
- **Translations:** `/src/lib/i18n/locales/`
- **Types:** `/src/lib/types.ts`
