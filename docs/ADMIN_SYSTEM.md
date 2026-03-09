# Admin System

This document defines the complete admin dashboard design including roles, permissions, dashboard sections, moderation workflows, and analytics specifications.

---

## 1. Admin Roles

EchoID has three admin roles, each with progressively more access.

### Role Definitions

| Role | Description | Assigned By |
|------|-------------|-------------|
| **Super Admin** | Full system access. Can manage other admins, view all data, configure the platform. | Database seed or another Super Admin |
| **Moderator** | User and content moderation. Can review reports, ban users, view conversations for moderation purposes. | Super Admin |
| **Support Staff** | Handles support tickets. Cannot perform moderation actions. | Super Admin |

### Role Assignment

- Admin roles are stored in the `users.role` field.
- Only **Super Admin** can change user roles.
- Every role change is recorded in `adminLogs`.
- The first Super Admin account is created via a database seed script during initial deployment.
- There should always be at least one Super Admin in the system.

### Role Hierarchy

```
Super Admin
  ├── All Moderator permissions
  ├── All Support Staff permissions
  ├── Manage admin roles (promote/demote)
  ├── Delete (archive) groups
  ├── View admin activity logs
  ├── View full analytics
  ├── View ban history
  └── System configuration

Moderator
  ├── All Support Staff permissions (read-only on tickets)
  ├── Search users with private fields (email, phone)
  ├── View user conversations (read-only)
  ├── Review and resolve reports
  ├── Warn users
  ├── Ban/unban users
  └── View basic analytics

Support Staff
  ├── Access admin dashboard
  ├── View and respond to support tickets
  ├── Assign tickets
  └── View overview analytics
```

---

## 2. Admin Dashboard Sections

The admin dashboard is a dedicated section of the frontend at `/admin/*`, using the `(admin)` route group with its own `AdminSidebar` layout. It is accessible only to users with admin roles. The root middleware redirects non-admin users attempting to access `/admin/*` to `/app/chat`.

> For complete frontend layout and component specifications, see **FRONTEND_DESIGN.md**.

### Section Overview

| Section | Description | Accessible By |
|---------|-------------|---------------|
| **Dashboard** | Overview metrics and quick stats | All admin |
| **Users** | User search, profiles, management | Moderator, Super Admin |
| **Reports** | Report queue, review, resolution | Moderator, Super Admin |
| **Support Tickets** | Ticket queue, assignment, responses | All admin |
| **Groups** | Group browsing, management | Moderator, Super Admin |
| **Messages** | Conversation browser (read-only) | Moderator, Super Admin |
| **Bans** | Active ban list, ban history | Moderator (active only), Super Admin (full history) |
| **Analytics** | Metrics, charts, trends | All admin (overview), Super Admin (full) |
| **Logs** | Admin activity audit trail | Super Admin only |

---

## 3. Dashboard (Home)

The landing page of the admin panel showing key metrics at a glance.

### Metric Cards

| Metric | Description | Update Frequency |
|--------|-------------|-----------------|
| Total Users | Count of all registered accounts | Real-time (via `/admin` socket) |
| Active Users (24h) | Users who logged in within 24 hours | Computed every 5 minutes |
| Messages Today | Messages sent in the current day (UTC) | Real-time |
| Pending Reports | Reports with status `pending` | Real-time |
| Open Tickets | Tickets with status `open` or `assigned` | Real-time |
| Active Bans | Currently active ban count | Real-time |
| Groups Created | Total groups | Daily refresh |
| New Users (7d) | Accounts created in the last 7 days | Daily refresh |

### Quick Actions

- View pending reports (link to Reports section)
- View open tickets (link to Support section)
- Search a user (inline search box)

### Real-Time Updates

The admin dashboard connects to the `/admin` Socket.IO namespace to receive live updates:
- New user registrations
- New reports
- New support tickets
- Periodic metrics updates (every 30 seconds)

---

## 4. Users Section

### User Search

Admins can search users by:
- EchoID
- Username
- Email (moderator+ only)
- Phone (moderator+ only)
- Account status (active, banned, pending)

### User Profile View (Admin)

Admin user profile shows **all** fields including private data:

| Field | Visibility |
|-------|------------|
| EchoID | Always shown |
| Username | Always shown |
| Email | Moderator+ |
| Phone | Moderator+ |
| Profile Image | Always shown |
| Account Status | Always shown |
| Role | Always shown |
| Online Status | Always shown |
| Last Seen | Always shown |
| Created At | Always shown |
| Active Bans | Always shown |
| Report History (as reporter) | Moderator+ |
| Report History (as target) | Moderator+ |
| Conversation Count | Moderator+ |
| Group Memberships | Moderator+ |

### User Actions

| Action | Description | Role Required |
|--------|-------------|---------------|
| **View Profile** | Full profile with all fields | All admin |
| **View Conversations** | Browse user's conversations (read-only) | Moderator+ |
| **Warn User** | Send a system warning to the user | Moderator+ |
| **Ban User** | Temporary or permanent ban | Moderator+ |
| **Unban User** | Lift an active ban | Moderator+ |
| **Change Role** | Promote/demote to admin roles | Super Admin only |

### Warning System

Warnings are delivered as:
1. An admin log entry recording the warning.
2. A system notification to the user (via Socket.IO `notification:new` event).
3. The warning appears in the user's notification center with the reason.

Warnings are informational — they do not restrict the user's account. Multiple warnings may escalate to a ban at the moderator's discretion.

### Ban Dialog

When banning a user, the admin must specify:

| Field | Required | Options |
|-------|----------|---------|
| Reason | Yes | Free text (e.g., "Repeated harassment after 2 warnings") |
| Ban Type | Yes | Temporary / Permanent |
| Duration (if temporary) | Yes (if temp) | Preset options: 1 day, 3 days, 7 days, 30 days, custom |

**Ban Effects:**
1. User's `status` set to `"banned"`.
2. All active refresh tokens invalidated.
3. Active Socket.IO connections disconnected.
4. User cannot log in until ban is lifted or expires.
5. Ban record created in `bans` collection.
6. Admin log entry created.

---

## 5. Reports Section

### Report Queue

The report queue shows all reports, prioritized by status and age:

**Default sort:** Pending reports first, then by creation date (oldest first).

**Filters:**
| Filter | Options |
|--------|---------|
| Status | Pending, Under Review, Resolved, Dismissed |
| Target Type | User, Message, Group |
| Reason | Spam, Harassment, Scam, etc. |
| Date Range | Start date – End date |
| Reporter | Search by username/ID |

### Report Detail View

| Section | Content |
|---------|---------|
| **Report Info** | Report ID, reporter, target type, reason, description, created date |
| **Target Info** | Reported user's profile / reported group info |
| **Message Snapshot** | (If message report) Original message content, sender, timestamp, conversation context |
| **Conversation Context** | (If message report) Surrounding messages for context (5 before, 5 after) |
| **Reporter History** | Previous reports by this reporter (detect abuse) |
| **Target History** | Previous reports against this target (detect patterns) |

### Report Workflow

```
┌──────────┐     ┌───────────────┐     ┌──────────────────────────────┐
│ Pending  │────▶│ Under Review  │────▶│  Resolved  or  Dismissed    │
│          │     │ (claimed by   │     │                              │
│          │     │  an admin)    │     │  Resolved: action taken      │
│          │     │               │     │  Dismissed: no action needed │
└──────────┘     └───────────────┘     └──────────────────────────────┘
```

### Resolution Actions

When resolving a report, the admin selects an action:

| Action | Effect |
|--------|--------|
| **No Action** | Mark resolved with note explaining why no action was needed |
| **Warning Issued** | Send warning to the reported user + resolve report |
| **User Banned** | Ban the reported user + resolve report |
| **Content Removed** | (For group reports) Archive the group + resolve report |

The admin must provide resolution notes explaining the decision.

---

## 6. Support Tickets Section

### Ticket Queue

**Default sort:** Open tickets first, then by creation date (oldest first).

**Filters:**
| Filter | Options |
|--------|---------|
| Status | Open, Assigned, In Progress, Waiting on User, Resolved, Closed |
| Reason | Account Recovery, Login Issues, Bug Report, Feature Request, Other |
| Assigned To | Staff member (or unassigned) |
| Date Range | Start date – End date |

### Ticket Detail View

| Section | Content |
|---------|---------|
| **Ticket Info** | Subject, reason, status, user who created it, creation date |
| **User Info** | Reporter's profile (quick access) |
| **Conversation Thread** | Chronological messages (user messages and staff replies) |
| **Assignment** | Currently assigned staff member |

### Ticket Workflow

```
┌──────┐     ┌──────────┐     ┌─────────────┐     ┌──────────────────┐
│ Open │────▶│ Assigned │────▶│ In Progress │────▶│ Resolved/Closed  │
│      │     │          │     │             │     │                  │
└──────┘     └──────────┘     │     ┌───────┘     └──────────────────┘
                              │     │
                              ▼     │
                      ┌──────────────────┐
                      │ Waiting on User  │
                      │ (staff needs     │
                      │  more info)      │
                      └──────────────────┘
```

### Support Actions

| Action | Description | Role Required |
|--------|-------------|---------------|
| **Claim/Assign** | Assign the ticket to yourself or another staff member | Support Staff+ |
| **Reply** | Send a message to the user | Support Staff+ |
| **Change Status** | Transition ticket status | Support Staff+ |
| **Close** | Close ticket without resolution (duplicate, spam, stale) | Support Staff+ |
| **Reopen** | Reopen a resolved/closed ticket | Support Staff+ |

---

## 7. Groups Section

### Group Browser

Admins can browse and search all groups in the system.

**Search By:**
- Group name
- Owner username or EchoID
- Member count range
- Creation date range

### Group Detail View

| Section | Content |
|---------|---------|
| **Group Info** | Name, image, creation date, settings |
| **Owner** | Owner profile link |
| **Members** | Full member list with roles |
| **Statistics** | Message count, member count, last activity date |
| **Reports** | Any reports against this group |

### Group Admin Actions

| Action | Description | Role Required |
|--------|-------------|---------------|
| **View Details** | See full group info and members | Moderator+ |
| **View Messages** | Browse group conversation (read-only) | Moderator+ |
| **Archive Group** | Soft-delete the group (members notified, group hidden) | Super Admin only |

---

## 8. Messages Section

### Conversation Browser

Admins can browse conversations for moderation purposes.

**Access:** Moderator+ only

**Search By:**
- User EchoID or username (find conversations involving a specific user)
- Conversation ID (direct lookup)

### Conversation View

- **Read-only** — admins cannot edit, delete, or send messages.
- Shows all messages including unsent messages (content visible to admins).
- Messages deleted-for-user are also visible.
- `unsent` messages are clearly labeled: *"[Unsent] Original content here"*
- `deletedFor` is shown: *"[Deleted for: user_a, user_b]"*

### Privacy Safeguard

- Every time an admin views a conversation, an entry is created in `adminLogs`:
  ```json
  {
    "action": "view_conversation",
    "targetType": "conversation",
    "targetId": "conversationId",
    "details": { "reason": "Report investigation #12345" }
  }
  ```
- Admins should provide a reason for viewing conversations (tied to a report, ticket, or investigation).

---

## 9. Bans Section

### Active Bans

| Column | Description |
|--------|-------------|
| User | Username, EchoID, profile image |
| Reason | Ban reason text |
| Type | Temporary / Permanent |
| Banned By | Admin who issued the ban |
| Banned At | Ban creation timestamp |
| Expires At | Expiry date (temp) or "Never" (perm) |
| Actions | Unban button |

### Ban History (Super Admin Only)

Shows all historical bans including lifted/expired ones:

| Column | Description |
|--------|-------------|
| User | Username, EchoID |
| Reason | Ban reason |
| Type | Temporary / Permanent |
| Banned By | Issuing admin |
| Banned At | Start date |
| Expires At | Expiry date |
| Status | Active / Expired / Lifted |
| Lifted By | Admin who lifted (if applicable) |
| Lifted At | Date lifted (if applicable) |

### Unban Flow

1. Admin clicks "Unban" on an active ban.
2. Confirmation dialog with note field.
3. On confirm:
   - Ban's `active` set to `false`
   - Ban's `unbannedBy` and `unbannedAt` set
   - User's `status` set back to `"active"`
   - Admin log entry created
   - User can now log in again

### Automatic Ban Expiry

A scheduled process (cron job or checked at login) handles temporary ban expiry:

1. Query bans where `active: true` AND `expiresAt <= now`.
2. Set `active: false` for each.
3. Set user `status` to `"active"`.
4. Create admin log entry: `"auto_unban"` action.

---

## 10. Analytics Section

### Overview (All Admin)

| Metric | Calculation |
|--------|-------------|
| Total Users | `users.countDocuments()` |
| Active Users (24h) | Users with `lastSeen >= 24 hours ago` |
| Messages Today | `messages.countDocuments({ createdAt: >= start of today })` |
| Groups Created | `groups.countDocuments()` |
| Pending Reports | `reports.countDocuments({ status: "pending" })` |
| Active Bans | `bans.countDocuments({ active: true })` |

### Detailed Analytics (Super Admin)

#### User Analytics

| Metric | Visualization |
|--------|---------------|
| New registrations per day (30 days) | Line chart |
| DAU (Daily Active Users) trend | Line chart |
| MAU (Monthly Active Users) | Single metric |
| User status distribution | Pie chart (active, banned, pending) |
| Role distribution | Pie chart |

#### Message Analytics

| Metric | Visualization |
|--------|---------------|
| Messages per day (30 days) | Bar chart |
| Messages per hour (last 24h) | Bar chart |
| Message type distribution | Pie chart (text, image, file, system) |
| Average messages per user | Single metric |

#### Report Analytics

| Metric | Visualization |
|--------|---------------|
| Reports per day (30 days) | Line chart |
| Report reason distribution | Pie chart |
| Average resolution time | Single metric |
| Resolution outcome distribution | Pie chart (warned, banned, dismissed, no action) |

#### Support Analytics

| Metric | Visualization |
|--------|---------------|
| Tickets per day (30 days) | Line chart |
| Ticket reason distribution | Pie chart |
| Average response time | Single metric |
| Average resolution time | Single metric |
| Tickets per support staff | Bar chart |

### Data Computation Strategy

Analytics are **computed on-demand with caching**:

1. When an admin requests analytics, check cache (in-memory or Redis).
2. If cache is fresh (< 5 minutes old for overview, < 1 hour for detailed), return cached.
3. If stale, run MongoDB aggregation pipeline, cache result, return.
4. Heavy aggregations (30-day trends) are pre-computed by a scheduled job every hour.

---

## 11. Admin Activity Logs

### Log Viewer (Super Admin Only)

Displays a chronological feed of all admin actions.

### Log Entry Display

| Column | Content |
|--------|---------|
| Timestamp | When the action occurred |
| Admin | Username + role of the admin |
| Action | Human-readable action description |
| Target | Link to the affected entity |
| Details | Additional context (reason, duration, etc.) |
| IP Address | Admin's IP at time of action |

### Filters

| Filter | Options |
|--------|---------|
| Admin | Select specific admin(s) |
| Action Type | Ban, Unban, Warn, Resolve Report, etc. |
| Target Type | User, Group, Report, Ticket |
| Date Range | Start – End |

### Log Actions (All Tracked)

| Action Code | When Logged | Details Stored |
|-------------|-------------|----------------|
| `ban_user` | Admin bans a user | reason, type, duration |
| `unban_user` | Admin unbans a user | ban reference |
| `auto_unban` | Temporary ban expires | ban reference |
| `warn_user` | Admin warns a user | warning message |
| `resolve_report` | Report resolved with action | resolution type, notes |
| `dismiss_report` | Report dismissed | dismissal reason |
| `claim_report` | Admin claims a report | report ID |
| `delete_group` | Group archived | group name, member count |
| `change_role` | User role changed | old role, new role |
| `view_conversation` | Admin browses a conversation | conversation ID, reason |
| `assign_ticket` | Ticket assigned to staff | ticket ID, staff ID |
| `resolve_ticket` | Ticket resolved | resolution notes |
| `close_ticket` | Ticket closed | close reason |
| `reply_ticket` | Staff replies to ticket | ticket ID |

---

## 12. Admin UI Layout

### Navigation Structure

```
Admin Dashboard
├── 📊 Dashboard          (Overview metrics)
├── 👥 Users              (User management)
│   ├── Search
│   └── User Detail
├── 🚩 Reports            (Moderation queue)
│   ├── Queue
│   └── Report Detail
├── 🎫 Support            (Ticket management)
│   ├── Queue
│   └── Ticket Detail
├── 👥 Groups             (Group management)
│   ├── Browse
│   └── Group Detail
├── 💬 Messages           (Conversation browser)
├── 🚫 Bans              (Ban management)
│   ├── Active Bans
│   └── Ban History
├── 📈 Analytics          (Metrics & charts)
└── 📋 Logs              (Audit trail)
```

### Access Control in UI

- Navigation items are **hidden** for roles that lack access.
- Even if a user navigates directly to an admin URL, the backend will reject unauthorized requests.
- Frontend checks the user's role from the auth state and conditionally renders admin navigation.

### Admin Route Protection

All admin routes in the frontend are wrapped in a protection layer:

1. Check if user is authenticated.
2. Check if user has an admin role.
3. Check if the specific section is accessible to their role level.
4. If any check fails, redirect to the main app or show "Access Denied."
