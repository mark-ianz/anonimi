# Support System

This document describes how support tickets and user reports work, the lifecycle and status meanings, and how admins access the support tools.

---

## 1. Who Can See All Tickets and Reports

Admin access is controlled by the `users.role` field. The only valid admin roles are:

- `super_admin`
- `moderator`
- `support_staff`

A plain value like `admin` is not a valid role and will not grant access.

**Important:** Access is enforced by JWT claims. If you change the role in MongoDB, you must log out and log back in (or refresh the token) for the new role to take effect.

Admin routes are under `/admin/*` and require one of the admin roles above.

---

## 2. Support Tickets (User Flow)

### Create a Ticket
- Users submit a ticket from `/support/create`.
- Required fields: `subject`, `reason`, `message`.
- An initial message is created with the ticket.

### View Tickets
- `/support` shows all support items for the user:
  - Support tickets (two-way chat with staff)
  - Reports (read-only status items)

### Reply to Ticket
- Users can reply in `/support/:ticketId`.
- Replies are real-time for both user and admin.

### Reopen a Ticket
- Resolved or closed tickets can be reopened by the user.
- Reopen changes the status back to `open`.

---

## 3. Support Ticket Status Meanings

| Status | Meaning | Who Sets It |
|--------|---------|-------------|
| `open` | New ticket created; waiting for staff | System on create, or user on reopen |
| `assigned` | Ticket claimed by a staff member | Staff |
| `in_progress` | Staff is actively working the issue | Staff |
| `waiting_on_user` | Staff is waiting on user reply/info | Staff (auto when user replies)
| `resolved` | Issue resolved; ticket can be reopened | Staff |
| `closed` | Ticket closed; can be reopened | Staff |

---

## 4. Reports in Support Tab (User View)

Reports are shown in `/support` alongside tickets as read-only items.

### Report Status Meanings

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting review |
| `under_review` | Being reviewed by staff |
| `resolved` | Action completed |
| `dismissed` | Report reviewed, no action taken |

Reports are not a chat thread. Users receive updates as status changes.

---

## 5. Admin Workflow (Support Staff / Moderator / Super Admin)

### Ticket Queue
- Admins see all tickets in `/admin/support`.
- Tickets are filtered by status and updated in real time.

### Ticket Actions
- Assign a ticket to yourself
- Reply to the user (sets status to `in_progress`)
- Update status (`open`, `assigned`, `in_progress`, `waiting_on_user`, `resolved`, `closed`)

### Reports
- Admins see all reports in `/admin/reports`.
- Reports can be resolved or dismissed.
- Report status updates are sent to the reporting user and appear in `/support`.

---

## 6. Notifications

Users receive notifications for:
- Ticket replies
- Ticket status changes
- Report status changes

---

## 7. Real-Time Events (High-Level)

User namespace (`/chat`):
- `support:ticket:new`
- `support:ticket:updated`
- `support:message:new`
- `support:report:new`
- `support:report:updated`

Admin namespace (`/admin`):
- `admin:support:ticket:new`
- `admin:support:ticket:updated`
- `admin:support:message:new`
- `admin:report:new`
- `admin:report:updated`
