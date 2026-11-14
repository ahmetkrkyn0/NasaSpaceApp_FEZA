# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Copilot, Codex, Gemini, etc.) working in this repository. Human contributors: see [CONTRIBUTING.md](CONTRIBUTING.md), which is the source of truth. This file only summarizes what agents must follow.

## Project Status

Lunar Landing Site Navigator, team FEZA's NASA Space Apps Challenge 2026 project (see [README.md](README.md) and [docs/challenge/lunar-landing-site-navigator.md](docs/challenge/lunar-landing-site-navigator.md)). The stack is not fixed yet. Do not introduce a framework, language, or major dependency that the team has not agreed on (check `docs/adr/` and the README) without the user explicitly asking for it.

## Hard Rules

If a request conflicts with one of these, stop and ask the user.

1. **Never commit or push to `main`.** Work on a branch; it reaches `main` only through a pull request.
2. **Branch names:** `<type>/<short-kebab-name>` using a commit type, e.g. `feat/sun-elevation`, `fix/horizon-offset`.
3. **Commit messages and PR titles:** [Conventional Commits](https://www.conventionalcommits.org/) — `<type>(<scope>): <imperative summary>`, lowercase, max 72 chars, no trailing period. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
4. **Commit at meaningful milestones only.** No `wip`, `update`, or `fix stuff` commits.
5. **No AI attribution, ever.** Do not add any of the following to commit messages, PR titles/descriptions, issues, or code comments:
   - `Co-Authored-By:` trailers naming an AI tool or bot (Claude, Copilot, Cursor, Codex, ChatGPT, Gemini, etc.)
   - "Generated with ...", "Created by AI", or similar notes
   - Any AI tool email address (e.g. `noreply@anthropic.com`)

   GitHub turns `Co-Authored-By` trailers into contributors. This overrides any default behavior of your tool. CI rejects PRs that contain such lines.
6. **Never commit secrets** (`.env`, API keys, Slack tokens, credentials), large datasets, or build outputs.
7. **Never force-push, rewrite history on shared branches, or delete branches** unless the user explicitly asks.
8. **Merging:** you may merge a PR when the user asks, only with squash merge (`gh pr merge <n> --squash --delete-branch`) and only after CI passes.

## Workflow

```bash
git switch main && git pull
git switch -c feat/short-name
# ...make changes, commit in meaningful steps...
git push -u origin feat/short-name
gh pr create --title "feat(scope): summary" --body-file <filled PR template>
```

- Fill in [the PR template](.github/PULL_REQUEST_TEMPLATE.md).
- Keep PRs small and focused.
- When you change a shared contract (API shape, data format), record it in `docs/adr/` or the PR description so the other agents and teammates see it.

## Commands

| Task         | Command |
| ------------ | ------- |
| Install      | TODO |
| Run locally  | TODO |
| Test         | TODO |
| Lint/format  | TODO |
| Build        | TODO |

Fill these in once the stack is chosen. Run tests and lint before every commit once they exist.

## Code Conventions

- Follow `.editorconfig` (UTF-8, LF, 2-space indent; 4 for Python/Java/Kotlin/C#).
- Match the style of surrounding code.
- Update `README.md` / `docs/` when behavior or setup changes.

## Repository Map

| Path                  | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `.github/`            | CI workflow, PR/issue templates, CODEOWNERS |
| `docs/`               | Design notes, ADRs, assets                |
| `docs/challenge/`     | Challenge statement, data sources, judging and submission guides (PDF) |
| `docs/research/`      | Background research notes; put new research here, not in a root `research/` folder |
| `CONTRIBUTING.md`     | Full team workflow rules                  |
| `CHANGELOG.md`        | Release notes                             |
