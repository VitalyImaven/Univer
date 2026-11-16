import type { AnswerLog, DayStats, LessonStats, Level, Profile, Progress, Settings, Store } from '../types';

const KEY = 'math-kef-store-v2';
const LEGACY_KEY = 'math-kef-grade3-progress-v1';
const MAX_LOGS = 2000;

export const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🐵', '🦄', '🐙', '🐬', '🦖', '🚀', '🤖'];
export const DEFAULT_NAME = 'אלוף המתמטיקה';

const pad = (n: number) => String(n).padStart(2, '0');
/** Local calendar day, e.g. 2026-11-16. */
export function dayKey(time: number = Date.now()): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const blankCounters = () => ({ sessions: 0, perfectSessions: 0, noHintSessions: 0, bestRun: 0, dailyDone: 0 });

export function blankProgress(learner = DEFAULT_NAME, avatar = AVATARS[0]): Progress {
  return { version: 1, learner, stats: {}, logs: [], rewards: 0, days: {}, badges: {}, counters: blankCounters(), avatar };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/** Validates untrusted data (localStorage or an imported backup file) and fills in
 *  fields that older backups did not have. Returns null when the data is not a backup. */
export function normalizeProgress(data: unknown): Progress | null {
  if (!isRecord(data) || data.version !== 1 || !isRecord(data.stats) || !Array.isArray(data.logs)) return null;
  const stats: Record<string, LessonStats> = {};
  for (const [id, raw] of Object.entries(data.stats)) {
    if (!isRecord(raw)) continue;
    const attempts = Math.max(0, num(raw.attempts));
    stats[id] = {
      attempts, correct: Math.min(attempts, Math.max(0, num(raw.correct))), bestStreak: Math.max(0, num(raw.bestStreak)),
      stars: Math.min(3, Math.max(0, Math.round(num(raw.stars)))), lastPlayed: num(raw.lastPlayed),
    };
  }
  const logs: AnswerLog[] = [];
  for (const raw of data.logs.slice(-MAX_LOGS)) {
    if (!isRecord(raw) || typeof raw.lessonId !== 'string') continue;
    logs.push({ at: num(raw.at), lessonId: raw.lessonId, correct: raw.correct === true, seconds: num(raw.seconds), hintUsed: raw.hintUsed === true });
  }
  const days: Record<string, DayStats> = {};
  if (isRecord(data.days)) {
    for (const [key, raw] of Object.entries(data.days)) {
      if (!isRecord(raw) || !/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
      days[key] = { answers: num(raw.answers), correct: num(raw.correct), ...(raw.daily === true ? { daily: true } : {}) };
    }
  } else {
    // Older backups: rebuild the daily activity from the answer log.
    for (const log of logs) {
      const key = dayKey(log.at), day = days[key] || { answers: 0, correct: 0 };
      days[key] = { ...day, answers: day.answers + 1, correct: day.correct + (log.correct ? 1 : 0) };
    }
  }
  const badges: Record<string, number> = {};
  if (isRecord(data.badges)) for (const [id, at] of Object.entries(data.badges)) if (typeof at === 'number') badges[id] = at;
  const rawCounters = isRecord(data.counters) ? data.counters : {};
  const counters = blankCounters();
  for (const key of Object.keys(counters) as (keyof typeof counters)[]) counters[key] = Math.max(0, num(rawCounters[key]));
  const learner = typeof data.learner === 'string' && data.learner.trim() ? data.learner.trim().slice(0, 24) : DEFAULT_NAME;
  const avatar = typeof data.avatar === 'string' && AVATARS.includes(data.avatar) ? data.avatar : AVATARS[0];
  return {
    version: 1, learner, stats, logs, rewards: Math.max(0, num(data.rewards)), days, badges, counters, avatar,
    ...(typeof data.currentLesson === 'string' ? { currentLesson: data.currentLesson } : {}),
  };
}

export const defaultSettings = (): Settings => ({ sound: true, fontLarge: false, level: 2, roundLength: 10 });
export const blankStore = (): Store => ({ version: 2, activeId: null, profiles: [], settings: defaultSettings() });

let idCounter = 0;
export function newProfile(name: string, avatar: string, progress?: Progress): Profile {
  const base = progress || blankProgress();
  return {
    id: `p${Date.now().toString(36)}${(idCounter++).toString(36)}`, createdAt: Date.now(),
    progress: { ...base, learner: name.trim().slice(0, 24) || DEFAULT_NAME, avatar },
  };
}

function normalizeStore(data: unknown): Store | null {
  if (!isRecord(data) || data.version !== 2 || !Array.isArray(data.profiles)) return null;
  const profiles: Profile[] = [];
  for (const raw of data.profiles) {
    if (!isRecord(raw) || typeof raw.id !== 'string') continue;
    const progress = normalizeProgress(raw.progress);
    if (progress) profiles.push({ id: raw.id, createdAt: num(raw.createdAt), progress });
  }
  const s = isRecord(data.settings) ? data.settings : {};
  const settings: Settings = {
    sound: s.sound !== false, fontLarge: s.fontLarge === true,
    level: ([1, 2, 3] as Level[]).includes(s.level as Level) ? (s.level as Level) : 2,
    roundLength: [0, 10, 20, 50].includes(s.roundLength as number) ? (s.roundLength as number) : 10,
  };
  const activeId = typeof data.activeId === 'string' && profiles.some(p => p.id === data.activeId) ? data.activeId : null;
  return { version: 2, activeId, profiles, settings };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalizeStore(JSON.parse(raw)) || blankStore();
    // One-time migration from the single-learner format of version 1.0.
    const legacy = localStorage.getItem(LEGACY_KEY);
    const progress = legacy ? normalizeProgress(JSON.parse(legacy)) : null;
    if (progress) {
      const profile = newProfile(progress.learner, progress.avatar || AVATARS[0], progress);
      return { ...blankStore(), activeId: profile.id, profiles: [profile] };
    }
  } catch { /* corrupted or unavailable storage: start fresh */ }
  return blankStore();
}

/** Returns false when the browser refused to store (private mode, quota). */
export function saveStore(store: Store): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(store)); return true; } catch { return false; }
}

export function registerAnswer(progress: Progress, log: AnswerLog): Progress {
  const old = progress.stats[log.lessonId] || { attempts: 0, correct: 0, bestStreak: 0, stars: 0, lastPlayed: 0 };
  const logs = [...progress.logs.slice(-(MAX_LOGS - 1)), log];
  let streak = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].lessonId !== log.lessonId) continue;
    if (!logs[i].correct) break;
    streak++;
  }
  const stats: LessonStats = {
    attempts: old.attempts + 1, correct: old.correct + (log.correct ? 1 : 0),
    bestStreak: Math.max(old.bestStreak, streak), stars: old.stars, lastPlayed: log.at,
  };
  const key = dayKey(log.at), day = progress.days[key] || { answers: 0, correct: 0 };
  return {
    ...progress, currentLesson: log.lessonId, stats: { ...progress.stats, [log.lessonId]: stats }, logs,
    days: { ...progress.days, [key]: { ...day, answers: day.answers + 1, correct: day.correct + (log.correct ? 1 : 0) } },
    rewards: progress.rewards + (log.correct ? 10 : 2),
  };
}

/** Stars are only ever raised, never taken away. */
export function setStars(progress: Progress, lessonId: string, stars: number): Progress {
  const prior = progress.stats[lessonId];
  if (!prior) return progress;
  return { ...progress, stats: { ...progress.stats, [lessonId]: { ...prior, stars: Math.max(prior.stars, stars) } } };
}

export const MIN_QUESTIONS_FOR_STARS = 5;
export function starsFor(answered: number, correct: number): number {
  if (answered < MIN_QUESTIONS_FOR_STARS) return 0;
  const accuracy = correct / answered;
  return accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy >= 0.4 ? 1 : 0;
}

export type SessionOutcome = { lessonId?: string; answered: number; correct: number; hintsUsed: number; bestRun: number; daily?: boolean };

export function finishSession(progress: Progress, s: SessionOutcome, now: number = Date.now()): Progress {
  if (s.answered === 0) return progress;
  let next = progress;
  if (s.lessonId) next = setStars(next, s.lessonId, starsFor(s.answered, s.correct));
  const full = s.answered >= 10;
  const counters = {
    ...next.counters,
    sessions: next.counters.sessions + 1,
    bestRun: Math.max(next.counters.bestRun, s.bestRun),
    perfectSessions: next.counters.perfectSessions + (full && s.correct === s.answered ? 1 : 0),
    noHintSessions: next.counters.noHintSessions + (full && s.hintsUsed === 0 && s.correct / s.answered >= 0.8 ? 1 : 0),
    dailyDone: next.counters.dailyDone + (s.daily ? 1 : 0),
  };
  const key = dayKey(now), day = next.days[key] || { answers: 0, correct: 0 };
  return { ...next, counters, days: s.daily ? { ...next.days, [key]: { ...day, daily: true } } : next.days };
}

export function summary(progress: Progress) {
  const all = Object.values(progress.stats);
  const total = all.reduce((n, x) => n + x.attempts, 0), correct = all.reduce((n, x) => n + x.correct, 0);
  return {
    played: all.filter(x => x.attempts > 0).length, mastered: all.filter(x => x.stars >= 2).length,
    total, correct, accuracy: total ? Math.round(correct / total * 100) : 0,
    days: Object.values(progress.days).filter(d => d.answers > 0).length,
  };
}

const LEVELS: [number, string][] = [
  [0, 'מתחילים במסע'], [100, 'חוקרי מספרים'], [300, 'חברי לוח הכפל'], [600, 'פותרי חידות'], [1000, 'אלופי החישוב'],
  [1500, 'קוסמי המספרים'], [2200, 'גיבורי הגאומטריה'], [3000, 'מאסטר מתמטיקה'], [4000, 'כוכבי הכיתה'], [5500, 'אגדת המתמטיקה'],
];
/** Friendly "level" derived from collected points; there is no way to lose a level. */
export function levelInfo(rewards: number) {
  let index = 0;
  while (index + 1 < LEVELS.length && rewards >= LEVELS[index + 1][0]) index++;
  const floor = LEVELS[index][0], next = index + 1 < LEVELS.length ? LEVELS[index + 1][0] : null;
  return { number: index + 1, title: LEVELS[index][1], next, percent: next ? Math.round((rewards - floor) / (next - floor) * 100) : 100 };
}
