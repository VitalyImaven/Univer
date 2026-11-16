/** Zero-third-party curriculum and question validation. Run with Node 22+:
 * npm run validate:content
 */
import fs from 'node:fs';
import { createQuestion, answerIsCorrect, normalizeAnswer } from '../src/engine/questions.ts';
import { HEXOMINOES, CUBE_NETS, NON_CUBE_NETS, isCubeNet } from '../src/engine/cubenets.ts';
const course=JSON.parse(fs.readFileSync(new URL('../src/data/course.json',import.meta.url),'utf8'));
const lessons=course.flatMap(c=>c.lessons);
const seen=new Set(); let checks=0, errors=[], choiceCount=0, visualCount=0, maxA=0;
function assert(condition,message){if(!condition&&errors.length<50)errors.push(message);}
assert(lessons.length>=70,`Only ${lessons.length} lessons`);
assert(HEXOMINOES.length===35,`Expected 35 free hexominoes, found ${HEXOMINOES.length}`);
assert(CUBE_NETS.length===11,`Expected 11 cube nets, found ${CUBE_NETS.length}`);
assert(NON_CUBE_NETS.length===24,`Expected 24 non-cube nets, found ${NON_CUBE_NETS.length}`);
for(const chapter of course){
  assert(chapter.lessons.length>=3,`Empty chapter: ${chapter.id}`);
  for(const lesson of chapter.lessons){
    assert(!seen.has(lesson.id),`Duplicate lesson: ${lesson.id}`);seen.add(lesson.id);
    assert(lesson.steps.length>=2&&lesson.steps.every(x=>x.length>22),`Lesson explanation too shallow: ${lesson.id}`);
    assert(lesson.worked.length>0&&lesson.worked[0].explanation,`Missing worked solution: ${lesson.id}`);
    const uniq=new Set();
    for(const level of [1,2,3])for(let seed=0;seed<100;seed++){
      try{
        const q=createQuestion(lesson,level,seed);checks++;
        assert(q.prompt.length>=8&&q.answer.length>0&&q.hint.length>6&&q.solution.length>=8,`Incomplete question ${lesson.id}/${level}/${seed}`);
        assert(answerIsCorrect(q.answer,q.answer),`Normalization fail ${lesson.id}`);
        assert(q.answer!=='NaN'&&q.answer!=='Infinity'&&!/^-/g.test(q.answer),`Bad answer ${lesson.id}: ${q.answer}`);
        if(q.options){choiceCount++;assert(q.options.includes(q.answer),`Correct option absent ${lesson.id}: ${q.answer}; options=${q.options}`);assert(q.options.length===new Set(q.options).size,`Duplicate options ${lesson.id}`);}
        if(q.visual){visualCount++;if(q.visual.kind==='net')assert(isCubeNet(q.visual.cells)===q.visual.valid,`Net error ${lesson.id}/${seed}`);}
        const n=Number(normalizeAnswer(q.answer));if(Number.isFinite(n))maxA=Math.max(maxA,n);
        if(n>10000)assert(false,`Answer above 10,000 in ${lesson.id}: ${n}`);
        uniq.add(q.prompt+'|'+q.expression+'|'+q.answer+'|'+JSON.stringify(q.visual));
      }catch(error){assert(false,`${lesson.id}/${level}/${seed}: ${String(error)}`);}
    }
    assert(uniq.size>=3,`Insufficient variation ${lesson.id}: only ${uniq.size} variants`);
  }
}
console.log(`Validated ${course.length} chapters, ${lessons.length} lessons, ${checks.toLocaleString()} generated questions`);
console.log(`${choiceCount.toLocaleString()} multiple-choice questions, ${visualCount.toLocaleString()} visual questions; maximum numeric answer ${maxA}`);
console.log(`Cube-net verifier: ${HEXOMINOES.length} hexominoes = ${CUBE_NETS.length} valid + ${NON_CUBE_NETS.length} invalid`);
if(errors.length){console.error('VALIDATION FAILED:',errors.slice(0,25));process.exit(1);}
console.log('PASS: lesson metadata, question answers, answer options, shapes, domain limits.');
