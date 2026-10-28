export type LanguageCode = string;

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  speechLocale: string;
}

export interface TranslationHistoryItem {
  id: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  sourceText: string;
  translatedText: string;
  provider: string;
  createdAt: string;
}

export interface TranslationService {
  translate(
    text: string,
    source: LanguageCode,
    target: LanguageCode,
    signal?: AbortSignal,
  ): Promise<string>;
}

export type TranslationErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "UNSUPPORTED_LANGUAGE"
  | "INVALID_INPUT"
  | "PROVIDER_ERROR"
  | "INVALID_PROVIDER_RESPONSE";

export class TranslationError extends Error {
  constructor(
    readonly code: TranslationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TranslationError";
  }
}
