<p align="center">
  <img src="public/feedback-logo.svg" alt="Feedback Bot" width="120" />
</p>

<h1 align="center">Feedback Bot til Studerende</h1>

<p align="center">
  <a href="README.en.md">English</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/SolidJS-1.9-2C4F7C?logo=solid&logoColor=white" alt="SolidJS" />
</p>

<p align="center">
  En dansk AI-drevet feedback-chatbot til elever i 7.-9. klasse, der giver formativ vejledning i skolearbejde uden at give direkte svar.
</p>

---

## Sådan virker det

1. **Godkendelse** → Adgangskodebeskyttet session
2. **Onboarding** → Eleven vælger fag, klassetrin og uploader opgave/arbejde
3. **Chat** → Streaming AI-feedback via konfigurerbar LLM-backend

Systemprompt'en, der definerer bottens pædagogiske adfærd, findes i [`src/config/systemPrompt.ts`](src/config/systemPrompt.ts).

## Udvikling

```bash
bun run dev      # Udviklingsserver
bun run build    # Produktionsbuild
```
