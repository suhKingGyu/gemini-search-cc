#!/usr/bin/env node

/**
 * Session lifecycle hook for Gemini plugin.
 *
 * SessionStart — verify Gemini CLI availability, export session env vars,
 *                and print a brief status notification.
 * SessionEnd   — placeholder for future cleanup.
 */

import { appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { isGeminiInstalled, getGeminiVersion } from './lib/gemini.mjs';

const event = process.argv[2]; // "SessionStart" or "SessionEnd"

/**
 * Append an environment variable export to CLAUDE_ENV_FILE so it is
 * available to all subsequent tool invocations in this session.
 */
function appendEnvVar(name, value) {
  const envFile = process.env.CLAUDE_ENV_FILE;
  if (!envFile) return;
  const escaped = value.replace(/'/g, "'\\''");
  appendFileSync(envFile, `export ${name}='${escaped}'\n`);
}

if (event === 'SessionStart') {
  // Generate and export a session ID for state tracking
  const sessionId = `gemini-${randomUUID().slice(0, 8)}`;
  appendEnvVar('GEMINI_PLUGIN_SESSION_ID', sessionId);

  // Export plugin data dir if available
  if (process.env.CLAUDE_PLUGIN_DATA) {
    appendEnvVar('GEMINI_PLUGIN_DATA', process.env.CLAUDE_PLUGIN_DATA);
  }

  const installed = isGeminiInstalled();
  if (installed) {
    const version = getGeminiVersion();
    const hasCredentials = existsSync(join(homedir(), '.gemini', 'oauth_creds.json'));
    if (hasCredentials) {
      const skills = [
        'search', 'research', 'audit',
        'fact-check', 'changelog', 'compare',
      ].map(s => `/gemini:${s}`).join(', ');
      const msg = `[Gemini plugin] Ready — Gemini CLI ${version || '(unknown)'} | ${skills}`;
      console.log(JSON.stringify({ type: 'notification', message: msg }));
    } else {
      console.log(JSON.stringify({
        type: 'notification',
        message: `[Gemini plugin] Gemini CLI ${version || '(unknown)'} found but not authenticated. Run \`gemini login\`.`,
      }));
    }
  } else {
    console.log(JSON.stringify({
      type: 'notification',
      message: '[Gemini plugin] Warning: Gemini CLI not found. Run `/gemini:setup` for help.',
    }));
  }
} else if (event === 'SessionEnd') {
  // Placeholder for future cleanup (e.g., temp file removal, session state)
  console.log(JSON.stringify({}));
} else {
  console.log(JSON.stringify({}));
}
