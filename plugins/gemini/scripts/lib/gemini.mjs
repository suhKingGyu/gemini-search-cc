/**
 * Gemini CLI detection, health check, and execution utilities.
 */

import { execFile, execSync } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Exit-code-specific error messages from Gemini CLI. */
const EXIT_MESSAGES = {
  42: 'Invalid input — check your prompt or update Gemini CLI to the latest version.',
  53: 'Turn limit exceeded. Try a shorter or simpler query.',
};

/** Check if `gemini` CLI is available on PATH. */
export function isGeminiInstalled() {
  try {
    execSync('which gemini', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Get Gemini CLI version string, or null if unavailable. */
export function getGeminiVersion() {
  try {
    return execSync('gemini --version', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Verify Gemini auth is actually valid by running a minimal headless probe.
 * Slower (~15s) but catches expired tokens that file-check misses.
 */
export function isGeminiAuthValid() {
  try {
    execSync('gemini -p "ping" -o json', {
      encoding: 'utf-8',
      timeout: 15_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse Gemini CLI JSON output, extracting response, error, and stats fields.
 * @param {string} str - Raw string that may contain JSON.
 * @returns {{ response: string|null, error: string|null, stats: object|null }}
 */
export function parseGeminiOutput(str) {
  if (!str?.trim()) return { response: null, error: null, stats: null };
  try {
    const parsed = JSON.parse(str.trim());
    // error can be a string or an object per Gemini headless docs
    let error = null;
    if (typeof parsed.error === 'string') {
      error = parsed.error;
    } else if (parsed.error && typeof parsed.error === 'object') {
      error = parsed.error.message || JSON.stringify(parsed.error);
    }
    return {
      response: typeof parsed.response === 'string' ? parsed.response : null,
      error,
      stats: parsed.stats ?? null,
    };
  } catch {
    return { response: null, error: null, stats: null };
  }
}

/**
 * Execute a Gemini grounded search via headless mode (-p flag).
 * Uses --approval-mode=yolo to auto-approve tool calls like Google Search.
 * Uses -o json to get structured output.
 * @param {string} query - The search query.
 * @param {object} [opts]
 * @param {number} [opts.timeout=120000] - Timeout in ms (default 2 min).
 * @param {boolean} [opts.searchHint=true] - Prepend a hint to use Google Search.
 * @returns {Promise<{ok: boolean, output: string, error?: string, exitCode?: number, stats?: object}>}
 */
export async function geminiSearch(query, opts = {}) {
  const { timeout = 120_000, searchHint = true } = opts;

  const prompt = searchHint
    ? `Use Google Search to find up-to-date information. ${query}`
    : query;

  try {
    const { stdout, stderr } = await execFileAsync(
      'gemini',
      ['-p', prompt, '--approval-mode=yolo', '-o', 'json'],
      { timeout, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
    );

    // Gemini writes JSON to stdout; stderr has status messages.
    // Try stdout first, then stderr (some edge cases write JSON to stderr).
    const out = parseGeminiOutput(stdout);
    const outFb = parseGeminiOutput(stderr);
    const response = out.response ?? outFb.response;
    const apiError = out.error ?? outFb.error;
    const stats = out.stats ?? outFb.stats;

    if (apiError && !response) {
      return { ok: false, output: '', error: apiError, stats };
    }
    if (response !== null) {
      // Guard against empty response string (e.g., quota exhaustion returning "")
      if (!response.trim()) {
        return { ok: false, output: '', error: 'Gemini returned an empty response. This may be due to API quota limits — try again shortly.', stats };
      }
      return { ok: true, output: response, stats };
    }

    // No parseable JSON — return whatever raw text we have
    const raw = (stdout || stderr).trim();
    if (raw) return { ok: true, output: raw };
    return { ok: false, output: '', error: 'Gemini returned empty output' };
  } catch (err) {
    if (err.killed) {
      return { ok: false, output: '', error: `Timeout after ${timeout / 1000}s` };
    }

    // Try structured JSON extraction first
    const out = parseGeminiOutput(err.stdout);
    const outFb = parseGeminiOutput(err.stderr);
    const response = out.response ?? outFb.response;
    const apiError = out.error ?? outFb.error;
    const stats = out.stats ?? outFb.stats;

    // If we got a valid response despite non-zero exit, return it
    if (response !== null) {
      return { ok: true, output: response, stats };
    }
    // Use structured API error if available
    if (apiError) {
      return { ok: false, output: '', error: apiError, exitCode: err.code, stats };
    }
    // Map known exit codes to helpful messages
    const exitMsg = EXIT_MESSAGES[err.code];
    if (exitMsg) {
      return { ok: false, output: '', error: exitMsg, exitCode: err.code };
    }

    // Fall back to raw text or generic error
    if (err.stdout?.trim()) {
      return { ok: true, output: err.stdout.trim() };
    }
    return { ok: false, output: '', error: err.stderr || err.message, exitCode: err.code };
  }
}

/**
 * Execute a Gemini deep research query (longer timeout, richer prompt).
 * @param {string} query
 * @param {object} [opts]
 * @param {number} [opts.timeout=300000] - Timeout in ms (default 5 min).
 * @returns {Promise<{ok: boolean, output: string, error?: string, exitCode?: number, stats?: object}>}
 */
export async function geminiResearch(query, opts = {}) {
  const { timeout = 300_000 } = opts;

  const researchPrompt = [
    'You are a deep research assistant. Perform a thorough, multi-step investigation.',
    'Use Google Search multiple times if needed to cross-reference sources.',
    'Provide a comprehensive report with citations.',
    '',
    `Research topic: ${query}`,
  ].join('\n');

  return geminiSearch(researchPrompt, {
    timeout,
    searchHint: false,
  });
}

/**
 * Fact-check a technical claim using grounded Google Search.
 * @param {string} claim - The claim to verify.
 * @param {object} [opts]
 * @param {number} [opts.timeout=120000]
 * @returns {Promise<{ok: boolean, output: string, error?: string, exitCode?: number, stats?: object}>}
 */
export async function geminiFactCheck(claim, opts = {}) {
  const { timeout = 120_000 } = opts;

  const prompt = [
    'You are a technical fact-checker. Verify the following claim using Google Search.',
    'Search for authoritative sources (official docs, GitHub, RFCs, CVE databases).',
    '',
    'Structure your response as:',
    '## Verdict: [Confirmed / Partially True / Misleading / False / Unverifiable]',
    '## Evidence',
    '- List each piece of supporting or contradicting evidence with its source URL',
    '## Correct Information',
    '- If the claim is wrong or misleading, state the accurate information here',
    '',
    `Claim to verify: "${claim}"`,
  ].join('\n');

  return geminiSearch(prompt, { timeout, searchHint: false });
}

/**
 * Get latest changelog and release notes for a package.
 * @param {string} pkg - Package name, optionally with version (e.g., "react@19" or "express").
 * @param {object} [opts]
 * @param {number} [opts.timeout=120000]
 * @returns {Promise<{ok: boolean, output: string, error?: string, exitCode?: number, stats?: object}>}
 */
export async function geminiChangelog(pkg, opts = {}) {
  const { timeout = 120_000 } = opts;

  const prompt = [
    `Search for the latest release notes and changelog for: ${pkg}`,
    '',
    'Search these sources in order of priority:',
    '1. Official GitHub releases page',
    '2. Package registry (npm, PyPI, crates.io, pkg.go.dev)',
    '3. Official documentation or blog announcements',
    '',
    'Structure your response as:',
    '## Latest Version',
    '- Version number and release date',
    '## Highlights',
    '- Key new features or improvements',
    '## Breaking Changes',
    '- Any breaking changes that require migration (or "None" if none)',
    '## Migration Notes',
    '- Steps needed to upgrade from the previous major version',
    '## Links',
    '- Direct URLs to the changelog and release notes',
  ].join('\n');

  return geminiSearch(prompt, { timeout, searchHint: false });
}

/**
 * Compare two technologies with real-time data.
 * @param {string} query - Comparison query (e.g., "Bun vs Deno").
 * @param {object} [opts]
 * @param {number} [opts.timeout=180000]
 * @returns {Promise<{ok: boolean, output: string, error?: string, exitCode?: number, stats?: object}>}
 */
export async function geminiCompare(query, opts = {}) {
  const { timeout = 180_000 } = opts;

  const prompt = [
    `Compare the following technologies using current (2025-2026) data: ${query}`,
    '',
    'Search for recent benchmarks, adoption statistics, and community sentiment.',
    '',
    'Structure your response as:',
    '## Overview',
    '- Brief description of each technology',
    '## Comparison',
    '| Criteria | Option A | Option B |',
    '|----------|----------|----------|',
    '| Performance | ... | ... |',
    '| Ecosystem / Community | ... | ... |',
    '| Learning Curve | ... | ... |',
    '| Production Readiness | ... | ... |',
    '| Active Maintenance | ... | ... |',
    '## Concrete Metrics',
    '- GitHub stars, npm weekly downloads, benchmark numbers (cite sources)',
    '## When to Choose Each',
    '- Specific scenarios where each option excels',
    '## Recommendation',
    '- Context-dependent recommendation with reasoning',
  ].join('\n');

  return geminiSearch(prompt, { timeout, searchHint: false });
}

/**
 * Run a full health check on the Gemini CLI installation.
 * @returns {{ installed: boolean, version: string|null, loggedIn: boolean }}
 */
/**
 * Run a full health check on the Gemini CLI installation.
 * Uses a real headless probe to verify auth (not just file existence).
 * @returns {{ installed: boolean, version: string|null, loggedIn: boolean }}
 */
export function healthCheck() {
  const installed = isGeminiInstalled();
  return {
    installed,
    version: installed ? getGeminiVersion() : null,
    loggedIn: installed ? isGeminiAuthValid() : false,
  };
}
