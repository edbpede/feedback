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
3. **Anonymisering** → Personlige oplysninger detekteres og anonymiseres via en privat TEE-model før afsendelse til AI
4. **Chat** → Streaming AI-feedback via konfigurerbar LLM-backend

Systemprompt'en, der definerer bottens pædagogiske adfærd, findes i [`src/config/systemPrompt.ts`](src/config/systemPrompt.ts).

## Skærmbilleder

<details closed>
<summary>☀️ Lys tilstand</summary>

|                                                       Adgangskode                                                       |                                                 Velkomst                                                 |
| :---------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------: |
| [![Adgangskode](public/screenshots/01-password-gate-light.png)](public/screenshots/fullsize/01-password-gate-light.png) | [![Velkomst](public/screenshots/02-welcome-light.png)](public/screenshots/fullsize/02-welcome-light.png) |

|                                                 Vælg modeltype                                                  |                                                    Vælg fag og klassetrin                                                     |
| :-------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------: |
| [![Modeltype](public/screenshots/03-model-path-light.png)](public/screenshots/fullsize/03-model-path-light.png) | [![Fag og klassetrin](public/screenshots/04-subject-grade-light.png)](public/screenshots/fullsize/04-subject-grade-light.png) |

|                                                     Beskriv opgaven                                                     |                                                  Indsæt dit arbejde                                                   |
| :---------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------: |
| [![Opgavebeskrivelse](public/screenshots/05-assignment-light.png)](public/screenshots/fullsize/05-assignment-light.png) | [![Elevarbejde](public/screenshots/06-student-work-light.png)](public/screenshots/fullsize/06-student-work-light.png) |

|                                                          Karaktervurdering?                                                          |                                                  Finder personlige oplysninger                                                   |
| :----------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------: |
| [![Karakterpræference](public/screenshots/07-grade-preference-light.png)](public/screenshots/fullsize/07-grade-preference-light.png) | [![Finder oplysninger](public/screenshots/08-anon-detecting-light.png)](public/screenshots/fullsize/08-anon-detecting-light.png) |

|                                              Gennemse fundne oplysninger                                              |                                                     Indsigelses-muligheder                                                     |
| :-------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
| [![Gennemse fund](public/screenshots/09-anon-review-light.png)](public/screenshots/fullsize/09-anon-review-light.png) | [![Indsigelse](public/screenshots/10-anon-decline-menu-light.png)](public/screenshots/fullsize/10-anon-decline-menu-light.png) |

|                                                            Tilføj kontekst                                                            |                                                      Vælg hvad der skal beholdes                                                      |
| :-----------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------: |
| [![Tilføj kontekst](public/screenshots/11-anon-context-input-light.png)](public/screenshots/fullsize/11-anon-context-input-light.png) | [![Behold valgte](public/screenshots/12-anon-selective-keep-light.png)](public/screenshots/fullsize/12-anon-selective-keep-light.png) |

|                                              Bekræft at beholde oplysninger                                              |                                                       Vælg AI-model                                                       |
| :----------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------: |
| [![Bekræft behold](public/screenshots/13-anon-warning-light.png)](public/screenshots/fullsize/13-anon-warning-light.png) | [![Modelvalg](public/screenshots/14-model-selection-light.png)](public/screenshots/fullsize/14-model-selection-light.png) |

|                                           Chat med feedback-botten                                           |
| :----------------------------------------------------------------------------------------------------------: |
| [![Chat](public/screenshots/15-chat-window-light.png)](public/screenshots/fullsize/15-chat-window-light.png) |

</details>

<details closed>

<summary>🌙 Mørk tilstand</summary>

|                                                      Adgangskode                                                      |                                                Velkomst                                                |
| :-------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------: |
| [![Adgangskode](public/screenshots/01-password-gate-dark.png)](public/screenshots/fullsize/01-password-gate-dark.png) | [![Velkomst](public/screenshots/02-welcome-dark.png)](public/screenshots/fullsize/02-welcome-dark.png) |

|                                                Vælg modeltype                                                 |                                                   Vælg fag og klassetrin                                                    |
| :-----------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------: |
| [![Modeltype](public/screenshots/03-model-path-dark.png)](public/screenshots/fullsize/03-model-path-dark.png) | [![Fag og klassetrin](public/screenshots/04-subject-grade-dark.png)](public/screenshots/fullsize/04-subject-grade-dark.png) |

|                                                    Beskriv opgaven                                                    |                                                 Indsæt dit arbejde                                                  |
| :-------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------: |
| [![Opgavebeskrivelse](public/screenshots/05-assignment-dark.png)](public/screenshots/fullsize/05-assignment-dark.png) | [![Elevarbejde](public/screenshots/06-student-work-dark.png)](public/screenshots/fullsize/06-student-work-dark.png) |

|                                                         Karaktervurdering?                                                         |                                                 Finder personlige oplysninger                                                  |
| :--------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
| [![Karakterpræference](public/screenshots/07-grade-preference-dark.png)](public/screenshots/fullsize/07-grade-preference-dark.png) | [![Finder oplysninger](public/screenshots/08-anon-detecting-dark.png)](public/screenshots/fullsize/08-anon-detecting-dark.png) |

|                                             Gennemse fundne oplysninger                                             |                                                    Indsigelses-muligheder                                                    |
| :-----------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------: |
| [![Gennemse fund](public/screenshots/09-anon-review-dark.png)](public/screenshots/fullsize/09-anon-review-dark.png) | [![Indsigelse](public/screenshots/10-anon-decline-menu-dark.png)](public/screenshots/fullsize/10-anon-decline-menu-dark.png) |

|                                                           Tilføj kontekst                                                           |                                                     Vælg hvad der skal beholdes                                                     |
| :---------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------: |
| [![Tilføj kontekst](public/screenshots/11-anon-context-input-dark.png)](public/screenshots/fullsize/11-anon-context-input-dark.png) | [![Behold valgte](public/screenshots/12-anon-selective-keep-dark.png)](public/screenshots/fullsize/12-anon-selective-keep-dark.png) |

|                                             Bekræft at beholde oplysninger                                             |                                                      Vælg AI-model                                                      |
| :--------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------: |
| [![Bekræft behold](public/screenshots/13-anon-warning-dark.png)](public/screenshots/fullsize/13-anon-warning-dark.png) | [![Modelvalg](public/screenshots/14-model-selection-dark.png)](public/screenshots/fullsize/14-model-selection-dark.png) |

|                                          Chat med feedback-botten                                          |
| :--------------------------------------------------------------------------------------------------------: |
| [![Chat](public/screenshots/15-chat-window-dark.png)](public/screenshots/fullsize/15-chat-window-dark.png) |

</details>

## Udvikling

```bash
bun run dev      # Udviklingsserver
bun run build    # Produktionsbuild
```
