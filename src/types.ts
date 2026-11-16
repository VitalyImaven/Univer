export type Level = 1 | 2 | 3;
export type BookId = 9 | 10 | 11 | 12 | 'cross';

export type Visual = {
  kind: 'array' | 'angle' | 'angles' | 'triangle' | 'clock' | 'grid' | 'twoGrids' | 'bars' | 'doubleBars'
    | 'table' | 'pictogram' | 'net' | 'place' | 'numberLine' | 'none';
  a?: number; b?: number; c?: number; d?: number;
  degrees?: number; degrees2?: number;
  h?: number; m?: number;
  labels?: string[]; values?: number[]; values2?: number[];
  triangle?: 'equilateral' | 'isosceles' | 'scalene' | 'right' | 'obtuse';
  /** Side lengths (cm) printed next to the triangle sides: [left, right, bottom]. */
  sides?: number[];
  valid?: boolean;
  number?: number; cells?: [number, number][];
  /** numberLine: tick values, `missing` is the index of the hidden tick. */
  ticks?: number[]; missing?: number;
};

export type Question = {
  id: string; prompt: string; expression?: string;
  answer: string; options?: string[];
  hint: string; solution: string; visual?: Visual;
  input?: 'number' | 'text' | 'choice';
};

export type Worked = { prompt: string; answer: string; explanation: string; visual?: Visual };

export type Lesson = {
  id: string; book: BookId; chapter: string;
  title: string; subtitle: string; objective: string;
  steps: string[]; worked: Worked[]; generator: string;
  tag?: 'core' | 'cross' | 'optional';
  config?: Record<string, number | string | number[]>;
};

export type Chapter = {
  id: string; book: BookId; title: string; desc: string;
  accent: string; icon: string; lessons: Lesson[];
};

export type AnswerLog = {
  at: number; lessonId: string; correct: boolean; seconds: number; hintUsed: boolean;
};

export type LessonStats = { attempts: number; correct: number; bestStreak: number; stars: number; lastPlayed: number };

export type DayStats = { answers: number; correct: number; daily?: boolean };

/** Progress of one learner. `version: 1` is also the backup-file format. */
export type Progress = {
  version: 1; learner: string; stats: Record<string, LessonStats>; logs: AnswerLog[];
  rewards: number; currentLesson?: string;
  /** Activity per local calendar day, key = YYYY-MM-DD. */
  days: Record<string, DayStats>;
  /** Earned badges: badge id -> timestamp. */
  badges: Record<string, number>;
  /** Counters that cannot be derived from stats/logs. */
  counters: { sessions: number; perfectSessions: number; noHintSessions: number; bestRun: number; dailyDone: number };
  avatar?: string;
};

export type Profile = { id: string; createdAt: number; progress: Progress };

export type Settings = { sound: boolean; fontLarge: boolean; level: Level; roundLength: number };

export type Store = { version: 2; activeId: string | null; profiles: Profile[]; settings: Settings };
