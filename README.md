# ▲ Vercel Clone

A self-hosted deployment platform built from scratch. Push code to GitHub — it gets cloned, built into a Docker container, deployed behind a reverse proxy, and assigned a live URL. Build logs stream to the dashboard in real time.

![Dashboard Screenshot](./docs/dashboard.png)



## Features

- **GitHub Webhook Pipeline** — push to main triggers an automatic deployment via HMAC-validated webhooks
- **Async Job Queue** — BullMQ + Redis queues builds with retry logic and exponential backoff
- **Docker Orchestration** — clones repo, builds image, runs container with resource limits (CPU + memory caps)
- **Dynamic Reverse Proxy** — Caddy routes `<deployment-id>.localhost` to the right container via its JSON Admin API — no restarts required
- **Real-time Log Streaming** — build output streams from Docker → Redis pub/sub → SSE → browser terminal
- **Deployment Tracking** — full lifecycle in Postgres: `QUEUED → BUILDING → DEPLOYING → READY / FAILED`
- **GitHub OAuth** — login with GitHub, JWT session via localStorage
- **Encrypted Environment Variables** — per-project env vars stored with AES-256-GCM encryption, injected into containers at runtime


## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        User                             │
│         git push          dashboard        preview URL  │
└────────┬──────────────────────┬──────────────┬──────────┘
         │                      │              │
         ▼                      ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                   Platform Core (Node.js)               │
│                                                         │
│  GitHub Webhook  →  BullMQ Queue  →  Build Worker       │
│  (HMAC-SHA256)      (Redis)          (clone + docker)   │
│                                                         │
│  Postgres                Redis pub/sub                  │
│  (deployments,           (log streaming)                │
│   projects, env vars)                                   │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Runtime (Linux)                       │
│                                                         │
│  Caddy Reverse Proxy  →  Docker Containers              │
│  (dynamic routing,       (one per deployment,           │
│   wildcard TLS)           isolated networking)          │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack
```
| Layer | Technology |
|---|---|
| API Server | Node.js, Express, TypeScript |
| Build Worker | Node.js, TypeScript, simple-git |
| Dashboard | React, Vite, TypeScript, TailwindCSS |
| Job Queue | BullMQ, Redis |
| Database | PostgreSQL, Prisma ORM |
| Containers | Docker |
| Reverse Proxy | Caddy (JSON Admin API) |
| Auth | GitHub OAuth, JWT |
| Encryption | AES-256-GCM (Node.js crypto) |
| Monorepo | npm workspaces |
```

## How It Works

### Deployment Pipeline

1. User pushes to GitHub → webhook fires to `/webhook/github`
2. API validates HMAC-SHA256 signature, creates a `Deployment` record in Postgres (status: `QUEUED`)
3. `BuildJob` is enqueued onto Redis via BullMQ
4. Build worker picks up the job:
   - Clones repo with `--depth=1` into a temp directory
   - Runs `docker build` — streams every log line to Redis pub/sub
   - Runs `docker run` with resource limits and env vars injected
   - Calls Caddy's Admin API to register `<deployment-id>.localhost → container port`
   - Updates deployment status to `READY` with the live URL
5. Dashboard receives log lines via SSE, updates status badge via polling

### Real-time Log Streaming

```
docker build stdout/stderr
        ↓
   Redis pub/sub (channel: logs:<deploymentId>)
        ↓
   API SSE endpoint (/deployments/:id/logs)
        ↓
   Browser EventSource → LogTerminal component
```

### Auth Flow

```
Browser → GET /auth/github → GitHub OAuth → callback
       → exchange code for token → fetch GitHub user
       → upsert User in Postgres → sign JWT
       → redirect to dashboard with token in URL
       → stored in localStorage → sent as Bearer header
```

## Key Learning Outcomes

Building this project covers:

**Backend Engineering**
- Webhook receiver with cryptographic request validation
- Async job processing with queues, retries, and backoff
- Real-time data streaming with Redis pub/sub and SSE
- OAuth 2.0 implementation from scratch
- Symmetric encryption for secrets at rest

**DevOps & Infrastructure**
- Docker image building and container lifecycle management
- Dynamic reverse proxy configuration without restarts
- Resource isolation per deployment (CPU + memory limits)
- Process management with PM2

**Full-Stack**
- Monorepo architecture with shared types across services
- React dashboard with real-time updates
- Database schema design with Prisma migrations


## Screenshots

| Deployments List | Live Build Logs |
|---|---|
| ![Deployments](./docs/deployments.png) | ![Logs](./docs/logs.png) |


## What's Next / Roadmap

- [ ] Real GitHub webhook integration (currently requires manual curl)
- [ ] Framework auto-detection (Next.js, Vite, CRA)
- [ ] Custom domain support per deployment
- [ ] Team/organization support
- [ ] Deployment rollbacks
- [ ] Resource usage metrics per container


## License

MIT