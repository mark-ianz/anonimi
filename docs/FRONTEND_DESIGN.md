# Frontend Design

This document defines the complete frontend architecture for anonimi. It covers the application structure, routing system, layout hierarchy, page specifications, component organization, state management, and authentication flow.

**anonimi is an enterprise SaaS web application.** The chat system is the core product, but the frontend includes a full public marketing site, authentication flows, and an admin panel.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Tech Stack](#2-tech-stack)
3. [Route Architecture](#3-route-architecture)
4. [Authentication Routing Behavior](#4-authentication-routing-behavior)
5. [Layout System](#5-layout-system)
6. [Public Marketing Site](#6-public-marketing-site)
7. [Authentication Pages](#7-authentication-pages)
8. [Authenticated Application](#8-authenticated-application)
9. [Admin Panel](#9-admin-panel)
10. [Component Architecture](#10-component-architecture)
11. [State Management](#11-state-management)
12. [Data Fetching Strategy](#12-data-fetching-strategy)
13. [Real-Time System](#13-real-time-system)
14. [Theming and Styling](#14-theming-and-styling)
15. [SEO and Metadata](#15-seo-and-metadata)
16. [Responsive Design](#16-responsive-design)

---

## 1. Application Overview

The anonimi frontend is a **Next.js App Router** application that serves three distinct experiences:

| Experience | URL Pattern | Audience | Layout |
|------------|-------------|----------|--------|
| **Public Marketing Site** | `/`, `/about`, `/features`, `/contact`, `/faq`, `/privacy`, `/terms` | Unauthenticated visitors | Marketing layout (navbar + footer) |
| **Authentication** | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify`, `/verify-link` | Unauthenticated users | Minimal centered layout |
| **Application** | `/chat`, `/contacts`, `/message-requests`, `/settings`, `/profile`, `/archive`, `/groups` | Authenticated users | Application layout (sidebar + content) |
| **Admin Panel** | `/admin/*` | Authenticated admins | Admin layout (admin sidebar + content) |

These are implemented as **Next.js route groups** with separate layouts, sharing a single deployment.

---

## 2. Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** (App Router) | 16+ | Framework — SSR, SSG, routing, middleware, layouts |
| **TypeScript** | 5+ | Type safety across entire frontend |
| **React** | 19+ | UI library with React Compiler |
| **Tailwind CSS** | 4+ | Utility-first styling |
| **shadcn/ui** | Latest | Accessible component library (Radix UI primitives) |
| **TanStack Query** | 5+ | Server-state management, caching, optimistic updates |
| **Zustand** | 5+ | Lightweight client-state management |
| **Socket.IO Client** | 4+ | Real-time messaging, presence, typing indicators |
| **React Hook Form** | 7+ | Form state management |
| **Zod** | 4+ | Schema validation (shared with backend patterns) |
| **Axios** | 1+ | HTTP client with interceptors |
| **Lucide React** | Latest | Icon library |
| **date-fns** | 4+ | Date formatting and manipulation |
| **Sonner** | 2+ | Toast notification system |

---

## 3. Route Architecture

### Complete Route Map

#### Public Routes (No Authentication Required)

```
/                           → Landing page (marketing hero + CTAs)
/about                      → About the platform
/features                   → Feature showcase
/contact                    → Contact form / info
/faq                        → Frequently asked questions
/privacy                    → Privacy policy
/terms                      → Terms of service
```

#### Authentication Routes (Unauthenticated Only)

```
/login                      → Login form
/register                   → Registration form
/forgot-password            → Password reset request
/reset-password             → Password reset with token
/verify                     → Email verification
/verify-link                → Email verification link
```

#### Application Routes (Authentication Required)

```
/chat                       → Conversation list (default app view)
/chat/[conversationId]      → Active conversation / chat view
/chat?tab=all|unread|private|groups → Conversation filters (groups live under chat)
/search                     → Global search (contacts, people, conversations, message hits)
/contacts                   → Contacts list
/contacts/requests          → Incoming contact requests
/groups                     → Redirect to `/chat?tab=groups`
/groups/create              → Create new group
/groups/[groupId]           → Group chat view
/groups/[groupId]/settings  → Group settings
/message-requests           → Message requests from non-contacts
/profile                    → Own profile view + edit
/user/[anonimiId]              → Public user profile
/settings                   → Application settings (account, notifications, privacy)
/archive                    → Archived conversations
/blocked                    → Blocked users list
/support                    → Support tickets list
/support/create             → Create support ticket
/support/[ticketId]         → Ticket detail + thread
```

#### Admin Routes (Admin Role Required)

```
/admin                      → Admin dashboard (overview metrics)
/admin/users                → User search + management
/admin/users/[userId]       → Admin user detail view
/admin/reports              → Report queue
/admin/reports/[reportId]   → Report detail + resolution
/admin/support              → Admin support ticket queue
/admin/support/[ticketId]   → Admin ticket detail + thread
/admin/groups               → Group browser + management
/admin/groups/[groupId]     → Admin group detail
/admin/messages/[conversationId] → Read-only conversation viewer
/admin/bans                 → Ban management
/admin/analytics            → Analytics dashboard
/admin/logs                 → Admin activity audit trail
```

### Route Groups (Next.js App Router)

```
src/app/
├── (public)/               → Marketing site pages (marketing layout)
├── (auth)/                 → Authentication pages (minimal auth layout)
├── (main)/                 → Authenticated app pages (app layout with sidebar)
└── (admin)/                → Admin panel pages (admin layout)
```

---

## 4. Authentication Routing Behavior

### Next.js Middleware

Authentication routing is enforced via **Next.js middleware** (`middleware.ts` at the project root). The middleware reads the auth cookie on every request and redirects accordingly.

### Routing Rules

```
Middleware Logic:

1. Read `access_token` cookie from the request.

2. If path matches PUBLIC routes (/, /about, /features, /contact, /faq, /privacy, /terms):
   - If authenticated → redirect to /chat
   - If NOT authenticated → allow access (show marketing page)

3. If path matches AUTH routes (/login, /register, /forgot-password, /reset-password, /verify, /verify-link):
   - If authenticated → redirect to /chat
   - If NOT authenticated → allow access (show auth page)

4. If path matches APP routes (core app pages like /chat, /contacts, /groups, /message-requests, /profile, /settings, /blocked, /support, /user/*):
   - If authenticated → allow access
   - If NOT authenticated → redirect to /login?redirect={originalPath}

5. If path matches ADMIN routes (/admin/*):
   - If authenticated AND has admin role → allow access
   - If authenticated but NOT admin → redirect to /chat
   - If NOT authenticated → redirect to /login?redirect={originalPath}
```

### Implementation Notes

- The middleware performs a **lightweight JWT decode** (not full verification) to check for the token's existence and extract the role claim. Full verification happens on the backend.
- The `redirect` query parameter preserves the user's intended destination through the login flow.
- The root path `/` is the **only** public route that performs auth-based redirection. All other public routes remain accessible regardless of auth state (with a "Go to App" link in the navbar for authenticated users).

---

## 5. Layout System

anonimi uses four distinct layout hierarchies, implemented via Next.js route groups.

### Root Layout (`src/app/layout.tsx`)

The root layout wraps the entire application. It provides:

- HTML document structure, fonts (Outfit + Plus Jakarta Sans), and global CSS
- Providers: `QueryProvider` (TanStack Query), `ThemeProvider` (dark/light mode)
- Toast notifications (Sonner)
- Metadata defaults

```
Root Layout
├── QueryProvider
│   └── ThemeProvider
│       └── {children}
│       └── <Toaster />
```

**Note:** `SocketProvider` is NOT in the root layout. It only wraps the authenticated application layout, since unauthenticated pages do not need WebSocket connections.

### Marketing Layout (`src/app/(public)/layout.tsx`)

For all public-facing marketing pages.

```
Marketing Layout
├── <MarketingNavbar />        ← Logo, nav links, Login/Sign Up buttons
├── <main>{children}</main>    ← Page content
└── <MarketingFooter />        ← Links, legal, social
```

**Navbar contents:**
- Logo/brand (links to `/`)
- Navigation links: Features, About, FAQ, Contact
- CTA buttons: "Log In" (ghost/outline), "Get Started" (primary)
- Mobile: Hamburger menu with drawer

**Footer contents:**
- Product links: Features, About, FAQ
- Legal links: Privacy Policy, Terms of Service
- Social media links (optional)
- Copyright notice

### Auth Layout (`src/app/(auth)/layout.tsx`)

Minimal, centered layout for authentication forms.

```
Auth Layout
├── <main>                     ← Centered container
│   ├── <Logo />               ← anonimi brand mark
│   └── {children}             ← Auth form card
└── <footer>                   ← "Back to home" link
```

- Clean, distraction-free design
- Centered card containing the auth form
- No navigation bar or sidebar
- Optional: Split-screen design with branding panel on one side

### Application Layout (`src/app/(main)/layout.tsx`)

The main authenticated application experience.

```
Application Layout
├── <SocketProvider>           ← WebSocket connection (only for authenticated users)
│   ├── <AppSidebar />        ← Collapsible navigation sidebar
│   │   ├── User avatar + name
│   │   ├── Nav items:
│   │   │   ├── Chats          → /chat
│   │   │   ├── Contacts       → /contacts
│   │   │   ├── Archive        → /archive
│   │   │   └── Profile        → /profile
│   │   ├── Bottom nav:
│   │   │   ├── Settings       → /settings
│   │   │   ├── Support        → /support
│   │   │   └── Admin          → /admin (if admin role)
│   │   └── Collapse toggle
│   └── <main>{children}</main> ← Page content area
```

**Sidebar behavior:**
- Collapsible (icons-only mode) for more content space
- Unread counts as badges on Chats and Contacts; message requests appear via a banner in the chat list
- Active route highlighted
- Responsive: On mobile, sidebar becomes a bottom tab bar or a sheet/drawer
- WebSocket connection status indicator
- Groups are accessed via chat tabs (All/Unread/Private/Groups), with a New Group action shown on the Groups tab

### Admin Layout (`src/app/(admin)/layout.tsx`)

Separate layout for the admin panel.

```
Admin Layout
├── <AdminSidebar />           ← Admin navigation
│   ├── Admin branding
│   ├── Nav items:
│   │   ├── Dashboard          → /admin
│   │   ├── Users              → /admin/users
│   │   ├── Reports            → /admin/reports
│   │   ├── Support            → /admin/support
│   │   ├── Groups             → /admin/groups
│   │   ├── Messages           → /admin/messages
│   │   ├── Bans               → /admin/bans
│   │   ├── Analytics          → /admin/analytics
│   │   └── Logs               → /admin/logs (super_admin only)
│   └── "Back to App" link     → /chat
├── <AdminHeader />            ← Page title, admin info, breadcrumbs
└── <main>{children}</main>    ← Admin content area
```

---

## 6. Public Marketing Site

### 6.1 Landing Page (`/`)

The landing page introduces anonimi and drives users to sign up or log in.

**Sections (top to bottom):**

1. **Hero Section**
   - Headline: Value proposition (e.g., "Private messaging, reimagined.")
   - Subheadline: Brief description of the platform
   - CTA buttons: "Get Started" (primary → `/register`), "Learn More" (secondary → `#features`)
   - Hero illustration or product screenshot mockup

2. **Features Overview Section**
   - 3–6 feature cards in a grid
   - Each card: icon, title, short description
   - Features: Real-time messaging, Privacy-first identity, Group chats, End-to-end moderation, Cross-platform (future)

3. **How It Works Section**
   - 3-step visual walkthrough:
     1. Sign up and get your anonimi
     2. Share your ID with friends
     3. Start messaging instantly
   - Each step: number, title, description, illustration

4. **Social Proof / Trust Section** (optional)
   - Testimonials, user count, or trust badges
   - Can be placeholder for launch

5. **CTA Section**
   - Final call to action before footer
   - "Ready to get started?" + Sign Up button

### 6.2 About Page (`/about`)

- Platform mission and vision
- What makes anonimi different (privacy, generated IDs, moderation)
- Team section (optional, can be placeholder)

### 6.3 Features Page (`/features`)

- Detailed feature breakdown with sections:
  - Private Messaging (real-time, read receipts, typing indicators)
  - anonimi Identity (privacy-first user discovery)
  - Group Chats (roles, settings, nicknames)
  - Media Sharing (images, files)
  - Block & Report System (user safety)
  - Admin & Moderation (platform integrity)
- Each feature: heading, description, optional illustration/icon

### 6.4 Contact Page (`/contact`)

- Contact form (name, email, subject, message)
- Note: The form can submit to a backend endpoint or simply display contact email
- Office / company info (placeholder)

### 6.5 FAQ Page (`/faq`)

- Accordion-style question/answer list
- Categories: General, Account, Messaging, Privacy, Groups
- Example questions:
  - "What is an anonimi?"
  - "Can I change my username?"
  - "How do I block a user?"
  - "Is my data private?"
  - "How do group chats work?"

### 6.6 Privacy Policy (`/privacy`)

- Standard privacy policy content
- Data collection, usage, storage, third parties
- User rights and data deletion

### 6.7 Terms of Service (`/terms`)

- Terms governing platform use
- Acceptable use policy
- Account termination conditions
- Liability limitations

---

## 7. Authentication Pages

All authentication pages use the **Auth Layout** (centered card).

### 7.1 Login Page (`/login`)

**Form fields:**
- Identifier (email or phone) — text input
- Password — password input with show/hide toggle
- "Forgot password?" link → `/forgot-password`

**Actions:**
- Submit → `POST /api/auth/login`
- On success → redirect to `/chat` (or `redirect` param if present)
- On error → show persistent inline error + toast feedback
- If response indicates pending verification → show "Continue verification" action to route users to `/verify?target=...&type=...`

**Footer:**
- "Don't have an account? Sign up" → `/register`

### 7.2 Register Page (`/register`)

**Form fields:**
- Email — email input
- Username — optional text input (3–30 chars, alphanumeric + `_.`)
   - Inline note: using your real name is not recommended for stronger anonymity
   - If left empty, system generates a crypto-random username
   - Manual username edit is allowed once
- Password — password input with strength indicator
- Confirm password — password input
- Accept terms checkbox → links to `/terms` and `/privacy`

**Actions:**
- Submit → `POST /api/auth/register`
- On success → redirect to `/verify` with email prefilled
- On error → display field-level validation errors
- On page load, if a valid pending verification state exists, auto-resume to `/verify` instead of rendering the register form

**Footer:**
- "Already have an account? Log in" → `/login`

### 7.3 Forgot Password Page (`/forgot-password`)

**Form fields:**
- Email — email input

**Actions:**
- Submit → `POST /api/auth/forgot-password`
- On success → show confirmation message ("Check your email")
- Always shows success (prevents email enumeration)

**Footer:**
- "Back to login" → `/login`

### 7.4 Reset Password Page (`/reset-password`)

Accessed via email link with `?token=xxx` query parameter.

**Form fields:**
- New password — password input with strength indicator
- Confirm new password — password input

**Actions:**
- Submit → `POST /api/auth/reset-password` with token
- On success → redirect to `/login` with success message
- On error → display error (invalid/expired token)

### 7.5 Email Verification Page (`/verify`)

**Display:**
- OTP code input (6 digits)
- Instruction text: "Enter the code sent to your email"
- Resend code button (with cooldown timer)

**Access control:**
- Page requires valid `target` and `type` query params
- Client validates verification context via `GET /api/auth/verification-status`
- Invalid, missing, already-verified, or non-pending contexts redirect to `/register`

**Actions:**
- Submit → `POST /api/auth/verify-email`
- On success → redirect to `/chat` (user is now logged in)
- On error → display error (invalid/expired code)
- Resend → `POST /api/auth/resend-verification` with 30-second cooldown

---

## 8. Authenticated Application

### 8.1 Chat — Primary Feature

#### Conversation List (`/chat`)

The default view when entering the application.

**Layout:**
- Left panel: Scrollable conversation list
- Right panel: Empty state or selected conversation

**Conversation list item shows:**
- Contact avatar + online status dot
- Contact name (or nickname)
- Last message preview (truncated)
- Timestamp of last activity
- Unread count badge

**Actions:**
- Click conversation → navigate to `/chat/[conversationId]`
- Search bar at top for filtering conversations
- New conversation button (opens user search dialog)

#### Active Chat View (`/chat/[conversationId]`)

**Layout:**
- Header: Contact name/avatar, online status, actions menu (profile, block, report)
- Message area: Scrollable message list (infinite scroll upward for history) using `ScrollArea`
- Non-contact notice banner (conditionally rendered — see below)
- Input area: Text input, attachment buttons (image, file), send button
- For disbanded groups: show a disband notice banner and disable message input/actions

**Message bubble features:**
- Sent vs. received styling (right-aligned vs. left-aligned)
- Timestamp display
- Private read receipt indicators are rendered **below** outgoing bubbles (outside the bubble).
- Private status shows at most two markers at once:
   - Latest outgoing message read by the other user → `Read at HH:MM`
   - Latest outgoing message not yet read → `Sent`
- Group status shows aggregated read state.
- Group read states:
   - "Read by everyone" appears at most once for the latest fully-read outgoing message.
   - "Read by some" can appear on multiple outgoing messages.
   - "Read by some" is clickable and opens a modal with member names and per-user read timestamps.
   - Reader names link to user profiles (`/user/:anonimiId`).
- Image/file preview inline
- Context menu on messages: Copy, Delete for me, Unsend (if own message within time limit)
- "This message was unsent" placeholder for unsent messages
- Inline edit for own text messages (24-hour window). "Edited" label appears above the bubble and opens edit history.

**Nickname actions in chat header menu (private):**
- `Set nickname` — sets how **you** see the other user.
- `Set my nickname` — sets how the **other user** sees you.
- Nickname changes generate personalized `system` messages in-thread for both sides.

**Real-time features:**
- Typing indicator ("User is typing...")
- New messages appear instantly at bottom
- Auto-scroll to newest message
- Optimistic message rendering (show immediately, confirm on ack)
- Read marking is focus-aware: messages are auto-marked read only when the conversation is open **and** the browser tab is visible/focused.
- If the conversation is open in a background tab, incoming messages stay unread until focus returns.
- Returning focus to an open conversation clears its local unread badge and emits read receipts.
- Read receipt modal is rendered via a portal to guarantee full-screen backdrop coverage.

### 8.2 Global Search (`/search`)

Global search aggregates results across contacts, people, conversations, and **message content**.

**Inputs:**
- Query comes from the main search entry point (sidebar search). The page reads `q` from the URL.

**Message results behavior:**
- Results match **message content** (not people).
- Each result shows the conversation name, whether it is Group or Private, sender label (`You` vs sender name), and a snippet with the query highlighted.
- Clicking a message result navigates to `/chat/[conversationId]?messageId=...`, auto-scrolls to the message, and briefly highlights the bubble.
- If the message is not loaded, the chat view auto-fetches older pages until the target appears.

#### Non-Contact Notice Banner

The banner is displayed in the chat view when `conversation.requestStatus` is `"pending"`. The content differs based on whether the current user is the **sender** (User A) or the **recipient** (User B).

**Sender view** (`requestStatus === "pending"` and `currentUser === sender`):

```
┌─────────────────────────────────────────────────────────────────┐
│  ℹ  Your message is a request — [Username] hasn't accepted yet. │
│     You can keep sending messages while you wait.               │
│                                                         [Send Contact Request]  │
└─────────────────────────────────────────────────────────────────┘
```

- MessageInput is **enabled** — sender can keep sending freely.
- "Send Contact Request" button is shown if no contact request is pending or accepted.
- If the other user already has a pending contact request pointing to the current user, show "Accept Contact Request" instead.

**Recipient view** (`requestStatus === "pending"` and `currentUser === recipient`):

```
┌─────────────────────────────────────────────────────────────────┐
│  📩  Message request from [Username]                            │
│      [Username] is not in your contacts.                        │
│                                    [Accept]  [Ignore]           │
└─────────────────────────────────────────────────────────────────┘
```

- MessageInput is **disabled** — recipient cannot reply until they accept.
- **Accept** → `PATCH /api/message-requests/:id/accept { addToContacts: false }` — moves conversation to main inbox, re-enables input.
- **Ignore** → `PATCH /api/message-requests/:id/ignore` — hides conversation, navigates user away.
- Optionally, an "Accept & Add to Contacts" secondary action can also be offered.

**Contact request controls** (shown within the banner for both sides when applicable):

| Condition | Button shown |
|-----------|-------------|
| No contact relationship, no pending request | "Send Contact Request" |
| Current user already sent a pending request | "Contact Request Pending" (disabled) |
| Other user sent a pending request to current user | "Accept Contact Request" |
| Both are already contacts (requestStatus → null) | Banner not shown |

Accepting a contact request within the chat immediately upgrades `requestStatus` to `null` and re-enables the MessageInput for both parties.

### 8.3 Groups (`/groups`)

**Groups list page:**
- Grid or list of groups the user belongs to
- Each group: name, image, member count, last activity
- "Create Group" button

**Group chat view** (`/groups/[groupId]`):
- Same chat interface as private chat
- Group header: name, image, member count, settings gear icon
- Multiple typing indicators ("Alice, Bob are typing...")
- System messages for joins, leaves, role changes, nickname changes
- If disbanded: show persistent disband notice, disable message input, and show disabled `Archive (soon)` / `Delete Chat (soon)` placeholders

**Group settings** (`/groups/[groupId]/settings`):
- Group name and image editing (admin/owner)
- Member list with roles (owner, admin, member)
- Promote/demote members (owner/admin)
- Remove members (owner/admin)
- Toggle join requests (admin/owner)
- Leave group button
- Transfer ownership (owner only)
- Disband group (owner only) with strict typed confirmation (`DISBAND`)
- After successful disband, owner is redirected to the same conversation route to see the locked state

**Create group** (`/groups/create`):
- Group name input
- Group image upload
- Member search and selection (contacts prioritized)
- Create button

### 8.4 Contacts (`/contacts`)

**Contacts list:**
- Alphabetically sorted contact list
- Each contact: avatar, name (with nickname in parentheses if set), online status
- Search/filter input
- Click contact → open chat or view profile

**Contact requests** (`/contacts/requests`):
- Incoming request cards
- Each card: avatar, username, anonimi, timestamp
- Actions: Accept, Decline
- Sent requests tab (pending outgoing)

### 8.5 Message Requests (`/message-requests`)

**List view:**
- Shows all conversations with `requestStatus: "pending"` (not yet accepted or ignored).
- Each list item: sender avatar, username, anonimi, message preview, timestamp.
- Empty state: "No pending message requests."

**Per-item actions:**
- **Accept** → `PATCH /api/message-requests/:id/accept { addToContacts: false }` — moves conversation to main chat inbox.
- **Accept & Add to Contacts** → same but with `{ addToContacts: true }` — also creates the contact relationship and sets `requestStatus` to `null`.
- **Ignore** → `PATCH /api/message-requests/:id/ignore` — hides conversation from both inbox and requests list.

**Click to preview:**
- Clicking a request item navigates to `/chat/[conversationId]`, showing the conversation with the recipient-side non-contact banner.
- Accepting or ignoring from within the chat view works the same as from the list.

**Sidebar badge:**
- The "Message Requests" nav item displays an unread count badge showing the number of `pending` requests.
- Badge updates in real-time via `message-request:new` socket events.

### 8.6 Profile (`/profile`)

**View mode:**
- Avatar (large), username, anonimi (with copy button)
- Account creation date
- Edit button

**Edit mode:**
- Avatar upload
- Username field (with availability check; manual change allowed once ever)
- Phone number field (optional; recommended for account recovery)
- Password change section (current password + new password)

### 8.7 User Profile (`/user/[anonimiId]`)

Public profile view for another user:
- Avatar, username, anonimi
- Online status / last seen
- Contact status (is contact, pending, none)
- Actions: Send message, Add to contacts, Block, Report

**"Send Message" action:**
- Calls `POST /api/conversations { participantAnonimiId: "..." }`.
- If a conversation already exists, returns the existing `conversationId`.
- If no conversation exists, creates one (with `requestStatus: "pending"` if not contacts, or `null` if already contacts).
- Navigates to `/chat/[conversationId]` after the call resolves.

### 8.8 Settings (`/settings`)

Settings organized in tabs or sections:

- **Account:** Email, optional recovery phone, password change
- **Notifications:** Notification preferences (sound, desktop notifications)
- **Privacy:** Online status visibility, read receipts toggle
- **Appearance:** Theme (light/dark/system), chat bubble style
- **Blocked Users:** Link to `/blocked`
- **Danger Zone:** Delete account (future)

### 8.9 Blocked Users (`/blocked`)

- List of blocked users
- Each entry: avatar, username, block date
- Unblock action

### 8.10 Support (`/support`)

**Ticket list** (`/support`):
- User's support tickets
- Each ticket: subject, status badge, last update time
- "Create Ticket" button

**Create ticket** (`/support/create`):
- Subject input
- Reason select (account recovery, login issues, bug report, feature request, other)
- Message textarea
- Submit button

**Ticket detail** (`/support/[ticketId]`):
- Ticket info header: subject, reason, status, created date
- Threaded message view (user messages vs. staff messages, visually distinct)
- Reply input (if ticket is not closed)

---

## 9. Admin Panel

See [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md) for full admin panel specifications.

**Summary of admin pages:**

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Overview metrics, quick actions |
| Users | `/admin/users` | User search + management |
| User Detail | `/admin/users/[userId]` | Full user profile (admin view) |
| Reports | `/admin/reports` | Report queue + resolution |
| Report Detail | `/admin/reports/[reportId]` | Report investigation view |
| Support | `/admin/support` | Admin ticket queue |
| Ticket Detail | `/admin/support/[ticketId]` | Admin ticket management |
| Groups | `/admin/groups` | Group browser |
| Group Detail | `/admin/groups/[groupId]` | Admin group detail |
| Messages | `/admin/messages/[conversationId]` | Read-only conversation viewer |
| Bans | `/admin/bans` | Ban management |
| Analytics | `/admin/analytics` | Charts, metrics, trends |
| Logs | `/admin/logs` | Admin activity audit trail |

---

## 10. Component Architecture

### Component Categories

```
src/components/
├── ui/                  → shadcn/ui primitives (button, input, dialog, etc.)
├── marketing/           → Marketing site components (hero, feature cards, etc.)
├── auth/                → Auth form components
├── chat/                → Chat-specific components (bubbles, input, typing)
├── conversations/       → Conversation list components
├── contacts/            → Contact-related components
├── groups/              → Group-related components
├── user/                → User profile components
├── admin/               → Admin dashboard components
└── shared/              → Reusable app-wide components (guards, loading, errors)
```

### Profile Popup Shortcut

The **Profile Popup Shortcut** is the avatar-click menu used throughout chat surfaces.

**Trigger:**
- Clicking a user's avatar in chat bubbles or participant lists.

**Actions shown:**
- `View Profile` (always).
- `Send Message` (only in group chats or contexts where the user is not already in a private conversation with the target).

**Rules:**
- Private conversation: show `View Profile` only.
- Group conversation: show both `View Profile` and `Send Message`.
- The same menu behavior should be reused across all chat surfaces (message bubble avatars, member lists, etc.).

### Marketing Components (`components/marketing/`)

| Component | Purpose |
|-----------|---------|
| `MarketingNavbar` | Top navigation bar for public site |
| `MarketingFooter` | Site footer with links and legal |
| `HeroSection` | Landing page hero with CTA |
| `FeatureCard` | Individual feature display card |
| `FeatureGrid` | Grid layout for feature cards |
| `HowItWorksStep` | Step in the "How it works" section |
| `CTASection` | Call-to-action banner section |
| `FAQAccordion` | Expandable FAQ item |
| `ContactForm` | Contact page form |

### Auth Components (`components/auth/`)

| Component | Purpose |
|-----------|---------|
| `LoginForm` | Email/password login form |
| `RegisterForm` | Registration form with validation |
| `ForgotPasswordForm` | Password reset request form |
| `ResetPasswordForm` | New password form |
| `VerifyCodeInput` | OTP code input for verification |
| `PasswordStrength` | Password strength indicator |
| `AuthCard` | Wrapper card for auth forms |

### Chat Components (`components/chat/`)

| Component | Purpose |
|-----------|---------|
| `ChatView` | Main chat container (header + messages + input) |
| `MessageList` | Scrollable message list with infinite scroll |
| `MessageBubble` | Individual message display |
| `MessageInput` | Message composition area with attachments |
| `TypingIndicator` | "User is typing..." display |
| `MediaPreview` | Image/file preview in chat |
| `MessageActions` | Delete, unsend context menu |
| `ReadReceipt` | Read status indicators (sent/delivered/read) |

### Conversation Components (`components/conversations/`)

| Component | Purpose |
|-----------|---------|
| `ConversationList` | Sidebar conversation list |
| `ConversationItem` | Single conversation preview row |
| `ConversationSearch` | Search/filter conversations |

### Contact Components (`components/contacts/`)

| Component | Purpose |
|-----------|---------|
| `ContactList` | Contacts display |
| `ContactItem` | Single contact row |
| `ContactRequestCard` | Incoming request card |
| `NicknameEditor` | Nickname edit dialog |

### Group Components (`components/groups/`)

| Component | Purpose |
|-----------|---------|
| `GroupHeader` | Group name, image, member count |
| `GroupMemberList` | Member list with roles |
| `GroupMemberItem` | Single member row |
| `GroupSettings` | Settings editor |
| `CreateGroupDialog` | Group creation modal |
| `JoinRequestCard` | Join request approval card |
| `RoleSelector` | Role change dropdown |

### User Components (`components/user/`)

| Component | Purpose |
|-----------|---------|
| `UserProfile` | Profile display |
| `UserProfileEditor` | Profile edit form |
| `UserSearchResults` | Search result list with "Add Contact" and "Send Message" actions per result |
| `UserCard` | Compact user card |
| `AvatarUpload` | Profile image upload |
| `OnlineIndicator` | Online/offline dot |

### Admin Components (`components/admin/`)

| Component | Purpose |
|-----------|---------|
| `AdminSidebar` | Admin navigation sidebar |
| `MetricCard` | Single metric display card |
| `ReportCard` | Report list item |
| `ReportDetail` | Full report investigation view |
| `TicketCard` | Ticket list item |
| `BanDialog` | Ban user dialog |
| `WarnDialog` | Warn user dialog |
| `AnalyticsChart` | Chart wrapper component |
| `AdminLogEntry` | Log entry display |
| `ConversationViewer` | Read-only conversation browser |

### Shared Components (`components/shared/`)

| Component | Purpose |
|-----------|---------|
| `ProtectedRoute` | Auth guard wrapper |
| `AdminRoute` | Admin role guard wrapper |
| `LoadingSkeleton` | Loading placeholder |
| `EmptyState` | Empty data display with illustration |
| `ErrorBoundary` | React error boundary |
| `InfiniteScroll` | Cursor-based infinite scroll |
| `FileUpload` | Generic file upload component |
| `ConfirmDialog` | Confirmation modal |
| `SearchInput` | Debounced search input |
| `DateDisplay` | Relative/absolute date formatter |
| `ConnectionStatus` | WebSocket connection indicator |

---

## 11. State Management

### Strategy: Zustand + TanStack Query Split

| Data Type | Tool | Example |
|-----------|------|---------|
| **Server state** (remote data) | TanStack Query | Messages, conversations, contacts, user profiles |
| **Client state** (UI/local) | Zustand | Active conversation, sidebar state, theme, socket connection |

### Zustand Stores

```
src/stores/
├── authStore.ts           → Auth state (user object, isAuthenticated, role)
├── chatStore.ts           → Active conversation ID, draft messages
├── socketStore.ts         → Socket connection state, reconnect status
├── presenceStore.ts       → Online users map (userId → online/offline)
├── typingStore.ts         → Currently typing users per conversation
└── uiStore.ts             → UI state (sidebar collapsed, active panel, modals)
```

### TanStack Query Key Convention

```
["conversations"]                      → conversation list
["conversations", conversationId]      → single conversation
["messages", conversationId]           → messages for a conversation (infinite)
["contacts"]                           → contacts list
["contacts", "requests"]               → incoming contact requests
["groups"]                             → groups list
["groups", groupId]                    → single group details
["groups", groupId, "members"]         → group members
["user", anonimiId]                       → public user profile
["user", "me"]                         → own profile
["message-requests"]                   → pending message requests
["admin", "users"]                     → admin user search
["admin", "reports"]                   → admin report queue
["admin", "analytics"]                 → admin analytics
```

---

## 12. Data Fetching Strategy

### API Client

The API client (`src/lib/api.ts`) is an Axios instance configured with:

- Base URL from environment variable
- `withCredentials: true` (send cookies)
- Request interceptor: attach access token from localStorage as `Authorization` bearer token
- Response interceptor: on 401, attempt token refresh via `/api/auth/refresh-token`, then retry the original request
- Refresh is intentionally skipped for auth flow endpoints (login/register/verify/forgot/reset/verification-status/resend-verification) to avoid false redirects and UI flicker on expected auth errors
- Error transformation: map API errors to consistent format

### Fetching Patterns

| Pattern | When to Use | Implementation |
|---------|-------------|----------------|
| **Query** | Read data (lists, details) | `useQuery` |
| **Infinite Query** | Paginated lists (messages, conversations) | `useInfiniteQuery` with cursor |
| **Mutation** | Create/update/delete | `useMutation` with optimistic updates |
| **Prefetch** | Anticipate navigation | `queryClient.prefetchQuery` |

### Caching Strategy

| Query | Stale Time | Cache Time | Refetch |
|-------|------------|------------|---------|
| Conversations | 30 seconds | 5 minutes | On window focus |
| Messages | 1 minute | 10 minutes | Socket events update cache |
| Contacts | 2 minutes | 10 minutes | On window focus |
| User profiles | 5 minutes | 30 minutes | On demand |
| Admin analytics | 5 minutes | 15 minutes | Manual refresh |

### Real-Time Cache Updates

When a Socket.IO event is received (e.g., `message:receive`), the event handler directly updates the TanStack Query cache:

```
Socket event: message:receive
  → queryClient.setQueryData(["messages", conversationId], ...)
  → queryClient.setQueryData(["conversations"], ...) // update lastMessage
```

This avoids unnecessary refetches for real-time data.

---

## 13. Real-Time System

### Socket.IO Provider

The `SocketProvider` wraps only the authenticated application layout. It:

1. Connects to the `/chat` namespace on mount (using JWT from auth store)
2. Joins user rooms and conversation rooms
3. Handles reconnection with exponential backoff
4. Exposes socket instance via context or Zustand store
5. Updates browser tab title for unread chat messages (e.g., `(3) New message - anonimi - Real-time Chat`) and resets when unread returns to zero.

### Hooks

| Hook | Purpose |
|------|---------|
| `useSocket` | Access socket instance, connection state |
| `useMessages` | Message fetching + real-time updates (cache sync) |
| `useConversations` | Conversation list + live updates |
| `useContacts` | Contact operations and updates |
| `useGroups` | Group operations and updates |
| `usePresence` | Online status tracking via Zustand store |
| `useTyping` | Typing indicator emit + receive logic |
| `useInfiniteScroll` | Cursor pagination with TanStack Query |
| `useMediaUpload` | File upload with progress tracking |
| `useDebounce` | Generic debounce utility hook |

---

## 14. Theming and Styling

### Design System

- **Primary color:** Brand color (configurable via CSS variables)
- **Dark/light mode:** System preference detection with manual toggle
- **Typography:** Outfit (headings), Plus Jakarta Sans (body)
- **Spacing:** Tailwind default scale
- **Border radius:** Consistent rounded corners via shadcn/ui theme tokens
- **Shadows:** Subtle shadows for cards and elevated elements

### CSS Variables (shadcn/ui pattern)

All colors are defined as CSS variables in `globals.css` and toggled between light and dark mode:

```css
:root {
  --background: ...;
  --foreground: ...;
  --primary: ...;
  --secondary: ...;
  --muted: ...;
  --accent: ...;
  --destructive: ...;
  --border: ...;
  --ring: ...;
}
```

### Marketing Site Styling

The marketing site uses a **distinct visual style** from the application:
- Larger typography, more whitespace
- Full-width sections with backgrounds
- Animated elements (subtle entrance animations)
- Gradient accents

The application uses a **denser, utility-focused** design:
- Compact spacing
- Sidebar navigation
- Card-based layouts
- Focus on data density and usability

---

## 15. SEO and Metadata

### Public Pages

Marketing pages must include proper SEO metadata:

| Page | Title | Description |
|------|-------|-------------|
| Landing | "anonimi — Private Messaging, Reimagined" | "Secure, real-time messaging with privacy-first identity. Sign up free." |
| About | "About anonimi" | "Learn about the anonimi platform and our mission." |
| Features | "anonimi Features" | "Explore anonimi's messaging, groups, privacy, and moderation features." |
| Contact | "Contact anonimi" | "Get in touch with the anonimi team." |
| FAQ | "FAQ — anonimi" | "Frequently asked questions about anonimi." |
| Privacy | "Privacy Policy — anonimi" | "How anonimi handles your data." |
| Terms | "Terms of Service — anonimi" | "Terms governing use of the anonimi platform." |

### Application Pages

Application pages use `noindex` meta tag (private content, no SEO needed):

```
<meta name="robots" content="noindex, nofollow" />
```

### Open Graph / Social

Marketing pages include Open Graph tags for social media sharing:
- `og:title`, `og:description`, `og:image`, `og:url`
- Twitter Card tags

---

## 16. Responsive Design

### Breakpoint Strategy

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Single-column, bottom nav, full-screen chat |
| Tablet | 768px–1024px | Collapsible sidebar, responsive grid |
| Desktop | > 1024px | Full sidebar + content + optional info panel |

### Marketing Site

- Mobile: Stacked sections, hamburger menu
- Desktop: Full-width sections, horizontal navigation

### Application

- Mobile: Bottom tab navigation, full-screen conversation view
- Tablet: Collapsible sidebar
- Desktop: Sidebar + conversation list + active chat (three-panel layout)

### Admin Panel

- Mobile: Drawer-based navigation, stacked cards
- Desktop: Fixed sidebar + scrollable content area
