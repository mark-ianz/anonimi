Here’s your issue rewritten cleanly in Markdown format with focused insight + possible solutions:

---

# E2EE Bug – AES-GCM Decryption Failure (Group Chat)

## Error

```
[E2EE] Decryption failed: OperationError
```

### Location

```ts
const decrypted = await crypto.subtle.decrypt(
  { name: "AES-GCM", iv: ivBuffer },
  aesKey,
  combined
);
```

---

## Observations

* When a **new member sends a message**:

  * Old members receive `OperationError`
  * Message appears blank

* When an **old member sends a message**:

  * New member receives `OperationError`
  * Message appears blank

* Old members:

  * Can still communicate with each other ✅
  * Their messages decrypt correctly

* New members:

  * Cannot read old members' messages ❌
  * Their messages are unreadable to old members ❌

---

## Key Insight

> `OperationError` in AES-GCM almost always means:
> ❗ **Wrong key OR wrong IV/tag combination during decryption**

This confirms:

* Encryption itself is working
* ❌ The **receiver does not have the correct key** to decrypt the message

---

## Root Cause

### ❗ Mismatched Encryption Keys Between Members

After a new member joins:

* The group is now using **different keys across members**

Result:

* Old members encrypt with **old key**
* New member encrypts with **new key**
* Receivers try to decrypt with the **wrong key**
* → `OperationError`

---

## Why It Behaves Like This

* Old members share the same key → can read each other ✅
* New member has a different key → cannot decrypt old messages ❌
* Messages sent by new member use a key unknown to old members ❌

👉 This creates a **split group encryption state**

---

## Possible Solutions

### Solution 1: Key Versioning (Required)

Each message must include which key was used:

```ts
{
  content: "...",
  keyId: "group-key-v2"
}
```

Then on decrypt:

```ts
const key = getKeyById(message.keyId);
decrypt(message, key);
```

---

### Solution 2: Proper Key Rotation

When a new member joins:

* Generate a **new group key**
* Distribute it to:

  * All current members (old + new)

⚠️ Important:

* Old members must **keep old keys**
* New member should NOT receive old keys

---

### Solution 3: Multi-Key Support

Each user should store:

```ts
user.groupKeys = {
  "group-key-v1": ...,
  "group-key-v2": ...
};
```

Then:

* Old messages → decrypt with v1
* New messages → decrypt with v2

---

### Solution 4: Do NOT Overwrite Keys

Avoid:

```ts
group.key = newKey; // ❌ breaks old messages
```

Instead:

* Maintain a **key history**

---

### Solution 5: Debug Check

Log during decrypt:

```ts
console.log("Trying key:", keyId);
console.log("User keys:", availableKeys);
```

If:

* `keyId` not found → guaranteed failure

---

## Expected Behavior After Fix

* Old members:

  * Can read old + new messages ✅

* New member:

  * Can read only messages after joining ✅

* No more `OperationError`

---

## Final Note

This is not a bug in AES-GCM or Web Crypto.
This is a **group key management issue**.

Fix the key strategy, and the error disappears completely.
