# EchoID — Enterprise Real-Time Messaging Platform

## Project Overview

EchoID is an enterprise SaaS-style web application built around a real-time messaging platform. Users are identified by unique generated IDs, and the platform supports private messaging, contacts, group chats, moderation, and a full admin dashboard.

**This is NOT a simple chat page.** EchoID is a complete web application with:

- **Public marketing site** — Landing page, features, about, contact, FAQ, legal pages
- **Authentication system** — Registration, login, password recovery flows
- **Authenticated application** — Dashboard with chat (primary feature), groups, contacts, profile, settings
- **Admin panel** — User management, reports, analytics, system settings

The backend is designed as a standalone REST + WebSocket API that can serve both the web frontend and a future mobile application without modification.

---

## Table of Contents — Architecture Documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | High-level system architecture, service boundaries, middleware pipeline |
| [FRONTEND_DESIGN.md](./FRONTEND_DESIGN.md) | **Complete frontend architecture** — routing, layouts, pages, component hierarchy, auth flow |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Detailed subsystem designs for identity, messaging, pagination, blocks, groups, etc. |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | MongoDB collection schemas, field types, indexes, and relationships |
| [API_DESIGN.md](./API_DESIGN.md) | Complete REST API specification organized by domain |
| [SOCKET_EVENTS.md](./SOCKET_EVENTS.md) | All Socket.IO events with payload schemas and lifecycle |
| [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) | Phased implementation plan with dependencies and scope |
| [ANONIMI_RENAME_PLAN.md](./ANONIMI_RENAME_PLAN.md) | Full EchoID -> anonimi rebrand and identifier migration plan |
| [SECURITY_MODEL.md](./SECURITY_MODEL.md) | Authentication, authorization, rate limiting, input validation |
| [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md) | Admin dashboard design, roles, permissions, workflows |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Complete project folder layout and organization conventions |

---

## Application Structure

EchoID is composed of three distinct frontend experiences under one deployment:

### 1. Public Marketing Site (`/`)

A polished public-facing website that introduces the product. Visible to **unauthenticated users**.

- Landing page with hero, features overview, CTA
- About, Features, Contact, FAQ pages
- Privacy Policy and Terms of Service
- Guides users toward registration or login

### 2. Authenticated Application (`/app/*`)

The core product experience. Accessible only to **authenticated users**.

- **Chat** (`/app/chat`) — Primary feature: private and group messaging with real-time delivery
- **Groups** (`/app/groups`) — Group management and group chat
- **Contacts** (`/app/contacts`) — Contact list, requests, nicknames
- **Profile** (`/app/profile`) — User profile viewing and editing
- **Settings** (`/app/settings`) — Account and application settings
- **Message Requests** (`/app/message-requests`) — Non-contact message inbox
- **Support** (`/app/support`) — Submit and track support tickets

### 3. Admin Panel (`/admin/*`)

System administration interface. Accessible only to users with **admin roles** (super_admin, moderator, support_staff).

- Dashboard with real-time metrics
- User management, reports, bans
- Support ticket management
- Analytics and audit logs

---

## Authentication Routing Behavior

The frontend implements the following conditional routing:

| Condition | Behavior |
|-----------|----------|
| User visits `/` with **no auth cookie** | Show public landing page |
| User visits `/` with **valid auth cookie** | Redirect to `/app/chat` |
| User visits `/app/*` with **no auth cookie** | Redirect to `/login` |
| User visits `/admin/*` without **admin role** | Redirect to `/app/chat` |
| User visits `/login` with **valid auth cookie** | Redirect to `/app/chat` |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js** (App Router) | React framework — SSR, routing, layouts, middleware |
| **TypeScript** | Type-safe frontend code |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Accessible, composable UI component library |
| **TanStack Query** | Server-state management, data fetching, caching |
| **Zustand** | Lightweight client-state management |
| **Socket.IO Client** | Real-time messaging, presence, typing indicators |

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
- Verification is recoverable: pending users can resume verification and request a new code when needed.

---

## Platform Principles

1. **Enterprise-Grade Application** — EchoID is a full SaaS web application with a marketing site, authentication flows, and a feature-rich application dashboard. Chat is the core product, not the entire product.
2. **Privacy by Default** — Personal contact information (email, phone) is never exposed. Users connect via generated IDs and usernames.
3. **Moderation First** — Messages are never permanently deleted from the database. Admins always retain access to archived content for moderation purposes.
4. **API-First Backend** — The Express + Socket.IO backend is a standalone service with no frontend coupling, enabling future mobile apps to consume the same API.
5. **Progressive Feature Delivery** — The system is designed in phases (see [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)), with each phase building on the previous without requiring rewrites.
6. **Scalability Path** — Architecture decisions (cursor pagination, media abstraction, stateless auth) are chosen to support growth from hundreds to millions of users.

---

## Project Structure

```
EchoID/
├── backend/        # Express + Socket.IO API server (TypeScript)
├── frontend/       # Next.js enterprise web application (App Router + Tailwind + shadcn/ui)
├── docs/           # Architecture and planning documents (this folder)
└── .git/
```

The frontend and backend are **separate applications** deployed independently. They communicate via:

- **REST API** — CRUD operations, authentication, data fetching
- **WebSocket (Socket.IO)** — Real-time messaging, presence, typing indicators

---

## Status

**Current Phase:** Architecture & Planning  
**Next Phase:** Core Implementation (Public Site + Auth + User Profiles + Private Messaging)

See [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for the full implementation plan.
