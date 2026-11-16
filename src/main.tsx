import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronLeft, CircleHelp,
  Download, Home, Lightbulb, Medal, Menu, RefreshCw,
  Rocket, Settings, ShieldCheck, Sparkles, Star, Target, Trophy, Upload,
  Volume2, WandSparkles, X, LockKeyhole, RotateCcw
} from 'lucide-react';
import rawCurriculum from './data/course.json';
import { createQuestion, answerIsCorrect } from './engine/questions';
import { blankProgress, loadProgress, registerAnswer, saveProgress, setStars, summary } from './engine/progress';
import { MathVisual } from './components/MathVisual';
import type { Chapter, Lesson, Level, Progress, Question } from './types';
import './styles/app.css';

const curriculum = rawCurriculum as unknown as Chapter[];
const lessons=curriculum.flatMap(c=>c.lessons);
const books:[9,10,11,12,'cross']=[9,10,11,12,'cross'];
const bookTitles:Record<string,string>={'9':'ספר 9 · מתחילים','10':'ספר 10 · מתקדמים','11':'ספר 11 · גדלים','12':'ספר 12 · מסיימים','cross':'תרגול לאורך השנה'};
const bookColors:Record<string,string>={'9':'#9169dc','10':'#ef9c67','11':'#55b8a5','12':'#6b99df','cross':'#e07fa6'};

type Page='home'|'curriculum'|'lesson'|'parent';
type Phase='learn'|'practice'|'result';
function Badge({children,kind='soft'}:{children:React.ReactNode,kind?:string}){return <span className={`chip chip-${kind}`}>{children}</span>;}
function Stars({value}:{value:number}) {return <span className="stars" aria-label={`${value} כוכבים`}>{[0,1,2].map(i=><Star key={i} size={17} fill={i<value?'currentColor':'transparent'} strokeWidth="2.2"/>)}</span>;}
function App(){
  const [progress,setProgress]=useState<Progress>(()=>loadProgress());
  const [page,setPage]=useState<Page>('home');
  const [activeBook,setActiveBook]=useState<9|10|11|12|'cross'>(9);
  const [selectedId,setSelectedId]=useState<string>(lessons[0].id);
  const [phase,setPhase]=useState<Phase>('learn');
  const [level,setLevel]=useState<Level>(2);
  const [roundLength,setRoundLength]=useState<number>(10);
  const [sessionSeed,setSessionSeed]=useState<number>(()=>Math.floor(Math.random()*1000000000));
  const [index,setIndex]=useState(0);
  const [sessionCorrect,setSessionCorrect]=useState(0);
  const [answer,setAnswer]=useState('');
  const [feedback,setFeedback]=useState<boolean|null>(null);
  const [hintShown,setHintShown]=useState(false);
  const [showWorked,setShowWorked]=useState<Record<number,boolean>>({});
  const [parentUnlocked,setParentUnlocked]=useState(false);
  const [showMenu,setShowMenu]=useState(false);
  const [fontLarge,setFontLarge]=useState(false);
  const started=useRef(Date.now());
  const uploadRef=useRef<HTMLInputElement>(null);
  const selected=lessons.find(l=>l.id===selectedId)||lessons[0];
  const chapter=curriculum.find(c=>c.id===selected.chapter)!;
  const question:Question=useMemo(()=>createQuestion(selected,level,sessionSeed+index),[selected,level,sessionSeed,index]);
  const stats=summary(progress);
  const nearest=lessons.find(l=>!progress.stats[l.id]?.stars)||lessons[0];
  const recently=useMemo(()=>[...lessons].filter(l=>progress.stats[l.id]?.attempts).sort((a,b)=>progress.stats[b.id].lastPlayed-progress.stats[a.id].lastPlayed).slice(0,4),[progress]);

  useEffect(()=>{saveProgress(progress);},[progress]);
  useEffect(()=>{document.body.classList.toggle('font-large',fontLarge);},[fontLarge]);
  useEffect(()=>{
    if('serviceWorker' in navigator && import.meta.env.PROD){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
  },[]);
  const navigate=(p:Page)=>{setPage(p);setShowMenu(false);window.scrollTo({top:0,behavior:'smooth'});};
  function openLesson(l:Lesson){setSelectedId(l.id);setActiveBook(l.book);setPhase('learn');setShowWorked({});navigate('lesson');}
  function startPractice(){setPhase('practice');setSessionSeed(Math.floor(Math.random()*1000000000));setIndex(0);setSessionCorrect(0);setFeedback(null);setHintShown(false);setAnswer('');started.current=Date.now();}
  function checkAnswer(){
    if(feedback!==null || !answer.trim())return;
    const correct=answerIsCorrect(answer,question.answer);
    setFeedback(correct);
    if(correct)setSessionCorrect(s=>s+1);
    setProgress(p=>registerAnswer(p,{at:Date.now(),lessonId:selected.id,correct,seconds:Math.round((Date.now()-started.current)/1000),hintUsed:hintShown}));
  }
  function finishPractice(){
    const completed=index+1;
    const accuracy=Math.round(sessionCorrect/completed*100);
    const stars=accuracy>=90?3:accuracy>=70?2:accuracy>=40?1:0;
    setProgress(p=>setStars(p,selected.id,stars));
    setPhase('result');
  }
  function nextQuestion(){
    const next=index+1;
    if(roundLength>0 && next>=roundLength){
      finishPractice();
    } else {
      setIndex(next);setAnswer('');setFeedback(null);setHintShown(false);started.current=Date.now();
    }
  }
  function selectOption(val:string){if(feedback===null)setAnswer(val);}
  function resetProgress(){
    if(!window.confirm('למחוק את כל ההתקדמות במכשיר הזה? לא ניתן לבטל את הפעולה.'))return;
    setProgress(blankProgress());setParentUnlocked(false);navigate('home');
  }
  function downloadBackup(){
    const blob=new Blob([JSON.stringify(progress,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='matematika-bekef-progress.json';a.click();URL.revokeObjectURL(url);
  }
  async function importBackup(file?:File){
    if(!file)return;
    try{const data=JSON.parse(await file.text()) as Progress;
      if(data.version!==1||!data.stats||!Array.isArray(data.logs))throw new Error('format');
      if(!window.confirm('לייבא את קובץ ההתקדמות ולדרוס את ההתקדמות במכשיר הזה?'))return;
      setProgress(data);window.alert('הייבוא הצליח!');
    }catch{window.alert('הקובץ אינו קובץ גיבוי תקין.');}
    if(uploadRef.current)uploadRef.current.value='';
  }
  function speak(text:string){
    if(!('speechSynthesis' in window)){window.alert('הקראה אינה זמינה בדפדפן הזה.');return;}
    window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='he-IL';utterance.rate=.86;window.speechSynthesis.speak(utterance);
  }
  const sessionPct=roundLength>0?Math.round((index+1)/roundLength*100):0;
  const currentStars=progress.stats[selected.id]?.stars||0;

  return <div className="app-shell" dir="rtl">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={()=>navigate('home')} aria-label="לדף הבית">
          <span className="brand-logo"><span>×</span><span>+</span></span>
          <span><strong>מתמטיקה בכיף</strong><small>לומדים בקלות · כיתה ג׳</small></span>
        </button>
        <nav className="top-nav" aria-label="תפריט ראשי">
          <button className={page==='home'?'active':''} onClick={()=>navigate('home')}><Home size={18}/>הבית שלי</button>
          <button className={page==='curriculum'?'active':''} onClick={()=>navigate('curriculum')}><BookOpen size={18}/>כל השיעורים</button>
          <button className={page==='parent'?'active':''} onClick={()=>navigate('parent')}><Settings size={18}/>להורים</button>
        </nav>
        <div className="header-right"><span className="coins"><Star size={17} fill="currentColor"/>{progress.rewards}</span>
          <button className="font-button" onClick={()=>setFontLarge(!fontLarge)} title="הגדלת כתב" aria-label="הגדלת כתב">אא</button>
          <button className="mobile-menu icon-button" aria-label="פתח תפריט" onClick={()=>setShowMenu(!showMenu)}>{showMenu?<X/>:<Menu/>}</button>
        </div>
      </div>
      {showMenu&&<div className="mobile-panel"><button onClick={()=>navigate('home')}>הבית שלי</button><button onClick={()=>navigate('curriculum')}>כל השיעורים</button><button onClick={()=>navigate('parent')}>להורים</button></div>}
    </header>

    <main className="main-container">
      {page==='home'&&<>
        <section className="hero"><div className="hero-copy">
          <Badge kind="white"><Sparkles size={15}/> בכל יום לומדים משהו חדש</Badge>
          <h1>היי, <span>{progress.learner}!</span><br/> מוכנים להרפתקת מספרים?</h1>
          <p>משחקים, מגלים ומצליחים — צעד אחרי צעד, בדיוק בקצב שלך.</p>
          <div className="hero-buttons"><button className="btn primary" onClick={()=>openLesson(nearest)}>ממשיכים ללמוד <ArrowLeft size={20}/></button><button className="btn ghost-light" onClick={()=>navigate('curriculum')}>בוחרים שיעור</button></div>
        </div><div className="hero-art" aria-hidden="true"><div className="planet orbit-a">7 × 8</div><div className="hero-main">3<span>+</span>4</div><div className="planet orbit-b">= 56</div><div className="hero-stars">✦ ✦ ✦</div></div></section>
        <div className="stats-row">
          <div className="stat-card"><span className="stat-icon purple"><BookOpen size={22}/></span><div><b>{stats.played}</b><small>שיעורים שתרגלת</small></div></div>
          <div className="stat-card"><span className="stat-icon mint"><Trophy size={22}/></span><div><b>{stats.mastered}</b><small>שיעורים שהצלחת</small></div></div>
          <div className="stat-card"><span className="stat-icon peach"><Target size={22}/></span><div><b>{stats.accuracy}%</b><small>תשובות נכונות</small></div></div>
        </div>
        <section className="section-heading"><div><Badge>המסלול שלי</Badge><h2>מתקדמים יחד, שלב אחרי שלב</h2><p>4 ספרים, כל נושאי כיתה ג׳, ועוד אימונים לאורך השנה.</p></div><button className="text-link" onClick={()=>navigate('curriculum')}>לכל השיעורים <ChevronLeft size={18}/></button></section>
        <div className="book-grid">
          {books.filter(x=>x!=='cross').map((book,i)=>{
            const units=curriculum.filter(c=>c.book===book);const list=units.flatMap(c=>c.lessons),done=list.filter(l=>(progress.stats[l.id]?.stars||0)>=2).length;
            return <button key={book} className="book-card" onClick={()=>{setActiveBook(book);navigate('curriculum');}}>
              <div className="book-art" style={{background:bookColors[book]}}><span className="book-number">{i+1}</span><span className="book-deco">{['×','÷','10','▣'][i]}</span></div>
              <div className="book-content"><span className="eyebrow">ספר {book}</span><h3>{['המסע מתחיל!','עולים שלב','מספרים גדולים','כמעט אלופים!'][i]}</h3><p>{['כפל, חילוק, מספרים עד 1,000 וזוויות','סדר פעולות, המרות ומשולשים','מספרים עד 10,000 ומדידת שטח','אומדן, גימטרייה ותיבות'][i]}</p><div className="book-progress"><span style={{width:`${done/Math.max(1,list.length)*100}%`,background:bookColors[book]}}/></div><small>{done} מתוך {list.length} שיעורים</small></div>
            </button>;
          })}
        </div>
        <section className="home-bottom"><div className="small-promo"><div className="promo-icon"><WandSparkles size={28}/></div><div><h3>רוצים תרגול נוסף?</h3><p>חוזרים לנושא שכבר למדנו, עם שאלות חדשות בכל פעם.</p></div><button className="btn secondary" onClick={()=>{const s=recently[0]||nearest;openLesson(s);}}>בוחרים שיעור <ChevronLeft size={17}/></button></div></section>
      </>}

      {page==='curriculum'&&<>
        <div className="page-title"><div><Badge>כל הנושאים</Badge><h1>בוחרים מה ללמוד היום</h1><p>הדרך מסודרת כמו בספרים. כל שיעור פתוח לתרגול בכל זמן.</p></div><div className="doodle" aria-hidden="true">1 2 3 ✦</div></div>
        <div className="book-tabs" role="tablist" aria-label="בחירת ספר">
          {books.map(b=><button key={b} role="tab" aria-selected={activeBook===b} className={activeBook===b?'selected':''} onClick={()=>{setActiveBook(b);}} style={{'--tab-accent':bookColors[b]} as React.CSSProperties}>{bookTitles[b]}</button>)}
        </div>
        <div className="chapters">
          {curriculum.filter(c=>c.book===activeBook).map((c,j)=>{
            const done=c.lessons.filter(l=>(progress.stats[l.id]?.stars||0)>=2).length;
            return <section className="chapter-card" key={c.id}>
              <div className="chapter-heading"><div className="chapter-symbol" style={{background:c.accent}}>{j+1}</div><div className="chapter-text"><h2>{c.title}</h2><p>{c.desc}</p></div><Badge>{done}/{c.lessons.length} הושלמו</Badge></div>
              <div className="lesson-grid">{c.lessons.map((l,i)=>{
                const star=progress.stats[l.id]?.stars||0;
                return <button key={l.id} onClick={()=>openLesson(l)} className="lesson-tile"><span className={`lesson-step ${star?'finished':''}`}>{star?<Check size={20}/>:i+1}</span><span className="lesson-tile-copy"><b>{l.title}</b><small>{l.subtitle}</small></span><Stars value={star}/><ChevronLeft className="lesson-chevron" size={19}/></button>;
              })}</div>
            </section>;
          })}
        </div>
      </>}

      {page==='lesson'&&<>
        <div className="lesson-breadcrumb"><button onClick={()=>navigate('curriculum')}><ArrowRight size={18}/> {bookTitles[selected.book]}</button><ChevronLeft size={14}/><span>{chapter.title}</span></div>
        <section className="lesson-hero"><div className="lesson-hero-head"><Badge>שיעור {curriculum.filter(c=>c.book===selected.book).flatMap(c=>c.lessons).findIndex(l=>l.id===selected.id)+1}</Badge><Stars value={currentStars}/></div><h1>{selected.title}</h1><p>{selected.subtitle}</p><div className="lesson-trail"><span className={phase==='learn'?'current':''}><BookOpen size={17}/> לומדים</span><span className={phase==='practice'?'current':''}><Target size={17}/> מתרגלים</span><span className={phase==='result'?'current':''}><Medal size={17}/> מסכמים</span></div></section>
        {phase==='learn'&&<div className="study-layout"><section className="learn-main panel">
          <div className="panel-topline"><span className="round-icon"><Lightbulb size={23}/></span><span><Badge>בואו נבין</Badge><h2>איך פותרים?</h2></span><button className="round-mini" title="השמעת הסבר" aria-label="השמעת הסבר" onClick={()=>speak(selected.steps.join(' '))}><Volume2 size={19}/></button></div>
          <p className="objective">{selected.objective}</p>
          <div className="step-list">{selected.steps.map((s,i)=><div className="teaching-step" key={i}><span>{i+1}</span><p>{s}</p></div>)}</div>
          <div className="worked-box"><div className="worked-heading"><Sparkles size={19}/> דוגמה פתורה</div>
            {selected.worked.map((w,i)=><div key={i}><h3>{w.prompt}</h3><MathVisual visual={w.visual}/><div className="worked-answer">{w.answer}</div><p>{w.explanation}</p></div>)}
          </div>
          <h3 className="additional-title">עוד שתי דוגמאות לתרגול</h3>
          <div className="preview-list">{[5,8].map((n,i)=>{
            const sample=createQuestion(selected,((i+1) as Level),100+n),open=!!showWorked[i];
            return <div className="preview" key={n}><b>{sample.prompt}</b>{sample.expression&&<div dir="ltr" className="math-expression small-expression">{sample.expression}</div>}{sample.visual&&<MathVisual visual={sample.visual}/>}
              <button className="preview-toggle" onClick={()=>setShowWorked(old=>({...old,[i]:!open}))}>{open?'מסתירים פתרון':'מגלים פתרון'} <ChevronDown size={16}/></button>
              {open&&<div className="sample-solution"><strong>התשובה: <span dir="ltr">{sample.answer}</span></strong><p>{sample.solution}</p></div>}</div>;
          })}</div>
          <div className="round-picker"><strong>כמה שאלות רוצים לתרגל?</strong><div>{[10,20,50,0].map(n=><button key={n} className={roundLength===n?'chosen':''} onClick={()=>setRoundLength(n)}>{n===0?'בלי סוף':n}</button>)}</div></div>
          <button className="btn primary wide" onClick={startPractice}>הבנתי! מתחילים לתרגל <Rocket size={19}/></button>
        </section><aside className="lesson-side panel"><div className="mascot" aria-hidden="true"><span>✦</span><div className="mascot-face">◕ᴗ◕</div></div><h3>טיפ קטן להצלחה</h3><p>לא חייבים למהר. אפשר ללמוד בקצב שלך ולבקש רמז בכל שלב.</p><div className="lesson-side-line"><Check size={17}/> שאלות חדשות בכל אימון</div><div className="lesson-side-line"><Check size={17}/> הסבר אחרי כל תשובה</div><div className="lesson-side-line"><Check size={17}/> נשמר רק במכשיר שלך</div></aside></div>}
        {phase==='practice'&&<section className="practice-layout"><div className="practice-card panel">
          <div className="practice-toolbar"><Badge>{roundLength===0?'אימון ללא סוף':`שאלה ${index+1} מתוך ${roundLength}`}</Badge><div className="difficulty"><span>רמה:</span>{([1,2,3] as Level[]).map((l,i)=><button key={l} className={level===l?'selected':''} onClick={()=>{if(index===0&&feedback===null){setLevel(l);setAnswer('');}}} disabled={index!==0||feedback!==null}>{['קל','רגיל','אתגר'][i]}</button>)}</div></div>
          {roundLength>0&&<div className="progress-line"><span style={{width:`${Math.min(100,sessionPct)}%`}}/></div>}
          <div className="question-area"><div className="question-label">חושבים ופותרים</div><h2>{question.prompt}</h2>{question.expression&&<div className="math-expression" dir="ltr">{question.expression}</div>}{question.visual&&<MathVisual visual={question.visual}/>}</div>
          <div className="answer-area">{question.options?<div className="answer-options" role="group" aria-label="בחרו תשובה">{question.options.map(option=><button className={`option ${answer===option?'chosen':''} ${feedback!==null&&option===question.answer?'correct-option':''}`} disabled={feedback!==null} key={option} onClick={()=>selectOption(option)}>{option}</button>)}</div>:
            <div className="input-wrap"><label htmlFor="student-answer">התשובה שלך</label><input id="student-answer" aria-label="התשובה שלך" dir="ltr" placeholder={question.input==='text'?'__:__':'?'} inputMode={question.input==='text'?'text':'numeric'} value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')checkAnswer();}} disabled={feedback!==null}/></div>}
            {feedback===null?<div className="practice-actions"><button className="hint-button" onClick={()=>setHintShown(!hintShown)}><Lightbulb size={18}/>{hintShown?'מסתירים רמז':'אפשר רמז?'}</button><button className="btn primary" disabled={!answer.trim()} onClick={checkAnswer}>בודקים תשובה <Check size={18}/></button></div>:null}
            {hintShown&&feedback===null&&<div className="hint-box"><Lightbulb size={18}/><span>{question.hint}</span></div>}
            {feedback!==null&&<div className={`feedback ${feedback?'success':'mistake'}`} role="status"><span className="feedback-emoji">{feedback?'★':'↗'}</span><div><h3>{feedback?'מצוין! תשובה נכונה!':'לא נורא, ככה לומדים!'}</h3><p>{question.solution}</p><b>התשובה: <span dir="ltr">{question.answer}</span></b></div></div>}
            {feedback!==null&&<><button className="btn primary wide next-button" onClick={nextQuestion}>{roundLength>0&&index+1>=roundLength?'לסיכום האימון':'לשאלה הבאה'} <ArrowLeft size={20}/></button>{roundLength===0&&<button className="btn secondary wide" onClick={finishPractice}>מסיימים את האימון <Trophy size={17}/></button>}</>}
          </div>
        </div><aside className="practice-aside"><div className="practice-side-card"><div className="side-big-icon"><Trophy size={31}/></div><span>ענית נכון באימון הזה</span><b>{sessionCorrect}</b><small>מתוך {index+(feedback!==null?1:0)} שאלות שנבדקו</small></div><div className="side-notice"><CircleHelp size={20}/>כל התשובות נבדקות מיד. תמיד אפשר ללמוד מחדש או לתרגל בלי הגבלה.</div><button className="outline-button" onClick={()=>setPhase('learn')}><BookOpen size={17}/> חוזרים להסבר</button></aside></section>}
        {phase==='result'&&<section className="result-card panel"><div className="result-glow"><Trophy size={62}/></div><Badge>כל הכבוד!</Badge><h1>סיימת אימון!</h1><p>כל ניסיון עוזר לך להבין יותר ולהתחזק במתמטיקה.</p><div className="result-score"><strong>{sessionCorrect} / {index+1}</strong><span>תשובות נכונות</span></div><Stars value={progress.stats[selected.id]?.stars||0}/><div className="result-buttons"><button className="btn primary" onClick={startPractice}><RefreshCw size={17}/> עוד אימון</button><button className="btn secondary" onClick={()=>navigate('curriculum')}>חזרה לכל השיעורים</button></div></section>}
        <div className="lesson-footer"><button onClick={()=>navigate('curriculum')}><ArrowRight size={17}/> חזרה לשיעורים</button><span>מתמטיקה בכיף · כיתה ג׳</span></div>
      </>}

      {page==='parent'&&<section className="parent-page"><div className="page-title"><div><Badge>פינת ההורים</Badge><h1>עוקבים אחרי ההתקדמות</h1><p>התוצאות נשמרות בדפדפן של המכשיר הזה בלבד. אין חשבון משתמש ואין שרת.</p></div><div className="doodle" aria-hidden="true">★ ★ ★</div></div>
        {!parentUnlocked?<div className="parent-gate panel"><LockKeyhole size={40}/><h2>האזור הזה מיועד להורים</h2><p>כאן אפשר לראות תוצאות ולנהל גיבויים של ההתקדמות.</p><button className="btn primary" onClick={()=>setParentUnlocked(true)}>כניסה לאזור ההורים</button><small>אין כאן נעילה מאובטחת — זו הפרדה ידידותית לילדים.</small></div>:<div className="parent-panels">
          <div className="parent-stats panel"><h2>סיכום למידה</h2><div className="stats-row compact"><div><b>{stats.total}</b><span>תשובות</span></div><div><b>{stats.accuracy}%</b><span>דיוק</span></div><div><b>{stats.mastered}</b><span>שיעורים עם 2 כוכבים</span></div></div>
            <label className="name-field">איך קוראים לתלמיד/ה?<input value={progress.learner} maxLength={24} onChange={e=>setProgress(p=>({...p,learner:e.target.value}))}/></label>
            <h3>התקדמות לפי ספר</h3>{books.map(b=>{
              const list=lessons.filter(l=>l.book===b), done=list.filter(l=>(progress.stats[l.id]?.stars||0)>=2).length;
              return <div className="parent-book" key={b}><span>{bookTitles[b]}</span><b>{done}/{list.length}</b><div className="book-progress"><span style={{width:`${done/list.length*100}%`,background:bookColors[b]}}/></div></div>;
            })}
          </div>
          <div className="parent-tools panel"><h2>גיבוי ופרטיות</h2><p>אפשר להעביר את ההתקדמות למכשיר אחר באמצעות קובץ גיבוי. אין סנכרון אוטומטי.</p><div className="parent-tool-buttons"><button className="btn secondary" onClick={downloadBackup}><Download size={18}/> שמירת גיבוי</button><button className="btn secondary" onClick={()=>uploadRef.current?.click()}><Upload size={18}/> שחזור מגיבוי</button><input type="file" accept="application/json" ref={uploadRef} hidden onChange={e=>importBackup(e.target.files?.[0])}/></div><button className="danger-button" onClick={resetProgress}><RotateCcw size={17}/> מחיקת ההתקדמות</button><div className="privacy"><ShieldCheck size={19}/> המידע לא נשלח לשום שירות חיצוני.</div></div>
          <div className="parent-history panel"><h2>נושאים שכדאי לחזור עליהם</h2>{[...lessons].filter(l=>progress.stats[l.id]?.attempts>2).sort((a,b)=>{
            const x=progress.stats[a.id], y=progress.stats[b.id];return x.correct/x.attempts-y.correct/y.attempts;
          }).slice(0,8).map(l=><button key={l.id} className="history-line" onClick={()=>openLesson(l)}><span>{l.title}</span><b>{Math.round(progress.stats[l.id].correct/progress.stats[l.id].attempts*100)}%</b><ChevronLeft size={17}/></button>)}{stats.total===0&&<p>אחרי האימון הראשון יופיעו כאן המלצות.</p>}</div>
        </div>}
      </section>}
    </main>
    <footer className="site-footer"><div><span>✦ מתמטיקה בכיף</span><small>נוצר באהבה לתרגול עצמאי — תוכן מקורי בהתאמה לנושאי כיתה ג׳.</small></div><span>לומדים • מתרגלים • מצליחים</span></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
