# Gemini AI Context / Prompt

Welcome to the **anonimi** (EchoID) project! This document provides core architectural context and guidelines to help you understand the platform and generate accurate code.

## 1. Project Overview
**anonimi** is a privacy-first, enterprise-grade real-time messaging platform. Users are primarily identified by generated IDs (e.g., `aid_a8F3kP29`) and usernames. Personal identifiers like email or phone numbers are never publicly exposed.

The platform is divided into two separate applications:
- **Frontend (`/frontend`)**: A Next.js (App Router) web application.
- **Backend (`/backend`)**: A standalone Express.js + Socket.IO REST/WebSocket service.

## 2. Documentation Map
All documentation resides in the `/docs` folder. It is structured into the following domains:

- **Architecture Guides**: `docs/architecture/` (Contains `SYSTEM_DESIGN.md`, `FRONTEND_DESIGN.md`, `DATABASE_SCHEMA.md`, etc.)
- **API and Sockets**: `docs/api/` (Contains `API_DESIGN.md` and `SOCKET_EVENTS.md`)
- **Core Features**: `docs/features/` (Contains Group Chat, Moderation, and E2EE documentation)
- **Administration & Security**: `docs/administration/`
- **Project Structure**: `docs/project-management/`

> **Note**: *Always consult documentation in `/docs` before proposing large structural changes, new API routes, or database schema modifications.*

## 3. Technology Stack & Guidelines

### Frontend Environment
- **Next.js & React**: We use the Next.js App Router.
- **Styling**: Always use **Tailwind CSS**. Do not use ad-hoc vanilla CSS or inline styles.
- **UI Components**: Use **shadcn/ui** components for consistent design language. You may need to create or modify these.
- **State Management**:
  - Use **TanStack Query** for fetching, caching, and server state.
  - Use **Zustand** for global client state (e.g., active chats, local UI toggles).
- **Real-Time**: We use `socket.io-client` for real-time messaging, presence, and typing status.

### Backend Environment
- **Framework**: **Express.js** combined with **TypeScript**. Use clean Controller-Service-Repository architecture.
- **Database**: **MongoDB** (accessed via Mongoose).
  - Use proper indexes and schema validation.
  - Rely on cursor-based pagination for large lists.
- **WebSockets**: The `Socket.IO` server handles synchronous, bi-directional events (messaging workflows). Check `SOCKET_EVENTS.md` for payload structures.

## 4. Key Directives
- **Separation of Concerns**: Treat the frontend and backend as totally disconnected services communicating strictly via REST + WebSockets.
- **Privacy By Default**: Abide by the internal safety rules. Moderation actions log soft markers; real message deletion is rare to preserve reporting trails.
- **Typing Integrity**: Provide strongly typed TypeScript code. Avoid `any` types.

Use these rules to frame any prompt logic, code modifications, or debugging scenarios within the EchoID workspace.
