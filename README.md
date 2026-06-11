# ▲ Vercel Clone

A self-hosted deployment platform built from scratch. Push code to GitHub — it gets cloned, built into a Docker container, deployed behind a reverse proxy, and assigned a live URL. Build logs stream to the dashboard in real time.

## Features

- **GitHub Webhook Pipeline** — push to main triggers an automatic deployment via HMAC-validated webhooks
- **Async Job Queue** — BullMQ + Redis queues builds with retry logic and exponential backoff
- **Docker Orchestration** — clones repo, builds image, runs container with resource limits (CPU + memory caps)
- **Dynamic Reverse Proxy** — Caddy routes `<deployment-id>.localhost` to the right container via its JSON Admin API — no restarts required
- **Real-time Log Streaming** — build output streams from Docker → Redis pub/sub → SSE → browser terminal
- **Deployment Tracking** — full lifecycle in Postgres: `QUEUED → BUILDING → DEPLOYING → READY / FAILED`
- **GitHub OAuth** — login with GitHub, JWT session via localStorage
- **Encrypted Environment Variables** — per-project env vars stored with AES-256-GCM encryption, injected into containers at runtime

  <img width="1919" height="828" alt="Screenshot 2026-06-11 124658" src="https://github.com/user-attachments/assets/b1f41abe-1125-46b0-856f-2c7eed5527d9" />

  <img width="1919" height="830" alt="Screenshot 2026-06-11 124742" src="https://github.com/user-attachments/assets/fe72ac6d-55d5-4852-92ee-a29e7e5416a8" />

<img width="1915" height="818" alt="Screenshot 2026-06-11 125137" src="https://github.com/user-attachments/assets/29531140-457f-4bb8-a42d-a2adbc703119" />

<img width="1918" height="831" alt="Screenshot 2026-06-11 130408" src="https://github.com/user-attachments/assets/30b6afe2-3634-42e9-9f28-1fb4abb852a6" />


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

## What's Next / Roadmap

- [ ] Real GitHub webhook integration (currently requires manual curl)
- [ ] Framework auto-detection (Next.js, Vite, CRA)
- [ ] Custom domain support per deployment
- [ ] Team/organization support
- [ ] Deployment rollbacks
- [ ] Resource usage metrics per container

## License
MIT
