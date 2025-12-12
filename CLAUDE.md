# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Codebase Search

**Always use the `mcp__auggie-mcp__codebase-retrieval` tool as the primary method for:**
- Exploring the codebase and understanding architecture
- Finding existing patterns before implementing new features
- Locating relevant code when the exact file location is unknown
- Gathering context before making edits
- Planning tasks in plan mode

This semantic search tool provides better results than grep/find for understanding code relationships. Use grep only for finding exact string matches or all occurrences of a known identifier.

## Project Overview

Student Feedback Bot - an Astro-based web application that provides AI-powered feedback on student assignments. Users authenticate with a password, upload DOCX/PDF files, and receive feedback via a streaming chat interface powered by NanoGPT.

## Commands

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run preview  # Preview production build
```

## Architecture

### Tech Stack
- **Framework**: Astro 5 with SSR (server-side rendering)
- **UI Framework**: SolidJS for reactive components
- **Styling**: UnoCSS (Wind preset + Icons)
- **Deployment**: Vercel adapter
- **AI Backend**: NanoGPT API (OpenAI-compatible streaming)

### Project Structure

```
src/
├── components/     # SolidJS components (.tsx)
├── config/         # Configuration (systemPrompt.ts)
├── lib/            # Shared utilities (api, storage, types, fileParser)
├── pages/
│   ├── api/        # Astro API routes (auth, chat, logout)
│   └── index.astro # Main page entry
```

### Path Aliases
- `@components/*` → `src/components/*`
- `@lib/*` → `src/lib/*`
- `@config/*` → `src/config/*`

### Key Patterns

**Authentication Flow**: Password-based auth using HMAC-signed session tokens stored in HTTP-only cookies. Auth state checked via `/api/chat` endpoint response.

**Chat Streaming**: The `/api/chat` endpoint proxies streaming responses from NanoGPT API directly to the client. Client parses SSE `data:` lines and extracts delta content.

**File Processing**: Client-side extraction of text from DOCX (mammoth) and PDF (pdfjs-dist) files. Extracted text is prepended to chat messages, not sent to a separate endpoint.

**State Management**: SolidJS signals for component state, localStorage for message persistence across sessions.

### Environment Variables (server-only)
- `PASSWORD_HASH` - SHA-256 hash of access password
- `SESSION_SECRET` - Secret for signing session tokens
- `NANO_GPT_API_KEY` - API key for NanoGPT
- `NANO_GPT_MODEL` - Model to use (default: `TEE/deepseek-v3.2`)
- `API_BASE_URL` - NanoGPT API base URL (default: `https://nano-gpt.com/api/v1`)

### System Prompt
Edit `src/config/systemPrompt.ts` to customize the AI's behavior and feedback style.
