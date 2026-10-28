import { LANGUAGE_OPTIONS, MAX_INPUT_BYTES } from '../../constants/languages';
import type { LanguageCode, TranslationService } from '../../types/translation';
import { TranslationError } from '../../types/translation';

interface MyMemoryResponse {
  responseStatus?: unknown;
  responseDetails?: unknown;
  quotaFinished?: unknown;
  responseData?: { translatedText?: unknown };
}

export class MyMemoryProvider implements TranslationService {
  async translate(text: string, source: LanguageCode, target: LanguageCode, signal?: AbortSignal): Promise<string> {
    const clean = text.trim();
    const byteLength = encodeURIComponent(clean).replace(/%[\dA-F]{2}/gi, 'x').length;
    if (!clean || byteLength > MAX_INPUT_BYTES) {
      throw new TranslationError('INVALID_INPUT', 'Digite um texto de até 500 bytes para traduzir.');
    }
    if (!LANGUAGE_OPTIONS.some((item) => item.code === source) || !LANGUAGE_OPTIONS.some((item) => item.code === target) || source === target) {
      throw new TranslationError('UNSUPPORTED_LANGUAGE', 'Escolha dois idiomas diferentes da lista disponível.');
    }

    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', clean);
    url.searchParams.set('langpair', `${source}|${target}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const relayAbort = () => controller.abort();
    signal?.addEventListener('abort', relayAbort, { once: true });
    try {
      const response = await fetch(url.toString(), { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (response.status === 429) throw new TranslationError('RATE_LIMITED', 'O limite de uso do serviço foi atingido. Tente novamente mais tarde.');
      if (!response.ok) throw new TranslationError('PROVIDER_ERROR', 'O serviço está indisponível no momento. Tente novamente mais tarde.');
      let payload: MyMemoryResponse;
      try { payload = await response.json() as MyMemoryResponse; }
      catch { throw new TranslationError('INVALID_PROVIDER_RESPONSE', 'O serviço retornou uma resposta inválida.'); }
      if (payload.responseStatus === 429 || payload.quotaFinished === true || (payload.responseStatus === 403 && typeof payload.responseDetails === 'string' && /quota|limit|available free translations/i.test(payload.responseDetails))) {
        throw new TranslationError('RATE_LIMITED', 'O limite de uso do serviço foi atingido. Tente novamente mais tarde.');
      }
      if (typeof payload.responseStatus !== 'number' || payload.responseStatus < 200 || payload.responseStatus >= 300 || typeof payload.responseData?.translatedText !== 'string' || !payload.responseData.translatedText.trim()) {
        throw new TranslationError('INVALID_PROVIDER_RESPONSE', 'Não foi possível obter uma tradução válida para esse texto.');
      }
      return payload.responseData.translatedText.trim();
    } catch (cause) {
      if (cause instanceof TranslationError) throw cause;
      if (controller.signal.aborted) throw new TranslationError('TIMEOUT', 'A solicitação foi cancelada ou excedeu o tempo limite.');
      throw new TranslationError('NETWORK_ERROR', 'Não foi possível conectar ao serviço. Verifique sua internet e tente novamente.');
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', relayAbort);
    }
  }
}
