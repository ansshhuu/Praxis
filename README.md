# Praxis — Enterprise AI Automation Ecosystem

Praxis is a production-grade, multi-agent orchestration and workflow automation platform powered by Next.js, hybrid data infrastructure, and multimodal AI pipelines.

---

## Key Features

- **Multi-Agent Orchestration**: 26 specialized autonomous agents across Engineering, Operations, and Marketing with sequential and parallel execution pipelines.
- **Workflow Automation Engine**: Visual builder and marketplace with domain automation templates, conditional branching, and BullMQ queue processing.
- **Multi-Provider AI Gateway**: Dynamic routing and fallback across OpenAI, Anthropic Claude, Google Gemini, and local Ollama instances.
- **Multimodal Intelligence**: Voice AI (Whisper STT, ElevenLabs TTS) and Computer Vision / OCR pipelines (Gemini Vision, Tesseract).
- **Enterprise Guardrails & Security**: Automated PII masking, prompt injection sanitization, tenant data isolation, and Redis rate limiting.
- **Observability & Analytics**: Real-time telemetry widgets tracking token consumption, model latencies, and service health.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router), TypeScript, Tailwind CSS |
| Relational DB | PostgreSQL (Prisma ORM) |
| Document Store | MongoDB (Native Driver) |
| Vector DB | ChromaDB |
| Cache & Queues | Redis, BullMQ |
| Testing | Vitest, Playwright E2E |

---

## Getting Started

### 1. Clone & Install

```bash
git clone <YOUR_REPO_URL>
cd praxis
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in the required database strings (`DATABASE_URL`, `MONGODB_URL`, `REDIS_URL`) and AI provider API keys.

### 3. Initialize Databases

```bash
docker-compose up -d
npx prisma migrate deploy
npx prisma generate
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the platform.

---

## Testing & Verification

```bash
npm test
npm run test:e2e
npm run typecheck
npm run lint
```

---

## License

Released under the [MIT License](LICENSE).
