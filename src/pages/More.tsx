import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, Download, Eye, EyeOff, LockKeyhole, Plus, RotateCcw, ShieldCheck, Smartphone, Trash2, Upload, Volume2, VolumeX } from 'lucide-react';
import { BADGES } from '../engine/achievements';
import { AVATARS, dayKey, levelInfo, normalizeProgress, summary } from '../engine/progress';
import { BOOKS, lessonById, lessons } from '../data';
import { Chip, Mascot, ProgressBar } from '../components/Bits';
import type { Profile, Progress, Settings } from '../types';

/* --------------------------------------------------------------- Rewards */
export function Rewards({ progress }: { progress: Progress }) {
  const level = levelInfo(progress.rewards), earned = BADGES.filter(b => progress.badges[b.id]).length;
  return <>
    <div className="page-head"><div><h1>האוסף שלי</h1><p>מדליות מקבלים על תרגול והתמדה. מה שהרווחת — נשאר שלך לתמיד.</p></div><Mascot mood="cheer" size={110}/></div>
    <section className="level-card card">
      <span className="level-badge">{level.number}</span>
      <div className="level-info"><b>רמה {level.number} · {level.title}</b><ProgressBar value={level.percent} color="linear-gradient(90deg,#ffc93c,#ff8a4c)"/><small>⭐ {progress.rewards.toLocaleString('en-US')} נקודות · {earned} מתוך {BADGES.length} מדליות</small></div>
    </section>
    <div className="badge-grid">
      {BADGES.map(b => {
        const at = progress.badges[b.id];
        return <div key={b.id} className={`badge${at ? ' earned' : ''}`} style={{ ['--accent' as string]: b.color }}>
          <span className="badge-emoji" aria-hidden="true">{at ? b.emoji : '🔒'}</span>
          <b>{b.title}</b><small>{b.desc}</small>
          {at ? <em>הושג ב־{new Date(at).toLocaleDateString('he-IL')}</em> : <em>עוד לא הושג</em>}
        </div>;
      })}
    </div>
  </>;
}

/* ----------------------------------------------------------- Times table */
export function TimesTable() {
  const [cell, setCell] = useState<[number, number]>([3, 4]);
  const [hidden, setHidden] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [a, b] = cell, nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const pick = (r: number, c: number) => { setCell([r, c]); setRevealed(old => ({ ...old, [`${r}x${c}`]: true })); };
  return <>
    <div className="page-head"><div><h1>לוח הכפל</h1><p>לחצו על משבצת כדי לראות את התרגיל ואת הקבוצות. רוצים לבחון את עצמכם? הסתירו את התוצאות.</p></div>
      <button className="btn btn-quiet" onClick={() => { setHidden(h => !h); setRevealed({}); }}>{hidden ? <><Eye size={18}/> מציגים תוצאות</> : <><EyeOff size={18}/> מסתירים תוצאות</>}</button>
    </div>
    <div className="table-layout">
      <div className="card table-card"><div className="times-table" dir="ltr" role="grid" aria-label="לוח הכפל">
        <span className="tt-corner">×</span>
        {nums.map(n => <span key={`h${n}`} className={`tt-head${n === b ? ' hot' : ''}`}>{n}</span>)}
        {nums.map(r => [
          <span key={`r${r}`} className={`tt-head${r === a ? ' hot' : ''}`}>{r}</span>,
          ...nums.map(col => {
            const selected = r === a && col === b, inBox = r <= a && col <= b, show = !hidden || revealed[`${r}x${col}`];
            return <button key={`${r}x${col}`} role="gridcell" aria-label={`${r} כפול ${col}`} aria-selected={selected} className={`tt-cell${selected ? ' selected' : inBox ? ' in-box' : ''}`} onClick={() => pick(r, col)}>{show ? r * col : '?'}</button>;
          }),
        ])}
      </div></div>
      <div className="card table-side">
        <div className="expression" dir="ltr">{a} × {b} = <span className="expr-ask">{a * b}</span></div>
        <p>{a} שורות של {b} — ביחד {a * b}.</p>
        <div className="dot-array" dir="ltr" role="img" aria-label={`${a} שורות של ${b}`}>
          {Array.from({ length: a }, (_, i) => <div className="dot-group" key={i}>{Array.from({ length: b }, (_, j) => <span key={j} className="dot small" style={{ background: ['#6c4fe0', '#19b8a2', '#ffb020', '#ff6fa5'][i % 4] }}/>)}</div>)}
        </div>
        <p className="muted">טיפ: <bdi dir="ltr">{a} × {b}</bdi> שווה בדיוק כמו <bdi dir="ltr">{b} × {a}</bdi>.</p>
      </div>
    </div>
  </>;
}

/* -------------------------------------------------------------- Profiles */
export function ProfileForm({ initialName = '', initialAvatar = AVATARS[0], submitLabel, onSubmit, onCancel }: {
  initialName?: string; initialAvatar?: string; submitLabel: string; onSubmit: (name: string, avatar: string) => void; onCancel?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  return <form className="profile-form" onSubmit={e => { e.preventDefault(); onSubmit(name, avatar); }}>
    <label className="field">איך קוראים לך?<input value={name} maxLength={24} onChange={e => setName(e.target.value)} placeholder="השם שלי" autoComplete="off"/></label>
    <div className="field">בוחרים דמות<div className="avatar-grid" role="radiogroup" aria-label="בחירת דמות">
      {AVATARS.map(a => <button type="button" key={a} role="radio" aria-checked={avatar === a} className={avatar === a ? 'selected' : ''} onClick={() => setAvatar(a)}>{a}</button>)}
    </div></div>
    <div className="form-buttons">
      <button type="submit" className="btn btn-primary btn-big">{submitLabel} <ArrowLeft size={20}/></button>
      {onCancel && <button type="button" className="btn btn-quiet" onClick={onCancel}>ביטול</button>}
    </div>
  </form>;
}

export function Welcome({ onCreate }: { onCreate: (name: string, avatar: string) => void }) {
  return <section className="welcome card">
    <Mascot mood="cheer" size={150}/>
    <h1>ברוכים הבאים ל<span>מתמטיקה בכיף</span>!</h1>
    <p>אני מיקו, ואני אלווה אותך בדרך. לומדים, מתרגלים ואוספים כוכבים — בקצב שלך.</p>
    <ProfileForm submitLabel="יוצאים לדרך" onSubmit={onCreate}/>
  </section>;
}

export function Profiles({ profiles, activeId, onSelect, onCreate }: { profiles: Profile[]; activeId: string | null; onSelect: (id: string) => void; onCreate: (name: string, avatar: string) => void }) {
  const [adding, setAdding] = useState(false);
  return <>
    <div className="page-head"><div><h1>מי לומד עכשיו?</h1><p>לכל ילד וילדה יש התקדמות, כוכבים ומדליות משלהם.</p></div></div>
    <div className="profile-grid">
      {profiles.map(p => <button key={p.id} className={`profile-card${p.id === activeId ? ' active' : ''}`} onClick={() => onSelect(p.id)}>
        <span className="avatar big">{p.progress.avatar}</span><b>{p.progress.learner}</b>
        <small>רמה {levelInfo(p.progress.rewards).number} · ⭐ {p.progress.rewards.toLocaleString('en-US')}</small>
      </button>)}
      {!adding && <button className="profile-card add" onClick={() => setAdding(true)}><span className="avatar big"><Plus size={34}/></span><b>תלמיד/ה חדש/ה</b><small>מוסיפים עוד שחקן</small></button>}
    </div>
    {adding && <section className="card"><ProfileForm submitLabel="מוסיפים" onSubmit={(n, a) => { onCreate(n, a); setAdding(false); }} onCancel={() => setAdding(false)}/></section>}
  </>;
}

/* ---------------------------------------------------------------- Parent */
function ParentGate({ onUnlock }: { onUnlock: () => void }) {
  const [a, b] = useMemo(() => [12 + Math.floor(Math.random() * 7), 6 + Math.floor(Math.random() * 4)], []);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  return <form className="gate card" onSubmit={e => { e.preventDefault(); if (Number(value) === a * b) onUnlock(); else { setWrong(true); setValue(''); } }}>
    <LockKeyhole size={42}/>
    <h2>האזור הזה מיועד להורים</h2>
    <p>כדי להיכנס, פתרו את התרגיל:</p>
    <div className="expression" dir="ltr">{a} × {b} = <span className="expr-ask">?</span></div>
    <input dir="ltr" inputMode="numeric" value={value} onChange={e => { setValue(e.target.value.replace(/\D/g, '').slice(0, 4)); setWrong(false); }} aria-label="התשובה" autoComplete="off"/>
    {wrong && <p className="error" role="alert">זו לא התשובה. נסו שוב.</p>}
    <button className="btn btn-primary" type="submit" disabled={!value}>כניסה</button>
    <small>זו הפרדה ידידותית לילדים, לא נעילה מאובטחת.</small>
  </form>;
}

export type ParentProps = {
  progress: Progress; settings: Settings; profiles: Profile[]; activeId: string;
  go: (route: string) => void;
  setProgress: (fn: (p: Progress) => Progress) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void; deleteProfile: (id: string) => void;
  notify: (text: string) => void;
};

const dayLabel = (key: string, options: Intl.DateTimeFormatOptions) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('he-IL', options); };

export function Parent(props: ParentProps) {
  const [unlocked, setUnlocked] = useState(false);
  return <>
    <div className="page-head"><div><h1>פינת ההורים</h1><p>מעקב אחר ההתקדמות, הגדרות וגיבוי. הכול נשמר במכשיר הזה בלבד — בלי חשבון, בלי שרת ובלי פרסומות.</p></div></div>
    {unlocked ? <ParentBody {...props}/> : <ParentGate onUnlock={() => setUnlocked(true)}/>}
  </>;
}

function ParentBody({ progress, settings, profiles, activeId, go, setProgress, updateSettings, resetProgress, deleteProfile, notify }: ParentProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const stats = summary(progress);
  const last14 = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const key = dayKey(Date.now() - (13 - i) * 86400000);
    return { key, ...(progress.days[key] || { answers: 0, correct: 0 }) };
  }), [progress.days]);
  const peak = Math.max(10, ...last14.map(d => d.answers));
  const rated = lessons.filter(l => (progress.stats[l.id]?.attempts || 0) >= 5).map(l => ({ lesson: l, accuracy: Math.round(progress.stats[l.id].correct / progress.stats[l.id].attempts * 100), attempts: progress.stats[l.id].attempts }));
  const strong = rated.filter(r => r.accuracy >= 80).sort((x, y) => y.accuracy - x.accuracy).slice(0, 6);
  const weak = rated.filter(r => r.accuracy < 70).sort((x, y) => x.accuracy - y.accuracy).slice(0, 6);
  const history = useMemo(() => {
    const byDay = new Map<string, { answers: number; correct: number; titles: Set<string> }>();
    for (const log of progress.logs) {
      const key = dayKey(log.at), day = byDay.get(key) || { answers: 0, correct: 0, titles: new Set<string>() };
      day.answers++; if (log.correct) day.correct++;
      day.titles.add(lessonById.get(log.lessonId)?.title || log.lessonId);
      byDay.set(key, day);
    }
    return [...byDay.entries()].sort((x, y) => y[0].localeCompare(x[0])).slice(0, 10);
  }, [progress.logs]);

  function downloadBackup() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `matematika-bekef-${progress.learner.replace(/[^\w֐-׿]+/g, '-')}-${dayKey()}.json`;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('קובץ הגיבוי נשמר בתיקיית ההורדות.');
  }
  async function importBackup(file?: File) {
    if (uploadRef.current) uploadRef.current.value = '';
    if (!file) return;
    let data: Progress | null = null;
    try { data = normalizeProgress(JSON.parse(await file.text())); } catch { data = null; }
    if (!data) { window.alert('הקובץ אינו קובץ גיבוי תקין של מתמטיקה בכיף.'); return; }
    if (!window.confirm(`לשחזר את ההתקדמות של "${data.learner}" מהקובץ? ההתקדמות הנוכחית של "${progress.learner}" תוחלף.`)) return;
    const restored = data;
    setProgress(() => restored);
    notify('השחזור הצליח!');
  }

  return <div className="parent">
    <section className="card parent-wide">
      <h2>{progress.avatar} הסיכום של {progress.learner}</h2>
      <div className="stat-row">
        <div className="stat"><b>{stats.total}</b><small>שאלות שנענו</small></div>
        <div className="stat"><b>{stats.accuracy}%</b><small>דיוק כללי</small></div>
        <div className="stat"><b>{stats.mastered}/{lessons.length}</b><small>שיעורים שהושלמו (2 כוכבים ומעלה)</small></div>
        <div className="stat"><b>{stats.days}</b><small>ימי תרגול</small></div>
      </div>
      <h3>פעילות ב־14 הימים האחרונים</h3>
      <div className="activity" dir="ltr" role="img" aria-label={`פעילות יומית: ${last14.map(d => `${dayLabel(d.key, { day: 'numeric', month: 'numeric' })}: ${d.answers} שאלות`).join(', ')}`}>
        {last14.map(d => <div key={d.key} className="activity-day" title={`${d.answers} שאלות, ${d.correct} נכונות`}>
          <span className="activity-count">{d.answers || ''}</span>
          <div className="activity-track"><i style={{ height: `${d.answers / peak * 100}%` }}/><i className="ok" style={{ height: `${d.correct / peak * 100}%` }}/></div>
          <small>{dayLabel(d.key, { day: 'numeric', month: 'numeric' })}</small>
        </div>)}
      </div>
      <p className="muted legend"><i className="dot-legend all"/> שאלות שנענו <i className="dot-legend ok"/> מתוכן נכונות</p>
    </section>

    <section className="card">
      <h2>💪 נושאים חזקים</h2>
      {strong.length ? strong.map(r => <button key={r.lesson.id} className="row-link" onClick={() => go(`lesson/${r.lesson.id}`)}><span>{r.lesson.title}</span><Chip tone="good">{r.accuracy}%</Chip><ChevronLeft size={17}/></button>)
        : <p className="muted">כאן יופיעו נושאים עם 80% הצלחה ומעלה (אחרי 5 שאלות לפחות בנושא).</p>}
    </section>
    <section className="card">
      <h2>🔁 כדאי לחזור ולתרגל</h2>
      {weak.length ? weak.map(r => <button key={r.lesson.id} className="row-link" onClick={() => go(`lesson/${r.lesson.id}`)}><span>{r.lesson.title}</span><Chip tone="warn">{r.accuracy}%</Chip><ChevronLeft size={17}/></button>)
        : <p className="muted">{rated.length ? 'אין כרגע נושאים שדורשים חיזוק. יופי!' : 'אחרי כמה אימונים יופיעו כאן נושאים שכדאי לחזק.'}</p>}
      <p className="muted small">נושא שעוד לא נלמד בכיתה אינו "חולשה" — ייתכן שפשוט טרם הגיעו אליו.</p>
    </section>

    <section className="card">
      <h2>📆 יומן תרגול</h2>
      {history.length ? <ul className="history">{history.map(([key, d]) => <li key={key}>
        <b>{dayLabel(key, { weekday: 'long', day: 'numeric', month: 'long' })}</b>
        <span>{d.answers} שאלות · {Math.round(d.correct / d.answers * 100)}% נכונות</span>
        <small>{[...d.titles].join(' · ')}</small>
      </li>)}</ul> : <p className="muted">עוד אין פעילות. היומן יתמלא אחרי האימון הראשון.</p>}
    </section>
    <section className="card">
      <h2>📚 התקדמות לפי ספר</h2>
      {BOOKS.map(b => {
        const list = lessons.filter(l => l.book === b.id), done = list.filter(l => (progress.stats[l.id]?.stars || 0) >= 2).length;
        return <div className="book-row" key={b.key}><span>{b.emoji} {b.label} · {b.name}</span><b>{done}/{list.length}</b><ProgressBar value={done / list.length * 100} color={b.color}/></div>;
      })}
      <p className="muted small">סדר השיעורים הוא מסלול מומלץ בהשראת ספרי כיתה ג׳ (9–12) ואינו חומר רשמי של משרד החינוך. סדר הלימוד משתנה בין כיתות ומורים — אפשר לבחור כל שיעור לפי מה שנלמד בכיתה. שיעורים המסומנים "העשרה" אינם חובה.</p>
    </section>

    <section className="card">
      <h2>👤 התלמיד/ה והגדרות</h2>
      <label className="field">שם<input value={progress.learner} maxLength={24} onChange={e => setProgress(p => ({ ...p, learner: e.target.value }))}/></label>
      <div className="field">דמות<div className="avatar-grid small" role="radiogroup" aria-label="בחירת דמות">
        {AVATARS.map(a => <button type="button" key={a} role="radio" aria-checked={progress.avatar === a} className={progress.avatar === a ? 'selected' : ''} onClick={() => setProgress(p => ({ ...p, avatar: a }))}>{a}</button>)}
      </div></div>
      <div className="toggles">
        <button className={`toggle${settings.sound ? ' on' : ''}`} aria-pressed={settings.sound} onClick={() => updateSettings({ sound: !settings.sound })}>{settings.sound ? <Volume2 size={19}/> : <VolumeX size={19}/>} צלילים</button>
        <button className={`toggle${settings.fontLarge ? ' on' : ''}`} aria-pressed={settings.fontLarge} onClick={() => updateSettings({ fontLarge: !settings.fontLarge })}><b>אא</b> כתב גדול</button>
      </div>
      <button className="btn btn-quiet btn-wide" onClick={() => go('profiles')}>החלפת תלמיד/ה או הוספת תלמיד/ה ({profiles.length})</button>
    </section>

    <section className="card">
      <h2>💾 גיבוי ופרטיות</h2>
      <p>ההתקדמות נשמרת רק בדפדפן של המכשיר הזה ואינה מסתנכרנת בין מכשירים. כדי להעביר אותה לטאבלט או למחשב אחר — שומרים קובץ גיבוי כאן ומשחזרים אותו שם.</p>
      <div className="button-row">
        <button className="btn btn-quiet" onClick={downloadBackup}><Download size={18}/> שמירת גיבוי</button>
        <button className="btn btn-quiet" onClick={() => uploadRef.current?.click()}><Upload size={18}/> שחזור מגיבוי</button>
        <input type="file" accept="application/json,.json" ref={uploadRef} hidden onChange={e => importBackup(e.target.files?.[0])}/>
      </div>
      <p className="privacy"><ShieldCheck size={19}/> שום מידע לא נשלח לשרת או לשירות חיצוני.</p>
      <div className="button-row danger-row">
        <button className="btn btn-danger" onClick={resetProgress}><RotateCcw size={17}/> איפוס ההתקדמות</button>
        {profiles.length > 1 && <button className="btn btn-danger" onClick={() => deleteProfile(activeId)}><Trash2 size={17}/> מחיקת התלמיד/ה</button>}
      </div>
    </section>

    <section className="card parent-wide">
      <h2><Smartphone size={22}/> התקנה על הטאבלט או הטלפון</h2>
      <ul className="help">
        <li><b>בטאבלט או בטלפון אנדרואיד:</b> פותחים בדפדפן Chrome, לוחצים על תפריט שלוש הנקודות ובוחרים "התקנת האפליקציה" או "הוספה למסך הבית".</li>
        <li><b>באייפד או באייפון:</b> פותחים בדפדפן Safari, לוחצים על כפתור השיתוף ובוחרים "הוסף למסך הבית".</li>
        <li><b>במחשב:</b> בדפדפן Chrome או Edge לוחצים על סמל ההתקנה שבשורת הכתובת.</li>
        <li>אחרי הפתיחה הראשונה האפליקציה עובדת גם בלי אינטרנט.</li>
        <li>הקראה בקול זמינה רק אם במכשיר מותקן קול בעברית.</li>
      </ul>
    </section>
  </div>;
}
