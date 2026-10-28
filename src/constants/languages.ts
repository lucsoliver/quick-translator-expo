import type { LanguageOption } from "../types/translation";

// MyMemory documents ISO/RFC 3066 language codes; auto-detection is not used.
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "pt", name: "Português", speechLocale: "pt-BR" },
  { code: "en", name: "English", speechLocale: "en-US" },
  { code: "es", name: "Español", speechLocale: "es-ES" },
  { code: "fr", name: "Français", speechLocale: "fr-FR" },
  { code: "de", name: "Deutsch", speechLocale: "de-DE" },
  { code: "it", name: "Italiano", speechLocale: "it-IT" },
  { code: "nl", name: "Nederlands", speechLocale: "nl-NL" },
  { code: "ru", name: "Русский", speechLocale: "ru-RU" },
  { code: "ja", name: "日本語", speechLocale: "ja-JP" },
  { code: "ko", name: "한국어", speechLocale: "ko-KR" },
  { code: "zh", name: "中文", speechLocale: "zh-CN" },
  { code: "ar", name: "العربية", speechLocale: "ar" },
  { code: "hi", name: "हिन्दी", speechLocale: "hi-IN" },
  { code: "pl", name: "Polski", speechLocale: "pl-PL" },
  { code: "sv", name: "Svenska", speechLocale: "sv-SE" },
  { code: "tr", name: "Türkçe", speechLocale: "tr-TR" },
  { code: "uk", name: "Українська", speechLocale: "uk-UA" },
  { code: "vi", name: "Tiếng Việt", speechLocale: "vi-VN" },
];
export const LANGUAGES = Object.fromEntries(
  LANGUAGE_OPTIONS.map((language) => [language.code, language]),
) as Record<string, LanguageOption>;
export const HISTORY_LIMIT = 100;
export const CACHE_LIMIT = 500;
export const MAX_INPUT_LENGTH = 450;
export const MAX_INPUT_BYTES = 500;
export const languageByCode = (code: string) =>
  LANGUAGE_OPTIONS.find((language) => language.code === code);
