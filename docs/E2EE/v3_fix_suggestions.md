# E2EE v3 – Recent Message Preview Issue (Debug & Fix)

## Overview

The E2EE system is fully functional, but the **Recent Message Preview** in the Messages List still appears **blank**, especially after page refresh.

This document outlines the **likely root causes** and **possible fixes**.

---

## Problem Summary

* Message preview is blank in the Messages List
* Chat view (`/chat/:id`) works perfectly
* Issue mostly occurs on:

  * Initial load
  * Page refresh

---

## Likely Root Causes

### 1. Decryption Not Completed Before Render

* Conversations are rendered **before decryption finishes**
* Since decryption is async, UI shows empty content

---

### 2. Decrypted Data Not Stored in State

* Messages may be decrypted, but:

  * Result is not saved in React state
  * Or state is mutated instead of updated

#### Common Mistake

```ts
conversations.map(async (conv) => {
  const decrypted = await decrypt(conv.lastMessage);
  conv.lastMessage.text = decrypted; // ❌ mutation (no re-render)
});
```

---

### 3. Decryption Only Happens in Active Chat

* Decryption logic may only run when:

  * Chat is open (`/chat/:id`)
  * Socket events trigger updates

* On refresh:

  * That logic does not execute
  * Preview remains encrypted → appears blank

---

### 4. UI Reads Encrypted Field Instead of Decrypted One

* UI might still be using:

  * `lastMessage.content` (encrypted)
* Instead of:

  * `lastMessage.decryptedContent`

---

## Suggested Fixes

### Fix 1: Decrypt on Initial Fetch

Ensure all conversation previews are decrypted **before setting state**

```ts
const [conversations, setConversations] = useState([]);

useEffect(() => {
  const load = async () => {
    const data = await fetchConversations();

    const decrypted = await Promise.all(
      data.map(async (conv) => {
        if (!conv.lastMessage) return conv;

        const text = await decryptMessage(conv.lastMessage);

        return {
          ...conv,
          lastMessage: {
            ...conv.lastMessage,
            decryptedContent: text,
          },
        };
      })
    );

    setConversations(decrypted);
  };

  load();
}, []);
```

---

### Fix 2: Avoid Direct Mutation

* Always return new objects
* Never mutate existing conversation data

---

### Fix 3: Ensure UI Uses Decrypted Field

```tsx
<p>
  {isMe ? "You: " : ""}
  {conv.lastMessage?.decryptedContent || ""}
</p>
```

---

### Fix 4: Handle Async State Properly

* Show placeholder while decrypting:

  * `"Loading..."` or skeleton UI
* Avoid showing empty string or misleading content

---

### Fix 5: Run Decryption Outside Chat View

* Ensure decryption logic runs:

  * On initial load
  * Not only inside chat-specific components

---

## Key Insight

The issue is not encryption itself, but **where and when decryption is applied**.

To fix this:

* Decrypt early (on fetch)
* Store properly (in state)
* Render correctly (use decrypted field)

---

## Final Note

* This is the last known UX issue in E2EE v3
* Fixing this ensures:

  * Consistent UI
  * Seamless user experience
  * Fully polished implementation
