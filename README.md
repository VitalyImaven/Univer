# מתמטיקה בכיף · כיתה ג׳

A tablet-friendly, Hebrew-first (RTL) mathematics learning PWA for Israeli grade 3.

**Project status:** working source code prepared; curriculum/data generation validated programmatically. **A full browser build and touchscreen acceptance test are still required** on a machine with npm network access. This is an original educational project, not an official Ministry of Education app or a reproduction of a textbook.

## What's included

- 15 course units / **78 Hebrew lessons**, in a recommended school-year order inspired by Grade 3 *Maslulim Hadashim* books 9–12 with cross-year topics.
- For each lesson: goal, 3-step explanation, worked example, visual or mathematical exercises, targeted hint and detailed answer explanation.
- 3 difficulty levels: `קל`, `רגיל`, `אתגר`.
- **14,040 pre-generated Hebrew tasks** (60 tasks per difficulty, per lesson); 10,029 unique items, including some deliberate/inevitable repetitions. The application uses **deterministic procedural question generators** so a child can practice beyond this fixed bank.
- Topics: numbers to 10,000; four operations; multiplication facts; multi-digit calculations; problem solving; geometry (angles, triangles, cube nets, perimeter and area); time; tables, bar charts and pictograms; money, length, estimation and gematria.
- Practice sessions with 10/20/50 questions or unlimited; instant checking, feedback, hints, star awards and local progress.
- Parent progress overview, progress backup/export/import, text-size toggle, optional Hebrew browser speech.
- PWA manifest and service worker for installation/offline cache (after the initial online load).

## Run with VS Code (Windows/macOS/Linux)

Requirements: Node.js **22+**, npm, current Chrome/Edge/Safari. No database or API keys.

```bash
npm install
npm run validate:content
npm run dev
```

Open the local URL displayed by Vite (normally **http://localhost:5173**).

For a production build:

```bash
npm run build
npm run preview
```

Deploy the generated `dist/` folder to a static hosting service using HTTPS. On a tablet, open the URL and use **Add to Home Screen** to install the PWA. For testing from another device on the same Wi-Fi, use your computer's local network IP with port 5173 (ensure the firewall allows it); secure HTTPS hosting is recommended for actual PWA installation.

**Important:** Do **not** open `index.html` directly as `file://` — this is a Vite/React project requiring a dev server or build.

## Files

| Path | Purpose |
| --- | --- |
| `src/main.tsx` | React application and learning flow |
| `src/styles/app.css` | Tablet/mobile responsive child-friendly UI |
| `src/data/course.json` | Hebrew lessons, explanations, worked examples, tags |
| `src/engine/questions.ts` | Procedural question generation, checking, feedback |
| `src/engine/cubenets.ts` | Mathematically verified cube-net classifier |
| `src/components/MathVisual.tsx` | SVG geometry, clocks, grids, data charts |
| `src/engine/progress.ts` | Local progress, scoring, import/export |
| `content/question-bank.json` | 14,040 pre-generated Q&A pairs and lesson metadata |
| `docs/CURRICULUM_HE.md` | Full navigable lesson outline, in Hebrew |
| `docs/CURRICULUM_MATRIX.csv` | Lesson matrix for audit / spreadsheet filtering |
| `docs/VS_CODE_AGENT_PROMPT.md` | Complete agent handoff & acceptance criteria |
| `scripts/validate-content.mjs` | Source-level mathematics/content QA (zero dependencies) |
| `scripts/export-question-bank.mjs` | Rebuild the fixed question bank |

## Key assumptions and limitations

1. Course order is **pedagogical and recommended**, not guaranteed to match a specific school's actual timetable or textbook edition. Parents can select any lesson; do not interpret an unlearned topic as a failed skill.
2. Some cross-year lessons are **extension/reinforcement**; see lesson tags and curriculum table. Ministry curriculum and textbook contents can evolve, so a teacher should review the order and content before using this as an authoritative syllabus.
3. A browser can read Hebrew aloud only if the operating system has a suitable Hebrew speech voice. Voice quality is browser-dependent.
4. Child progress is stored only in this browser's `localStorage`; it is **not automatically synchronized** across tablet and PC. Backup/restore is available.
5. Parent access is a UI partition, **not a secure authentication barrier**. Do not add child identifiers, analytics or external data collection without an explicit privacy design.
6. The parent report records attempts/correctness, but does not yet implement formal spaced-repetition, mastery certification, an LMS, or teacher analytics.
7. An SVG is used for visual exercises; physical drawings should be spot-checked for child readability and mathematical fidelity in browsers.

## Validation status

On the authoring runtime, this command passed:

```bash
node --experimental-strip-types scripts/validate-content.mjs
```

Results: **15 units, 78 lessons, 23,400 generated-question samples** checked across 3 difficulties, including multiple-choice solutions and 35 hexominoes / 11 valid cube nets. This **is not** a proof that every generated word problem is perfect. Run `npm run build`, full browser and tablet checks as specified in `docs/VS_CODE_AGENT_PROMPT.md`.
