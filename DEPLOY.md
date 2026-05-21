# 🚀 Deployment Guide

How to deploy the AI Resume Builder to the internet — frontend, backend, and database.

---

## 🗺️ Deployment Architecture Overview

```
Users (Browser)
     │
     ▼
[Frontend — Vercel / Netlify]  ←── serves React SPA
     │ API calls (HTTPS)
     ▼
[Backend — Render / Railway]   ←── Spring Boot REST API
     │
     ├── [Ollama Cloud / Groq]  ←── LLM inference (cloud)
     └── [PostgreSQL — Neon / Railway DB / Render DB]
```

> 💡 **The key challenge:** Ollama runs locally but cannot run on free cloud tiers (needs GPU / RAM). For cloud deployment, switch to an OpenAI-compatible API (Groq is free, OpenAI is paid).

---

## 🔧 Pre-Deployment: Switch from Ollama to Cloud LLM

Before deploying, update `application.properties` to use a cloud provider.

### Option A — Groq (Free, Fast, Recommended)

Groq has a free tier and is compatible with the OpenAI API format.

1. Sign up at https://console.groq.com
2. Create an API key
3. Add the Spring AI OpenAI dependency to `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
</dependency>
```

4. Update `application.properties`:

```properties
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.base-url=https://api.groq.com/openai
spring.ai.openai.chat.options.model=llama-3.3-70b-versatile
```

### Option B — OpenAI

1. Sign up at https://platform.openai.com
2. Create an API key
3. Same dependency as Option A, but use:
```properties
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.options.model=gpt-4o-mini
```

---

## 🌐 Frontend Deployment

### Recommended: Vercel (Free)

Vercel is the easiest option for React + Vite projects.

**Step 1 — Update the API base URL**

In `frontend/src/api/ResumeService.js`, change the base URL to your backend's deployed URL:
```js
export const baseURLL = "https://your-backend-name.onrender.com";
```

Or use an environment variable — create `frontend/.env.production`:
```
VITE_API_URL=https://your-backend-name.onrender.com
```

Then in `ResumeService.js`:
```js
export const baseURLL = import.meta.env.VITE_API_URL || "http://localhost:8050";
```

**Step 2 — Deploy to Vercel**

```bash
# Install Vercel CLI:
npm install -g vercel

# From the frontend/ directory:
cd frontend
vercel

# Follow prompts:
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

Or connect via GitHub: https://vercel.com/new → import your repository → set root directory to `frontend/`.

**Vercel Settings:**
| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

---

### Alternative: Netlify (Free)

```bash
cd frontend
npm run build

# Drag and drop the dist/ folder at https://app.netlify.com/drop
```

Or via Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

Add `frontend/public/_redirects` for React Router:
```
/*  /index.html  200
```

---

## ☁️ Backend Deployment

### Recommended: Render (Free Tier Available)

Render can deploy Java Spring Boot apps from a GitHub repo or a Docker image.

**Step 1 — Set up PostgreSQL on Render**

1. Go to https://render.com → New → PostgreSQL
2. Name: `resume-db`
3. Plan: Free
4. Copy the **Internal Database URL** (format: `postgresql://user:pass@host/db`)

**Step 2 — Deploy Backend as Web Service**

1. New → Web Service → Connect your GitHub repo
2. Settings:
   | Setting | Value |
   |---|---|
   | Name | `resume-ai-backend` |
   | Region | Pick closest to you |
   | Root Directory | `Resume/demo` |
   | Runtime | Docker |
   | Dockerfile path | `./Dockerfile` |

3. **Build command** (if not using Docker):
   ```
   ./mvnw clean package -DskipTests
   ```
4. **Start command** (if not using Docker):
   ```
   java -jar target/resume-ai.jar
   ```

**Step 3 — Environment Variables on Render**

Set these in the Render dashboard → Environment:

```
DB_URL=jdbc:postgresql://<render-postgres-host>/<db-name>
DB_DRIVER=org.postgresql.Driver
DB_USER=<render-postgres-user>
DB_PASSWORD=<render-postgres-password>
DB_DIALECT=org.hibernate.dialect.PostgreSQLDialect
JWT_SECRET=<generate-with: openssl rand -base64 64>
JWT_EXPIRATION=86400000
OPENAI_API_KEY=<your-groq-or-openai-key>
AI_MODEL=llama-3.3-70b-versatile
PORT=8050
```

**Step 4 — Update CORS in CorsConfig.java**

Add your Vercel URL to the allowed origins:
```java
config.setAllowedOriginPatterns(List.of(
    "http://localhost:5173",
    "https://your-app.vercel.app",
    "https://yourdomain.com"
));
```

---

### Alternative: Railway (Free Starter Plan)

Railway is simpler to set up — it auto-detects Spring Boot.

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo → set root directory to `Resume/demo`
3. Railway auto-detects Java/Maven — it will run `./mvnw package` then `java -jar`
4. Add a PostgreSQL plugin: `+ New → Database → PostgreSQL`
5. Railway auto-sets `DATABASE_URL` — map it to your `DB_URL` variable
6. Set all environment variables in the Railway Variables tab

```
DB_URL=${{Postgres.DATABASE_URL}}
DB_DRIVER=org.postgresql.Driver
DB_DIALECT=org.hibernate.dialect.PostgreSQLDialect
JWT_SECRET=<your-secret>
OPENAI_API_KEY=<your-key>
```

---

## 🐳 Full Docker Deployment on a VPS (DigitalOcean / AWS EC2 / Hetzner)

If you have a VPS with enough RAM (8 GB+ for Ollama), you can run the full docker-compose stack.

**Step 1 — Provision a server**
- DigitalOcean Droplet: 4 vCPU + 8 GB RAM (~$48/month)
- Hetzner CX31: 2 vCPU + 8 GB RAM (~€12/month) — best value
- AWS EC2 t3.large: 2 vCPU + 8 GB RAM

**Step 2 — Install Docker on the server**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**Step 3 — Clone the repo**
```bash
git clone https://github.com/your-username/ResumeGenerator.git
cd ResumeGenerator
```

**Step 4 — Update production secrets**

Edit `docker-compose.yml` — change:
```yaml
JWT_SECRET: <generate-secure-key>
POSTGRES_PASSWORD: <strong-password>
```

**Step 5 — Start everything**
```bash
docker-compose up -d --build

# Pull the AI model (first time only):
docker exec -it resume-ollama ollama pull deepseek-r1:latest
```

**Step 6 — Set up Nginx reverse proxy + SSL (optional but recommended)**
```bash
apt install nginx certbot python3-certbot-nginx

# Create /etc/nginx/sites-available/resume-app:
server {
    server_name yourdomain.com;
    location / { proxy_pass http://localhost:80; }
    location /api/ { proxy_pass http://localhost:8050; }
}

# Enable SSL:
certbot --nginx -d yourdomain.com
```

---

## 🗄️ Database Options for Production

| Provider | Free Tier | Notes |
|---|---|---|
| **Neon** (PostgreSQL) | ✅ 0.5 GB free | Serverless, fastest setup |
| **Render PostgreSQL** | ✅ Free (expires in 90 days) | Simple, works great with Render backend |
| **Railway PostgreSQL** | ✅ 100 hours/month free | Best for Railway backend |
| **Supabase** | ✅ 500 MB free | Includes dashboard, auth extras |
| **PlanetScale** | MySQL only | Good alternative if Postgres not needed |

### Connecting Neon to your backend:

1. Sign up at https://neon.tech
2. Create a project → copy the connection string
3. Format: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
4. Set as `DB_URL` environment variable

---

## 🔒 Production Security Checklist

Before going live, make sure:

- [ ] `JWT_SECRET` is a randomly generated 64+ byte base64 string
- [ ] `DB_PASSWORD` is a strong unique password
- [ ] `spring.h2.console.enabled=false` in production
- [ ] `spring.jpa.show-sql=false` in production
- [ ] CORS `allowedOriginPatterns` only includes your actual frontend domain
- [ ] HTTPS is enabled (via Render/Railway auto-SSL or Nginx + Let's Encrypt)
- [ ] `OPENAI_API_KEY` (or Groq key) is set as a secret, not committed to git
- [ ] Add your project to `.gitignore`: `.env`, `*.jar`, `target/`, `node_modules/`, `dist/`

---

## 📊 Deployment Cost Summary

| Setup | Cost | LLM | Database |
|---|---|---|---|
| Vercel (frontend) + Render (backend) + Neon (DB) + Groq | **$0/month** | Groq free tier | Neon free |
| Vercel + Railway + Railway DB + Groq | **$0/month** | Groq free | Railway free |
| VPS (Hetzner CX31) + Docker + Ollama | **~€12/month** | Local (free) | PostgreSQL in Docker |
| AWS/GCP full stack | $50–$200/month | AWS Bedrock / OpenAI | RDS |

> 💡 **Recommended for portfolio:** Vercel (frontend) + Render (backend) + Neon (database) + Groq (AI) = **completely free**, publicly accessible, and zero maintenance.

---

## 🔗 Useful Links

| Resource | URL |
|---|---|
| Vercel | https://vercel.com |
| Render | https://render.com |
| Railway | https://railway.app |
| Neon (PostgreSQL) | https://neon.tech |
| Groq (free LLM API) | https://console.groq.com |
| OpenAI | https://platform.openai.com |
| Hetzner VPS | https://www.hetzner.com/cloud |
| Ollama | https://ollama.com |
| Docker Hub | https://hub.docker.com |
