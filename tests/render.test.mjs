import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport, renderError, renderHealthCheck } from '../plugins/gemini/scripts/lib/render.mjs';

describe('renderReport', () => {
  it('renders search mode with correct header', () => {
    const out = renderReport({ query: 'test', output: 'result', mode: 'search' });
    assert.match(out, /## Gemini Grounded Search Results/);
    assert.match(out, /\*\*Query:\*\* test/);
    assert.match(out, /result/);
    assert.match(out, /Powered by Gemini CLI/);
  });

  it('renders all mode labels correctly', () => {
    const modes = {
      search: 'Grounded Search',
      research: 'Deep Research',
      audit: 'Security Audit',
      factcheck: 'Fact Check',
      changelog: 'Changelog',
      compare: 'Comparison',
    };
    for (const [mode, label] of Object.entries(modes)) {
      const out = renderReport({ query: 'q', output: 'o', mode });
      assert.match(out, new RegExp(`Gemini ${label} Results`), `mode "${mode}" should produce label "${label}"`);
    }
  });

  it('includes stats when provided', () => {
    const out = renderReport({
      query: 'q', output: 'o', mode: 'search',
      stats: { tokens: 42 },
    });
    assert.match(out, /<details>/);
    assert.match(out, /<summary>Stats<\/summary>/);
    assert.match(out, /"tokens": 42/);
  });

  it('omits stats section when stats is null', () => {
    const out = renderReport({ query: 'q', output: 'o', mode: 'search', stats: null });
    assert.ok(!out.includes('<details>'));
  });

  it('omits stats section when stats is undefined', () => {
    const out = renderReport({ query: 'q', output: 'o', mode: 'search' });
    assert.ok(!out.includes('<details>'));
  });
});

describe('renderError', () => {
  it('renders error message', () => {
    const out = renderError('something broke');
    assert.match(out, /## Gemini Search Error/);
    assert.match(out, /\*\*Error:\*\* something broke/);
  });

  it('includes exit code when provided', () => {
    const out = renderError('fail', { exitCode: 42 });
    assert.match(out, /\*\*Exit Code:\*\* 42/);
  });

  it('includes suggestion when provided', () => {
    const out = renderError('fail', { suggestion: 'try again' });
    assert.match(out, /\*\*Suggestion:\*\* try again/);
  });

  it('omits exit code when not provided', () => {
    const out = renderError('fail', {});
    assert.ok(!out.includes('Exit Code'));
  });
});

describe('renderHealthCheck', () => {
  it('renders not-installed state', () => {
    const out = renderHealthCheck({ installed: false, version: null, loggedIn: false });
    assert.match(out, /Installed \| No/);
    assert.match(out, /npm install -g @google\/gemini-cli/);
  });

  it('renders installed and logged-in state', () => {
    const out = renderHealthCheck({ installed: true, version: '0.36.0', loggedIn: true });
    assert.match(out, /Installed \| Yes/);
    assert.match(out, /Version \| 0\.36\.0/);
    assert.match(out, /Logged In \| Yes/);
  });

  it('renders installed but not logged-in state', () => {
    const out = renderHealthCheck({ installed: true, version: '1.0.0', loggedIn: false });
    assert.match(out, /Logged In \| No/);
    assert.match(out, /gemini login/);
  });

  it('handles unknown version', () => {
    const out = renderHealthCheck({ installed: true, version: null, loggedIn: true });
    assert.match(out, /Version \| unknown/);
  });
});
