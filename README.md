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

<p align="center">
  <img src="public/demo.gif" alt="Demo af Feedback Bot - fra login til chat" width="800" />
</p>

---

## Sådan virker det

1. **Godkendelse** → Adgangskodebeskyttet session
2. **Onboarding** → Eleven vælger fag, klassetrin og uploader opgave/arbejde
3. **Chat** → Streaming AI-feedback via konfigurerbar LLM-backend

Systemprompt'en, der definerer bottens pædagogiske adfærd, findes i [`src/config/systemPrompt.ts`](src/config/systemPrompt.ts).

## Skærmbilleder

<details open>
<summary>☀️ Lys tilstand</summary>

|                          Adgangskode                          |                       Velkomst                       |
| :-----------------------------------------------------------: | :--------------------------------------------------: |
| [![Adgangskode](public/screenshots/01-password-gate-light.png)](public/screenshots/fullsize/01-password-gate-light.png) | [![Velkomst](public/screenshots/02-welcome-light.png)](public/screenshots/fullsize/02-welcome-light.png) |

|                       Vælg fag og klassetrin                        |                         Beskriv opgaven                          |
| :-----------------------------------------------------------------: | :--------------------------------------------------------------: |
| [![Fag og klassetrin](public/screenshots/03-subject-grade-light.png)](public/screenshots/fullsize/03-subject-grade-light.png) | [![Opgavebeskrivelse](public/screenshots/04-assignment-light.png)](public/screenshots/fullsize/04-assignment-light.png) |

|                      Indsæt dit arbejde                      |                           Karaktervurdering?                            |
| :----------------------------------------------------------: | :---------------------------------------------------------------------: |
| [![Elevarbejde](public/screenshots/05-student-work-light.png)](public/screenshots/fullsize/05-student-work-light.png) | [![Karakterpræference](public/screenshots/06-grade-preference-light.png)](public/screenshots/fullsize/06-grade-preference-light.png) |

|                         Vælg AI-model                         |               Chat med feedback-botten               |
| :-----------------------------------------------------------: | :--------------------------------------------------: |
| [![Modelvalg](public/screenshots/07-model-selection-light.png)](public/screenshots/fullsize/07-model-selection-light.png) | [![Chat](public/screenshots/08-chat-window-light.png)](public/screenshots/fullsize/08-chat-window-light.png) |

</details>

<details>

<summary>🌙 Mørk tilstand</summary>

|                         Adgangskode                          |                      Velkomst                       |
| :----------------------------------------------------------: | :-------------------------------------------------: |
| [![Adgangskode](public/screenshots/01-password-gate-dark.png)](public/screenshots/fullsize/01-password-gate-dark.png) | [![Velkomst](public/screenshots/02-welcome-dark.png)](public/screenshots/fullsize/02-welcome-dark.png) |

|                       Vælg fag og klassetrin                       |                         Beskriv opgaven                         |
| :----------------------------------------------------------------: | :-------------------------------------------------------------: |
| [![Fag og klassetrin](public/screenshots/03-subject-grade-dark.png)](public/screenshots/fullsize/03-subject-grade-dark.png) | [![Opgavebeskrivelse](public/screenshots/04-assignment-dark.png)](public/screenshots/fullsize/04-assignment-dark.png) |

|                     Indsæt dit arbejde                      |                           Karaktervurdering?                           |
| :---------------------------------------------------------: | :--------------------------------------------------------------------: |
| [![Elevarbejde](public/screenshots/05-student-work-dark.png)](public/screenshots/fullsize/05-student-work-dark.png) | [![Karakterpræference](public/screenshots/06-grade-preference-dark.png)](public/screenshots/fullsize/06-grade-preference-dark.png) |

|                        Vælg AI-model                         |              Chat med feedback-botten               |
| :----------------------------------------------------------: | :-------------------------------------------------: |
| [![Modelvalg](public/screenshots/07-model-selection-dark.png)](public/screenshots/fullsize/07-model-selection-dark.png) | [![Chat](public/screenshots/08-chat-window-dark.png)](public/screenshots/fullsize/08-chat-window-dark.png) |

</details>

## Udvikling

```bash
bun run dev      # Udviklingsserver
bun run build    # Produktionsbuild
```
