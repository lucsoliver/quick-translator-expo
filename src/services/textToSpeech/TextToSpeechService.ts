import * as Speech from "expo-speech";
import type { LanguageCode } from "../../types/translation";

const SPEECH_LOCALES: Record<LanguageCode, string> = {
  pt: "pt-BR",
  en: "en-US",
};

export class TextToSpeechService {
  speak(
    text: string,
    language: LanguageCode,
    onDone: () => void,
    onError: () => void,
  ): void {
    Speech.speak(text, {
      language: SPEECH_LOCALES[language],
      onDone,
      onStopped: onDone,
      onError,
    });
  }

  stop(): Promise<void> {
    return Speech.stop();
  }
}
