/**
 * Workspace resolution utilities.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Resolve the workspace root directory.
 * Prefers git root, falls back to cwd.
 * @returns {string}
 */
export function resolveWorkspaceRoot() {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (gitRoot && existsSync(gitRoot)) return gitRoot;
  } catch {
    // not a git repo
  }
  return process.cwd();
}

/**
 * Get a summary of the workspace context for enriching search queries.
 * @returns {object}
 */
export function getWorkspaceContext() {
  const root = resolveWorkspaceRoot();
  const context = { root, ecosystems: [] };

  const checks = [
    { file: 'package.json', eco: 'JavaScript/TypeScript' },
    { file: 'requirements.txt', eco: 'Python' },
    { file: 'pyproject.toml', eco: 'Python' },
    { file: 'Cargo.toml', eco: 'Rust' },
    { file: 'go.mod', eco: 'Go' },
    { file: 'pom.xml', eco: 'Java' },
    { file: 'build.gradle', eco: 'Java' },
    { file: 'Gemfile', eco: 'Ruby' },
    { file: 'composer.json', eco: 'PHP' },
    { file: 'pubspec.yaml', eco: 'Flutter/Dart' },
  ];

  for (const { file, eco } of checks) {
    if (existsSync(resolve(root, file))) {
      context.ecosystems.push(eco);
    }
  }

  return context;
}
