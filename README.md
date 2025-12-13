<p align="center">
  <img src="public/feedback-logo.svg" alt="Feedback Bot" width="120" />
</p>

<h1 align="center">Feedback Bot til Studerende</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/SolidJS-1.9-2C4F7C?logo=solid&logoColor=white" alt="SolidJS" />
</p>

<p align="center">
  A Danish AI-powered feedback chatbot for students in grades 7-9, providing formative guidance on schoolwork without giving direct answers.
</p>

---

## How It Works

1. **Authentication** → Password-protected session
2. **Onboarding** → Student selects subject, grade level, and uploads assignment/work
3. **Chat** → Streaming AI feedback via configurable LLM backend

The system prompt defining the bot's pedagogical behavior is in [`src/config/systemPrompt.ts`](src/config/systemPrompt.ts).

## Development

```bash
bun run dev      # Development server
bun run build    # Production build
```
