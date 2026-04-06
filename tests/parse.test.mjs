import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGeminiOutput } from '../plugins/gemini/scripts/lib/gemini.mjs';

describe('parseGeminiOutput', () => {
  it('parses valid JSON with response field', () => {
    const input = JSON.stringify({ response: 'hello world' });
    const result = parseGeminiOutput(input);
    assert.equal(result.response, 'hello world');
    assert.equal(result.error, null);
    assert.equal(result.stats, null);
  });

  it('parses all three fields', () => {
    const input = JSON.stringify({
      response: 'answer',
      error: null,
      stats: { tokens: 100, latency: 5.2 },
    });
    const result = parseGeminiOutput(input);
    assert.equal(result.response, 'answer');
    assert.equal(result.error, null);
    assert.deepEqual(result.stats, { tokens: 100, latency: 5.2 });
  });

  it('extracts string error', () => {
    const input = JSON.stringify({ error: 'quota exceeded' });
    const result = parseGeminiOutput(input);
    assert.equal(result.response, null);
    assert.equal(result.error, 'quota exceeded');
  });

  it('extracts object error with message', () => {
    const input = JSON.stringify({ error: { message: 'rate limited', code: 429 } });
    const result = parseGeminiOutput(input);
    assert.equal(result.error, 'rate limited');
  });

  it('stringifies object error without message', () => {
    const input = JSON.stringify({ error: { code: 500, detail: 'internal' } });
    const result = parseGeminiOutput(input);
    assert.equal(result.error, '{"code":500,"detail":"internal"}');
  });

  it('returns nulls for empty string', () => {
    const result = parseGeminiOutput('');
    assert.deepEqual(result, { response: null, error: null, stats: null });
  });

  it('returns nulls for null input', () => {
    const result = parseGeminiOutput(null);
    assert.deepEqual(result, { response: null, error: null, stats: null });
  });

  it('returns nulls for undefined input', () => {
    const result = parseGeminiOutput(undefined);
    assert.deepEqual(result, { response: null, error: null, stats: null });
  });

  it('returns nulls for whitespace-only input', () => {
    const result = parseGeminiOutput('   \n  ');
    assert.deepEqual(result, { response: null, error: null, stats: null });
  });

  it('returns nulls for invalid JSON', () => {
    const result = parseGeminiOutput('not json at all');
    assert.deepEqual(result, { response: null, error: null, stats: null });
  });

  it('returns null response for non-string response field', () => {
    const input = JSON.stringify({ response: 123 });
    const result = parseGeminiOutput(input);
    assert.equal(result.response, null);
  });

  it('handles JSON with extra whitespace', () => {
    const input = '  \n  ' + JSON.stringify({ response: 'trimmed' }) + '  \n';
    const result = parseGeminiOutput(input);
    assert.equal(result.response, 'trimmed');
  });

  it('preserves stats as-is', () => {
    const stats = { models: [{ name: 'gemini-3' }], calls: 5 };
    const input = JSON.stringify({ response: 'ok', stats });
    const result = parseGeminiOutput(input);
    assert.deepEqual(result.stats, stats);
  });
});
