import type { Lesson, Level, Question, Visual } from '../types';
import { CUBE_NETS, NON_CUBE_NETS, rotateNet } from './cubenets.ts';

const KIDS=[
  {name:'דנה',f:true},{name:'נועה',f:true},{name:'מאיה',f:true},{name:'תמר',f:true},{name:'יעל',f:true},
  {name:'עומר',f:false},{name:'איתי',f:false},{name:'דניאל',f:false},{name:'יונתן',f:false},{name:'אורי',f:false}];
const ITEMS=['מדבקות','קלפים','גולות','בולים','חרוזים'];
/** [containers, one container, items inside] */
const CONTAINERS:[string,string,string][]=[['שקיות','שקית','סוכריות'],['קופסאות','קופסה','עוגיות'],['סלסלות','סלסלה','תפוחים'],['מדפים','מדף','ספרים'],['צלחות','צלחת','ענבים']];

/** All algorithms are deterministic for a given (lesson, level, seed).
 *  This permits QA, reproducible bug reports and large offline question banks.
 */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function makeRandom(seed: number) {
  let state = (seed >>> 0) || 0x12345678;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
export function createQuestion(lesson: Lesson, level: Level, seed: number): Question {
  const rnd = makeRandom(hashSeed(`${lesson.id}:${level}:${seed}`));
  const r = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pick = <T,>(items: T[]): T => items[r(0, items.length - 1)];
  const f = (n: number) => n.toLocaleString('en-US');
  const cfg = lesson.config || {};
  const getN = (key: string, fallback: number) => typeof cfg[key] === 'number' ? cfg[key] as number : fallback;
  const getS = (key: string, fallback: string) => typeof cfg[key] === 'string' ? cfg[key] as string : fallback;
  const shape = (kind: Visual['kind'], extra: Omit<Visual,'kind'> = {}): Visual => ({ kind, ...extra });
  const question = (prompt: string, answer: string | number, solution: string, hint: string, extras: Partial<Question> = {}): Question => ({
    id: `${lesson.id}:${level}:${seed}`, prompt, answer: String(answer), solution, hint,
    input: extras.options ? 'choice' : 'number', ...extras,
  });
  const shuffle = <T,>(items: T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) { const j = r(0, i); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  };
  const yesNo = ['כן','לא'];
  const fmtTime = (t: number) => `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
  const compare = (a: number, b: number) => a > b ? '>' : a < b ? '<' : '=';
  const max = getN('max', 1000);

  switch (lesson.generator) {
    case 'mul': {
      const factors = Array.isArray(cfg.factors) ? cfg.factors as number[] : [];
      const a = factors.length ? pick(factors) : r(getN('min',2),getN('max',10));
      const b = r(level === 1 ? 2 : 3, level === 3 ? 10 : 8);
      const c = a*b;
      const vis = a <= 7 && b <= 8 && (seed % 4 === 0 || lesson.id === 'mul-meaning') ? shape('array',{a,b}) : undefined;
      return question(`כמה הם ${a} × ${b}?`,c,`${a} קבוצות של ${b} הן ${a} × ${b} = ${c}.`,`אפשר לחשב ${b} ועוד ${b} שוב ושוב, ${a} פעמים.`,{expression:`${a} × ${b} = ?`,visual:vis});
    }
    case 'div': {
      const a=r(getN('min',2),getN('max',10)), b=r(2,level === 3 ? 10 : 8), n=a*b;
      return question(`כמה הם ${n} ÷ ${a}?`,b,`${a} × ${b} = ${n}, לכן ${n} ÷ ${a} = ${b}.`,'חפשו איזה מספר כפול המחלק נותן את המחולק.',{expression:`${n} ÷ ${a} = ?`});
    }
    case 'divisibility': {
      const divisor=pick([2,5,10]);
      let n=r(11,level===1 ? 199 : 999);
      if(seed%2===0) n=Math.max(divisor,Math.floor(n/divisor)*divisor);
      else if(n%divisor===0) n+=1;
      const yes=n%divisor===0;
      return question(`האם ${f(n)} מתחלק ב־${divisor} בלי שארית?`,yes?'כן':'לא',`${f(n)} ${yes?'מתחלק':'אינו מתחלק'} ב־${divisor} בלי שארית.`,divisor===2?'בדקו אם ספרת האחדות זוגית.':divisor===5?'האם ספרת האחדות היא 0 או 5?':'האם המספר מסתיים ב־0?',{options:yesNo,input:'choice'});
    }
    case 'compare': {
      const hi=Math.min(max,level===1?Math.min(max,999):max);
      const a=r(90,hi), b=r(90,hi), same=seed%7===0;
      const realB=same?a:b, ans=compare(a,realB);
      return question('איזה סימן מתאים בין שני המספרים?',ans,`${f(a)} ${ans} ${f(realB)}.`,`השוו קודם את הספרה במקום הגדול ביותר.`,{options:['>','<','='],input:'choice',expression:`${f(a)} __ ${f(realB)}`});
    }
    case 'place': {
      const hi=Math.min(max,level===1?Math.min(max,999):max);
      const n=r(hi<1000?101:1001,hi===10000?9999:hi);
      const positions=[1,10,100,...(n>=1000?[1000]:[])];
      const available=positions.filter(p=>Math.floor(n/p)%10!==0);
      const power=pick(available);
      const digit=Math.floor(n/power)%10, value=digit*power;
      return question(`במספר ${f(n)}, מה ערכה של הספרה ${digit} במקום ה${power===1?'אחדות':power===10?'עשרות':power===100?'מאות':'אלפים'}?`,value,`${digit} × ${f(power)} = ${f(value)}.`,`בדקו באיזה טור נמצאת הספרה: אחדות, עשרות, מאות או אלפים.`,{visual:shape('place',{number:n})});
    }
    case 'sequence': {
      const choices=(max<=1000?[2,5,10,20,25,50,100]:[20,25,50,100,200,500,1000]);
      const step=pick(choices.filter(x=>x*5<max));
      const start=r(1,Math.max(2,Math.floor((max-4*step)/step)))*step;
      const backwards=level===3 && seed%2===0;
      const nums=[0,1,2,3].map(i=>start+(backwards?3-i:i)*step);
      const ans=backwards?start-step:start+4*step;
      return question('מה המספר הבא בסדרה?',ans,`בכל שלב ${backwards?'מחסרים':'מוסיפים'} ${f(step)}. המספר הבא הוא ${f(ans)}.`,`מצאו את ההפרש בין שני מספרים סמוכים.`,{expression:`${nums.map(f).join(' , ')} , ?`});
    }
    case 'add': case 'sub': case 'addsub': {
      const kind=lesson.generator==='addsub'?(seed%2===0?'add':'sub'):lesson.generator;
      const regroup=getN('regroup',0);
      const upper=max===10000?9999:999;
      let a=0,b=0;
      const carry=(x:number,y:number,sub=false) => {
        let x0=x,y0=y,found=false;
        while(x0>0||y0>0) {if (sub ? (x0%10<y0%10) : ((x0%10)+(y0%10)>=10)) found=true;
          x0=Math.floor(x0/10);y0=Math.floor(y0/10);}
        return found;
      };
      for(let t=0;t<2000;t++) {
        const low=level===1?12:level===2?110:300;
        a=r(low,upper); b=r(low,upper);
        if(kind==='add' && a+b>upper)continue;
        if(kind==='sub' && a<b)[a,b]=[b,a];
        if(regroup!==2 && carry(a,b,kind==='sub')!==Boolean(regroup))continue;
        if(kind==='sub' && a===b)continue;
        break;
      }
      // Defensive fallback: remains within curriculum even if random constraints failed.
      if(!a||!b||(kind==='add'&&a+b>upper)){a=kind==='add'?234:786;b=kind==='add'?152:253;}
      const result=kind==='add'?a+b:a-b, sign=kind==='add'?'+':'−';
      const hint=kind==='add'?'חברו אחדות, עשרות ומאות; בצעו המרה כשצריך.':'חסרו לפי הטורים; אם אין מספיק, בצעו המרה.';
      return question(`פתרו: ${f(a)} ${sign} ${f(b)}`,result,`${f(a)} ${sign} ${f(b)} = ${f(result)}. בדיקה: ${kind==='add'?`${f(result)} − ${f(b)} = ${f(a)}`:`${f(result)} + ${f(b)} = ${f(a)}`}.`,hint,{expression:`${f(a)} ${sign} ${f(b)} = ?`});
    }
    case 'angle-count': {
      const visual=shape('angle',{degrees:pick([45,60,100,125])});
      const hint='התבוננו בשני הקווים ובמקום שבו הם נפגשים.';
      switch(seed%5){
        case 0: return question('כמה שוקיים יש בזווית אחת?',2,'לזווית שתי שוקיים שיוצאות מקודקוד משותף.',hint,{visual});
        case 1: return question('איך קוראים לנקודה המשותפת לשתי שוקי הזווית?','קודקוד','נקודת המפגש של שתי השוקיים נקראת קודקוד הזווית.',hint,{options:shuffle(['קודקוד','אמצע','שטח']),input:'choice',visual});
        case 2: return question('כמה קודקודים יש לזווית אחת?',1,'לזווית קודקוד אחד — הנקודה שממנה יוצאות שתי השוקיים.',hint,{visual});
        case 3: return question('מה קובע את גודל הזווית?','מידת הפתיחה','גודל הזווית נקבע לפי מידת הפתיחה בין השוקיים, ולא לפי האורך שלהן.','האם זווית גדלה כשמאריכים את הקווים שלה?',{options:shuffle(['מידת הפתיחה','אורך השוקיים','צבע הקווים']),input:'choice',visual});
        default: return question('איך קוראים לשני הקווים שיוצרים את הזווית?','שוקיים','שני הקווים שיוצאים מהקודקוד נקראים שוקי הזווית.',hint,{options:shuffle(['שוקיים','קודקודים','אלכסונים']),input:'choice',visual});
      }
    }
    case 'angle-type': {
      const deg=pick([30,45,60,75,90,110,130,155,180]);
      const type=deg<90?'חדה':deg===90?'ישרה':deg===180?'שטוחה':'קהה';
      return question('איזה סוג זווית רואים בציור?',type,`מידת הפתיחה מתאימה לזווית ${type}.`,'השוו לפינה של דף: קטנה, שווה או גדולה?',{visual:shape('angle',{degrees:deg}),options:['חדה','ישרה','קהה','שטוחה'],input:'choice'});
    }
    case 'angle-compare': {
      const pool=[30,45,60,75,90,110,130,150];
      const a=pick(pool), b=pick(pool.filter(x=>Math.abs(x-a)>=20));
      const ans=a>b?'א׳':'ב׳';
      return question('איזו זווית פתוחה יותר?',ans,`זווית ${ans} פתוחה יותר: השוקיים שלה רחוקות יותר זו מזו.`,'השוו את מידת הפתיחה, לא את אורך השוקיים.',{visual:shape('angles',{degrees:a,degrees2:b}),options:['א׳','ב׳'],input:'choice'});
    }
    case 'polygon-angles': {
      const item=pick([['משולש',3],['ריבוע',4],['מלבן',4],['מחומש',5],['משושה',6],['מתומן',8]] as const);
      return question(`כמה זוויות יש ב${item[0]}?`,item[1],`ל${item[0]} יש ${item[1]} קודקודים, ולכן ${item[1]} זוויות.`,'לכל קודקוד של מצולע מתאימה זווית.');
    }
    case 'clock': {
      const step=getN('step',5),h=r(1,12), m=r(0,60/step-1)*step;
      const time=`${h}:${String(m).padStart(2,'0')}`;
      return question('מה השעה שמראה השעון?',time,m===0?`המחוג הארוך מצביע על 12, והמחוג הקצר על ${h}. לכן השעה ${time}.`:`המחוג הקצר עבר את ${h}, והמחוג הארוך מראה ${m} דקות. לכן השעה ${time}.`,'המחוג הקצר מראה שעות והארוך דקות. כל מספר בשעון שווה 5 דקות.',{visual:shape('clock',{h,m}),input:'text'});
    }
    case 'order': {
      const a=r(3,20),b=r(2,10),c=r(2,8),k=getS('kind','basic');
      if(k==='basic'){const n=a+b+c; return question(`חשבו: ${a} + ${b} + ${c}`,n,`${a}+${b}=${a+b}; ועוד ${c} הם ${n}.`,'מחשבים לפי סדר משמאל לימין.',{expression:`${a} + ${b} + ${c} = ?`});}
      if(k==='brackets')return question(`חשבו: (${a} + ${b}) × ${c}`,(a+b)*c,`קודם ${a}+${b}=${a+b}, ואז ${a+b}×${c}=${(a+b)*c}.`,'מתחילים במה שבתוך הסוגריים.',{expression:`(${a} + ${b}) × ${c} = ?`});
      return question(`חשבו: ${a} + ${b} × ${c}`,a+b*c,`קודם ${b}×${c}=${b*c}; אחר כך ${a}+${b*c}=${a+b*c}.`,'כפל וחילוק קודמים לחיבור וחיסור.',{expression:`${a} + ${b} × ${c} = ?`});
    }
    case 'remainder': {
      const d=r(2,9),q=r(2,10),rem=r(1,d-1), n=d*q+rem;
      const askRest=seed%2===0;
      return question(askRest?`מחלקים ${n} גולות לקבוצות של ${d}. כמה גולות יישארו?`:`מחלקים ${n} גולות לקבוצות של ${d}. כמה קבוצות מלאות אפשר ליצור?`,askRest?rem:q,`${d} × ${q} = ${d*q}; ${n} − ${d*q} = ${rem}. לכן ${q} קבוצות ושארית ${rem}.`,'חפשו את המכפלה הגדולה ביותר שאינה עוברת את מספר הגולות.');
    }
    case 'triangle-type': {
      const mode=getS('mode','angles');
      if(mode==='sides'){
        const tri=pick(['equilateral','isosceles','scalene'] as const);
        const result=tri==='equilateral'?'שווה־צלעות':tri==='isosceles'?'שווה־שוקיים':'שונה־צלעות';
        let sides:number[];
        if(tri==='equilateral'){const s=r(3,9);sides=[s,s,s];}
        else if(tri==='isosceles'){const leg=r(5,9);sides=[leg,leg,leg-r(1,3)];}
        else {const s=r(4,7);sides=[s,s+2,s+1];}
        const why=tri==='equilateral'?'כל שלוש הצלעות שוות באורכן':tri==='isosceles'?'בדיוק שתי צלעות שוות באורכן':'כל הצלעות שונות באורכן';
        return question('איזה סוג משולש רואים לפי אורכי הצלעות?',result,`אורכי הצלעות: ${sides.join(', ')} ס״מ. ${why}, לכן זהו משולש ${result}.`, 'בדקו כמה צלעות באותו אורך.',{visual:shape('triangle',{triangle:tri,sides}),options:['שווה־צלעות','שווה־שוקיים','שונה־צלעות'],input:'choice'});
      }
      const kind=pick(['acute','right','obtuse'] as const);
      const tri=kind==='acute'?pick(['equilateral','isosceles','scalene'] as const):kind;
      const result=kind==='acute'?'חד־זוויות':kind==='right'?'ישר־זווית':'קהה־זווית';
      const why=kind==='acute'?'כל שלוש הזוויות קטנות מזווית ישרה':kind==='right'?'יש בו זווית ישרה אחת, המסומנת בריבוע קטן':'יש בו זווית אחת גדולה מזווית ישרה';
      return question('איזה סוג משולש רואים לפי הזוויות?',result,`${why}, לכן זהו משולש ${result}.`, 'חפשו פינה ישרה או פינה פתוחה יותר מפינה ישרה.',{visual:shape('triangle',{triangle:tri,a:1}),options:['חד־זוויות','ישר־זווית','קהה־זווית'],input:'choice'});
    }
    case 'tri-facts': {
      const options:[string,boolean,string][]=[
        ['האם משולש יכול להיות גם שווה־שוקיים וגם ישר־זווית?',true,'כן. שתי צלעות שוות יכולות להיפגש בזווית ישרה.'],
        ['האם משולש יכול להכיל שתי זוויות קהות?',false,'לא. שתי זוויות קהות כבר גדולות יחד מ־180°.'],
        ['האם משולש שווה־צלעות הוא גם חד־זוויות?',true,'כן. כל הזוויות במשולש שווה־צלעות חדות.'],
        ['האם למשולש יש ארבע צלעות?',false,'לא. למשולש שלוש צלעות.'],
        ['האם משולש יכול להכיל שתי זוויות ישרות?',false,'לא. שתי זוויות ישרות הן יחד כבר 180°, ולא נשאר מקום לזווית שלישית.'],
        ['האם בכל משולש יש לפחות שתי זוויות חדות?',true,'כן. במשולש יכולה להיות לכל היותר זווית אחת ישרה או קהה.'],
        ['האם משולש ישר־זווית יכול להיות גם שווה־צלעות?',false,'לא. במשולש שווה־צלעות כל הזוויות חדות.'],
        ['האם משולש קהה־זווית יכול להיות גם שווה־שוקיים?',true,'כן. שתי שוקיים שוות יכולות להיפגש בזווית קהה.'],
        ['האם למשולש יש שלושה קודקודים?',true,'כן. למשולש שלוש צלעות, שלושה קודקודים ושלוש זוויות.'],
        ['האם משולש שונה־צלעות יכול להיות ישר־זווית?',true,'כן. למשל משולש שאורכי צלעותיו 3, 4 ו־5 ס״מ.']];
      const [prompt,ans,sol]=pick(options); return question(prompt,ans?'כן':'לא',sol,'נסו לדמיין או לצייר משולש מתאים.',{options:yesNo,input:'choice'});
    }
    case 'elapsed': {
      const h=r(8,17),m=r(0,11)*5,delta=pick(level===1?[10,15,20,30,60]:[10,15,20,25,30,40,45,50,60,75,90,120]);
      const start=h*60+m,end=start+delta;
      const event=pick(['השיעור','הסרט','האימון','הטיול','המשחק']);
      const visual=shape('clock',{h:h%12||12,m});
      if(seed%3===2)return question(`${event} התחיל ב־${fmtTime(start)} והסתיים ב־${fmtTime(end)}. כמה דקות הוא נמשך?`,delta,`מ־${fmtTime(start)} עד ${fmtTime(end)} עוברות ${delta} דקות.`,'ספרו את הדקות עד השעה העגולה הבאה, ואז הוסיפו את הדקות שנשארו.',{visual});
      return question(`${event} התחיל ב־${fmtTime(start)} ונמשך ${delta} דקות. באיזו שעה הוא הסתיים?`,fmtTime(end),`${fmtTime(start)} ועוד ${delta} דקות הם ${fmtTime(end)}.`,'הגיעו תחילה לשעה העגולה הבאה והוסיפו את הדקות שנשארו.',{visual,input:'text'});
    }
    case 'scale-mul': case 'scale-div': {
      const factor=pick([10,100,1000]);const n=r(2,Math.max(2,Math.min(99,Math.floor(9999/factor))));
      if(lesson.generator==='scale-mul')return question(`חשבו: ${n} × ${f(factor)}`,n*factor,`${n} × ${f(factor)} = ${f(n*factor)}.`, 'בדקו מהו ערך המקום החדש של כל ספרה.',{expression:`${n} × ${f(factor)} = ?`});
      const product=n*factor;return question(`חשבו: ${f(product)} ÷ ${f(factor)}`,n,`${f(product)} ÷ ${f(factor)} = ${n}.`,'נסו את פעולת הכפל ההפוכה.',{expression:`${f(product)} ÷ ${f(factor)} = ?`});
    }
    case 'mul-round': {
      const base=getS('kind','tens')==='hundreds'?100:10;
      const a=r(2,9), b=r(2,base===100?9:70)*base;
      const answer=a*b;
      return question(`חשבו: ${a} × ${f(b)}`,answer,`${a} × ${b/base} ${base===10?'עשרות':'מאות'} = ${f(answer)}.`,`קודם כופלים ${a} × ${b/base} ואחר כך מתייחסים ל${base===10?'עשרות':'מאות'}.`,{expression:`${a} × ${f(b)} = ?`});
    }
    case 'distribute': {
      const tens=r(1,level===1?4:8), ones=r(1,9),a=tens*10+ones,b=r(2,level===3?9:6);
      const total=a*b;
      return question(`חשבו בעזרת פירוק: ${a} × ${b}`,total,`${tens*10} × ${b} = ${tens*10*b}; ${ones} × ${b} = ${ones*b}. יחד ${total}.`,'פרקו את המספר לעשרות ולאחדות, כפלו כל חלק וחברו.',{expression:`${a} × ${b} = ?`});
    }
    case 'unknown': {
      const a=r(100,max===10000?4500:500), b=r(80,max===10000?3500:300),t=a+b;
      const sw=seed%2===0;
      return question(sw?`${f(a)} + □ = ${f(t)}. מה המספר החסר?`:`□ + ${f(b)} = ${f(t)}. מה המספר החסר?`,sw?b:a,`מחסרים מהסכום את המספר הידוע: ${f(t)} − ${f(sw?a:b)} = ${f(sw?b:a)}.`,'משתמשים בפעולה ההפוכה: חיסור.',{expression:sw?`${f(a)} + □ = ${f(t)}`:`□ + ${f(b)} = ${f(t)}`});
    }
    case 'area-grid': case 'rectangle-area': {
      const a=r(2,level===1?5:9),b=r(2,level===1?6:9),result=a*b;
      return question(lesson.generator==='rectangle-area'?`מה שטח המלבן שאורכו ${a} ס״מ ורוחבו ${b} ס״מ? (כתבו מספר)`:'כמה משבצות יחידה נמצאות בתוך המלבן?',result,`${a} שורות × ${b} משבצות = ${result}${lesson.generator==='rectangle-area'?' סמ״ר':''}.`,'ספרו את השורות והעמודות ואז הכפילו.',{visual:shape('grid',{a,b})});
    }
    case 'area-compare': {
      const a=r(2,6),b=r(2,6),c=r(2,6),d=r(2,6),area1=a*b,area2=c*d;
      const result=area1===area2?'שווים':area1>area2?'א׳':'ב׳';
      return question('לאיזה מלבן יש שטח גדול יותר?',result,`למלבן א׳ ${area1} משבצות ולמלבן ב׳ ${area2} משבצות.`, 'סופרים משבצות בכל מלבן.',{visual:shape('twoGrids',{a,b,c,d}),options:['א׳','ב׳','שווים'],input:'choice'});
    }
    case 'area-units': {
      const small=seed%2===0,item=small?pick(['מחברת','גלויה','כרטיס משחק','מחק']):pick(['כיתת לימוד','חדר','מגרש ספורט','חצר']);
      const answer=small?'סמ״ר':'מ״ר';
      return question(`באיזו יחידה מתאים למדוד את השטח של ${item}?`,answer,`לשטח של ${item} מתאים להשתמש ב־${answer}.`,'לחפצים קטנים סמ״ר, ולמשטחים גדולים מ״ר.',{options:['סמ״ר','מ״ר','ס״מ','מ׳'],input:'choice'});
    }
    case 'mental-big': {
      const a=r(2,8),b=pick([20,30,40,50,100,200,300,400]); const total=a*b;
      if(seed%2===0)return question(`חשבו בראש: ${a} × ${b}`,total,`${a} × ${b} = ${f(total)}.`, 'חשבו כמה עשרות או מאות יש.',{expression:`${a} × ${b} = ?`});
      return question(`חשבו בראש: ${f(total)} ÷ ${a}`,b,`${a} × ${b} = ${f(total)}, לכן התוצאה היא ${b}.`,'הפכו לחישוב כפל מוכר.',{expression:`${f(total)} ÷ ${a} = ?`});
    }
    case 'div-round': {
      const base=getS('kind','tens')==='hundreds'?100:10;
      const d=r(2,9),q=r(2,base===100?9:12),n=d*q*base;
      return question(`חשבו: ${f(n)} ÷ ${d}`,q*base,`${d} × ${q*base} = ${f(n)}, לכן התוצאה ${f(q*base)}.`,'חלקו את מספר העשרות או המאות לפני שמחזירים את היחידה.',{expression:`${f(n)} ÷ ${d} = ?`});
    }
    case 'div-two-digit': {
      const d=r(2,9),q=r(3,Math.floor(99/d)),n=d*q;
      return question(`חשבו: ${n} ÷ ${d}`,q,`${n} ÷ ${d} = ${q}, כי ${d} × ${q} = ${n}.`,'נסו לפרק את המחולק לסכום של מספרים שמתחלקים במחלק.',{expression:`${n} ÷ ${d} = ?`});
    }
    case 'related': {
      const a=r(2,9),b=r(2,9),scale=pick([10,100]),n=a*b*scale;
      return question(`אם ${a} × ${b} = ${a*b}, כמה הם ${a} × ${b*scale}?`,n,`התוצאה ${a*b} גדלה פי ${scale}, ולכן ${f(n)}.`,'שימו לב כמה פעמים הגורם השני גדל.',{expression:`${a} × ${b*scale} = ?`});
    }
    case 'gematria': {
      const letters:[string,number][]=[['א',1],['ב',2],['ג',3],['ד',4],['ה',5],['ו',6],['ז',7],['ח',8],['ט',9],['י',10],['כ',20],['ל',30],['מ',40],['נ',50],['ס',60],['ע',70],['פ',80],['צ',90],['ק',100],['ר',200],['ש',300],['ת',400]];
      const la=pick(letters.slice(0,level===1?10:20)), lb=pick(letters.slice(0,level===1?10:20));
      return question(`מה הערך בגימטרייה של האותיות ${la[0]}${lb[0]}?`,la[1]+lb[1],`${la[0]} = ${la[1]}, ${lb[0]} = ${lb[1]}. הסכום הוא ${la[1]+lb[1]}.`,'מוצאים את ערך כל אות ומחברים.');
    }
    case 'rounding': {
      const base=pick(level===1?[10,100]:[10,100,1000]);
      let n=r(base+1,level===1?998:9998); if(n%base===0)n+=1;
      const result=Math.round(n/base)*base, digit=Math.floor(n/(base/10))%10;
      const target=base===10?'לעשרת הקרובה':base===100?'למאה הקרובה':'לאלף הקרוב';
      const place=base===10?'האחדות':base===100?'העשרות':'המאות';
      return question(`עגלו את ${f(n)} ${target}.`,result,`ספרת ${place} היא ${digit}, ולכן מעגלים כלפי ${digit>=5?'מעלה':'מטה'}: ${f(n)} ≈ ${f(result)}.`,`בדקו את ספרת ${place}: 5 ומעלה — מעגלים למעלה; פחות מ־5 — מעגלים למטה.`,{expression:`${f(n)} ≈ ?`});
    }
    case 'estimate': {
      const a=r(101,998),b=r(101,998),a0=Math.round(a/100)*100,b0=Math.round(b/100)*100;
      return question(`עגלו כל מספר למאה הקרובה וחשבו אומדן: ${a} + ${b} ≈ ?`,a0+b0,`${a} ≈ ${a0}; ${b} ≈ ${b0}; ולכן האומדן ${a0+b0}.`,'עגלו כל מספר בנפרד לפני החיבור.',{expression:`${a} + ${b} ≈ ?`});
    }
    case 'final-mixed': {
      const a=r(800,6000),plus=seed%2===0,b=r(100,Math.min(3000,plus?9999-a:a));
      const out=plus?a+b:a-b;
      return question(`חשבו: ${f(a)} ${plus?'+':'−'} ${f(b)}`,out,`${f(a)} ${plus?'+':'−'} ${f(b)} = ${f(out)}.`,`היעזרו בערך המקום ובדקו את התוצאה.`,{expression:`${f(a)} ${plus?'+':'−'} ${f(b)} = ?`});
    }
    case 'same-area': {
      const a=r(2,7),b=r(3,9),product=a*b;
      const factors:Array<[number,number]>=[];
      for(let c=2;c<10;c++)if(product%c===0 && product/c<=12 && (c!==a || product/c!==b))factors.push([c,product/c]);
      const [c,d]=factors.length?pick(factors):[a,b];
      const yes=seed%3!==0,dd=yes?d:d+1;
      return question(`האם למלבנים א׳ וב׳ יש אותו שטח?`,yes?'כן':'לא',`מלבן א׳: ${a}×${b}=${product}; מלבן ב׳: ${c}×${dd}=${c*dd}.`, 'חשבו את מספר המשבצות בכל מלבן בנפרד.',{visual:shape('twoGrids',{a,b,c,d:dd}),options:yesNo,input:'choice'});
    }
    case 'box-facts': {
      const item=pick([['פאות',6],['מקצועות',12],['קודקודים',8]] as const);
      const shapeName=seed%2===0?'קובייה':'תיבה';
      return question(`כמה ${item[0]} יש ל${shapeName}?`,item[1],`ל${shapeName} יש ${item[1]} ${item[0]}.`,'דמיינו קופסה: ספרו פאות, קצוות או פינות.');
    }
    case 'net': {
      const valid=seed%2===0; const cells=rotateNet(pick(valid?CUBE_NETS:NON_CUBE_NETS),r(0,3),seed%3===0);
      return question('האם אפשר לקפל את הפריסה לקובייה?',valid?'כן':'לא',valid?'זו פריסה תקינה: כשמקפלים מתקבלות שש פאות ללא חפיפה.':'הפריסה הזו לא נסגרת לקובייה תקינה בלי חפיפה.', 'דמיינו שכל ריבוע מתקפל לפאה אחרת. האם שש הפאות מכסות את כל הקובייה?',{visual:shape('net',{valid,cells}),options:yesNo,input:'choice'});
    }
    case 'table': {
      const labels=['תפוחים','אגסים','בננות','תותים']; const values=labels.map(()=>r(3,20));const ix=r(0,3);
      const visual=shape('table',{labels,values});
      if(level===3){const jx=(ix+r(1,3))%4;
        return question(`כמה ${labels[ix]} ו${labels[jx]} יש ביחד לפי הטבלה?`,values[ix]+values[jx],`${values[ix]} + ${values[jx]} = ${values[ix]+values[jx]}.`,'מצאו את שתי השורות המתאימות וחברו את הכמויות.',{visual});}
      return question(`כמה ${labels[ix]} מופיעים בטבלה?`,values[ix],`בשורה של ${labels[ix]} מופיע המספר ${values[ix]}.`,'חפשו את השורה הנכונה וקראו את הכמות.',{visual});
    }
    case 'double-bars': {
      const labels=['ספרים','מחברות','עפרונות'];
      const values=labels.map(()=>r(3,12)),values2=labels.map(()=>r(3,12)), ix=r(0,2);
      if(values[ix]===values2[ix])values2[ix]+=values2[ix]<12?1:-1;
      const a=values[ix], b=values2[ix];
      return question(`מה ההפרש בין קבוצה א׳ לקבוצה ב׳ במספר ה${labels[ix]}?`,Math.abs(a-b),`${labels[ix]}: לקבוצה א׳ יש ${a} ולקבוצה ב׳ יש ${b}. ההפרש הוא ${Math.max(a,b)} − ${Math.min(a,b)} = ${Math.abs(a-b)}.`, 'מצאו את שתי העמודות של אותה קטגוריה וחסרו את הקטנה מהגדולה.',{visual:shape('doubleBars',{labels,values,values2})});
    }
    case 'bars': {
      const labels=['תפוחים','אגסים','בננות','תותים'],values=[r(3,12),r(3,12),r(3,12),r(3,12)];
      const mode=getS('mode','read'),idx=r(0,3);
      if(mode==='read')return question(`כמה ${labels[idx]} רואים בדיאגרמה?`,values[idx],`העמודה של ${labels[idx]} מגיעה ל־${values[idx]}.`,'מצאו את העמודה עם הכותרת המתאימה.',{visual:shape('bars',{labels,values})});
      const i=idx,j=(idx+r(1,3))%4;
      if(mode!=='total'&&values[i]===values[j])values[j]+=1;
      const answer=mode==='total'?values[i]+values[j]:Math.abs(values[i]-values[j]);
      return question(mode==='total'?`כמה ${labels[i]} ו${labels[j]} יש בסך הכול?`:`מה ההפרש בין מספר ה${labels[i]} למספר ה${labels[j]}?`,answer,mode==='total'?`${values[i]} + ${values[j]} = ${answer}.`:`${Math.max(values[i],values[j])} − ${Math.min(values[i],values[j])} = ${answer}.`,mode==='total'?'מצאו את שתי העמודות וחברו.':'מצאו את שתי העמודות וחסרו את הקטנה מהגדולה.',{visual:shape('bars',{labels,values})});
    }
    case 'pictogram': {
      const count=r(2,8),value=pick([2,5]),total=count*value;
      return question('כמה פריטים בסך הכול מתוארים בפיקטוגרמה?',total,`${count} סמלים × ${value} פריטים לסמל = ${total}.`,'קראו את המקרא והכפילו את מספר הסמלים בערך של סמל אחד.',{visual:shape('pictogram',{a:count,b:value})});
    }
    case 'money-convert': case 'length-convert': {
      const n=r(2,level===3?25:12),isMoney=lesson.generator==='money-convert',backwards=seed%2===1;
      const units=isMoney?['שקלים','אגורות']:['מטרים','סנטימטרים'];
      return question(backwards?`כמה ${units[0]} הם ${f(n*100)} ${units[1]}?`:`כמה ${units[1]} הם ${n} ${units[0]}?`,backwards?n:n*100,`1 ${units[0]==='שקלים'?'שקל':'מטר'} = 100 ${units[1]}. לכן ${backwards?`${f(n*100)} ÷ 100 = ${n}`:`${n} × 100 = ${f(n*100)}`}.`,backwards?'מחלקים ב־100.':'מכפילים ב־100.');
    }
    case 'number-line': {
      const step=pick(level===1?[10,20,50,100]:[10,20,25,50,100,200,500]);
      const top=level===1?1000:9999;
      const start=r(0,Math.floor((top-step*4)/step))*step;
      const ticks=[0,1,2,3,4].map(i=>start+i*step), missing=level===3?r(0,4):r(1,3), ans=ticks[missing];
      return question('איזה מספר מסתתר מאחורי סימן השאלה על ישר המספרים?',ans,`המרחק בין כל שני סימנים סמוכים הוא ${f(step)}, לכן המספר החסר הוא ${f(ans)}.`,'מצאו את ההפרש בין שני מספרים סמוכים — זו הקפיצה הקבועה.',{visual:shape('numberLine',{ticks,missing})});
    }
    case 'inequality': {
      const a=r(2,45),sum=r(a+4,a+20),trueVal=r(1,sum-a-1),falseVal=r(sum-a+1,sum-a+15),greater=seed%2===1;
      const answer=String(greater?falseVal:trueVal);
      const options=shuffle([answer,String(greater?trueVal:falseVal),String(sum-a)]);
      return question('איזה מספר מתאים במקום הריבוע?',answer,`${a} + ${answer} = ${a+Number(answer)}, ואכן ${a+Number(answer)} ${greater?'>':'<'} ${sum}.`, 'הציבו כל תשובה במקום הריבוע ובדקו את סימן האי־שוויון.',{options,input:'choice',expression:`${a} + □ ${greater?'>':'<'} ${sum}`});
    }
    case 'perimeter-triangle': {
      const a=r(3,14),b=r(3,14),c=r(Math.abs(a-b)+1,Math.max(Math.abs(a-b)+1,a+b-1));
      let tri:'equilateral'|'isosceles'|'scalene'='scalene',sides=[a,b,c];
      if(a===b&&b===c)tri='equilateral';
      else if(a===b)tri='isosceles';
      else if(a===c){tri='isosceles';sides=[a,c,b];}
      else if(b===c){tri='isosceles';sides=[b,c,a];}
      return question(`אורכי צלעות המשולש הם ${a}, ${b} ו־${c} ס״מ. מה ההיקף בס״מ?`,a+b+c,`${a} + ${b} + ${c} = ${a+b+c} ס״מ.`, 'היקף הוא סכום אורכי כל הצלעות.',{visual:shape('triangle',{triangle:tri,sides})});
    }
    case 'perimeter-rect': {
      const a=r(2,15),b=r(2,12);
      return question(`אורך המלבן ${a} ס״מ ורוחבו ${b} ס״מ. מה ההיקף בס״מ?`,2*(a+b),`${a}+${b}+${a}+${b}=${2*(a+b)} ס״מ.`, 'מחברים את כל ארבע הצלעות.',{visual:shape('grid',{a,b})});
    }
    case 'compare-word': {
      const a=r(2,20),b=r(2,level===3?9:5),by=seed%2===1,ans=by?a+b:a*b;
      const [k1,k2]=shuffle(KIDS), item=pick(ITEMS);
      return question(`ל${k1.name} יש ${a} ${item}. ל${k2.name} יש ${by?`${b} ${item} יותר`:`פי ${b} ${item}`}. כמה ${item} יש ל${k2.name}?`,ans,`ל${k2.name} יש ${ans} ${item}, כי ${by?`${a} + ${b}`:`${a} × ${b}`} = ${ans}.`,by?'״יותר״ אומר תוספת, ולכן מחברים.':'״פי״ אומר מכפלה, ולכן כופלים.');
    }
    case 'number-patterns': {
      const mul=pick([2,3]),start=r(1,4),nums=Array.from({length:4},(_,i)=>start*mul**i),ans=start*mul**4;
      return question('מצאו את החוקיות. מה המספר הבא?',ans,`כל מספר גדול פי ${mul} מהקודם, לכן המספר הבא הוא ${nums[3]} × ${mul} = ${ans}.`, 'בדקו פי כמה גדל כל מספר לעומת הקודם.',{expression:`${nums.join(' , ')} , ?`});
    }
    case 'word-addsub': {
      const a=r(80,level===3?800:350),b=r(15,Math.min(150,a,999-a)); const plus=seed%2===0;
      const ans=plus?a+b:a-b, kid=pick(KIDS), item=pick(ITEMS);
      const text=plus
        ?`ל${kid.name} היו ${a} ${item}. ${kid.f?'היא קיבלה':'הוא קיבל'} עוד ${b}. כמה ${item} יש ${kid.f?'לה':'לו'} עכשיו?`
        :`ל${kid.name} היו ${a} ${item}. ${kid.f?'היא נתנה לחברה':'הוא נתן לחבר'} ${b}. כמה ${item} נשארו ${kid.f?'לה':'לו'}?`;
      return question(text,ans,`${a} ${plus?'+':'−'} ${b} = ${ans} ${item}.`,plus?'המילה ״עוד״ רומזת לחיבור.':'כשהכמות קטנה, משתמשים בחיסור.');
    }
    case 'word-muldiv': {
      const bags=r(2,9),per=r(2,9),total=bags*per,div=seed%2===1;
      const [many,one,item]=pick(CONTAINERS);
      return question(div?`מחלקים ${total} ${item} שווה בשווה בין ${bags} ${many}. כמה ${item} יהיו בכל ${one}?`:`יש ${bags} ${many}, ובכל ${one} ${per} ${item}. כמה ${item} יש בסך הכול?`,div?per:total,div?`${total} ÷ ${bags} = ${per}.`:`${bags} × ${per} = ${total}.`,div?'מחלקים את הכמות הכוללת למספר הקבוצות השוות.':'כופלים את מספר הקבוצות בכמות שבכל קבוצה.');
    }
    case 'word-two-step': {
      const bags=r(2,8),per=r(3,9),all=bags*per,removed=r(1,all-1);
      const [many,one,item]=pick(CONTAINERS);
      return question(`יש ${bags} ${many}, ובכל ${one} ${per} ${item}. הוציאו ${removed} ${item}. כמה ${item} נשארו?`,all-removed,`תחילה ${bags} × ${per} = ${all}. אחר כך ${all} − ${removed} = ${all-removed}.`,'קודם מצאו את הכמות הכוללת, ורק אז חסרו את מה שהוציאו.');
    }
    case 'word-money': {
      const cost=r(10,95),pay=Math.ceil((cost+1)/10)*10+pick([0,10,20,30]);
      const thing=pick(['ספר','משחק קופסה','כדור','חולצה','פאזל','בובה']);
      return question(`${thing} עולה ${cost} ש״ח. שילמו ${pay} ש״ח. כמה ש״ח עודף קיבלו?`,pay-cost,`${pay} − ${cost} = ${pay-cost} ש״ח.`,'עודף הוא הסכום ששילמו פחות מחיר הקנייה.');
    }
    default:
      throw new Error(`Missing generator '${lesson.generator}' for lesson '${lesson.id}'`);
  }
}

export function normalizeAnswer(value: string): string {
  return value.trim().replace(/[\u200e\u200f\s,]/g,'').replace(/−/g,'-').replace(/[٠-٩]/g, d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[０-９]/g,d=>String(d.charCodeAt(0)-0xff10)).replace(/^0+(?=\d)/,'');
}
const TIME=/^\d{1,2}:\d{2}$/;
/** Numbers are compared after normalisation; clock times also accept 3.25 / 03:25 / 325. */
export function answerIsCorrect(actual: string, expected: string): boolean {
  const a=normalizeAnswer(actual), e=normalizeAnswer(expected);
  if(TIME.test(e)){
    const digits=(v:string)=>v.replace(/[.:;]/g,'').replace(/^0+(?=\d)/,'');
    return /^\d{1,2}[.:;]?\d{2}$/.test(a)&&digits(a)===digits(e);
  }
  return a===e;
}
