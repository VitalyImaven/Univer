import course from './course.json';
import type { Chapter } from '../types';
export const chapters:Chapter[]=course as unknown as Chapter[];
export const lessons=chapters.flatMap(x=>x.lessons);
