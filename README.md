# Praxis

Intelligent, no-code AI workflow automation for enterprise teams — build pipelines on a visual canvas, extract meaning from documents, screen candidates, and query your workspace in plain language.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)

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
| Storage | Supabase Storage (private buckets, served through authenticated routes) |
| Auth | NextAuth 4 — credentials + Google OAuth, JWT sessions |
| AI | Google Gemini (primary) with Hugging Face Inference fallback; Whisper for audio |
| Documents | `pdf-parse`, `mammoth`, `xlsx`, `tesseract.js`, `pdf-lib`, `docx` |
| Email | Brevo transactional API |

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

`DATABASE_URL`, `NEXTAUTH_SECRET` and at least one AI key are required to boot. Supabase keys are required for anything that uploads files, and Brevo keys for outbound email. Every variable is documented inline in [`.env.example`](.env.example).

Generate a session secret with:

```bash
openssl rand -base64 32
```

### Database

Apply migrations and seed a starter admin plus the marketplace templates:

```bash
npx prisma migrate dev
npm run seed
```

The seed creates `admin@company.com` / `Admin@123`. **Change or remove this before deploying anywhere public.**

Create three **private** storage buckets in Supabase: `documents`, `meetings` and `avatars`.

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
│   ├── auth/               # Session, roles, avatars
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

## License & Credits

Released under the [MIT License](LICENSE).

Built with [Next.js](https://nextjs.org), [Prisma](https://prisma.io), [Supabase](https://supabase.com), [React Flow](https://reactflow.dev), [Framer Motion](https://motion.dev) and [Tailwind CSS](https://tailwindcss.com). Icons by [Lucide](https://lucide.dev).
