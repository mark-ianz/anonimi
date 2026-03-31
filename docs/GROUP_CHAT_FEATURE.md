# Group Chat Feature Specification

This document specifies the complete implementation plan for the group chat feature in EchoID, including creation flows, member management, roles, permissions, invite links, and frontend UI requirements.

---

## 1. Overview

The group chat feature allows users to create group conversations with:
- Custom name and optional group image
- Multiple members with role-based permissions
- Manual member addition or invite links
- Join request approval workflow
- Real-time updates via Socket.IO

---

## 2. User Stories

| # | Story |
|---|-------|
| US-1 | As a user, I want to create a group chat with selected contacts. |
| US-2 | As a group owner, I want to set a custom name and image for my group. |
| US-3 | As a group owner, I want to assign admins who can help manage members. |
| US-4 | As an owner/admin, I want to generate time-limited invite links. |
| US-5 | As a user, I want to join a group via an invite link. |
| US-6 | As an owner/admin, I want to approve or reject join requests. |
| US-7 | As a user, I want to leave a group chat. |
| US-8 | As an owner, I want to transfer ownership to another member. |
| US-9 | As an owner/admin, I want to mute or remove disruptive members. |
| US-10 | As an owner, I want to disband my group. |

---

## 3. Database Schema

### 3.1 Groups Collection

```typescript
Collection: groups

{
  _id:              ObjectId,
  conversationId:   ObjectId,          // ref: conversations (type: "group")
  name:             String,            // Group name (required, 1-100 chars)
  description:      String | null,     // Optional description (max 500 chars)
  image:            String | null,     // Group avatar URL/path
  ownerId:          ObjectId,          // ref: users — current group owner
  settings: {
    joinRequestEnabled: Boolean        // Default: false
  },
  disbandedAt:       Date | null,       // Soft-delete timestamp
  createdAt:        Date,
  updatedAt:        Date
}
```

### 3.2 Group Members Collection

```typescript
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

### 3.3 Group Invite Links Collection

```typescript
Collection: groupInviteLinks

{
  _id:              ObjectId,
  groupId:          ObjectId,          // ref: groups
  createdBy:        ObjectId,          // ref: users
  token:            String,            // Unique invite token
  description:      String | null,     // Optional note (e.g., "Dev team invite")
  expiresAt:         Date,              // Expiration timestamp
  revokedAt:        Date | null,       // Revocation timestamp
  revokedBy:        ObjectId | null,   // ref: users
  maxUses:          Number | null,     // Usage limit
  usedCount:        Number,             // Current usage count
  lastUsedAt:       Date | null,        // Last used timestamp
  createdAt:        Date,
  updatedAt:        Date
}
```

### 3.4 Group Join Requests Collection

```typescript
Collection: groupJoinRequests

{
  _id:              ObjectId,
  groupId:          ObjectId,          // ref: groups
  userId:           ObjectId,          // ref: users — the requester
  inviterUserId:    ObjectId | null,   // ref: users — who added them (for manual_add)
  source:           String,            // "manual_add" | "invite_link" | "direct"
  status:           String,            // "pending" | "approved" | "rejected" | "cancelled"
  inviteLinkId:     ObjectId | null,   // ref: groupInviteLinks (if source is invite_link)
  decisionBy:       ObjectId | null,   // ref: users — who approved/rejected
  decisionAt:       Date | null,
  createdAt:        Date,
  updatedAt:        Date
}
```

---

## 4. Roles & Permissions

### 4.1 Role Hierarchy

```
Owner (1 per group)
  └── Admin (N per group)
        └── Member (N per group)
```

### 4.2 Permission Matrix

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| Change group name/image | ✅ | ✅ | ❌ |
| Toggle join requests | ✅ | ✅ | ❌ |
| Add members (contacts) | ✅ | ✅ | ❌ |
| Add members (non-contacts) | ✅ | ✅* | ❌ |
| Remove members | ✅ | ✅** | ❌ |
| Promote to admin | ✅ | ❌ | ❌ |
| Demote admin | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |
| Mute members | ✅ | ✅ | ❌ |
| Approve join requests | ✅ | ✅ | ❌ |
| Leave group | ✅ | ✅ | ✅ |
| Disband group | ✅ | ❌ | ❌ |

*Admin can add non-contacts without approval  
**Admin cannot remove other admins or owner

### 4.3 Approval Bypass Rules

When adding members:
- **If inviter is owner/admin**: Always bypass join request
- **If inviter is member**: Bypass only if `joinRequestEnabled: false`
- **If joining via link**: Bypass only if inviter (link creator) was owner/admin

---

## 5. API Endpoints

### 5.1 Existing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create new group |
| GET | `/api/groups/:groupId` | Get group details |
| PATCH | `/api/groups/:groupId` | Update group (name, image, settings) |
| GET | `/api/groups/:groupId/members` | List members |
| POST | `/api/groups/:groupId/members` | Add members |
| DELETE | `/api/groups/:groupId/members/:userId` | Remove member |
| PATCH | `/api/groups/:groupId/members/:userId/role` | Change role |
| POST | `/api/groups/:groupId/leave` | Leave group |
| POST | `/api/groups/:groupId/join-request` | Request to join |
| GET | `/api/groups/:groupId/join-requests` | List pending requests |
| PATCH | `/api/groups/:groupId/join-requests/:requestId` | Approve/reject |
| POST | `/api/groups/:groupId/invite-links` | Create invite link |
| GET | `/api/groups/:groupId/invite-links` | List invite links |
| DELETE | `/api/groups/:groupId/invite-links/:inviteLinkId` | Revoke link |

### 5.2 New Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PATCH | `/api/groups/:groupId/transfer-owner` | Transfer ownership | Owner |
| DELETE | `/api/groups/:groupId` | Disband group | Owner |
| POST | `/api/groups/:groupId/members/:userId/mute` | Mute member | Owner/Admin |
| DELETE | `/api/groups/:groupId/members/:userId/mute` | Unmute member | Owner/Admin |
| GET | `/api/groups/join/:token` | Get group info via invite link | Public |
| POST | `/api/groups/join/:token` | Join via invite link | Auth |

### 5.3 Response Updates

#### GET /api/groups/:groupId

```json
{
  "id": "...",
  "conversationId": "...",
  "name": "Project Team",
  "description": "Team collaboration group",
  "image": "/uploads/groups/uuid.jpg",
  "ownerId": "...",
  "settings": {
    "joinRequestEnabled": false
  },
  "memberCount": 8,
  "photoFallbackUserIds": ["...", "...", "..."],
  "myRole": "owner",
  "createdAt": "2026-03-01T10:00:00Z"
}
```

#### POST /api/groups/:groupId/invite-links

```json
{
  "inviteLinkId": "...",
  "token": "abc123...",
  "joinUrl": "/groups/join/abc123...",
  "expiresAt": "2026-03-31T10:30:00Z",
  "maxUses": null,
  "usedCount": 0,
  "description": null,
  "qrCode": "data:image/png;base64,...",
  "createdAt": "2026-03-31T10:00:00Z"
}
```

---

## 6. Invite Link System

### 6.1 Expiry Presets

| Value | Display | Duration |
|-------|---------|-----------|
| 30 | 30 minutes | 30 min |
| 60 | 1 hour | 1 hour |
| 360 | 6 hours | 6 hours |
| 1440 | 24 hours | 24 hours |
| 10080 | 7 days | 7 days |

### 6.2 Join Flow

```
1. User clicks invite link → /groups/join/:token
2. Server validates:
   - Token exists and not revoked
   - Not expired
   - Max uses not reached
3. Check if user is already member → redirect to group
4. Check if user is blocked → show error
5. Check joinRequestEnabled + inviter role:
   - Bypass: Add to group directly
   - Require: Create join request, show "pending approval"
6. On success: Redirect to group chat
```

### 6.3 QR Code

- Generate QR code on-demand using `qrcode` library
- Encode the full join URL
- Return as base64 PNG data URL
- Display in invite link card

---

## 7. Frontend Architecture

### 7.1 Route Structure

```
/app/groups                 → Groups list
/app/groups/create          → Create new group
/app/groups/[groupId]      → Group chat view
/app/groups/[groupId]/settings → Group settings
/groups/join/:token         → Public join page (no auth required if link valid)
```

### 7.2 Components

```
src/components/groups/
├── GroupCard.tsx           → Group list item
├── GroupHeader.tsx         → Group chat header (name, image, actions)
├── CreateGroupDialog.tsx   → Create group modal
├── GroupSettingsPanel.tsx → Settings container
├── MemberList.tsx          → Members list
├── MemberListItem.tsx      → Single member row
├── RoleBadge.tsx            → Role indicator
├── InviteLinkManager.tsx   → Invite link management
├── InviteLinkCard.tsx      → Single invite link
├── JoinRequestList.tsx     → Pending requests
├── JoinRequestCard.tsx     → Single request
├── QRCodeModal.tsx          → QR code display
├── MuteToggle.tsx          → Mute group
├── LeaveGroupButton.tsx    → Leave/disband
└── UserSelector.tsx         → Member search/select
```

### 7.3 Types

```typescript
// src/types/group.ts (existing + updates)

export interface Group {
  id: string;
  conversationId: string;
  name: string;
  description?: string;
  image: string | null;
  ownerId: string;
  settings: {
    joinRequestEnabled: boolean;
  };
  memberCount: number;
  myRole: GroupRole;
  photoFallbackUserIds?: string[];
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  echoId: string;
  username: string;
  profileImage: string | null;
  role: GroupRole;
  nickname: string | null;
  joinedAt: string;
  mutedUntil?: string;
}

export interface GroupInviteLink {
  inviteLinkId: string;
  token: string;
  joinUrl: string;
  description?: string;
  expiresAt: string;
  revokedAt: string | null;
  maxUses: number | null;
  usedCount: number;
  qrCode?: string;
  createdAt: string;
}
```

### 7.4 TanStack Query Keys

```typescript
["groups"]                           // groups list
["groups", groupId]                 // group details
["groups", groupId, "members"]      // group members
["groups", groupId, "join-requests"] // pending requests
["groups", groupId, "invite-links"] // invite links
["groups", "join", token]          // public join info
```

---

## 8. Socket.IO Events

### 8.1 Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `group:typing` | `{ groupId, isTyping }` | Typing indicator |

### 8.2 Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `group:member-joined` | `{ groupId, member, addedBy }` | New member joined |
| `group:member-left` | `{ groupId, userId, reason, removedBy }` | Member left/removed |
| `group:updated` | `{ groupId, changes, updatedBy }` | Group settings changed |
| `group:role-changed` | `{ groupId, userId, oldRole, newRole, changedBy }` | Role changed |
| `group:join-request` | `{ groupId, requestId, user }` | New join request |
| `group:mute-updated` | `{ groupId, userId, mutedUntil }` | Member muted/unmuted |

---

## 9. UI/UX Specifications

### 9.1 Create Group Flow

1. User clicks "Create Group" button
2. Dialog opens with:
   - Name input (optional - shows hint "Leave empty for auto-generated name")
   - Image upload button (optional)
   - Member search with contact filter
   - Selected members list with remove option
   - Toggle: "Require approval for new members" (default off)
3. Submit → Create group, redirect to group chat

### 9.2 Auto-Generated Name

When name is empty:
- Format: `"New Group Month DD, YYYY"` (e.g., "New Group Mar 31, 2026")
- Localized to user's locale

### 9.3 Photo Fallback Logic

```typescript
const getGroupPhoto = (group: Group, members: GroupMember[]): string => {
  if (group.image) return group.image;
  
  const fallbackUsers = members
    .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
    .slice(0, 3);
  
  // Return composite or first 3 avatars
  return generateCompositeAvatar(fallbackUsers.map(m => m.profileImage));
};
```

### 9.4 Invite Link Card

- Shows: Link (truncated), expires in X, uses X/Y
- Actions: Copy link, Copy QR, Revoke
- QR modal: Full QR code with share options

### 9.5 Member List Item

```
┌─────────────────────────────────────────────────┐
│ [Avatar]  Username                    [Menu]  │
│           echoId                             │
│           [Owner] [Admin] [Muted]            │
└─────────────────────────────────────────────────┘
```

Menu options (by role):
- **Member**: View profile, Message
- **Admin**: + All above, Remove, Mute
- **Owner**: + All above, Promote to Admin, Transfer Ownership

---

## 10. Error Handling

### 10.1 Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| GROUP_NOT_FOUND | 404 | Group doesn't exist |
| GROUP_DISBANDED | 410 | Group was disbanded |
| MEMBER_NOT_FOUND | 404 | User not in group |
| ALREADY_MEMBER | 409 | User already in group |
| NOT_AUTHORIZED | 403 | Insufficient permissions |
| INVITE_EXPIRED | 410 | Invite link expired |
| INVITE_REVOKED | 410 | Invite link revoked |
| INVITE_MAX_USES | 410 | Usage limit reached |
| JOIN_REQUEST_PENDING | 409 | Already has pending request |

### 10.2 User Feedback

- Toast notifications for all actions
- Inline errors for forms
- Empty states for lists

---

## 11. Implementation Phases

### Phase 1: Backend Core
- [ ] Add `description` field to Group model
- [ ] Add `transferOwnership` service function
- [ ] Add `disbandGroup` service function
- [ ] Add mute/unmute endpoints
- [ ] Fix approval bypass logic
- [ ] Add QR code generation to invite link response

### Phase 2: Frontend Foundation
- [ ] Create group dialog
- [ ] Group list page
- [ ] Group chat view header
- [ ] Member list component

### Phase 3: Member Management
- [ ] Add/remove members
- [ ] Role management
- [ ] Join request handling

### Phase 4: Invite System
- [ ] Create invite link UI
- [ ] Invite link list/revoke
- [ ] QR code display
- [ ] Public join page (`/groups/join/:token`)

### Phase 5: Polish
- [ ] Mute functionality
- [ ] Disband group
- [ ] Transfer ownership
- [ ] Auto-generated names
- [ ] Photo fallback logic

---

## 12. Security Considerations

1. **Invite tokens**: Use cryptographically secure random tokens (24 bytes, base64url)
2. **Rate limiting**: Limit invite link creation (10/hour per group)
3. **Block check**: Check if user is blocked before adding to group
4. **Max members**: Consider adding group size limit (optional, document if set)
5. **Audit logging**: Log admin actions in group management

---

## 13. Migration Notes

For existing groups without description:
- `description` defaults to `null`

For existing groupInviteLinks without description:
- `description` defaults to `null`

For existing groupMembers without mutedUntil:
- `mutedUntil` defaults to `null` (not muted)
