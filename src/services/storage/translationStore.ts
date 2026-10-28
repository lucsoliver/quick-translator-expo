import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  LanguageCode,
  TranslationHistoryItem,
} from "../../types/translation";

const dbPromise = SQLite.openDatabaseAsync("quick-translator.db");
let initialized: Promise<void> | undefined;

async function database(): Promise<SQLite.SQLiteDatabase> {
  const db = await dbPromise;
  initialized ??= (async () => {
    await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS translations (
        id TEXT PRIMARY KEY NOT NULL, source_text TEXT NOT NULL, translated_text TEXT NOT NULL,
        source_language TEXT NOT NULL, target_language TEXT NOT NULL, provider TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS translations_created ON translations(created_at DESC);
      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY NOT NULL, source_text TEXT NOT NULL, translated_text TEXT NOT NULL,
        source_language TEXT NOT NULL, target_language TEXT NOT NULL, provider TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS collection_items (
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        favorite_id TEXT NOT NULL REFERENCES favorites(id) ON DELETE CASCADE,
        PRIMARY KEY(collection_id, favorite_id)
      );
      CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS translation_cache (
        cache_key TEXT PRIMARY KEY NOT NULL, translated_text TEXT NOT NULL, created_at TEXT NOT NULL
      );
      PRAGMA user_version = 1;
    `);
    await db.runAsync(
      "INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)",
      1,
      new Date().toISOString(),
    );
    await migrateLegacyAsyncStorage(db);
  })();
  await initialized;
  return db;
}

async function migrateLegacyAsyncStorage(
  db: SQLite.SQLiteDatabase,
): Promise<void> {
  const marker = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM preferences WHERE key = 'legacy_asyncstorage_migration_v1'",
  );
  if (marker) return;
  const [historyRaw, cacheRaw] = await Promise.all([
    AsyncStorage.getItem("@quick-translator/history-v1"),
    AsyncStorage.getItem("@quick-translator/cache-v1"),
  ]);
  let legacyHistory: unknown[] = [];
  let legacyCache: Record<string, unknown> = {};
  let historyCanBeRemoved = historyRaw === null;
  try {
    const parsed: unknown = historyRaw ? JSON.parse(historyRaw) : [];
    if (Array.isArray(parsed)) {
      legacyHistory = parsed;
      historyCanBeRemoved = true;
    }
  } catch {
    /* Keep malformed legacy history untouched. */
  }
  try {
    const parsed: unknown = cacheRaw ? JSON.parse(cacheRaw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      legacyCache = parsed as Record<string, unknown>;
  } catch {
    /* Ignore malformed cache without touching history. */
  }
  const legacyRows = legacyHistory.filter(
    (item): item is TranslationHistoryItem =>
      !!item &&
      typeof item === "object" &&
      "id" in item &&
      typeof item.id === "string" &&
      "sourceText" in item &&
      typeof item.sourceText === "string" &&
      "translatedText" in item &&
      typeof item.translatedText === "string" &&
      "sourceLanguage" in item &&
      typeof item.sourceLanguage === "string" &&
      "targetLanguage" in item &&
      typeof item.targetLanguage === "string" &&
      "createdAt" in item &&
      typeof item.createdAt === "string",
  );
  historyCanBeRemoved =
    historyCanBeRemoved && legacyRows.length === legacyHistory.length;
  await db.withTransactionAsync(async () => {
    for (const item of legacyRows)
      await db.runAsync(
        "INSERT OR IGNORE INTO translations VALUES (?, ?, ?, ?, ?, ?, ?)",
        item.id,
        item.sourceText,
        item.translatedText,
        item.sourceLanguage,
        item.targetLanguage,
        "LibreTranslate (legado)",
        item.createdAt,
      );
    for (const [key, value] of Object.entries(legacyCache).slice(-500))
      if (typeof value === "string" && key.length <= 2000)
        await db.runAsync(
          "INSERT OR IGNORE INTO translation_cache VALUES (?, ?, ?)",
          key,
          value,
          new Date().toISOString(),
        );
    await db.runAsync(
      "INSERT INTO preferences VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      "legacy_asyncstorage_migration_v1",
      "done",
    );
  });
  if (historyCanBeRemoved)
    await AsyncStorage.removeItem("@quick-translator/history-v1");
  await AsyncStorage.removeItem("@quick-translator/cache-v1");
}
type Row = {
  id: string;
  source_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  provider: string;
  created_at: string;
};
function fromRow(row: Row): TranslationHistoryItem {
  return {
    id: row.id,
    sourceText: row.source_text,
    translatedText: row.translated_text,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    provider: row.provider,
    createdAt: row.created_at,
  };
}
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
function cacheKey(text: string, source: string, target: string): string {
  return `${source}:${target}:${normalizeText(text)}`;
}

export async function saveHistoryItem(
  item: TranslationHistoryItem,
  limit = 100,
): Promise<TranslationHistoryItem[]> {
  const db = await database();
  await db.withTransactionAsync(async () => {
    const existing = await db.getAllAsync<{
      id: string;
      source_text: string;
      source_language: string;
      target_language: string;
    }>(
      "SELECT id, source_text, source_language, target_language FROM translations",
    );
    for (const entry of existing) {
      if (
        entry.source_language === item.sourceLanguage &&
        entry.target_language === item.targetLanguage &&
        normalizeText(entry.source_text) === normalizeText(item.sourceText)
      ) {
        await db.runAsync("DELETE FROM translations WHERE id = ?", entry.id);
      }
    }
    await db.runAsync(
      "INSERT OR REPLACE INTO translations VALUES (?, ?, ?, ?, ?, ?, ?)",
      item.id,
      item.sourceText,
      item.translatedText,
      item.sourceLanguage,
      item.targetLanguage,
      item.provider,
      item.createdAt,
    );
    await db.runAsync(
      "DELETE FROM translations WHERE id NOT IN (SELECT id FROM translations ORDER BY created_at DESC LIMIT ?)",
      limit,
    );
  });
  return getHistory();
}
export async function getHistory(
  query = "",
): Promise<TranslationHistoryItem[]> {
  const db = await database();
  const pattern = `%${query.trim()}%`;
  const rows = await db.getAllAsync<Row>(
    "SELECT * FROM translations WHERE source_text LIKE ? OR translated_text LIKE ? ORDER BY created_at DESC",
    pattern,
    pattern,
  );
  return rows.map(fromRow);
}
export async function clearHistory(): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM translations");
}
export async function deleteHistoryItem(id: string): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM translations WHERE id = ?", id);
}
export async function getCachedTranslation(
  text: string,
  source: string,
  target: string,
): Promise<string | null> {
  const db = await database();
  return (
    (
      await db.getFirstAsync<{ translated_text: string }>(
        "SELECT translated_text FROM translation_cache WHERE cache_key = ?",
        cacheKey(text, source, target),
      )
    )?.translated_text ?? null
  );
}
export async function saveCachedTranslation(
  text: string,
  source: string,
  target: string,
  translatedText: string,
): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT OR REPLACE INTO translation_cache VALUES (?, ?, ?)",
    cacheKey(text, source, target),
    translatedText,
    new Date().toISOString(),
  );
  await db.runAsync(
    "DELETE FROM translation_cache WHERE cache_key NOT IN (SELECT cache_key FROM translation_cache ORDER BY created_at DESC LIMIT 500)",
  );
}
export async function clearTranslationCache(): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM translation_cache");
}
export async function getFavorites(
  query = "",
): Promise<TranslationHistoryItem[]> {
  const db = await database();
  const pattern = `%${query.trim()}%`;
  return (
    await db.getAllAsync<Row>(
      "SELECT * FROM favorites WHERE source_text LIKE ? OR translated_text LIKE ? ORDER BY created_at DESC",
      pattern,
      pattern,
    )
  ).map(fromRow);
}
export async function isFavorite(id: string): Promise<boolean> {
  const db = await database();
  return (
    (await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM favorites WHERE id = ?",
      id,
    )) !== null
  );
}
export async function toggleFavorite(
  item: TranslationHistoryItem,
): Promise<boolean> {
  const db = await database();
  if (await isFavorite(item.id)) {
    await db.runAsync("DELETE FROM favorites WHERE id = ?", item.id);
    return false;
  }
  await db.runAsync(
    "INSERT INTO favorites VALUES (?, ?, ?, ?, ?, ?, ?)",
    item.id,
    item.sourceText,
    item.translatedText,
    item.sourceLanguage,
    item.targetLanguage,
    item.provider,
    item.createdAt,
  );
  return true;
}
export async function createCollection(name: string): Promise<void> {
  const db = await database();
  const now = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO collections VALUES (?, ?, ?, ?)",
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name.trim(),
    now,
    now,
  );
}
export async function renameCollection(
  id: string,
  name: string,
): Promise<void> {
  const db = await database();
  await db.runAsync(
    "UPDATE collections SET name = ?, updated_at = ? WHERE id = ?",
    name.trim(),
    new Date().toISOString(),
    id,
  );
}
export async function getCollections(): Promise<
  { id: string; name: string }[]
> {
  const db = await database();
  return db.getAllAsync(
    "SELECT id, name FROM collections ORDER BY name COLLATE NOCASE",
  );
}
export async function removeCollection(id: string): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM collections WHERE id = ?", id);
}
export async function addFavoriteToCollection(
  collectionId: string,
  favoriteId: string,
): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT OR IGNORE INTO collection_items VALUES (?, ?)",
    collectionId,
    favoriteId,
  );
}
export async function getCollectionItems(
  collectionId: string,
): Promise<TranslationHistoryItem[]> {
  const db = await database();
  return (
    await db.getAllAsync<Row>(
      "SELECT f.* FROM favorites f INNER JOIN collection_items i ON i.favorite_id=f.id WHERE i.collection_id=? ORDER BY f.created_at DESC",
      collectionId,
    )
  ).map(fromRow);
}
export async function setPreference(key: string, value: string): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO preferences VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    key,
    value,
  );
}
export async function getPreference(key: string): Promise<string | null> {
  const db = await database();
  return (
    (
      await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM preferences WHERE key = ?",
        key,
      )
    )?.value ?? null
  );
}
export async function exportData(): Promise<string> {
  const db = await database();
  const [history, favorites, collections, collectionItems, preferences] =
    await Promise.all([
      getHistory(),
      getFavorites(),
      db.getAllAsync("SELECT * FROM collections"),
      db.getAllAsync("SELECT * FROM collection_items"),
      db.getAllAsync("SELECT * FROM preferences"),
    ]);
  return JSON.stringify(
    {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      history,
      favorites,
      collections,
      collectionItems,
      preferences,
    },
    null,
    2,
  );
}
export async function importData(
  json: string,
  replace: boolean,
): Promise<{ history: number; favorites: number }> {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("O arquivo não contém JSON válido.");
  }
  if (
    !data ||
    typeof data !== "object" ||
    !("schemaVersion" in data) ||
    data.schemaVersion !== 1 ||
    !("history" in data) ||
    !("favorites" in data) ||
    !Array.isArray(data.history) ||
    !Array.isArray(data.favorites) ||
    data.history.length > 1000 ||
    data.favorites.length > 1000
  )
    throw new Error(
      "O formato do arquivo ou a quantidade de itens é inválida.",
    );
  const historyItems: unknown[] = data.history;
  const favoriteItems: unknown[] = data.favorites;
  const dataRecord = data as Record<string, unknown>;
  const optionalArray = (key: string): unknown[] =>
    Array.isArray(dataRecord[key]) ? dataRecord[key] : [];
  const collectionRows = optionalArray("collections");
  const collectionLinks = optionalArray("collectionItems");
  const preferenceRows = optionalArray("preferences");
  if (
    collectionRows.length > 100 ||
    collectionLinks.length > 1000 ||
    preferenceRows.length > 100
  )
    throw new Error("O arquivo tem dados demais para importar.");
  const valid = (entry: unknown): entry is TranslationHistoryItem =>
    !!entry &&
    typeof entry === "object" &&
    "id" in entry &&
    typeof entry.id === "string" &&
    "sourceText" in entry &&
    typeof entry.sourceText === "string" &&
    entry.sourceText.length <= 10000 &&
    "translatedText" in entry &&
    typeof entry.translatedText === "string" &&
    entry.translatedText.length <= 10000 &&
    "sourceLanguage" in entry &&
    typeof entry.sourceLanguage === "string" &&
    "targetLanguage" in entry &&
    typeof entry.targetLanguage === "string" &&
    "provider" in entry &&
    typeof entry.provider === "string" &&
    "createdAt" in entry &&
    typeof entry.createdAt === "string";
  if (!historyItems.every(valid) || !favoriteItems.every(valid))
    throw new Error(
      "Há traduções com dados inválidos. Nenhum dado foi importado.",
    );
  const db = await database();
  await db.withTransactionAsync(async () => {
    if (replace) {
      await db.execAsync(
        "DELETE FROM translations; DELETE FROM favorites; DELETE FROM collections; DELETE FROM preferences;",
      );
    }
    for (const item of historyItems as TranslationHistoryItem[])
      await db.runAsync(
        "INSERT OR REPLACE INTO translations VALUES (?, ?, ?, ?, ?, ?, ?)",
        item.id,
        item.sourceText,
        item.translatedText,
        item.sourceLanguage,
        item.targetLanguage,
        item.provider,
        item.createdAt,
      );
    for (const item of favoriteItems as TranslationHistoryItem[])
      await db.runAsync(
        "INSERT OR REPLACE INTO favorites VALUES (?, ?, ?, ?, ?, ?, ?)",
        item.id,
        item.sourceText,
        item.translatedText,
        item.sourceLanguage,
        item.targetLanguage,
        item.provider,
        item.createdAt,
      );
    for (const row of collectionRows) {
      if (
        !row ||
        typeof row !== "object" ||
        !("id" in row) ||
        typeof row.id !== "string" ||
        !("name" in row) ||
        typeof row.name !== "string" ||
        row.name.length > 40 ||
        !("created_at" in row) ||
        typeof row.created_at !== "string" ||
        !("updated_at" in row) ||
        typeof row.updated_at !== "string"
      )
        throw new Error("Uma coleção contém dados inválidos.");
      await db.runAsync(
        "INSERT OR IGNORE INTO collections VALUES (?, ?, ?, ?)",
        row.id,
        row.name,
        row.created_at,
        row.updated_at,
      );
    }
    for (const row of collectionLinks) {
      if (
        !row ||
        typeof row !== "object" ||
        !("collection_id" in row) ||
        typeof row.collection_id !== "string" ||
        !("favorite_id" in row) ||
        typeof row.favorite_id !== "string"
      )
        throw new Error("Uma coleção contém associações inválidas.");
      await db.runAsync(
        "INSERT OR IGNORE INTO collection_items VALUES (?, ?)",
        row.collection_id,
        row.favorite_id,
      );
    }
    for (const row of preferenceRows) {
      if (
        !row ||
        typeof row !== "object" ||
        !("key" in row) ||
        typeof row.key !== "string" ||
        row.key.length > 100 ||
        !("value" in row) ||
        typeof row.value !== "string" ||
        row.value.length > 500
      )
        throw new Error("Uma preferência contém dados inválidos.");
      await db.runAsync(
        "INSERT OR REPLACE INTO preferences VALUES (?, ?)",
        row.key,
        row.value,
      );
    }
  });
  return { history: historyItems.length, favorites: favoriteItems.length };
}

export type { LanguageCode };
