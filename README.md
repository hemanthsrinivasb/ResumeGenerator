# 🧠 AI Resume Builder

> 🚀 A full-stack AI-powered resume platform — generate professional resumes, score them against job descriptions, create cover letters, prep for interviews, and analyze skill gaps — all powered by **Spring AI + Ollama (DeepSeek-r1)** and a **React 18 + TailwindCSS** frontend.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| 🖥️ Backend | Spring Boot 3.4.4, Spring AI 1.0.0-M6, Spring Security 6, Spring Data JPA |
| 🤖 AI / LLM | Ollama + DeepSeek-r1 (local inference) |
| 🗄️ Database | H2 (default local) / PostgreSQL (Docker / production) |
| 🔐 Auth | JWT (JJWT 0.12.5) + BCrypt |
| 📄 API Docs | Swagger / OpenAPI (springdoc) |
| ⚛️ Frontend | React 18, Vite 6, TailwindCSS, DaisyUI |
| 📝 Forms | react-hook-form with dynamic field arrays |
| 🐳 DevOps | Docker, docker-compose, GitHub Actions CI |
| ☕ Language | Java 17 + JavaScript (ES2024) |

---

## ✨ Features

### 🤖 AI-Powered Tools
- **Resume Generation** — describe yourself in plain text → AI builds a structured resume
- **ATS Score Analyzer** — match your resume against any job description (0–100 score)
- **Cover Letter Generator** — professional cover letter from resume + JD
- **Interview Question Generator** — 20 tailored behavioral + technical questions
- **Skills Gap Analyzer** — identify missing skills with a 90-day learning roadmap
- **LinkedIn Post Generator** — announcement post + icebreaker for your target role
- **SSE Streaming** — watch your resume generate token-by-token in real time

### 👤 User Account Features
- Register / Login with JWT authentication
- Save unlimited resumes to your account
- Resume history dashboard with load, share, and delete
- Public share links — share any saved resume via a unique URL

### 🎨 Resume Templates
- **Modern** — clean, ATS-friendly, with PDF export
- **Classic** — traditional two-column layout
- **Creative** — visual, designer-style layout

### 🛠️ Developer Tools
- GitHub project import (fetches your 5 latest repos)
- JSON export / import for resume state
- Swagger UI at `/swagger-ui.html`
- Health check at `/actuator/health`
- H2 console at `/h2-console` (local dev)

---

## 📁 Project Structure

```
ResumeGenerator/
├── Resume/demo/                  ← Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/resume/backend/demo/
│   │       ├── config/           ← SecurityConfig, CorsConfig
│   │       ├── controller/       ← ResumeController, AuthController
│   │       ├── dto/              ← AuthRequest, AuthResponse, RegisterRequest
│   │       ├── model/            ← User, ResumeHistory
│   │       ├── repository/       ← UserRepository, ResumeHistoryRepository
│   │       ├── security/         ← JwtUtil, JwtAuthFilter
│   │       └── service/          ← ResumeService, ResumeServiceImpl, UserService
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── resume_prompt.txt
│   │   ├── resume_analysis_prompt.txt
│   │   ├── cover_letter_prompt.txt
│   │   ├── interview_questions_prompt.txt
│   │   ├── skills_gap_prompt.txt
│   │   └── linkedin_post_prompt.txt
│   └── Dockerfile
│
├── frontend/                     ← React + Vite Frontend
│   ├── src/
│   │   ├── api/ResumeService.js  ← All API calls + auth helpers
│   │   ├── components/
│   │   │   ├── PromptInput.jsx
│   │   │   ├── AtsCheckerModal.jsx
│   │   │   ├── CoverLetterModal.jsx
│   │   │   ├── Resume.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── templates/       ← ModernTemplate, ClassicTemplate, CreativeTemplate
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── GenerateResume.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Login.jsx
│   │       └── Register.jsx
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml            ← Full stack: Ollama + PostgreSQL + Backend + Frontend
└── .github/workflows/ci.yml     ← GitHub Actions CI
```

---

## 🚀 Quick Start — Running Locally (Recommended)

> **No Docker needed for local dev.** The backend uses H2 in-memory database by default.

### Step 1 — Start Ollama + Pull the Model

```bash
# Install Ollama from https://ollama.com/download
# Then pull the DeepSeek-r1 model (~7GB):
ollama pull deepseek-r1:latest

# Verify it's running:
ollama list
```

Ollama runs at `http://localhost:11434` by default.

---

### Step 2 — Start the Backend

```bash
cd ResumeGenerator/Resume/demo

# Windows (PowerShell / CMD):
.\mvnw.cmd spring-boot:run

# Mac / Linux:
./mvnw spring-boot:run
```

Backend starts at → **http://localhost:8050**

| URL | Description |
|---|---|
| `http://localhost:8050/swagger-ui.html` | Swagger API docs |
| `http://localhost:8050/actuator/health` | Health check |
| `http://localhost:8050/h2-console` | H2 DB browser (JDBC URL: `jdbc:h2:mem:resumedb`) |

---

### Step 3 — Start the Frontend

```bash
cd ResumeGenerator/frontend

# Install dependencies (first time only):
npm install

# Start dev server:
npm run dev
```

Frontend starts at → **http://localhost:5173**

---

## 🐳 Docker — Full Stack (Backend + Frontend + Ollama + PostgreSQL)

```bash
cd ResumeGenerator

# Build and start all services:
docker-compose up --build

# Pull the AI model inside the Ollama container (first time only):
docker exec -it resume-ollama ollama pull deepseek-r1:latest
```

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:8050 |
| Swagger UI | http://localhost:8050/swagger-ui.html |
| Ollama | http://localhost:11434 |
| PostgreSQL | localhost:5432 |

Stop everything:
```bash
docker-compose down
```

Stop and remove all data:
```bash
docker-compose down -v
```

---

## 🔐 API Reference

### Auth Endpoints (Public)

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Login → returns JWT |

### AI Endpoints (Public — no login needed)

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/v1/resume/generate` | Generate resume from description |
| `POST` | `/api/v1/resume/analyze` | ATS score against job description |
| `POST` | `/api/v1/resume/cover-letter` | Generate cover letter |
| `POST` | `/api/v1/resume/interview-questions` | Generate interview questions |
| `POST` | `/api/v1/resume/skills-gap` | Skills gap analysis + learning plan |
| `POST` | `/api/v1/resume/linkedin-post` | LinkedIn announcement post |
| `POST` | `/api/v1/resume/stream` | SSE streaming resume generation |
| `GET`  | `/api/v1/resume/share/{code}` | View a publicly shared resume |

### Protected Endpoints (JWT required)

Add header: `Authorization: Bearer <your_token>`

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/v1/resume/save` | Save resume to account |
| `GET`  | `/api/v1/resume/history` | List saved resumes |
| `GET`  | `/api/v1/resume/history/{id}` | Load a specific resume |
| `DELETE` | `/api/v1/resume/history/{id}` | Delete a saved resume |

---

## ⚙️ Environment Variables

All variables have sensible defaults for local dev. Override for production:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8050` | Backend server port |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `AI_MODEL` | `deepseek-r1:latest` | LLM model name |
| `DB_URL` | `jdbc:h2:mem:resumedb` | Database JDBC URL |
| `DB_DRIVER` | `org.h2.Driver` | JDBC driver class |
| `DB_USER` | `sa` | Database username |
| `DB_PASSWORD` | *(empty)* | Database password |
| `DB_DIALECT` | `org.hibernate.dialect.H2Dialect` | Hibernate dialect |
| `JWT_SECRET` | *(default base64 key)* | **Change this in production!** |
| `JWT_EXPIRATION` | `86400000` | JWT TTL in ms (24 hours) |

---

## 🏗️ Building for Production

### Backend JAR
```bash
cd Resume/demo
.\mvnw.cmd clean package -DskipTests    # Windows
./mvnw clean package -DskipTests        # Mac/Linux

# Output: target/resume-ai.jar
java -jar target/resume-ai.jar
```

### Frontend Static Build
```bash
cd frontend
npm run build
# Output: dist/  (serve with any static host or Nginx)
```

---

## 🧪 Running Tests

```bash
cd Resume/demo
.\mvnw.cmd test        # Windows
./mvnw test            # Mac/Linux
```

---

## 📖 See Also

- [PREREQUISITES.md](./PREREQUISITES.md) — What to install before running
- [DEPLOY.md](./DEPLOY.md) — How to deploy to Render, Railway, Vercel, and more
- [Swagger UI](http://localhost:8050/swagger-ui.html) — Interactive API explorer (when backend is running)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

*Built with ❤️ using Spring AI + DeepSeek-r1 + React 18*
