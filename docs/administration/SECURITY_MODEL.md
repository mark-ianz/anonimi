# Security Model

This document defines the security architecture for anonimi, covering authentication, authorization, input validation, rate limiting, spam prevention, and data protection.

---

## 1. Authentication

### JWT Token Architecture

anonimi uses a **dual-token strategy** (access + refresh) for stateless authentication.

| Token | Lifetime | Purpose | Storage (Web) | Storage (Mobile) |
|-------|----------|---------|---------------|-------------------|
| Access Token | 15 minutes | Authenticates API requests | localStorage + `access_token` cookie (for middleware routing) | Encrypted secure storage |
| Refresh Token | 7 days | Obtains new access tokens | localStorage | Encrypted secure storage |

### Access Token Payload

```json
{
  "userId": "60d5ecb54b24a1001c8e4b3a",
  "anonimiId": "aid_a8F3kP29",
  "role": "user",
  "iat": 1709913600,
  "exp": 1709914500
}
```

The access token is **self-contained** — the server does not need a database lookup for every request. The token contains enough information for authorization decisions.

### Token Signing

| Parameter | Value |
|-----------|-------|
| Algorithm | HS256 (HMAC-SHA256) |
| Secret | `JWT_SECRET` environment variable (min 64 chars random) |
| Refresh Secret | `JWT_REFRESH_SECRET` (separate from access secret) |

### Refresh Token Rotation

Every time a refresh token is used, it is **invalidated** and a new one is issued:

```
1. Client sends refresh token → POST /api/auth/refresh-token
2. Server verifies token exists in refreshTokens collection
3. Server deletes the used refresh token
4. Server generates new access token + new refresh token
5. Server stores new refresh token hash in refreshTokens collection
6. Server returns both new tokens to client
```

**Replay Detection:**  
If a refresh token that was already used is presented again (potential theft), the server:
1. Detects the reuse (token not found in DB, but was valid recently).
2. Invalidates ALL refresh tokens for that user.
3. Forces re-login on all devices.

### Token Revocation Events

All refresh tokens for a user are invalidated when:
- User logs out
- User changes password
- User is banned by admin
- Replay attack detected
- Admin forces session invalidation

### Temporary Accounts

Temporary accounts use standard JWT tokens but are constrained by policy:

- Temporary sessions expire after 24 hours and are removed by a cleanup job.
- Sensitive actions are gated by `requireFullAccount` middleware until claimed.
- Claiming attaches email/password and triggers verification before full access.

### Password Security

| Parameter | Value |
|-----------|-------|
| Algorithm | bcrypt |
| Salt Rounds | 12 |
| Min Length | 8 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 number |
| Max Length | 128 characters (prevent bcrypt DOS) |
| Breach Check | Optional — check against haveibeenpwned API (future) |

---

## 2. Authorization (RBAC)

### Role Hierarchy

```
super_admin (full system access)
  └── moderator (user moderation, reports)
      └── support_staff (support tickets only)
          └── user (standard user)
```

### Permission Matrix

| Action | User | Support Staff | Moderator | Super Admin |
|--------|------|---------------|-----------|-------------|
| Use chat features | ✅ | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Search users (public fields) | ✅ | ✅ | ✅ | ✅ |
| Submit reports | ✅ | ✅ | ✅ | ✅ |
| Create support tickets | ✅ | ✅ | ✅ | ✅ |
| **Admin Dashboard access** | ❌ | ✅ | ✅ | ✅ |
| View support tickets (all) | ❌ | ✅ | ✅ | ✅ |
| Reply to tickets as staff | ❌ | ✅ | ❌ | ✅ |
| Assign tickets | ❌ | ✅ | ❌ | ✅ |
| Search users (private fields) | ❌ | ❌ | ✅ | ✅ |
| View user conversations | ❌ | ❌ | ✅ | ✅ |
| Review reports | ❌ | ❌ | ✅ | ✅ |
| Warn users | ❌ | ❌ | ✅ | ✅ |
| Ban/unban users | ❌ | ❌ | ✅ | ✅ |
| Delete (archive) groups | ❌ | ❌ | ❌ | ✅ |
| Manage admin roles | ❌ | ❌ | ❌ | ✅ |
| View admin activity logs | ❌ | ❌ | ❌ | ✅ |
| View full analytics | ❌ | ❌ | ❌ | ✅ |
| View ban history | ❌ | ❌ | ❌ | ✅ |

### Middleware Enforcement

```
Route: DELETE /api/admin/groups/:groupId
  → authMiddleware (verify JWT, attach user)
  → requireRole("super_admin")
  → controller.deleteGroup()
```

Role checking is done via middleware that reads `req.user.role` (set by auth middleware from the JWT payload) and compares against the required role(s).

---

## 3. Input Validation

### Validation Strategy

All request input (body, params, query) is validated using **Zod** schemas before reaching the controller.

### Validation Layers

```
Layer 1: Zod Schema (structure, types, constraints)
Layer 2: Business Logic (uniqueness, existence, permissions)
Layer 3: Database (unique indexes as final safety net)
```

### Validation Rules by Domain

#### Authentication

| Field | Rules |
|-------|-------|
| `email` | Valid email format (Zod `.email()`), max 255 chars, lowercase normalized |
| `phone` | E.164 format (`+` followed by 7-15 digits), validated with regex |
| `username` | 3–30 chars, `^[a-zA-Z0-9_.]{3,30}$`, trimmed |
| `password` | 8–128 chars, at least 1 uppercase, 1 lowercase, 1 number |
| `verificationCode` | Exactly 6 digits |

#### Messages

| Field | Rules |
|-------|-------|
| `content` | Max 256 characters for text messages and captions |
| `type` | Enum: `"text"`, `"image"`, `"video"`, `"audio"`, `"file"`, `"system"` |
| `conversationId` | Valid MongoDB ObjectId |
| `mediaUrl` | Valid URL path, must match known upload patterns |

#### Groups

| Field | Rules |
|-------|-------|
| `name` | 1–100 characters, trimmed, no leading/trailing whitespace |
| `memberAnonimiIds` | Array of valid anonimis, min 1, max 256 members |

#### Reports

| Field | Rules |
|-------|-------|
| `targetType` | Enum: `"user"`, `"message"`, `"group"` |
| `reason` | Enum: restricted to defined reasons |
| `description` | Max 2,000 characters, optional |

### Sanitization

- All string inputs are trimmed of leading/trailing whitespace.
- HTML/script tags are stripped or escaped (prevent stored XSS).
- MongoDB special characters (`$`, `.`) are sanitized in user input to prevent **NoSQL injection**.
- Object keys starting with `$` are rejected.

---

## 4. Rate Limiting

### Strategy

Rate limiting is implemented at the Express middleware level using `express-rate-limit` with a sliding window algorithm.

### Rate Limit Tiers

| Tier | Applies To | Limit | Window | Key |
|------|------------|-------|--------|-----|
| **Auth (strict)** | `/api/auth/login`, `/register`, `/forgot-password` | 5 requests | 15 minutes | Per IP |
| **Verification** | `/api/auth/verify-*`, `/reset-password` | 5 requests | 15 minutes | Per IP |
| **Search** | `/api/users/search` | 30 requests | 1 minute | Per user |
| **General API** | All other authenticated endpoints | 100 requests | 1 minute | Per user |
| **Upload** | `/api/media/upload` | 10 requests | 1 minute | Per user |
| **Reports** | `/api/reports` | 5 requests | 1 hour | Per user |
| **Contact Requests** | `/api/contacts/request` | 20 requests | 1 hour | Per user |

### Rate Limit Response

```
HTTP 429 Too Many Requests

Headers:
  Retry-After: 45
  X-RateLimit-Limit: 5
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1709914500

Body:
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again in 45 seconds."
  }
}
```

### Socket.IO Rate Limiting

Socket events are rate-limited independently (see [SOCKET_EVENTS.md](./SOCKET_EVENTS.md)):

| Event | Limit | Window |
|-------|-------|--------|
| `message:send` | 30 events | 60 seconds |
| `message:typing` | 10 events | 10 seconds |
| `message:read` | 20 events | 60 seconds |

---

## 5. Spam Prevention

### Message Spam Detection

| Rule | Threshold | Action |
|------|-----------|--------|
| Rapid messages | > 30 messages in 60 seconds | Rate limit + warning |
| Duplicate content | Same message sent 5+ times in 5 minutes | Silently drop duplicates |
| Mass messaging | Messages to 20+ new conversations in 1 hour | Temporary send restriction |

### Contact Request Spam

| Rule | Threshold | Action |
|------|-----------|--------|
| Contact request volume | > 20 requests in 1 hour | Rate limit |
| Declined request ratio | > 80% declined in 24 hours | Temporary request restriction |

### Report Abuse Prevention

| Rule | Threshold | Action |
|------|-----------|--------|
| Report volume | > 5 reports in 1 hour | Rate limit |
| Mass false reports | Pattern detected by admin review | Flag reporter for review |

### Group Creation Spam

| Rule | Threshold | Action |
|------|-----------|--------|
| Group creation | > 5 groups in 1 hour | Rate limit |

---

## 6. Block System Security

### Blocking Rules

When User A blocks User B:

1. **Message delivery blocked** — Messages from B to A are silently rejected (B does not receive an error indicating they are blocked).
2. **Contact requests blocked** — B cannot send contact requests to A.
3. **Presence hidden** — B sees A as "offline" and does not receive presence updates.
4. **Search visibility** — B can still find A in search (blocking does not make a user invisible).
5. **Bidirectional restriction** — A also cannot message B (the blocker chose to sever the connection).

### Block Cooldown

To prevent weaponized blocking (repeatedly blocking/unblocking to harass):

- After unblocking, the user must wait **48 hours** before re-blocking the same person.
- This cooldown is configurable via environment variable: `BLOCK_COOLDOWN_HOURS=48`.
- Cooldown is per-pair, not global.

### Implementation Detail

- Block status is checked at multiple points:
  - Before sending a message (ChatService)
  - Before sending a contact request (ContactService)
  - Before delivering Socket.IO events (event handlers)
  - When computing presence visibility (PresenceService)

---

## 7. File Upload Security

### Validation Rules

| Constraint | Value |
|------------|-------|
| Max image size | 10 MB |
| Max document size | 25 MB |
| Allowed image MIME types | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| Allowed document MIME types | `application/pdf`, `application/zip`, `text/plain`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| File naming | UUID v4 + original extension (no user-controlled file names on disk) |
| Storage path | `uploads/<category>/<uuid>.<ext>` |

### Security Measures

1. **MIME type validation** — Check both `Content-Type` header and file magic bytes (use `file-type` library).
2. **Extension whitelist** — Only allow known safe extensions.
3. **File name sanitization** — Never use the original file name for storage. Generate UUID.
4. **Path traversal prevention** — Validate that resolved file paths stay within the `uploads/` directory.
5. **Execution prevention** — Serve uploaded files with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff` headers. Never execute server-side.
6. **Virus scanning (future)** — Hook for ClamAV or cloud-based scanning before storage.

### Static File Serving Headers

```
Content-Disposition: inline (images) | attachment (documents)
X-Content-Type-Options: nosniff
Cache-Control: public, max-age=31536000 (for immutable media)
```

---

## 8. CORS Configuration

### Development

```javascript
{
  origin: ["https://anonimi-messaging.vercel.app"],     // Next.js dev server
  credentials: true,                     // Allow cookies
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}
```

### Production

```javascript
{
  origin: [
    "https://anonimi.com",              // Web frontend
    "https://www.anonimi.com"            // www variant
    // Mobile app origins added later
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}
```

### Socket.IO CORS

Socket.IO server mirrors the Express CORS configuration to ensure WebSocket upgrade requests are properly authenticated.

---

## 9. Data Privacy

### Private Fields

The following fields are **never** returned in public API responses:

| Field | Visibility |
|-------|------------|
| `email` | Only visible to the user themselves (`GET /api/users/me`) and admins |
| `phone` | Only visible to the user themselves and admins |
| `passwordHash` | Never returned in any API response |
| `verificationCode` | Never returned in any API response |
| `emailVerificationTokenHash` | Never returned in any API response |
| `passwordResetToken` | Never returned in any API response |

### Field Projection

All user queries use explicit field projection (`select`) to exclude private fields:

```javascript
// Public user query
User.findOne({ anonimiId }).select("-email -phone -passwordHash -verificationCode -passwordResetToken");
```

### Admin Override

Admin endpoints use separate projections that include `email` and `phone` for moderation purposes but still exclude `passwordHash`.

---

## 10. NoSQL Injection Prevention

MongoDB is vulnerable to **query injection** via operator-based attacks. Prevention strategies:

### 1. Mongoose Schema Enforcement

All fields have defined types. Mongoose rejects mismatched types (e.g., object where string expected).

### 2. Input Sanitization

Before passing user input to queries:
- Reject any key starting with `$` (MongoDB operator prefix).
- Use `mongo-sanitize` or equivalent middleware.
- Validate all query parameters are strings/numbers, not objects.

### 3. Parameterized Queries

Always use Mongoose query builder methods with explicit parameters:

```javascript
// Safe
User.findOne({ email: sanitizedEmail });

// Never construct queries from raw user input objects
```

---

## 11. XSS Prevention

### Output Encoding

- All user-generated content (messages, usernames, group names) is stored as-is in the database.
- The **frontend** is responsible for safe rendering (React's JSX auto-escapes by default).
- API responses are JSON (`Content-Type: application/json`), which is not rendered as HTML by browsers.

### Input Sanitization

- Strip HTML tags from text inputs where HTML is not expected (usernames, group names).
- Messages may contain markdown-like formatting (handled by frontend renderer) but executable scripts are stripped.

### Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0                    // Deprecated, rely on CSP instead
Content-Security-Policy: default-src 'self'
```

---

## 12. Moderation Audit Trail

### Immutable Logging

Every admin action creates an immutable log entry:

```json
{
  "adminId": "ObjectId",
  "action": "ban_user",
  "targetType": "user",
  "targetId": "ObjectId",
  "details": {
    "reason": "Repeated harassment",
    "type": "temporary",
    "duration": "7d"
  },
  "ipAddress": "192.168.1.1",
  "createdAt": "2026-03-08T12:00:00Z"
}
```

### What is Logged

| Action | Logged Details |
|--------|---------------|
| Ban user | Reason, duration, type (temp/perm) |
| Unban user | Original ban reference |
| Warn user | Warning message |
| Resolve report | Resolution type, notes |
| Dismiss report | Reason for dismissal |
| Delete group | Group name, owner, member count |
| Role change | Old role → new role |
| View conversation | Conversation ID, reason |
| Assign ticket | Ticket ID, assigned staff |
| Resolve ticket | Resolution notes |

### Log Integrity

- Admin log documents are **insert-only** — no updates or deletes are permitted.
- The `createdAt` field is server-generated (not client-provided).
- MongoDB `adminLogs` collection can have a capped size or archival strategy for long-term storage.

---

## 13. Environment Variables

All secrets and configuration are stored in environment variables, never committed to source control.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` / `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/anonimi` |
| `JWT_SECRET` | Access token signing secret | 64+ random chars |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | 64+ random chars |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `https://anonimi-messaging.vercel.app` |
| `STORAGE_ADAPTER` | Media storage type | `local` / `s3` |
| `UPLOAD_DIR` | Local upload directory | `./uploads` |
| `MAX_FILE_SIZE_MB` | Max upload size | `25` |
| `BLOCK_COOLDOWN_HOURS` | Re-block cooldown | `48` |
| `UNSEND_WINDOW_HOURS` | Message unsend time limit | `24` |

### Validation

Environment variables are validated at server startup using a Zod schema. Missing or invalid variables cause immediate server exit with a descriptive error message, preventing the application from running with incomplete configuration.

---

## 14. Security Headers

Applied globally via middleware (e.g., `helmet`):

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `0` | Disable legacy XSS filter (rely on CSP) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS (production) |
| `Content-Security-Policy` | `default-src 'self'` | Restrict resource loading |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer information |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restrict browser features |

---

## 15. Dependency Security

### Practices

- Run `npm audit` regularly and before each deployment.
- Use `npm audit fix` for automatic patching of non-breaking vulnerabilities.
- Pin major versions in `package.json` to prevent unexpected breaking changes.
- Review changelogs before upgrading major dependency versions.
- Use only well-maintained, widely-adopted packages.

### Key Security Dependencies

| Package | Purpose |
|---------|---------|
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT generation and verification |
| `helmet` | Security headers |
| `express-rate-limit` | Rate limiting |
| `cors` | CORS configuration |
| `zod` | Input validation |
| `mongo-sanitize` | NoSQL injection prevention |
| `multer` | File upload parsing |
| `file-type` | MIME type detection (magic bytes) |

---

## 16. Frontend Authentication Routing

The Next.js frontend enforces authentication boundaries at the routing layer using Next.js middleware, providing defense-in-depth alongside backend token validation.

### Middleware Auth Check

A `middleware.ts` file at `src/` intercepts every navigation request and applies the following rules:

| Route Pattern | No Token | Valid Token | Valid Token + Admin Role |
|---------------|----------|-------------|--------------------------|
| `/`, `/about`, `/features`, `/contact`, `/faq`, `/privacy`, `/terms` | Allow | Allow | Allow |
| `/login`, `/register` | Allow | Redirect → `/chat` | Redirect → `/chat` |
| `/verify`, `/forgot-password`, `/reset-password` | Allow | Redirect → `/chat` | Redirect → `/chat` |
| `/app/*` | Redirect → `/login` | Allow | Allow |
| `/admin/*` | Redirect → `/login` | Redirect → `/chat` | Allow |

### Security Considerations

1. **Hybrid token strategy:** Access and refresh tokens are stored in localStorage for API auth headers, and an `access_token` cookie is mirrored so Next.js middleware can perform route checks.
2. **Role enforcement is server-validated:** The middleware reads the JWT payload for role checks, but all admin actions are re-validated server-side by the backend API.
3. **Client exposure tradeoff acknowledged:** Tokens are available to client JavaScript by design in the current architecture; sensitive operations are still enforced server-side with JWT validation and role checks.
4. **WebSocket auth:** The Socket.IO client sends the access token during the handshake. The server validates the token before accepting the connection. This is independent of the middleware routing.
5. **Redirect loops prevention:** The middleware explicitly allows auth pages for unauthenticated users and skips static assets (`_next/`, images, fonts).
