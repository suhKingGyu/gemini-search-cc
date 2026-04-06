---
description: Check Gemini CLI installation and authentication status.
argument-hint: ''
disable-model-invocation: true
allowed-tools: Bash AskUserQuestion
---
Check whether the Gemini CLI is installed and properly configured.

## Steps

1. Run the health check in JSON mode:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" setup --json
   ```

2. Parse the JSON output to determine status:
   - `installed`: whether Gemini CLI binary exists on PATH
   - `version`: the installed version string
   - `loggedIn`: whether a minimal headless probe succeeds (verifies active auth, not just file existence)

3. **If Gemini CLI is NOT installed:**
   - Check if npm is available: `which npm`
   - If npm is available, use `AskUserQuestion` to ask:
     > Gemini CLI is not installed. Would you like to install it now?
     > - Install via npm (Recommended)
     > - Show manual installation instructions
   - If user chooses install: run `npm install -g @google/gemini-cli`
   - After install, re-run the health check to confirm.
   - If npm is not available, show manual install instructions:
     - Visit https://github.com/google/gemini-cli
     - Or install Node.js first, then `npm install -g @google/gemini-cli`

4. **If Gemini CLI is installed but NOT logged in:**
   - Instruct the user to run `gemini login` in their terminal.
   - Explain: authentication is required for Google Search to work.

5. **If everything is healthy**, confirm all available skills:
   - `/gemini:search` — Quick grounded Google Search
   - `/gemini:research` — Deep multi-step research (5 min timeout)
   - `/gemini:audit` — Security & dependency audit
   - `/gemini:fact-check` — Verify technical claims
   - `/gemini:changelog` — Latest release notes for a package
   - `/gemini:compare` — Compare technologies with real-time data

6. Run the human-readable health check for display:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" setup
   ```
