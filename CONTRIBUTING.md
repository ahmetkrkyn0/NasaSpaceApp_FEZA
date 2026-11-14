# Contributing Guide

How the team works on this repository during the hackathon. It is deliberately light: the goal is a clean `main` and a readable history without anyone getting blocked. Rules marked **(enforced)** are checked by CI or GitHub settings.

## Table of Contents

- [Workflow at a Glance](#workflow-at-a-glance)
- [Branching](#branching)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Code Review](#code-review)
- [Issues](#issues)
- [Decisions](#decisions)
- [Releases](#releases)
- [General Rules](#general-rules)

## Workflow at a Glance

```text
(issue) → branch <type>/<name> → commits → PR → green CI → squash merge → branch deleted
```

1. Pull the latest `main` and create a branch.
2. Commit in small, working steps.
3. Open a PR. Ask a teammate to look if the change touches someone else's area.
4. When CI is green, squash merge. The branch is deleted automatically.

## Branching

- `main` must always run and be demoable. No direct pushes, force pushes, or deleting `main`.
- Work on short-lived branches named `<type>/<short-kebab-name>`, where `<type>` is a commit type from the table below:

  Good: `feat/sun-elevation`, `fix/horizon-offset`, `docs/readme-setup`, `chore/repo-setup`
  Avoid: `test123`, `ahmet-branch`, `final-final`

  The branch name is not checked by CI, but keep to the pattern so everyone can tell what a branch is for.

- One branch = one piece of work. Merge often (hours, not days) to keep conflicts small.

```bash
git switch main
git pull
git switch -c feat/sun-elevation
```

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```text
<type>(<optional scope>): <short summary in imperative mood>
```

| Type       | Use for                                             |
| ---------- | --------------------------------------------------- |
| `feat`     | A new feature                                       |
| `fix`      | A bug fix                                           |
| `docs`     | Documentation only                                  |
| `style`    | Formatting, no logic change                         |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                             |
| `test`     | Adding or fixing tests                              |
| `build`    | Build system or dependencies                        |
| `ci`       | CI configuration                                    |
| `chore`    | Maintenance that doesn't fit the above              |
| `revert`   | Reverting a previous commit                         |

Rules:

- Summary line: imperative ("add", not "added"), lowercase, no trailing period, max 72 characters.
- Commit at meaningful steps. No `wip`, `update`, or `fixed stuff`.
- Never commit secrets (`.env`, API keys, Slack tokens) or large generated data. Put big datasets behind a download script instead.
- **No AI attribution (enforced).** Commits and PR descriptions must not contain `Co-Authored-By` trailers for AI tools (Claude, Copilot, Cursor, Codex, ChatGPT, ...), "Generated with ..." notes, or AI tool emails. GitHub would list the AI as a contributor. See [AGENTS.md](AGENTS.md).

```text
feat(api): add sun position endpoint
fix(ui): keep horizon chart inside the card on mobile
docs(readme): add local setup steps
```

## Pull Requests

- All changes reach `main` through a PR.
- **PR title follows Conventional Commits (enforced by CI).** We squash merge, so the PR title becomes the commit on `main`.
- Fill in the PR template; keep it short. Link an issue with `Closes #<n>` if there is one.
- Keep PRs small. Open a Draft PR early if you want feedback.
- Merge strategy: **squash and merge only.**

## Code Review

- Review is **not required** to merge, so nobody is blocked late at night.
- Ask for a review when you change a shared contract (API shape, data format) or someone else's area.
- If you merge without review, you are responsible for `main` still running.

## Issues

- Issues are optional but useful for anything that takes more than an hour or needs an owner.
- Use the Bug or Feature templates and the `type: ...` labels.

## Decisions

Record decisions that others depend on (data source, API shape, coordinate system, stack choice) as a short ADR in [`docs/adr/`](docs/adr/). Five lines are enough.

## Releases

- Before submission, update [`CHANGELOG.md`](CHANGELOG.md) and tag the submitted commit:

```bash
git switch main && git pull
git tag -a v1.0.0 -m "Space Apps 2026 submission"
git push origin v1.0.0
```

## General Rules

- Say what you are working on in the team channel and flag blockers early.
- Don't force-push to branches someone else is working on.
- Mention new dependencies in the PR description.
- No personal notes, IDE files, or generated artifacts in the repo.
