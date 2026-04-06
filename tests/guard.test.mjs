import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const guardScript = join(__dirname, '..', 'plugins', 'gemini', 'hooks', 'guard-filter.mjs');

function runGuard(command) {
  const input = JSON.stringify({ tool_input: { command } });
  const result = spawnSync('node', [guardScript], {
    input,
    encoding: 'utf-8',
    timeout: 5000,
  });
  return JSON.parse(result.stdout.trim());
}

describe('guard-filter', () => {
  describe('should trigger on package install commands', () => {
    const triggers = [
      ['npm install lodash', 'JavaScript/TypeScript'],
      ['yarn add react', 'JavaScript/TypeScript'],
      ['pnpm add express', 'JavaScript/TypeScript'],
      ['pip install requests', 'Python'],
      ['pip3 install flask', 'Python'],
      ['poetry add django', 'Python'],
      ['cargo add serde', 'Rust'],
      ['go get github.com/gin-gonic/gin', 'Go'],
      ['composer require laravel/framework', 'PHP'],
      ['gem install rails', 'Ruby'],
      ['brew install wget', 'System'],
    ];

    for (const [cmd, eco] of triggers) {
      it(`triggers on: ${cmd}`, () => {
        const out = runGuard(cmd);
        assert.equal(out.type, 'prompt');
        assert.match(out.prompt, new RegExp(`Gemini ${eco} Guard`));
      });
    }
  });

  describe('should NOT trigger on non-package commands', () => {
    const passThrough = [
      'docker build .',
      'kubectl apply -f deploy.yaml',
      'terraform init',
      'aws s3 ls',
      'gcloud compute instances list',
      'git commit -m "test"',
      'ls -la',
      'node server.js',
      'npx create-react-app my-app',
    ];

    for (const cmd of passThrough) {
      it(`passes through: ${cmd}`, () => {
        const out = runGuard(cmd);
        assert.equal(out.type, undefined);
      });
    }
  });

  describe('edge cases', () => {
    it('handles empty command', () => {
      const out = runGuard('');
      assert.equal(out.type, undefined);
    });

    it('handles command with only manager name', () => {
      const out = runGuard('npm');
      assert.equal(out.type, undefined);
    });

    it('npm run does not trigger', () => {
      const out = runGuard('npm run build');
      assert.equal(out.type, undefined);
    });

    it('npm test does not trigger', () => {
      const out = runGuard('npm test');
      assert.equal(out.type, undefined);
    });
  });
});
