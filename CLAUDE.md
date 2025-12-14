# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Danish AI-powered feedback chatbot for students (grades 7-9) that provides formative pedagogical guidance without giving direct answers. Uses NanoGPT API for multi-model LLM streaming responses.

**Stack:** Astro 5.x + SolidJS 1.9 + TypeScript 5.9 + UnoCSS + Vercel

## Commands

```bash
bun run dev          # Start development server
bun run build        # Production build
bun run preview      # Preview production build
bun run format       # Format code with Prettier
bun run format:check # Check formatting
```

## Architecture

### Application Flow
1. **Entry:** `src/pages/index.astro` mounts `App.tsx` with Astro's `client:load`
2. **Auth:** Password verification via `/api/auth` → HMAC-signed session cookie
3. **Onboarding:** 6-step flow (welcome → subject/grade → assignment → student work → grade preference → model selection)
4. **Chat:** Streaming responses via `/api/chat` → NanoGPT API with retry logic

### Key Directories
- `src/components/` - SolidJS components (App, ChatWindow, onboarding steps, UI primitives)
- `src/components/ui/` - Reusable UI components (card, button, tooltip, etc.)
- `src/lib/` - Utilities (API client, storage, file parsing, i18n)
- `src/config/` - System prompt and model configuration
- `src/pages/api/` - Server endpoints (auth, chat, balance, logout)

### API Routes
- `POST /api/auth` - Password verification, sets session cookie
- `POST /api/chat` - LLM streaming with SSE, supports retry on 5xx errors
- `POST /api/balance` - NanoGPT balance check
- `POST /api/logout` - Session cleanup

### State Management
- Client-side only using Solid signals
- Onboarding state and messages persisted to localStorage
- Theme/locale preferences in localStorage

## Key Patterns

### SolidJS (Not React)
This project uses SolidJS, not React. Key differences:
- Components don't re-render; signals track reactive updates
- Use `createSignal()`, `createEffect()`, `Show`, `For` instead of React patterns
- Props destructuring breaks reactivity - access props directly

### Styling with UnoCSS
- Uses UnoCSS (not Tailwind directly) with preset-wind3 for Tailwind compatibility
- OKLch color space for theme colors
- `cn()` utility from `@lib/utils` for conditional class merging

### API Streaming
- SSE format: `data: {...}\n\n` with `[DONE]` marker
- Retry logic: 10 max attempts with exponential backoff (1s → 60s)
- Custom `ApiError` class with `retryable` flag

### Internationalization
- Danish (da) default, English (en) alternative
- Translations in `src/lib/i18n/locales/`
- Use `t()` function from `@lib/i18n` for translations

### File Processing
- PDF via pdfjs-dist, DOCX via mammoth
- Dynamic imports (lazy-loaded on demand)
- Client-side extraction only

## Environment Variables

Required in `.env`:
- `PASSWORD_HASH` - SHA-256 hash of access password
- `SESSION_SECRET` - HMAC signing secret (32+ chars)
- `NANO_GPT_API_KEY` - API key from nano-gpt.com

Optional:
- `NANO_GPT_MODEL` - Default model (defaults to TEE/deepseek-v3.2)
- `API_BASE_URL` - API endpoint (defaults to https://nano-gpt.com/api/v1)

## Path Aliases

```typescript
@/*           → src/*
@components/* → src/components/*
@lib/*        → src/lib/*
@config/*     → src/config/*
```

## Model Configuration

5 supported models in `src/config/models.ts`:
- DeepSeek v3.2 (math/science recommended)
- GPT-OSS, GLM-4.6, Qwen, Gemma (language-focused)

Some models require strict user/assistant message alternation - handled in `/api/chat`.
