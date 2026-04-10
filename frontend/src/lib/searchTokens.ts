import { getSearchKey } from "@/lib/searchKey";

/**
 * Normalises plaintext and returns HMAC-SHA256 tokens for each word.
 * These are the values sent to the server in the searchTokens field.
 * The server never sees the original words.
 */
export async function tokenizeMessage(
  plaintext: string,
  searchKey: CryptoKey = getSearchKey()
): Promise<string[]> {

  const words = [...new Set(
    plaintext
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  )];

  const tokens = await Promise.all(
    words.map(async (word) => {
      const sig = await crypto.subtle.sign(
        "HMAC",
        searchKey,
        new TextEncoder().encode(word)
      );
      return Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    })
  );

  return tokens;
}

/**
 * Computes HMAC tokens for a search query.
 * Same function - just named differently for clarity at the call site.
 */
export async function tokenizeQuery(
  query: string,
  searchKey: CryptoKey = getSearchKey()
): Promise<string[]> {
  return tokenizeMessage(query, searchKey);
}
