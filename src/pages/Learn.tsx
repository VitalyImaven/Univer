import { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Box, Brain, Calculator, ChartColumn, Check, ChevronDown, ChevronLeft, Divide, Grid2x2, Hash,
  Layers, Lightbulb, Puzzle, RefreshCw, Rocket, Ruler, Search, Sparkles, Target, Triangle, Volume2, X, type LucideIcon,
} from 'lucide-react';
import { BADGES } from '../engine/achievements';
import { dayKey, levelInfo, starsFor, summary, MIN_QUESTIONS_FOR_STARS, type SessionOutcome } from '../engine/progress';
import { createQuestion, hashSeed, makeRandom } from '../engine/questions';
import { canSpeak, speak } from '../engine/sound';
import { BOOKS, bookOf, chapterById, chapters, lessons } from '../data';
import { Chip, Confetti, Mascot, ProgressBar, Stars } from '../components/Bits';
import { AnswerText, Expression, MathText } from '../components/MathText';
import { MathVisual } from '../components/MathVisual';
import { Practice, type PracticeItem, type SessionResult } from '../components/Practice';
import type { AnswerLog, Lesson, Level, Progress, Settings } from '../types';

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles, hash: Hash, ruler: Ruler, layers: Layers, calculator: Calculator, triangle: Triangle, x: X,
  'grid-2x2': Grid2x2, divide: Divide, brain: Brain, box: Box, chart: ChartColumn, 'book-open': BookOpen, puzzle: Puzzle,
};
const LEVEL_NAMES = ['קל', 'רגיל', 'אתגר'];
const LEVEL_EMOJI = ['🌱', '⭐', '🚀'];
const starsOf = (p: Progress, id: string) => p.stats[id]?.stars || 0;

export type PageProps = {
  progress: Progress; settings: Settings; profileId: string;
  go: (route: string) => void;
  recordAnswer: (log: AnswerLog) => void;
  completeSession: (outcome: SessionOutcome) => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

/** The lesson to continue with: the one in progress, otherwise the first not yet completed. */
export function nextLessonFor(progress: Progress): Lesson {
  const current = progress.currentLesson ? lessons.find(l => l.id === progress.currentLesson) : undefined;
  if (current && starsOf(progress, current.id) < 2) return current;
  return lessons.find(l => starsOf(progress, l.id) < 2) || lessons[0];
}

/* ------------------------------------------------------------------ Home */
export function Home({ progress, go }: PageProps) {
  const stats = summary(progress), level = levelInfo(progress.rewards);
  const upNext = nextLessonFor(progress), started = stats.total > 0;
  const today = progress.days[dayKey()];
  const earned = BADGES.filter(b => progress.badges[b.id]);
  return <>
    <section className="hero">
      <div className="hero-text">
        <Chip tone="glass"><Sparkles size={15}/> מתמטיקה בכיף · כיתה ג׳</Chip>
        <h1>היי <span>{progress.learner}</span>!<br/>{started ? 'ממשיכים בהרפתקה?' : 'מוכנים להרפתקת מספרים?'}</h1>
        <div className="hero-next">
          <small>{started ? 'השיעור הבא שלך' : 'מתחילים כאן'}</small>
          <b>{upNext.title}</b>
        </div>
        <div className="hero-buttons">
          <button className="btn btn-sun btn-big" onClick={() => go(`lesson/${upNext.id}`)}>{started ? 'ממשיכים ללמוד' : 'יוצאים לדרך'} <ArrowLeft size={22}/></button>
          <button className="btn btn-glass" onClick={() => go('lessons')}>כל השיעורים</button>
        </div>
      </div>
      <div className="hero-art">
        <span className="float f1">7×8</span><span className="float f2">÷</span><span className="float f3">+</span><span className="float f4">56</span>
        <Mascot mood={started ? 'happy' : 'idle'} size={190}/>
      </div>
    </section>

    <section className="level-card card">
      <span className="level-badge">{level.number}</span>
      <div className="level-info">
        <b>רמה {level.number} · {level.title}</b>
        <ProgressBar value={level.percent} color="linear-gradient(90deg,#ffc93c,#ff8a4c)"/>
        <small>{level.next ? <>⭐ {progress.rewards.toLocaleString('en-US')} נקודות · עוד {(level.next - progress.rewards).toLocaleString('en-US')} לרמה הבאה</> : <>⭐ {progress.rewards.toLocaleString('en-US')} נקודות · הגעת לרמה הגבוהה ביותר!</>}</small>
      </div>
    </section>

    <div className="tiles">
      <button className="tile tile-coral" onClick={() => go('daily')}>
        <span className="tile-emoji">🎯</span>
        <span><b>האתגר היומי</b><small>{today?.daily ? 'הושלם היום — כל הכבוד! אפשר שוב' : '10 שאלות מעורבות, כל יום אתגר חדש'}</small></span>
        {today?.daily ? <span className="tile-done"><Check size={18}/></span> : <ChevronLeft size={22}/>}
      </button>
      <button className="tile tile-mint" onClick={() => go('table')}>
        <span className="tile-emoji">✖️</span>
        <span><b>לוח הכפל</b><small>חוקרים, מגלים ובוחנים את עצמנו</small></span><ChevronLeft size={22}/>
      </button>
      <button className="tile tile-sky" onClick={() => go('rewards')}>
        <span className="tile-emoji">🏅</span>
        <span><b>האוסף שלי</b><small>{earned.length ? `${earned.length} מתוך ${BADGES.length} מדליות` : 'אוספים מדליות על תרגול'}</small></span><ChevronLeft size={22}/>
      </button>
    </div>

    <div className="stat-row">
      <div className="stat"><b>{stats.played}</b><small>שיעורים שתרגלת</small></div>
      <div className="stat"><b>{stats.mastered}</b><small>שיעורים שהושלמו</small></div>
      <div className="stat"><b>{stats.correct}</b><small>תשובות נכונות</small></div>
      <div className="stat"><b>{stats.days}</b><small>ימי תרגול</small></div>
    </div>

    <div className="section-head"><h2>המסלול שלי</h2><p>ארבעה ספרים ועוד תרגול לאורך השנה. כל שיעור פתוח תמיד.</p></div>
    <div className="book-grid">
      {BOOKS.map(book => {
        const list = lessons.filter(l => l.book === book.id), done = list.filter(l => starsOf(progress, l.id) >= 2).length;
        return <button key={book.key} className="book-card" style={{ ['--accent' as string]: book.color }} onClick={() => go(`lessons/${book.key}`)}>
          <span className="book-emoji">{book.emoji}</span>
          <span className="book-label">{book.label}</span>
          <b>{book.name}</b>
          <small>{book.desc}</small>
          <ProgressBar value={done / list.length * 100} color={book.color}/>
          <span className="book-count">{done} מתוך {list.length} שיעורים</span>
        </button>;
      })}
    </div>
  </>;
}

/* --------------------------------------------------------------- Lessons */
export function Lessons({ progress, go, book }: PageProps & { book?: string }) {
  const [query, setQuery] = useState('');
  const active = BOOKS.find(b => b.key === book) || bookOf(nextLessonFor(progress).book);
  const needle = query.trim();
  const found = needle ? lessons.filter(l => `${l.title} ${l.subtitle} ${l.objective}`.includes(needle)) : null;
  const tile = (l: Lesson, i: number) => {
    const stars = starsOf(progress, l.id);
    return <button key={l.id} className={`lesson-tile${stars >= 2 ? ' done' : ''}`} onClick={() => go(`lesson/${l.id}`)}>
      <span className="lesson-num">{stars >= 2 ? <Check size={20}/> : i + 1}</span>
      <span className="lesson-copy"><b>{l.title}</b><small>{l.subtitle}{l.tag === 'optional' && <em> · העשרה</em>}</small></span>
      <Stars value={stars}/>
    </button>;
  };
  return <>
    <div className="page-head">
      <div><h1>מה לומדים היום?</h1><p>השיעורים מסודרים לפי הסדר המומלץ, אבל אפשר לבחור כל שיעור — למשל את הנושא שלומדים עכשיו בכיתה.</p></div>
      <label className="search"><Search size={19}/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="חיפוש נושא, למשל: שארית" aria-label="חיפוש שיעור"/></label>
    </div>
    {found
      ? <section className="chapter card"><div className="chapter-head"><div><h2>תוצאות חיפוש</h2><p>{found.length ? `נמצאו ${found.length} שיעורים` : 'לא נמצאו שיעורים. נסו מילה אחרת.'}</p></div></div><div className="lesson-grid">{found.map(tile)}</div></section>
      : <>
        <div className="book-tabs" role="tablist" aria-label="בחירת ספר">
          {BOOKS.map(b => <button key={b.key} role="tab" aria-selected={active.key === b.key} className={active.key === b.key ? 'selected' : ''} style={{ ['--accent' as string]: b.color }} onClick={() => go(`lessons/${b.key}`)}><span>{b.emoji}</span>{b.label}</button>)}
        </div>
        {chapters.filter(c => c.book === active.id).map(c => {
          const Icon = ICONS[c.icon] || Sparkles, done = c.lessons.filter(l => starsOf(progress, l.id) >= 2).length;
          return <section className="chapter card" key={c.id} style={{ ['--accent' as string]: active.color }}>
            <div className="chapter-head">
              <span className="chapter-icon"><Icon size={26}/></span>
              <div><h2>{c.title}</h2><p>{c.desc}</p></div>
              <Chip tone={done === c.lessons.length ? 'good' : 'soft'}>{done}/{c.lessons.length}</Chip>
            </div>
            <div className="lesson-grid">{c.lessons.map(tile)}</div>
          </section>;
        })}
      </>}
  </>;
}

/* ---------------------------------------------------------- Lesson (learn) */
function StartPanel({ settings, updateSettings, onStart }: { settings: Settings; updateSettings: PageProps['updateSettings']; onStart: () => void }) {
  return <div className="start-panel card">
    <div className="start-mascot"><Mascot mood="happy" size={96}/><p>מוכנים? בוחרים רמה ומתחילים!</p></div>
    <div className="picker"><span>רמת קושי</span><div className="segmented" role="group" aria-label="רמת קושי">
      {([1, 2, 3] as Level[]).map(l => <button key={l} aria-pressed={settings.level === l} className={settings.level === l ? 'selected' : ''} onClick={() => updateSettings({ level: l })}>{LEVEL_EMOJI[l - 1]} {LEVEL_NAMES[l - 1]}</button>)}
    </div></div>
    <div className="picker"><span>כמה שאלות?</span><div className="segmented" role="group" aria-label="מספר שאלות">
      {[10, 20, 50, 0].map(n => <button key={n} aria-pressed={settings.roundLength === n} className={settings.roundLength === n ? 'selected' : ''} onClick={() => updateSettings({ roundLength: n })}>{n === 0 ? 'חופשי' : n}</button>)}
    </div></div>
    <button className="btn btn-primary btn-big btn-wide" onClick={onStart}>מתחילים לתרגל <Rocket size={21}/></button>
  </div>;
}

export function LessonPage({ lesson, progress, settings, updateSettings, go }: PageProps & { lesson: Lesson }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const book = bookOf(lesson.book), chapter = chapterById.get(lesson.chapter)!;
  const samples = useMemo(() => [5, 8].map((n, i) => createQuestion(lesson, (i + 1) as Level, 100 + n)), [lesson]);
  const start = () => go(`practice/${lesson.id}`);
  const position = lessons.indexOf(lesson);
  return <div style={{ ['--accent' as string]: book.color }}>
    <nav className="crumbs" aria-label="מיקום"><button onClick={() => go(`lessons/${book.key}`)}><ArrowRight size={17}/> {book.label}</button><span>{chapter.title}</span></nav>
    <section className="lesson-hero">
      <div><Chip tone="glass">{book.emoji} שיעור {position + 1} מתוך {lessons.length}{lesson.tag === 'optional' ? ' · העשרה' : ''}</Chip><h1>{lesson.title}</h1><p>{lesson.subtitle}</p></div>
      <Stars value={starsOf(progress, lesson.id)} size={30}/>
    </section>
    <div className="lesson-layout">
      <StartPanel settings={settings} updateSettings={updateSettings} onStart={start}/>
      <div className="lesson-main">
        <section className="card learn-card">
          <div className="card-title"><span className="round-icon"><Lightbulb size={22}/></span><h2>איך פותרים?</h2>
            {canSpeak() && <button className="icon-btn" aria-label="הקראת ההסבר" title="הקראת ההסבר" onClick={() => speak(`${lesson.objective}. ${lesson.steps.join(' ')}`)}><Volume2 size={20}/></button>}
          </div>
          <p className="objective"><Target size={18}/> <span><b>המטרה: </b><MathText text={lesson.objective}/></span></p>
          <ol className="steps">{lesson.steps.map((s, i) => <li key={i}><span>{i + 1}</span><p><MathText text={s}/></p></li>)}</ol>
        </section>
        <section className="card worked">
          <div className="card-title"><span className="round-icon sun"><Sparkles size={22}/></span><h2>דוגמה פתורה</h2></div>
          {lesson.worked.map((w, i) => <div key={i}>
            <h3><MathText text={w.prompt}/></h3>
            <MathVisual visual={w.visual}/>
            <div className="worked-answer">התשובה: <strong><AnswerText text={w.answer}/></strong></div>
            <p><MathText text={w.explanation}/></p>
          </div>)}
        </section>
        <section className="card">
          <div className="card-title"><span className="round-icon mint"><Brain size={22}/></span><h2>נסו בעצמכם</h2></div>
          <div className="samples">{samples.map((sample, i) => <div className="sample" key={i}>
            <b><MathText text={sample.prompt}/></b>
            {sample.expression && <Expression text={sample.expression} small/>}
            <MathVisual visual={sample.visual}/>
            <button className="btn btn-quiet btn-small" aria-expanded={!!open[i]} onClick={() => setOpen(o => ({ ...o, [i]: !o[i] }))}>{open[i] ? 'מסתירים פתרון' : 'מגלים פתרון'} <ChevronDown size={16} className={open[i] ? 'flip' : ''}/></button>
            {open[i] && <div className="sample-solution"><strong>התשובה: <AnswerText text={sample.answer}/></strong><p><MathText text={sample.solution}/></p></div>}
          </div>)}</div>
        </section>
        <button className="btn btn-primary btn-big btn-wide only-narrow" onClick={start}>מתחילים לתרגל <Rocket size={21}/></button>
      </div>
    </div>
  </div>;
}

/* ------------------------------------------------------------ Result view */
function ResultView({ result, stars, title, children }: { result: SessionResult; stars: number | null; title: string; children: React.ReactNode }) {
  const accuracy = result.answered ? Math.round(result.correct / result.answered * 100) : 0;
  const message = accuracy >= 90 ? 'אימון מעולה!' : accuracy >= 70 ? 'עבודה יפה מאוד!' : accuracy >= 40 ? 'התקדמת יפה!' : 'כל ניסיון מלמד משהו חדש.';
  return <section className="result card">
    <Confetti burst={accuracy >= 70 ? 1 : 0} pieces={70}/>
    <Mascot mood={accuracy >= 70 ? 'cheer' : 'happy'} size={130}/>
    <h1>{message}</h1>
    <p>{title}</p>
    {stars !== null && <Stars value={stars} size={54} animate/>}
    {stars === null && result.answered < MIN_QUESTIONS_FOR_STARS && <p className="muted">כוכבים מקבלים אחרי {MIN_QUESTIONS_FOR_STARS} שאלות לפחות.</p>}
    <div className="result-numbers">
      <div><b>{result.correct}/{result.answered}</b><small>תשובות נכונות</small></div>
      <div><b>{result.bestRun}</b><small>הרצף הארוך ביותר</small></div>
      <div><b>+{result.correct * 10 + (result.answered - result.correct) * 2}</b><small>נקודות ⭐</small></div>
    </div>
    <div className="result-buttons">{children}</div>
    {result.mistakes.length > 0 && <div className="mistakes">
      <h2>כדאי להסתכל שוב</h2>
      {result.mistakes.map((m, i) => <div className="mistake" key={i}>
        <b><MathText text={m.question.prompt}/></b>
        {m.question.expression && <Expression text={m.question.expression} small/>}
        <MathVisual visual={m.question.visual}/>
        <p>ענית: <span className="given"><AnswerText text={m.given}/></span> · התשובה הנכונה: <strong><AnswerText text={m.question.answer}/></strong></p>
        <p className="muted"><MathText text={m.question.solution}/></p>
      </div>)}
    </div>}
  </section>;
}

/* ------------------------------------------------------- Lesson practice */
export function LessonPractice({ lesson, settings, recordAnswer, completeSession, go }: PageProps & { lesson: Lesson }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [result, setResult] = useState<SessionResult | null>(null);
  const level = settings.level, total = settings.roundLength;
  const getItem = useCallback((i: number): PracticeItem => ({ lesson, question: createQuestion(lesson, level, seed + i) }), [lesson, level, seed]);
  const finish = (r: SessionResult) => {
    if (r.answered === 0) { go(`lesson/${lesson.id}`); return; }
    completeSession({ lessonId: lesson.id, answered: r.answered, correct: r.correct, hintsUsed: r.hintsUsed, bestRun: r.bestRun });
    setResult({ ...r, mistakes: [...r.mistakes] });
    window.scrollTo({ top: 0 });
  };
  const following = lessons[lessons.indexOf(lesson) + 1];
  if (result) return <ResultView result={result} title={lesson.title} stars={result.answered >= MIN_QUESTIONS_FOR_STARS ? starsFor(result.answered, result.correct) : null}>
    <button className="btn btn-primary" onClick={() => { setSeed(Math.floor(Math.random() * 1e9)); setResult(null); }}><RefreshCw size={18}/> עוד אימון</button>
    {following && <button className="btn btn-sun" onClick={() => go(`lesson/${following.id}`)}>לשיעור הבא <ArrowLeft size={18}/></button>}
    <button className="btn btn-quiet" onClick={() => go(`lessons/${bookOf(lesson.book).key}`)}>לכל השיעורים</button>
  </ResultView>;
  return <>
    <nav className="crumbs" aria-label="מיקום"><button onClick={() => go(`lesson/${lesson.id}`)}><ArrowRight size={17}/> חזרה להסבר</button><span>רמה: {LEVEL_NAMES[level - 1]}</span></nav>
    <Practice key={seed} getItem={getItem} total={total} heading={lesson.title} onAnswer={recordAnswer} onFinish={finish}/>
  </>;
}

/* ------------------------------------------------------- Daily challenge */
const DAILY_LENGTH = 10;
export function Daily({ progress, settings, profileId, recordAnswer, completeSession, go }: PageProps) {
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  // The mix is fixed when the challenge starts: lessons already practised, or the first lessons for a new learner.
  const plan = useMemo(() => {
    const practised = lessons.filter(l => (progress.stats[l.id]?.attempts || 0) > 0);
    const upNext = lessons.indexOf(nextLessonFor(progress));
    const pool = practised.length >= 3 ? practised : lessons.slice(0, Math.max(4, upNext + 1));
    const seed = hashSeed(`${dayKey()}:${profileId}:${round}`), rnd = makeRandom(seed);
    const order = [...pool].sort((a, b) => (progress.stats[a.id]?.lastPlayed || 0) - (progress.stats[b.id]?.lastPlayed || 0));
    const picks = Array.from({ length: DAILY_LENGTH }, (_, i) => order[(i + Math.floor(rnd() * order.length)) % order.length]);
    return { seed, picks };
  }, [profileId, round]);
  const getItem = useCallback((i: number): PracticeItem => {
    const lesson = plan.picks[i % plan.picks.length];
    return { lesson, question: createQuestion(lesson, settings.level, plan.seed + i) };
  }, [plan, settings.level]);
  const finish = (r: SessionResult) => {
    if (r.answered === 0) { go(''); return; }
    completeSession({ answered: r.answered, correct: r.correct, hintsUsed: r.hintsUsed, bestRun: r.bestRun, daily: r.answered >= DAILY_LENGTH });
    setResult({ ...r, mistakes: [...r.mistakes] });
    window.scrollTo({ top: 0 });
  };
  if (result) return <ResultView result={result} title="האתגר היומי" stars={null}>
    <button className="btn btn-primary" onClick={() => { setRound(n => n + 1); setResult(null); }}><RefreshCw size={18}/> אתגר נוסף</button>
    <button className="btn btn-sun" onClick={() => go('')}>לדף הבית <ArrowLeft size={18}/></button>
  </ResultView>;
  return <>
    <nav className="crumbs" aria-label="מיקום"><button onClick={() => go('')}><ArrowRight size={17}/> לדף הבית</button><span>שאלות מעורבות מהשיעורים שתרגלת</span></nav>
    <Practice key={round} getItem={getItem} total={DAILY_LENGTH} heading="🎯 האתגר היומי" onAnswer={recordAnswer} onFinish={finish}/>
  </>;
}

