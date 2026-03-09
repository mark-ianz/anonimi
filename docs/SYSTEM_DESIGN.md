# System Design

This document provides detailed design specifications for every core subsystem of EchoID. Each section describes the data flow, business rules, edge cases, and key decisions for a specific feature area.

---

## 1. User Identity System

### EchoID Generation

Every user receives a permanent EchoIDentifier at account creation. This ID is the primary mechanism for user discovery and contact sharing.

**Format:** `eid_` + 8 URL-safe alphanumeric characters  
**Example:** `eid_a8F3kP29`  
**Character Set:** `A-Z`, `a-z`, `0-9` (62 characters)  
**Library:** `nanoid` with custom alphabet  

**Collision Probability:**  
With 62^8 ≈ 218 trillion possible combinations, collision probability remains negligible at any realistic scale. At 1 million users, the probability of any collision is approximately 0.00000046%.

**Collision Handling:**  
Despite negligible probability, the system must handle collisions gracefully:

1. Generate candidate ID using `nanoid`.
2. Check uniqueness against `users.echoId` index (unique index enforced at DB level).
3. If duplicate (MongoDB throws duplicate key error), regenerate and retry (max 3 attempts).
4. If all retries fail, return a server error (this should never happen in practice).

**Immutability:**  
Once assigned, a EchoID can **never** be changed. It is permanently bound to the account. This ensures that shared IDs always resolve to the correct user.

### Username

- Usernames are chosen by the user during registration.
- Must be unique (case-insensitive uniqueness enforced via lowercased index).
- Length: 3–30 characters.
- Allowed characters: letters, numbers, underscores, periods.
- Regex: `^[a-zA-Z0-9_.]{3,30}$`
- Users can change their username (subject to availability and rate limiting — max once per 30 days).

---

## 2. Authentication System

### Registration Flow

```
Client                          Server
  │                               │
  │  POST /api/auth/register      │
  │  { email/phone, username,     │
  │    password }                  │
  │──────────────────────────────▶│
  │                               │── Validate input (Zod schema)
  │                               │── Check email/phone uniqueness
  │                               │── Check username uniqueness
  │                               │── Hash password (bcrypt, 12 rounds)
  │                               │── Generate EchoID (nanoid)
  │                               │── Create user document (status: pending)
  │                               │── Generate verification code/link
  │                               │── Send verification email/SMS
  │                               │
  │  { success, message:          │
  │    "Verification sent" }      │
  │◀──────────────────────────────│
  │                               │
  │  POST /api/auth/verify-email  │
  │  { email, code }              │
  │──────────────────────────────▶│
  │                               │── Verify code (time-limited, 15 min)
  │                               │── Update user status: active
  │                               │── Generate JWT tokens
  │                               │
  │  { accessToken, refreshToken, │
  │    user }                     │
  │◀──────────────────────────────│
```

### Login Flow

```
Client                          Server
  │                               │
  │  POST /api/auth/login         │
  │  { email/phone, password }    │
  │──────────────────────────────▶│
  │                               │── Find user by email or phone
  │                               │── Check account status (active/banned)
  │                               │── Compare password hash (bcrypt)
  │                               │── Generate JWT access + refresh tokens
  │                               │── Update lastSeen timestamp
  │                               │
  │  { accessToken, refreshToken, │
  │    user }                     │
  │◀──────────────────────────────│
```

### JWT Token Strategy

| Token | Lifetime | Storage (Web) | Storage (Mobile) | Purpose |
|-------|----------|---------------|-------------------|---------|
| **Access Token** | 15 minutes | httpOnly cookie | Secure storage | Authenticates API requests |
| **Refresh Token** | 7 days | httpOnly cookie | Secure storage | Obtains new access tokens |

**Token Payload (Access Token):**
```json
{
  "userId": "ObjectId",
  "echoId": "eid_a8F3kP29",
  "role": "user",
  "iat": 1700000000,
  "exp": 1700000900
}
```

**Token Rotation:**
- When an access token expires, the client calls `POST /api/auth/refresh-token` with the refresh token.
- Server verifies the refresh token, issues a new access token AND a new refresh token (rotation).
- The old refresh token is invalidated (stored in a revocation list or replaced in the user document).
- If a refresh token is reused (replay attack), all refresh tokens for that user are invalidated.

**Token Revocation:**
- On logout, the refresh token is invalidated.
- On password change, all existing refresh tokens are invalidated.
- On account ban, all tokens are invalidated.

### Password Reset Flow

```
1. User requests reset → POST /api/auth/forgot-password { email }
2. Server generates time-limited reset token (1 hour expiry)
3. Server sends reset link via email
4. User clicks link → POST /api/auth/reset-password { token, newPassword }
5. Server verifies token, hashes new password, invalidates all sessions
```

---

## 3. Messaging System

### Private Message Flow

```
Sender Client              Server                    Recipient Client
    │                        │                              │
    │  socket: message:send  │                              │
    │  { conversationId,     │                              │
    │    content, type }     │                              │
    │───────────────────────▶│                              │
    │                        │── Validate sender auth       │
    │                        │── Check if blocked           │
    │                        │── Check message request      │
    │                        │   status (if non-contact)    │
    │                        │── Validate content           │
    │                        │── Create message document    │
    │                        │── Update conversation        │
    │                        │   lastMessage + updatedAt    │
    │                        │                              │
    │  socket: message:ack   │  socket: message:receive     │
    │  { messageId,          │  { messageId, senderId,      │
    │    timestamp }         │    content, type, timestamp } │
    │◀───────────────────────│─────────────────────────────▶│
```

**Message Processing Rules:**
1. If sender is blocked by recipient → reject with error, do not persist.
2. If no existing conversation → create conversation document, then check contact status.
3. If recipient is NOT in sender's contacts → route to message requests (see Section 5).
4. Persist message to MongoDB with `createdAt` timestamp.
5. Emit acknowledgment to sender (confirms delivery to server).
6. Emit message event to recipient room.
7. If recipient is offline, the message persists in DB and is fetched on next login.

### Supported Message Types

| Type | Content Field | Media Field | Notes |
|------|---------------|-------------|-------|
| `text` | Text string (max 5000 chars) | `null` | Standard text message |
| `image` | Optional caption | `mediaUrl` pointing to uploaded image | Upload via REST first, then send message with URL |
| `file` | Optional description | `mediaUrl` + `fileName` + `fileSize` | Same upload-first pattern |
| `system` | System message text | `null` | Auto-generated (e.g., "User changed nickname") |

### Media Message Flow

Media attachments are uploaded via REST **before** the message is sent via WebSocket:

```
1. Client uploads file → POST /api/media/upload (multipart form)
2. Server validates file (type, size), stores via MediaService
3. Server returns { url: "/uploads/messages/uuid.jpg" }
4. Client sends message via socket with mediaUrl included
5. Server persists message with mediaUrl reference
```

This decouples upload (which can be slow) from message delivery (which must be instant).

---

## 4. Message Pagination (Cursor-Based)

### Why Cursor-Based (Not Offset)

| Approach | Problem at Scale |
|----------|------------------|
| Offset (`SKIP N`) | Becomes O(N) slower as offset increases. New messages shift offsets, causing duplicates or missed messages. |
| Cursor (keyset) | Consistent O(1) performance regardless of conversation size. Immune to data shifting. |

### Cursor Strategy

The cursor is the `_id` (MongoDB ObjectId) of the last message in the current page. Since ObjectIds are time-ordered, pagination using `_id` provides chronological ordering without a separate index.

### Initial Load (Latest Messages)

```
GET /api/messages?conversationId=abc123&limit=30

Query: messages
  .find({ conversationId: "abc123" })
  .sort({ _id: -1 })      // newest first
  .limit(31)               // fetch limit+1 to determine hasMore

Response:
{
  "data": [ msg30, msg29, ..., msg1 ],   // 30 messages, newest first
  "pagination": {
    "nextCursor": "msg1._id",             // oldest message's _id
    "hasMore": true                       // 31st message existed
  }
}
```

The client reverses the array to display messages in chronological order (oldest at top, newest at bottom).

### Load Older Messages (Scroll Up)

```
GET /api/messages?conversationId=abc123&cursor=60d5ecb54b24a1001c8e4b3a&limit=30

Query: messages
  .find({
    conversationId: "abc123",
    _id: { $lt: ObjectId("60d5ecb54b24a1001c8e4b3a") }  // older than cursor
  })
  .sort({ _id: -1 })
  .limit(31)
```

### Filtered Pagination (Delete-for-Me)

Messages where the current user is in the `deletedFor` array are excluded:

```
.find({
  conversationId: "abc123",
  _id: { $lt: cursor },
  deletedFor: { $ne: currentUserId }
})
```

---

## 5. Message Request System

### Problem

When a non-contact sends a message, the recipient should have control over whether to engage. The message request system acts as a gatekeeper.

### Flow

```
User A (non-contact)                    User B
    │                                     │
    │  Sends message to User B            │
    │────────────────────────────────────▶│
    │                                     │
    │  Message stored in DB               │
    │  Conversation created with          │
    │  requestStatus: "pending"           │
    │                                     │
    │                            ┌────────┤
    │                            │ Message │
    │                            │ appears │
    │                            │ in      │
    │                            │ Message │
    │                            │Requests │
    │                            │ section │
    │                            └────────┤
    │                                     │
    │                  OPTIONS:           │
    │                  ┌─ Accept message ─── Moves conversation to main inbox
    │                  │                     User A can continue messaging
    │                  ├─ Accept + Add ───── Same as above + creates contact
    │                  │  to contacts        relationship
    │                  └─ Ignore request ─── Conversation hidden
    │                                        User A is not notified
```

### Data Model

The `conversations` collection includes a `requestStatus` field for private conversations:

| Value | Meaning |
|-------|---------|
| `null` | Both users are contacts — normal conversation |
| `"pending"` | Message request sent, awaiting recipient action |
| `"accepted"` | Recipient accepted the message request |
| `"ignored"` | Recipient ignored the request |

### Rules

- Only the **first message** from a non-contact triggers a message request. Subsequent messages from the same sender within the same conversation do not create additional requests.
- Ignored conversations can still be accepted later (they are hidden, not deleted).
- If the sender is blocked, no message request is created — the message is simply rejected.

---

## 6. Message Deletion System

Three distinct deletion modes serve different purposes:

### Delete for Me

- Adds the user's ID to the message's `deletedFor` array.
- The message is filtered out in queries for that user only.
- Other participants still see the message normally.
- Irreversible — there is no "undo delete for me."

```json
// Before
{ "_id": "msg1", "content": "Hello", "deletedFor": [] }

// After (User A deletes for self)
{ "_id": "msg1", "content": "Hello", "deletedFor": ["userA_id"] }
```

### Unsend Message

- Available only to the **sender** of the message.
- Time-limited: can only unsend within a configurable window (e.g., 24 hours).
- Sets `unsent: true` on the message document.
- The original `content` is **preserved** in the database (for admin moderation) but is not returned to clients.
- Clients display a placeholder: *"This message was unsent"*.
- A `system` message may optionally be created to indicate the unsend action.

```json
// Before
{ "_id": "msg1", "content": "Hello", "unsent": false }

// After unsend
{ "_id": "msg1", "content": "Hello", "unsent": true }
// API returns: { "content": null, "unsent": true }
```

### Admin Archive

- **No message is ever permanently deleted from the database.**
- Even after "delete for me" or "unsend," the full message content remains in MongoDB.
- Admin endpoints can query messages including unsent and deleted-for-all messages.
- This ensures moderation teams always have access to complete conversation histories.

### Deletion Permission Matrix

| Action | Who Can Do It | Time Limit | Effect on DB |
|--------|---------------|------------|--------------|
| Delete for me | Any participant | None | Adds userId to `deletedFor` |
| Unsend | Sender only | 24 hours | Sets `unsent: true` |
| Admin view | Admin roles only | N/A | Full content always accessible |

---

## 7. Contact System

### Contact Request Flow

```
User A                         Server                      User B
  │                              │                           │
  │  POST /api/contacts/request  │                           │
  │  { targetEchoId }          │                           │
  │─────────────────────────────▶│                           │
  │                              │── Validate target exists  │
  │                              │── Check not already       │
  │                              │   contacts or pending     │
  │                              │── Check not blocked       │
  │                              │── Create contact document │
  │                              │   (status: pending)       │
  │                              │                           │
  │                              │  socket: contact:request  │
  │                              │  { from: UserA profile }  │
  │                              │──────────────────────────▶│
  │                              │                           │
  │                              │        User B accepts     │
  │                              │◀──────────────────────────│
  │                              │── Update contact status:  │
  │                              │   accepted                │
  │                              │── Create reciprocal       │
  │                              │   contact record          │
  │                              │                           │
  │  socket: contact:accepted    │                           │
  │  { contact: UserB profile }  │                           │
  │◀─────────────────────────────│                           │
```

### Contact Nicknames

- Each user can assign a private nickname to any contact.
- Nicknames are stored on the `contacts` document (per-user, per-contact).
- Nicknames do not affect the contact's actual username.
- API returns both the actual username and the nickname (if set).
- Nickname changes **optionally** generate a system message in the conversation:
  *"User A set your nickname to 'Best Friend'"*
- This system message feature is configurable (opt-in per user in settings).

### Contact Data Model (Bidirectional)

When User A sends a request and User B accepts:

```
contacts collection:
  { userId: A, contactId: B, nickname: null, status: "accepted" }
  { userId: B, contactId: A, nickname: null, status: "accepted" }
```

Two documents are created — one for each direction. This simplifies queries (always filter by `userId`) and allows independent nicknames.

---

## 8. Block System

### Blocking Behavior

When User A blocks User B:

| Action | Result |
|--------|--------|
| B sends message to A | Rejected (silently or with error, B does not know they are blocked) |
| B sends contact request to A | Rejected silently |
| B views A's profile | Online status hidden, shows as "unavailable" |
| A's messages to B | Not delivered (A chose to block, so A cannot message B either) |
| Existing conversation | Hidden from both users' conversation lists |

### Block Cooldown

To prevent block/unblock abuse (e.g., blocking someone to hide, then unblocking to message again), a cooldown is enforced:

- When User A unblocks User B, `lastUnblockedAt` is recorded.
- User A cannot re-block User B for a configurable period (default: 48 hours).
- This prevents weaponized blocking.

### Block Data Flow

```
POST /api/blocks { targetUserId }
  → Validate target exists
  → Check cooldown (if previously unblocked)
  → Create block document { blockerId, blockedId, createdAt }
  → Remove any existing contact relationship (both directions)
  → Cancel any pending contact requests
  → Emit presence update (blocked user sees "offline")
```

```
DELETE /api/blocks/:blockId
  → Verify ownership (only blocker can unblock)
  → Remove block document
  → Record lastUnblockedAt on user's block history
  → Note: Contact relationship is NOT automatically restored
```

---

## 9. Group Chat System

### Group Creation

```
POST /api/groups
{
  "name": "Project Team",
  "image": null,
  "memberIds": ["echoId1", "echoId2", "echoId3"]
}
```

- Creator automatically becomes the **Owner**.
- A conversation document is created with `type: "group"`.
- A `groups` document is created with settings.
- `groupMembers` documents are created for each member.
- Members who are in the creator's contacts are added immediately.
- Members who are NOT in the creator's contacts receive a **message request** style invitation.

### Role Hierarchy

```
Owner (1 per group)
  │
  ├── Can do everything
  ├── Can promote/demote admins
  ├── Can transfer ownership
  ├── Can delete group
  │
  ▼
Admin (0+ per group)
  │
  ├── Can add/remove members
  ├── Can promote members to admin
  ├── Can enable/disable join requests
  ├── Cannot remove other admins
  ├── Cannot remove owner
  │
  ▼
Member (0+ per group)
  │
  ├── Can send messages
  ├── Can leave group
  ├── Can set group nickname
  └── Can mute/archive group
```

### Ownership Transfer

If the owner leaves the group:

1. If there are admins → ownership transfers to the **longest-serving admin** (earliest `joinedAt`).
2. If no admins → ownership transfers to the **longest-serving member**.
3. If no members remain → group is **automatically deleted** (soft-deleted, archived for admin).

The owner can also explicitly transfer ownership via:

```
PATCH /api/groups/:id/members/:userId/role { role: "owner" }
```

This demotes the current owner to admin and promotes the target to owner.

### Join Request Flow

Groups can enable "Request to Join" mode:

```
Group Settings: { joinRequestEnabled: true }

User                           Server                     Group Admins
  │                              │                            │
  │  POST /groups/:id/           │                            │
  │       join-request           │                            │
  │─────────────────────────────▶│                            │
  │                              │── Create join request      │
  │                              │   (status: pending)        │
  │                              │                            │
  │                              │  socket: group:join-request│
  │                              │──────────────────────────▶ │
  │                              │                            │
  │                              │    Admin approves/rejects  │
  │                              │◀───────────────────────────│
  │                              │                            │
  │  socket: group:join-approved │                            │
  │  or group:join-rejected      │                            │
  │◀─────────────────────────────│                            │
```

### Group Nicknames

- Separate from contact nicknames — each user can have a different nickname per group.
- Stored in the `groupMembers` document.
- Nickname changes generate a system message in the group conversation:
  *"Alice changed their nickname to 'Ally'"*
- Group nicknames override display name within that group context only.

---

## 10. Presence System

### Online Status Tracking

User presence is tracked via Socket.IO connection state:

```
Connection established → User marked "online"
Disconnection detected → Wait 10 seconds (grace period for reconnects)
                       → If not reconnected, mark "offline"
                       → Update lastSeen timestamp
```

**Grace Period:** A 10-second delay between disconnection and "offline" status prevents flickering during brief network interruptions.

### Presence Data Flow

```
User connects to Socket.IO (/chat namespace)
  → Auth middleware verifies JWT
  → Server updates user.onlineStatus = "online"
  → Server joins user to their conversation rooms
  → Server broadcasts to all user's conversations:
      presence:update { userId, status: "online" }

User disconnects
  → Server sets 10s timeout
  → If no reconnection within 10s:
      → Update user.onlineStatus = "offline"
      → Update user.lastSeen = now
      → Broadcast: presence:update { userId, status: "offline", lastSeen }
```

### Privacy Rules

- Blocked users never receive presence updates for the blocker.
- Users can optionally hide their online status (future setting).
- `lastSeen` is only visible to contacts (not to arbitrary users).

---

## 11. Typing Indicators

### Flow

```
User A starts typing
  → Client detects input activity
  → Client emits: typing:start { conversationId }
  → Server broadcasts to conversation room (excluding sender):
      typing:start { conversationId, userId }

User A stops typing (3-second inactivity or message sent)
  → Client emits: typing:stop { conversationId }
  → Server broadcasts: typing:stop { conversationId, userId }
```

### Debouncing

- Client-side: Debounce typing events — emit `typing:start` at most once every 2 seconds.
- Client-side: Auto-emit `typing:stop` after 3 seconds of no input.
- Server-side: Auto-expire typing status after 5 seconds (safety net if `typing:stop` is lost).

### Group Typing

In group chats, multiple users can be typing simultaneously. The client maintains a list of currently-typing users and displays them:

*"Alice, Bob are typing…"*  
*"Alice is typing…"*  
*"Several people are typing…"* (3+ users)

---

## 12. Read Receipts

### Flow

```
Recipient opens conversation
  → Client identifies unread messages
  → Client emits: message:read { conversationId, messageIds: [...] }
  → Server updates messages: adds userId to readBy array
  → Server broadcasts to conversation room:
      message:read { conversationId, messageIds, readBy: userId }

Sender's client receives event
  → Updates local message state to show read status
```

### Read Status Display

| Status | Condition |
|--------|-----------|
| Sent | Message persisted on server (acknowledged) |
| Delivered | Recipient's client received the message event (online) |
| Read | Recipient's userId is in message's `readBy` array |

### Group Read Receipts

In groups, `readBy` contains multiple user IDs. UI can show:
- "Read by 5 of 12" 
- Expandable list of who has read

---

## 13. Report System

### Report Types

| Target | What is Reported |
|--------|-----------------|
| **User** | A user's profile or behavior |
| **Message** | A specific message's content |
| **Group** | A group's name, image, or activity |

### Report Reasons (Enum)

- `spam`
- `harassment`
- `scam`
- `impersonation`
- `hate_speech`
- `illegal_content`
- `other` (requires description)

### Message Snapshot

When reporting a message, the system captures a **snapshot** of the message content at the time of the report:

```json
{
  "reportId": "...",
  "targetType": "message",
  "targetId": "messageId",
  "messageSnapshot": {
    "content": "Original message text",
    "type": "text",
    "senderId": "...",
    "senderUsername": "john_doe",
    "conversationId": "...",
    "createdAt": "2026-03-08T12:00:00Z",
    "mediaUrl": null
  }
}
```

This snapshot ensures that even if the sender unsends the message or it is otherwise modified, the moderation team has the original evidence.

### Report Status Lifecycle

```
pending → under_review → resolved | dismissed
```

- `pending` — New report, awaiting admin attention.
- `under_review` — An admin has claimed the report and is investigating.
- `resolved` — Action was taken (warning, ban, etc.).
- `dismissed` — Report found invalid or insufficient.

---

## 14. Support Ticket System

### Ticket Flow

```
User                           Server                      Support Staff
  │                              │                              │
  │  POST /api/support/tickets   │                              │
  │  { subject, reason, message }│                              │
  │─────────────────────────────▶│                              │
  │                              │── Create ticket (open)       │
  │                              │── Create first message       │
  │                              │                              │
  │                              │  Appears in admin dashboard  │
  │                              │─────────────────────────────▶│
  │                              │                              │
  │                              │  Staff replies               │
  │                              │◀─────────────────────────────│
  │                              │── Create reply message       │
  │                              │                              │
  │  notification: new reply     │                              │
  │◀─────────────────────────────│                              │
  │                              │                              │
  │  User replies                │                              │
  │─────────────────────────────▶│                              │
  │                              │── Create reply message       │
  │                              │                              │
  │                              │  notification: user replied  │
  │                              │─────────────────────────────▶│
  │                              │                              │
  │                              │  Staff resolves ticket       │
  │                              │◀─────────────────────────────│
  │                              │── Update status: resolved    │
  │                              │                              │
  │  notification: ticket closed │                              │
  │◀─────────────────────────────│                              │
```

### Ticket Statuses

| Status | Meaning |
|--------|---------|
| `open` | Newly created, awaiting staff |
| `assigned` | A staff member has claimed the ticket |
| `in_progress` | Staff is actively working on it |
| `waiting_on_user` | Staff needs more info from the user |
| `resolved` | Issue resolved, ticket closed |
| `closed` | Closed without resolution (e.g., duplicate, stale) |

### Ticket Reasons

- `account_recovery`
- `login_issues`
- `bug_report`
- `feature_request`
- `other`

---

## 15. Frontend Routing & Layout System

The web application is an enterprise SaaS platform built with Next.js App Router. The frontend uses four distinct route groups, each with its own layout, serving different audiences and purposes.

> For the complete frontend specification, see **FRONTEND_DESIGN.md**.

### Route Groups

| Route Group | URL Prefix | Layout | Audience |
|-------------|-----------|--------|----------|
| `(public)` | `/`, `/about`, `/features`, `/contact`, `/faq`, `/privacy`, `/terms` | Marketing (navbar + footer) | Everyone |
| `(auth)` | `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password` | Auth (centered card) | Unauthenticated users |
| `(main)` | `/app/*` | Application (sidebar + content + SocketProvider) | Authenticated users |
| `(admin)` | `/admin/*` | Admin (admin sidebar + content) | Admin/super-admin users |

### Authentication Routing Middleware

A single Next.js `middleware.ts` at the `src/` root intercepts every request and applies routing rules based on the `access_token` cookie:

```
Request ──▶ middleware.ts
              │
              ├── /app/* or /admin/* routes:
              │     ├── No access_token → redirect to /login
              │     └── Has access_token:
              │           ├── /admin/* + role ≠ admin → redirect to /app/chat
              │           └── Otherwise → allow
              │
              ├── /login, /register routes:
              │     ├── Has valid access_token → redirect to /app/chat
              │     └── No access_token → allow
              │
              └── Public routes (/, /about, etc.):
                    └── Always allow (no auth check)
```

### Layout Isolation

Each route group defines its own `layout.tsx`, ensuring:

1. **Marketing layout** — `MarketingNavbar` and `MarketingFooter` only render on public pages. No sidebar, no WebSocket connections.
2. **Auth layout** — Minimal centered card with logo. No navigation chrome.
3. **Application layout** — `AppSidebar` with navigation, `SocketProvider` for real-time features. WebSocket connects only when this layout mounts.
4. **Admin layout** — `AdminSidebar` with admin navigation. Separate from the main app sidebar.

### State Management Architecture

| Concern | Technology | Scope |
|---------|-----------|-------|
| Auth state (user, tokens) | Zustand (`authStore`) | Global |
| Active conversation, drafts | Zustand (`chatStore`) | Application |
| Socket connection status | Zustand (`socketStore`) | Application |
| Online presence map | Zustand (`presenceStore`) | Application |
| Typing indicators | Zustand (`typingStore`) | Application |
| UI state (sidebar, theme) | Zustand (`uiStore`) | Global |
| Server data (messages, contacts, groups) | TanStack Query | Application |

Zustand stores hold ephemeral client state. TanStack Query manages all server-fetched data with caching, background refetching, and optimistic updates.
