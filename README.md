# AI Career Intelligence Platform

> **Full-stack AI-native career OS** — resume generation, multi-agent review, RAG chatbot, voice interview room, career workflow automation, market intelligence, and multimodal analysis. Built on Spring Boot 3 + Spring AI + React 18 + OpenAI.

![Java](https://img.shields.io/badge/Java-25-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.4-6DB33F?style=flat&logo=spring-boot)
![Spring AI](https://img.shields.io/badge/Spring_AI-1.0.0--M6-6DB33F?style=flat&logo=spring)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## Platform Overview

| Capability | What It Does |
|---|---|
| **AI Resume Generation** | Prompt → structured JSON resume via OpenAI `gpt-4o-mini` (batch + SSE streaming) |
| **RAG Chatbot** | PGVector semantic search across your resume history; `text-embedding-3-small` embeddings |
| **Multi-Agent Expert Panel** | 4 concurrent AI agents: ATS optimizer, recruiter, staff engineer, career coach |
| **Voice Interview Room** | AI speaks questions (TTS), you answer via mic (MediaRecorder), emotion detection via webcam |
| **Career Workflow Engine** | Goal → 5-stage autonomous AI pipeline: gap analysis, roadmap, resume rewrite, interview prep, timeline |
| **AI Digital Twin** | Hiring simulation with shortlist probability + market readiness radial charts; 1/3/5-yr trajectory |
| **Multimodal Engine** | Audio confidence analysis (Whisper + librosa), video emotion detection (DeepFace), communication scoring |
| **GitHub Intelligence** | GitHub profile analysis → technical depth, diversity, OSS contribution scores via OpenAI |
| **Job Application Tracker** | Kanban board (5 columns) + AI resume tailoring + cover letter generation + rejection analysis |
| **Market Intelligence** | Skill demand bar charts, salary tier insights, hiring trends — all from live Remotive API + AI |
| **Portfolio Generator** | 3 themes (Minimal/Tech/Creative), downloadable ZIP, GitHub profile integration |
| **Career Analytics** | Recharts dashboard: score trends, skill gap radar, timeline |
| **Self-Improving AI** | Per-endpoint feedback collection → AI quality reports → prompt improvement recommendations |
| **DevOps** | Docker Compose (5 services) + K8s manifests + Prometheus/Grafana + GitHub Actions push to Docker Hub |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React 18 + Vite 6                             │
│  Framer Motion │ Zustand │ Recharts │ react-markdown             │
│  Pages: GenerateResume │ Interview │ AgentPanel │ Workflow        │
│         DigitalTwin │ Multimodal │ JobTracker │ MarketIntel       │
│         Portfolio │ Analytics │ AIHealth                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST + SSE (EventSource)
┌────────────────────────▼────────────────────────────────────────┐
│              Spring Boot 3.4.4  (port 8050)                      │
│  ResumeController  AgentController  InterviewController           │
│  WorkflowController CareerTwinController MultimodalController     │
│  JobApplicationController MarketIntelligenceController            │
│  FeedbackController PortfolioController AnalyticsController       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Spring AI 1.0.0-M6 ChatClient                  │   │
│  │  AgentOrchestrator │ WorkflowService │ CareerTwinService  │   │
│  │  MockInterviewService │ MarketIntelligenceService         │   │
│  │  JobApplicationService │ PromptEvaluationService          │   │
│  └────────────┬──────────────────────┬───────────────────────┘  │
│  ┌────────────▼───────────┐  ┌───────────▼──────────────────────┐  │
│  │  OpenAI API            │  │  PGVector (Spring AI Store)      │  │
│  │  gpt-4o-mini (chat)    │  │  text-embedding-3-small          │  │
│  └────────────────────────┘  └──────────────────────────────────┘  │
└───────────────────┬──────────────────────────────────────────────┘
        │           │
┌───────▼──────┐ ┌──▼───────────────────┐ ┌──────────────┐
│multimodal-   │ │  PostgreSQL 16        │ │  Redis 7     │
│service(8070) │ │  (pgvector image)     │ │  (cache)     │
│Python FastAPI│ └──────────────────────┘ └──────────────┘
│Whisper+DeepFace│
│librosa+OpenAI  │
└──────────────┘
```

---

## Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Backend | Spring Boot | 3.4.4 | Java 25, Maven |
| AI | Spring AI | 1.0.0-M6 | ChatClient.Builder pattern |
| LLM | OpenAI API | — | `gpt-4o-mini` (configurable via `AI_MODEL`) |
| Embedding | OpenAI API | — | `text-embedding-3-small` (1536-dim) |
| Vector Store | Spring AI PGVector | 1.0.0-M6 | Falls back to H2 when RAG disabled |
| Database | PostgreSQL 16 | pgvector image | H2 for local dev |
| Cache | Redis | 7-alpine | Resume history caching |
| Python ML Service | FastAPI | 0.111.0 | Whisper, DeepFace, librosa |
| Frontend | React | 18 | Vite 6 |
| Styling | TailwindCSS + DaisyUI | latest | Theme: dark/light toggle |
| Animation | Framer Motion | latest | AnimatePresence transitions |
| Charts | Recharts | latest | RadialBar, Bar, Line, Radar |
| Auth | JWT + BCrypt | — | Spring Security 6 dual filter chain |
| DevOps | Docker Compose | v3.9 | 5-service stack |
| K8s | Kubernetes manifests | v1 | namespace + 5 deployments + ingress |
| Monitoring | Prometheus + Grafana | latest | /actuator/prometheus scrape |
| CI/CD | GitHub Actions | — | Build + Docker Hub push on main |

---

## AI Features

### Resume Generation + Streaming
- **POST /api/v1/resume/generate** — prompt → full resume JSON via OpenAI `gpt-4o-mini`
- **GET /api/v1/resume/stream** — SSE streaming with live token output
- Voice input: browser `SpeechRecognition` API + mic button in textarea
- Resume saved to DB → browsable history in Dashboard

### RAG Chatbot
- `EmbeddingService` chunks resume into 7 semantic sections, embeds with `text-embedding-3-small`
- Cosine similarity retrieval from PGVector; graceful H2 fallback when `APP_RAG_ENABLED=false`
- Floating `ChatPanel` with SSE streaming + react-markdown rendering

### Multi-Agent Expert Panel
- `AgentOrchestrator`: 4 `CompletableFuture.supplyAsync()` parallel agents
- Agents: ATS Optimizer, Senior Recruiter, Staff Engineer, Career Coach
- `FeedbackWidget` on each card for AI quality tracking

### Voice Interview Room
- AI speaks each question via `SpeechSynthesis` (rate/voice configurable)
- User answers via `MediaRecorder` audio capture → uploaded to `/api/v1/multimodal/audio-analyze`
- Whisper transcription fills answer textarea; audio metrics (speech rate, hesitation count, confidence) injected into AI evaluator prompt
- Optional webcam emotion detection via `getUserMedia` → canvas frame → DeepFace every 5s
- Waveform animation during recording; per-answer voice metrics card in evaluation

### Career Workflow Engine
- User states a 6-month career goal → 5 sequential AI calls: Gap Analysis → Learning Roadmap → Resume Rewrite → Interview Prep → Master Timeline
- 5-step animated progress bar; results in collapsible accordion sections
- Session history persisted in `WorkflowSession` entity

### AI Digital Twin
- Hiring Simulation: shortlistProbability, marketReadiness, strengths, gaps, salary estimate, hiring decision
- Career Trajectory: 1yr / 3yr / 5yr projected role + salary + skills
- `RadialBarChart` gauges; 3-column timeline cards

### Multimodal Engine
- GitHub Analysis: GitHub REST API → top repos → OpenAI → technical depth, code diversity, OSS score
- Audio Analysis: Whisper transcription + librosa speech rate / hesitation / confidence heuristic
- Video Emotion: DeepFace per-frame (dominant + per-emotion confidence bars)
- Communication Scoring: OpenAI clarity, professionalism, technical depth, overall

### Job Application Tracker
- Kanban board: Saved → Applied → Interview → Offer → Rejected
- AI tailor resume to job description (ATS keyword injection)
- AI cover letter (personalized 3-paragraph format)
- AI rejection analysis: likely reasons, skill gaps, improvement actions

### Market Intelligence
- Skill demand: live Remotive API (40 job descriptions) → AI extracts top 15 skills with frequency + trend
- Salary insights: AI estimates Junior/Mid/Senior ranges, growth rate, demand level
- Hiring trends: macro analysis across 60 postings → growing/declining roles, emerging tech, remote ratio

### Self-Improving AI
- `FeedbackWidget` component (compact + full mode) on all AI result screens
- 1–5 star rating + optional comment + AI response snippet stored per endpoint
- AI analyzes last 20 feedbacks per endpoint → common praise, complaints, prompt improvements
- System health dashboard at `/ai-health`

---

## API Reference

### Resume
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/resume/generate` | Generate resume from description |
| GET | `/api/v1/resume/stream?description=` | SSE streaming generation |
| GET | `/api/v1/resume/history` | User's saved resumes |
| POST | `/api/v1/resume/save` | Save/update resume |

### Agents
```bash
curl -X POST http://localhost:8050/api/v1/agents/panel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Review my resume for FAANG", "resumeId": 1}'
```

### Interview
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/interview/sessions` | Start session |
| POST | `/api/v1/interview/sessions/{id}/answer` | Submit answer + optional audioAnalysis JSON |
| POST | `/api/v1/interview/sessions/{id}/end` | End early |

### Workflow / Digital Twin / Market
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/workflow/create` | Create career workflow |
| POST | `/api/v1/career-twin/simulate` | Hiring simulation |
| POST | `/api/v1/career-twin/trajectory` | Career trajectory |
| GET | `/api/v1/market/skills?role=` | Skill demand |
| GET | `/api/v1/market/salary?role=&location=` | Salary insights |
| GET | `/api/v1/market/trends` | Global hiring trends |

### Multimodal
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/multimodal/audio-analyze` | Audio → transcript + speech metrics |
| POST | `/api/v1/multimodal/video-frame` | Image frame → emotion detection |
| POST | `/api/v1/multimodal/github-analyze` | GitHub username → technical scores |
| POST | `/api/v1/multimodal/communication` | Transcript → communication scores |

---

## Project Structure

```
ResumeGenerator/
├── Resume/demo/                        # Spring Boot backend
│   └── src/main/java/com/resume/backend/demo/
│       ├── controller/                 # 11 REST controllers
│       ├── service/                    # 12 AI + business services
│       ├── model/                      # 8 JPA entities
│       └── repository/                 # 8 Spring Data repositories
├── frontend/                           # React 18 + Vite
│   └── src/
│       ├── pages/                      # 12 pages
│       └── components/                 # FeedbackWidget, ChatPanel, PromptInput, Navbar
├── multimodal-service/                 # Python FastAPI
│   ├── main.py                         # Whisper + DeepFace + librosa + OpenAI SDK
│   ├── requirements.txt
│   └── Dockerfile
├── k8s/                                # Kubernetes manifests
│   ├── namespace.yaml
│   ├── postgres-deployment.yaml
│   ├── backend-deployment.yaml         # includes openai-secret ref
│   ├── frontend-deployment.yaml
│   └── ingress.yaml
├── prometheus/prometheus.yml           # Prometheus scrape config
├── docker-compose.yml                  # 5-service local stack
├── docker-compose.monitoring.yml       # Prometheus + Grafana overlay
└── .github/workflows/ci.yml           # Build + Docker Hub push
```

---

## Prerequisites

### OpenAI API Key

This project uses the **OpenAI API** (`gpt-4o-mini` by default) for all AI features — resume generation, agents, interview, workflow, career twin, market intelligence, and multimodal communication analysis.

**Step 1 — Get an API key**

1. Go to [platform.openai.com](https://platform.openai.com) and sign up / log in
2. Navigate to **API Keys** → click **Create new secret key**
3. Copy the key (starts with `sk-...`) — you won't see it again

**Step 2 — Fund your account** (required for API calls)

- Add a payment method under **Billing → Add payment method**
- `gpt-4o-mini` costs **~$0.15 per 1M input tokens** — a full development session typically costs a few cents
- Optionally set a monthly usage limit under **Billing → Usage limits**

**Step 3 — Set the environment variable**

```bash
# macOS / Linux
export OPENAI_API_KEY=sk-...

# Windows PowerShell
$env:OPENAI_API_KEY = "sk-..."

# Windows CMD
set OPENAI_API_KEY=sk-...
```

> **Tip:** Add the `export` line to your `~/.zshrc` or `~/.bashrc` so it persists across terminal sessions.

---

## Quick Start

### Path A — Local H2 (minimal setup — just Java + Node + an API key)

```bash
# 1. Set your OpenAI API key (see Prerequisites above)
export OPENAI_API_KEY=sk-...

# 2. Start backend (H2 in-memory, RAG disabled by default — no PostgreSQL needed)
cd Resume/demo
./mvnw spring-boot:run

# 3. Start frontend (new terminal)
cd frontend
npm install && npm run dev
```

Open http://localhost:5173 — register, generate a resume, explore all features.

> RAG chatbot is disabled in Path A (requires PostgreSQL + pgvector). All other AI features work fully.

### Path B — Full Docker stack (5 services + Redis + RAG enabled)

**Step 1 — Create a `.env` file** in the project root:

```bash
# .env
OPENAI_API_KEY=sk-...
```

**Step 2 — Start all services:**

```bash
docker compose up -d
```

That's it — no model pulling required. The OpenAI API is called over HTTPS; no local GPU or Ollama needed.

**Step 3 (optional) — Add monitoring:**

```bash
# Prometheus + Grafana
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:8050 |
| Swagger UI | http://localhost:8050/swagger-ui.html |
| Multimodal Service | http://localhost:8070/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (admin/admin) |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| **`OPENAI_API_KEY`** | *(required)* | Your OpenAI secret key — get it at platform.openai.com |
| `AI_MODEL` | `gpt-4o-mini` | OpenAI chat model (e.g. `gpt-4o`, `gpt-4o-mini`) |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model for RAG |
| `APP_RAG_ENABLED` | `false` | Enable PGVector RAG (requires PostgreSQL) |
| `DB_URL` | H2 in-memory | PostgreSQL JDBC URL in production |
| `DB_USER` / `DB_PASSWORD` | `sa` / empty | Database credentials |
| `JWT_SECRET` | base64 key | HMAC-SHA256 signing key |
| `JWT_EXPIRATION` | `86400000` | Token TTL in milliseconds (24h) |
| `MULTIMODAL_SERVICE_URL` | `http://localhost:8070` | Python FastAPI microservice URL |
| `GITHUB_TOKEN` | empty | Optional — increases GitHub API rate limit |
| `DOCKER_USERNAME` | — | GitHub Actions secret for Docker Hub push |
| `DOCKER_PASSWORD` | — | GitHub Actions secret for Docker Hub push |

> **GitHub Actions:** Add `OPENAI_API_KEY` as a repository secret under **Settings → Secrets and variables → Actions** so CI tests can start the application context.

---

## Why This Project

This platform demonstrates production-grade AI application architecture: OpenAI API integration via Spring AI's provider-agnostic `ChatClient`, retrieval-augmented generation with PGVector and `text-embedding-3-small`, real-time SSE streaming, a Python ML microservice (Whisper, DeepFace, librosa, OpenAI SDK) integrated via REST, voice and video multimodal processing in the browser, Spring Security 6 JWT authentication, and Kubernetes-ready deployment with Prometheus observability. Every AI feature uses structured prompting with deterministic output parsing — no hallucination-prone free-form responses.
