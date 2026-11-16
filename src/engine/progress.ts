import type { Progress, AnswerLog, LessonStats } from '../types';
const KEY = 'math-kef-grade3-progress-v1';
export const blankProgress = ():Progress=>({version:1,learner:'אלוף המתמטיקה',stats:{},logs:[],rewards:0});
export function loadProgress():Progress {
  try {const raw=localStorage.getItem(KEY); if(!raw)return blankProgress();
    const data=JSON.parse(raw) as Progress;
    if(data.version!==1||!data.stats||!Array.isArray(data.logs))return blankProgress();
    return {...blankProgress(),...data};
  } catch{return blankProgress();}
}
export function saveProgress(p:Progress){try{localStorage.setItem(KEY,JSON.stringify(p));}catch{/* disabled storage */}}
export function registerAnswer(progress:Progress, log:AnswerLog): Progress {
  const old=progress.stats[log.lessonId]||{attempts:0,correct:0,bestStreak:0,stars:0,lastPlayed:0};
  const logs=[...progress.logs.slice(-1999),log];
  let streak=0;
  for(let i=logs.length-1;i>=0;i--) {
    if(logs[i].lessonId!==log.lessonId)continue;
    if(!logs[i].correct)break;
    streak++;
  }
  const stats:LessonStats={attempts:old.attempts+1,correct:old.correct+(log.correct?1:0),bestStreak:Math.max(old.bestStreak,streak),stars:old.stars,lastPlayed:log.at};
  return {...progress,currentLesson:log.lessonId,stats:{...progress.stats,[log.lessonId]:stats},logs,rewards:progress.rewards+(log.correct?10:2)};
}
export function setStars(progress:Progress,lessonId:string,stars:number):Progress {
  const prior=progress.stats[lessonId];
  if(!prior)return progress;
  return {...progress,stats:{...progress.stats,[lessonId]:{...prior,stars:Math.max(prior.stars,stars)}}};
}
export function summary(progress:Progress){
  const played=Object.values(progress.stats).filter(x=>x.attempts>0).length;
  const mastered=Object.values(progress.stats).filter(x=>x.stars>=2).length;
  const total=Object.values(progress.stats).reduce((n,x)=>n+x.attempts,0);
  const correct=Object.values(progress.stats).reduce((n,x)=>n+x.correct,0);
  return {played,mastered,total,correct,accuracy:total?Math.round(correct/total*100):0};
}
