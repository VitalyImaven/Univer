# Project agent instructions

This is an existing React/TypeScript/Vite PWA — **not** a blank app. Before making changes, read:

1. `docs/VS_CODE_AGENT_PROMPT.md` for the complete implementation / QA requirements.
2. `README.md` for commands and architecture.
3. `docs/CURRICULUM_HE.md` for lesson order and pedagogy.

All learner-facing text must be Hebrew RTL. Math expressions and arithmetic input must be directionally correct. Keep progress local/private and ensure generated answers, hints, solutions and SVG diagrams stay consistent. Do not replace the 78 lessons or 14,040-item bank with mock content. Validate with `npm run check` (content validation + unit tests + build) and, for UI changes, `npm run test:e2e`; report any steps you could not execute. After changing a question generator, run `npm run export:bank` so the stored bank matches.
