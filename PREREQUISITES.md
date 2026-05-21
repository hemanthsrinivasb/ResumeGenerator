# 📋 Prerequisites

Everything you need to install and configure before running the AI Resume Builder.

---

## 🖥️ Option A — Local Development (No Docker)

This is the recommended way to run the project for development.

---

### 1. 🟤 Java 17+

The backend requires **Java 17 or higher** (Java 21 LTS also works).

**Windows:**
```powershell
# Download from https://adoptium.net (Temurin JDK 17)
# Or via Winget:
winget install EclipseAdoptium.Temurin.17.JDK
```

**Verify:**
```bash
java -version
# Expected: openjdk version "17.x.x" or "21.x.x"
```

---

### 2. 📦 Maven (optional — project includes Maven Wrapper)

The project ships with `mvnw` / `mvnw.cmd` — you don't need Maven installed globally. But if you want it globally:

**Windows:**
```powershell
winget install Apache.Maven
```

**Verify:**
```bash
mvn -version
# Expected: Apache Maven 3.x.x
```

---

### 3. 🤖 Ollama (Local LLM runtime)

Ollama runs Large Language Models locally on your machine.

**Download:** https://ollama.com/download

- Windows: Download `.exe` installer
- Mac: `brew install ollama`
- Linux: `curl -fsSL https://ollama.com/install.sh | sh`

**After installing, pull the DeepSeek-r1 model (~7 GB):**
```bash
ollama pull deepseek-r1:latest
```

**Start Ollama (runs automatically on Windows/Mac after install):**
```bash
ollama serve
# Runs at http://localhost:11434
```

**Verify:**
```bash
curl http://localhost:11434
# Expected: "Ollama is running"
```

> ⚠️ **Hardware requirement:** DeepSeek-r1 requires at least **8 GB RAM**. For CPU-only inference, allow 30–90 seconds per response. A GPU (NVIDIA/AMD) makes it much faster.

**Alternative smaller model (if RAM is limited):**
```bash
ollama pull deepseek-r1:1.5b   # ~1 GB, faster but less accurate
# Update application.properties:
# spring.ai.ollama.chat.model=deepseek-r1:1.5b
```

---

### 4. 🟩 Node.js 18+ and npm

Required for the React frontend.

**Download:** https://nodejs.org (LTS version recommended)

**Windows via Winget:**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Verify:**
```bash
node -version    # Expected: v18.x.x or v20.x.x
npm -version     # Expected: 9.x.x or 10.x.x
```

---

### ✅ Local Dev Checklist

| Tool | Required | Notes |
|---|---|---|
| Java 17+ | ✅ Required | Java 21 also works |
| Node.js 18+ | ✅ Required | For frontend |
| Ollama | ✅ Required | Must be running before starting backend |
| DeepSeek-r1 model | ✅ Required | Pull once: `ollama pull deepseek-r1:latest` |
| Maven | ⚡ Optional | `mvnw` wrapper is included |
| PostgreSQL | ❌ Not needed | H2 in-memory DB is used by default |
| Docker | ❌ Not needed | Only needed for Docker setup |

---

## 🐳 Option B — Docker Compose (Full Stack)

Docker handles everything — database, Ollama, backend, and frontend in containers.

---

### 1. 🐳 Docker Desktop

**Download:** https://www.docker.com/products/docker-desktop/

- Windows / Mac: Install Docker Desktop
- Linux: Install Docker Engine + docker-compose plugin

**Verify:**
```bash
docker --version           # Expected: Docker version 24.x or 25.x+
docker compose version     # Expected: Docker Compose version v2.x
```

> ⚠️ On Windows, Docker Desktop requires WSL 2 (Windows Subsystem for Linux). Docker Desktop will prompt you to install it if needed.

---

### 2. ⚠️ GPU Support for Ollama (Optional but Recommended)

By default, Docker runs Ollama on CPU (slow). To enable GPU acceleration:

**NVIDIA GPU:**
```bash
# Install NVIDIA Container Toolkit:
# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html

# Then uncomment the deploy.resources section in docker-compose.yml
```

**Without GPU:** CPU inference still works but takes 60–120 seconds per resume.

---

### ✅ Docker Checklist

| Tool | Required | Notes |
|---|---|---|
| Docker Desktop | ✅ Required | v24+ |
| WSL 2 (Windows only) | ✅ Required | Docker Desktop installs it |
| NVIDIA Container Toolkit | ⚡ Optional | GPU acceleration for Ollama |
| Java | ❌ Not needed | Runs inside Docker |
| Node.js | ❌ Not needed | Runs inside Docker |
| Ollama (local) | ❌ Not needed | Runs as Docker service |

---

## 🔑 First-Time Setup Notes

### H2 Console (local dev)
When running locally, the H2 browser console is available at:
```
http://localhost:8050/h2-console
JDBC URL:  jdbc:h2:mem:resumedb
Username:  sa
Password:  (leave empty)
```

### JWT Secret
The default JWT secret works for local development. **For production, always set your own:**
```bash
# Generate a secure base64 secret:
openssl rand -base64 64
# Set it as environment variable: JWT_SECRET=<your-generated-secret>
```

### First Ollama Model Pull
The first time you pull a model it downloads several GB. This only happens once — subsequent runs use the cached model.
```bash
ollama pull deepseek-r1:latest   # ~7 GB download
```

### Port Reference

| Service | Port | URL |
|---|---|---|
| Backend API | 8050 | http://localhost:8050 |
| Frontend (dev) | 5173 | http://localhost:5173 |
| Frontend (Docker) | 80 | http://localhost |
| Ollama | 11434 | http://localhost:11434 |
| H2 Console | 8050 | http://localhost:8050/h2-console |
| PostgreSQL (Docker) | 5432 | localhost:5432 |
| Swagger UI | 8050 | http://localhost:8050/swagger-ui.html |

---

## 🛠️ IDE Recommendations

| IDE | Setup |
|---|---|
| **IntelliJ IDEA** (recommended) | Open `Resume/demo` as Maven project. Enable annotation processing for Lombok. |
| **VS Code** | Install "Extension Pack for Java" + "Spring Boot Extension Pack". Open frontend folder separately. |
| **Eclipse** | Import as Maven project. Install Lombok Eclipse agent. |

### Lombok Setup in IntelliJ
1. `File → Settings → Build → Compiler → Annotation Processors`
2. ✅ Enable annotation processing
3. Install the Lombok plugin: `Plugins → search "Lombok"`

---

## 🆘 Common Issues

| Problem | Solution |
|---|---|
| `Connection refused` on port 11434 | Ollama is not running. Run `ollama serve` |
| `Model not found` error | Pull the model first: `ollama pull deepseek-r1:latest` |
| Backend starts but AI calls timeout | Ollama is running but model isn't loaded. Send one request to warm it up |
| `java.lang.UnsupportedClassVersionError` | Wrong Java version. Ensure Java 17+ is active: `java -version` |
| Frontend blank page | Run `npm install` in the `frontend/` directory first |
| `401 Unauthorized` on save/history endpoints | These require JWT. Login first at `/login` |
| H2 Console not accessible | Spring Security frame options — disable your browser's X-Frame-Options restriction, or use the in-app H2 console link |
