# Folder Structure

This document defines the complete directory layout for both the backend and frontend applications, along with naming conventions, file organization principles, and the shared type strategy.

---

## Project Root

```
anonimi/
├── backend/                    # Express + Socket.IO API server
├── frontend/                   # Next.js enterprise web application
├── docs/                       # Architecture and planning documents
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── FRONTEND_DESIGN.md
│   ├── SYSTEM_DESIGN.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DESIGN.md
│   ├── SOCKET_EVENTS.md
│   ├── FEATURE_ROADMAP.md
│   ├── SECURITY_MODEL.md
│   ├── ADMIN_SYSTEM.md
│   ├── SUPPORT_SYSTEM.md
│   ├── GROUP_CHAT_FEATURE.md
│   └── FOLDER_STRUCTURE.md     # (this file)
├── .gitignore
└── .git/
```

---

## Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts                      # MongoDB connection setup (Mongoose)
│   │   ├── env.ts                     # Environment variable validation (Zod schema)
│   │   ├── cors.ts                    # CORS configuration
│   │   └── socket.ts                  # Socket.IO server configuration
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts         # Auth route handlers
│   │   ├── user.controller.ts         # User route handlers
│   │   ├── contact.controller.ts      # Contact route handlers
│   │   ├── conversation.controller.ts # Conversation route handlers
│   │   ├── message.controller.ts      # Message route handlers
│   │   ├── messageRequest.controller.ts
│   │   ├── group.controller.ts        # Group route handlers
│   │   ├── block.controller.ts        # Block route handlers
│   │   ├── report.controller.ts       # Report route handlers
│   │   ├── support.controller.ts      # Support ticket handlers
│   │   ├── media.controller.ts        # Media upload handlers
│   │   └── admin.controller.ts        # Admin dashboard handlers
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts         # JWT verification, attach user to req
│   │   ├── requireRole.middleware.ts  # Role-based access control
│   │   ├── validate.middleware.ts     # Zod schema validation
│   │   ├── rateLimiter.middleware.ts  # Rate limiting configuration
│   │   ├── upload.middleware.ts       # Multer file upload configuration
│   │   └── errorHandler.middleware.ts # Global error handler
│   │
│   ├── models/
│   │   ├── user.model.ts             # User Mongoose schema + model
│   │   ├── conversation.model.ts     # Conversation schema
│   │   ├── message.model.ts          # Message schema
│   │   ├── contact.model.ts          # Contact schema
│   │   ├── group.model.ts            # Group schema
│   │   ├── groupMember.model.ts      # Group member schema
│   │   ├── pushSubscription.model.ts # Web Push subscriptions
│   │   ├── block.model.ts            # Block schema
│   │   ├── messageRequest.model.ts   # Message request schema
│   │   ├── report.model.ts           # Report schema
│   │   ├── supportTicket.model.ts    # Support ticket schema
│   │   ├── supportMessage.model.ts   # Support message schema
│   │   ├── adminLog.model.ts         # Admin audit log schema
│   │   ├── ban.model.ts              # Ban schema
│   │   └── refreshToken.model.ts     # Refresh token schema
│   │
│   ├── routes/
│   │   ├── index.ts                   # Route aggregator (/api router)
│   │   ├── auth.routes.ts            # /api/auth/*
│   │   ├── user.routes.ts            # /api/users/*
│   │   ├── contact.routes.ts         # /api/contacts/*
│   │   ├── conversation.routes.ts    # /api/conversations/*
│   │   ├── message.routes.ts         # /api/messages/*
│   │   ├── messageRequest.routes.ts  # /api/message-requests/*
│   │   ├── group.routes.ts           # /api/groups/*
│   │   ├── block.routes.ts           # /api/blocks/*
│   │   ├── report.routes.ts          # /api/reports/*
│   │   ├── notification.routes.ts    # /api/notifications/*
│   │   ├── support.routes.ts         # /api/support/*
│   │   ├── media.routes.ts           # /api/media/*
│   │   └── admin.routes.ts           # /api/admin/*
│   │
│   ├── services/
│   │   ├── auth.service.ts           # Registration, login, JWT, password reset
│   │   ├── email.service.ts          # Email delivery (verification + reset)
│   │   ├── user.service.ts           # Profile management, search, anonimi gen
│   │   ├── contact.service.ts        # Contact requests, nicknames
│   │   ├── chat.service.ts           # Messages, conversations, pagination
│   │   ├── group.service.ts          # Group CRUD, members, roles
│   │   ├── block.service.ts          # Block/unblock, cooldown
│   │   ├── messageRequest.service.ts # Message request management
│   │   ├── report.service.ts         # Reports, snapshots, resolution
│   │   ├── support.service.ts        # Tickets, threaded messages
│   │   ├── media.service.ts          # Upload orchestration, adapter selection
│   │   ├── notification.service.ts   # Socket.IO event emission
│   │   ├── push.service.ts           # Web Push delivery + subscription handling
│   │   └── admin.service.ts          # Admin operations, analytics, logs
│   │
│   ├── socket/
│   │   ├── index.ts                   # Socket.IO server initialization + namespace setup
│   │   ├── auth.socket.ts            # Socket auth middleware (JWT handshake)
│   │   ├── chat.handler.ts           # message:send, message:typing, message:read
│   │   ├── presence.handler.ts       # Connection/disconnection, presence tracking
│   │   ├── group.handler.ts          # Group-specific socket events
│   │   ├── notification.handler.ts   # Generic notification delivery
│   │   ├── admin.handler.ts          # Admin namespace event handlers
│   │   └── rooms.ts                  # Room join/leave utilities
│   │
│   ├── storage/
│   │   ├── storage.adapter.ts        # Abstract adapter interface
│   │   ├── local.adapter.ts          # Local filesystem implementation
│   │   └── cloud.adapter.ts          # Cloud storage implementation (future)
│   │
│   ├── validators/
│   │   ├── auth.validator.ts         # Zod schemas for auth endpoints
│   │   ├── user.validator.ts         # Zod schemas for user endpoints
│   │   ├── contact.validator.ts      # Zod schemas for contact endpoints
│   │   ├── message.validator.ts      # Zod schemas for message endpoints
│   │   ├── group.validator.ts        # Zod schemas for group endpoints
│   │   ├── block.validator.ts        # Zod schemas for block endpoints
│   │   ├── report.validator.ts       # Zod schemas for report endpoints
│   │   ├── support.validator.ts      # Zod schemas for support endpoints
│   │   └── admin.validator.ts        # Zod schemas for admin endpoints
│   │
│   ├── types/
│   │   ├── express.d.ts              # Express type extensions (req.user)
│   │   ├── socket.d.ts              # Socket.IO type extensions (socket.data)
│   │   ├── enums.ts                  # Shared enums (roles, statuses, message types)
│   │   ├── models.ts                 # TypeScript interfaces for DB documents
│   │   ├── api.ts                    # Request/response type definitions
│   │   └── socket.events.ts         # Socket event payload types
│   │
│   ├── utils/
│   │   ├── generateId.ts             # anonimi generation (nanoid wrapper)
│   │   ├── hashPassword.ts           # bcrypt hash/compare utilities
│   │   ├── jwt.ts                    # JWT sign/verify utilities
│   │   ├── pagination.ts             # Cursor pagination helper
│   │   ├── apiResponse.ts            # Standard response formatter
│   │   ├── apiError.ts               # Custom error classes
│   │   ├── logger.ts                 # Logger setup (pino or winston)
│   │   └── sanitize.ts              # Input sanitization utilities
│   │
│   ├── app.ts                        # Express app setup (middleware, routes)
│   └── server.ts                     # Entry point (start HTTP + Socket.IO)
│
├── uploads/                           # Local media storage (gitignored)
│   ├── avatars/                       # User profile images
│   ├── messages/                      # Message attachments
│   └── groups/                        # Group images
│
├── scripts/
│   ├── seed-admin.ts                  # Seed initial super admin account
│   └── migrate-storage.ts            # Future: migrate local → cloud storage
│
├── tests/                             # Test files (mirrors src/ structure)
│   ├── unit/
│   │   ├── services/
│   │   │   ├── auth.service.test.ts
│   │   │   ├── chat.service.test.ts
│   │   │   └── ...
│   │   └── utils/
│   │       ├── generateId.test.ts
│   │       └── ...
│   └── integration/
│       ├── auth.test.ts
│       ├── messages.test.ts
│       └── ...
│
├── .env                               # Environment variables (gitignored)
├── .env.example                       # Example env with all required vars
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json                       # Dev server auto-reload config
└── README.md                          # Backend-specific readme
```

---

## Frontend Structure

The frontend is an **enterprise SaaS web application** with four distinct experiences: public marketing site, authentication, authenticated application, and admin panel. Each has its own route group and layout.

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── images/                        # Static images (logos, icons, og-images)
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   ├── og-image.png              # Open Graph social preview image
│   │   └── hero/                      # Landing page hero assets
│   ├── push-sw.js                      # Web Push service worker
│   └── fonts/                         # Self-hosted fonts (if needed)
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout (providers, fonts, global styles)
│   │   ├── page.tsx                   # Root page (redirect: auth → /chat, unauth → marketing)
│   │   ├── globals.css                # Global Tailwind + custom CSS variables
│   │   ├── not-found.tsx              # Custom 404 page
│   │   │
│   │   ├── (public)/                  # PUBLIC MARKETING SITE — route group
│   │   │   ├── layout.tsx             # Marketing layout (navbar + footer)
│   │   │   ├── about/
│   │   │   │   └── page.tsx           # About page
│   │   │   ├── features/
│   │   │   │   └── page.tsx           # Features showcase page
│   │   │   ├── contact/
│   │   │   │   └── page.tsx           # Contact form / info page
│   │   │   ├── faq/
│   │   │   │   └── page.tsx           # FAQ accordion page
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx           # Privacy policy
│   │   │   └── terms/
│   │   │       └── page.tsx           # Terms of service
│   │   │
│   │   ├── (auth)/                    # AUTHENTICATION — route group (minimal layout)
│   │   │   ├── layout.tsx             # Auth layout (centered card, no nav)
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Login form
│   │   │   ├── register/
│   │   │   │   └── page.tsx           # Registration form
│   │   │   ├── verify/
│   │   │   │   └── page.tsx           # Email verification (OTP)
│   │   │   ├── verify-link/
│   │   │   │   └── page.tsx           # Email verification (link)
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx           # Request password reset
│   │   │   └── reset-password/
│   │   │       └── page.tsx           # Reset password with token
│   │   │
│   │   ├── (main)/                    # AUTHENTICATED APP — route group (sidebar layout)
│   │   │   ├── layout.tsx             # App layout (sidebar + SocketProvider + content)
│   │   │   ├── archive/
│   │   │   │   └── page.tsx           # Archived conversations
│   │   │   ├── blocked/
│   │   │   │   └── page.tsx           # Block list
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx           # Conversation list (default app view)
│   │   │   │   └── [conversationId]/
│   │   │   │       └── page.tsx       # Active conversation / chat view
│   │   │   ├── contacts/
│   │   │   │   ├── page.tsx           # Contacts list
│   │   │   │   └── requests/
│   │   │   │       └── page.tsx       # Contact requests
│   │   │   ├── groups/
│   │   │   │   ├── page.tsx           # Groups (redirects to chat tab)
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx       # Create group form
│   │   │   │   └── [groupId]/
│   │   │   │       ├── page.tsx       # Group chat view
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx   # Group settings
│   │   │   ├── message-requests/
│   │   │   │   └── page.tsx           # Message requests from non-contacts
│   │   │   ├── profile/
│   │   │   │   └── page.tsx           # Own profile view + edit
│   │   │   ├── search/
│   │   │   │   └── page.tsx           # Global user search
│   │   │   ├── settings/
│   │   │   │   └── page.tsx           # Application settings
│   │   │   ├── support/
│   │   │   │   ├── page.tsx           # My support tickets
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx       # Create ticket
│   │   │   │   └── [ticketId]/
│   │   │   │       └── page.tsx       # Ticket detail + thread
│   │   │   └── user/
│   │   │       └── [anonimiId]/
│   │   │           └── page.tsx       # Public user profile
│   │   │
│   │   └── (admin)/                   # ADMIN PANEL — route group (admin layout)
│   │       ├── layout.tsx             # Admin layout (admin sidebar + header)
│   │       └── admin/
│   │           ├── page.tsx           # Admin dashboard home (metrics)
│   │           ├── users/
│   │           │   ├── page.tsx       # User search + list
│   │           │   └── [userId]/
│   │           │       └── page.tsx   # User detail (admin view)
│   │           ├── reports/
│   │           │   ├── page.tsx       # Report queue
│   │           │   └── [reportId]/
│   │           │       └── page.tsx   # Report detail
│   │           ├── support/
│   │           │   ├── page.tsx       # Ticket queue (admin)
│   │           │   └── [ticketId]/
│   │           │       └── page.tsx   # Ticket detail (admin)
│   │           ├── groups/
│   │           │   ├── page.tsx       # Group browser
│   │           │   └── [groupId]/
│   │           │       └── page.tsx   # Group detail (admin)
│   │           ├── messages/
│   │           │   └── [conversationId]/
│   │           │       └── page.tsx   # Conversation viewer (read-only)
│   │           ├── bans/
│   │           │   └── page.tsx       # Ban management
│   │           ├── analytics/
│   │           │   └── page.tsx       # Analytics dashboard
│   │           └── logs/
│   │               └── page.tsx       # Admin activity logs
│   │
│   ├── middleware.ts                  # Next.js root middleware (auth routing)
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── accordion.tsx          # Used for FAQ
│   │   │   ├── scroll-area.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── sheet.tsx              # Mobile sidebar drawer
│   │   │   ├── separator.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...                    # Other shadcn/ui components as needed
│   │   │
│   │   ├── marketing/                 # Marketing site components
│   │   │   ├── MarketingNavbar.tsx    # Public site top navigation
│   │   │   ├── MarketingFooter.tsx    # Public site footer
│   │   │   ├── HeroSection.tsx        # Landing page hero
│   │   │   ├── FeatureCard.tsx        # Feature display card
│   │   │   ├── FeatureGrid.tsx        # Features grid layout
│   │   │   ├── HowItWorksStep.tsx     # Step in "How It Works" section
│   │   │   ├── CTASection.tsx         # Call to action section
│   │   │   ├── FAQAccordion.tsx       # FAQ expandable item
│   │   │   └── ContactForm.tsx        # Contact page form
│   │   │
│   │   ├── auth/                      # Auth form components
│   │   │   ├── LoginForm.tsx          # Email/password login form
│   │   │   ├── RegisterForm.tsx       # Registration form
│   │   │   ├── ForgotPasswordForm.tsx # Password reset request
│   │   │   ├── ResetPasswordForm.tsx  # New password form
│   │   │   ├── VerifyCodeInput.tsx    # OTP verification input
│   │   │   ├── PasswordStrength.tsx   # Password strength indicator
│   │   │   └── AuthCard.tsx           # Wrapper card for auth forms
│   │   │
│   │   ├── chat/                      # Chat-specific components
│   │   │   ├── ChatView.tsx           # Main chat container
│   │   │   ├── MessageList.tsx        # Scrollable message list
│   │   │   ├── MessageBubble.tsx      # Individual message display
│   │   │   ├── MessageInput.tsx       # Message composition area
│   │   │   ├── TypingIndicator.tsx    # "User is typing..." display
│   │   │   ├── MediaPreview.tsx       # Image/file preview in chat
│   │   │   ├── MessageActions.tsx     # Delete, unsend context menu
│   │   │   └── ReadReceipt.tsx        # Read status indicators
│   │   │
│   │   ├── conversations/             # Conversation list components
│   │   │   ├── ConversationList.tsx   # Sidebar conversation list
│   │   │   ├── ConversationItem.tsx   # Single conversation preview
│   │   │   └── ConversationSearch.tsx # Search within conversations
│   │   │
│   │   ├── contacts/                  # Contact-related components
│   │   │   ├── ContactList.tsx        # Contacts display
│   │   │   ├── ContactItem.tsx        # Single contact row
│   │   │   ├── ContactRequestCard.tsx # Incoming request card
│   │   │   └── NicknameEditor.tsx     # Nickname edit dialog
│   │   │
│   │   ├── groups/                    # Group-related components
│   │   │   ├── GroupHeader.tsx        # Group name, image, member count
│   │   │   ├── GroupMemberList.tsx    # Member list with roles
│   │   │   ├── GroupMemberItem.tsx    # Single member row
│   │   │   ├── GroupSettings.tsx      # Settings editor
│   │   │   ├── CreateGroupDialog.tsx  # Group creation modal
│   │   │   ├── JoinRequestCard.tsx    # Join request approval card
│   │   │   └── RoleSelector.tsx       # Role change dropdown
│   │   │
│   │   ├── user/                      # User-related components
│   │   │   ├── UserProfile.tsx        # Profile display
│   │   │   ├── UserProfileEditor.tsx  # Profile edit form
│   │   │   ├── UserSearchResults.tsx  # Search result list
│   │   │   ├── UserCard.tsx           # Compact user card (search results)
│   │   │   ├── AvatarUpload.tsx       # Profile image upload
│   │   │   └── OnlineIndicator.tsx    # Online/offline dot
│   │   │
│   │   ├── admin/                     # Admin dashboard components
│   │   │   ├── AdminSidebar.tsx       # Admin navigation
│   │   │   ├── MetricCard.tsx         # Single metric display
│   │   │   ├── ReportCard.tsx         # Report list item
│   │   │   ├── ReportDetail.tsx       # Full report view
│   │   │   ├── TicketCard.tsx         # Ticket list item
│   │   │   ├── BanDialog.tsx          # Ban user dialog
│   │   │   ├── WarnDialog.tsx         # Warn user dialog
│   │   │   ├── AnalyticsChart.tsx     # Chart wrapper component
│   │   │   ├── AdminLogEntry.tsx      # Log entry display
│   │   │   └── ConversationViewer.tsx # Read-only conversation browser
│   │   │
│   │   └── shared/                    # Shared/reusable components
│   │       ├── ProtectedRoute.tsx     # Auth guard wrapper
│   │       ├── AdminRoute.tsx         # Admin role guard wrapper
│   │       ├── AppSidebar.tsx         # Main app sidebar navigation
│   │       ├── LoadingSkeleton.tsx    # Loading placeholder
│   │       ├── EmptyState.tsx         # Empty data display
│   │       ├── ErrorBoundary.tsx      # React error boundary
│   │       ├── InfiniteScroll.tsx     # Cursor-based infinite scroll
│   │       ├── FileUpload.tsx         # Generic file upload component
│   │       ├── ConfirmDialog.tsx      # Confirmation modal
│   │       ├── SearchInput.tsx        # Debounced search input
│   │       ├── DateDisplay.tsx        # Relative/absolute date formatter
│   │       └── ConnectionStatus.tsx   # WebSocket connection indicator
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 # Auth state + methods (login, logout, refresh)
│   │   ├── useSocket.ts              # Socket.IO connection management
│   │   ├── useMessages.ts            # Message fetching + real-time updates
│   │   ├── useConversations.ts       # Conversation list + updates
│   │   ├── useContacts.ts            # Contact operations
│   │   ├── useGroups.ts              # Group operations
│   │   ├── usePresence.ts            # Online status tracking
│   │   ├── useTyping.ts              # Typing indicator logic
│   │   ├── useInfiniteScroll.ts      # Cursor pagination with TanStack Query
│   │   ├── useMediaUpload.ts         # File upload with progress tracking
│   │   └── useDebounce.ts            # Generic debounce hook
│   │
│   ├── lib/
│   │   ├── api.ts                     # Axios/fetch client with interceptors
│   │   ├── socket.ts                  # Socket.IO client setup
│   │   ├── queryClient.ts            # TanStack Query client configuration
│   │   ├── utils.ts                   # Shared utility functions (cn, formatDate, etc.)
│   │   └── constants.ts              # App-wide constants (API URL, limits, etc.)
│   │
│   ├── stores/
│   │   ├── authStore.ts               # Auth state (user, tokens, isAuthenticated)
│   │   ├── chatStore.ts              # Active conversation, draft messages
│   │   ├── socketStore.ts            # Connection state, reconnect status
│   │   ├── presenceStore.ts          # Online users map
│   │   ├── typingStore.ts            # Currently typing users per conversation
│   │   └── uiStore.ts                # UI state (sidebar open, active panel, theme)
│   │
│   ├── types/
│   │   ├── user.ts                    # User-related TypeScript types
│   │   ├── message.ts                # Message types
│   │   ├── conversation.ts           # Conversation types
│   │   ├── contact.ts                # Contact types
│   │   ├── group.ts                  # Group types
│   │   ├── report.ts                 # Report types
│   │   ├── support.ts                # Support ticket types
│   │   ├── admin.ts                  # Admin types (analytics, logs)
│   │   ├── api.ts                    # API response/request types
│   │   └── socket.ts                 # Socket event payload types
│   │
│   └── providers/
│       ├── QueryProvider.tsx          # TanStack Query provider wrapper
│       ├── SocketProvider.tsx         # Socket.IO context provider
│       └── ThemeProvider.tsx          # Theme (dark/light mode) provider
│
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts                 # Tailwind configuration (if needed beyond CSS)
├── tsconfig.json
├── components.json                    # shadcn/ui configuration
└── README.md
```

### Key Design Decisions

1. **Route groups separate layouts:** `(public)`, `(auth)`, `(main)`, and `(admin)` each define their own `layout.tsx`, ensuring each experience has the appropriate navigation structure.

2. **Application routes live at root paths:** Authenticated app routes use `/chat`, `/contacts`, `/settings`, etc., within the `(main)` route group, while marketing routes stay in `(public)`.

3. **Marketing components are isolated:** Components for the public site (`components/marketing/`) are separate from application components, preventing accidental coupling.

4. **Auth components are standalone:** Authentication forms have their own component directory, decoupled from the rest of the application.

5. **Root middleware handles routing:** A single `middleware.ts` at the `src/` root handles all authentication-based routing logic (redirect unauthenticated users from app routes to `/login`, redirect authenticated users from auth pages to `/chat`, and enforce admin route guards).

6. **SocketProvider wraps only the app layout:** The WebSocket connection is established only within the `(main)` layout, not globally. Marketing and auth pages do not open socket connections.

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `MessageBubble.tsx` |
| Hooks | camelCase with `use` prefix | `useMessages.ts` |
| Stores | camelCase with `Store` suffix | `authStore.ts` |
| Services | camelCase with `.service` suffix | `auth.service.ts` |
| Controllers | camelCase with `.controller` suffix | `auth.controller.ts` |
| Models | camelCase with `.model` suffix | `user.model.ts` |
| Routes | camelCase with `.routes` suffix | `auth.routes.ts` |
| Validators | camelCase with `.validator` suffix | `auth.validator.ts` |
| Middleware | camelCase with `.middleware` suffix | `auth.middleware.ts` |
| Types | camelCase or PascalCase (for interfaces) | `user.ts`, `ApiResponse` |
| Utilities | camelCase | `generateId.ts` |
| Socket handlers | camelCase with `.handler` suffix | `chat.handler.ts` |

### Variables and Functions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `messageCount` |
| Functions | camelCase | `sendMessage()` |
| Classes | PascalCase | `AuthService` |
| Interfaces | PascalCase with `I` prefix (optional) | `User` or `IUser` |
| Enums | PascalCase | `MessageType` |
| Enum values | UPPER_SNAKE_CASE or snake_case | `TEXT` or `text` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Environment vars | UPPER_SNAKE_CASE | `JWT_SECRET` |

### Database

| Type | Convention | Example |
|------|-----------|---------|
| Collection names | camelCase (plural) | `users`, `groupMembers` |
| Field names | camelCase | `createdAt`, `lastSeen` |
| Index names | Auto-generated by Mongoose | N/A |

---

## Shared Types Strategy

Since the frontend and backend are **separate applications** without a monorepo tool, type consistency is maintained manually.

### Approach: Manual Synchronization

1. **Backend defines the source of truth** — types in `backend/src/types/` define all data shapes.
2. **Frontend mirrors the types** — `frontend/src/types/` contains equivalent TypeScript types for API responses.
3. **Shared enums** (message types, roles, statuses) are duplicated in both projects.

### Synchronization Rules

- When a backend type changes, the corresponding frontend type must be updated in the same PR/commit.
- API response types on the frontend should match exactly what the backend returns.
- Consider extracting shared types to a simple `shared/types/` folder at the project root if type drift becomes an issue.

### Future: Shared Package

If the project adopts monorepo tooling (Turborepo, Nx, or npm workspaces), types can be extracted into a shared package:

```
anonimi/
├── packages/
│   └── shared/
│       ├── types/
│       │   ├── user.ts
│       │   ├── message.ts
│       │   └── ...
│       └── package.json
├── backend/
├── frontend/
└── package.json (workspace root)
```

Both `backend` and `frontend` would import from `@anonimi/shared`.

---

## Key Organizational Principles

1. **Domain-driven file organization** — Files are grouped by feature domain (auth, chat, groups) rather than by technical role. However, at the top level, technical separation (controllers, services, models) is maintained for clarity.

2. **Colocation** — Files that change together should live together. A new feature typically touches: route + controller + service + model + validator (backend) and page + components + hook + types (frontend).

3. **Single responsibility** — Each file has one clear purpose. Controllers parse requests and call services. Services contain business logic. Models define data shapes. Validators define input rules.

4. **Flat when possible** — Avoid deep nesting. If a folder has only one file, consider whether the folder is needed.

5. **Index files for aggregation** — `routes/index.ts` aggregates all route files. Avoid deep re-exporting chains that obscure import sources.

6. **Component composition** — Prefer many small components (`MessageBubble`, `ReadReceipt`, `TypingIndicator`) over monolithic page components. Components are organized by domain: `marketing/`, `auth/`, `chat/`, `conversations/`, `contacts/`, `groups/`, `user/`, `admin/`, and `shared/`.

7. **Route group isolation** — Each route group (`(public)`, `(auth)`, `(main)`, `(admin)`) has its own layout and should not import components from other route groups' layouts. Shared components live in `components/shared/`.

8. **Separation of concerns (frontend)** — 
   - **Pages** (`app/`) — Routing, data fetching setup, layout.
   - **Components** (`components/`) — UI rendering, user interaction.
   - **Hooks** (`hooks/`) — Reusable stateful logic.
   - **Stores** (`stores/`) — Global client state.
   - **Lib** (`lib/`) — Stateless utilities and configurations.
