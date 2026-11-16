import { describe, expect, it } from 'vitest';
import course from '../../src/data/course.json';
import { awardBadges, BADGES } from '../../src/engine/achievements';
import { CUBE_NETS, HEXOMINOES, isCubeNet } from '../../src/engine/cubenets';
import { splitMath } from '../../src/engine/mathtext';
import { blankProgress, dayKey, finishSession, levelInfo, normalizeProgress, registerAnswer, setStars, starsFor, summary } from '../../src/engine/progress';
import { answerIsCorrect, createQuestion, normalizeAnswer } from '../../src/engine/questions';
import type { Chapter, Level, Progress } from '../../src/types';

const chapters = course as unknown as Chapter[];
const lessons = chapters.flatMap(c => c.lessons);
const math = (text: string) => splitMath(text).filter(s => s.math).map(s => s.text);

describe('curriculum', () => {
  it('keeps the full course: 15 units, 78 lessons, unique ids', () => {
    expect(chapters).toHaveLength(15);
    expect(lessons).toHaveLength(78);
    expect(new Set(lessons.map(l => l.id)).size).toBe(78);
  });
});

describe('question generators', () => {
  it('are deterministic for the same lesson, level and seed', () => {
    for (const lesson of lessons) expect(createQuestion(lesson, 2, 7)).toEqual(createQuestion(lesson, 2, 7));
  });

  it('produce complete, self-consistent questions for every lesson and level', () => {
    for (const lesson of lessons) for (const level of [1, 2, 3] as Level[]) for (let seed = 0; seed < 40; seed++) {
      const q = createQuestion(lesson, level, seed), where = `${lesson.id}/${level}/${seed}`;
      expect(q.prompt.length, where).toBeGreaterThan(7);
      expect(q.hint.length, where).toBeGreaterThan(6);
      expect(q.solution.length, where).toBeGreaterThan(7);
      expect(q.answer, where).not.toMatch(/NaN|Infinity|undefined|^-/);
      expect(answerIsCorrect(q.answer, q.answer), where).toBe(true);
      if (q.options) {
        expect(q.options.filter(o => o === q.answer), where).toHaveLength(1);
        expect(new Set(q.options).size, where).toBe(q.options.length);
      }
      if (q.visual?.kind === 'net') expect(isCubeNet(q.visual.cells!), where).toBe(q.visual.valid);
      if (q.visual?.kind === 'numberLine') expect(String(q.visual.ticks![q.visual.missing!]), where).toBe(q.answer);
    }
  });

  it('does not always put the correct inequality answer first', () => {
    const lesson = lessons.find(l => l.generator === 'inequality')!;
    const positions = new Set(Array.from({ length: 40 }, (_, seed) => { const q = createQuestion(lesson, 2, seed); return q.options!.indexOf(q.answer); }));
    expect(positions.size).toBeGreaterThan(1);
  });

  it('enumerates exactly 11 cube nets out of 35 hexominoes', () => {
    expect(HEXOMINOES).toHaveLength(35);
    expect(CUBE_NETS).toHaveLength(11);
  });
});

describe('answer checking', () => {
  it('normalises spacing, separators, minus signs and other numeral systems', () => {
    expect(normalizeAnswer(' 1,234 ')).toBe('1234');
    expect(answerIsCorrect('007', '7')).toBe(true);
    expect(answerIsCorrect('١٢', '12')).toBe(true);
    expect(answerIsCorrect('13', '12')).toBe(false);
  });
  it('accepts common ways to write a clock time', () => {
    for (const typed of ['3:25', '03:25', '3.25', '325']) expect(answerIsCorrect(typed, '3:25'), typed).toBe(true);
    for (const typed of ['3:52', '32:5', '3', '']) expect(answerIsCorrect(typed, '3:25'), typed).toBe(false);
    expect(answerIsCorrect('1230', '12:30')).toBe(true);
  });
});

describe('math direction inside Hebrew text', () => {
  it('isolates arithmetic but leaves the Hebrew question mark outside', () => {
    expect(splitMath('כמה הם 12 ÷ 3?')).toEqual([{ text: 'כמה הם ', math: false }, { text: '12 ÷ 3', math: true }, { text: '?', math: false }]);
    expect(math('234+152 = ?')).toEqual(['234+152 = ?']);
  });
  it('treats each statement of a list separately and keeps sequences together', () => {
    expect(math('6×2=12, 12×2=24, 24×2=48.')).toEqual(['6×2=12', '12×2=24', '24×2=48']);
    expect(math('השלימו: 120, 140, 160, __')).toEqual(['120, 140, 160, __']);
    expect(math('345 < 678.')).toEqual(['345 < 678']);
  });
  it('leaves plain numbers and times alone', () => {
    expect(math('השיעור התחיל ב־8:15 ונמשך 30 דקות.')).toEqual([]);
    expect(math('כפולות 2 הן זוגיות: 2, 4, 6...')).toEqual([]);
  });
});

describe('progress', () => {
  const answer = (p: Progress, lessonId: string, correct: boolean, at = Date.now()) => registerAnswer(p, { at, lessonId, correct, seconds: 5, hintUsed: false });

  it('records each answer once with points, streak and daily activity', () => {
    let p = blankProgress('נועה');
    p = answer(p, 'mul-7', true); p = answer(p, 'mul-7', true); p = answer(p, 'mul-7', false);
    expect(p.stats['mul-7']).toMatchObject({ attempts: 3, correct: 2, bestStreak: 2 });
    expect(p.rewards).toBe(22);
    expect(p.days[dayKey()]).toMatchObject({ answers: 3, correct: 2 });
    expect(summary(p)).toMatchObject({ total: 3, correct: 2, accuracy: 67, played: 1, days: 1 });
  });

  it('awards stars only after enough questions and never lowers them', () => {
    expect(starsFor(4, 4)).toBe(0);
    expect([starsFor(10, 10), starsFor(10, 8), starsFor(10, 5), starsFor(10, 2)]).toEqual([3, 2, 1, 0]);
    let p = answer(blankProgress(), 'mul-7', true);
    p = setStars(p, 'mul-7', 3); p = setStars(p, 'mul-7', 1);
    expect(p.stats['mul-7'].stars).toBe(3);
  });

  it('finishes a session: stars, counters and the daily flag', () => {
    let p = answer(blankProgress(), 'mul-7', true);
    p = finishSession(p, { lessonId: 'mul-7', answered: 10, correct: 10, hintsUsed: 0, bestRun: 10 });
    expect(p.stats['mul-7'].stars).toBe(3);
    expect(p.counters).toMatchObject({ sessions: 1, perfectSessions: 1, noHintSessions: 1, bestRun: 10 });
    p = finishSession(p, { answered: 10, correct: 6, hintsUsed: 2, bestRun: 3, daily: true });
    expect(p.counters.dailyDone).toBe(1);
    expect(p.days[dayKey()].daily).toBe(true);
    expect(finishSession(p, { answered: 0, correct: 0, hintsUsed: 0, bestRun: 0 })).toBe(p);
  });

  it('awards badges once and keeps them', () => {
    let p = awardBadges(answer(blankProgress(), 'mul-7', true), chapters, 1000);
    expect(p.badges['first-answer']).toBe(1000);
    const again = awardBadges(p, chapters, 2000);
    expect(again).toBe(p);
    for (let i = 0; i < 9; i++) p = answer(p, 'mul-7', true);
    p = awardBadges(p, chapters, 3000);
    expect(p.badges['correct-10']).toBe(3000);
    expect(new Set(BADGES.map(b => b.id)).size).toBe(BADGES.length);
  });

  it('computes levels from points', () => {
    expect(levelInfo(0)).toMatchObject({ number: 1, percent: 0, next: 100 });
    expect(levelInfo(150)).toMatchObject({ number: 2, percent: 25 });
    expect(levelInfo(999999).next).toBeNull();
  });

  it('round-trips a backup and upgrades the 1.0 backup format', () => {
    const p = finishSession(answer(blankProgress('דני', '🐼'), 'mul-7', true), { lessonId: 'mul-7', answered: 10, correct: 9, hintsUsed: 0, bestRun: 9 });
    expect(normalizeProgress(JSON.parse(JSON.stringify(p)))).toEqual(p);
    const old = { version: 1, learner: 'דני', rewards: 12, stats: { 'mul-7': { attempts: 2, correct: 1, bestStreak: 1, stars: 9, lastPlayed: 5 } }, logs: [{ at: Date.now(), lessonId: 'mul-7', correct: true, seconds: 3, hintUsed: false }] };
    const upgraded = normalizeProgress(old)!;
    expect(upgraded.stats['mul-7'].stars).toBe(3);
    expect(upgraded.days[dayKey()]).toMatchObject({ answers: 1, correct: 1 });
    expect(upgraded.counters.sessions).toBe(0);
  });

  it('rejects files that are not backups', () => {
    for (const bad of [null, 5, 'x', [], {}, { version: 2, stats: {}, logs: [] }, { version: 1, stats: [], logs: [] }, { version: 1, stats: {} }]) expect(normalizeProgress(bad)).toBeNull();
  });
});
