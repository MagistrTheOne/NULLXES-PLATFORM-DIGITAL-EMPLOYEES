<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

**Technical reference (2026-06-26):** [`docs/AGENT_REFERENCE_2026-06-26.md`](docs/AGENT_REFERENCE_2026-06-26.md) — API routes, features, schema, env vars, recent fixes.  
**Mobile client brief (2026-07-04):** [`docs/AGENT_MOBILE_CLIENT_2026-07-04.md`](docs/AGENT_MOBILE_CLIENT_2026-07-04.md) — features, style, platform APIs, Talk SLA (stack chosen by implementer).  
**Scaling guide (2026-07-04):** [`docs/SCALING_2026-07-04.md`](docs/SCALING_2026-07-04.md) — 10 → 100 → 1000+ users, ops checklist, transition triggers.  
Index: [`docs/README.md`](docs/README.md).

<!-- ====================================================== -->

<!-- FRAMEWORK RULES -->

<!-- ====================================================== -->

# Framework Rules

This project uses modern versions of all frameworks.

Do not rely on training data assumptions.

Always consult official documentation before generating code.

Required sources:

Next.js:
https://nextjs.org/docs

Drizzle ORM:
https://orm.drizzle.team/docs

Drizzle Kit:
https://orm.drizzle.team/docs/drizzle-kit-generate

Better Auth:
https://better-auth.com/docs

Neon:
https://neon.com/docs

---

## Next.js Rules

This project uses:

* Next.js 16+
* App Router
* React 19
* Server Components by default

Before implementing:

Read:
node_modules/next/dist/docs/

Do not assume older Next.js behavior.

Avoid:

* Pages Router
* getServerSideProps
* getStaticProps
* getInitialProps
* API Routes from Pages Router

Prefer:

* Server Components
* Route Handlers
* Server Actions
* Suspense
* Streaming
* Partial Prerendering when applicable

---

## Better Auth Rules

Use Better Auth as the single authentication system.

Never implement:

* NextAuth
* Custom JWT systems
* Clerk
* Supabase Auth

Use:

* Better Auth session management
* Better Auth adapters
* Better Auth server APIs

Always verify current Better Auth documentation before implementation.

---

## Drizzle ORM Rules

Use Drizzle ORM exclusively.

Never generate Prisma code.

Never suggest Prisma migrations.

Never mix ORM layers.

Use:

* Drizzle Schema
* Drizzle Relations
* Drizzle Queries
* Drizzle Kit

Migration workflow:

1. Update schema
2. Generate migration
3. Apply migration
4. Verify database state

---

## Neon Rules

Database Provider:

Neon PostgreSQL

Use:

* Serverless driver
* Connection pooling
* Environment variables

Never assume local PostgreSQL behavior if Neon documentation differs.

Always follow Neon best practices.

---

## shadcn/ui Rules

Only use shadcn/ui components.

Never create custom component libraries.

Prefer:

* Card
* Sheet
* Dialog
* Dropdown Menu
* Table
* Data Table
* Sidebar
* Command
* Tabs

All UI should remain consistent with shadcn patterns.

---

## Design Rules

Theme:

Black & White

No bright colors.

No gradients.

No crypto aesthetics.

No gaming aesthetics.

No cyberpunk aesthetics.

No glass abuse.

No excessive blur.

Visual reference:

Apple
Linear
OpenAI
Notion
Background:      #000000
Surface:         #090909
Card:            #111111
Border:          rgba(255,255,255,0.08)

Text Primary:    #FFFFFF
Text Secondary:  rgba(255,255,255,0.60)

Hover:           rgba(255,255,255,0.04)
The interface should feel like enterprise software used daily by executives operating digital employees.

---

## Architecture Rules

Always prefer:

Feature-first architecture

Example:

src/

features/
employees/
analytics/
workflows/
knowledge/

components/

lib/

server/

db/

auth/

Never create large monolithic folders.

Keep business logic inside features.

Keep UI separate from domain logic.

---

## Product Context

NULLXES Digital Employees is a Digital Workforce Operating System.

The primary entity is:

Digital Employee

Everything in the product revolves around Digital Employees.

Analytics, workflows and settings are secondary systems.

Employees are the center of the experience.
