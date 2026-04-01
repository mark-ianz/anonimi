# API Design

This document specifies the complete REST API for the anonimi backend. All endpoints follow consistent conventions for authentication, request/response format, and error handling.

The Next.js frontend consumes this API from all four route groups (marketing contact form, auth pages, authenticated app, admin panel). For frontend architecture details, see **FRONTEND_DESIGN.md**.

---

## Base URL

```
Development: http://localhost:5000/api
Production:  https://api.anonimi.com/api
```

All endpoints are prefixed with `/api`.

---

## Conventions

### Authentication

Most endpoints require a valid JWT access token, sent as:
- **Header:** `Authorization: Bearer <token>` (preferred for mobile)  
- **Cookie:** `access_token` httpOnly cookie (preferred for web)

Endpoints marked with 🔓 are **public** (no auth required).  
Endpoints marked with 🛡️ require **admin** role.

### Request Format

- **Body:** JSON (`Content-Type: application/json`) unless uploading files.
- **File uploads:** Multipart form data (`Content-Type: multipart/form-data`).
- **Query params:** Used for filtering, pagination, and search.
- **Path params:** Used for resource identification.

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Paginated Success:**
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

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": [ ... ]
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Success (GET, PATCH, DELETE) |
| `201` | Created (POST that creates a resource) |
| `204` | No Content (DELETE with no response body) |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (duplicate resource) |
| `429` | Too Many Requests (rate limited) |
| `500` | Internal Server Error |

---

## 1. Authentication

### POST /api/auth/register 🔓

Register a new user account.

**Request Body:**
```json
{
  "email": "john@example.com",        // Required
  "username": "john_doe",             // Optional, 3-30 chars, alphanumeric + _ .
  "password": "SecurePass123!"        // Required, min 8 chars, complexity rules
}
```

**Behavior:**
- If `username` is omitted, the system generates a random unique username using a crypto-secure generator.
- For privacy, users are encouraged not to use their real name as username.
- A username can be manually changed once (including accounts that started with generated usernames).
- This rule applies to newly created accounts in the privacy-first flow.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "Verification code sent. Please verify your account.",
    "verificationTarget": "email"
  }
}
```

**Errors:**
- `409` — Email/username already taken
- `400` — Validation error (password too weak, invalid email format, etc.)

---

### POST /api/auth/verify-email 🔓

Verify email address with code sent during registration.

**Request Body:**
```json
{
  "email": "john@example.com",
  "code": "482913"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "user": {
      "id": "60d5ecb54b24a1001c8e4b3a",
      "anonimiId": "aid_a8F3kP29",
      "username": "john_doe",
      "profileImage": null,
      "role": "user",
      "status": "active"
    }
  }
}
```

---

### GET /api/auth/verify-email-link 🔓

Verify email address via link sent during registration.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Verification token from email |

**Response (200):**
Same as `POST /api/auth/verify-email`.

---

### GET /api/auth/verification-status 🔓

Validate whether a verification session is still valid for a target account.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `email` \| `phone` | Yes | Verification target type |
| `target` | string | Yes | Email address or phone number |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "canVerify": true,
    "reason": "pending",
    "type": "email",
    "target": "john@example.com"
  }
}
```

Possible `reason` values when `canVerify` is `false`:
- `not_found`
- `already_verified`
- `not_pending`
- `no_code`
- `code_expired`

---

### POST /api/auth/resend-verification 🔓

Regenerate and resend a verification code for pending accounts.

**Request Body:**
```json
{
  "type": "email",
  "target": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "A new verification code has been sent.",
    "verificationTarget": "email"
  }
}
```

**Errors:**
- `404` — Verification target not found
- `409` — Account already verified or not pending verification

---

### POST /api/auth/login 🔓

Login with email or phone number and password.

**Request Body:**
```json
{
  "identifier": "john@example.com",   // Email or phone number (if registered)
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "user": {
      "id": "60d5ecb54b24a1001c8e4b3a",
      "anonimiId": "aid_a8F3kP29",
      "username": "john_doe",
      "profileImage": "/uploads/avatars/uuid.jpg",
      "role": "user",
      "status": "active",
      "onlineStatus": "online",
      "lastSeen": "2026-03-08T12:00:00Z"
    }
  }
}
```

**Errors:**
- `401` — Invalid credentials
- `401` — Account banned or pending verification

---

### POST /api/auth/refresh-token 🔓

Exchange a valid refresh token for new access + refresh tokens.

**Request Body:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token..."
  }
}
```

**Errors:**
- `401` — Invalid or expired refresh token

---

### POST /api/auth/forgot-password 🔓

Request a password reset link/code.

**Behavior:**
- Always returns success (prevents email enumeration).
- Sends a reset link to the email when an account exists.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "If an account with this email exists, a reset link has been sent."
  }
}
```

Note: Always returns success to prevent email enumeration attacks.

---

### POST /api/auth/reset-password 🔓

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "user": {
      "id": "60d5ecb54b24a1001c8e4b3a",
      "anonimiId": "aid_a8F3kP29",
      "username": "john_doe",
      "profileImage": null,
      "role": "user",
      "status": "active"
    }
  }
}
```

---

### POST /api/auth/logout

Log out and invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  }
}
```

---

## 2. Notifications

### GET /api/notifications

List notifications for the authenticated user.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `limit` | number | No | Default 20 |
| `cursor` | string | No | Pagination cursor |

---

### PATCH /api/notifications/:notificationId/read

Mark a single notification as read.

---

### PATCH /api/notifications/read-all

Mark all notifications as read.

---

### PATCH /api/notifications/messages/read-by-conversation/:conversationId

Mark message notifications for a conversation as read.

---

### DELETE /api/notifications/:notificationId

Delete a notification.

---

### GET /api/notifications/push/status

Returns whether the user has active push subscriptions.

---

### GET /api/notifications/push/public-key

Returns the VAPID public key for Web Push.

---

### POST /api/notifications/push/subscribe

Subscribe the current user for Web Push.

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  },
  "expirationTime": null,
  "userAgent": "Mozilla/5.0 ..."
}
```

---

### POST /api/notifications/push/unsubscribe

Unsubscribe the current user from Web Push.

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

---

### POST /api/notifications/push/test

Send a test push notification (authenticated).

---

## 3. Users

### GET /api/users/search

Search users by anonimi or username.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | Yes | Search query (min 2 chars) |
| `limit` | number | No | Results per page (default: 10, max: 50) |
| `cursor` | string | No | Pagination cursor |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60d5ecb54b24a1001c8e4b3a",
      "anonimiId": "aid_a8F3kP29",
      "username": "john_doe",
      "profileImage": "/uploads/avatars/uuid.jpg",
      "onlineStatus": "online"
    }
  ],
  "pagination": {
    "nextCursor": "60d5ecb54b24a1001c8e4b3b",
    "hasMore": false
  }
}
```

Note: Results only include public profile fields. Email and phone are never returned.

---

### GET /api/users/:anonimiId

Get a user's public profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ecb54b24a1001c8e4b3a",
    "anonimiId": "aid_a8F3kP29",
    "username": "john_doe",
    "profileImage": "/uploads/avatars/uuid.jpg",
    "onlineStatus": "online",
    "lastSeen": "2026-03-08T12:00:00Z",
    "createdAt": "2025-01-15T08:30:00Z",
    "isContact": true,
    "isBlocked": false,
    "contactNickname": "Johnny",
    "pendingOutgoingRequestId": null,
    "pendingIncomingRequestId": "60d5ecb54b24a1001c8e4b3c"
  }
}
```

Note: Relationship fields are computed relative to the requesting user. `pendingOutgoingRequestId` and `pendingIncomingRequestId` are included when a contact request is currently pending in either direction.

---

### GET /api/auth/me

Get the authenticated user's full profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ecb54b24a1001c8e4b3a",
    "anonimiId": "aid_a8F3kP29",
    "username": "john_doe",
    "usernameCanEdit": true,
    "email": "john@example.com",
    "phone": null,
    "profileImage": "/uploads/avatars/uuid.jpg",
    "role": "user",
    "status": "active",
    "onlineStatus": "online",
    "lastSeen": "2026-03-08T12:00:00Z",
    "emailVerified": true,
    "phoneVerified": true,
    "createdAt": "2025-01-15T08:30:00Z"
  }
}
```

Note: This is the only endpoint that returns email and phone — only for the authenticated user's own profile.
Phone is optional and intended for account recovery/security.

---

### PATCH /api/auth/me

Update the authenticated user's profile.

**Request Body (partial update):**
```json
{
  "username": "new_username",
  "phone": "+0987654321"
}
```

Notes:
- `username` is optional and can only be manually changed once ever.
- `phone` is optional and can be added after account creation for account recovery.

**Response (200):**
```json
{
  "success": true,
  "data": { ... }  // Updated user profile
}
```

**Errors:**
- `409` — Username already taken
- `409` — Username change not allowed (already changed once)

---

### POST /api/auth/me/avatar

Upload or update profile image.

**Request:** `multipart/form-data` with `avatar` field.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profileImage": "/uploads/avatars/uuid.jpg"
  }
}
```

---

## 3. Contacts

### GET /api/contacts

List the authenticated user's contacts.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter: `accepted`, `pending` (default: `accepted`) |
| `limit` | number | No | Results per page (default: 50) |
| `cursor` | string | No | Pagination cursor |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "contactId": "60d5ecb54b24a1001c8e4b3b",
      "anonimiId": "aid_b7G2mN48",
      "username": "jane_smith",
      "nickname": "Jane",
      "profileImage": "/uploads/avatars/uuid2.jpg",
      "onlineStatus": "offline",
      "lastSeen": "2026-03-07T18:00:00Z",
      "status": "accepted",
      "createdAt": "2025-06-01T10:00:00Z"
    }
  ],
  "pagination": { "nextCursor": null, "hasMore": false }
}
```

---

### GET /api/contacts/requests

List incoming contact requests.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "requestId": "60d5ecb54b24a1001c8e4b3c",
      "from": {
        "id": "60d5ecb54b24a1001c8e4b3d",
        "anonimiId": "aid_c9H4pQ67",
        "username": "bob_builder",
        "profileImage": null
      },
      "createdAt": "2026-03-08T10:00:00Z"
    }
  ]
}
```

---

### POST /api/contacts/request

Send a contact request.

**Request Body:**
```json
{
  "targetAnonimiId": "aid_b7G2mN48"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "requestId": "60d5ecb54b24a1001c8e4b3e",
    "status": "pending",
    "message": "Contact request sent."
  }
}
```

**Behavior Notes:**
- The endpoint is idempotent for retry scenarios.
- If a previous request record exists (for example after a decline), the server updates/reuses it instead of creating duplicate rows.

**Errors:**
- `404` — User not found
- `409` — Already contacts or request pending
- `403` — User is blocked or you are blocked

---

### POST /api/contacts/request/cancel

Cancel (withdraw) an outgoing pending contact request.

**Request Body:**
```json
{
  "requestId": "60d5ecb54b24a1001c8e4b3e"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "requestId": "60d5ecb54b24a1001c8e4b3e",
    "status": "cancelled",
    "message": "Contact request cancelled."
  }
}
```

---

### PATCH /api/contacts/:contactId/accept

Accept a pending contact request.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "accepted",
    "message": "Contact added."
  }
}
```

---

### PATCH /api/contacts/:contactId/decline

Decline a pending contact request.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "declined",
    "message": "Contact request declined."
  }
}
```

---

### DELETE /api/contacts/:contactId

Remove a contact.

**Response (204):** No content.

---

### PATCH /api/contacts/:contactId/nickname

Set or update a contact nickname.

**Request Body:**
```json
{
  "nickname": "Best Friend"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "contactId": "60d5ecb54b24a1001c8e4b3b",
    "nickname": "Best Friend"
  }
}
```

**Notes:**
- This nickname is private to the authenticated user (how **you** see the other user).
- On success, the server writes a `system` message in the private conversation for both users with personalized text.

---

### PATCH /api/contacts/:contactId/self-nickname

Set or update your **own nickname** as seen by the other contact in this private chat.

**Request Body:**
```json
{
  "nickname": "friend"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "contactId": "60d5ecb54b24a1001c8e4b3b",
    "nickname": "friend"
  }
}
```

**Notes:**
- This updates the reciprocal contact record (how the other user sees your display name).
- On success, the server writes `system` messages to both users' views of the conversation and emits realtime sync updates.

---

## 4. Conversations

### POST /api/conversations

Open or create a private conversation with another user. If a conversation between the two users already exists, returns the existing one. If not, creates a new conversation.

**Request Body:**
```json
{
  "participantAnonimiId": "aid_b7G2mN48"
}
```

**Response (200 — existing conversation):**
```json
{
  "success": true,
  "data": {
    "conversationId": "60d5ecb54b24a1001c8e4b3f",
    "created": false,
    "requestStatus": null
  }
}
```

**Response (201 — new conversation created):**
```json
{
  "success": true,
  "data": {
    "conversationId": "60d5ecb54b24a1001c8e4b60",
    "created": true,
    "requestStatus": "pending"
  }
}
```

`requestStatus` will be `null` if the two users are already contacts, or `"pending"` if they are not.

**Errors:**
- `404` — User with the given anonimi not found
- `400` — Cannot create conversation with yourself
- `403` — You have blocked this user

---

### GET /api/conversations

List the authenticated user's conversations.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `limit` | number | No | Results per page (default: 20) |
| `cursor` | string | No | Pagination cursor (by updatedAt) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60d5ecb54b24a1001c8e4b3f",
      "type": "private",
      "participant": {
        "id": "60d5ecb54b24a1001c8e4b3b",
        "anonimiId": "aid_b7G2mN48",
        "username": "jane_smith",
        "nickname": "Jane",
        "contactId": "60d5ecb54b24a1001c8e4b88",
        "blockId": null,
        "blockedByMe": false,
        "profileImage": "/uploads/avatars/uuid2.jpg",
        "onlineStatus": "online"
      },
      "lastMessage": {
        "content": "Hey, are you free tonight?",
        "senderId": "60d5ecb54b24a1001c8e4b3b",
        "type": "text",
        "timestamp": "2026-03-08T11:45:00Z"
      },
      "unreadCount": 3,
      "requestStatus": null,
      "updatedAt": "2026-03-08T11:45:00Z"
    },
    {
      "id": "60d5ecb54b24a1001c8e4b40",
      "type": "group",
      "group": {
        "id": "60d5ecb54b24a1001c8e4b41",
        "name": "Project Team",
        "image": "/uploads/groups/uuid3.jpg",
        "memberCount": 8
      },
      "lastMessage": {
        "content": "Meeting at 3pm",
        "senderId": "60d5ecb54b24a1001c8e4b3d",
        "type": "text",
        "timestamp": "2026-03-08T11:30:00Z"
      },
      "unreadCount": 0,
      "requestStatus": null,
      "updatedAt": "2026-03-08T11:30:00Z"
    }
  ],
  "pagination": { "nextCursor": "60d5ecb54b24a1001c8e4b42", "hasMore": true }
}
```

Note: `unreadCount` is computed as messages not in the user's `readBy` since their last read timestamp. `requestStatus` is included on all private conversations — `null` means full access, `"pending"` means gated, `"accepted"` means formerly-gated but now open, `"ignored"` means hidden.

For private conversations, `participant.blockedByMe` and `participant.blockId` indicate whether the authenticated user currently blocks the other user (used by the client to disable input and show unblock actions).

This endpoint returns only conversations the current user has access to in their **main chat inbox** — conversations with `requestStatus: "pending"` or `"ignored"` are **excluded** from this list (they appear under `GET /api/conversations/requests` instead).

---

### GET /api/conversations/requests

List all conversations with `requestStatus: "pending"` where the current user is the **recipient** (i.e. the message request inbox).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60d5ecb54b24a1001c8e4b61",
      "type": "private",
      "participant": {
        "id": "60d5ecb54b24a1001c8e4b3d",
        "anonimiId": "aid_c9H4pQ67",
        "username": "bob_builder",
        "profileImage": null
      },
      "lastMessage": {
        "content": "Hey, I found you on anonimi!",
        "senderId": "60d5ecb54b24a1001c8e4b3d",
        "type": "text",
        "timestamp": "2026-03-08T10:00:00Z"
      },
      "requestStatus": "pending",
      "requestId": "60d5ecb54b24a1001c8e4b60",
      "updatedAt": "2026-03-08T10:00:00Z"
    }
  ],
  "pagination": { "nextCursor": null, "hasMore": false }
}
```

---

### GET /api/conversations/:conversationId

Get conversation details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ecb54b24a1001c8e4b3f",
    "type": "private",
    "participant": { ... },
    "requestStatus": null,
    "createdAt": "2025-06-15T09:00:00Z"
  }
}
```

---

## 5. Messages

### GET /api/messages

Fetch messages for a conversation with cursor-based pagination.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | string | Yes | Conversation ID |
| `cursor` | string | No | Message ID cursor (omit for latest) |
| `limit` | number | No | Messages per page (default: 30, max: 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60d5ecb54b24a1001c8e4b50",
      "conversationId": "60d5ecb54b24a1001c8e4b3f",
      "senderId": "60d5ecb54b24a1001c8e4b3a",
      "type": "text",
      "content": "Hello!",
      "mediaUrl": null,
      "fileName": null,
      "fileSize": null,
      "readBy": ["60d5ecb54b24a1001c8e4b3a", "60d5ecb54b24a1001c8e4b3b"],
      "readByAt": {
        "60d5ecb54b24a1001c8e4b3a": "2026-03-08T11:40:02Z",
        "60d5ecb54b24a1001c8e4b3b": "2026-03-08T11:41:10Z"
      },
      "unsent": false,
      "createdAt": "2026-03-08T11:40:00Z"
    },
    {
      "id": "60d5ecb54b24a1001c8e4b51",
      "conversationId": "60d5ecb54b24a1001c8e4b3f",
      "senderId": "60d5ecb54b24a1001c8e4b3b",
      "type": "image",
      "content": "Check this out!",
      "mediaUrl": "/uploads/messages/uuid4.jpg",
      "fileName": null,
      "fileSize": null,
      "readBy": ["60d5ecb54b24a1001c8e4b3b"],
      "readByAt": {
        "60d5ecb54b24a1001c8e4b3b": "2026-03-08T11:41:02Z"
      },
      "unsent": false,
      "createdAt": "2026-03-08T11:41:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "60d5ecb54b24a1001c8e4b4f",
    "hasMore": true,
    "limit": 30
  }
}
```

Notes:
- Messages are sorted newest-first in the response. Client reverses for display.
- Unsent messages return `content: null` and `unsent: true`.
- Messages in the user's `deletedFor` array are excluded.
- `readByAt` maps `userId -> ISO timestamp` for when each user read the message.

---

### POST /api/messages

Send a message via REST (alternative to WebSocket for reliability).

**Request Body:**
```json
{
  "conversationId": "60d5ecb54b24a1001c8e4b3f",
  "type": "text",
  "content": "Hello there!",
  "mediaUrl": null
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ecb54b24a1001c8e4b52",
    "conversationId": "60d5ecb54b24a1001c8e4b3f",
    "senderId": "60d5ecb54b24a1001c8e4b3a",
    "type": "text",
    "content": "Hello there!",
    "readBy": ["60d5ecb54b24a1001c8e4b3a"],
    "readByAt": {
      "60d5ecb54b24a1001c8e4b3a": "2026-03-08T11:50:00Z"
    },
    "unsent": false,
    "createdAt": "2026-03-08T11:50:00Z"
  }
}
```

Note: This endpoint also triggers Socket.IO event to the recipient. Prefer WebSocket for real-time messaging; use REST as a fallback.

Block behavior in private chats:
- If **you blocked** the other user, send is rejected (`403`).
- If the **other user blocked** you, send is accepted for privacy: the message is persisted but hidden from the blocker and is not delivered or notified to them.

---

### DELETE /api/messages/:messageId/for-me

Delete a message for the authenticated user only.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Message deleted for you."
  }
}
```

---

### POST /api/messages/:messageId/unsend

Unsend a message (remove for everyone).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Message unsent."
  }
}
```

**Errors:**
- `403` — Not the sender of this message
- `403` — Unsend time window expired (24 hours)

---

## 6. Message Requests

### GET /api/message-requests

List pending message requests for the authenticated user.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60d5ecb54b24a1001c8e4b60",
      "conversationId": "60d5ecb54b24a1001c8e4b61",
      "from": {
        "id": "60d5ecb54b24a1001c8e4b3d",
        "anonimiId": "aid_c9H4pQ67",
        "username": "bob_builder",
        "profileImage": null
      },
      "lastMessage": {
        "content": "Hey, I found you on anonimi!",
        "type": "text",
        "timestamp": "2026-03-08T10:00:00Z"
      },
      "status": "pending",
      "createdAt": "2026-03-08T10:00:00Z"
    }
  ]
}
```

---

### PATCH /api/message-requests/:requestId/accept

Accept a message request. Optionally add the sender as a contact.

**Request Body:**
```json
{
  "addToContacts": true
}
```

**Behavior Notes:**
- `addToContacts: true` accepts the message request and establishes contact records.
- `addToContacts: false` accepts the message request without auto-creating contacts.
- If there is already a pending contact request between the same users, accepting with `addToContacts: false` does not clear that pending contact request.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Message request accepted.",
    "conversationId": "60d5ecb54b24a1001c8e4b61",
    "contactAdded": true
  }
}
```

---

### PATCH /api/message-requests/:requestId/ignore

Ignore a message request.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Message request ignored."
  }
}
```

---

## 7. Groups

### POST /api/groups

Create a new group chat.

**Request Body:**
```json
{
  "name": "Project Team",
  "image": null,
  "memberAnonimiIds": ["aid_b7G2mN48", "aid_c9H4pQ67", "aid_d1J5rS89"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "groupId": "60d5ecb54b24a1001c8e4b70",
    "conversationId": "60d5ecb54b24a1001c8e4b71",
    "name": "Project Team",
    "ownerId": "60d5ecb54b24a1001c8e4b3a",
    "members": [
      { "userId": "...", "anonimiId": "aid_a8F3kP29", "role": "owner", "status": "joined" },
      { "userId": "...", "anonimiId": "aid_b7G2mN48", "role": "member", "status": "joined" },
      { "userId": "...", "anonimiId": "aid_c9H4pQ67", "role": "member", "status": "invited" }
    ]
  }
}
```

Note: Members who are contacts are `joined` immediately. Non-contacts receive an invitation (`invited` status) that appears in their message requests.

---

### GET /api/groups/:groupId

Get group details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ecb54b24a1001c8e4b70",
    "conversationId": "60d5ecb54b24a1001c8e4b71",
    "name": "Project Team",
    "image": null,
    "ownerId": "60d5ecb54b24a1001c8e4b3a",
    "disbandedAt": null,
    "settings": {
      "joinRequestEnabled": false
    },
    "memberCount": 8,
    "myRole": "owner",
    "createdAt": "2026-03-01T10:00:00Z"
  }
}
```

---

### PATCH /api/groups/:groupId

Update group settings (name, image, join request toggle).

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "settings": {
    "joinRequestEnabled": true
  }
}
```

**Response (200):** Updated group object.

**Auth:** Owner or Admin only.

---

### GET /api/groups/:groupId/members

List group members.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "60d5ecb54b24a1001c8e4b3a",
      "anonimiId": "aid_a8F3kP29",
      "username": "john_doe",
      "profileImage": "/uploads/avatars/uuid.jpg",
      "role": "owner",
      "nickname": "John",
      "joinedAt": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

### POST /api/groups/:groupId/members

Add members to the group.

**Request Body:**
```json
{
  "memberAnonimiIds": ["aid_e2K6tU01"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "added": [{ "anonimiId": "aid_e2K6tU01", "status": "joined" }],
    "invited": []
  }
}
```

**Auth:** Owner or Admin only.

---

### DELETE /api/groups/:groupId/members/:userId

Remove a member from the group.

**Response (204):** No content.

**Auth:** Owner or Admin (cannot remove owner; admin cannot remove other admins).

---

### PATCH /api/groups/:groupId/members/:userId/role

Change a member's role.

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200):** Updated member object.

**Auth:**
- Owner can promote/demote anyone.
- Admin can promote members to admin.
- Transferring ownership (`"role": "owner"`) requires current owner auth.

---

### POST /api/groups/:groupId/leave

Leave a group.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "You have left the group.",
    "ownershipTransferred": false
  }
}
```

If the owner leaves, `ownershipTransferred: true` and `newOwnerId` is returned.

---

### DELETE /api/groups/:groupId

Disband a group (owner only).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Group disbanded."
  }
}
```

**Behavior Notes:**
- This is a soft disband: group history is preserved.
- Existing members still see the conversation in their chat list.
- New messages are blocked after disband.

---

### POST /api/groups/:groupId/join-request

Submit a request to join a group (when join requests are enabled).

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "Join request submitted.",
    "status": "pending"
  }
}
```

---

### GET /api/groups/:groupId/join-requests

List pending join requests.

**Auth:** Owner or Admin only.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "requestId": "60d5ecb54b24a1001c8e4b80",
      "user": {
        "id": "...",
        "anonimiId": "aid_f3L7uV23",
        "username": "new_user",
        "profileImage": null
      },
      "createdAt": "2026-03-08T09:00:00Z"
    }
  ]
}
```

---

### PATCH /api/groups/:groupId/join-requests/:requestId

Approve or reject a join request.

**Request Body:**
```json
{
  "action": "approve"   // or "reject"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Join request approved."
  }
}
```

---

### PATCH /api/groups/:groupId/nickname

Set the authenticated user's nickname in the group.

**Request Body:**
```json
{
  "nickname": "Team Lead"
}
```

**Response (200):** Updated member object.

---

## 8. Blocks

### GET /api/blocks

List the authenticated user's block list.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "blockId": "60d5ecb54b24a1001c8e4b90",
      "blockedUser": {
        "id": "60d5ecb54b24a1001c8e4b3d",
        "anonimiId": "aid_c9H4pQ67",
        "username": "bob_builder",
        "profileImage": null
      },
      "createdAt": "2026-03-05T14:00:00Z"
    }
  ]
}
```

---

### POST /api/blocks

Block a user.

**Request Body:**
```json
{
  "targetAnonimiId": "aid_c9H4pQ67"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "blockId": "60d5ecb54b24a1001c8e4b91",
    "message": "User blocked."
  }
}
```

**Errors:**
- `409` — Already blocked

---

### DELETE /api/blocks/:blockId

Unblock a user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "User unblocked."
  }
}
```

Note: Re-blocking is allowed immediately after unblocking.

---

## 9. Reports

### POST /api/reports

Submit a report.

**Request Body:**
```json
{
  "targetType": "message",
  "targetId": "60d5ecb54b24a1001c8e4b50",
  "reason": "harassment",
  "description": "This user is sending threatening messages."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "reportId": "60d5ecb54b24a1001c8e4ba0",
    "message": "Report submitted. Our team will review it."
  }
}
```

Note: When `targetType` is `"message"`, the server automatically captures a message snapshot.

---

## 10. Support Tickets

### POST /api/support/tickets

Create a support ticket.

**Request Body:**
```json
{
  "subject": "Cannot reset my password",
  "reason": "login_issues",
  "message": "I've tried resetting my password but the email never arrives..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "ticketId": "60d5ecb54b24a1001c8e4bb0",
    "status": "open",
    "message": "Support ticket created."
  }
}
```

---

### GET /api/support/tickets

List the authenticated user's support tickets.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60d5ecb54b24a1001c8e4bb0",
      "subject": "Cannot reset my password",
      "reason": "login_issues",
      "status": "in_progress",
      "createdAt": "2026-03-07T16:00:00Z",
      "updatedAt": "2026-03-08T09:00:00Z"
    }
  ]
}
```

---

### GET /api/support/tickets/:ticketId

Get ticket details with messages.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "60d5ecb54b24a1001c8e4bb0",
      "subject": "Cannot reset my password",
      "reason": "login_issues",
      "status": "in_progress",
      "assignedTo": {
        "id": "...",
        "username": "support_agent_1"
      }
    },
    "messages": [
      {
        "id": "60d5ecb54b24a1001c8e4bb1",
        "senderId": "60d5ecb54b24a1001c8e4b3a",
        "senderRole": "user",
        "content": "I've tried resetting my password but the email never arrives...",
        "createdAt": "2026-03-07T16:00:00Z"
      },
      {
        "id": "60d5ecb54b24a1001c8e4bb2",
        "senderId": "60d5ecb54b24a1001c8e4bc0",
        "senderRole": "staff",
        "content": "I'm looking into this now. Can you confirm your email address?",
        "createdAt": "2026-03-08T09:00:00Z"
      }
    ]
  }
}
```

---

### POST /api/support/tickets/:ticketId/messages

Reply to a support ticket.

**Request Body:**
```json
{
  "content": "My email is john@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "messageId": "60d5ecb54b24a1001c8e4bb3",
    "content": "My email is john@example.com",
    "senderRole": "user",
    "createdAt": "2026-03-08T09:30:00Z"
  }
}
```

---

## 11. Media

### POST /api/media/upload

Upload a file (image, document, etc.).

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The file to upload |
| `category` | string | Yes | `"avatar"`, `"message"`, `"group"` |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/messages/a1b2c3d4-e5f6-7890.jpg",
    "fileName": "photo.jpg",
    "fileSize": 245678,
    "mimeType": "image/jpeg"
  }
}
```

**Constraints:**
- Max file size: 10 MB (images), 25 MB (documents)
- Allowed image types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Allowed document types: `application/pdf`, `application/zip`, `text/plain`, and common document formats

---

## 12. Admin Endpoints 🛡️

All admin endpoints require `role` of `super_admin`, `moderator`, or `support_staff` (with varying permissions per role — see [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)).

### Admin — Users

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/admin/users` | List/search users (with private fields) | All admin |
| `GET` | `/api/admin/users/:userId` | Full user profile (including email, phone) | All admin |
| `POST` | `/api/admin/users/:userId/warn` | Send a warning to a user | Moderator, Super Admin |
| `POST` | `/api/admin/users/:userId/ban` | Ban a user | Moderator, Super Admin |
| `POST` | `/api/admin/users/:userId/unban` | Unban a user | Moderator, Super Admin |
| `PATCH` | `/api/admin/users/:userId/role` | Change user/admin role | Super Admin only |

### Admin — Reports

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/admin/reports` | List reports (filterable by status, type) | Moderator, Super Admin |
| `GET` | `/api/admin/reports/:reportId` | Report details with snapshot | Moderator, Super Admin |
| `PATCH` | `/api/admin/reports/:reportId/claim` | Claim a report for review | Moderator, Super Admin |
| `PATCH` | `/api/admin/reports/:reportId/resolve` | Resolve a report with action | Moderator, Super Admin |
| `PATCH` | `/api/admin/reports/:reportId/dismiss` | Dismiss a report | Moderator, Super Admin |

### Admin — Support Tickets

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/admin/support/tickets` | List support tickets | All admin |
| `GET` | `/api/admin/support/tickets/:ticketId` | Ticket details + messages | All admin |
| `PATCH` | `/api/admin/support/tickets/:ticketId/assign` | Assign ticket to staff | Support Staff, Super Admin |
| `PATCH` | `/api/admin/support/tickets/:ticketId/status` | Update ticket status | Support Staff, Super Admin |
| `POST` | `/api/admin/support/tickets/:ticketId/messages` | Reply to ticket as staff | Support Staff, Super Admin |

### Admin — Groups

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/admin/groups` | List groups | Moderator, Super Admin |
| `GET` | `/api/admin/groups/:groupId` | Group details + members | Moderator, Super Admin |
| `DELETE` | `/api/admin/groups/:groupId` | Delete (archive) a group | Super Admin only |

### Admin — Messages

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/admin/conversations/:convId/messages` | View conversation messages (including unsent) | Moderator, Super Admin |

Note: Admins can **view** but never **edit** messages.

### Admin — Bans

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/admin/bans` | List active bans | Moderator, Super Admin |
| `GET` | `/api/admin/bans/history` | Full ban history | Super Admin only |

### Admin — Analytics

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/admin/analytics/overview` | Dashboard metrics | All admin |
| `GET` | `/api/admin/analytics/messages` | Message volume over time | Super Admin |
| `GET` | `/api/admin/analytics/users` | User growth and activity | Super Admin |

**Overview Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 15420,
    "activeUsers": 8930,
    "messagesLast24h": 45200,
    "groupsCreated": 2100,
    "pendingReports": 23,
    "openTickets": 12,
    "activeBans": 45
  }
}
```

### Admin — Logs

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/admin/logs` | Admin activity log | Super Admin only |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `adminId` | string | Filter by admin |
| `action` | string | Filter by action type |
| `startDate` | string | Start date (ISO 8601) |
| `endDate` | string | End date (ISO 8601) |
| `limit` | number | Results per page |
| `cursor` | string | Pagination cursor |

---

## 13. Health Check

### GET /api/health 🔓

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "database": "connected",
    "timestamp": "2026-03-08T12:00:00Z"
  }
}
```
