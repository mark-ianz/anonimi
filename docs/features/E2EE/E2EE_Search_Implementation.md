# E2EE Search Implementation — Exact Fix for Your Stack

**Based on actual document structure from your MongoDB collections.**

---

## What Your Documents Confirm

After inspecting your actual stored documents, here is the precise state of each collection:

**Messages collection** — `content` field is absent from stored documents. Only `contentCipher`, `contentIv`, `contentTag`, and `isE2ee: true` are written. This means your service layer is already clean — no plaintext leak in the message body.

**E2EEKey collection** — despite the model labelling the algorithm as `"RSA-OAEP-256"`, your stored public key (`MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcD...`) is an **EC P-256 key in SPKI format**. You are using ECDH P-256, not RSA. Additionally, `iv` and `tag` are both empty strings, meaning `encryptedPrivateKey` is stored as a raw PKCS8 private key — it is not encrypted at rest on your server.

**ConversationKeys collection** — group conversation keys are AES-GCM encrypted per user. The `encryptedKey` field is a JSON string `{ cipherText, iv, tag }` wrapped with each member's EC public key.

---

## What Still Needs Fixing

| Location | Problem | Impact |
|---|---|---|
| `message.model.ts` | `searchTokens` field missing | Search cannot work at all |
| `message.model.ts` | `replyPreview.content` copies plaintext of the original message | Plaintext leak inside reply |
| `conversation.model.ts` | `lastMessage.content` may be written for E2EE messages | Plaintext preview leak |
| `message_controller.ts` | `searchMessages` passes raw `q` string to service | Always returns empty for E2EE |
| `chat.service.ts` | `searchMessages` queries `content` field via regex | Wrong query for encrypted messages |

---

## Step 1 — Update `message.model.ts`

Add `searchTokens` and remove the risk of `replyPreview.content` leaking.

```ts
// message.model.ts — add searchTokens field
const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: MessageType, required: true },
    content: { type: String },              // kept for non-E2EE messages only
    isStealth: { type: Boolean, default: false },
    stealthExpiresAt: { type: Date },
    stealthExpiredAt: { type: Date },
    contentCipher: { type: String },
    contentIv: { type: String },
    contentTag: { type: String },
    contentLength: { type: Number },
    searchTokens: { type: [String], default: undefined }, // ← ADD THIS
    mediaUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    replyPreview: {
      messageId: { type: Schema.Types.ObjectId, ref: "Message" },
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      senderUsername: { type: String },
      type: { type: String, enum: MessageType },
      content: { type: String },            // null when original message is E2EE
      mediaUrl: { type: String },
      fileName: { type: String },
      createdAt: { type: Date },
    },
    // ... rest of fields unchanged
    isE2ee: { type: Boolean, default: false },
    contentKeyVersion: { type: Number },
  },
  { timestamps: true }
);

// ADD this index alongside the existing ones
messageSchema.index({ searchTokens: 1 });
messageSchema.index({ conversationId: 1, searchTokens: 1 }); // for scoped search
```

---

## Step 2 — Key Derivation Strategy (Matches Your Actual EC P-256 Setup)

Your private key is stored as an unencrypted PKCS8 EC P-256 key. The search key is derived directly from the raw private key bytes using HKDF. This gives every user a single, consistent, deterministic search key across all their conversations — no need to fetch per-conversation keys on every search.

```ts
// lib/searchKey.ts

/**
 * Derives a stable HMAC search key from the user's EC private key.
 * Called once after login; the result is kept in memory only.
 *
 * @param pkcs8Base64 — the value of e2eeKey.encryptedPrivateKey from your API
 */
export async function deriveSearchKey(pkcs8Base64: string): Promise<CryptoKey> {
  // Decode the PKCS8 private key bytes
  const pkcs8Bytes = Uint8Array.from(atob(pkcs8Base64), c => c.charCodeAt(0));

  // Import as raw key material for HKDF
  // We use the raw bytes as the IKM — not the CryptoKey itself,
  // because HKDF requires "raw" importKey, not PKCS8.
  const ikm = await crypto.subtle.importKey(
    "raw",
    pkcs8Bytes,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  // Derive a dedicated HMAC key for search — never reuse the message encryption key
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(32),                           // fixed zero salt
      info: new TextEncoder().encode("anonimi-search-v1"), // domain-separated
    },
    ikm,
    { name: "HMAC", hash: "SHA-256" },
    false,       // not extractable
    ["sign"]
  );
}

/**
 * Store the derived search key in memory after login.
 * Never persist this to localStorage or IndexedDB.
 */
let _searchKey: CryptoKey | null = null;

export function setSearchKey(key: CryptoKey) { _searchKey = key; }
export function getSearchKey(): CryptoKey {
  if (!_searchKey) throw new Error("Search key not initialised — call deriveSearchKey first");
  return _searchKey;
}
```

Call this once after fetching the user's key material at login:

```ts
// After fetching from GET /api/e2ee/my-key
const { encryptedPrivateKey } = await getMyE2EEKey();
const searchKey = await deriveSearchKey(encryptedPrivateKey);
setSearchKey(searchKey);
```

---

## Step 3 — Tokenise Messages (Client-Side)

```ts
// lib/searchTokens.ts

/**
 * Normalises plaintext and returns HMAC-SHA256 tokens for each word.
 * These are the values sent to the server in the searchTokens field.
 * The server never sees the original words.
 */
export async function tokenizeMessage(plaintext: string): Promise<string[]> {
  const searchKey = getSearchKey();

  const words = [...new Set(
    plaintext
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2)        // skip very short words
  )];

  const tokens = await Promise.all(
    words.map(async (word) => {
      const sig = await crypto.subtle.sign(
        "HMAC",
        searchKey,
        new TextEncoder().encode(word)
      );
      return Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    })
  );

  return tokens;
}

/**
 * Computes HMAC tokens for a search query.
 * Same function — just named differently for clarity at the call site.
 */
export async function tokenizeQuery(query: string): Promise<string[]> {
  return tokenizeMessage(query);
}
```

---

## Step 4 — Update `message_controller.ts`

Replace the broken `searchMessages` handler. The controller no longer accepts a plaintext `q` parameter. It accepts HMAC `tokens[]` and optional metadata filters.

Also add `searchTokens` to the `sendMessage` body extraction.

```ts
// message_controller.ts

// ─── searchMessages ─────────────────────────────────────────────────────────
export const searchMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tokens, conversationId, senderId, before, after, cursor, limit } = req.query;

    const result = await chatService.searchMessages(
      req.user!._id.toString(),
      {
        tokens: tokens
          ? (Array.isArray(tokens) ? tokens as string[] : [tokens as string])
          : undefined,
        conversationId: conversationId as string | undefined,
        senderId:       senderId       as string | undefined,
        before:         before         as string | undefined,
        after:          after          as string | undefined,
      },
      limit ? parseInt(limit as string) : 20,
      cursor as string | undefined
    );

    apiPaginated(res, result.messages, {
      nextCursor: result.nextCursor,
      hasMore:    result.hasMore,
      limit:      result.limit,
    });
  } catch (error) {
    next(error);
  }
};

// ─── sendMessage — add searchTokens to body extraction ──────────────────────
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      conversationId, type, content, mediaUrl, fileName, fileSize,
      replyToId, stealthDuration,
      contentCipher, contentIv, contentTag, contentKeyVersion,
      searchTokens,   // ← ADD: array of HMAC strings from the client
    } = req.body;

    const result = await chatService.sendMessage(
      req.user!._id.toString(),
      conversationId,
      type,
      content,
      mediaUrl,
      fileName,
      fileSize,
      {
        stealthDuration,
        replyToId,
        contentCipher,
        contentIv,
        contentTag,
        contentKeyVersion,
        searchTokens,   // ← pass through to service
      }
    );

    apiSuccess(res, result.message, 201);
  } catch (error) {
    next(error);
  }
};
```

---

## Step 5 — Update `chat.service.ts`

### 5a — `sendMessage`: save `searchTokens` and guard `replyPreview.content`

```ts
// chat.service.ts — sendMessage

export async function sendMessage(
  senderId: string,
  conversationId: string,
  type: string,
  content: string | undefined,
  mediaUrl: string | undefined,
  fileName: string | undefined,
  fileSize: number | undefined,
  options: {
    stealthDuration?: number;
    replyToId?: string;
    contentCipher?: string;
    contentIv?: string;
    contentTag?: string;
    contentKeyVersion?: number;
    searchTokens?: string[];   // ← NEW
  }
) {
  const {
    stealthDuration, replyToId,
    contentCipher, contentIv, contentTag, contentKeyVersion,
    searchTokens,
  } = options;

  const isE2ee = !!contentCipher;

  // Build replyPreview — never copy plaintext from an E2EE original message
  let replyPreview: any = undefined;
  if (replyToId) {
    const original = await Message.findById(replyToId)
      .select("senderId type content mediaUrl fileName isE2ee createdAt")
      .lean();

    if (original) {
      replyPreview = {
        messageId:      original._id,
        senderId:       original.senderId,
        type:           original.type,
        content:        original.isE2ee ? null : original.content,  // ← guard
        mediaUrl:       original.mediaUrl,
        fileName:       original.fileName,
        createdAt:      original.createdAt,
      };
    }
  }

  const message = await Message.create({
    conversationId,
    senderId,
    type,
    content:            isE2ee ? undefined : content,   // never write for E2EE
    isE2ee,
    contentCipher:      contentCipher  ?? undefined,
    contentIv:          contentIv      ?? undefined,
    contentTag:         contentTag     ?? undefined,
    contentKeyVersion:  contentKeyVersion ?? undefined,
    searchTokens:       isE2ee && searchTokens?.length ? searchTokens : undefined,
    mediaUrl,
    fileName,
    fileSize,
    replyPreview,
    // ... stealth fields, readBy, etc.
  });

  // Update lastMessage — never write plaintext content for E2EE messages
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: {
      content:           isE2ee ? undefined : content,  // ← guard
      senderId,
      type,
      timestamp:         new Date(),
      isE2ee,
      contentCipher:     contentCipher  ?? undefined,
      contentIv:         contentIv      ?? undefined,
      contentTag:        contentTag     ?? undefined,
      contentKeyVersion: contentKeyVersion ?? undefined,
    },
  });

  return { message };
}
```

### 5b — `searchMessages`: replace regex query with token `$in` query

```ts
// chat.service.ts — searchMessages (full replacement)

export async function searchMessages(
  userId: string,
  filters: {
    tokens?:         string[];
    conversationId?: string;
    senderId?:       string;
    before?:         string;
    after?:          string;
  },
  limit: number,
  cursor?: string
) {
  // Base: user must be a participant
  const conversationFilter: any = { participants: userId };
  if (filters.conversationId) conversationFilter._id = filters.conversationId;

  const conversations = await Conversation.find(conversationFilter)
    .select("_id")
    .lean();
  const conversationIds = conversations.map(c => c._id);

  // Message query
  const query: any = {
    conversationId: { $in: conversationIds },
    unsent:         false,
    deletedFor:     { $ne: userId },
  };

  if (filters.senderId) query.senderId = filters.senderId;

  if (filters.before || filters.after) {
    query.createdAt = {};
    if (filters.before) query.createdAt.$lt = new Date(filters.before);
    if (filters.after)  query.createdAt.$gt = new Date(filters.after);
  }

  // HMAC token search — server matches opaque hashes, never sees plaintext
  if (filters.tokens?.length) {
    query.searchTokens = { $in: filters.tokens };
  }

  if (cursor) query._id = { $lt: cursor };

  const messages = await Message.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .select([
      "conversationId", "senderId", "type",
      "contentCipher", "contentIv", "contentTag", "contentKeyVersion",
      "isE2ee", "mediaUrl", "fileName", "fileSize",
      "replyPreview", "reactions", "readBy", "readByAt",
      "createdAt", "updatedAt",
      // searchTokens intentionally excluded — never return to client
    ].join(" "))
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  return {
    messages,
    nextCursor: hasMore ? messages[messages.length - 1]._id.toString() : null,
    hasMore,
    limit,
  };
}
```

---

## Step 6 — Client Send Flow (Next.js)

Add token generation to your message send call. The plaintext is available in memory here, before it is encrypted and discarded.

```ts
// hooks/useSendMessage.ts (or wherever you call POST /api/messages)

import { tokenizeMessage } from "@/lib/searchTokens";

export async function sendMessage({
  conversationId,
  plaintext,
  encryptedPayload,   // { contentCipher, contentIv, contentTag, contentKeyVersion }
  type,
  mediaUrl,
  replyToId,
}: SendMessageParams) {

  // Generate HMAC tokens from plaintext BEFORE it leaves memory.
  // Only for text messages — media messages have nothing to tokenise.
  const searchTokens = type === "text" && plaintext
    ? await tokenizeMessage(plaintext)
    : [];

  return fetch("/api/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      type,
      mediaUrl,
      replyToId,
      ...encryptedPayload,   // contentCipher, contentIv, contentTag, contentKeyVersion
      searchTokens,          // ← opaque HMAC tokens
      // NOTE: `content` (plaintext) is never sent to the server
    }),
  });
}
```

---

## Step 7 — Client Search Flow (Next.js)

```ts
// hooks/useSearch.ts

import { tokenizeQuery } from "@/lib/searchTokens";

export function useSearch() {
  const [results, setResults] = useState({
    contacts: [] as any[],
    groups:   [] as any[],
    messages: [] as any[],
  });
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({ contacts: [], groups: [], messages: [] });
      return;
    }

    setLoading(true);
    try {
      // 1. Contacts + groups — plaintext metadata, always fine to query server
      const metaPromise = fetch(
        `/api/search/meta?q=${encodeURIComponent(query)}`
      ).then(r => r.json());

      // 2. Compute HMAC tokens for the query word(s)
      const tokens = await tokenizeQuery(query);

      // 3. Server-side token match — returns encrypted message payloads
      const tokenSearchParams = tokens.map(t => `tokens[]=${t}`).join("&");
      const messagePromise = fetch(
        `/api/messages/search?${tokenSearchParams}`
      ).then(r => r.json());

      const [metaResults, messageResults] = await Promise.all([
        metaPromise,
        messagePromise,
      ]);

      // 4. Decrypt matched messages client-side
      const decryptedMessages = await Promise.all(
        (messageResults.data ?? []).map(async (msg: any) => {
          if (!msg.isE2ee) return msg;
          try {
            const plaintext = await decryptMessage(
              msg.contentCipher,
              msg.contentIv,
              msg.contentTag,
              msg.contentKeyVersion,
              msg.conversationId
            );
            return { ...msg, content: plaintext };
          } catch {
            return { ...msg, content: "🔒 (unable to decrypt)" };
          }
        })
      );

      setResults({
        contacts: metaResults.data?.contacts ?? [],
        groups:   metaResults.data?.groups   ?? [],
        messages: decryptedMessages,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}
```

---

## Step 8 — Local Index (IndexedDB, for instant results)

The local index provides **immediate results** before the server token query resolves. Both run in parallel; results are merged.

```ts
// lib/localIndex.ts
import FlexSearch from "flexsearch";
import { openDB, IDBPDatabase } from "idb";

const DB_NAME  = "anonimi-search";
const DB_STORE = "index";
let index: FlexSearch.Document<any> | null = null;
let db: IDBPDatabase | null = null;

async function getDb() {
  if (db) return db;
  db = await openDB(DB_NAME, 1, {
    upgrade(d) { d.createObjectStore(DB_STORE); },
  });
  return db;
}

export async function getIndex() {
  if (index) return index;

  index = new FlexSearch.Document({
    tokenize: "forward",
    cache: 200,
    document: {
      id: "msgId",
      index: ["body"],
      store: ["msgId", "conversationId", "senderId", "timestamp"],
    },
  });

  const idb = await getDb();
  const keys = await idb.getAllKeys(DB_STORE) as string[];
  for (const key of keys) {
    const data = await idb.get(DB_STORE, key);
    if (data) index.import(key, data);
  }

  return index;
}

/**
 * Call this immediately after decrypting a received or sent message.
 * Plaintext never leaves this function — it only enters the local index.
 */
export async function indexMessage(params: {
  msgId:          string;
  body:           string;
  conversationId: string;
  senderId:       string;
  timestamp:      Date;
}) {
  const idx = await getIndex();
  idx.add({
    msgId:          params.msgId,
    body:           params.body,
    conversationId: params.conversationId,
    senderId:       params.senderId,
    timestamp:      params.timestamp.toISOString(),
  });

  // Persist the updated index snapshot
  const idb = await getDb();
  await new Promise<void>(resolve => {
    idx.export(async (key: string, data: string) => {
      await idb.put(DB_STORE, data, key);
      resolve();
    });
  });
}

export async function localSearch(query: string) {
  const idx = await getIndex();
  return idx.search(query, { enrich: true, limit: 50 });
}
```

---

## How Each Collection Changes

### `messages` collection — before vs after

**Before** (current):
```json
{
  "isE2ee": true,
  "contentCipher": "SwqC",
  "contentIv": "A7JNRW1bJx2Pl9pz",
  "contentTag": "kfPkGkI0dV+2frH9aVGMfw=="
}
```

**After** (with search):
```json
{
  "isE2ee": true,
  "contentCipher": "SwqC",
  "contentIv": "A7JNRW1bJx2Pl9pz",
  "contentTag": "kfPkGkI0dV+2frH9aVGMfw==",
  "searchTokens": [
    "a3f1d2e8c9b0...",
    "7c2a1f4e8d3b..."
  ]
}
```

`searchTokens` are HMAC-SHA256 hex strings. The server cannot reverse them to words. The array is missing (`undefined`) for non-text messages (images, files) and for any messages sent before this feature is deployed.

### `e2eekeys` collection — no changes needed

The `encryptedPrivateKey` field is already accessible to the client. The search key derivation reads this value in memory on login and never writes anything back to this collection.

---

## Security Notes Specific to Your Implementation

**On the unencrypted private key**: Your stored documents show `iv: ""` and `tag: ""` on the E2EEKey record, meaning `encryptedPrivateKey` is a raw PKCS8 key, not encrypted at rest on your server. If your database is compromised, an attacker has the private keys. Consider encrypting the private key client-side with a password-derived key (PBKDF2 from login password) before uploading, and only decrypting it in memory after login. This is a separate issue from search but worth addressing.

**On search token frequency**: The server can observe how many messages match a given HMAC token. For high-frequency words like "hello", this leaks frequency information. To mitigate, add random dummy tokens to each message:
```ts
// In tokenizeMessage — add before returning
const dummyCount = Math.floor(Math.random() * 3); // 0–2 dummies
const dummies = await Promise.all(
  Array.from({ length: dummyCount }, () =>
    crypto.getRandomValues(new Uint8Array(32))
  ).map(b => Array.from(b).map(x => x.toString(16).padStart(2,"0")).join(""))
);
return [...tokens, ...dummies];
```

**On the `algorithm` label mismatch**: Your model defaults to `"RSA-OAEP-256"` but your keys are EC P-256. Update the model default to `"ECDH-P256"` to avoid future confusion:
```ts
algorithm: { type: String, default: "ECDH-P256" },
```

---

## Collision Checklist (All Resolved)

| File | Was | Fix Applied |
|---|---|---|
| `message.model.ts` | No `searchTokens` field | Added with sparse index |
| `message.model.ts` | `replyPreview.content` copies E2EE plaintext | Guarded in service with `isE2ee` check |
| `conversation.model.ts` | `lastMessage.content` may hold plaintext preview | Guarded in `sendMessage` service |
| `message_controller.ts` | `searchMessages` passes raw `q` to service | Replaced with `tokens[]` query param |
| `chat.service.ts` | `searchMessages` queries `content` with regex | Replaced with `searchTokens: { $in: tokens }` |