import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TranslationHistoryItem } from "../../types/translation";

const KEY = "@quick-translator/favorites-v1";

export async function getFavorites(): Promise<TranslationHistoryItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Dados de favoritos inválidos.");
  return parsed.filter(
    (item): item is TranslationHistoryItem =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.sourceText === "string" &&
      typeof item.translatedText === "string" &&
      typeof item.sourceLanguage === "string" &&
      typeof item.targetLanguage === "string",
  );
}

export async function toggleFavorite(
  item: TranslationHistoryItem,
): Promise<TranslationHistoryItem[]> {
  const current = await getFavorites();
  const exists = current.some((favorite) => favorite.id === item.id);
  const updated = exists
    ? current.filter((favorite) => favorite.id !== item.id)
    : [item, ...current];
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
