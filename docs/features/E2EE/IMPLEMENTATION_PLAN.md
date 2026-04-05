# E2EE v1 Implementation Plan

## Architecture

**Hybrid cryptosystem:**
- Client-side encryption using Web Crypto API (AES-GCM for messages, ECDH P-256 for key exchange)
- Server stores only ciphertext — never sees plaintext
- Stealth Mode remains as an additional layer (auto-expiry) on top of E2EE

## Implementation Phases

### Phase 1: Backend Infrastructure
1. **E2EE crypto utility** — `backend/utils/e2eeCrypto.ts`
   - AES-256-GCM encrypt/decrypt (reuse stealthCrypto pattern)
   - Key derivation helpers
2. **Database models**:
   - `backend/models/e2eeKey.model.ts` — User E2EE key pairs (public key + encrypted private key)
   - `backend/models/conversationKey.model.ts` — Per-conversation shared keys (for groups)
   - Extend `message.model.ts` with `isE2ee`, `e2eeCipher`, `e2eeIv`, `e2eeTag`, `e2eeKeyId`
3. **TypeScript types** — Update `models.ts`, `socket.events.ts`
4. **E2EE routes + controllers** — Key registration, public key fetch
5. **Socket handler** — `e2ee.handler.ts` for real-time key distribution

### Phase 2: Key Exchange Flow
1. **Private chats** — ECDH key exchange via public key lookup
2. **Group chats** — Shared AES key, encrypted per-member with their public key
3. **Key rotation** — On member leave, generate new key, re-encrypt for remaining members

### Phase 3: Client-Side Crypto (Frontend)
1. **Web Crypto module** — `frontend/src/lib/e2eeCrypto.ts`
   - AES-GCM encrypt/decrypt
   - ECDH key pair generation + shared secret derivation
   - Key serialization/deserialization
2. **IndexedDB key store** — `frontend/src/lib/e2eeKeyStore.ts`
   - Store user's key pair (private key encrypted with password-derived key)
   - Store per-conversation AES keys
3. **Key registration on auth** — Auto-generate/register keys on login

### Phase 4: Message Encryption Pipeline
1. **Backend `chat.service.ts`**:
   - `sendMessage()` — Accept encrypted payload, store cipher fields
   - `getMessages()` — Return ciphertext to client (no server-side decryption)
   - `searchMessages()` — Exclude E2EE messages from server search
   - Update `serializeStealth()` to NOT decrypt E2EE messages
2. **Frontend `useMessages.ts`**:
   - Encrypt before send
   - Decrypt on receive
3. **Frontend `SocketProvider.tsx`**:
   - Handle E2EE message receive events
   - Decrypt incoming messages before storing in chatStore
4. **UI updates**:
   - `MessageBubble.tsx` — E2EE indicator, decryption error states
   - `MessageInput.tsx` — Remove stealth-only gating (E2EE is universal now)

### Phase 5: Group Key Management
1. Group creation → generate shared key, encrypt for each member
2. Member joins → distribute key (encrypt with their public key)
3. Member leaves → rotate key, re-encrypt for remaining members
4. Socket events: `group:key:distributed`, `group:key:rotated`

### Phase 6: Backward Compatibility
1. Stealth Mode continues working (E2EE + expiry)
2. Existing plaintext messages remain readable
3. `isE2ee` flag on messages (default false for legacy)
4. Frontend handles both encrypted and plaintext messages

### Phase 7: Security Hardening
1. Remove all server-side decryption for E2EE messages
2. Client-side search (decrypt in-memory, filter locally)
3. Key protection (private keys encrypted at rest)

### Phase 8: Testing & Edge Cases
1. Key missing → re-sync flow
2. Decryption failure → graceful error UI
3. New device login → key regeneration + migration

## File Change Summary

| File | Action |
|------|--------|
| `backend/utils/e2eeCrypto.ts` | NEW |
| `backend/models/e2eeKey.model.ts` | NEW |
| `backend/models/conversationKey.model.ts` | NEW |
| `backend/models/message.model.ts` | EDIT |
| `backend/types/models.ts` | EDIT |
| `backend/types/socket.events.ts` | EDIT |
| `backend/validators/message.validator.ts` | EDIT |
| `backend/controllers/e2ee.controller.ts` | NEW |
| `backend/routes/e2ee.routes.ts` | NEW |
| `backend/socket/e2ee.handler.ts` | NEW |
| `backend/socket/index.ts` | EDIT |
| `backend/services/chat.service.ts` | EDIT |
| `backend/services/group.service.ts` | EDIT |
| `frontend/src/lib/e2eeCrypto.ts` | NEW |
| `frontend/src/lib/e2eeKeyStore.ts` | NEW |
| `frontend/src/types/message.ts` | EDIT |
| `frontend/src/types/socket.ts` | EDIT |
| `frontend/src/hooks/useMessages.ts` | EDIT |
| `frontend/src/providers/SocketProvider.tsx` | EDIT |
| `frontend/src/components/chat/MessageBubble.tsx` | EDIT |
| `frontend/src/components/chat/MessageInput.tsx` | EDIT |
| `frontend/src/stores/chatStore.ts` | EDIT |
