# Architecture Overview

This document describes the high-level system architecture of anonimi, including the three-tier layout, frontend application structure, service boundaries, middleware pipeline, and the media storage abstraction layer.

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                    │
│                                                                     │
│   ┌──────────────────────────────────┐   ┌──────────────────┐       │
│   │   Next.js Enterprise Web App     │   │  Mobile App      │       │
│   │   (App Router)                   │   │  (Future)        │       │
│   │                                  │   │                  │       │
│   │  ┌────────────────────────────┐  │   │  - React Native  │       │
│   │  │ Public Marketing Site     │  │   │    or Flutter    │       │
│   │  │ /, /about, /features,     │  │   │  - Same API      │       │
│   │  │ /contact, /faq, /privacy, │  │   │                  │       │
│   │  │ /terms                    │  │   └────────┬─────────┘       │
│   │  └────────────────────────────┘  │            │                 │
│   │  ┌────────────────────────────┐  │            │                 │
│   │  │ Auth Pages                │  │            │                 │
│   │  │ /login, /register,        │  │            │                 │
│   │  │ /forgot-password, /reset-password, /verify, /verify-link │  │            │                 │
│   │  └────────────────────────────┘  │            │                 │
│   │  ┌────────────────────────────┐  │            │                 │
│   │  │ Authenticated App         │  │            │                 │
│   │  │ /chat, /contacts,         │  │            │                 │
│   │  │ /message-requests, /settings, /profile │  │            │                 │
│   │  └────────────────────────────┘  │            │                 │
│   │  ┌────────────────────────────┐  │            │                 │
│   │  │ Admin Panel               │  │            │                 │
│   │  │ /admin/*                  │  │            │                 │
│   │  └────────────────────────────┘  │            │                 │
│   │                                  │            │                 │
│   │  - Tailwind CSS + shadcn/ui      │            │                 │
│   │  - TanStack Query + Zustand      │            │                 │
│   │  - Socket.IO Client              │            │                 │
│   └──────────────┬───────────────────┘            │                 │
│                  │                                │                 │
└──────────────────┼────────────────────────────────┼─────────────────┘
                   │ HTTPS (REST)                   │ HTTPS (REST)
                   │ WSS (Socket.IO)                │ WSS (Socket.IO)
                   ▼                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                               │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Express.js Server                           │ │
│  │                                                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │ │
│  │  │  CORS    │→│  Rate    │→│   Auth   │→│    Validation    │  │ │
│  │  │ Middleware│ │  Limiter │ │Middleware│ │   Middleware     │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │ │
│  │                       │                                        │ │
│  │                       ▼                                        │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │                   ROUTE LAYER                           │   │ │
│  │  │                                                         │   │ │
│  │  │  /api/auth    /api/users    /api/contacts               │   │ │
│  │  │  /api/messages /api/groups  /api/blocks                 │   │ │
│  │  │  /api/reports  /api/support /api/media                  │   │ │
│  │  │  /api/admin                                             │   │ │
│  │  └─────────────────────┬───────────────────────────────────┘   │ │
│  │                        │                                       │ │
│  │                        ▼                                       │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │                 CONTROLLER LAYER                        │   │ │
│  │  │                                                         │   │ │
│  │  │  Request parsing → Service delegation → Response format │   │ │
│  │  └─────────────────────┬───────────────────────────────────┘   │ │
│  │                        │                                       │ │
│  └────────────────────────┼───────────────────────────────────────┘ │
│                           │                                         │
│  ┌────────────────────────┼───────────────────────────────────────┐ │
│  │                 SERVICE LAYER                                  │ │
│  │                        ▼                                       │ │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐       │ │
│  │  │  Auth   │ │  User   │ │  Chat    │ │   Contact    │       │ │
│  │  │ Service │ │ Service │ │ Service  │ │   Service    │       │ │
│  │  └─────────┘ └─────────┘ └──────────┘ └──────────────┘       │ │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐       │ │
│  │  │  Group  │ │  Block  │ │  Report  │ │   Support    │       │ │
│  │  │ Service │ │ Service │ │ Service  │ │   Service    │       │ │
│  │  └─────────┘ └─────────┘ └──────────┘ └──────────────┘       │ │
│  │  ┌─────────┐ ┌──────────────┐ ┌────────────────────┐         │ │
│  │  │  Media  │ │ Notification │ │      Admin         │         │ │
│  │  │ Service │ │   Service    │ │     Service        │         │ │
│  │  └─────────┘ └──────────────┘ └────────────────────┘         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   SOCKET.IO SERVER                             │ │
│  │                                                                │ │
│  │  Namespace: /chat             Namespace: /admin                │ │
│  │  ┌────────────────────┐      ┌────────────────────┐           │ │
│  │  │  Auth Middleware   │      │  Admin Auth Guard   │           │ │
│  │  │  Room Management   │      │  Dashboard Events   │           │ │
│  │  │  Message Handlers  │      │  Report Alerts      │           │ │
│  │  │  Typing Handlers   │      │  User Activity      │           │ │
│  │  │  Presence Tracker  │      │                    │           │ │
│  │  └────────────────────┘      └────────────────────┘           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│                                                                     │
│  ┌──────────────────────────┐    ┌────────────────────────────┐     │
│  │       MongoDB            │    │    File System / Cloud     │     │
│  │                          │    │                            │     │
│  │  - users                 │    │  ┌──────────────────────┐  │     │
│  │  - conversations         │    │  │  MediaStorageAdapter │  │     │
│  │  - messages              │    │  │                      │  │     │
│  │  - contacts              │    │  │  ├─ LocalAdapter     │  │     │
│  │  - groups                │    │  │  │  (uploads/)       │  │     │
│  │  - groupMembers          │    │  │  │                   │  │     │
│  │  - blocks                │    │  │  └─ CloudAdapter     │  │     │
│  │  - reports               │    │  │    (S3/GCS) [future] │  │     │
│  │  - supportTickets        │    │  └──────────────────────┘  │     │
│  │  - supportMessages       │    │                            │     │
│  │  - messageRequests       │    └────────────────────────────┘     │
│  │  - pushSubscriptions     │                                       │
│  │  - adminLogs             │                                       │
│  │  - bans                  │                                       │
│  └──────────────────────────┘                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Three-Tier Architecture

### Tier 1 — Client (Presentation)

The client tier is an **enterprise SaaS web application** that serves four distinct experiences: a public marketing site, authentication flows, the authenticated chat application, and an admin panel.

| Concern | Technology |
|---------|------------|
| Routing & SSR | Next.js App Router (route groups, middleware, layouts) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Server Data | TanStack Query (fetching, caching, optimistic updates) |
| Client State | Zustand (UI state, socket connection state, active chat) |
| Real-time | Socket.IO client (messaging, typing, presence) |
| Forms | React Hook Form + Zod validation |

### Frontend Application Structure

The frontend is composed of four route groups, each with its own layout:

| Route Group | URL Pattern | Layout | Description |
|-------------|-------------|--------|-------------|
| `(public)` | `/`, `/about`, `/features`, `/faq`, `/contact`, `/privacy`, `/terms` | Marketing (navbar + footer) | Public marketing site for unauthenticated visitors |
| `(auth)` | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify`, `/verify-link` | Minimal centered | Authentication pages (email verification) |
| `(main)` | `/chat`, `/contacts`, `/message-requests`, `/settings`, `/profile`, `/groups` | App (sidebar + content) | Authenticated application with chat, contacts, settings |
| `(admin)` | `/admin/*` | Admin (admin sidebar + content) | Admin panel for user management, reports, analytics |

### Authentication-Based Routing

A Next.js middleware enforces authentication routing:

- **Unauthenticated user visits `/`** → sees the public landing page
- **Authenticated user visits `/`** → redirected to `/chat`
- **Unauthenticated user visits app routes** → redirected to `/login`
- **Non-admin visits `/admin/*`** → redirected to `/chat`
- **Unauthenticated user visits `/verify` without valid context** → redirected to `/register` by verification flow checks

See [FRONTEND_DESIGN.md](./FRONTEND_DESIGN.md) for the complete frontend specification.

The frontend is a **standalone application** that talks exclusively to the backend API. It has no direct database access. Every page and component fetches data through API calls or receives it via WebSocket events.

**Future mobile clients** will consume the exact same REST API and Socket.IO server, connecting with the same endpoints and auth tokens.

### Tier 2 — Application Server (Business Logic)

A single Express.js + Socket.IO process handles both REST requests and WebSocket connections.

**Request Lifecycle (REST):**

```
Client Request
  → CORS Middleware
  → Rate Limiter
  → Auth Middleware (JWT verification)
  → Validation Middleware (Zod schema)
  → Controller (parse request, call service)
  → Service (business logic, DB access)
  → Response (JSON)
```

**Request Lifecycle (WebSocket):**

```
Client Connection
  → Socket.IO Auth Middleware (JWT from handshake)
  → Connection established, user joins rooms
  → Event received (e.g., message:send)
  → Socket Handler (validate, call service)
  → Service (persist to DB)
  → Broadcast to relevant rooms
```

### Tier 3 — Data (Persistence)

| Store | Purpose |
|-------|---------|
| **MongoDB** | All structured data — users, messages, conversations, groups, reports, admin logs |
| **Local Filesystem** | Media uploads (images, files) stored in `backend/uploads/` |
| **Cloud Storage (Future)** | S3/GCS/Azure Blob via adapter pattern |

---

## Service Layer Design

Each service encapsulates a domain's business logic. Services are stateless classes/modules that accept dependencies (models, other services) and expose methods.

### Service Responsibilities

| Service | Responsibility |
|---------|----------------|
| **AuthService** | Email-based registration/login, crypto username generation fallback, one-time username edit enforcement, optional recovery phone updates, email verification, verification-status checks, resend-verification lifecycle, password reset, JWT token generation and refresh |
| **UserService** | Profile CRUD, anonimi generation, user search, avatar management, online status tracking |
| **ChatService** | Message creation, retrieval with cursor pagination, message deletion (for-me, unsend), conversation management |
| **ContactService** | Contact requests (send, accept, decline), nickname management, contacts list retrieval |
| **GroupService** | Group CRUD, member management, role assignment, ownership transfer, join requests |
| **BlockService** | Block/unblock users, block list management, cooldown enforcement, block status checking |
| **ReportService** | Create reports with message snapshots, report queue management, resolution workflow |
| **SupportService** | Ticket creation, threaded message management, ticket status transitions |
| **MediaService** | File upload handling, storage adapter abstraction, URL generation, file type/size validation |
| **NotificationService** | Socket.IO event emission, room management, typing indicator coordination, presence broadcasting |
| **AdminService** | User management, report review, ban management, analytics aggregation, audit log recording |

### Service Dependencies

```
AuthService       → UserService (create user on register)
ChatService       → BlockService (check blocks before sending)
                  → NotificationService (emit real-time events)
                  → MediaService (attach media to messages)
ContactService    → NotificationService (contact request alerts)
GroupService      → ChatService (group messages)
                  → NotificationService (join/leave events)
ReportService     → ChatService (fetch message snapshots)
AdminService      → UserService, ChatService, ReportService, SupportService
```

---

## Middleware Pipeline

Middlewares execute in order for every HTTP request. Each middleware can short-circuit the pipeline by returning an error response.

### Pipeline Order

```
1. CORS                  — Whitelist allowed origins (web domain + future mobile)
2. Body Parser           — Parse JSON/multipart request bodies
3. Request Logger        — Log method, path, status, duration (morgan or custom)
4. Rate Limiter          — Per-IP and per-user rate limits (express-rate-limit)
5. Auth Middleware        — Extract + verify JWT from Authorization header or cookie
6. Validation Middleware  — Validate request body/params/query against Zod schemas
7. Route Handler         — Controller function processes the request
8. Error Handler         — Global error handler catches and formats all errors
```

### Middleware Details

| Middleware | Behavior |
|------------|----------|
| **CORS** | Allows configured origins. Supports credentials (cookies). Exposes necessary headers. |
| **Rate Limiter** | Tiered limits: Auth routes (5 req/min), Search (30 req/min), General API (100 req/min), Messages (60 req/min). Uses sliding window. |
| **Auth** | Extracts JWT from `Authorization: Bearer <token>` header. Verifies signature and expiry. Attaches decoded user to `req.user`. Public routes bypass auth middleware. |
| **Validation** | Each route defines a Zod schema for `body`, `params`, and/or `query`. Middleware validates against schema and returns 400 with structured errors on failure. |
| **Error Handler** | Catches all thrown/next(err) errors. Maps known error types (ValidationError, AuthError, NotFoundError, ForbiddenError) to appropriate HTTP status codes. Returns consistent error response format. |

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "field": "username", "message": "Username must be 3-30 characters" }
    ]
  }
}
```

### Standard Success Response Format

```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response Format

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "nextCursor": "60d5ecb54b24a1001c8e4b3a",
    "hasMore": true,
    "limit": 20
  }
}
```

---

## Media Storage Abstraction

Media uploads (profile images, message attachments) are handled through an adapter pattern that abstracts the storage backend.

### Adapter Interface

```
MediaStorageAdapter
├── upload(file, path)     → Returns storage URL/path
├── delete(path)           → Removes file from storage
├── getUrl(path)           → Returns public/signed URL
└── exists(path)           → Boolean check
```

### Current Implementation — LocalStorageAdapter

- Files are stored in `backend/uploads/` directory.
- Subdirectories organize by type: `uploads/avatars/`, `uploads/messages/`, `uploads/groups/`.
- Files are named with UUIDs to prevent conflicts: `<uuid>.<ext>`.
- The backend serves files via a static file route: `GET /uploads/:path`.
- A configuration flag (`STORAGE_ADAPTER=local`) selects this adapter.

### Future Implementation — CloudStorageAdapter

- Swap `STORAGE_ADAPTER=s3` (or `gcs`, `azure`) via environment variable.
- Adapter uploads to cloud bucket, returns signed URLs.
- Existing URLs in the database remain valid (migration script updates old paths).
- No changes needed in services or controllers — only the adapter implementation changes.

### Upload Processing Pipeline

```
Client uploads file
  → Multer middleware (parse multipart/form-data)
  → File validation (type whitelist, size limit)
  → MediaService.upload(file, category)
  → StorageAdapter.upload(file, generatedPath)
  → Return URL to client / store in message document
```

---

## Deployment Architecture (Target)

While the initial development runs everything locally, the architecture supports the following production deployment:

```
┌─────────────────┐     ┌─────────────────────────┐     ┌──────────┐
│   CDN / Edge    │     │     Load Balancer        │     │ MongoDB  │
│   (Next.js)     │────▶│  (Nginx / Cloud LB)      │────▶│ Atlas    │
│                 │     │                           │     │          │
└─────────────────┘     │  ┌─────────────────────┐ │     └──────────┘
                        │  │  Express Instance 1  │ │
                        │  │  (REST + Socket.IO)  │ │     ┌──────────┐
                        │  └─────────────────────┘ │     │  Redis   │
                        │  ┌─────────────────────┐ │────▶│ (Future) │
                        │  │  Express Instance 2  │ │     │ Pub/Sub  │
                        │  │  (REST + Socket.IO)  │ │     └──────────┘
                        │  └─────────────────────┘ │
                        └─────────────────────────────┘
```

**Scaling Notes:**
- Socket.IO supports multiple instances via Redis adapter (add when scaling horizontally).
- MongoDB Atlas handles database scaling with replica sets and sharding.
- Next.js frontend deploys independently (Vercel, Docker, or static export).
- Media storage migrates to cloud CDN when traffic warrants it.

---

## Cross-Cutting Concerns

| Concern | Strategy |
|---------|----------|
| **Logging** | Structured JSON logs (winston or pino). Request logs + application logs. Severity levels: error, warn, info, debug. |
| **Environment Config** | `.env` files with `dotenv`. Validated at startup with Zod. Separate configs for development, staging, production. |
| **Health Check** | `GET /api/health` returns server status, DB connection status, uptime. No auth required. |
| **Graceful Shutdown** | On SIGTERM: stop accepting new connections, close existing Socket.IO connections, flush pending writes, close DB connection, exit. |
| **Error Tracking** | Pluggable error reporting (Sentry, Datadog) — add when needed, errors logged locally for now. |
| **API Versioning** | Not versioned initially. All routes under `/api/`. If breaking changes needed later, prefix with `/api/v2/`. |
