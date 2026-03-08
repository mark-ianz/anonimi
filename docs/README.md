# EchoID — Real-Time Messaging Platform

## Project Overview

EchoID is a production-ready real-time messaging web application built for private communication between users identified by unique generated IDs. The platform supports private messaging, contacts, group chats, moderation, and a full admin dashboard.

The backend is designed as a standalone REST + WebSocket API that can serve both the web frontend and a future mobile application without modification.

---

## Table of Contents — Architecture Documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | High-level system architecture, service boundaries, middleware pipeline |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Detailed subsystem designs for identity, messaging, pagination, blocks, groups, etc. |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | MongoDB collection schemas, field types, indexes, and relationships |
| [API_DESIGN.md](./API_DESIGN.md) | Complete REST API specification organized by domain |
| [SOCKET_EVENTS.md](./SOCKET_EVENTS.md) | All Socket.IO events with payload schemas and lifecycle |
| [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) | Phased implementation plan with dependencies and scope |
| [SECURITY_MODEL.md](./SECURITY_MODEL.md) | Authentication, authorization, rate limiting, input validation |
| [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md) | Admin dashboard design, roles, permissions, workflows |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Complete project folder layout and organization conventions |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js** (App Router) | React framework — SSR, routing, layouts |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Accessible, composable UI component library |
| **TanStack Query** | Server-state management, data fetching, caching |
| **Zustand** | Lightweight client-state management |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | HTTP framework for REST API |
| **TypeScript** | Type-safe server code |
| **Socket.IO** | Real-time bidirectional WebSocket communication |
| **MongoDB** | Document database for all persistent data |
| **JWT** | Stateless authentication tokens |

### Media Storage

| Phase | Strategy |
|-------|----------|
| **Phase 1 (Current)** | Local filesystem — `backend/uploads/` directory |
| **Phase 2 (Future)** | Cloud object storage (AWS S3 / GCS / Azure Blob) via adapter swap |

---

## Core Identity Concept

Every user receives a **generated EchoID** at account creation. This ID is the primary way users discover and connect with each other.

**Format:** `eid_` prefix + 8 alphanumeric characters  
**Example:** `eid_a8F3kP29`

- Users share this ID to start conversations (similar to sharing a phone number, but privacy-first).
- Users can also be searched by **username**.
- **Email** and **phone number** are used **only** for authentication and verification — they are never publicly searchable.

---

## Platform Principles

1. **Privacy by Default** — Personal contact information (email, phone) is never exposed. Users connect via generated IDs and usernames.
2. **Moderation First** — Messages are never permanently deleted from the database. Admins always retain access to archived content for moderation purposes.
3. **API-First Backend** — The Express + Socket.IO backend is a standalone service with no frontend coupling, enabling future mobile apps to consume the same API.
4. **Progressive Feature Delivery** — The system is designed in phases (see [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)), with each phase building on the previous without requiring rewrites.
5. **Scalability Path** — Architecture decisions (cursor pagination, media abstraction, stateless auth) are chosen to support growth from hundreds to millions of users.

---

## Quick Start Vision

```
EchoID/
├── backend/        # Express + Socket.IO API server (TypeScript)
├── frontend/       # Next.js web client (App Router + Tailwind + shadcn/ui)
├── docs/           # Architecture and planning documents (this folder)
└── .git/
```

The frontend and backend are **separate applications** deployed independently. They communicate via:

- **REST API** — CRUD operations, authentication, data fetching
- **WebSocket (Socket.IO)** — Real-time messaging, presence, typing indicators

---

## Status

**Current Phase:** Architecture & Planning  
**Next Phase:** Core Implementation (Auth + User Profiles + Private Messaging)

See [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for the full implementation plan.
