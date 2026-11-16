/** Deterministic offline export of ready-to-use questions for every lesson/level.
 * The app does not need this file at runtime: its generator creates new tasks.
 * Use: npm run export:bank
 */
import fs from 'node:fs';
import { createQuestion } from '../src/engine/questions.ts';
const course=JSON.parse(fs.readFileSync(new URL('../src/data/course.json',import.meta.url),'utf8'));
const perLevel=Number(process.env.PER_LEVEL||60);
const bank={
  meta:{project:'מתמטיקה בכיף',grade:3,locale:'he-IL',source:'Original tasks generated from reviewed lesson specifications',perLevel,created:'2026-11-16',note:'This is a reproducible snapshot. The app also generates tasks without requiring this bank.'},
  lessons:{}
};
let count=0,unique=0;
for (const ch of course) for(const l of ch.lessons){
  const variants=[];const seen=new Set();
  for(const level of [1,2,3])for(let seed=0;seed<perLevel;seed++){
    const q=createQuestion(l,level,seed);
    variants.push({level,seed,...q});count++;
    seen.add(`${level}/${q.prompt}/${q.answer}/${JSON.stringify(q.visual||null)}`);
  }
  unique+=seen.size;
  bank.lessons[l.id]={book:l.book,chapter:ch.id,title:l.title,generator:l.generator,questions:variants,uniqueCount:seen.size};
}
fs.writeFileSync(new URL('../content/question-bank.json',import.meta.url),JSON.stringify(bank),'utf8');
console.log(`Exported ${count} fully-specified questions across ${Object.keys(bank.lessons).length} lessons; ${unique} distinct by question/answer/visual/level.`);
