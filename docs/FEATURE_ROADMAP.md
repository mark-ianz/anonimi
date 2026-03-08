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
  - [ ] Registration with email (hash password with bcrypt)
  - [ ] Email verification with time-limited codes
  - [ ] Login with email + password
  - [ ] JWT access token generation (15-min expiry)
  - [ ] JWT refresh token generation and rotation (7-day expiry)
  - [ ] Refresh token storage and revocation
  - [ ] Password reset (forgot + reset endpoints)
  - [ ] Logout (invalidate refresh token)
- [ ] Build `UserService`:
  - [ ] Get own profile (`GET /api/users/me`)
  - [ ] Update profile (`PATCH /api/users/me`)
  - [ ] Upload avatar (`POST /api/users/me/avatar`)
  - [ ] User search by EchoID and username (`GET /api/users/search`)
  - [ ] Get public profile (`GET /api/users/:echoId`)
- [ ] Set up auth middleware (JWT verification)
- [ ] Set up validation middleware (Zod schemas per route)
- [ ] Implement health check endpoint (`GET /api/health`)
- [ ] Set up request logging (morgan or pino)

### Frontend Tasks

- [ ] Install and configure shadcn/ui
- [ ] Install and configure TanStack Query
- [ ] Install and configure Zustand
- [ ] Set up API client (Axios or fetch wrapper) with auth interceptor
- [ ] Build auth pages:
  - [ ] Registration page
  - [ ] Email verification page
  - [ ] Login page
  - [ ] Forgot password page
  - [ ] Reset password page
- [ ] Build user profile page (view own profile, edit)
- [ ] Build user search page/component
- [ ] Build public profile view (view another user)
- [ ] Implement auth state management (Zustand store)
- [ ] Set up protected route wrapper
- [ ] Build base layout (sidebar, header, main content area)

### Acceptance Criteria

- Users can register with email, verify, and log in.
- JWT tokens work correctly with refresh rotation.
- Users can view and edit their profiles.
- Users can search for other users by EchoID or username.
- Public profiles show only public information (no email/phone).

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
- [ ] Build Socket.IO connection manager (with auth + reconnect)
- [ ] Build conversation list sidebar
- [ ] Build chat view:
  - [ ] Message list with infinite scroll (upward for older messages)
  - [ ] Message input area
  - [ ] Message bubbles (sent vs. received styling)
  - [ ] Scroll-to-bottom behavior for new messages
- [ ] Build contacts page:
  - [ ] Contacts list
  - [ ] Incoming requests tab
  - [ ] Send contact request (from profile or search)
  - [ ] Accept/decline request actions
  - [ ] Contact nickname management
- [ ] Create Zustand store for active conversation state
- [ ] Create Zustand store for socket connection state
- [ ] Integrate TanStack Query for conversation/message fetching
- [ ] Implement cursor-based pagination hook

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

- [ ] Build message requests section (separate tab or section in sidebar)
- [ ] Build accept/ignore/add-to-contacts actions
- [ ] Build block/unblock functionality (from profile view)
- [ ] Build block list page
- [ ] Implement typing indicators:
  - [ ] Detect input activity → emit typing events
  - [ ] Debounce at 2-second intervals
  - [ ] Display "User is typing..." in chat view
- [ ] Implement read receipts:
  - [ ] Emit read events when conversation is focused
  - [ ] Display sent/delivered/read indicators on messages
- [ ] Implement presence indicators:
  - [ ] Online/offline dot on avatars
  - [ ] "Last seen" display
- [ ] Build media upload UI:
  - [ ] Image attachment button in chat input
  - [ ] File attachment button
  - [ ] Upload progress indicator
  - [ ] Image preview in messages
  - [ ] File download link in messages
- [ ] Build message deletion UI:
  - [ ] Long-press/right-click context menu
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

- [ ] Build group creation dialog:
  - [ ] Group name input
  - [ ] Group image upload
  - [ ] Member search and selection (prioritize contacts)
- [ ] Build group chat view (extends private chat view):
  - [ ] Group header with name, image, member count
  - [ ] Group info panel (show members, settings)
  - [ ] System messages (join, leave, nickname change)
  - [ ] Multiple typing indicators ("Alice, Bob are typing...")
- [ ] Build group settings page:
  - [ ] Edit name and image (admin/owner)
  - [ ] Toggle join requests (admin/owner)
  - [ ] View member list with roles
  - [ ] Promote/demote members (owner/admin)
  - [ ] Remove members (owner/admin)
  - [ ] Leave group option
- [ ] Build group nickname management
- [ ] Build join request approval UI (for admins)
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

- [ ] Build admin layout (separate from user layout)
- [ ] Build admin dashboard home (overview metrics)
- [ ] Build user management page:
  - [ ] User search with all fields
  - [ ] Full user profile view
  - [ ] Warn/ban/unban actions
  - [ ] Role management (super admin)
- [ ] Build report queue page:
  - [ ] List pending reports (sortable, filterable)
  - [ ] Report detail view (with message snapshot)
  - [ ] Claim/resolve/dismiss actions
  - [ ] Quick-action: ban user from report
- [ ] Build ban management page:
  - [ ] Active bans list
  - [ ] Ban history
  - [ ] Unban action
- [ ] Build message viewer for admins (read-only conversation browser)
- [ ] Build group management page (view, archive groups)

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
  - [ ] Create ticket form
  - [ ] Ticket list (my tickets)
  - [ ] Ticket detail with threaded messages
  - [ ] Reply to ticket
- [ ] Build admin support section:
  - [ ] Support ticket queue (filterable)
  - [ ] Ticket detail with thread
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

- [ ] Build analytics dashboard page:
  - [ ] Key metrics cards (total users, active, messages/day)
  - [ ] Charts (user growth, message volume, reports over time)
  - [ ] Date range selector
- [ ] Build admin activity log viewer:
  - [ ] Chronological log list
  - [ ] Filters (by admin, action type, date range)
  - [ ] Log detail view
- [ ] Optimize frontend performance:
  - [ ] Virtual scrolling for long message lists
  - [ ] Image lazy loading
  - [ ] Connection state indicator in UI
- [ ] Add error boundary components
- [ ] Add loading skeletons for all data-fetching components

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
