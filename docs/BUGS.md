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

-- Done
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
- If they got verified, they can use the app like a normal user now.

--
Create a guide page for users

--
Fix the New Support Ticket, make sure it's syncing real time.

If I submit a ticket it should  be visible on support tab and I can message more or reopen it there.

Ny Submitted Ticket will be seen at admin tab and will be shown like a message type where admin can reply and I can talk to them on my Support Tab.

Ticket can have a status.

I can receive notifications from the support if they replied.

The support tab also is where the user reports go, it will be like a ticket too that has a status too.

--

Admin Support Updates:

1. When I sent someone a warning and goes to use their account and I don't see the warning on Support:
[2026-04-02 13:54:52.711 +0800] ERROR: Cannot read properties of null (reading '_id')
    err: {
      "type": "TypeError",
      "message": "Cannot read properties of null (reading '_id')",
      "stack":
          TypeError: Cannot read properties of null (reading '_id')
              at C:\Users\busti\Desktop\Node\EchoID\backend\src\services\contact.service.ts:63:20
              at Array.map (<anonymous>)
              at Object.getIncomingRequests (C:\Users\busti\Desktop\Node\EchoID\backend\src\services\contact.service.ts:60:19)
              at processTicksAndRejections (node:internal/process/task_queues:105:5)
              at getIncomingRequests (C:\Users\busti\Desktop\Node\EchoID\backend\src\controllers\contact.controller.ts:36:22)
    }

2. --

 As admin and I go to /admin/support, the date is Invalid Date and when I open the report it just says User.

3. --

 When I claim the ticket it says:
 [2026-04-02 13:59:52.932 +0800] ERROR: Cannot read properties of undefined (reading 'map')
    err: {
      "type": "TypeError",
      "message": "Cannot read properties of undefined (reading 'map')",
      "stack":
          TypeError: Cannot read properties of undefined (reading 'map')
              at C:\Users\busti\Desktop\Node\EchoID\backend\src\middleware\validate.middleware.ts:16:38
              at Layer.handleRequest (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\router\lib\layer.js:152:17)
              at next (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\router\lib\route.js:157:13)
              at Route.dispatch (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\router\lib\route.js:117:3)
              at handle (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\router\index.js:435:11)
              at Layer.handleRequest (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\router\lib\layer.js:152:17)
              at C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\router\index.js:295:15  
              at param (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\router\index.js:600:14)
              at param (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\router\index.js:610:14)
              at processParams (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\router\index.js:664:3)
    }

4. --

On /admin/reports:
- It also just say User Reported by username.
- When I claim the report it gives me a toast notification Failed to claim report but no backend error log.

5. --

On /admin/groups/groupid, when I click View Messages it redirects me to /admin/messages?conversationId=undefined

6. --

Going to /admin/bans gives me this:
[2026-04-02 14:02:25.457 +0800] ERROR: Cannot access 'data' before initialization
    err: {
      "type": "ReferenceError",
      "message": "Cannot access 'data' before initialization",
      "stack":
          ReferenceError: Cannot access 'data' before initialization
              at Object.getBans (C:\Users\busti\Desktop\Node\EchoID\backend\src\services\admin.service.ts:757:49)
              at processTicksAndRejections (node:internal/process/task_queues:105:5)
              at getBans (C:\Users\busti\Desktop\Node\EchoID\backend\src\controllers\admin.controller.ts:367:20)
    }
[2026-04-02 14:02:26.530 +0800] ERROR: Cannot access 'data' before initialization
    err: {
      "type": "ReferenceError",
      "message": "Cannot access 'data' before initialization",
      "stack":
          ReferenceError: Cannot access 'data' before initialization
              at Object.getBans (C:\Users\busti\Desktop\Node\EchoID\backend\src\services\admin.service.ts:757:49)
              at processTicksAndRejections (node:internal/process/task_queues:105:5)
              at getBans (C:\Users\busti\Desktop\Node\EchoID\backend\src\controllers\admin.controller.ts:367:20)
    }
[2026-04-02 14:02:28.591 +0800] ERROR: Cannot access 'data' before initialization
    err: {
      "type": "ReferenceError",
      "message": "Cannot access 'data' before initialization",
      "stack":
          ReferenceError: Cannot access 'data' before initialization
              at Object.getBans (C:\Users\busti\Desktop\Node\EchoID\backend\src\services\admin.service.ts:757:49)
              at processTicksAndRejections (node:internal/process/task_queues:105:5)
              at getBans (C:\Users\busti\Desktop\Node\EchoID\backend\src\controllers\admin.controller.ts:367:20)
    }

7. --

Going to /admin/analytics, the TRENDS (30 DAYS) just loads forever.

8. --

If I have any valid admin roles and I logged in, I should see a button below Support on the left side the redirects me to the admin page of my role.

--

Admin Support Updates Test Results:
1. -- 
Sending a warning works fine but:
  - Make it red or color warning for user end.
  - If I clicke the View Message on warning toast, it does nothing.
  - I don't see the warning on Support tab either.

2. -- Passed

3. -- 
No more error on backend console but when I claim it pops up a toast with: Failed to assign ticket

4. --
Still fail to claim the report with Failed to claim report toast.

5. --
- When I clicked the View Message on the /admin/groups/id, it redirects me to /admin/messages?conversationId=69cdc10d4c0fc95d2c9b4a1d but it still says Enter a conversation ID above to view messages. It requires me to input the Conversation ID instead of automatically querying.
- It also says 0 Members, show all and their roles

6. --
No more errors, but I can't ban someone it gives me an error toast of: Failed to ban user

7. -- Passed

8. -- Passed

--
Admin Support Updates Test Results v2:

1. -- 
- When the user receives the warning and view message, they have to manually refresh for message to show up.
- I should see a warning history of the user or a tabs of people who have warnings.

2. -- Still Passed
3. -- 
- Ticket can now be claimed.
- I should see a tab for a ticket that was assigned to me. Whether it's a Ticket or User Report.
- Because if there's no claimed section, the ticket will be lost by me since it's gonna be hard to manually find.
- Also on support chat, the username is just User.
- Users shouldn't be able to see who's admin claimed their ticket/report. Only other admins can, for example admin 1 claimed the report and admin 2 is browsing, they will see that this report was claimed by admin 1 and they can contribute to it and will be moved to their claimed section. They will be marked as contributor since admin 1 is the one who claimed. If they are contributor, they can send a message now but ofcourse their profile when replied is their username and the user who submitted the report will see him as contributor only.
4. -- 
- Still failed to claim report when I Claim Report
- It gives an error log on backend:
[2026-04-02 14:46:20.980 +0800] ERROR: Cast to ObjectId failed for value "undefined" (type string) at path "_id" for model "Report"
    err: {
      "type": "CastError",
      "message": "Cast to ObjectId failed for value \"undefined\" (type string) at path \"_id\" for model \"Report\"", 
      "stack":
          CastError: Cast to ObjectId failed for value "undefined" (type string) at path "_id" for model "Report"      
              at SchemaObjectId.cast (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\schema\objectId.js:253:11)
              at SchemaObjectId.SchemaType.applySetters (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\schemaType.js:1279:12)
              at SchemaObjectId.SchemaType.castForQuery (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\schemaType.js:1705:17)
              at cast (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\cast.js:386:32)
              at model.Query.Query.cast (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\query.js:5088:12)
              at model.Query.Query._castConditions (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\query.js:2376:10)
              at model.Query._findOne (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\query.js:2716:8)
              at model.Query.exec (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\query.js:4687:80)
              at processTicksAndRejections (node:internal/process/task_queues:105:5)
              at Object.claimReport (C:\Users\busti\Desktop\Node\EchoID\backend\src\services\admin.service.ts:278:18)  
      "stringValue": "\"undefined\"",
      "kind": "ObjectId",
      "value": "undefined",
      "path": "_id",
      "reason": {
        "type": "BSONError",
        "message": "input must be a 24 character hex string, 12 byte Uint8Array, or an integer",
        "stack":
            BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer
                at new ObjectId (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\bson\src\objectid.ts:113:15)  
                at castObjectId (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\cast\objectid.js:25:12)
                at SchemaObjectId.cast (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\schema\objectId.js:251:12)
                at SchemaObjectId.SchemaType.applySetters (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\schemaType.js:1279:12)
                at SchemaObjectId.SchemaType.castForQuery (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\schemaType.js:1705:17)
                at cast (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\cast.js:386:32)
                at model.Query.Query.cast (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\query.js:5088:12)
                at model.Query.Query._castConditions (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\query.js:2376:10)
                at model.Query._findOne (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\query.js:2716:8)
                at model.Query.exec (C:\Users\busti\Desktop\Node\EchoID\backend\node_modules\mongoose\lib\query.js:4687:80)
      },
      "valueType": "string"
    }
User connected: PBRv_htm3Ni61EunAAAG, User: 69cd43954e1463f6a58f9a00

5. --
- Members username is just "@" and nothing more.
- Works fine except the problem above.

6. --
- I can ban now successfully.
- on /admin/bans, the username is just @.
- Even though the user is still banned, it's counted as Inactive.
- I should be able to unban them instantly.
- Also I don't understand the Full History and Active only.
- When banned users try to logged in, it should display the reason on the login.

7. -- Still Passed
8. -- Still Passed

--
Admin Support Updates Test Results v3:

1. --
On the /admin/warnings, the one who warned has to manually refreshed. It should append to the cache (this doesn't need some socket)

3. --
- On the person who submitted a ticket, on their /support tab, if they messaged on the ticket or received a message, it should pop up to the very top with a notification of total unread messages. Also if they received a message, the ? Support tab should have a notification if they got warned, received a message or etc.

4. --
- When I go to /admin/reports/id, Reported By: Unknown
- On the admin/reports/id, I should have a profile view for the person that is getting reported and reporting. So that I could make an action for both if necessary but mostly on the reported person.
- Resolving a report pops up a toast: Failed to resolve report but no backend log.

5. --
- On admin/groups, group photos are empty.
- /admin/groups/id members photo are empty.

6. --
- banned person image is empty.


--
Admin Support Updates Test Results v4:

1. --
- If the admin replies, it will automatically claimed by them.
- The input on /support/id is not centered vertically on the input container.
- Users should also be able to send images.

3. -- Passed
4. -- 
- On the /admin/reports/id, and the section where it shows Reporting/Reported user. The View Profile text on the button is not centered vertically
- If I selected on  actions and type a resolution note, it should be saved. For example when I went to View Profile and go back, the input should still be there.
- There should be a feedback for the one who reported on what has happened on the report not just simple "Resolved"
--
5. --
- If the group has no photo, please use the floating profile pictures.

6. --
- Unbanning should require a confirmation.

--
Admin Support Updates Test Results v5:

1. --
- The text input is still not centered, seems like the height of text area is not taking up the entire container.
- When I input a text with the media and sent, the text is not getting sent and only the image.

4. --
- The actions, notes is not getting saved, save it on like localStorage so that when I View their Profile and comeback, the actions and note is not getting reseted.
- Add an option for the admin to send additional note but for the reporter to see, this is optional by the admin.

5. -- 
UI Bugged, please use the group photo is it is on the /chats and group photo (if none provided) that is the perfect example.

6. --
- Put some effort on the confirmation and not just a simple alert.

--

Admin Support Updates Test Results v6:

1. -- Passed
4. -- 
- Nothing Changed.
- More detailed instruction:
  - When I open a report on /admin/reports/id. I have these Actions:
    - Resolution Actions
    - Resolution Notes
    - Reporter Note
  
  - When I select resolution actions, edit notes. It should be writteon on the localStorage with the report id saved too as identified.
  - The purpose of this is that if I want to View their Profile to verify and come back, the action and notes are not getting resetted since it is saved on the localStorage and just getting autofilled.

5. -- Passed
6. -- Passed

-- Done

Admin Permissions Update:

Bug: Support Staff and moderator has the admin button on tabs but if clicked, nothing happens.


  - Super Admin:
    - Only one on the system
    - Edit all users permission, name, info, etc, delete user. Feels like a god. But all editing requires a confirmation.
    - Can view the entire Logs
    - Has access to all, everything.
  - Moderators:
    - Can delete user (will be pending) but requires approval by the Super Admin
    - Has access to:
      - Dashboard
      - Users
      - Reports
      - Support
      - Warnings
      - Groups
      - Messages
      (If admins viewed messages of private or group, it will log on the super admin side)
      - Ban/Unban
      - Analytics
      - Logs (only actions taken by Support Staff)
  - Support Staff
    - Users Tab (but has no send warning or ban user options when viewing on /admin/users/id)
    - Reports (full access)
    - Support (full access)
    - Warnings (view only? idk if should support staff should have a view permission or send warning please help me decide)

-- Done
  UI Updates:
    - If the call or video call icon was clicked, show a toast saying something similar to that this is not implemented yet or soon.
    - Move the global search from the sidebar to the very top and with the same container of the notification bell but they will be space-between.
    - The position of the old search bar will be replaced by:
      - Container that displays:
        - User Profile
        - Username
        - ID
        - Dropdown to change of status (use the existing change of status that is on the top right)
      - Think of it like a snippet banner for the user.

  Responsive Update:
    - If the screen is small:
      - The sidebar should take up the entire width of the screen if the user decided to open the sidebar.
      - At initial visit, the sidebar is always close.
      - The search bar at the top (beside the notification bell) will be a Search Icon only and the input will pop up if the icon was clicked.
      - When navigating to sidebar navigations, automatically close it if I click for other tabs. For example my sidebar is open and I clicked to contacts, my sidebar will automatically close for better user experience.
--

Group owners can mute members. If member is muted, they can't be able to send message and will have a banner on the conversation saying that they are muted

-- Done

Add a reply functionality, this allows the users to reply to any other messages even if it's media. Reply works on both private and group.

-- Done

Mute conversation feature: User should be able to mute the converastion, they won't receive a notification or notification count won't count on the muted conversation

-- Done

stealth-setup-preview: setting up the timer for stealth.
stealth-preview: preview message of stealth mode with a ticking time.
stealthy-message-preview: preview of an expired message.

temporary-account-conversation-preview: conversation to someone with temp account

--

Make the /contact page functional. This is for non-logged in user to send us a message. Since this is a public input, add a honeypot with an id/name of "phone_number" the frontend will check this and if it somehow has a value, it will not send the request but for somehow it goes through and the backend reads that has a value, automatically invalidate the message.

If the message is valid, this will go through the admin panel. Only moderator and super_admin can view this. It will be under the Support & Moderation section with it's own tab called Messages. The tab will be under Support Tickets.

Moderator and Super admin can put status to this, read, resolved, spam, etc...

If moderator acted or change status, it will be log on Logs. 

Note: Only super_admin can view the log that admin took action.