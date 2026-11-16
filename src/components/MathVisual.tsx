import type { ReactNode } from 'react';
import type { Visual } from '../types';

const c = { violet: '#6c4fe0', aqua: '#19b8a2', amber: '#ffb020', coral: '#ff7a59', pink: '#ff6fa5', sky: '#3fa9f5', ink: '#2c2a4a', grid: '#e3e0f5' };
const SERIES = [c.violet, c.aqua, c.amber, c.pink];

function Angle({ degree, label }: { degree: number; label?: string }) {
  const radians = degree * Math.PI / 180, ox = 105, oy = 118, len = 84;
  const endX = ox + Math.cos(radians) * len, endY = oy - Math.sin(radians) * len;
  const arcX = ox + Math.cos(radians) * 30, arcY = oy - Math.sin(radians) * 30;
  return <svg role="img" aria-label={`זווית ${label || ''}`} viewBox="0 0 210 150" className="visual-angle">
    {degree !== 90 && <path d={`M ${ox + 30} ${oy} A 30 30 0 0 0 ${arcX} ${arcY} L ${ox} ${oy} Z`} fill="#ffe9a8" stroke={c.amber} strokeWidth="2"/>}
    {degree === 90 && <path d={`M ${ox + 20} ${oy} V ${oy - 20} H ${ox}`} fill="#ffe9a8" stroke={c.amber} strokeWidth="2.5"/>}
    <line x1={ox} y1={oy} x2={ox + len} y2={oy} stroke={c.violet} strokeWidth="7" strokeLinecap="round"/>
    <line x1={ox} y1={oy} x2={endX} y2={endY} stroke={c.aqua} strokeWidth="7" strokeLinecap="round"/>
    <circle cx={ox} cy={oy} r="7" fill={c.ink}/>
    {label && <text x="24" y="28" textAnchor="middle" fill={c.ink} fontSize="21" fontWeight="700">{label}</text>}
  </svg>;
}

function Grid({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) {
  const cell = Math.min(30, Math.floor(240 / Math.max(rows, cols))); const width = cols * cell, height = rows * cell;
  return <svg role="img" aria-label={`מלבן משבצות: ${rows} שורות, ${cols} עמודות`} viewBox={`-3 -3 ${width + 6} ${height + 6}`} style={{ width: width + 6, maxWidth: '100%' }}>
    <rect x="-1.5" y="-1.5" width={width + 3} height={height + 3} rx="7" fill="#fff" stroke={c.violet} strokeWidth="3"/>
    {Array.from({ length: rows * cols }, (_, i) => {
      const x = i % cols, y = Math.floor(i / cols);
      return <rect key={i} x={x * cell + 1.5} y={y * cell + 1.5} width={cell - 3} height={cell - 3} rx="4" fill={(x + y) % 2 === 0 ? '#bfeee2' : '#cfd6ff'}/>;
    })}
  </svg>;
}

type TriangleKind = NonNullable<Visual['triangle']>;
/** Vertices in the order: apex, bottom-left, bottom-right. */
const TRIANGLES: Record<TriangleKind, [number, number][]> = {
  equilateral: [[105, 17], [25, 158], [185, 158]],
  isosceles: [[105, 18], [47, 156], [163, 156]],
  scalene: [[64, 26], [15, 157], [184, 157]],
  right: [[38, 24], [38, 156], [184, 156]],
  obtuse: [[79, 109], [20, 155], [190, 155]],
};
function Triangle({ type, sides, plain }: { type: TriangleKind; sides?: number[]; plain?: boolean }) {
  const [apex, left, right] = TRIANGLES[type];
  const cx = (apex[0] + left[0] + right[0]) / 3, cy = (apex[1] + left[1] + right[1]) / 3;
  const edges: [[number, number], [number, number]][] = [[apex, left], [apex, right], [left, right]];
  const labelAt = (edge: [[number, number], [number, number]]) => {
    const mx = (edge[0][0] + edge[1][0]) / 2, my = (edge[0][1] + edge[1][1]) / 2;
    const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
    return [mx + dx / d * 40, my + dy / d * 20 + 6];
  };
  const tick = (edge: [[number, number], [number, number]], key: number) => {
    const mx = (edge[0][0] + edge[1][0]) / 2, my = (edge[0][1] + edge[1][1]) / 2;
    const dx = edge[1][0] - edge[0][0], dy = edge[1][1] - edge[0][1], d = Math.hypot(dx, dy);
    const nx = -dy / d * 8, ny = dx / d * 8;
    return <line key={key} x1={mx - nx} y1={my - ny} x2={mx + nx} y2={my + ny} stroke={c.ink} strokeWidth="3" strokeLinecap="round"/>;
  };
  const marked = sides || plain ? [] : type === 'equilateral' ? edges : type === 'isosceles' ? edges.slice(0, 2) : [];
  return <svg role="img" aria-label={sides ? `משולש שאורכי צלעותיו ${sides.join(', ')} ס״מ` : 'משולש'} viewBox="-62 -12 334 208" className="visual-triangle">
    <polygon points={[apex, left, right].map(p => p.join(',')).join(' ')} fill="#dff7f1" stroke={c.violet} strokeWidth="5" strokeLinejoin="round"/>
    {type === 'right' && <path d="M38 138H56V156" stroke={c.ink} strokeWidth="2.5" fill="none"/>}
    {marked.map(tick)}
    {sides && edges.map((edge, i) => { const [x, y] = labelAt(edge); return <text key={i} x={x} y={y} textAnchor="middle" fontSize="17" fontWeight="700" fill={c.ink}>{sides[i]} ס״מ</text>; })}
  </svg>;
}

function Clock({ h = 3, m = 0 }: { h?: number; m?: number }) {
  const hour = ((h % 12) + (m / 60)) * Math.PI / 6, minute = m * Math.PI / 30;
  const cx = 112, cy = 112;
  return <svg role="img" aria-label="שעון מחוגים" viewBox="0 0 224 224" className="visual-clock">
    <circle cx={cx} cy={cy} r="104" fill={c.violet}/>
    <circle cx={cx} cy={cy} r="94" fill="#fffdf6"/>
    {Array.from({ length: 60 }, (_, i) => { const theta = i * Math.PI / 30, outer = 90, inner = i % 5 === 0 ? 81 : 86; return <line key={i} x1={cx + Math.sin(theta) * inner} y1={cy - Math.cos(theta) * inner} x2={cx + Math.sin(theta) * outer} y2={cy - Math.cos(theta) * outer} stroke={i % 5 === 0 ? c.ink : '#b5b0d0'} strokeWidth={i % 5 === 0 ? 2.8 : 1.2}/>; })}
    {Array.from({ length: 12 }, (_, i) => { const j = i + 1, angle = j * Math.PI / 6; return <text key={i} x={cx + Math.sin(angle) * 67} y={cy - Math.cos(angle) * 67 + 7} textAnchor="middle" fontSize="19" fontWeight="700" fill={c.ink}>{j}</text>; })}
    <line x1={cx} y1={cy} x2={cx + Math.sin(hour) * 46} y2={cy - Math.cos(hour) * 46} stroke={c.coral} strokeWidth="9" strokeLinecap="round"/>
    <line x1={cx} y1={cy} x2={cx + Math.sin(minute) * 76} y2={cy - Math.cos(minute) * 76} stroke={c.aqua} strokeWidth="6" strokeLinecap="round"/>
    <circle cx={cx} cy={cy} r="8" fill={c.ink}/>
  </svg>;
}

/** Bar chart with a readable value axis. Reading the height against the axis is the skill being practised. */
function BarChart({ labels = [], values = [], values2 }: { labels?: string[]; values?: number[]; values2?: number[] }) {
  const top = Math.max(10, Math.ceil(Math.max(...values, ...(values2 || [])) / 2) * 2);
  const W = 340, H = 236, left = 34, bottom = 34, plotH = H - bottom - 14, plotW = W - left - 8;
  const y = (v: number) => 14 + plotH - v / top * plotH;
  const slot = plotW / Math.max(1, labels.length), gap = values2 ? 3 : 0;
  const barW = values2 ? Math.min(30, slot * 0.34) : Math.min(46, slot * 0.58);
  const describe = labels.map((l, i) => `${l}: ${values[i]}${values2 ? ` ו־${values2[i]}` : ''}`).join(', ');
  return <div className="chart-wrap">
    <svg role="img" aria-label={`דיאגרמת עמודות. ${describe}`} viewBox={`0 0 ${W} ${H}`} className="visual-chart">
      {Array.from({ length: top + 1 }, (_, v) => <g key={v}>
        <line x1={left} x2={W - 6} y1={y(v)} y2={y(v)} stroke={v === 0 ? c.ink : c.grid} strokeWidth={v === 0 ? 2 : v % 2 === 0 ? 1.4 : 0.7}/>
        {v % 2 === 0 && <text x={left - 7} y={y(v) + 5} textAnchor="middle" fontSize="13" fontWeight="600" fill={c.ink}>{v}</text>}
      </g>)}
      {labels.map((name, i) => {
        const mid = left + slot * i + slot / 2;
        return <g key={i}>
          {values2
            ? <>
              <rect x={mid - barW - gap / 2} y={y(values[i])} width={barW} height={y(0) - y(values[i])} rx="5" fill={c.violet}/>
              <rect x={mid + gap / 2} y={y(values2[i])} width={barW} height={y(0) - y(values2[i])} rx="5" fill={c.amber}/>
            </>
            : <rect x={mid - barW / 2} y={y(values[i])} width={barW} height={y(0) - y(values[i])} rx="6" fill={SERIES[i % 4]}/>}
          <text x={mid} y={H - 11} textAnchor="middle" fontSize="14" fontWeight="600" fill={c.ink}>{name}</text>
        </g>;
      })}
    </svg>
    {values2 && <div className="chart-legend"><span><i style={{ background: c.violet }}/>קבוצה א׳</span><span><i style={{ background: c.amber }}/>קבוצה ב׳</span></div>}
  </div>;
}

function NumberLine({ ticks = [], missing = -1 }: { ticks?: number[]; missing?: number }) {
  const W = 340, left = 34, right = W - 34, step = (right - left) / Math.max(1, ticks.length - 1);
  const label = ticks.map((t, i) => i === missing ? 'סימן שאלה' : t.toLocaleString('en-US')).join(', ');
  return <svg role="img" aria-label={`ישר מספרים: ${label}`} viewBox={`0 0 ${W} 96`} className="visual-line" direction="ltr">
    <line x1="8" x2={W - 8} y1="34" y2="34" stroke={c.ink} strokeWidth="3" strokeLinecap="round"/>
    <path d={`M${W - 8} 34l-9 -6v12z M8 34l9 -6v12z`} fill={c.ink}/>
    {ticks.map((t, i) => {
      const x = left + i * step;
      return <g key={i}>
        <line x1={x} x2={x} y1="22" y2="46" stroke={c.violet} strokeWidth="4" strokeLinecap="round"/>
        {i === missing
          ? <><rect x={x - 19} y="56" width="38" height="32" rx="10" fill="#ffe9a8" stroke={c.amber} strokeWidth="2.5"/><text x={x} y="79" textAnchor="middle" fontSize="20" fontWeight="700" fill={c.ink}>?</text></>
          : <text x={x} y="78" textAnchor="middle" fontSize={t >= 1000 ? 14 : 16} fontWeight="700" fill={c.ink}>{t.toLocaleString('en-US')}</text>}
      </g>;
    })}
  </svg>;
}

function Net({ valid = false, cells }: { valid?: boolean; cells?: [number, number][] }) {
  const squares = cells || (valid ? [[1, 0], [1, 1], [0, 1], [2, 1], [1, 2], [1, 3]] : [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]);
  const side = 44;
  const maxX = Math.max(...squares.map(x => x[0])), maxY = Math.max(...squares.map(x => x[1]));
  const width = (maxX + 1) * side + 12, height = (maxY + 1) * side + 12;
  return <svg role="img" aria-label="פריסה של שישה ריבועים" viewBox={`0 0 ${width} ${height}`} style={{ width: Math.min(width, 260), maxWidth: '100%' }}>
    {squares.map(([x, y], i) => <rect key={i} x={6 + x * side} y={6 + y * side} width={side} height={side} rx="3" fill={['#cfe4ff', '#e0d5ff', '#c9f1e6', '#ffe2b8', '#ffd3e6', '#b9ebf2'][i % 6]} stroke={c.ink} strokeWidth="2.5" strokeLinejoin="round"/>)}
  </svg>;
}

const PLACE_NAMES = ['אחדות', 'עשרות', 'מאות', 'אלפים', 'רבבות'];
const PLACE_COLORS = ['#ffd9b0', '#c9f1e6', '#dcd2ff', '#ffd3e6', '#cfe4ff'];

export function MathVisual({ visual }: { visual?: Visual }) {
  if (!visual || visual.kind === 'none') return null;
  let body: ReactNode = null;
  switch (visual.kind) {
    case 'array': {
      const a = Math.min(visual.a ?? 3, 10), b = Math.min(visual.b ?? 4, 10);
      body = <div className="dot-array" role="img" aria-label={`${a} קבוצות של ${b}`} dir="ltr">
        {Array.from({ length: a }, (_, i) => <div className="dot-group" key={i}>{Array.from({ length: b }, (_, j) => <span key={j} className="dot" style={{ background: SERIES[i % 4] }}/>)}</div>)}
      </div>; break;
    }
    case 'angle': body = <Angle degree={visual.degrees ?? 60}/>; break;
    case 'angles': body = <div className="two-pictures"><Angle degree={visual.degrees ?? 45} label="א׳"/><Angle degree={visual.degrees2 ?? 120} label="ב׳"/></div>; break;
    case 'triangle': body = <Triangle type={visual.triangle ?? 'equilateral'} sides={visual.sides} plain={visual.a === 1}/>; break;
    case 'clock': body = <Clock h={visual.h} m={visual.m}/>; break;
    case 'grid': body = <Grid rows={visual.a} cols={visual.b}/>; break;
    case 'twoGrids': body = <div className="two-pictures"><div className="labelled"><b>א׳</b><Grid rows={visual.a} cols={visual.b}/></div><div className="labelled"><b>ב׳</b><Grid rows={visual.c} cols={visual.d}/></div></div>; break;
    case 'bars': body = <BarChart labels={visual.labels} values={visual.values}/>; break;
    case 'doubleBars': body = <BarChart labels={visual.labels} values={visual.values} values2={visual.values2}/>; break;
    case 'table': body = <table className="visual-table"><thead><tr><th>פריט</th><th>כמות</th></tr></thead><tbody>{(visual.labels || []).map((name, i) => <tr key={i}><td>{name}</td><td>{visual.values?.[i]}</td></tr>)}</tbody></table>; break;
    case 'pictogram': body = <div className="pictogram-view"><div className="pictogram-symbols" role="img" aria-label={`${visual.a || 4} סמלים`}>{Array.from({ length: visual.a || 4 }, (_, i) => <span key={i}>★</span>)}</div><div className="pictogram-key">מקרא: <span className="pictogram-star">★</span> = {visual.b || 2} פריטים</div></div>; break;
    case 'net': body = <Net valid={visual.valid} cells={visual.cells}/>; break;
    case 'numberLine': body = <NumberLine ticks={visual.ticks} missing={visual.missing}/>; break;
    case 'place': {
      const digits = String(visual.number ?? 4321).split('');
      body = <div className="place-visual" dir="ltr" role="img" aria-label={`המספר ${visual.number}`}>{digits.map((s, i) => {
        const place = digits.length - 1 - i;
        return <span key={i} className="place-digit" style={{ background: PLACE_COLORS[place % 5] }}><b>{s}</b><small>{PLACE_NAMES[place]}</small></span>;
      })}</div>; break;
    }
  }
  return <div className="math-visual">{body}</div>;
}
