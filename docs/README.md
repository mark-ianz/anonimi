# anonimi — Enterprise Real-Time Messaging Platform

## Project Overview

anonimi is an enterprise SaaS-style web application built around a real-time messaging platform. Users are identified by unique generated IDs, and the platform supports private messaging, contacts, group chats, moderation, and a full admin dashboard.

**This is NOT a simple chat page.** anonimi is a complete web application with:

- **Public marketing site** — Landing page, features, about, contact, FAQ, legal pages
- **Authentication system** — Registration, login, password recovery flows
- **Authenticated application** — Dashboard with chat (primary feature), groups, contacts, profile, settings
- **Admin panel** — User management, reports, analytics, system settings
- **Privacy features** — Stealth Mode (timed, encrypted messages), per-conversation mute, group member mute
- **Temporary access** — 24-hour temporary accounts with claim-to-keep flow

The backend is designed as a standalone REST + WebSocket API that can serve both the web frontend and a future mobile application without modification.

---

## Table of Contents — Architecture Documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | High-level system architecture, service boundaries, middleware pipeline |
| [FRONTEND_DESIGN.md](./architecture/FRONTEND_DESIGN.md) | **Complete frontend architecture** — routing, layouts, pages, component hierarchy, auth flow |
| [SYSTEM_DESIGN.md](./architecture/SYSTEM_DESIGN.md) | Detailed subsystem designs for identity, messaging, pagination, blocks, groups, etc. |
| [DATABASE_SCHEMA.md](./architecture/DATABASE_SCHEMA.md) | MongoDB collection schemas, field types, indexes, and relationships |
| [API_DESIGN.md](./api/API_DESIGN.md) | Complete REST API specification organized by domain |
| [SOCKET_EVENTS.md](./api/SOCKET_EVENTS.md) | All Socket.IO events with payload schemas and lifecycle |
| [FEATURE_ROADMAP.md](./project-management/FEATURE_ROADMAP.md) | Phased implementation plan with dependencies and scope |
| [ANONIMI_RENAME_PLAN.md](./project-management/ANONIMI_RENAME_PLAN.md) | Full anonimi -> anonimi rebrand and identifier migration plan |
| [SECURITY_MODEL.md](./administration/SECURITY_MODEL.md) | Authentication, authorization, rate limiting, input validation |
| [ADMIN_SYSTEM.md](./administration/ADMIN_SYSTEM.md) | Admin dashboard design, roles, permissions, workflows |
| [SUPPORT_SYSTEM.md](./administration/SUPPORT_SYSTEM.md) | Support tickets, report lifecycle, and admin workflows |
| [GROUP_CHAT_FEATURE.md](./features/GROUP_CHAT_FEATURE.md) | Group chat roles, invite links, join requests, and moderation |
| [FOLDER_STRUCTURE.md](./project-management/FOLDER_STRUCTURE.md) | Complete project folder layout and organization conventions |

---

## Application Structure

anonimi is composed of three distinct frontend experiences under one deployment:

### 1. Public Marketing Site (`/`)

A polished public-facing website that introduces the product. Visible to **unauthenticated users**.

- Landing page with hero, features overview, CTA
- About, Features, Contact, FAQ pages
- Privacy Policy and Terms of Service
- Guides users toward registration or login

### 2. Authenticated Application (`/chat` and related)

The core product experience. Accessible only to **authenticated users**.

- **Chat** (`/chat`) — Primary feature: private and group messaging with real-time delivery
- **Chat tabs** (`/chat?tab=all|unread|private|groups`) — Filter conversations (groups are merged into chats)
- **Groups** (`/groups`) — Redirects to `/chat?tab=groups`
- **Contacts** (`/contacts`) — Contact list, requests, nicknames
- **Profile** (`/profile`) — User profile viewing and editing
- **Settings** (`/settings`) — Account and application settings (push notifications)
- **Message Requests** (`/message-requests`) — Non-contact message inbox
- **Archive** (`/archive`) — Archived conversations
- **Support** (`/support`) — Submit and track support tickets

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
| User visits `/` with **valid auth cookie** | Redirect to `/chat` |
| User visits app routes (e.g., `/chat`, `/contacts`) with **no auth cookie** | Redirect to `/login` |
| User visits `/admin/*` without **admin role** | Redirect to `/chat` |
| User visits `/login` with **valid auth cookie** | Redirect to `/chat` |

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
| **Nodemailer** | Email delivery for verification and password reset |
| **Web Push** | Browser push notifications via VAPID |

### Media Storage

| Phase | Strategy |
|-------|----------|
| **Phase 1 (Current)** | Local filesystem — `backend/uploads/` directory |
| **Phase 2 (Future)** | Cloud object storage (AWS S3 / GCS / Azure Blob) via adapter swap |

---

## Core Identity Concept

Every user receives a **generated anonimi** at account creation. This ID is the primary way users discover and connect with each other.

**Format:** `aid_` prefix + 8 alphanumeric characters  
**Example:** `aid_a8F3kP29`

- Users share this ID to start conversations (similar to sharing a phone number, but privacy-first).
- Users can also be searched by **username**.
- **Email** and **phone number** are used **only** for authentication and verification — they are never publicly searchable.
- Verification is recoverable: pending users can resume verification and request a new code when needed.

---

## Platform Principles

1. **Enterprise-Grade Application** — anonimi is a full SaaS web application with a marketing site, authentication flows, and a feature-rich application dashboard. Chat is the core product, not the entire product.
2. **Privacy by Default** — Personal contact information (email, phone) is never exposed. Users connect via generated IDs and usernames.
3. **Moderation First** — Messages are never permanently deleted from the database. Admins always retain access to archived content for moderation purposes.
4. **API-First Backend** — The Express + Socket.IO backend is a standalone service with no frontend coupling, enabling future mobile apps to consume the same API.
5. **Progressive Feature Delivery** — The system is designed in phases (see [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)), with each phase building on the previous without requiring rewrites.
6. **Scalability Path** — Architecture decisions (cursor pagination, media abstraction, stateless auth) are chosen to support growth from hundreds to millions of users.

---

## Project Structure

```
anonimi/
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

**Current Phase:** Core Implementation (Auth + Messaging + Groups)  
**Next Phase:** Hardening & Notifications (push, email, UX polish)

See [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for the full implementation plan.
