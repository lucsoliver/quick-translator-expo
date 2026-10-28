import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { MyMemoryProvider } from '../src/services/translation/MyMemoryProvider';
import { TranslationError } from '../src/types/translation';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('sends only text and language pair and parses the documented response', async () => {
  let requestedUrl = '';
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ responseStatus: 200, responseData: { translatedText: 'Hello there' } }), { status: 200 });
  };
  assert.equal(await new MyMemoryProvider().translate(' Olá ', 'pt', 'en'), 'Hello there');
  const url = new URL(requestedUrl);
  assert.equal(url.pathname, '/get');
  assert.equal(url.searchParams.get('q'), 'Olá');
  assert.equal(url.searchParams.get('langpair'), 'pt|en');
  assert.equal(url.searchParams.has('de'), false);
});

test('rejects blank, oversized, identical, and unsupported language requests', async () => {
  const provider = new MyMemoryProvider();
  await assert.rejects(provider.translate('  ', 'pt', 'en'), (error: unknown) => error instanceof TranslationError && error.code === 'INVALID_INPUT');
  await assert.rejects(provider.translate('😀'.repeat(126), 'pt', 'en'), (error: unknown) => error instanceof TranslationError && error.code === 'INVALID_INPUT');
  await assert.rejects(provider.translate('hello', 'pt', 'pt'), (error: unknown) => error instanceof TranslationError && error.code === 'UNSUPPORTED_LANGUAGE');
  await assert.rejects(provider.translate('hello', 'unsupported', 'en'), (error: unknown) => error instanceof TranslationError && error.code === 'UNSUPPORTED_LANGUAGE');
});

test('normalizes rate limits and malformed responses', async () => {
  globalThis.fetch = async () => new Response('', { status: 429 });
  await assert.rejects(new MyMemoryProvider().translate('hello', 'en', 'pt'), (error: unknown) => error instanceof TranslationError && error.code === 'RATE_LIMITED');
  globalThis.fetch = async () => new Response(JSON.stringify({ responseStatus: 403, quotaFinished: true, responseDetails: 'Quota finished' }), { status: 200 });
  await assert.rejects(new MyMemoryProvider().translate('hello', 'en', 'pt'), (error: unknown) => error instanceof TranslationError && error.code === 'RATE_LIMITED');
  globalThis.fetch = async () => new Response(JSON.stringify({ responseStatus: 200, responseData: {} }), { status: 200 });
  await assert.rejects(new MyMemoryProvider().translate('hello', 'en', 'pt'), (error: unknown) => error instanceof TranslationError && error.code === 'INVALID_PROVIDER_RESPONSE');
});

test('normalizes network failures', async () => {
  globalThis.fetch = async () => { throw new Error('network'); };
  await assert.rejects(new MyMemoryProvider().translate('hello', 'en', 'pt'), (error: unknown) => error instanceof TranslationError && error.code === 'NETWORK_ERROR');
});
