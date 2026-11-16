import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Delete, Star } from 'lucide-react';

export function Stars({ value, size = 18, animate = false }: { value: number; size?: number; animate?: boolean }) {
  return <span className={`stars${animate ? ' stars-pop' : ''}`} role="img" aria-label={`${value} מתוך 3 כוכבים`}>
    {[0, 1, 2].map(i => <Star key={i} size={size} className={i < value ? 'on' : 'off'} fill="currentColor" strokeWidth={0} style={animate ? { animationDelay: `${0.25 + i * 0.25}s` } : undefined}/>)}
  </span>;
}

export function Chip({ children, tone = 'soft' }: { children: ReactNode; tone?: string }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export type Mood = 'idle' | 'happy' | 'cheer' | 'think' | 'oops';
/** "Miko" — the app's own little mascot, drawn in SVG so it works offline at any size. */
export function Mascot({ mood = 'idle', size = 120 }: { mood?: Mood; size?: number }) {
  const eyesClosed = mood === 'happy' || mood === 'cheer';
  return <svg className={`mascot mascot-${mood}`} width={size} height={size} viewBox="0 0 140 140" aria-hidden="true">
    <ellipse cx="70" cy="131" rx="34" ry="5" fill="#2c2a4a" opacity=".12"/>
    <g className="mascot-body">
      <path d="M70 26V12" stroke="#2c2a4a" strokeWidth="4" strokeLinecap="round"/>
      <path className="mascot-antenna" d="M70 2l3.4 6.6 7.3 1-5.3 5.1 1.3 7.2-6.7-3.5-6.7 3.5 1.3-7.2-5.3-5.1 7.3-1z" fill="#ffc93c" stroke="#e8a400" strokeWidth="1.5" strokeLinejoin="round"/>
      {mood === 'cheer'
        ? <><path d="M26 66Q8 48 12 30" stroke="#5a3fd1" strokeWidth="12" strokeLinecap="round" fill="none"/><path d="M114 66Q132 48 128 30" stroke="#5a3fd1" strokeWidth="12" strokeLinecap="round" fill="none"/></>
        : <><path d="M27 80Q12 88 14 104" stroke="#5a3fd1" strokeWidth="12" strokeLinecap="round" fill="none"/><path d="M113 80Q128 88 126 104" stroke="#5a3fd1" strokeWidth="12" strokeLinecap="round" fill="none"/></>}
      <rect x="22" y="24" width="96" height="100" rx="46" fill="#7b5cf0"/>
      <ellipse cx="70" cy="92" rx="30" ry="24" fill="#a995ff"/>
      <circle cx="33" cy="84" r="8" fill="#ff8fb3" opacity=".7"/><circle cx="107" cy="84" r="8" fill="#ff8fb3" opacity=".7"/>
      {eyesClosed
        ? <><path d="M40 62q10 -12 20 0" stroke="#2c2a4a" strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M80 62q10 -12 20 0" stroke="#2c2a4a" strokeWidth="5" strokeLinecap="round" fill="none"/></>
        : <>
          <circle cx="50" cy="60" r="14" fill="#fff"/><circle cx="90" cy="60" r="14" fill="#fff"/>
          <circle className="mascot-pupil" cx={mood === 'think' ? 54 : 51} cy={mood === 'think' ? 54 : 61} r="7" fill="#2c2a4a"/>
          <circle className="mascot-pupil" cx={mood === 'think' ? 94 : 89} cy={mood === 'think' ? 54 : 61} r="7" fill="#2c2a4a"/>
          <circle cx={mood === 'think' ? 56 : 53} cy={mood === 'think' ? 51 : 58} r="2.4" fill="#fff"/><circle cx={mood === 'think' ? 96 : 91} cy={mood === 'think' ? 51 : 58} r="2.4" fill="#fff"/>
        </>}
      {mood === 'cheer' && <path d="M54 84q16 22 32 0z" fill="#2c2a4a"/>}
      {mood === 'happy' && <path d="M54 86q16 16 32 0" stroke="#2c2a4a" strokeWidth="5" strokeLinecap="round" fill="none"/>}
      {mood === 'idle' && <path d="M58 88q12 10 24 0" stroke="#2c2a4a" strokeWidth="5" strokeLinecap="round" fill="none"/>}
      {mood === 'think' && <circle cx="72" cy="90" r="5" fill="#2c2a4a"/>}
      {mood === 'oops' && <path d="M58 90q12 -4 24 2" stroke="#2c2a4a" strokeWidth="5" strokeLinecap="round" fill="none"/>}
    </g>
  </svg>;
}

const CONFETTI_COLORS = ['#6c4fe0', '#19b8a2', '#ffc93c', '#ff7a59', '#ff6fa5', '#3fa9f5'];
/** One burst of confetti. Change `burst` to fire again; 0 renders nothing. */
export function Confetti({ burst, pieces = 36 }: { burst: number; pieces?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!burst) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 1900);
    return () => window.clearTimeout(timer);
  }, [burst]);
  const items = useMemo(() => Array.from({ length: pieces }, (_, i) => ({
    left: 4 + Math.random() * 92, delay: Math.random() * 0.25, duration: 1.1 + Math.random() * 0.7,
    drift: (Math.random() - 0.5) * 220, spin: (Math.random() - 0.5) * 900, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: i % 3 === 0, size: 8 + Math.random() * 8,
  })), [burst, pieces]);
  if (!visible) return null;
  return <div className="confetti" aria-hidden="true">
    {items.map((p, i) => <i key={i} style={{
      left: `${p.left}%`, width: p.size, height: p.round ? p.size : p.size * 0.5, background: p.color, borderRadius: p.round ? '50%' : 2,
      animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
      ['--drift' as string]: `${p.drift}px`, ['--spin' as string]: `${p.spin}deg`,
    }}/>)}
  </div>;
}

/** On-screen number pad: a child can answer on a tablet without the system keyboard. */
export function Keypad({ onKey, time = false, disabled = false }: { onKey: (key: string) => void; time?: boolean; disabled?: boolean }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', time ? ':' : '', '0', 'back'];
  return <div className="keypad" dir="ltr" role="group" aria-label="מקלדת מספרים">
    {keys.map((k, i) => k === '' ? <span key={i}/> :
      <button type="button" key={i} disabled={disabled} className={`key${k === 'back' ? ' key-back' : k === ':' ? ' key-colon' : ''}`} onClick={() => onKey(k)} aria-label={k === 'back' ? 'מחיקה' : k === ':' ? 'נקודתיים' : k}>
        {k === 'back' ? <Delete size={26}/> : k}
      </button>)}
  </div>;
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return <div className="bar" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}/></div>;
}
