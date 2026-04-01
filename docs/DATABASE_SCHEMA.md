# Database Schema

This document defines the complete MongoDB schema for EchoID, including collection definitions, field types, indexes, and relationships.

**Database:** MongoDB (document-oriented)  
**ODM:** Mongoose (recommended for schema validation and middleware)

---

## Schema Conventions

- All documents include `_id` (MongoDB ObjectId, auto-generated).
- All documents include `createdAt` and `updatedAt` timestamps (via Mongoose `timestamps: true`).
- References between documents use ObjectId with `ref` for population.
- Soft deletion is preferred over hard deletion for moderation purposes.
- Field names use camelCase.
- Enum fields use snake_case string values.

---

## Collections Overview

| Collection | Purpose | Estimated Scale |
|------------|---------|-----------------|
| `users` | User accounts and profiles | 1 doc per user |
| `conversations` | Private and group conversation metadata | 1 doc per chat |
| `messages` | All messages across all conversations | Highest volume — millions |
| `contacts` | Bidirectional contact relationships | 2 docs per mutual contact pair |
| `groups` | Group chat settings and metadata | 1 doc per group |
| `groupMembers` | Group membership and per-group roles | 1 doc per member per group |
| `blocks` | Block relationships between users | 1 doc per active block |
| `messageRequests` | Pending message requests from non-contacts | 1 doc per pending request |
| `reports` | User/message/group reports | 1 doc per report |
| `supportTickets` | Support tickets from users | 1 doc per ticket |
| `supportMessages` | Threaded messages within support tickets | Multiple per ticket |
| `adminLogs` | Audit trail of admin actions | 1 doc per admin action |
| `bans` | Ban records for users | 1 doc per ban |
| `refreshTokens` | Active refresh tokens for JWT rotation | 1-N per user |
| `pushSubscriptions` | Web Push subscription storage | 1-N per user |

---

## 1. Users Collection

Stores user accounts, authentication data, and profile information.

```
Collection: users

{
  _id:              ObjectId,          // Auto-generated
  echoId:         String,            // "eid_a8F3kP29" — generated, immutable
  username:         String,            // "john_doe" — unique, user-provided or system-generated
  email:            String,            // "john@example.com" — unique, private
  phone:            String | null,     // "+1234567890" — optional, private, recovery-only
  passwordHash:     String,            // bcrypt hash
  profileImage:     String | null,     // URL/path to avatar
  role:             String,            // "user" | "super_admin" | "moderator" | "support_staff"
  status:           String,            // "pending" | "active" | "banned"
  onlineStatus:     String,            // "online" | "offline"
  lastSeen:         Date | null,       // Last activity timestamp
  emailVerified:    Boolean,           // Email verification status
  phoneVerified:    Boolean,           // Phone verification status (if phone added later)
  verificationCode: String | null,     // Temporary, for email verification
  verificationCodeExpiresAt: Date | null,
  emailVerificationTokenHash: String | null,
  emailVerificationTokenExpiresAt: Date | null,
  passwordResetToken:     String | null,
  passwordResetExpiresAt: Date | null,
  usernameChangedAt: Date | null,      // Records the single allowed manual username change
  createdAt:        Date,              // Auto (Mongoose timestamps)
  updatedAt:        Date               // Auto (Mongoose timestamps)
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ echoId: 1 }` | Unique | Fast lookup by EchoID, enforce uniqueness |
| `{ username: 1 }` | Unique | Fast lookup by username, enforce uniqueness |
| `{ email: 1 }` | Unique, Sparse | Fast lookup for auth, sparse allows null |
| `{ phone: 1 }` | Unique, Sparse | Fast lookup for auth, sparse allows null |
| `{ status: 1 }` | Regular | Filter by account status |
| `{ role: 1 }` | Regular | Filter admin/moderator users |
| `{ username: "text", echoId: "text" }` | Text | Full-text search on public fields |

### Notes

- `email` and `phone` are **never** returned in public API responses (projected out).
- `passwordHash` is **never** returned in any API response.
- `verificationCode` and `passwordResetToken` are temporary fields, cleared after use.
- `role` defaults to `"user"`. Admin roles are assigned by Super Admin only.
- The text index on `username` and `echoId` supports the user search feature.
- Registration requires email; phone can be added later for recovery/security.
- If username is omitted during registration, a crypto-random unique username is generated.
- Username manual edit is allowed once ever (applies to generated and custom usernames).

---

## 2. Conversations Collection

Represents a chat context (private 1:1 or group). Every message belongs to exactly one conversation.

```
Collection: conversations

{
  _id:              ObjectId,
  type:             String,            // "private" | "group"
  participants:     [ObjectId],        // Array of user _ids (both for private, all members for group)
  lastMessage: {                       // Denormalized for conversation list display
    content:        String | null,     // Preview text (truncated)
    senderId:       ObjectId,
    type:           String,            // "text" | "image" | "file" | "system"
    timestamp:      Date
  } | null,
  requestStatus:    String | null,     // null | "pending" | "accepted" | "ignored"
                                       // Only for private convos between non-contacts
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ participants: 1 }` | Regular | Find conversations by user |
| `{ participants: 1, type: 1 }` | Compound | Find private convos between two specific users |
| `{ updatedAt: -1 }` | Regular | Sort conversation list by most recent activity |
| `{ requestStatus: 1, participants: 1 }` | Compound | Query message requests for a user |

### Notes

- For private conversations, `participants` always has exactly 2 entries.
- For group conversations, `participants` contains all current members.
- `lastMessage` is denormalized (duplicated from the messages collection) for performance — avoids a join/populate when listing conversations.
- `requestStatus` is only relevant for private conversations. For groups, it is always `null`.

---

## 3. Messages Collection

The highest-volume collection. Stores every message across all conversations.

```
Collection: messages

{
  _id:              ObjectId,          // Also serves as cursor for pagination
  conversationId:   ObjectId,          // ref: conversations
  senderId:         ObjectId,          // ref: users
  type:             String,            // "text" | "image" | "file" | "system"
  content:          String | null,     // Text content (or caption for media)
  mediaUrl:         String | null,     // Path/URL for image or file
  fileName:         String | null,     // Original filename for file messages
  fileSize:         Number | null,     // File size in bytes
  readBy:           [ObjectId],        // Array of user _ids who have read this message
  readByAt:         Map<String, Date>, // Per-user read timestamp map (key: userId)
  deletedFor:       [ObjectId],        // Array of user _ids — message hidden from these users
  unsent:           Boolean,           // True if sender unsent the message
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ conversationId: 1, _id: -1 }` | Compound | Primary query: paginate messages in a conversation (cursor-based) |
| `{ conversationId: 1, createdAt: -1 }` | Compound | Fallback sort by timestamp |
| `{ senderId: 1 }` | Regular | Find messages by sender (admin queries) |
| `{ conversationId: 1, deletedFor: 1 }` | Compound | Efficient filtering of deleted messages |

### Notes

- **This is the most performance-critical collection.** The compound index on `{ conversationId, _id }` is essential for cursor-based pagination.
- `content` is preserved even when `unsent: true` — admin endpoints can access it, but client-facing APIs return `null` content for unsent messages.
- `readBy` starts as an empty array and accumulates user IDs as users read the message.
- `readByAt` stores the read timestamp for each reader (`userId -> Date`) to support "Read at" UX.
- `deletedFor` starts as an empty array. Users who delete-for-self are added here.
- `system` type messages have `senderId` set to `null` and are auto-generated by the server.

---

## 4. Contacts Collection

Stores contact relationships between users. Each accepted contact pair has **two documents** (one per direction) to simplify per-user queries.

```
Collection: contacts

{
  _id:              ObjectId,
  userId:           ObjectId,          // ref: users — the owner of this contact entry
  contactId:        ObjectId,          // ref: users — the contact user
  nickname:         String | null,     // Private nickname set by userId for contactId
  status:           String,            // "pending" | "accepted" | "declined"
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ userId: 1, contactId: 1 }` | Unique, Compound | Prevent duplicate contact entries, fast lookup |
| `{ userId: 1, status: 1 }` | Compound | List a user's contacts filtered by status |
| `{ contactId: 1, status: 1 }` | Compound | Find incoming requests for a user |

### Notes

- When User A sends a request to User B, one document is created: `{ userId: A, contactId: B, status: "pending" }`.
- When User B accepts, this document is updated to `"accepted"` AND a reciprocal document is created: `{ userId: B, contactId: A, status: "accepted" }`.
- When User B declines, the document is updated to `"declined"`. User A can send a new request later.
- Nicknames are per-direction — A's nickname for B is independent of B's nickname for A.

---

## 5. Groups Collection

Stores group-specific metadata. Linked to a conversation via the conversation's `_id`.

```
Collection: groups

{
  _id:              ObjectId,
  conversationId:   ObjectId,          // ref: conversations (type: "group")
  name:             String,            // Group name (required, 1-100 chars)
  image:            String | null,     // Group avatar URL/path
  ownerId:          ObjectId,          // ref: users — current group owner
  settings: {
    joinRequestEnabled: Boolean        // Default: false
  },
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ conversationId: 1 }` | Unique | 1:1 link between group and conversation |
| `{ ownerId: 1 }` | Regular | Find groups owned by a user |

---

## 6. Group Members Collection

Stores per-user membership data for each group, including roles and nicknames.

```
Collection: groupMembers

{
  _id:              ObjectId,
  groupId:          ObjectId,          // ref: groups
  userId:           ObjectId,          // ref: users
  role:             String,            // "owner" | "admin" | "member"
  nickname:         String | null,     // Per-group display nickname
  mutedUntil:       Date | null,       // Null = not muted, Date = muted until
  joinedAt:         Date,              // When the user joined the group
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ groupId: 1, userId: 1 }` | Unique, Compound | Prevent duplicate membership, fast lookup |
| `{ groupId: 1, role: 1 }` | Compound | Find admins/owner of a group |
| `{ userId: 1 }` | Regular | Find all groups a user belongs to |

---

## 7. Blocks Collection

Stores active block relationships.

```
Collection: blocks

{
  _id:              ObjectId,
  blockerId:        ObjectId,          // ref: users — the user who blocked
  blockedId:        ObjectId,          // ref: users — the blocked user
  lastUnblockedAt:  Date | null,       // Timestamp of last unblock (for cooldown)
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ blockerId: 1, blockedId: 1 }` | Unique, Compound | Prevent duplicates, fast block check |
| `{ blockedId: 1 }` | Regular | Check if a user is blocked by anyone (for filtering) |

### Notes

- When a user unblocks someone, the document is **deleted** but `lastUnblockedAt` is recorded in a separate field or the user's profile for cooldown enforcement.
- Alternative design: Keep the document and add an `active: Boolean` field. This simplifies cooldown checks but requires filtering in all queries. **Decision: Delete the document, store `lastUnblockedAt` on a new `blockHistory` subcollection or as an array on the user document.** For simplicity, store it as a map on the block document — on unblock, update `lastUnblockedAt` and set `active: false` instead of deleting.

**Revised schema with soft-delete approach:**

```
{
  _id:              ObjectId,
  blockerId:        ObjectId,
  blockedId:        ObjectId,
  active:           Boolean,           // true = actively blocked, false = unblocked
  lastUnblockedAt:  Date | null,
  createdAt:        Date,
  updatedAt:        Date
}
```

Query for active blocks: `{ blockerId, blockedId, active: true }`

---

## 8. Message Requests Collection

Tracks incoming message requests from non-contacts. This is a lightweight document that provides a dedicated query target for the "Message Requests" UI section.

```
Collection: messageRequests

{
  _id:              ObjectId,
  conversationId:   ObjectId,          // ref: conversations
  fromUserId:       ObjectId,          // ref: users — the sender (non-contact)
  toUserId:         ObjectId,          // ref: users — the recipient
  status:           String,            // "pending" | "accepted" | "ignored"
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ toUserId: 1, status: 1 }` | Compound | List message requests for a user |
| `{ conversationId: 1 }` | Unique | One request per conversation |
| `{ fromUserId: 1, toUserId: 1 }` | Compound | Check if request already exists |

---

## 9. Reports Collection

Stores user reports against users, messages, or groups.

```
Collection: reports

{
  _id:              ObjectId,
  reporterId:       ObjectId,          // ref: users — who filed the report
  targetType:       String,            // "user" | "message" | "group"
  targetId:         ObjectId,          // ref: users | messages | groups
  reason:           String,            // "spam" | "harassment" | "scam" | "impersonation"
                                       // | "hate_speech" | "illegal_content" | "other"
  description:      String | null,     // Optional free-text description
  messageSnapshot: {                   // Only for targetType: "message"
    content:        String,
    type:           String,
    senderId:       ObjectId,
    senderUsername:  String,
    conversationId: ObjectId,
    mediaUrl:       String | null,
    originalCreatedAt: Date
  } | null,
  status:           String,            // "pending" | "under_review" | "resolved" | "dismissed"
  reviewedBy:       ObjectId | null,   // ref: users (admin who reviewed)
  resolution:       String | null,     // "warning_issued" | "user_banned" | "content_removed" | "no_action"
  resolutionNotes:  String | null,     // Admin notes about the resolution
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ status: 1, createdAt: -1 }` | Compound | Admin queue: pending reports sorted by age |
| `{ reporterId: 1 }` | Regular | Find reports by a specific reporter (abuse detection) |
| `{ targetType: 1, targetId: 1 }` | Compound | Find all reports against a specific target |
| `{ reviewedBy: 1 }` | Regular | Find reports handled by a specific admin |

---

## 10. Support Tickets Collection

Stores support tickets submitted by users.

```
Collection: supportTickets

{
  _id:              ObjectId,
  userId:           ObjectId,          // ref: users — who created the ticket
  subject:          String,            // Ticket subject line
  reason:           String,            // "account_recovery" | "login_issues" | "bug_report"
                                       // | "feature_request" | "other"
  status:           String,            // "open" | "assigned" | "in_progress"
                                       // | "waiting_on_user" | "resolved" | "closed"
  assignedTo:       ObjectId | null,   // ref: users (support staff)
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ status: 1, createdAt: -1 }` | Compound | Admin queue: open tickets sorted by age |
| `{ userId: 1 }` | Regular | Find tickets by a specific user |
| `{ assignedTo: 1, status: 1 }` | Compound | Find tickets assigned to a specific staff member |

---

## 11. Support Messages Collection

Threaded messages within a support ticket.

```
Collection: supportMessages

{
  _id:              ObjectId,
  ticketId:         ObjectId,          // ref: supportTickets
  senderId:         ObjectId,          // ref: users — user or staff member
  senderRole:       String,            // "user" | "staff" — distinguishes who sent
  content:          String,            // Message text
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ ticketId: 1, createdAt: 1 }` | Compound | Chronological thread view |

---

## 12. Admin Logs Collection

Immutable audit trail of all administrative actions.

```
Collection: adminLogs

{
  _id:              ObjectId,
  adminId:          ObjectId,          // ref: users — the admin who performed the action
  action:           String,            // "ban_user" | "unban_user" | "warn_user"
                                       // | "resolve_report" | "dismiss_report"
                                       // | "delete_group" | "assign_ticket"
                                       // | "resolve_ticket" | "promote_admin"
                                       // | "demote_admin" | "view_conversation"
  targetType:       String,            // "user" | "message" | "group" | "report" | "ticket"
  targetId:         ObjectId,          // ID of the affected entity
  details:          Mixed | null,      // Additional context (JSON object)
                                       // e.g., { reason: "Repeated harassment", duration: "7d" }
  ipAddress:        String | null,     // Admin's IP for security audit
  createdAt:        Date               // No updatedAt — logs are immutable
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ adminId: 1, createdAt: -1 }` | Compound | Activity history per admin |
| `{ action: 1, createdAt: -1 }` | Compound | Filter by action type |
| `{ targetType: 1, targetId: 1 }` | Compound | All actions against a specific entity |
| `{ createdAt: -1 }` | Regular | Chronological log browsing |

### Notes

- Admin logs are **append-only**. No updates or deletes are permitted.
- Every admin action in the system must create a log entry — this is enforced at the service layer.

---

## 13. Bans Collection

Stores ban records. A user may have multiple historical ban records.

```
Collection: bans

{
  _id:              ObjectId,
  userId:           ObjectId,          // ref: users — the banned user
  reason:           String,            // Human-readable ban reason
  bannedBy:         ObjectId,          // ref: users — the admin who issued the ban
  type:             String,            // "temporary" | "permanent"
  expiresAt:        Date | null,       // Null for permanent bans
  active:           Boolean,           // True = currently in effect
  unbannedBy:       ObjectId | null,   // Admin who lifted the ban (if applicable)
  unbannedAt:       Date | null,
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ userId: 1, active: 1 }` | Compound | Check if user is currently banned |
| `{ expiresAt: 1 }` | Regular (TTL candidate) | Find expiring bans for auto-unban |
| `{ bannedBy: 1 }` | Regular | Bans issued by a specific admin |

### Notes

- When a ban expires (temporary), a scheduled job or check at login sets `active: false`.
- The `users.status` field is updated to `"banned"` when a ban is created and `"active"` when the ban is lifted.
- Historical bans (active: false) are preserved for admin reference.

---

## 14. Refresh Tokens Collection

Stores active refresh tokens for JWT rotation and revocation.

```
Collection: refreshTokens

{
  _id:              ObjectId,
  userId:           ObjectId,          // ref: users
  token:            String,            // Hashed refresh token
  expiresAt:        Date,              // Token expiration
  createdAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ token: 1 }` | Unique | Fast token lookup during refresh |
| `{ userId: 1 }` | Regular | Revoke all tokens for a user |
| `{ expiresAt: 1 }` | TTL (expireAfterSeconds: 0) | Auto-delete expired tokens |

### Notes

- The TTL index on `expiresAt` automatically removes expired tokens from the collection.
- On logout or password change, all refresh tokens for the user are deleted.
- Tokens are stored as hashed values (SHA-256) — the raw token is only sent to the client.

---

## 15. Push Subscriptions Collection

Stores Web Push subscriptions per user/device.

```
Collection: pushSubscriptions

{
  _id:              ObjectId,
  userId:           ObjectId,          // ref: users
  endpoint:         String,            // Unique push endpoint
  keys: {
    p256dh:         String,
    auth:           String
  },
  expirationTime:   Number | null,
  userAgent:        String | null,
  revokedAt:        Date | null,
  lastUsedAt:       Date | null,
  createdAt:        Date,
  updatedAt:        Date
}
```

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `{ endpoint: 1 }` | Unique | Prevent duplicate subscriptions |
| `{ userId: 1, endpoint: 1 }` | Compound | Fast lookup by user |

---

## Entity Relationship Diagram

```
users ─────────────────┬────────────────────────────────────────────────────
  │                    │                                                    
  │ 1:N               │ 1:N                                               
  ▼                    ▼                                                    
contacts          conversations ◄──── messages (N:1)                       
  │                    │                  │                                  
  │                    │                  ├── readBy → [users]               
  │                    │                  ├── deletedFor → [users]           
  │                    │                  └── senderId → users               
  │                    │                                                    
  │                    ├──── groups (1:1)                                   
  │                    │       │                                             
  │                    │       └──── groupMembers (1:N)                     
  │                    │               └── userId → users                   
  │                    │                                                    
  │                    └──── messageRequests (1:1)                          
  │                                                                        
  ├── blocks (user → user)                                                 
  │                                                                        
  ├── reports (user reports user|message|group)                            
  │                                                                        
  ├── supportTickets (user → ticket)                                       
  │       └── supportMessages (1:N)                                        
  │                                                                        
  ├── bans (user is banned)                                                
  │                                                                        
  ├── adminLogs (admin performs action)                                    
  │                                                                        
  ├── refreshTokens (user has active tokens)
  └── pushSubscriptions (user has web push endpoints)                              
```

---

## Data Retention Policy

| Data Type | Retention |
|-----------|-----------|
| User accounts | Indefinite (soft-delete if account is deactivated) |
| Messages | Indefinite (never hard-deleted for moderation) |
| Media files | Indefinite (admin responsibility to manage storage) |
| Admin logs | Indefinite (immutable audit trail) |
| Refresh tokens | Auto-deleted on expiry (TTL index) |
| Push subscriptions | Removed on unsubscribe or invalid endpoint |
| Verification codes | Auto-cleared after use or expiry |
| Reports | Indefinite (even after resolution) |
| Bans | Indefinite (historical record preserved) |

---

## MongoDB Configuration Recommendations

### Replica Set
- Use MongoDB Atlas or a self-hosted 3-node replica set for production.
- Enables automatic failover and read scaling.

### Write Concern
- Default write concern: `{ w: "majority" }` for data durability.
- Messages collection may use `{ w: 1 }` for performance if acceptable (evaluate based on data criticality vs. throughput needs).

### Read Preference
- Primary for writes and strong-consistency reads.
- SecondaryPreferred for analytics queries (admin dashboard metrics).

### Connection Pooling
- Mongoose default pool size (5) is sufficient for development.
- Production: increase to 10-50 based on load testing.
