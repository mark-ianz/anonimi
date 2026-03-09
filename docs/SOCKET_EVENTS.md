# Socket.IO Events

This document specifies all real-time WebSocket events used in EchoID, including namespaces, authentication, event payloads, room management, and connection lifecycle.

> **Frontend note:** The Socket.IO client connects only within the authenticated `(main)` route group layout via `SocketProvider`. Marketing and auth pages do not establish WebSocket connections. See **FRONTEND_DESIGN.md** for client-side integration details.

---

## Socket.IO Server Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Transport** | WebSocket (upgrade from polling) | Low latency after initial handshake |
| **Ping Interval** | 25,000 ms | Keep connection alive |
| **Ping Timeout** | 20,000 ms | Detect dead connections |
| **Max Buffer Size** | 1 MB | Prevent memory abuse from large payloads |
| **CORS Origins** | Configured whitelist | Web domain + future mobile |

---

## Namespaces

### `/chat` — User Messaging Namespace

All user-facing real-time features: messaging, typing, presence, notifications.

### `/admin` — Admin Dashboard Namespace

Real-time updates for the admin panel: new reports, user activity, live metrics.

Admin namespace requires admin role JWT in auth handshake.

---

## Authentication (Connection Handshake)

Every Socket.IO connection must authenticate during the handshake.

### Client Connection

```
const socket = io("https://api.echoid.com/chat", {
  auth: {
    token: "<JWT access token>"
  },
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});
```

### Server Auth Middleware

The server intercepts the connection handshake and verifies the JWT:

1. Extract `token` from `socket.handshake.auth`.
2. Verify JWT signature and expiry.
3. Decode payload → `{ userId, echoId, role }`.
4. Check user status is `"active"` (reject banned users).
5. Attach user data to `socket.data.user`.
6. Allow connection.

If authentication fails, the server emits `connect_error` with a message, and the connection is rejected.

### Token Expiry During Active Connection

- When the access token expires, the client must refresh the token via REST (`POST /api/auth/refresh-token`) and reconnect.
- The server does **not** disconnect active sockets on token expiry mid-session — the token was valid at connection time.
- On reconnection (e.g., after network loss), the new token must be valid.

---

## Room Management

Rooms are used to scope event delivery to relevant participants.

### Room Types

| Room Name Pattern | Purpose | Who Joins |
|-------------------|---------|-----------|
| `user:<userId>` | Personal room for direct notifications | The specific user (all their socket connections) |
| `conversation:<conversationId>` | Conversation room for messages/typing | All participants of the conversation |
| `admin:dashboard` | Admin real-time updates | All connected admins |

### Room Join Logic (On Connection)

When a user connects:

1. Join `user:<userId>` room (for personal notifications like contact requests).
2. Query all active conversations where the user is a participant.
3. Join `conversation:<conversationId>` for each conversation.

### Dynamic Room Management

- When a user starts a new conversation → server joins both participants to `conversation:<newConversationId>`.
- When a user is added to a group → server joins them to `conversation:<groupConversationId>`.
- When a user leaves a group → server removes them from the conversation room.
- When a user blocks another → server does NOT remove from room (filtering happens at event delivery).

---

## Client → Server Events

Events emitted by clients and received by the server.

---

### `message:send`

Send a new message in a conversation.

**Payload:**
```json
{
  "conversationId": "60d5ecb54b24a1001c8e4b3f",
  "type": "text",
  "content": "Hello there!",
  "mediaUrl": null,
  "fileName": null,
  "fileSize": null,
  "tempId": "client-generated-uuid"
}
```

**Server Processing:**
1. Validate payload (required fields, content length, valid type).
2. Verify sender is participant in the conversation.
3. Check block status (sender not blocked by any recipient).
4. Check message request status (create request if non-contact and first message).
5. Persist message to MongoDB.
6. Update conversation `lastMessage` and `updatedAt`.
7. Emit `message:ack` to sender.
8. Emit `message:receive` to conversation room (excluding sender).

**`tempId` Purpose:** Client generates a temporary UUID for optimistic UI rendering. The server echoes it back in `message:ack` so the client can replace the temporary message with the confirmed one.

---

### `message:typing`

Indicate that the user is typing in a conversation.

**Payload:**
```json
{
  "conversationId": "60d5ecb54b24a1001c8e4b3f",
  "isTyping": true
}
```

**Server Processing:**
1. Broadcast `typing:update` to conversation room (excluding sender).
2. Set a 5-second server-side expiry for the typing status (safety net).

---

### `message:read`

Mark messages as read.

**Payload:**
```json
{
  "conversationId": "60d5ecb54b24a1001c8e4b3f",
  "messageIds": [
    "60d5ecb54b24a1001c8e4b50",
    "60d5ecb54b24a1001c8e4b51"
  ]
}
```

**Server Processing:**
1. Add `userId` to `readBy` array of each specified message.
2. Emit `message:read` to conversation room (so sender sees read receipts).

---

### `conversation:join`

Request to join a specific conversation room (e.g., when opening a chat that wasn't loaded at connection time).

**Payload:**
```json
{
  "conversationId": "60d5ecb54b24a1001c8e4b3f"
}
```

**Server Processing:**
1. Verify user is participant in the conversation.
2. Join socket to `conversation:<conversationId>` room.
3. Emit `conversation:joined` acknowledgment.

---

### `conversation:leave`

Leave a conversation room (e.g., when navigating away from a chat — room only, not leaving the group).

**Payload:**
```json
{
  "conversationId": "60d5ecb54b24a1001c8e4b3f"
}
```

**Server Processing:**
1. Remove socket from `conversation:<conversationId>` room.

---

### `presence:heartbeat`

Periodic heartbeat to confirm the user is still active.

**Payload:**
```json
{
  "timestamp": 1709913600000
}
```

**Server Processing:**
1. Update user's `lastSeen` timestamp.
2. Refresh the online status expiry.

---

## Server → Client Events

Events emitted by the server and received by clients.

---

### `message:ack`

Acknowledgment that a sent message was persisted.

**Payload:**
```json
{
  "tempId": "client-generated-uuid",
  "messageId": "60d5ecb54b24a1001c8e4b52",
  "conversationId": "60d5ecb54b24a1001c8e4b3f",
  "timestamp": "2026-03-08T11:50:00.000Z"
}
```

**Client Handling:**
- Replace optimistic message (identified by `tempId`) with confirmed message (identified by `messageId`).
- Update message status to "sent."

---

### `message:receive`

A new message was received in a conversation.

**Payload:**
```json
{
  "messageId": "60d5ecb54b24a1001c8e4b52",
  "conversationId": "60d5ecb54b24a1001c8e4b3f",
  "senderId": "60d5ecb54b24a1001c8e4b3a",
  "senderUsername": "john_doe",
  "senderProfileImage": "/uploads/avatars/uuid.jpg",
  "type": "text",
  "content": "Hello there!",
  "mediaUrl": null,
  "fileName": null,
  "fileSize": null,
  "timestamp": "2026-03-08T11:50:00.000Z"
}
```

**Client Handling:**
- Add message to the conversation's message list.
- Update conversation's last message preview.
- Move conversation to top of list (if not already there).
- Show notification if the conversation is not currently focused.
- If focused, auto-emit `message:read`.

---

### `message:unsent`

A message was unsent by its sender.

**Payload:**
```json
{
  "messageId": "60d5ecb54b24a1001c8e4b50",
  "conversationId": "60d5ecb54b24a1001c8e4b3f"
}
```

**Client Handling:**
- Replace message content with "This message was unsent" placeholder.
- Remove any media preview.

---

### `message:read`

Read receipts update for messages.

**Payload:**
```json
{
  "conversationId": "60d5ecb54b24a1001c8e4b3f",
  "messageIds": [
    "60d5ecb54b24a1001c8e4b50",
    "60d5ecb54b24a1001c8e4b51"
  ],
  "readBy": {
    "userId": "60d5ecb54b24a1001c8e4b3b",
    "username": "jane_smith",
    "readAt": "2026-03-08T11:55:00.000Z"
  }
}
```

**Client Handling:**
- Update read status indicators on the specified messages.
- In groups, update the read count.

---

### `typing:update`

Typing indicator status change.

**Payload:**
```json
{
  "conversationId": "60d5ecb54b24a1001c8e4b3f",
  "userId": "60d5ecb54b24a1001c8e4b3b",
  "username": "jane_smith",
  "isTyping": true
}
```

**Client Handling:**
- If `isTyping: true`, add user to the "currently typing" list for this conversation.
- If `isTyping: false`, remove user from the list.
- Display typing indicator in the chat UI.
- Client-side timeout: auto-remove after 5 seconds if no update received (matching server expiry).

---

### `presence:update`

A user's online status changed.

**Payload:**
```json
{
  "userId": "60d5ecb54b24a1001c8e4b3b",
  "status": "offline",
  "lastSeen": "2026-03-08T12:00:00.000Z"
}
```

**Client Handling:**
- Update the user's online indicator in contact lists, conversation headers, and profile views.
- If `status: "offline"`, show "Last seen" timestamp.

**Delivery Scope:**
- Sent to all conversation rooms where the user is a participant.
- Filtered: NOT sent to users who have blocked this user.

---

### `contact:request`

A new contact request was received.

**Target:** `user:<recipientUserId>` room.

**Payload:**
```json
{
  "requestId": "60d5ecb54b24a1001c8e4b3e",
  "from": {
    "id": "60d5ecb54b24a1001c8e4b3a",
    "echoId": "eid_a8F3kP29",
    "username": "john_doe",
    "profileImage": "/uploads/avatars/uuid.jpg"
  },
  "createdAt": "2026-03-08T10:00:00.000Z"
}
```

---

### `contact:accepted`

A contact request was accepted.

**Target:** `user:<originalSenderUserId>` room.

**Payload:**
```json
{
  "contactId": "60d5ecb54b24a1001c8e4b3b",
  "echoId": "eid_b7G2mN48",
  "username": "jane_smith",
  "profileImage": "/uploads/avatars/uuid2.jpg"
}
```

---

### `message-request:new`

A new message request arrived from a non-contact.

**Target:** `user:<recipientUserId>` room.

**Payload:**
```json
{
  "requestId": "60d5ecb54b24a1001c8e4b60",
  "conversationId": "60d5ecb54b24a1001c8e4b61",
  "from": {
    "id": "60d5ecb54b24a1001c8e4b3d",
    "echoId": "eid_c9H4pQ67",
    "username": "bob_builder",
    "profileImage": null
  },
  "preview": {
    "content": "Hey, I found you on EchoID!",
    "type": "text",
    "timestamp": "2026-03-08T10:00:00.000Z"
  }
}
```

---

### `group:member-joined`

A new member joined a group.

**Target:** `conversation:<groupConversationId>` room.

**Payload:**
```json
{
  "groupId": "60d5ecb54b24a1001c8e4b70",
  "member": {
    "userId": "60d5ecb54b24a1001c8e4b3d",
    "echoId": "eid_c9H4pQ67",
    "username": "bob_builder",
    "profileImage": null,
    "role": "member"
  },
  "addedBy": {
    "userId": "60d5ecb54b24a1001c8e4b3a",
    "username": "john_doe"
  }
}
```

---

### `group:member-left`

A member left or was removed from a group.

**Target:** `conversation:<groupConversationId>` room.

**Payload:**
```json
{
  "groupId": "60d5ecb54b24a1001c8e4b70",
  "userId": "60d5ecb54b24a1001c8e4b3d",
  "username": "bob_builder",
  "reason": "left",
  "removedBy": null
}
```

`reason`: `"left"` (voluntary) or `"removed"` (by admin/owner).  
`removedBy`: null if voluntary, otherwise the admin who removed them.

---

### `group:updated`

Group settings or metadata changed.

**Target:** `conversation:<groupConversationId>` room.

**Payload:**
```json
{
  "groupId": "60d5ecb54b24a1001c8e4b70",
  "changes": {
    "name": "New Team Name",
    "image": "/uploads/groups/uuid5.jpg",
    "settings": {
      "joinRequestEnabled": true
    }
  },
  "updatedBy": {
    "userId": "60d5ecb54b24a1001c8e4b3a",
    "username": "john_doe"
  }
}
```

---

### `group:role-changed`

A member's role was changed.

**Target:** `conversation:<groupConversationId>` room.

**Payload:**
```json
{
  "groupId": "60d5ecb54b24a1001c8e4b70",
  "userId": "60d5ecb54b24a1001c8e4b3d",
  "username": "bob_builder",
  "oldRole": "member",
  "newRole": "admin",
  "changedBy": {
    "userId": "60d5ecb54b24a1001c8e4b3a",
    "username": "john_doe"
  }
}
```

---

### `group:join-request`

A new join request for an admin to review.

**Target:** Admins/owner of the group (via `user:<adminUserId>` room).

**Payload:**
```json
{
  "groupId": "60d5ecb54b24a1001c8e4b70",
  "groupName": "Project Team",
  "requestId": "60d5ecb54b24a1001c8e4b80",
  "user": {
    "id": "60d5ecb54b24a1001c8e4b3d",
    "echoId": "eid_f3L7uV23",
    "username": "new_user",
    "profileImage": null
  }
}
```

---

### `notification:new`

Generic notification event for various system notifications.

**Target:** `user:<userId>` room.

**Payload:**
```json
{
  "id": "60d5ecb54b24a1001c8e4bc0",
  "type": "contact_request" | "message_request" | "group_invite" | 
          "ticket_reply" | "warning" | "system",
  "title": "New contact request",
  "body": "john_doe wants to add you as a contact",
  "data": { ... },
  "createdAt": "2026-03-08T12:00:00.000Z"
}
```

---

## Admin Namespace Events (`/admin`)

### Server → Admin Client

| Event | Payload | Description |
|-------|---------|-------------|
| `admin:report-new` | `{ reportId, targetType, reason, reporterUsername, createdAt }` | New report submitted |
| `admin:ticket-new` | `{ ticketId, subject, reason, username, createdAt }` | New support ticket |
| `admin:user-registered` | `{ userId, echoId, username, createdAt }` | New user registered |
| `admin:metrics-update` | `{ totalUsers, activeUsers, messagesLast24h, pendingReports, openTickets }` | Periodic metrics refresh (every 30s) |

---

## Connection Lifecycle

### Connection Flow

```
1. Client initiates connection with JWT in auth payload
2. Server auth middleware validates token
3. On success:
   a. Socket connected
   b. User marked "online" in database
   c. Socket joins user:<userId> room
   d. Socket joins all active conversation rooms
   e. Server emits presence:update (online) to relevant rooms
4. On failure:
   a. connect_error emitted with reason
   b. Connection rejected
```

### Disconnection Flow

```
1. Socket disconnects (network loss, tab close, explicit disconnect)
2. Server starts 10-second grace period timer
3. If user reconnects within 10s:
   a. Timer cancelled
   b. Rooms re-joined
   c. No presence change emitted
4. If grace period expires:
   a. User marked "offline" in database
   b. lastSeen updated
   c. Server emits presence:update (offline) to relevant rooms
```

### Reconnection Strategy (Client-Side)

| Parameter | Value |
|-----------|-------|
| Auto-reconnect | Enabled |
| Max attempts | 10 |
| Initial delay | 1,000 ms |
| Max delay | 5,000 ms |
| Backoff multiplier | Exponential (1s, 2s, 4s, 5s, 5s...) |

On reconnection:
1. Client refreshes JWT if expired (via REST `/api/auth/refresh-token`).
2. Reconnects with new token.
3. Server re-joins rooms.
4. Client fetches any missed messages via REST (`GET /api/messages`).

### Multi-Device Support

A single user can have multiple active Socket.IO connections (e.g., two browser tabs, web + mobile in the future).

- All connections for the same user join the same `user:<userId>` room.
- Messages and events are delivered to ALL active connections.
- "Online" status is true if ANY connection is active.
- "Offline" only when ALL connections are disconnected (after grace period).

---

## Error Events

### `error`

Server-side error during event processing.

**Payload:**
```json
{
  "code": "BLOCKED_USER",
  "message": "You cannot send messages to this user.",
  "event": "message:send"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_FAILED` | JWT invalid or expired during connection |
| `BLOCKED_USER` | Action blocked due to block relationship |
| `NOT_PARTICIPANT` | User is not a participant in the conversation |
| `VALIDATION_ERROR` | Invalid event payload |
| `RATE_LIMITED` | Too many events in short period |
| `PERMISSION_DENIED` | Insufficient role for the action |
| `SERVER_ERROR` | Unexpected server error |

---

## Rate Limiting (Socket Events)

| Event | Limit | Window |
|-------|-------|--------|
| `message:send` | 30 messages | 60 seconds |
| `message:typing` | 10 events | 10 seconds |
| `message:read` | 20 events | 60 seconds |
| `presence:heartbeat` | 2 events | 60 seconds |

When rate limited, server emits `error` event with code `RATE_LIMITED` and silently drops the event.
