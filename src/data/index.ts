import course from './course.json';
import type { BookId, Chapter, Lesson } from '../types';

export const chapters: Chapter[] = course as unknown as Chapter[];
export const lessons: Lesson[] = chapters.flatMap(x => x.lessons);
export const lessonById = new Map(lessons.map(l => [l.id, l]));
export const chapterById = new Map(chapters.map(c => [c.id, c]));

export type BookMeta = { id: BookId; key: string; label: string; name: string; desc: string; color: string; emoji: string };
export const BOOKS: BookMeta[] = [
  { id: 9, key: '9', label: 'ספר 9', name: 'המסע מתחיל', desc: 'כפל, חילוק, מספרים עד 1,000 וזוויות', color: '#7b5cf0', emoji: '🚀' },
  { id: 10, key: '10', label: 'ספר 10', name: 'עולים שלב', desc: 'סדר פעולות, המרות ומשולשים', color: '#ff8a4c', emoji: '🧗' },
  { id: 11, key: '11', label: 'ספר 11', name: 'מספרים גדולים', desc: 'מספרים עד 10,000 ומדידת שטח', color: '#12b39d', emoji: '🔭' },
  { id: 12, key: '12', label: 'ספר 12', name: 'כמעט אלופים', desc: 'אומדן, גימטרייה, שטח ותיבות', color: '#3f8ef5', emoji: '🏆' },
  { id: 'cross', key: 'cross', label: 'לאורך השנה', name: 'תרגול לאורך השנה', desc: 'נתונים, בעיות מילוליות ומיומנויות', color: '#f0569b', emoji: '🎒' },
];
export const bookOf = (id: BookId): BookMeta => BOOKS.find(b => b.id === id) || BOOKS[0];
