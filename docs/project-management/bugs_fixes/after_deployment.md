# Anonimi bugs and fixes after deployment. 

---

## Task 1: Fix Reply Message Preview
**Issues:**
- Reply preview only shows "Message" instead of actual content
- System doesn't identify which message is being replied to

**Goals:**
- Correctly link replied message using message ID
- Display preview of original message (text/image indicator)
- Handle deleted messages gracefully (e.g., "Message unavailable")

---

## Task 2: Fix Message Search
**Issues:**
- Searching messages returns no results
- Previously working feature is now broken

**Goals:**
- Restore full-text search across conversations
- Ensure search works for keywords (e.g., "location")
- Optimize query performance if needed
- Verify indexing (MongoDB text index or alternative)

---

## Task 3: Fix Message Editing + Encryption
**Issues:**
- Editing message throws error toast
- Edited messages are not encrypted before storing

**Goals:**
- Fix backend error during edit request
- Ensure edited messages go through encryption pipeline
- Maintain consistency with initial message encryption logic
- Update frontend to reflect edited state properly

---

## Task 4: Fix Phone Number Validation
**Issues:**
- Accepts invalid input (any characters)

**Goals:**
- Restrict input to valid phone number formats
- Add validation (frontend + backend)
- Prepare for international format support

---

## Task 5: Fix Connection Status Bugs
**Issues:**
- Status stuck on "reconnecting" or "disconnected"
- User can still send messages despite incorrect status
- And sometimes it's just reconnecting or disconnected, and user is not sync on the socket.

**Goals:**
- Fix WebSocket/Socket.io state sync
- Ensure UI reflects actual connection state
- Add fallback or retry logic if needed
- Make sure that it actually tries to reconnect and not get stucked.

---

## Task 6: Fix Online Status After Registration
**Issues:**
- User appears offline after account creation
- UI shows online but backend status is offline

**Goals:**
- Sync user presence immediately after signup/login
- Ensure socket connection initializes correctly
- Update presence state in database

---

## Task 7: Fix Role Permission System (Admin Panel)
**Issues:**
- Super Admin can ban or warn themselves
- Moderators can act on higher roles (super admins / other moderators)
- Actions fail but should not be visible at all

**Goals:**
- Restrict actions based on role hierarchy:
  - Super Admin > Moderator > Support Staff > User
- Hide invalid actions from UI
- Enforce permission checks on backend

---

## Task 8: Fix Landing Page CTA Mobile Layout
**Issues:**
- "Get your aid" and "Learn more" buttons have inconsistent width on mobile

**Goals:**
- Make both buttons equal width
- Ensure responsiveness across screen sizes
- Use consistent styling (Tailwind utilities)

---

# NOTES
- DO one task at a time.
- After the first task was done, stop first so I can test and review.
- I will tell if you can proceed to the next task.