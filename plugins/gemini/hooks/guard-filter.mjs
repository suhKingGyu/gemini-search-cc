import fs from 'node:fs';

// Read stdin from Claude Code hook system
const input = JSON.parse(fs.readFileSync(0, 'utf-8'));
const command = (input.tool_input?.command || '').trim();
const commandLower = command.toLowerCase();

// Only intercept package install/add commands where audit is genuinely useful.
// Excludes infrastructure tools (docker, terraform, kubectl), scaffolding (npx, create),
// and niche ecosystems to avoid alert fatigue.
const ecosystems = [
  { name: 'JavaScript/TypeScript', managers: ['npm', 'yarn', 'pnpm', 'bun'], keywords: ['install', 'add', 'update', 'upgrade'] },
  { name: 'Python', managers: ['pip', 'pip3', 'poetry', 'uv', 'conda', 'pipenv', 'pdm'], keywords: ['install', 'add', 'update', 'upgrade'] },
  { name: 'Rust', managers: ['cargo'], keywords: ['add', 'install'] },
  { name: 'Go', managers: ['go'], keywords: ['get', 'install'] },
  { name: 'PHP', managers: ['composer'], keywords: ['require', 'install', 'update'] },
  { name: 'Ruby', managers: ['gem', 'bundle', 'bundler'], keywords: ['install', 'add', 'update'] },
  { name: 'System', managers: ['brew', 'apt', 'apt-get'], keywords: ['install'] },
];

let detected = null;

for (const eco of ecosystems) {
  const matchesManager = eco.managers.some(
    (m) => commandLower.startsWith(m + ' ') || commandLower === m,
  );
  if (!matchesManager) continue;

  const matchesKeyword = eco.keywords.some((k) => commandLower.includes(k));
  if (!matchesKeyword) continue;

  detected = eco.name;
  break;
}

if (detected) {
  // Extract the likely package name(s) from the command for a more targeted suggestion
  const parts = command.split(/\s+/);
  const filtered = parts.filter(
    (p) => !p.startsWith('-') && !p.startsWith('/') && p.length > 1,
  );
  const packages = filtered.slice(2).join(', ') || '(packages in command)';

  console.log(
    JSON.stringify({
      type: 'prompt',
      prompt:
        `[Gemini ${detected} Guard] About to run: \`${command}\`\n` +
        `Consider running \`/gemini:audit ${packages}\` to check for known vulnerabilities, ` +
        `deprecated patterns, or breaking changes before proceeding.`,
    }),
  );
} else {
  // No match — allow the command to proceed without prompt
  console.log(JSON.stringify({}));
}
