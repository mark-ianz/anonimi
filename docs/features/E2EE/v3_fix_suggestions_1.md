# E2EE v3 – Recent Message Preview State Issue

## Overview

E2EE is fully working. Encryption and decryption are stable.

The remaining issue is related to **state synchronization between Chat view and MessageList**, especially during navigation.

---

## Problem Summary

### Sender Side

#### Current Behavior

1. While inside `/chat/:id`:

   * MessageList shows:

     ```
     username
     You: [Encrypted]
     ```

2. After navigating away to another chat:

   * Preview reverts to:

     ```
     You: previous message before the encrypted one
     ```

3. After refresh:

   * Correct latest message appears

---

### Receiver Side

#### Current Behavior

1. While inside `/chat/:id` and they received a new message from that person/group:

   * MessageList shows correct latest message

2. After navigating away:

   * Preview reverts to an **older message**

3. After refresh:

   * Fixes itself

---

## Key Issue

> MessageList state is **not updating persistently** after sending/receiving messages.

* Updates only exist **temporarily in Chat view**
* When navigating:

  * MessageList falls back to **stale cached data**
* Refresh works because:

  * Data is re-fetched and properly decrypted

---

## Root Cause

### 1. Separate States (Not Synced)

* Chat messages state ✅ updates in real-time
* Conversations (MessageList) state ❌ not updated

---

### 2. Socket/Event Updates Not Propagated

* New messages update:

  * Chat view state
* But NOT:

  * Conversation list state

---

### 3. React Query / Zustand / Local State Mismatch

Possible cases:

* MessageList uses cached query data
* Chat updates local state only
* No global sync between them

---

## Suggested Fixes

### Fix 1: Update Conversation List on New Message

Whenever a message is sent or received:

```ts
setConversations((prev) =>
  prev.map((conv) =>
    conv.id === activeChatId
      ? {
          ...conv,
          lastMessage: {
            ...message,
            decryptedContent: decryptedText,
          },
        }
      : conv
  )
);
```

✅ This ensures MessageList always has the latest message

---

### Fix 2: Sync on Send AND Receive

Make sure both flows update the list:

* On send → update preview
* On receive (socket) → update preview

---

### Fix 3: Centralize State (Recommended)

Use a **single source of truth**:

* Zustand / React Query / global store

Instead of:

* Chat having its own state
* MessageList having separate state

---

### Fix 4: React Query Users (If applicable)

If using React Query:

```ts
queryClient.setQueryData(["conversations"], (old) => {
  return old.map((conv) =>
    conv.id === activeChatId
      ? { ...conv, lastMessage: updatedMessage }
      : conv
  );
});
```

---

### Fix 5: Avoid Reverting on Navigation

The revert happens because:

* Navigation re-renders MessageList
* Old cached data is reused

👉 Fix by ensuring:

* Latest message is already in the stored state BEFORE navigating

---

## Key Insight

* Chat view = **real-time correct state**
* MessageList = **stale snapshot**

👉 You need to **push updates from Chat → MessageList**

---

## Expected Result After Fix

* No reverting to old messages
* Latest message always visible in preview
* Consistent behavior across:

  * Send
  * Receive
  * Navigation
  * Refresh

---

## Final Note

This is the **last state synchronization issue**.

Once fixed:

* E2EE v3 will be:

  * Fully functional ✅
  * Fully consistent ✅
  * Production-level UX ✅
