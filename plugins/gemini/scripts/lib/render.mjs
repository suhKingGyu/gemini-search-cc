/**
 * Output rendering utilities for Gemini search/research results.
 */

/**
 * Format a grounding report as Markdown.
 * @param {object} report
 * @param {string} report.query - Original query
 * @param {string} report.output - Raw Gemini output
 * @param {'search'|'research'|'audit'|'factcheck'|'changelog'|'compare'} report.mode
 * @param {object} [report.stats]
 * @returns {string}
 */
export function renderReport(report) {
  const { query, output, mode, stats } = report;

  const modeLabel = {
    search: 'Grounded Search',
    research: 'Deep Research',
    audit: 'Security Audit',
    factcheck: 'Fact Check',
    changelog: 'Changelog',
    compare: 'Comparison',
  }[mode] || 'Search';

  const lines = [
    `## Gemini ${modeLabel} Results`,
    '',
    `**Query:** ${query}`,
    '',
    '---',
    '',
    output,
    '',
    '---',
    `*Powered by Gemini CLI \u00b7 google_web_search*`,
  ];

  if (stats) {
    lines.push(
      '',
      '<details>',
      '<summary>Stats</summary>',
      '',
      '```json',
      JSON.stringify(stats, null, 2),
      '```',
      '</details>',
    );
  }

  return lines.join('\n');
}

/**
 * Format an error message for display.
 * @param {string} error
 * @param {object} [context]
 * @returns {string}
 */
export function renderError(error, context = {}) {
  const lines = ['## Gemini Search Error', '', `**Error:** ${error}`];

  if (context.exitCode) {
    lines.push(`**Exit Code:** ${context.exitCode}`);
  }
  if (context.suggestion) {
    lines.push('', `**Suggestion:** ${context.suggestion}`);
  }

  return lines.join('\n');
}

/**
 * Format a health check result for display.
 * @param {{ installed: boolean, version: string|null, loggedIn: boolean }} status
 * @returns {string}
 */
export function renderHealthCheck(status) {
  const lines = ['## Gemini CLI Status', ''];

  if (!status.installed) {
    lines.push(
      '| Item | Status |',
      '|------|--------|',
      '| Installed | No |',
      '',
      'Gemini CLI is not installed. Install it:',
      '```bash',
      'npm install -g @google/gemini-cli',
      '# or see https://github.com/google/gemini-cli',
      '```',
    );
    return lines.join('\n');
  }

  lines.push(
    '| Item | Status |',
    '|------|--------|',
    `| Installed | Yes |`,
    `| Version | ${status.version || 'unknown'} |`,
    `| Logged In | ${status.loggedIn ? 'Yes' : 'No'} |`,
  );

  if (!status.loggedIn) {
    lines.push(
      '',
      'Run `gemini login` to authenticate.',
    );
  }

  return lines.join('\n');
}
