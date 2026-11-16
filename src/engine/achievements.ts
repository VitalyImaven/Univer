import type { Chapter, Progress } from '../types';

export type Badge = {
  id: string; emoji: string; title: string; desc: string; color: string;
  earned: (p: Progress, chapters: Chapter[]) => boolean;
};

const totalCorrect = (p: Progress) => Object.values(p.stats).reduce((n, s) => n + s.correct, 0);
const totalAnswers = (p: Progress) => Object.values(p.stats).reduce((n, s) => n + s.attempts, 0);
const lessonsWithStars = (p: Progress, stars: number) => Object.values(p.stats).filter(s => s.stars >= stars).length;
const activeDays = (p: Progress) => Object.values(p.days).filter(d => d.answers > 0).length;
const chapterDone = (p: Progress, c: Chapter) => c.lessons.every(l => (p.stats[l.id]?.stars || 0) >= 2);

/** Only positive achievements: nothing here can be lost, and nothing depends on speed. */
export const BADGES: Badge[] = [
  { id: 'first-answer', emoji: '🌱', title: 'צעד ראשון', desc: 'ענית על השאלה הראשונה', color: '#7ed6a5', earned: p => totalAnswers(p) >= 1 },
  { id: 'correct-10', emoji: '⭐', title: '10 נכונות', desc: '10 תשובות נכונות', color: '#ffd166', earned: p => totalCorrect(p) >= 10 },
  { id: 'correct-50', emoji: '🌟', title: '50 נכונות', desc: '50 תשובות נכונות', color: '#ffb84d', earned: p => totalCorrect(p) >= 50 },
  { id: 'correct-100', emoji: '💯', title: 'מאה!', desc: '100 תשובות נכונות', color: '#ff8fab', earned: p => totalCorrect(p) >= 100 },
  { id: 'correct-500', emoji: '🏆', title: 'אלופי התרגול', desc: '500 תשובות נכונות', color: '#f4a261', earned: p => totalCorrect(p) >= 500 },
  { id: 'run-5', emoji: '🔥', title: 'רצף של 5', desc: '5 תשובות נכונות ברצף', color: '#ff9770', earned: p => p.counters.bestRun >= 5 },
  { id: 'run-10', emoji: '⚡', title: 'רצף של 10', desc: '10 תשובות נכונות ברצף', color: '#ffe066', earned: p => p.counters.bestRun >= 10 },
  { id: 'stars-3', emoji: '🥇', title: 'שלושה כוכבים', desc: 'שיעור אחד עם 3 כוכבים', color: '#ffd166', earned: p => lessonsWithStars(p, 3) >= 1 },
  { id: 'lessons-5', emoji: '📚', title: '5 שיעורים', desc: '5 שיעורים עם 2 כוכבים ומעלה', color: '#9db4ff', earned: p => lessonsWithStars(p, 2) >= 5 },
  { id: 'lessons-20', emoji: '🎓', title: '20 שיעורים', desc: '20 שיעורים עם 2 כוכבים ומעלה', color: '#b39dff', earned: p => lessonsWithStars(p, 2) >= 20 },
  { id: 'chapter', emoji: '🧩', title: 'יחידה שלמה', desc: 'כל השיעורים ביחידה אחת הושלמו', color: '#7fd8e8', earned: (p, ch) => ch.some(c => chapterDone(p, c)) },
  { id: 'times-table', emoji: '✖️', title: 'אלופי לוח הכפל', desc: 'כל שיעורי לוח הכפל הושלמו', color: '#c8a2ff', earned: (p, ch) => ch.filter(c => c.id === 'b9-mul').some(c => chapterDone(p, c)) },
  { id: 'explorer', emoji: '🧭', title: 'סקרנים', desc: 'ניסית 10 שיעורים שונים', color: '#8fe0c2', earned: p => Object.values(p.stats).filter(s => s.attempts > 0).length >= 10 },
  { id: 'days-3', emoji: '📅', title: '3 ימי תרגול', desc: 'תרגלת ב־3 ימים שונים', color: '#a0d2ff', earned: p => activeDays(p) >= 3 },
  { id: 'days-7', emoji: '🗓️', title: '7 ימי תרגול', desc: 'תרגלת ב־7 ימים שונים', color: '#84b6ff', earned: p => activeDays(p) >= 7 },
  { id: 'daily', emoji: '🎯', title: 'אתגר יומי', desc: 'סיימת את האתגר היומי', color: '#ff9eb5', earned: p => p.counters.dailyDone >= 1 },
  { id: 'no-hint', emoji: '🧠', title: 'בלי רמזים', desc: 'אימון שלם בלי להשתמש ברמז', color: '#d6b3ff', earned: p => p.counters.noHintSessions >= 1 },
  { id: 'perfect', emoji: '💎', title: 'אימון מושלם', desc: 'אימון של 10 שאלות בלי אף טעות', color: '#8ee3f5', earned: p => p.counters.perfectSessions >= 1 },
];

/** Adds every badge whose condition now holds. Returns the same object when nothing changed. */
export function awardBadges(progress: Progress, chapters: Chapter[], now: number = Date.now()): Progress {
  const fresh = BADGES.filter(b => !progress.badges[b.id] && b.earned(progress, chapters));
  if (!fresh.length) return progress;
  const badges = { ...progress.badges };
  for (const b of fresh) badges[b.id] = now;
  return { ...progress, badges };
}
