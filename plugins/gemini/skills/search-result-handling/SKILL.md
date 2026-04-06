---
description: Internal guidance for presenting Gemini search results to the user.
user-invocable: false
---
# Search Result Handling — Internal Skill

This skill provides guidance on how to handle and present Gemini search results
within the Claude Code conversation.

## Principles

1. **Verbatim first.** Always present the raw Gemini output before any analysis.
   The user should see exactly what Gemini returned.

2. **Do not paraphrase search results.** If Gemini says "React 19.1.0 was released
   on March 2026", do not rephrase it as "a recent version of React was released."

3. **Cite what Gemini cited.** If the search output includes URLs or source names,
   preserve them. Do not invent additional citations.

4. **Additive analysis only.** After showing raw results, you may add:
   - A brief summary of key points (3 bullets max)
   - Relevance to the user's current task
   - Suggested follow-up actions

5. **Severity ordering.** When multiple findings exist, present them in order:
   Critical > High > Medium > Low > Informational

6. **Never auto-fix.** Search results may suggest updates or changes. Present
   the recommendation but never automatically apply changes to the codebase.

7. **Stale result awareness.** If search results seem outdated or contradictory,
   flag this to the user and suggest re-running the search.

## Mode-Specific Guidance

- **search/research**: Highlight version numbers, dates, and source agreement
- **audit**: Sort findings by severity (Critical > High > Medium > Low)
- **factcheck**: Lead with the verdict (Confirmed / False / etc.) before evidence
- **changelog**: Emphasize breaking changes and migration requirements
- **compare**: Present both options fairly; recommend based on evidence, not preference

## When Search Fails

- Show the error clearly
- Run `/gemini:setup` to diagnose
- Suggest alternative approaches (different query, manual search)
- Do not pretend the search succeeded
