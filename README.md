# Gemini Search for Claude Code (gemini-search-cc)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Bring Gemini's **grounded Google Search** capabilities directly into [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview). This plugin turns Claude Code into a search-augmented coding assistant — bridging Claude's knowledge cutoff with real-time, cited web information.

---

## Features

### Skills (Slash Commands)

| Command | Description |
|---------|-------------|
| `/gemini:search <query>` | Quick grounded Google Search with citations |
| `/gemini:research <topic>` | Deep multi-step research with cross-referenced sources |
| `/gemini:audit <package>` | Security & dependency audit (CVEs, deprecations, breaking changes) |
| `/gemini:fact-check <claim>` | Verify technical claims against real-time sources |
| `/gemini:changelog <package>` | Latest release notes, breaking changes, migration guides |
| `/gemini:compare <a> vs <b>` | Head-to-head technology comparison with live data |
| `/gemini:setup` | Check Gemini CLI installation and auth status |

### Subagent

- **`gemini:researcher`** — A dedicated research agent that performs iterative searches, synthesizes findings into structured Grounding Reports, and provides strategic advice (Proceed / Update / Pivot / Investigate).

### Auto-Search Guard (Hooks)

Automatically intercepts package manager commands (`npm install`, `pip install`, `cargo add`, etc.) and suggests running a `/gemini:audit` before proceeding.

### Session Lifecycle

The plugin checks Gemini CLI availability at session start. Run `/gemini:setup` to verify authentication.

---

## Repository Structure

```
gemini-search-cc/
├── .claude-plugin/
│   └── marketplace.json             # Marketplace definition
├── plugins/
│   └── gemini/                      # Plugin root
│       ├── .claude-plugin/
│       │   └── plugin.json          # Plugin manifest
│       ├── skills/
│       │   ├── search/SKILL.md
│       │   ├── research/SKILL.md
│       │   ├── audit/SKILL.md
│       │   ├── fact-check/SKILL.md
│       │   ├── changelog/SKILL.md
│       │   ├── compare/SKILL.md
│       │   ├── setup/SKILL.md
│       │   ├── search-result-handling/SKILL.md
│       │   └── gemini-prompting/SKILL.md
│       ├── agents/
│       │   └── researcher.md
│       ├── hooks/
│       │   ├── hooks.json
│       │   └── guard-filter.mjs
│       ├── scripts/
│       │   ├── gemini-companion.mjs
│       │   ├── session-lifecycle-hook.mjs
│       │   └── lib/
│       │       ├── gemini.mjs
│       │       ├── render.mjs
│       │       └── workspace.mjs
│       └── settings.json
├── tests/
│   ├── parse.test.mjs
│   ├── render.test.mjs
│   ├── guard.test.mjs
│   └── companion.test.mjs
├── package.json
├── LICENSE
└── NOTICE
```

## Prerequisites

> **Platform**: macOS and Linux. Windows is not officially supported by Gemini CLI.

1. **Claude Code** — The `claude` CLI ([docs](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview))
2. **Gemini CLI** — Must be installed and authenticated ([github.com/google/gemini-cli](https://github.com/google/gemini-cli))
3. **Node.js** >= 18.0.0

```bash
# Install Gemini CLI
npm install -g @google/gemini-cli

# Authenticate
gemini login
```

## Installation

### Via Marketplace (recommended)

Inside Claude Code, run these slash commands:

```
/plugin marketplace add suhKingGyu/gemini-search-cc
/plugin install gemini@gemini-search
```

### Via --plugin-dir (development)

```bash
claude --plugin-dir ./plugins/gemini
```

## Usage

### Quick Search
```
/gemini:search "What are the latest breaking changes in React 19?"
```

### Deep Research
```
/gemini:research "Compare Bun vs Deno vs Node.js performance benchmarks 2026"
```

### Fact-Check
```
/gemini:fact-check "React 19 removed forwardRef"
```

### Changelog
```
/gemini:changelog "next@15"
```

### Compare
```
/gemini:compare "Bun vs Deno"
```

### Security Audit
```
/gemini:audit "lodash 4.17.21"
```

### Setup Check
```
/gemini:setup
```

The **Auto-Search Guard** activates automatically when you run package install commands:
```
> npm install some-package
# [Gemini JavaScript/TypeScript Guard] suggests running /gemini:audit first
```

---

## Development

```bash
# Lint all scripts
npm run lint

# Run unit tests (no auth required)
npm test

# Run integration tests (requires Gemini CLI auth)
npm run test:integration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details.

## Notice

This is an unofficial plugin and is not affiliated with Anthropic or Google. It requires the Gemini CLI to be configured on your machine.
