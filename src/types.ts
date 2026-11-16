export type Level = 1 | 2 | 3;
export type Visual = {
  kind: 'array' | 'angle' | 'angles' | 'triangle' | 'clock' | 'grid' | 'twoGrids' | 'bars' | 'doubleBars' | 'table' | 'pictogram' | 'net' | 'place' | 'none';
  a?: number; b?: number; c?: number; d?: number;
  degrees?: number; degrees2?: number;
  h?: number; m?: number;
  labels?: string[]; values?: number[]; values2?: number[];
  triangle?: 'equilateral' | 'isosceles' | 'scalene' | 'right' | 'obtuse';
  valid?: boolean;
  number?: number; cells?: [number,number][];
};
export type Question = {
  id: string; prompt: string; expression?: string;
  answer: string; options?: string[];
  hint: string; solution: string; visual?: Visual;
  input?: 'number' | 'text' | 'choice';
};
export type Worked = { prompt: string; answer: string; explanation: string; visual?: Visual };
export type Lesson = {
  id: string; book: 9 | 10 | 11 | 12 | 'cross'; chapter: string;
  title: string; subtitle: string; objective: string;
  steps: string[]; worked: Worked[]; generator: string;
  tag?: 'core' | 'cross' | 'optional';
  config?: Record<string, number | string | number[]>;
};
export type Chapter = {
  id: string; book: 9 | 10 | 11 | 12 | 'cross'; title: string; desc: string;
  accent: string; icon: string; lessons: Lesson[];
};
export type AnswerLog = {
  at: number; lessonId: string; correct: boolean; seconds: number; hintUsed: boolean;
};
export type LessonStats = { attempts: number; correct: number; bestStreak: number; stars: number; lastPlayed: number };
export type Progress = {
  version: 1; learner: string; stats: Record<string, LessonStats>; logs: AnswerLog[]; 
  rewards: number; currentLesson?: string;
};
