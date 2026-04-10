// @ts-ignore
import FlexSearch from "flexsearch";
// @ts-ignore
import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "anonimi-search";
const DB_STORE = "index";
let index: FlexSearch.Document<any> | null = null;
let db: IDBPDatabase | null = null;

async function getDb() {
  if (db) return db;
  db = await openDB(DB_NAME, 1, {
    upgrade(d: any) { d.createObjectStore(DB_STORE); },
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
 * Plaintext never leaves this function - it only enters the local index.
 */
export async function indexMessage(params: {
  msgId: string;
  body: string;
  conversationId: string;
  senderId: string;
  timestamp: Date;
}) {
  const idx = await getIndex();
  idx.add({
    msgId: params.msgId,
    body: params.body,
    conversationId: params.conversationId,
    senderId: params.senderId,
    timestamp: params.timestamp.toISOString(),
  });

  const idb = await getDb();
  await new Promise<void>((resolve) => {
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
