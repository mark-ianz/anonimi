### Bugs & Improvements

Status: Resolved
Last updated: 2026-03-30

---

#### 1. Failed Login Experience

Reported:

* Toast disappeared too quickly
* UI looked like a refresh/flicker happened
* No persistent error message in the form

Resolution:

* Extended login error toast visibility so messages are readable
* Added persistent inline login error panel in the form
* Prevented auth interceptor from triggering refresh/redirect behavior on login/register/verify failures (stops false navigation/flicker)

Result: Users now see clear, stable feedback when credentials are wrong.

---

#### 2. Verification Flow Recovery

Reported:

* Closing the tab after registration could strand users
* Re-registering failed (email already used) and login could not progress
* Manual URL crafting was required to continue verification

Resolution:

* Added persisted pending-verification state in localStorage
* On register success, target and type are stored for recovery
* Returning users on register are auto-redirected to verify if still pending
* Added login fallback action to continue verification when account is pending

Result: The flow is recoverable after tab close and avoids dead ends.

---

#### 3. Verification Page Access Control

Reported:

* Verify page should not be accessible without valid context

Resolution:

* Added backend endpoint to validate verification context and status
* Verify page now checks: missing target/type, non-existent account, already-verified account, non-pending account
* Invalid contexts are redirected out of verify flow

Result: Verify page is now restricted to valid pending verification sessions.

---

#### 4. Persistent Verification State

Reported:

* Verification stage needed persistence across refresh/tab close

Resolution:

* Implemented localStorage-based pending verification key with expiry handling
* State is cleared on successful verification and invalid contexts

Result: Users can safely resume verification without losing progress context.

---

#### 5. Resend Verification Code

Requested later and implemented:

* Added backend endpoint to resend verification code for pending accounts
* Regenerates a fresh 6-digit code with expiration
* Added frontend resend button behavior with loading state and cooldown timer

Result: Users have a direct recovery path when they do not receive or lose an old code.

---

### General UX Principle

Implemented policy:

* The system should never trap the user
* Register -> Verify -> Login has explicit recovery paths
* Each blocking state has a clear next action

New:
I tried logging in this: {
  "_id": {
    "$oid": "69c9fb1401d0426ef441b956"
  },
  "echoId": "eid_6r1aunby",
  "username": "anon_t4k55y",
  "email": "awdawd@gmail.com",
  "passwordHash": "$2b$12$ZAyMVkhAeIZ9gvTQSPX/m.u3mPxJRrxvM0MjCih5srSjcNLDBEClK",
  "role": "user",
  "status": "pending",
  "appearanceStatus": "online",
  "onlineStatus": "offline",
  "emailVerified": false,
  "phoneVerified": false,
  "verificationCode": "993182",
  "verificationCodeExpiresAt": {
    "$date": "2026-03-30T04:39:52.105Z"
  },
  "createdAt": {
    "$date": "2026-03-30T04:24:52.335Z"
  },
  "updatedAt": {
    "$date": "2026-03-30T04:24:52.335Z"
  },
  "__v": 0
}

It was checked as pending and told shows the continue verification which is correct. But the problem when I clicked the "Continue Verification", it pops up an error toast with this message "This verification session is no longer valid. Please register or sign in again." and brings me back to register.

--- Done
Only one Read by everyone can exist in one chat duh.

Example:

x - whitespace

We have 4 members in this group chat. This message was read by everyone.
xxxxxxxxxxxxxxxxxxxxxxxxxxRead by everyone

/ I will message again but my next message will be seen by only 2 members.

This message was only seen by 2 members, meaning there's one more members who hasn't viewed it yet.
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxRead by some

The read by some is hoverable and underline tag will appear, if clicked a modal will show and display the members who read the message.

-- Done

When I request to Add Contact someone, the receiver have to manually refresh to get the notification.

--

On the tabs list on the left side:
- Chats (12)
- Contacts (3)
- Groups
- Profile
- Settings

On chats, there should be a notif on how many unread messages you have.
Or contacts if someone requested you
-- DONE
Disbanding a group doesn't work.

-- Done
If it's a group chat and someone messaged. On the Message List it should be like this:
Group Name
member/You (if it's me): most recent message.

-- Done
When creating a group chat and defining the members there, after creating, the group chat won't appear to the members added unless they refresh. The only thing that is working is if the group was created and add them after the group was created, this way they will immediately gonna have the group chat on their message list.

-- Done
On group chat, the read by some has no hover popover content. When hovered, it should only display un underline on text. If it was clicked, a modal will pop up that shows the list of members who seen the message.

There could be a multiple amount of Read by some since some members doesn't read the same amount of messages on the conversation but only one Read by everyone.

-- Done
When I message request someone, the request doesn't go to their request tab. tho the message appear and shows me an option to accept or accept and add.
- Pressing accept, allows me to and doesn't add him on my contact yet which is correct. But the prompt for Accept or Accept & Add is still there and I still can't reply yet. Meaning I have to manually refresh.
- When I only pressed accept, the contact request should still be on my /contacts?tab=requests
- When I press Accept and Add, I should automatically accept his contact request and sync it with my contacts.