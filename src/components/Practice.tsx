import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Flag, Lightbulb, Volume2 } from 'lucide-react';
import { answerIsCorrect } from '../engine/questions';
import { canSpeak, playSound, speak } from '../engine/sound';
import type { AnswerLog, Lesson, Question } from '../types';
import { Confetti, Keypad, Mascot, ProgressBar, type Mood } from './Bits';
import { AnswerText, Expression, MathText } from './MathText';
import { MathVisual } from './MathVisual';

export type PracticeItem = { lesson: Lesson; question: Question };
export type Mistake = { question: Question; given: string; lessonTitle: string };
export type SessionResult = { answered: number; correct: number; hintsUsed: number; bestRun: number; mistakes: Mistake[] };

type Status = 'answering' | 'retry' | 'correct' | 'fixed' | 'wrong';
const PRAISE = ['מצוין!', 'כל הכבוד!', 'יופי של תשובה!', 'בול!', 'נהדר!', 'איזה יופי!', 'וואו, נכון!'];
const COMFORT = ['לא נורא, ככה לומדים!', 'כמעט! בפעם הבאה זה יצליח.', 'טעויות עוזרות לנו ללמוד.'];
const OPTION_TONES = ['violet', 'aqua', 'amber', 'pink'];
const TIME = /^\d{1,2}:\d{2}$/;

/** One practice run. Every question is logged exactly once (on the first check);
 *  a second try is offered for learning but does not change the score. */
export function Practice({ getItem, total, heading, onAnswer, onFinish }: {
  getItem: (index: number) => PracticeItem; total: number; heading: string;
  onAnswer: (log: AnswerLog) => void; onFinish: (result: SessionResult) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<Status>('answering');
  const [hintShown, setHintShown] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [run, setRun] = useState(0);
  const [burst, setBurst] = useState(0);
  const [shake, setShake] = useState(0);
  const result = useRef<SessionResult>({ answered: 0, correct: 0, hintsUsed: 0, bestRun: 0, mistakes: [] });
  const startedAt = useRef(Date.now());
  const hintUsed = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const item = useMemo(() => getItem(index), [getItem, index]);
  const q = item.question;
  const isTime = TIME.test(q.answer);
  const done = status === 'correct' || status === 'fixed' || status === 'wrong';
  const canRetry = !q.options || q.options.length > 2;
  const isLast = total > 0 && index + 1 >= total;

  const check = useCallback(() => {
    if (done || !answer.trim()) return;
    const right = answerIsCorrect(answer, q.answer);
    if (status === 'answering') {
      const r = result.current;
      r.answered++;
      if (hintUsed.current) r.hintsUsed++;
      if (right) { r.correct++; setCorrectCount(n => n + 1); }
      else r.mistakes.push({ question: q, given: answer, lessonTitle: item.lesson.title });
      const nextRun = right ? run + 1 : 0;
      r.bestRun = Math.max(r.bestRun, nextRun);
      setRun(nextRun);
      onAnswer({ at: Date.now(), lessonId: item.lesson.id, correct: right, seconds: Math.round((Date.now() - startedAt.current) / 1000), hintUsed: hintUsed.current });
    }
    if (right) {
      setStatus(status === 'answering' ? 'correct' : 'fixed');
      setBurst(b => b + 1); playSound('correct');
    } else if (status === 'answering' && canRetry) {
      setStatus('retry'); setHintShown(true); hintUsed.current = true;
      setRejected(old => [...old, answer]); setAnswer(''); setShake(s => s + 1); playSound('wrong');
    } else {
      setStatus('wrong'); setShake(s => s + 1); playSound('wrong');
    }
  }, [answer, canRetry, done, item, onAnswer, q, run, status]);

  const next = useCallback(() => {
    if (isLast) { onFinish(result.current); return; }
    setIndex(i => i + 1); setAnswer(''); setStatus('answering'); setHintShown(false); setRejected([]);
    hintUsed.current = false; startedAt.current = Date.now();
    cardRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [isLast, onFinish]);

  const press = useCallback((key: string) => {
    if (done) return;
    playSound('tap');
    setAnswer(old => {
      if (key === 'back') return old.slice(0, -1);
      if (key === ':') return old.includes(':') || !old ? old : old + ':';
      return old.length >= 7 ? old : old + key;
    });
  }, [done]);

  // Hardware keyboard: digits, Backspace and Enter work everywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') { e.preventDefault(); if (done) next(); else check(); return; }
      if (q.options) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (isTime && (e.key === ':' || e.key === '.')) press(':');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [check, done, isTime, next, press, q.options]);

  const mood: Mood = status === 'correct' ? 'cheer' : status === 'fixed' ? 'happy' : status === 'wrong' || status === 'retry' ? 'oops' : hintShown ? 'think' : 'idle';
  const praise = PRAISE[index % PRAISE.length], comfort = COMFORT[index % COMFORT.length];

  return <section className="practice" ref={cardRef}>
    <Confetti burst={burst}/>
    <div className="practice-top">
      <div className="practice-count">
        <b>{heading}</b>
        <span>{total > 0 ? `שאלה ${index + 1} מתוך ${total}` : `שאלה ${index + 1} · אימון חופשי`}</span>
      </div>
      <div className="practice-meta">
        {run >= 2 && <span className="run-chip" key={run}>🔥 רצף {run}</span>}
        <span className="score-chip"><Check size={16}/> {correctCount}</span>
        <button type="button" className="btn btn-quiet btn-small" onClick={() => onFinish(result.current)}><Flag size={16}/> סיום</button>
      </div>
    </div>
    {total > 0 && <ProgressBar value={(index + (done ? 1 : 0)) / total * 100}/>}

    <div className="practice-grid">
      <div className={`question-card card${shake ? ' shake' : ''}`} key={`${index}-${shake}`}>
        <div className="question-head">
          <h2><MathText text={q.prompt}/></h2>
          {canSpeak() && <button type="button" className="icon-btn" aria-label="הקראת השאלה" title="הקראת השאלה" onClick={() => speak(q.prompt)}><Volume2 size={20}/></button>}
        </div>
        {q.expression && <Expression text={q.expression}/>}
        {q.visual && <MathVisual visual={q.visual}/>}
      </div>

      <div className="answer-card card">
        <div className="mascot-row">
          <Mascot mood={mood} size={84}/>
          <div className={`bubble bubble-${status}`} role="status" aria-live="polite">
            {status === 'answering' && (hintShown ? <><b>רמז:</b> <MathText text={q.hint}/></> : q.options ? 'בחרו תשובה ולחצו ״בדיקה״' : isTime ? 'כתבו את השעה, למשל 7:30' : 'מה התשובה שלך?')}
            {status === 'retry' && <><b>כמעט! נסו שוב.</b> <MathText text={q.hint}/></>}
            {status === 'correct' && <b>{praise}</b>}
            {status === 'fixed' && <b>יפה! תיקנת בעצמך.</b>}
            {status === 'wrong' && <b>{comfort}</b>}
          </div>
        </div>

        {q.options
          ? <div className={`options options-${q.options.length}`} role="group" aria-label="בחרו תשובה">
            {q.options.map((option, i) => {
              const isAnswer = done && option === q.answer, wasRejected = rejected.includes(option) || (status === 'wrong' && option === answer);
              return <button type="button" key={option} disabled={done || rejected.includes(option)} aria-pressed={answer === option}
                className={`option tone-${OPTION_TONES[i % 4]}${answer === option && !done ? ' chosen' : ''}${isAnswer ? ' is-answer' : ''}${wasRejected ? ' is-rejected' : ''}`}
                onClick={() => { playSound('tap'); setAnswer(option); }}><AnswerText text={option}/></button>;
            })}
          </div>
          : <>
            <div className={`answer-display${done ? (status === 'wrong' ? ' is-wrong' : ' is-right') : ''}`} dir="ltr" aria-label="התשובה שלך" aria-live="polite">
              {answer || <span className="placeholder">?</span>}
            </div>
            {!done && <Keypad onKey={press} time={isTime}/>}
          </>}

        {!done && <div className="practice-actions">
          {!hintShown && <button type="button" className="btn btn-hint" onClick={() => { setHintShown(true); hintUsed.current = true; }}><Lightbulb size={19}/> רמז</button>}
          <button type="button" className="btn btn-primary btn-grow" disabled={!answer.trim()} onClick={check}>בדיקה <Check size={20}/></button>
        </div>}

        {done && <div className={`solution solution-${status}`}>
          <div className="solution-answer">התשובה הנכונה: <strong><AnswerText text={q.answer}/></strong></div>
          <p><MathText text={q.solution}/></p>
          <button type="button" className="btn btn-primary btn-wide" autoFocus onClick={next}>{isLast ? 'לסיכום האימון' : 'לשאלה הבאה'} <ArrowLeft size={20}/></button>
        </div>}
      </div>
    </div>
  </section>;
}
