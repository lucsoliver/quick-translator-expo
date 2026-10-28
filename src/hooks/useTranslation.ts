import { useCallback, useEffect, useRef, useState } from 'react';
import { clearHistory as clearStoredHistory, clearTranslationCache, getCachedTranslation, getHistory, saveCachedTranslation, saveHistoryItem } from '../services/storage/translationStore';
import type { LanguageCode, TranslationHistoryItem } from '../types/translation';
import { MyMemoryProvider } from '../services/translation/MyMemoryProvider';

const provider = new MyMemoryProvider();
function stableTranslationId(text: string, source: string, target: string): string {
  const normalized = text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return `${source}:${target}:${encodeURIComponent(normalized)}`;
}
export function useTranslation() {
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState<TranslationHistoryItem | null>(null);
  const lock = useRef(false);
  useEffect(() => { void getHistory().then(setHistory).catch(() => setError('Não foi possível carregar o histórico salvo.')); }, []);

  const translate = useCallback(async (text: string, source: LanguageCode, target: LanguageCode): Promise<TranslationHistoryItem | null> => {
    const cleanText = text.trim();
    if (!cleanText) { setError('Digite um texto para traduzir.'); return null; }
    if (lock.current) return null;
    lock.current = true; setError(null); setIsLoading(true);
    let translatedText: string;
    try {
      try { translatedText = (await getCachedTranslation(cleanText, source, target)) ?? ''; } catch { translatedText = ''; }
      if (!translatedText) {
        translatedText = await provider.translate(cleanText, source, target);
        try { await saveCachedTranslation(cleanText, source, target, translatedText); } catch { /* A translation remains usable if cache storage fails. */ }
      }
      const item: TranslationHistoryItem = { id: stableTranslationId(cleanText, source, target), sourceLanguage: source, targetLanguage: target, sourceText: cleanText, translatedText, provider: 'MyMemory', createdAt: new Date().toISOString() };
      try { const next = await saveHistoryItem(item); setHistory(next); setUnsaved(null); } catch { setHistory((current) => [item, ...current].slice(0, 100)); setUnsaved(item); setError('Tradução concluída, mas não foi possível salvar no histórico. Você pode tentar salvar novamente.'); }
      return item;
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Ocorreu um erro inesperado. Tente novamente.'); return null; }
    finally { lock.current = false; setIsLoading(false); }
  }, []);
  const refreshHistory = useCallback(async (query = '') => setHistory(await getHistory(query)), []);
  const retrySave = useCallback(async () => {
    if (!unsaved) return;
    try { setHistory(await saveHistoryItem(unsaved)); setUnsaved(null); setError(null); }
    catch { setError('Ainda não foi possível salvar no histórico. Tente novamente mais tarde.'); }
  }, [unsaved]);
  const clearHistory = useCallback(async () => { await clearStoredHistory(); setHistory([]); }, []);
  const clearCache = useCallback(() => clearTranslationCache(), []);
  return { translate, history, isLoading, error, unsaved, retrySave, clearError: () => setError(null), clearHistory, clearCache, refreshHistory };
}
