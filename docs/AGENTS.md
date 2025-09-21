# Documentation Guidelines

This file governs all content beneath `docs/`.

## Writing Principles
- Favor concise, actionable guidance that helps contributors ship. Lead with the "why" before diving into detailed procedures.
- Cross-link related documents using relative paths so navigation remains portable.
- Keep front-matter or metadata blocks at the top when a document uses them; otherwise start with an H1 heading.

## Style
- Use sentence case for headings (`## Architecture decisions`).
- Prefer short paragraphs and bulleted lists to walls of text.
- Wrap external references with descriptive link text instead of bare URLs.
- When documenting commands, prefer fenced code blocks with the appropriate language hint (for example, ```bash).

## Maintenance
- Update diagrams or embedded assets together with the text that references them.
- Note the last validated tool versions when instructions depend on specific releases.
- Archive stale strategy docs under `docs/archive/` instead of deleting them so the context remains searchable.
- When code changes alter behavior or APIs, update the corresponding docs in the same change.
- When reviewing documentation, spot-check it against the current code to confirm accuracy before accepting.
