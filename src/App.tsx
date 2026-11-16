import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award, BookOpen, Home as HomeIcon, Settings as SettingsIcon, Target, Volume2, VolumeX } from 'lucide-react';
import { BADGES, awardBadges } from './engine/achievements';
import { blankProgress, finishSession, loadStore, newProfile, registerAnswer, saveStore, type SessionOutcome } from './engine/progress';
import { playSound, setSoundEnabled } from './engine/sound';
import { chapters, lessonById } from './data';
import { Daily, Home, LessonPage, LessonPractice, Lessons, type PageProps } from './pages/Learn';
import { Parent, Profiles, Rewards, TimesTable, Welcome } from './pages/More';
import type { AnswerLog, Progress, Settings, Store } from './types';

const readRoute = () => decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).split('/').filter(Boolean);

type Toast = { id: number; text: string; emoji?: string };

export function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [route, setRoute] = useState<string[]>(readRoute);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storageOk, setStorageOk] = useState(true);
  const toastId = useRef(0);

  const profile = store.profiles.find(p => p.id === store.activeId) || null;
  const settings = store.settings;

  useEffect(() => { setStorageOk(saveStore(store)); }, [store]);
  useEffect(() => { setSoundEnabled(settings.sound); }, [settings.sound]);
  useEffect(() => { document.documentElement.classList.toggle('font-large', settings.fontLarge); }, [settings.fontLarge]);
  useEffect(() => {
    const onHash = () => { setRoute(readRoute()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('./sw.js').catch(() => { /* offline support is optional */ });
  }, []);

  const go = useCallback((to: string) => {
    const target = `#/${to}`;
    if (window.location.hash === target) window.scrollTo({ top: 0, behavior: 'smooth' });
    else window.location.hash = target;
  }, []);

  const notify = useCallback((text: string, emoji?: string) => {
    const id = ++toastId.current;
    setToasts(list => [...list.slice(-2), { id, text, emoji }]);
    window.setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 4200);
  }, []);

  /** Every progress change goes through here so badges are always re-evaluated. */
  const setProgress = useCallback((fn: (p: Progress) => Progress) => {
    setStore(s => ({
      ...s, profiles: s.profiles.map(p => p.id === s.activeId ? { ...p, progress: awardBadges(fn(p.progress), chapters) } : p),
    }));
  }, []);
  const updateSettings = useCallback((patch: Partial<Settings>) => setStore(s => ({ ...s, settings: { ...s.settings, ...patch } })), []);
  const recordAnswer = useCallback((log: AnswerLog) => setProgress(p => registerAnswer(p, log)), [setProgress]);
  const completeSession = useCallback((outcome: SessionOutcome) => setProgress(p => finishSession(p, outcome)), [setProgress]);

  // Celebrate badges earned since the last render of the same learner.
  const seenBadges = useRef<{ id: string | null; ids: Set<string> }>({ id: null, ids: new Set() });
  useEffect(() => {
    const ids = new Set(Object.keys(profile?.progress.badges || {}));
    const seen = seenBadges.current;
    if (profile && seen.id === profile.id) {
      const fresh = BADGES.filter(b => ids.has(b.id) && !seen.ids.has(b.id));
      if (fresh.length) { playSound('badge'); fresh.forEach(b => notify(`מדליה חדשה: ${b.title}`, b.emoji)); }
    }
    seenBadges.current = { id: profile?.id ?? null, ids };
  }, [profile, notify]);

  const createProfile = useCallback((name: string, avatar: string) => {
    const created = newProfile(name, avatar);
    setStore(s => ({ ...s, profiles: [...s.profiles, created], activeId: created.id }));
    go('');
  }, [go]);
  const selectProfile = useCallback((id: string) => { setStore(s => ({ ...s, activeId: id })); go(''); }, [go]);
  const resetProgress = useCallback(() => {
    if (!profile || !window.confirm(`לאפס את כל ההתקדמות של "${profile.progress.learner}" במכשיר הזה? לא ניתן לבטל את הפעולה.`)) return;
    setProgress(p => blankProgress(p.learner, p.avatar));
    notify('ההתקדמות אופסה.');
  }, [profile, setProgress, notify]);
  const deleteProfile = useCallback((id: string) => {
    const target = store.profiles.find(p => p.id === id);
    if (!target || !window.confirm(`למחוק את "${target.progress.learner}" ואת כל ההתקדמות שלו/ה? לא ניתן לבטל את הפעולה.`)) return;
    setStore(s => { const profiles = s.profiles.filter(p => p.id !== id); return { ...s, profiles, activeId: profiles[0]?.id ?? null }; });
    go('profiles');
  }, [store.profiles, go]);

  const [page, param] = route;
  const lesson = param ? lessonById.get(param) : undefined;
  const inPractice = (page === 'practice' && !!lesson) || page === 'daily';

  const content = useMemo(() => {
    if (!profile) return <Welcome onCreate={createProfile}/>;
    const props: PageProps = { progress: profile.progress, settings, profileId: profile.id, go, recordAnswer, completeSession, updateSettings };
    switch (page) {
      case 'lessons': return <Lessons {...props} book={param}/>;
      case 'lesson': return lesson ? <LessonPage key={lesson.id} {...props} lesson={lesson}/> : <Lessons {...props}/>;
      case 'practice': return lesson ? <LessonPractice key={lesson.id} {...props} lesson={lesson}/> : <Lessons {...props}/>;
      case 'daily': return <Daily key={profile.id} {...props}/>;
      case 'rewards': return <Rewards progress={profile.progress}/>;
      case 'table': return <TimesTable/>;
      case 'profiles': return <Profiles profiles={store.profiles} activeId={store.activeId} onSelect={selectProfile} onCreate={createProfile}/>;
      case 'parent': return <Parent progress={profile.progress} settings={settings} profiles={store.profiles} activeId={profile.id} go={go}
        setProgress={setProgress} updateSettings={updateSettings} resetProgress={resetProgress} deleteProfile={deleteProfile} notify={notify}/>;
      default: return <Home {...props}/>;
    }
  }, [profile, settings, page, param, lesson, store.profiles, store.activeId, go, recordAnswer, completeSession, updateSettings, createProfile, selectProfile, setProgress, resetProgress, deleteProfile, notify]);

  const nav = [
    { to: '', label: 'בית', icon: HomeIcon, on: !page },
    { to: 'lessons', label: 'שיעורים', icon: BookOpen, on: page === 'lessons' || page === 'lesson' || page === 'practice' },
    { to: 'daily', label: 'אתגר יומי', icon: Target, on: page === 'daily' },
    { to: 'rewards', label: 'האוסף שלי', icon: Award, on: page === 'rewards' },
    { to: 'parent', label: 'להורים', icon: SettingsIcon, on: page === 'parent' },
  ];

  return <div className={`app${inPractice ? ' in-practice' : ''}`} dir="rtl">
    <a className="skip-link" href="#main">דילוג לתוכן</a>
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={() => go('')} aria-label="מתמטיקה בכיף — לדף הבית">
          <span className="brand-logo" aria-hidden="true"><i>×</i><i>+</i><i>÷</i><i>=</i></span>
          <span className="brand-name"><strong>מתמטיקה בכיף</strong><small>כיתה ג׳</small></span>
        </button>
        {profile && <nav className="top-nav" aria-label="תפריט ראשי">
          {nav.map(n => <button key={n.to} className={n.on ? 'active' : ''} aria-current={n.on ? 'page' : undefined} onClick={() => go(n.to)}><n.icon size={19}/>{n.label}</button>)}
        </nav>}
        <div className="topbar-end">
          {profile && <button className="points" onClick={() => go('rewards')} aria-label={`${profile.progress.rewards} נקודות — לאוסף שלי`}>⭐ <b>{profile.progress.rewards.toLocaleString('en-US')}</b></button>}
          <button className="icon-btn" onClick={() => updateSettings({ sound: !settings.sound })} aria-pressed={settings.sound} aria-label={settings.sound ? 'השתקת צלילים' : 'הפעלת צלילים'} title={settings.sound ? 'השתקת צלילים' : 'הפעלת צלילים'}>{settings.sound ? <Volume2 size={21}/> : <VolumeX size={21}/>}</button>
          {profile && <button className="avatar" onClick={() => go('profiles')} aria-label={`${profile.progress.learner} — החלפת תלמיד`} title="החלפת תלמיד/ה">{profile.progress.avatar}</button>}
        </div>
      </div>
    </header>

    <main id="main" className="main">
      {!storageOk && <p className="warning" role="alert">הדפדפן לא מאפשר לשמור נתונים (ייתכן שזהו מצב גלישה פרטית). ההתקדמות לא תישמר אחרי סגירת הדף.</p>}
      {content}
    </main>

    {profile && <nav className="bottom-nav" aria-label="תפריט ראשי">
      {nav.map(n => <button key={n.to} className={n.on ? 'active' : ''} aria-current={n.on ? 'page' : undefined} onClick={() => go(n.to)}><n.icon size={23}/><span>{n.label}</span></button>)}
    </nav>}

    <footer className="footer"><span>✦ מתמטיקה בכיף · תוכן מקורי לתרגול עצמאי בנושאי כיתה ג׳</span><span>ההתקדמות נשמרת במכשיר הזה בלבד</span></footer>

    <div className="toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className="toast">{t.emoji && <span>{t.emoji}</span>}{t.text}</div>)}</div>
  </div>;
}
