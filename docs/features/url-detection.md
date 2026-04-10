## URL Detection & Hyperlink Behavior Rules

### 1. Automatic Hyperlink (Full URLs)
If a message contains:
- `http://`
- `https://`

Then:
- Automatically convert it into a clickable hyperlink
- No modification needed to the URL

---

### 2. `www` Handling
If a message contains a link starting with:
- `www.`

Then:
- Prepend `https://`
- Convert it into a clickable hyperlink

Example:
- Input: `www.google.com`
- Output: `https://www.google.com` (clickable link)

---

### 3. Bare Domain Detection (No Protocol)

If a message contains a domain with common extensions such as:
- `.com`
- `.net`
- `.org`

Then:
- Treat it as a valid URL
- Prepend `https://`
- Convert it into a clickable hyperlink

Example:
- Input: `check this cool.com bro`
- Output: `https://cool.com` (clickable link)

---

### 4. Supported Extensions
At minimum, detect and support:
- `.com`
- `.net`
- `.org`

(You may optionally extend this list in the future.)

---

### 5. Behavior Summary

| Pattern | Action |
|--------|--------|
| `http://` | Keep as is + hyperlink |
| `https://` | Keep as is + hyperlink |
| `www.` | Add `https://` + hyperlink |
| `domain.com / .net / .org` | Add `https://` + hyperlink |

---

### 6. Example

Input:
```
yo bro check this cool.com it's fire
```

Output:
- `cool.com` → `https://cool.com` (clickable hyperlink)
```