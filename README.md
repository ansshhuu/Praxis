# EAWMP — Enterprise AI Automation & Workflow Management Platform

No-code AI automation platform for enterprise teams.

## Features
- Dashboard: Real-time pipeline status, credits tracker, execution telemetry.
- Workflows: Visual drag-and-drop workflow builder using Node catalogs.
- Documents: Ingest files with OCR extraction, summaries, and Q&A chat.
- Resumes: Automatic candidate screening, scoring, and question generation.
- Reports: Multi-format document generation for compliance and operations.
- Chat: Centralized AI assistant querying active workspace context.
- Marketplace: Pre-built automated workflow templates ready for deployment.
- Notifications: Log history and delivery settings for Slack, SMS, and email.
- Scheduler: Granular cron-scheduled automation jobs triggers and management.
- Analytics: Time-series charts covering latency, storage, and API count.
- Settings: Profile config, mock API keys, and admin role assignments.
- Identity: Secure administrative sign-in panel with validation checks.
- Workflow Builder Drawer: Node configuration drawer for parameter settings.
- Candidate Detail Drawer: Deep-dive view of match scores and custom questions.
- OCR Extracted Panel: Dedicated side-by-side view for document processing text.

## Tech Stack
Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, React Flow
Backend: Next.js API routes, Prisma
Database: PostgreSQL (Supabase)
AI: Google Gemini API (primary), Hugging Face Inference API (fallback)
Auth: NextAuth.js

## Getting Started
```bash
git clone <repo-url>
cd eawmp
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Project Structure
```
├── app/                  # Route handlers & page components
│   ├── (auth)/login/     # Admin sign-in route
│   ├── analytics/        # Recharts analytics dashboards
│   └── chat/             # LLM Chat interface
├── components/           # Core React design system components
│   ├── dashboard/        # Sidebar, topbar, shell framework
│   └── workflow/         # Canvas node components & configuration
├── lib/                  # Shared utilities & mock backend endpoints
└── prisma/               # Database models and migrations
```

## Status
UI complete, backend/AI integration in progress.
