# Architecture Decision Records (ADR)

This folder keeps the technical decisions the team depends on, with their reasons: stack, data sources, API shape, coordinate systems, and so on.
Each decision is a separate file named `NNNN-short-name.md`. Numbers only go up and are never reused.

If a decision changes, do not delete the old record: set its status to "Superseded by ADR-NNNN" and add a new record.

**Statuses:** Proposed · Accepted · Rejected · Superseded

| No | Decision | Status |
|---|---|---|
| 0001 | [Uygulama mimarisi ve stack](0001-uygulama-mimarisi-ve-stack.md) | Accepted |
| 0002 | [Koordinat sistemi, zaman ve açı kuralları](0002-koordinat-sistemi-ve-zaman.md) | Proposed |
| 0003 | [Veri sözleşmesi](0003-veri-sozlesmesi.md) | Proposed |
| 0004 | [API uç noktaları](0004-api-uc-noktalari.md) | Proposed |

## Template

```markdown
# ADR-NNNN: Title

- **Status:** Proposed
- **Date:** YYYY-MM-DD
- **Related:** file, section, or issue

## Context
Why was a decision needed? What is the problem?

## Decision
What did we decide to do?

## Consequences
What we gain, what it costs, and what needs to be done.
```
