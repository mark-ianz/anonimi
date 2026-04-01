# Feature Roadmap

This document defines the phased implementation plan for EchoID. Each phase builds on the previous one. Phases are dependency-ordered — no phase requires features from a later phase.

---

## Phase Summary

| Phase | Name | Scope | Est. Complexity |
|-------|------|-------|-----------------|
| **1** | Foundation | Auth, profiles, user search | High (infrastructure setup) |
| **2** | Core Messaging | Private chat, contacts, message pagination | High (real-time infrastructure) |
| **3** | Social Features | Message requests, blocks, typing, read receipts, presence, media | Medium-High |
| **4** | Group Chats | Groups, roles, settings, join requests, group nicknames | High |
| **5** | Moderation | Reports, admin dashboard (users, reports, bans) | Medium-High |
| **6** | Support System | Support tickets, threaded conversations | Medium |
| **7** | Analytics & Hardening | Analytics, audit logs, rate limiting, spam prevention | Medium |
| **8** | Future Expansion | Mobile API, cloud storage, voice messages | Varies |

---

## Recent Updates (April 2026)

- Email verification now supports both code and link flows.
- Password reset emails are delivered via SMTP with auto-login on success.
- Web Push notifications are available with a Settings toggle.
- Chat list now supports All/Unread/Private/Groups tabs (groups live in Chats).

---

## Phase 1 — Foundation

**Goal:** Establish the project infrastructure, authentication system, user identity, and basic profile management.

### Backend Tasks

- [ ] Initialize Express.js + TypeScript project structure
- [ ] Configure MongoDB connection with Mongoose
- [ ] Set up environment configuration (dotenv + Zod validation)
- [ ] Implement global middleware pipeline (CORS, body parser, error handler)
- [ ] Create the `User` model with all schema fields and indexes
- [ ] Implement EchoID generation (`eid_` + 8 chars via nanoid)
- [ ] Build `AuthService`:
  - [ ] Registration with email only (hash password with bcrypt)
  - [ ] Optional username at registration; generate random username when omitted
  - [ ] Enforce single manual username edit policy
  - [ ] Email verification with time-limited codes
  - [ ] Login with email + password
  - [ ] JWT access token generation (15-min expiry)
  - [ ] JWT refresh token generation and rotation (7-day expiry)
  - [ ] Refresh token storage and revocation
  - [ ] Password reset (forgot + reset endpoints)
  - [ ] Logout (invalidate refresh token)
- [ ] Build `UserService`:
  - [ ] Get own profile (`GET /api/auth/me`)
  - [ ] Update profile (`PATCH /api/auth/me`)
  - [ ] Upload avatar (`POST /api/auth/me/avatar`)
  - [ ] User search by EchoID and username (`GET /api/users/search`)
  - [ ] Get public profile (`GET /api/users/:echoId`)
- [ ] Set up auth middleware (JWT verification)
- [ ] Set up validation middleware (Zod schemas per route)
- [ ] Implement health check endpoint (`GET /api/health`)
- [ ] Set up request logging (morgan or pino)

### Frontend Tasks

#### Project Setup & Infrastructure
- [ ] Install and configure shadcn/ui
- [ ] Install and configure TanStack Query
- [ ] Install and configure Zustand
- [ ] Set up API client (Axios or fetch wrapper) with auth interceptor
- [ ] Implement auth state management (Zustand store)
- [ ] Set up `ThemeProvider` (dark/light mode)
- [ ] Set up `QueryProvider` wrapper

#### Next.js Root Middleware (Auth Routing)
- [ ] Create `src/middleware.ts` with authentication-based routing:
  - [ ] Read `access_token` cookie to determine auth state
  - [ ] Unauthenticated users accessing app routes (e.g., `/chat`, `/contacts`) → redirect to `/login`
  - [ ] Unauthenticated users accessing `/admin/*` → redirect to `/login`
  - [ ] Authenticated users accessing `/login` or `/register` → redirect to `/chat`
  - [ ] Public routes (`/`, `/about`, `/features`, `/contact`, `/faq`, `/privacy`, `/terms`) → always accessible
  - [ ] Admin routes (`/admin/*`) → check user role, redirect non-admins to `/chat`

#### Root Layout & Route Groups
- [ ] Build root `layout.tsx` (providers, fonts, global styles — no navigation)
- [ ] Build root `page.tsx` (redirect: authenticated → `/chat`, unauthenticated → landing)
- [ ] Create four route group layouts:
  - [ ] `(public)/layout.tsx` — Marketing layout (MarketingNavbar + MarketingFooter)
  - [ ] `(auth)/layout.tsx` — Auth layout (centered card, minimal, no navigation)
  - [ ] `(main)/layout.tsx` — App layout (AppSidebar + content area + SocketProvider)
  - [ ] `(admin)/layout.tsx` — Admin layout (AdminSidebar + header + content area)

#### Public Marketing Site (`(public)` route group)
- [ ] Build `MarketingNavbar` component (logo, nav links, Login/Register CTAs)
- [ ] Build `MarketingFooter` component (links, copyright)
- [ ] Build landing page (`/`) — hero section, features overview, how-it-works, CTA
- [ ] Build About page (`/about`) — mission, team, platform story
- [ ] Build Features page (`/features`) — feature cards with icons and descriptions
- [ ] Build Contact page (`/contact`) — contact form + info
- [ ] Build FAQ page (`/faq`) — accordion-based Q&A
- [ ] Build Privacy Policy page (`/privacy`) — legal content
- [ ] Build Terms of Service page (`/terms`) — legal content

#### Authentication Pages (`(auth)` route group)
- [ ] Build `AuthCard` wrapper component (centered card with logo)
- [ ] Build Login page — email/password form with "Forgot password?" and register links
- [ ] Build Registration page — email, optional username, password, confirm password
- [ ] Add registration helper note discouraging real-name usernames for anonymity
- [ ] Build Email Verification page — OTP code input with resend timer
- [ ] Build Forgot Password page — email input form
- [ ] Build Reset Password page — new password form with strength indicator

#### Authenticated Application Pages (`(main)` route group)
- [ ] Build `AppSidebar` component (nav: Chat, Contacts, Archive, Profile, Settings, Support)
- [ ] Build user profile page (`/profile`) — view own profile, edit
- [ ] Build user search page/component
- [ ] Build public profile view (`/user/[echoId]`)
- [ ] Build settings page (`/settings`) — theme, notifications, account
- [ ] Set up protected route wrapper (`ProtectedRoute` component)

### Acceptance Criteria

- Public marketing site is accessible without authentication.
- Marketing pages render with proper SEO metadata.
- Authenticated users visiting `/login` or `/register` are redirected to `/chat`.
- Unauthenticated users visiting app routes are redirected to `/login`.
- Users can register with email only, verify, and log in.
- Users can register without username and receive a random generated username.
- Users can optionally add phone later for recovery/security.
- Username manual edit is limited to one change.
- JWT tokens work correctly with refresh rotation.
- Users can view and edit their profiles.
- Users can search for other users by EchoID or username.
- Public profiles show only public information (no email/phone).
- All four layouts render correctly with proper navigation.

### Privacy-First Rollout Order (Task 2)

Apply these in order to minimize regressions:

1. Backend schema and validation changes for future users only.
2. Auth service/controller contract updates (register/login/profile).
3. Frontend auth forms and helper copy updates.
4. Profile/settings account fields (optional recovery phone, one-time username edit UX).
5. End-to-end and regression validation.

Notes:
- Existing test users can remain unchanged during this phase.
- New signup behavior applies to newly created users.

### Privacy-First Test Matrix

- Register with email + password, no username:
  - Expect crypto-random username generation.
  - Expect successful email verification and login.
- Register with email + password + custom username:
  - Expect normal account creation and verification.
- Login with email:
  - Expect success for active account.
- Login with phone (if phone exists on account):
  - Expect success.
- Add phone after signup from profile/settings:
  - Expect success and persistence.
- Username update (first manual change):
  - Expect success.
- Username update (second manual change attempt):
  - Expect rejection with clear error.
- Privacy copy:
  - Register page shows recommendation against real-name usernames for anonymity.

### Cross-Reference: Auth & Verification Bugfix Set (Completed)

This roadmap milestone includes the resolved login/verification UX and recovery fixes documented in [docs/BUGS.md](docs/BUGS.md).

Completed items linked to this phase:

- Stable failed-login feedback (persistent inline message + readable toast)
- Removed false refresh/flicker behavior on auth failures
- Recoverable verification flow after tab close
- Verification page access control via verification-status checks
- Pending verification persistence and auto-resume
- Resend verification endpoint and verify-page resend UX (cooldown + feedback)

---

## Phase 2 — Core Messaging

**Goal:** Enable real-time private messaging between users, implement the contact system, and build message pagination.

### Dependencies
- Phase 1 (Auth, User model, API infrastructure)

### Backend Tasks

- [ ] Set up Socket.IO server integrated with Express
- [ ] Implement Socket.IO auth middleware (JWT handshake)
- [ ] Create `Conversation` model
- [ ] Create `Message` model with all indexes
- [ ] Create `Contact` model
- [ ] Build `ContactService`:
  - [ ] Send contact request
  - [ ] Accept/decline contact request
  - [ ] List contacts (accepted)
  - [ ] List incoming requests
  - [ ] Remove contact
  - [ ] Set contact nickname
- [ ] Build `ChatService`:
  - [ ] Create conversation (find existing or create new)
  - [ ] Send message (persist + emit)
  - [ ] Fetch messages with cursor-based pagination
  - [ ] Get conversation list for user
- [ ] Implement Socket.IO event handlers:
  - [ ] `message:send` → persist + broadcast
  - [ ] `message:ack` → confirm delivery
  - [ ] `message:receive` → deliver to recipients
- [ ] Implement room management (join/leave conversation rooms)
- [ ] Implement conversation list with `lastMessage` denormalization

### Frontend Tasks

- [ ] Install and configure Socket.IO client
- [ ] Build `SocketProvider` (wraps only the `(main)` layout, not global)
- [ ] Build Socket.IO connection manager (with auth + reconnect)
- [ ] Build `ConnectionStatus` component (WebSocket connection indicator)
- [ ] Build conversation list sidebar (`ConversationList`, `ConversationItem`, `ConversationSearch`)
- [ ] Build chat view (`/chat/[conversationId]`):
  - [ ] `ChatView` container with `MessageList` and `MessageInput`
  - [ ] Message list with infinite scroll (upward for older messages)
  - [ ] Message input area with send button
  - [ ] `MessageBubble` (sent vs. received styling)
  - [ ] Scroll-to-bottom behavior for new messages
- [ ] Build contacts page (`/contacts`):
  - [ ] `ContactList` and `ContactItem` components
  - [ ] Incoming requests tab (`/contacts/requests`)
  - [ ] `ContactRequestCard` with accept/decline actions
  - [ ] Send contact request (from profile or search)
  - [ ] `NicknameEditor` dialog
- [ ] Create Zustand store for active conversation state (`chatStore`)
- [ ] Create Zustand store for socket connection state (`socketStore`)
- [ ] Integrate TanStack Query for conversation/message fetching
- [ ] Implement cursor-based pagination hook (`useInfiniteScroll`)

### Acceptance Criteria

- Users can send and receive real-time messages.
- Messages persist and load correctly with pagination.
- Scrolling up loads older messages seamlessly.
- Contact requests can be sent, accepted, and declined.
- Conversation list shows latest messages and sorts by recency.

---

## Phase 3 — Social Features

**Goal:** Add message requests, blocking, typing indicators, read receipts, presence tracking, and media uploads.

### Dependencies
- Phase 2 (Messaging, Contacts, Socket.IO)

### Backend Tasks

- [ ] Create `MessageRequest` model
- [ ] Create `Block` model
- [ ] Build `MessageRequestService`:
  - [ ] Auto-create request when non-contact sends first message
  - [ ] Accept request (with optional add-to-contacts)
  - [ ] Ignore request
  - [ ] List pending requests
- [ ] Build `BlockService`:
  - [ ] Block user (+ remove contact relationship)
  - [ ] Unblock user (with cooldown recording)
  - [ ] Check block status (utility used by ChatService)
  - [ ] List blocked users
  - [ ] Enforce re-block cooldown
- [ ] Integrate block checks into message sending pipeline
- [ ] Implement typing indicator socket events:
  - [ ] `message:typing` → broadcast `typing:update`
  - [ ] Server-side 5-second auto-expiry
- [ ] Implement read receipt socket events:
  - [ ] `message:read` → update `readBy` + broadcast
- [ ] Implement presence system:
  - [ ] Track online/offline via Socket.IO connections
  - [ ] 10-second grace period for disconnections
  - [ ] `presence:update` broadcasts
  - [ ] `lastSeen` timestamp updates
- [ ] Build `MediaService`:
  - [ ] `LocalStorageAdapter` implementation
  - [ ] File upload endpoint with Multer
  - [ ] File type and size validation
  - [ ] UUID-based file naming
  - [ ] Static file serving route
- [ ] Implement message deletion:
  - [ ] Delete for me (add to `deletedFor`)
  - [ ] Unsend message (set `unsent: true`, time-limited)
  - [ ] Exclude deleted messages from pagination queries

### Frontend Tasks

- [ ] Build message requests page (`/message-requests`):
  - [ ] Request list with accept / accept-and-add-to-contacts / ignore actions
  - [ ] Clicking a request navigates to the conversation (full chat view with recipient banner)
  - [ ] Sidebar "Message Requests" nav item with live unread-count badge
  - [ ] Badge updates in real-time via `message-request:new` socket event
- [ ] Build "Send Message" entry points for non-contacts:
  - [ ] "Send Message" button in `UserSearchResults` alongside "Add Contact"
  - [ ] "Send Message" button on `UserProfile` page (`/user/[echoId]`)
  - [ ] Both call `POST /api/conversations` then navigate to `/chat/[conversationId]`
- [ ] Implement non-contact notice banner in `ChatView`:
  - [ ] Determine current user's role: sender or recipient (compare `currentUserId` with `MessageRequest.fromUserId`)
  - [ ] **Recipient banner**: "Message request from [Username]" + Accept + Ignore buttons; disable `MessageInput`
  - [ ] **Sender banner**: "Your message is a request — [Username] hasn't accepted yet"; keep `MessageInput` enabled
  - [ ] Accept action: `PATCH /api/message-requests/:id/accept` → re-enable `MessageInput`, dismiss banner, move to main inbox
  - [ ] Ignore action: `PATCH /api/message-requests/:id/ignore` → navigate away from conversation
  - [ ] On `message-request:accepted` socket event → remove banner, enable input for sender
- [ ] Add contact request controls inside ChatView banner:
  - [ ] "Send Contact Request" shown when no contact relationship and no pending request
  - [ ] "Contact Request Pending" (disabled) shown when current user already sent a request
  - [ ] "Accept Contact Request" shown when the other party sent a pending contact request
  - [ ] Accepting a contact request within chat upgrades `requestStatus` to `null` for both sides
- [ ] Build block/unblock functionality (from profile view)
- [ ] Build block list page (`/blocked`)
- [ ] Implement typing indicators:
  - [ ] Detect input activity → emit typing events (debounce 2s)
  - [ ] `TypingIndicator` component — display "User is typing..." in chat view
- [ ] Implement read receipts:
  - [ ] Emit read events when conversation is focused
  - [ ] `ReadReceipt` component — sent/delivered/read indicators on messages
- [ ] Implement presence indicators:
  - [ ] `OnlineIndicator` component — online/offline dot on avatars
  - [ ] "Last seen" display on profiles
  - [ ] Create Zustand store for presence state (`presenceStore`)
- [ ] Build media upload UI:
  - [ ] Image attachment button in `MessageInput`
  - [ ] File attachment button
  - [ ] `MediaPreview` component in messages
  - [ ] Upload progress indicator
  - [ ] File download link in messages
- [ ] Build message deletion UI:
  - [ ] `MessageActions` context menu (right-click / long-press)
  - [ ] "Delete for me" option
  - [ ] "Unsend" option (for own messages within time limit)
  - [ ] "This message was unsent" placeholder display

### Acceptance Criteria

- Non-contact messages appear in message requests section.
- Blocked users cannot send messages or contact requests.
- Typing indicators show in real-time.
- Read receipts update when messages are viewed.
- Online presence dots update in real-time.
- Users can upload and send images and files.
- Messages can be deleted for self or unsent for everyone.

---

## Phase 4 — Group Chats

**Goal:** Implement group chat creation, management, roles, nicknames, and join requests.

### Dependencies
- Phase 3 (Media uploads for group images, message requests for non-contact invites)

### Backend Tasks

- [ ] Create `Group` model
- [ ] Create `GroupMember` model
- [ ] Build `GroupService`:
  - [ ] Create group (with name, optional image, initial members)
  - [ ] Update group (name, image, settings)
  - [ ] Delete group (soft-delete / archive)
  - [ ] Get group details
  - [ ] List group members
- [ ] Implement group member management:
  - [ ] Add members (contacts → immediate, non-contacts → invitation)
  - [ ] Remove members (role-based permissions)
  - [ ] Leave group
  - [ ] Ownership transfer logic (explicit + auto on owner leave)
- [ ] Implement role management:
  - [ ] Promote member to admin
  - [ ] Demote admin to member
  - [ ] Transfer ownership
  - [ ] Permission matrix enforcement
- [ ] Implement join request system:
  - [ ] Enable/disable join requests in group settings
  - [ ] Submit join request
  - [ ] Approve/reject join request
- [ ] Implement group nicknames:
  - [ ] Set nickname (per group per user)
  - [ ] System message generation on nickname change
- [ ] Implement group Socket.IO events:
  - [ ] `group:member-joined`
  - [ ] `group:member-left`
  - [ ] `group:updated`
  - [ ] `group:role-changed`
  - [ ] `group:join-request`
  - [ ] Group typing indicators (multiple users)
- [ ] Implement group mute (per member, stored in `groupMembers.mutedUntil`)

### Frontend Tasks

- [ ] Build groups list page (`/groups`)
- [ ] Build `CreateGroupDialog`:
  - [ ] Group name input
  - [ ] Group image upload (`AvatarUpload` reuse)
  - [ ] Member search and selection (prioritize contacts)
- [ ] Build group chat view (`/groups/[groupId]`, extends private chat view):
  - [ ] `GroupHeader` — name, image, member count
  - [ ] Group info panel (show members, settings)
  - [ ] System messages (join, leave, nickname change)
  - [ ] Multiple typing indicators ("Alice, Bob are typing...")
- [ ] Build group settings page (`/groups/[groupId]/settings`):
  - [ ] Edit name and image (admin/owner)
  - [ ] Toggle join requests (admin/owner)
  - [ ] `GroupMemberList` with `GroupMemberItem` rows
  - [ ] `RoleSelector` — promote/demote members (owner/admin)
  - [ ] Remove members (owner/admin)
  - [ ] Leave group option
- [ ] Build group nickname management
- [ ] Build `JoinRequestCard` — join request approval UI (for admins)
- [ ] Build group mute/archive/delete-locally options

### Acceptance Criteria

- Users can create groups with name, image, and initial members.
- Group role hierarchy (Owner > Admin > Member) enforced correctly.
- Ownership transfers automatically when owner leaves.
- Join request flow works end-to-end.
- Group nicknames work independently of contact nicknames.
- Group member changes generate system messages.

---

## Phase 5 — Moderation System

**Goal:** Implement the report system, admin user management, ban system, and base admin dashboard.

### Dependencies
- Phase 4 (Groups — admins can moderate groups)

### Backend Tasks

- [ ] Create `Report` model
- [ ] Create `Ban` model
- [ ] Create `AdminLog` model
- [ ] Build `ReportService`:
  - [ ] Submit report (user, message, or group)
  - [ ] Capture message snapshot on message reports
  - [ ] List reports (with status filtering)
  - [ ] Claim report (assign reviewer)
  - [ ] Resolve report (with action + notes)
  - [ ] Dismiss report
- [ ] Build `AdminService`:
  - [ ] Search users (with private fields visible)
  - [ ] View full user profile
  - [ ] View conversation messages (including unsent)
  - [ ] Warn user
  - [ ] Ban user (temporary or permanent)
  - [ ] Unban user
  - [ ] Delete (archive) group
  - [ ] Manage admin roles (super admin only)
- [ ] Implement ban enforcement:
  - [ ] Check ban status on login
  - [ ] Check ban status on Socket.IO connection
  - [ ] Temporary ban expiry handling
- [ ] Implement admin auth middleware (role-based access control)
- [ ] Implement audit logging (every admin action → `adminLogs` collection)
- [ ] Build admin-specific REST endpoints (see API_DESIGN.md Section 12)

### Frontend Tasks

- [ ] Build `(admin)` route group layout with `AdminSidebar` component
- [ ] Build admin dashboard home (`/admin`) — `MetricCard` overview metrics
- [ ] Build user management page (`/admin/users`):
  - [ ] User search with all fields
  - [ ] Full user profile view (`/admin/users/[userId]`)
  - [ ] `WarnDialog` and `BanDialog` action modals
  - [ ] Role management (super admin)
- [ ] Build report queue page (`/admin/reports`):
  - [ ] `ReportCard` list — pending reports (sortable, filterable)
  - [ ] `ReportDetail` view (`/admin/reports/[reportId]`) with message snapshot
  - [ ] Claim/resolve/dismiss actions
  - [ ] Quick-action: ban user from report
- [ ] Build ban management page (`/admin/bans`):
  - [ ] Active bans list
  - [ ] Ban history
  - [ ] Unban action
- [ ] Build `ConversationViewer` (`/admin/messages/[conversationId]`) — read-only conversation browser
- [ ] Build group management page (`/admin/groups`) — view, archive groups

### Acceptance Criteria

- Users can report users, messages, and groups.
- Message snapshots are captured at report time.
- Admin dashboard shows all pending reports.
- Admins can review reports and take action (warn, ban, dismiss).
- Banned users cannot log in or connect to Socket.IO.
- Temporary bans auto-expire.
- All admin actions are logged in the audit trail.

---

## Phase 6 — Support System

**Goal:** Implement the support ticket system with threaded conversations between users and support staff.

### Dependencies
- Phase 5 (Admin roles, admin dashboard exists)

### Backend Tasks

- [ ] Create `SupportTicket` model
- [ ] Create `SupportMessage` model
- [ ] Build `SupportService`:
  - [ ] Create ticket
  - [ ] List user's tickets
  - [ ] Get ticket with messages
  - [ ] Reply to ticket (user or staff)
  - [ ] Update ticket status
  - [ ] Assign ticket to staff
- [ ] Build admin support endpoints:
  - [ ] List all tickets (filterable by status)
  - [ ] Assign ticket
  - [ ] Update ticket status
  - [ ] Reply as staff
- [ ] Implement real-time notifications for new tickets and replies

### Frontend Tasks

- [ ] Build user-facing support pages:
  - [ ] Create ticket form (`/support/create`)
  - [ ] Ticket list (`/support`) — my tickets
  - [ ] Ticket detail with threaded messages (`/support/[ticketId]`)
  - [ ] Reply to ticket
- [ ] Build admin support section:
  - [ ] Support ticket queue (`/admin/support`) — filterable by status
  - [ ] `TicketCard` list component
  - [ ] Ticket detail with thread (`/admin/support/[ticketId]`)
  - [ ] Assign/claim ticket
  - [ ] Status transition controls
  - [ ] Reply as staff

### Acceptance Criteria

- Users can create support tickets with reason and message.
- Support staff can view, claim, and respond to tickets.
- Conversations are threaded within each ticket.
- Ticket status transitions work correctly.
- Real-time notifications alert staff of new tickets and user replies.

---

## Phase 7 — Analytics & Hardening

**Goal:** Add analytics dashboard, finalize audit logs, harden rate limiting and spam prevention.

### Dependencies
- Phase 6 (All features exist — this phase hardens them)

### Backend Tasks

- [ ] Build analytics aggregation service:
  - [ ] Total users count
  - [ ] Active users (DAU/MAU)
  - [ ] Messages sent per day/week/month
  - [ ] Groups created over time
  - [ ] Reports submitted over time
  - [ ] Banned users count
- [ ] Implement analytics caching (compute periodically, cache results)
- [ ] Harden rate limiting:
  - [ ] Tiered per-endpoint limits
  - [ ] Per-user and per-IP rate limiting
  - [ ] Socket.IO event rate limiting
- [ ] Implement spam prevention:
  - [ ] Message frequency detection
  - [ ] Duplicate message detection
  - [ ] Contact request spam detection
  - [ ] Report abuse detection (mass reporting prevention)
- [ ] Finalize admin activity log browsing endpoints
- [ ] Implement log filtering (by admin, action, date range)
- [ ] Add request ID tracking for debugging (correlation IDs)
- [ ] Implement graceful shutdown handling

### Frontend Tasks

- [ ] Build analytics dashboard page (`/admin/analytics`):
  - [ ] `MetricCard` key metrics (total users, active, messages/day)
  - [ ] `AnalyticsChart` wrapper for charts (user growth, message volume, reports over time)
  - [ ] Date range selector
- [ ] Build admin activity log viewer (`/admin/logs`):
  - [ ] Chronological `AdminLogEntry` list
  - [ ] Filters (by admin, action type, date range)
  - [ ] Log detail view
- [ ] Optimize frontend performance:
  - [ ] `InfiniteScroll` virtual scrolling for long message lists
  - [ ] Image lazy loading
  - [ ] `ConnectionStatus` indicator in app layout
- [ ] Add `ErrorBoundary` component wrapping each route group
- [ ] Add `LoadingSkeleton` components for all data-fetching pages
- [ ] Optimize marketing pages for Core Web Vitals (LCP, CLS, INP)

### Acceptance Criteria

- Admin dashboard displays accurate analytics metrics.
- Charts show trends over selectable time periods.
- Rate limiting prevents abuse without affecting normal users.
- Spam detection flags or throttles suspicious activity.
- Admin activity logs are browsable and filterable.
- Application handles edge cases gracefully (network loss, errors).

---

## Phase 8 — Future Expansion

**Goal:** Prepare for mobile app, cloud storage migration, and new feature types.

### Dependencies
- All previous phases

### Backend Tasks

- [ ] Audit API for mobile compatibility (ensure all endpoints are stateless, no web-specific assumptions)
- [ ] Implement device-aware push notification system (FCM/APNs)
- [ ] Build `CloudStorageAdapter` (S3 or GCS)
- [ ] Create media migration script (move local files to cloud)
- [ ] Implement secure signed URLs for media access
- [ ] Add voice message support (recording upload endpoint + message type)
- [ ] Enhance file sharing (preview generation, additional format support)
- [ ] Add Redis adapter for Socket.IO (multi-instance scaling)
- [ ] Implement message search within conversations
- [ ] Consider MongoDB sharding strategy for messages collection

### Frontend Tasks (Web Enhancements)

- [ ] Push notification support (Web Push API)
- [ ] Voice message recording and playback
- [ ] Advanced file preview (PDF viewer, code syntax highlighting)
- [ ] Message search UI
- [ ] Theme customization (dark mode toggle)
- [ ] Keyboard shortcuts for power users
- [ ] Accessibility audit and improvements (ARIA, keyboard navigation)

### Mobile Application (Separate Project)

- [ ] Set up React Native or Flutter project
- [ ] Implement auth flow with secure token storage
- [ ] Build chat UI (message list, input, media)
- [ ] Integrate Socket.IO for real-time features
- [ ] Implement push notifications (FCM/APNs)
- [ ] Design mobile-specific UX patterns (swipe actions, etc.)

### Acceptance Criteria

- Mobile app can authenticate and use all existing features via the same API.
- Media storage migrated to cloud without data loss.
- Voice messages can be recorded and played back.
- Application scales horizontally with multiple server instances.

---

## Implementation Principles

1. **Phase gates:** Do not start a phase until the previous phase's acceptance criteria are fully met.
2. **Vertical slices:** Within each phase, build full vertical slices (backend endpoint + frontend UI) rather than all backend then all frontend.
3. **Test as you go:** Write tests for each service method and API endpoint within the same phase.
4. **Review points:** At the end of each phase, review architecture decisions and adjust the plan for subsequent phases if needed.
5. **Documentation:** Update this roadmap document as phases are completed (check off tasks, note any deviations).
