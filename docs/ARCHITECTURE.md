# NULLXES Architecture (Mermaid)

Source of truth for Cursor / agents. Live render: `/docs/architecture`.

Diagram sources are mirrored in `src/app/docs/_lib/architecture-diagrams.ts`.

## C4 — Containers

```mermaid
flowchart TB
  Op["Operator<br/>Owner · Admin · Member"]

  subgraph Platform["NULLXES Platform"]
    Web["Next.js App<br/>Dashboard · Talk · Docs · Settings"]
    API["Route Handlers<br/>Auth · brain-stream · /api/v1"]
    Workers["Inngest Workers<br/>Missions · tasks · outbound"]
  end

  LLM["LLM Provider<br/>OpenAI · Anthropic · Google · NULLXES"]
  Avatar["Avatar / Voice<br/>Anam · ElevenLabs · xAI"]
  DB[("Neon PostgreSQL<br/>Drizzle · org-scoped")]
  Pay["T-Bank Acquiring"]

  Op -->|HTTPS| Web
  Web --> API
  API --> DB
  Workers --> DB
  API -->|events| Workers
  API --> LLM
  Web --> Avatar
  API --> Pay
```

## Talk — sequence

```mermaid
sequenceDiagram
    autonumber
    actor Op as Operator
    participant UI as Talk UI
    participant BS as brain-stream
    participant Cache as Session brain cache
    participant DB as Postgres
    participant LLM as LLM Provider
    participant Tools as Agent tools

    Op->>UI: message / voice
    UI->>BS: POST /api/talk/brain-stream
    BS->>Cache: load or build prompt + enabled tools
    BS->>DB: live missions + tasks snapshot
    BS->>LLM: stream (read tools always on)
    alt tool_call list_missions / list_tasks
      LLM->>Tools: executeAgentTool
      Tools->>DB: query
      Tools-->>LLM: live status
    end
    LLM-->>BS: tokens
    BS-->>UI: SSE stream
    UI-->>Op: reply
```

## Missions — flow

```mermaid
flowchart LR
    A[Assign mission] --> B[Inngest process-mission]
    B --> C{Research / leads}
    C --> D[waiting_approval]
    D --> E[Settings Approvals]
    E -->|approve| F[Outbound send]
    E -->|reject| G[cancelled]
    F --> H[completed]
    B -.->|Talk list_missions| T[Talk grounded status]
    D -.-> T
```

## ERD — core

```mermaid
erDiagram
    ORGANIZATION ||--o{ DIGITAL_EMPLOYEE : owns
    ORGANIZATION ||--o| ORGANIZATION_SETTINGS : has
    ORGANIZATION ||--o{ API_KEY : issues
    DIGITAL_EMPLOYEE ||--o{ EMPLOYEE_MISSION : runs
    DIGITAL_EMPLOYEE ||--o{ EMPLOYEE_TASK : queued
    DIGITAL_EMPLOYEE ||--o{ EMPLOYEE_SESSION : talks
    DIGITAL_EMPLOYEE ||--o{ AGENT_APPROVAL_REQUEST : requests
    PLATFORM_EMPLOYEE_CATALOG ||--|| DIGITAL_EMPLOYEE : publishes
    EMPLOYEE_MISSION ||--o{ AGENT_APPROVAL_REQUEST : proposals

    ORGANIZATION {
      uuid id PK
      string billing_plan
    }
    DIGITAL_EMPLOYEE {
      uuid id PK
      uuid organization_id FK
      string name
      string status
    }
    EMPLOYEE_MISSION {
      uuid id PK
      uuid employee_id FK
      string status
    }
    EMPLOYEE_TASK {
      uuid id PK
      uuid employee_id FK
      string status
    }
    EMPLOYEE_SESSION {
      uuid id PK
      uuid employee_id FK
    }
    AGENT_APPROVAL_REQUEST {
      uuid id PK
      string action_type
      string status
    }
    PLATFORM_EMPLOYEE_CATALOG {
      uuid employee_id FK
      boolean is_published
    }
```

## Update policy

When changing Talk tools, mission lifecycle, catalog listing, or core schema:
1. Update `src/app/docs/_lib/architecture-diagrams.ts`
2. Mirror the same Mermaid blocks in this file
3. Confirm render on `/docs/architecture`
