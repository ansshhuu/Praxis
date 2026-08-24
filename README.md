# Praxis Enterprise AI Automation Ecosystem Platform

Intelligent, no-code AI workflow automation for enterprise teams — build pipelines on a visual canvas, extract meaning from documents, screen candidates, and query your workspace in plain language. Praxis runs on a hybrid data infrastructure: relational data in PostgreSQL, high-volume agent/workflow telemetry in MongoDB, a Redis/BullMQ job layer, and a ChromaDB vector store for embeddings.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-vector_store-2D3748)

Live link: https://enterprise-ai-app-sable.vercel.app/
---

## Features

- **Workflow Automation** — Drag-and-drop builder on a React Flow canvas. Chain triggers, AI steps, branching logic and actions, then execute and watch each node report back. The engine supports `TRIGGER`, `AI_CLASSIFY`, `EXTRACT_DATA`, `CONDITION`, `LOOP`, `DELAY`, `API_CALL`, `SAVE_DB`, `EMAIL_ACTION`, `NOTIFY` and `GENERATE_REPORT` nodes, with full run history.
- **Document Intelligence** — Upload PDF, DOCX, XLSX, CSV, TXT or images. Text is extracted natively, with Tesseract OCR for scans and photos, then summarised by AI and made queryable through document-scoped Q&A.
- **Resume Screening** — Score a batch of CVs against a job description in one pass. Candidates are ranked by match with skills matched and missing called out, plus generated interview questions per candidate.
- **Meeting Intelligence** — Upload audio (MP3, WAV, M4A) for Whisper transcription, or paste an existing transcript. Returns a summary, attendee list and extracted action items.
- **AI Assistant** — Workspace-aware chat with context from your documents and activity, constrained by a system prompt to platform topics.
- **Reports** — Generate PDF, Word or Excel documents over real platform data (employee, workflow, sales, HR, AI usage) with an AI-written insights section.
- **Scheduler** — Run saved workflows on cron schedules with quick presets, next-run tracking and pause/resume.
- **Analytics** — Execution trends, success/fail breakdowns, response-time percentiles, API volume and storage against quota.
- **Marketplace** — Prebuilt workflow templates that clone into your own workspace, pre-wired on the canvas.
- **Notifications** — Delivery log for every message the platform sends, including real email dispatched via Brevo.
- **Authentication & Roles** — NextAuth with credentials and Google OAuth. Four roles (`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`) enforced in middleware *and* re-checked server-side in each route handler.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript 5.7 |
| Styling | Tailwind CSS 4, Base UI, `tailwind-merge`, `cva` |
| Motion | Framer Motion 13 |
| Canvas | React Flow (`@xyflow/react`) |
| Charts | Recharts 3 |
| Database | PostgreSQL via Prisma 5 |
| Agent/workflow telemetry | MongoDB 7 via the official `mongodb` driver |
| Vector store | ChromaDB (`agent_knowledge_base`, `document_embeddings` collections) |
| Jobs & cache | Redis 7 via `ioredis`, queues via BullMQ |
| Storage | Supabase Storage (private buckets, served through authenticated routes) |
| Auth | NextAuth 4 — credentials + Google OAuth, JWT sessions |
| AI | Google Gemini (primary) with Hugging Face Inference fallback; OpenAI supported as an alternate provider; Whisper for audio |
| Documents | `pdf-parse`, `mammoth`, `xlsx`, `tesseract.js`, `pdf-lib`, `docx` |
| Email | Brevo transactional API |

## Architecture

Praxis is a single Next.js app (App Router) that talks to four data stores, each used for what it's best at:

- **PostgreSQL (via Prisma)** — the system of record: users, roles, organizations, workflows, documents, resumes, reports, notifications, meetings. Relational, transactional, migration-tracked (`prisma/`).
- **MongoDB** — schemaless, high-volume operational data that doesn't belong in relational tables: per-run agent logs (`agent_logs`), detailed workflow execution traces (`workflow_run_traces`, linked back to the Postgres `workflow_runs` row by `workflowId`/`runId`), and chat session histories with tool-call payloads (`chat_histories`). See `lib/db/mongodb.ts` and `lib/models/mongodb/`.
- **ChromaDB** — vector storage for embeddings, queried for document Q&A and agent knowledge retrieval. Two default collections are provisioned on startup: `agent_knowledge_base` and `document_embeddings`. See `lib/db/vector-db.ts`.
- **Redis** — BullMQ-backed job queues for background/async work, plus general caching. See `lib/db/redis.ts`.

Route handlers reach these through `lib/api/deps.ts`, and overall service health is exposed at `GET /api/health`, which pings all four stores and reports `up` / `down` / `not_configured` per service.

MongoDB, ChromaDB and Redis are optional in local development — `/api/health` reports them as `not_configured` rather than failing the request when their URLs are unset, so the app runs on Postgres alone if you don't need the hybrid layer yet.

## Getting Started

### Prerequisites

- **Node.js 20+** (developed on 22.x)
- **npm 10+**
- A **PostgreSQL** database (Supabase works well)
- A **Supabase** project for file storage
- A **Google Gemini** API key (or a Hugging Face token as fallback)

### Installation

```bash
git clone <repo-url>
cd enterprise-ai-dashboard
npm install
```

### Environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

`DATABASE_URL`, `NEXTAUTH_SECRET` and at least one AI key are required to boot. Supabase keys are required for anything that uploads files, and Brevo keys for outbound email. MongoDB, ChromaDB and Redis are optional — the app runs without them, with `/api/health` reporting `not_configured` for whichever are unset.

Generate a session secret with:

```bash
openssl rand -base64 32
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (session pooler, port 5432 — needed for both queries and `prisma migrate`) |
| `NEXTAUTH_SECRET` | Yes | Session/JWT signing secret |
| `NEXTAUTH_URL` | Yes | Public origin used for auth callbacks |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | "Continue with Google" — omit either to hide the provider |
| `GEMINI_API_KEY` | One of the three AI keys | Primary AI provider |
| `OPENAI_API_KEY` | One of the three AI keys | Alternate AI provider |
| `HUGGINGFACE_API_KEY` | One of the three AI keys | Fallback AI provider, also powers Whisper transcription |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | For file uploads | Private storage buckets: `documents`, `meetings`, `avatars` |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Client-side fallback for `SUPABASE_URL` |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | For outbound email | Transactional email provider |
| `CONTACT_INBOX_EMAIL` | No | Destination for landing page contact form; falls back to `BREVO_SENDER_EMAIL` |
| `MONGODB_URL` | No | MongoDB connection string — agent logs, workflow traces, chat histories |
| `MONGODB_DB_NAME` | No | MongoDB database name (default `praxis`) |
| `CHROMA_HOST` | No | ChromaDB server URL (default `http://localhost:8000`) |
| `CHROMA_PERSIST_DIR` | No | On-disk storage path for the Chroma *server* container — not read by the app itself |
| `REDIS_URL` | No | Redis connection string for BullMQ queues and caching |
| `STORAGE_QUOTA_MB` | No | Storage allowance shown on the Analytics page (default 1024) |

### Database

Apply migrations and seed a starter admin plus the marketplace templates:

```bash
npx prisma migrate dev
npm run seed
```

The seed creates `admin@company.com` / `Admin@123`. **Change or remove this before deploying anywhere public.**

Create three **private** storage buckets in Supabase: `documents`, `meetings` and `avatars`.

### Hybrid data stores (Docker Compose)

`docker-compose.yml` provisions local MongoDB, Redis and ChromaDB containers (plus a local PostgreSQL, if you'd rather not use Supabase for dev) with persistent named volumes:

```bash
docker compose up -d
```

This starts:

| Service | Port | Volume |
| --- | --- | --- |
| `postgres` | 5432 | `postgres_data` |
| `mongodb` | 27017 | `mongodb_data` |
| `redis` | 6379 | `redis_data` |
| `chromadb` | 8000 | `chroma_data` |

Point `.env` at them:

```bash
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=praxis
REDIS_URL=redis://localhost:6379
CHROMA_HOST=http://localhost:8000
```

Stop everything with `docker compose down` (add `-v` to also drop the volumes).

### Run

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

### Other commands

```bash
npm run build       # production build (type-checked)
npm run start       # serve the production build
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm test            # unit tests (Vitest)
npm run test:watch  # unit tests in watch mode
npm run seed        # re-run the database seed
```

### Tests & CI

Unit tests live in `tests/` and cover the pure logic most worth protecting —
role guards, avatar resolution, AI response parsing, and input validation:

```bash
npm test
```

GitHub Actions runs typecheck, lint, tests and a production build on every push
to `main` and every pull request (`.github/workflows/ci.yml`). The build uses a
dummy `DATABASE_URL`: no route queries the database at build time.

## Project Structure

```
├── app/
│   ├── page.tsx            # Marketing landing page
│   ├── login/ register/    # Auth screens
│   ├── privacy/ terms/     # Legal pages
│   ├── dashboard/          # Workspace overview
│   ├── workflows/          # Visual builder
│   ├── documents/          # Upload, OCR, summaries, Q&A
│   ├── resumes/            # Candidate screening (role-gated)
│   ├── meetings/           # Transcription and action items
│   ├── chat/               # AI assistant
│   ├── reports/ analytics/ # Generation and insights
│   ├── scheduler/          # Cron jobs
│   ├── marketplace/        # Workflow templates
│   ├── settings/           # Profile and user management
│   └── api/                # Route handlers (REST)
├── components/
│   ├── landing/            # Hero, features, pricing, contact, footer
│   ├── dashboard/          # Shell, topbar, sidebar, stat cards
│   ├── workflow/           # Canvas nodes, palette, config drawer
│   ├── motion/             # Reusable animation primitives
│   └── ui/                 # Design-system components
├── lib/
│   ├── ai/                 # Provider router with fallback
│   ├── api/                # Route-handler dependencies (Mongo/Chroma/Redis)
│   ├── auth/               # Session, roles, avatars
│   ├── db/                 # Prisma, MongoDB, ChromaDB, Redis clients
│   ├── models/mongodb/     # Mongo collection schemas (logs, traces, chats)
│   ├── workflows/          # Execution engine
│   ├── documents/          # Text extraction and OCR
│   ├── resumes/ meetings/  # Scoring and analysis
│   ├── storage/            # Supabase helpers
│   └── email/              # Brevo sender
├── prisma/                 # Schema, migrations, seed
└── public/                 # Static assets
```

## Deployment

Deploys cleanly to Vercel. Before going live:

- Set every variable from `.env.example` in your host's environment settings.
- Point `NEXTAUTH_URL` at the real HTTPS origin, or OAuth callbacks will fail.
- Add `{NEXTAUTH_URL}/api/auth/callback/google` as an authorised redirect URI in Google Cloud.
- Run `npx prisma migrate deploy` against the production database.
- Rotate the seeded admin credentials.
- Provision managed MongoDB, Redis and ChromaDB instances (or leave `MONGODB_URL` / `REDIS_URL` / `CHROMA_HOST` unset to run on Postgres alone — `/api/health` reports those as `not_configured` rather than failing).

## License & Credits

Released under the [MIT License](LICENSE).

Built with [Next.js](https://nextjs.org), [Prisma](https://prisma.io), [Supabase](https://supabase.com), [React Flow](https://reactflow.dev), [Framer Motion](https://motion.dev) and [Tailwind CSS](https://tailwindcss.com). Icons by [Lucide](https://lucide.dev).
