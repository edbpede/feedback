<p align="center">
  <img src="public/feedback-logo.svg" alt="Feedback Bot" width="120" />
</p>

<h1 align="center">Student Feedback Bot</h1>

<p align="center">
  <a href="README.md">Dansk</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/SolidJS-1.9-2C4F7C?logo=solid&logoColor=white" alt="SolidJS" />
</p>

<p align="center">
  A Danish AI-powered feedback chatbot for students in grades 7-9, providing formative guidance on schoolwork without giving direct answers.
</p>

<p align="center">
  <img src="public/demo.gif" alt="Feedback Bot demo - from login to chat" width="800" />
</p>

---

## How It Works

1. **Authentication** → Password-protected session
2. **Onboarding** → Student selects subject, grade level, and uploads assignment/work
3. **Anonymization** → Personal information is detected and anonymized via a private TEE model before sending to AI
4. **Chat** → Streaming AI feedback via configurable LLM backend

The system prompt defining the bot's pedagogical behavior is in [`src/config/systemPrompt.ts`](src/config/systemPrompt.ts).

## Screenshots

<details closed>
<summary>☀️ Light Mode</summary>

|                                                       Password                                                       |                                                 Welcome                                                 |
| :------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------: |
| [![Password](public/screenshots/01-password-gate-light.png)](public/screenshots/fullsize/01-password-gate-light.png) | [![Welcome](public/screenshots/02-welcome-light.png)](public/screenshots/fullsize/02-welcome-light.png) |

|                                                   Select Model Type                                                   |                                                   Select Subject & Grade                                                    |
| :-------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------: |
| [![Model Type](public/screenshots/03-model-path-light.png)](public/screenshots/fullsize/03-model-path-light.png) | [![Subject & Grade](public/screenshots/04-subject-grade-light.png)](public/screenshots/fullsize/04-subject-grade-light.png) |

|                                               Describe Assignment                                                |                                                     Add Your Work                                                      |
| :--------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------: |
| [![Assignment](public/screenshots/05-assignment-light.png)](public/screenshots/fullsize/05-assignment-light.png) | [![Student Work](public/screenshots/06-student-work-light.png)](public/screenshots/fullsize/06-student-work-light.png) |

|                                                         Grade Assessment?                                                          |                                                         Detecting Personal Information                                                          |
| :--------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------: |
| [![Grade Preference](public/screenshots/07-grade-preference-light.png)](public/screenshots/fullsize/07-grade-preference-light.png) | [![Detecting PII](public/screenshots/08-anon-detecting-light.png)](public/screenshots/fullsize/08-anon-detecting-light.png) |

|                                                         Review Detected Information                                                         |                                                         Decline Options                                                         |
| :-----------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------: |
| [![Review Findings](public/screenshots/09-anon-review-light.png)](public/screenshots/fullsize/09-anon-review-light.png) | [![Decline Options](public/screenshots/10-anon-decline-menu-light.png)](public/screenshots/fullsize/10-anon-decline-menu-light.png) |

|                                                         Add Context                                                         |                                                         Select Items to Keep                                                         |
| :-------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------: |
| [![Add Context](public/screenshots/11-anon-context-input-light.png)](public/screenshots/fullsize/11-anon-context-input-light.png) | [![Keep Selection](public/screenshots/12-anon-selective-keep-light.png)](public/screenshots/fullsize/12-anon-selective-keep-light.png) |

|                                                         Confirm Keeping Information                                                         |                                                         Choose AI Model                                                         |
| :-----------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------: |
| [![Confirm Keep](public/screenshots/13-anon-warning-light.png)](public/screenshots/fullsize/13-anon-warning-light.png) | [![Model Selection](public/screenshots/14-model-selection-light.png)](public/screenshots/fullsize/14-model-selection-light.png) |

|                                            Chat with Feedback Bot                                            |
| :----------------------------------------------------------------------------------------------------------: |
| [![Chat](public/screenshots/15-chat-window-light.png)](public/screenshots/fullsize/15-chat-window-light.png) |

</details>

<details closed>
<summary>🌙 Dark Mode</summary>

|                                                      Password                                                      |                                                Welcome                                                |
| :----------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------: |
| [![Password](public/screenshots/01-password-gate-dark.png)](public/screenshots/fullsize/01-password-gate-dark.png) | [![Welcome](public/screenshots/02-welcome-dark.png)](public/screenshots/fullsize/02-welcome-dark.png) |

|                                                  Select Model Type                                                  |                                                  Select Subject & Grade                                                   |
| :-----------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------: |
| [![Model Type](public/screenshots/03-model-path-dark.png)](public/screenshots/fullsize/03-model-path-dark.png) | [![Subject & Grade](public/screenshots/04-subject-grade-dark.png)](public/screenshots/fullsize/04-subject-grade-dark.png) |

|                                              Describe Assignment                                               |                                                    Add Your Work                                                     |
| :------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------: |
| [![Assignment](public/screenshots/05-assignment-dark.png)](public/screenshots/fullsize/05-assignment-dark.png) | [![Student Work](public/screenshots/06-student-work-dark.png)](public/screenshots/fullsize/06-student-work-dark.png) |

|                                                        Grade Assessment?                                                         |                                                         Detecting Personal Information                                                         |
| :------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------: |
| [![Grade Preference](public/screenshots/07-grade-preference-dark.png)](public/screenshots/fullsize/07-grade-preference-dark.png) | [![Detecting PII](public/screenshots/08-anon-detecting-dark.png)](public/screenshots/fullsize/08-anon-detecting-dark.png) |

|                                                         Review Detected Information                                                         |                                                         Decline Options                                                         |
| :-----------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------: |
| [![Review Findings](public/screenshots/09-anon-review-dark.png)](public/screenshots/fullsize/09-anon-review-dark.png) | [![Decline Options](public/screenshots/10-anon-decline-menu-dark.png)](public/screenshots/fullsize/10-anon-decline-menu-dark.png) |

|                                                         Add Context                                                         |                                                         Select Items to Keep                                                         |
| :-------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------: |
| [![Add Context](public/screenshots/11-anon-context-input-dark.png)](public/screenshots/fullsize/11-anon-context-input-dark.png) | [![Keep Selection](public/screenshots/12-anon-selective-keep-dark.png)](public/screenshots/fullsize/12-anon-selective-keep-dark.png) |

|                                                         Confirm Keeping Information                                                         |                                                        Choose AI Model                                                        |
| :-----------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------: |
| [![Confirm Keep](public/screenshots/13-anon-warning-dark.png)](public/screenshots/fullsize/13-anon-warning-dark.png) | [![Model Selection](public/screenshots/14-model-selection-dark.png)](public/screenshots/fullsize/14-model-selection-dark.png) |

|                                           Chat with Feedback Bot                                           |
| :--------------------------------------------------------------------------------------------------------: |
| [![Chat](public/screenshots/15-chat-window-dark.png)](public/screenshots/fullsize/15-chat-window-dark.png) |

</details>

## Development

```bash
bun run dev      # Development server
bun run build    # Production build
```
