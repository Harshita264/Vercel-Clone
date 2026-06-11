Vercel Clone

A self-hosted deployment platform built from scratch. Push code to GitHub — it gets cloned, built into a Docker container, deployed behind a reverse proxy, and assigned a live URL. Build logs stream to the dashboard in real time.

Features


GitHub Webhook Pipeline — push to main triggers an automatic deployment via HMAC-validated webhooks
Async Job Queue — BullMQ + Redis queues builds with retry logic and exponential backoff
Docker Orchestration — clones repo, builds image, runs container with resource limits (CPU + memory caps)
Dynamic Reverse Proxy — Caddy routes <deployment-id>.localhost to the right container via its JSON Admin API — no restarts required
Real-time Log Streaming — build output streams from Docker → Redis pub/sub → SSE → browser terminal
Deployment Tracking — full lifecycle in Postgres: QUEUED → BUILDING → DEPLOYING → READY / FAILED
GitHub OAuth — login with GitHub, JWT session via localStorage
Encrypted Environment Variables — per-project env vars stored with AES-256-GCM encryption, injected into containers at runtime

Architecture

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