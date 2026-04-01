### Bugs & Improvements

Status: Resolved
Last updated: 2026-04-01

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

#### 6. Web Push Notifications

Implemented:

* Web Push subscriptions with VAPID + service worker
* Settings toggle for enable/disable
* Notifications only display when the app is not visible
* Images and deep links included in push payloads

Result: Users receive background push notifications with correct routing.

---

#### 7. Chat Tabs + Groups Merge

Implemented:

* Groups tab removed from sidebar and merged into chat filters
* Chat tabs: All, Unread, Private, Groups
* /groups now redirects to /chat?tab=groups

Result: Group chats live under the unified chat list with filtering.

---

#### 8. Password Reset Auto-Login

Implemented:

* Reset password returns tokens and auto-logs in
* Reset email is sent via SMTP with a link

Result: Users can reset and continue without a separate login step.

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
  "anonimiId": "aid_6r1aunby",
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

-- Done
When creating a group chat, the members avatar when adding members initially are empty.

-- Done
On Contacts tab, the contacts activity status are not sync to their current status.

-- Done
Add typing indicator if the user is typing. 
- If it's on the group chat and there are two people typing: x and x are typing...
- 3 people: x and 2 others are typing...
- 10+: x and 9+ others are typing...

-- Done
When the 3 buttons popover actions are open on the conversation header and I hover to a message, the message overlaps the opened popover.

-- Done
Edit message function:
- Users can edit their own message, if they edit it other people can see the edit history of the message.

(xPersonx) username
(xxIconxx) Edited (this is clickable)
xxxxxxxxxx This message was edited for testing!

x - whitespace

The edit option will appear on the 3 dots beside the message, the options now will be:

- Edit
- Delete for me
- Unsend

-- Done

Receiving a message or typing indicator behaviour updated.

Currently if I'm not scrolling like I just opened the conversation, the messages will be alright.

But the problem is that if I'm at the very bottom (most recent) of th conversation and I received a message, the message will appear at below of my screen and I have to scroll it down before I receive. Same for typing, if I'm at the very borrom of the conversation and someone typed, the typing indicator will be at the bottom overflowing hidden. Meaning I also have to scroll down to see that they are typing. 

This shouldn't the behavior instead I should see it instantly and don't need to scroll.

The only scenario that I have to scroll down to see is that if I'm back reading to the top of our conversation or I'm actively scrolling, in that case then I have to scroll down to see.

Additional Feature:
If I'm actively scrolling through the conversation and someone messaged on that conversation, I should see a little pop up inside the conversation that they sent a message and if I clicked it, it will scroll me down to the very bottom to see their message.

-- Done
On the internet status. Sometimes it just stays on Disconnected or Reconnecting, my web app is not even really trying to reconnect. I have to manually refresh to fix it.

--
Stealth Mode

What is Stealth Mode? 
- It's a way for the message that you are sending to become like a ticking time bomb depending on the amount of time you set. 
- For example you set it for 5m and you start messaging, your message will become a  `stealth messages`, it will have a different background color and will have a timer above on how long before it becomes `stealthy`. 
- `Stealthy message` is a term for a message that will still on the conversation but it's a blank (color is the same as the `stealth background message` color). 
- The stealthy message is NOT accessible through devtool, network or etc. The backend will just say that it's a stealthy message and won't send back the actual message BUT backend will still send the amount of characters that stealthy message has so that the length of the message will still be dynamic.

This mode is toggleable, the option to toggle this will be beside the attachment icon.

If the toggle it, an option will appear on how long will the message be visible.
- 1m
- 5m
- 15m
- 30m
- 1h
- 3h
- 6h
- 12h
- 24h

Definition of Terms:
Stealth Message - the message that was sent during stealth mode.
Stealthy Message - Stealth Message that was expired. This has no content but there's a character length so the width/length of the stealthy message is still dynamic based on the stealth message.

-- 
Temporary accounts, users can opt in to a temporary account. This will have full anonymity and requires no email and password.

Steps:
- On login/register, the user clicks temporary account.
- They will automatically be logged in and auto generated an AID but has no password. This account is session only account, if they closed the window or logged out, the account will be no longer accessible.
- Their username will be a generic `temp_xxxxxx` similar to the generic username of verified user `anon_xxxxxx`
- Though this is a session only account, there will be a timer somewhere since temporary accounts can only exsist for 24h and need to be claimed/verify.
- Their usage will still be similar for a verified user, they can search for someone and message it but they won't have a permission yet to add contact, report, block, or etc that requires an account. The options will be there but if they tried to access it, a modal will pop up reminding them that they are only using temporary account and requires to claim/verify the account to have a full access something....
- They are not searchable yet on the search global
- Other users will see if these accounts are temporary.
- If other users are having a conversation with temporary account, there's a persistent banner on the conversation saying to be careful for these account blah blah blah.
- I'm saying yet on here BECAUSE, temporary account users could claim this account by having an option to verify/claim account that will require their email and have a verification and  set a password.
- If they got verified, they can use the app like a normal person now.