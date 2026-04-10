## Group Chat Features

### 1.1 Group Creation without Members
- Allow creating a group chat even if only the creator is a member
- This is an opption because invite links could be used to add members later.

### 1.2 Add/Search Members
- On:
  - `/groups/create`
  - `/groups/[groupId]`

- Users should be able to:
  - Search and add **any user**, not just contacts

### 1.3 Message Request Handling
- If a user is added to a group but is **not in the creator’s contacts**:
  - The group chat should appear in their **Message Requests tab**