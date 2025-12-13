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

A Danish student feedback chatbot ("Feedback Bot til Studerende") built with Astro, SolidJS, and UnoCSS. The bot provides formative feedback for grades 7-9, guiding students through their schoolwork without giving direct answers. It supports optional grade suggestions using the Danish 7-point grading scale.

## Commands

```bash
bun run dev      # Start development server
bun run build    # Production build
bun run preview  # Preview production build
```

## Tech Stack

- **Astro 5.x** - Server-side rendering with Vercel adapter
- **SolidJS 1.9+** - UI components (JSX with `jsxImportSource: solid-js`)
- **UnoCSS** - Styling with Wind3 preset, animations, and shadcn-solid components
- **Kobalte** - Accessible component primitives (@kobalte/core)
- **TypeScript** - Strict mode extending `astro/tsconfigs/strict`

## Architecture

### Path Aliases
```
@/*           → src/*
@components/* → src/components/*
@lib/*        → src/lib/*
@config/*     → src/config/*
```

### Key Directories
- `src/pages/api/` - API routes: auth, chat (streaming), logout
- `src/components/ui/` - shadcn-solid components (Button, Card, Input, etc.)
- `src/components/onboarding/` - Multi-step onboarding flow
- `src/lib/` - Utilities (api, storage, theme, i18n, types, fileParser)
- `src/config/systemPrompt.ts` - Danish-language system prompt for the AI

### Application Flow
1. `PasswordGate` - Session authentication
2. `OnboardingFlow` - Collects subject, grade level, assignment, student work
3. `ChatWindow` - Streaming chat interface with NanoGPT backend

### Environment Variables (astro:env/server)
- `PASSWORD_HASH`, `SESSION_SECRET` - Authentication
- `NANO_GPT_API_KEY`, `NANO_GPT_MODEL`, `API_BASE_URL` - AI backend

## SolidJS Guidelines

- Never destructure props directly (breaks reactivity)
- Use `splitProps()` for prop separation
- Type components with `Component<Props>` or `ParentComponent<Props>`
- Use `onCleanup()` in effects for subscriptions/timers

## Styling

Uses UnoCSS with shadcn-solid theming. Theme toggle via `data-kb-theme` attribute. Custom colors defined in `src/styles/globals.css` with CSS variables.
