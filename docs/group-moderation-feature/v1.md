# Group Moderation Feature – Mute System Enhancements

## Overview

Enhance the group moderation system by improving the **mute functionality**, user feedback, and admin controls.

---

## Features to Implement

### 1. Mute with Reason

#### Requirement

* When an admin/owner mutes a member:

  * A **textbox input** must appear
  * Admin must provide a **reason for muting**

#### Behavior

* The reason should be:

  * Stored with the mute data
  * Visible to the muted user

---

### 2. Mute Duration (shadcn Dropdown)

#### Requirement

* Replace existing duration selector with:

  * **shadcn UI Select / Dropdown component**

#### Options Example

* 5 minutes
* 30 minutes
* 1 hour
* 1 day
* Custom (optional)

---

### 3. Toggle Mute / Unmute Button

#### Requirement

* If the user is **not muted**:

  * Show: `Mute`

* If the user is **already muted**:

  * Replace button with: `Unmute`

---

## Muted User Experience

### 4. Disable Message Input

#### Requirement

* If a user is muted in a group:

  * Hide or disable message input field
  * Prevent sending messages

---

### 5. Show Mute Banner

#### UI Behavior

Replace input area with a banner:

**Content:**

* “You are muted in this group”
* Show:

  * Duration / remaining time
  * Reason for mute

---

## Real-Time Sync

### 6. Socket Integration

#### Requirement

* When a user gets muted/unmuted:

  * Update should be **real-time via socket**

#### Effects

* Muted user:

  * Instantly sees banner
* Admin/others:

  * UI updates immediately

---

## Member Profile Actions (Group)

### 7. Add Moderation Options

#### When admin/owner opens a member profile:

Add the following options:

* View Profile
* Send Message
* **Mute**
* **Remove from Group**

---

## UX Goals

* Clear communication of moderation actions
* Immediate feedback (real-time updates)
* Clean and consistent UI (using shadcn components)
* Prevent confusion for muted users

---

## Final Note

This feature enhances:

* Group moderation control
* Transparency (reason + duration)
* Overall user experience in group chats
