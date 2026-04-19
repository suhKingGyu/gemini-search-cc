# Contributing to Gemini Search for Claude Code

First off, thank you for considering contributing to Gemini Search for Claude Code! It's people like you that make open source such a great community.

## Development Environment Setup

1. **Prerequisites:**
   - Node.js (18, 20, or 22)
   - npm or yarn
   - [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed and authenticated.

2. **Clone the repository:**
   ```bash
   git clone https://github.com/KingGyuSuh/gemini-search-cc.git
   cd gemini-search-cc
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Testing locally:**
   You can test your local changes directly in Claude Code by pointing it to your local directory:
   ```bash
   claude --plugin-dir /path/to/gemini-search-cc/plugins/gemini
   ```

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, if applicable.
3. Add or update unit tests to verify your changes (`npm test`).
4. Ensure your code passes all linting rules (`npm run lint`).
5. Your PR will be reviewed by the maintainers. Once approved, it will be merged.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).
