# VS Code Agent — Complete handoff instructions

You are a senior React/TypeScript engineer and an expert Hebrew elementary mathematics learning designer. You have the **existing source project**, not an empty repository. Do not replace or throw away the data, visuals, lesson order, or generators. Your job is to **install, compile, verify, fix any defects, and make the ready-to-deploy tablet web application production-quality**.

## Project and outcome

Project name: **מתמטיקה בכיף**. Target: 8–9 year-old pupils studying 3rd-grade mathematics in Israel, with parents monitoring progress. The entire pupil-facing app MUST be in **correct Hebrew with right-to-left layout**. Math formulas, numeric input and multi-digit calculations MUST retain understandable LTR direction. Make it enjoyable, responsive, accessible, easy to navigate on a tablet, and safe by default.

This repository already has:

- 78 original Hebrew lessons in `src/data/course.json`, 15 thematic units.
- A recommended progression from Grade 3 *Maslulim Hadashim* books 9, 10, 11, 12 plus cross-year skills. It is NOT a literal reproduction of those books or official Ministry material.
- Each lesson has an objective, teaching steps, worked example, content tag and question generator key.
- A large portable bank (`content/question-bank.json`) of 14,040 Q&A objects, 3 difficulty levels, hints and solutions, plus procedural generation in `src/engine/questions.ts` for unlimited practice.
- React UI with parent overview, localStorage, back-up / restore, PWA manifest and SVG exercises.

Read `README.md`, `docs/CURRICULUM_HE.md`, and `docs/CURRICULUM_MATRIX.csv` before modifying.

## Immediate execution tasks — do all without needing more specifications

1. `npm install`, `npm run validate:content`, `npm run build`, `npm run dev` / `npm run preview`. **Fix TypeScript, runtime, and accessibility errors** found. Use Node 22+. If package resolution is unavailable, report exactly what did and did not run; do not falsely claim success.
2. Open the site in browser and exercise the learner's complete flow: home → course → lesson explanation → practice → hint → correct/incorrect answer → session summary → parent overview → progress backup/import. Verify refresh persists progress. Verify unlimited-session exit, `10/20/50` session termination, difficulty selection, sample solutions, data tables, angles, triangle rendering, cube nets, graphs and clocks.
3. Test breakpoints at 360×780, 768×1024 (tablet portrait), 1024×768 (tablet landscape), 1440×900 (desktop). No horizontal overflow, overlapping buttons or cut-off diagrams; tap targets at least ~44 px. Verify RTL on all screens and LTR in calculations. Review with Hebrew-speaking parent if possible.
4. Inspect all 78 lessons and at least 10 generated exercises per lesson manually, prioritizing arithmetic/division remainder, geometric classifications, clocks, order-of-operations, subtraction with borrowing, graph-reading and word problems. Automated checks already sample 23,400 generated questions, but cannot guarantee pedagogical correctness or good Hebrew.
5. Improve parent usability: clear strengths/weaknesses and chronological progress. Keep local-first default (no tracking, ads, sign-in, or cloud account required). Include a friendly explanation that progress is per-device and can be backed up.
6. Ensure static deployment works with path-aware asset references, PWA installability over HTTPS and offline exercises after initial cached load. Add an easily discoverable install/help note for parents.
7. Only after fixing functional issues, polish child-friendly UI where warranted (touch feedback, transitions, empty states, neat explanations). Preserve speed and text legibility; avoid large dependency additions and game mechanics that pressure or shame children.
8. Add unit/e2e tests (Vitest + Playwright if feasible) and a CI script to catch regressions. Document exact commands, deployment and known limitations in README.

## Acceptance criteria

- All **78 lesson pages load**, Hebrew instruction has coherent steps and a worked example; lesson navigation follows recommended book order.
- Question tasks produce an answer, mathematical explanation and hint. All multiple-choice correct answers appear exactly once. For numeric questions, common Hebrew/Arabic numeral formatting should be handled sensibly.
- Visually rich exercises display diagrams with accurate labels and readable touch-friendly controls.
- Practice repeats without a hard limit; no crash after 100+ questions; every answer is recorded once, correct/incorrect scoring is reliable; a session ends at chosen length.
- On refresh, progress is preserved locally; backup can be exported and later restored on another device.
- On tablet, every action is usable without mouse or keyboard (numeric pad is native if applicable).
- No non-Hebrew pupil UI strings, except mathematical notation, book names/technical support, and standard numeric signs.
- `npm run validate:content` and `npm run build` pass, with tests documented and passing.
- Browser QA pass/fail and any open issues clearly reported; never claim an unexecuted browser test passed.

## Explicit constraints

- Do not scrape or copy textbook pages, purchased course content or illustrations. Lesson explanations and tasks are original.
- Do not quietly assert that a specific book's sequence is legally mandatory for every Israeli school. Expose a parent-facing note that sequence can vary by class / teacher.
- Preserve optional or reinforcement tags instead of implying every cross-year exercise is required core.
- Never share or upload student answers to third-party servers. Obtain explicit approval before adding telemetry, backends or account registration.
- Avoid a paywall, ads or commercial UI.

## Suggested next enhancements (only after acceptance criteria)

- Per-pupil profiles (local, separate namespaces), custom review playlists, mastery checks, spaced-repetition, printable quizzes, and teacher-friendly printable lesson plans.
- More guided visual explanations: animated multi-digit column addition/subtraction, array models for multiplication and step-by-step clock calculation.
- Adaptive skill selection based on repeated errors (without pretending to infer clinical/educational diagnoses).

## Validation reference

`node --experimental-strip-types scripts/validate-content.mjs` validated 15 units, 78 lessons, 23,400 generated questions, 4,050 multiple-choice samples and 7,140 diagram-based samples, including exact cube-net enumeration. The bank snapshot has 14,040 stored items (10,029 distinct under its signature metric). A source-level validation pass is **not** the same as a web build / real-browser test.
