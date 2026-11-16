import type { Visual } from '../types';
import type { ReactNode } from 'react';

const c = { violet:'#684fca', aqua:'#55b8a5', amber:'#f4aa55', ink:'#3f4262', grid:'#e4e1f3' };
function Angle({degree, label}:{degree:number,label?:string}) {
  const radians=degree*Math.PI/180;
  const endX=92+Math.cos(radians)*82, endY=112-Math.sin(radians)*82;
  return <svg role="img" aria-label={`זווית ${label||''}`} viewBox="0 0 210 150" className="visual-angle">
    <line x1="92" y1="112" x2="189" y2="112" stroke={c.violet} strokeWidth="7" strokeLinecap="round"/>
    <line x1="92" y1="112" x2={endX} y2={endY} stroke={c.aqua} strokeWidth="7" strokeLinecap="round"/>
    <circle cx="92" cy="112" r="7" fill={c.ink}/>
    {degree===90 && <path d="M109 112V95H92" fill="none" stroke={c.ink} strokeWidth="2"/>}
    {label && <text x="25" y="26" fill={c.ink} fontSize="20" fontWeight="700">{label}</text>}
  </svg>;
}
function Grid({rows=3,cols=4}:{rows?:number,cols?:number}) {
  const cell=Math.min(29,Math.floor(230/Math.max(rows,cols))); const width=cols*cell,height=rows*cell;
  return <svg role="img" aria-label={`${rows} שורות, ${cols} עמודות`} width={width+4} height={height+4} viewBox={`-2 -2 ${width+4} ${height+4}`}>
    {Array.from({length:rows*cols},(_,i)=><rect key={i} x={i%cols*cell+1} y={Math.floor(i/cols)*cell+1} width={cell-2} height={cell-2} rx="4" fill={(i+Math.floor(i/cols))%2===0?'#b4e7d8':'#c7d0ff'} stroke="#f7f8ff" strokeWidth="1"/>)}
  </svg>;
}
function Triangle({type}:{type:NonNullable<Visual['triangle']>}) {
  const points:Record<NonNullable<Visual['triangle']>,string>={
    equilateral:'105,17 25,158 185,158',
    isosceles:'105,18 47,156 163,156',
    scalene:'64,26 15,157 184,157',
    right:'38,24 38,156 184,156',
    obtuse:'20,155 190,155 79,109',
  };
  return <svg role="img" aria-label="משולש" viewBox="0 0 220 180" className="visual-triangle">
    <polygon points={points[type]} fill="#dff5ef" stroke={c.violet} strokeWidth="5" strokeLinejoin="round"/>
    {type==='right'&&<path d="M38 138H56V156" stroke={c.ink} strokeWidth="2" fill="none"/>}
    {type==='isosceles'&&<><path d="M65 99l12 5M140 99l-12 5" stroke={c.ink} strokeWidth="3"/></>}
    {type==='equilateral'&&<><path d="M55 99l12 6M151 99l-12 6M101 158v-14" stroke={c.ink} strokeWidth="3"/></>}
  </svg>;
}
function Clock({h=3,m=0}:{h?:number,m?:number}) {
  const hour=((h%12)+(m/60))*Math.PI/6, minute=m*Math.PI/30;
  const cx=112,cy=112;
  return <svg role="img" aria-label="שעון מחוגים" viewBox="0 0 224 224" className="visual-clock">
    <circle cx={cx} cy={cy} r="98" fill="#fffdf8" stroke="#c9c0eb" strokeWidth="7"/>
    {Array.from({length:60},(_,i)=>{const theta=i*Math.PI/30,outer=92,inner=i%5===0?80:88;return <line key={i} x1={cx+Math.sin(theta)*inner} y1={cy-Math.cos(theta)*inner} x2={cx+Math.sin(theta)*outer} y2={cy-Math.cos(theta)*outer} stroke="#aaa3c7" strokeWidth={i%5===0?2.8:1}/>;})}
    {Array.from({length:12},(_,i)=>{const j=i+1,angle=j*Math.PI/6;return <text key={i} x={cx+Math.sin(angle)*68} y={cy-Math.cos(angle)*68+6} textAnchor="middle" fontSize="17" fontWeight="800" fill={c.ink}>{j}</text>;})}
    <line x1={cx} y1={cy} x2={cx+Math.sin(hour)*49} y2={cy-Math.cos(hour)*49} stroke={c.violet} strokeWidth="9" strokeLinecap="round"/>
    <line x1={cx} y1={cy} x2={cx+Math.sin(minute)*76} y2={cy-Math.cos(minute)*76} stroke={c.aqua} strokeWidth="6" strokeLinecap="round"/>
    <circle cx={cx} cy={cy} r="9" fill={c.ink}/>
  </svg>;
}
function BarChart({labels=[],values=[]}:{labels?:string[],values?:number[]}) {
  const largest=Math.max(12,...values);
  return <div className="bar-chart" role="img" aria-label="דיאגרמת עמודות">
    {labels.map((name,i)=><div className="bar-unit" key={i}>
      <span className="bar-val">{values[i]}</span>
      <div className="bar-track"><div className="bar-fill" style={{height:`${(values[i]||0)/largest*100}%`,background:['#9276ec','#61c8b1','#f7ad6e','#ec95b7'][i%4]}}/></div>
      <span className="bar-name">{name}</span>
    </div>)}
  </div>;
}
function Net({valid=false,cells}:{valid?:boolean,cells?:[number,number][]}) {
  const squares=cells||(valid?[[1,0],[1,1],[0,1],[2,1],[1,2],[1,3]]:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]);
  const side=41;
  const maxX=Math.max(...squares.map(x=>x[0])),maxY=Math.max(...squares.map(x=>x[1]));
  const width=(maxX+1)*side+20,height=(maxY+1)*side+20;
  return <svg role="img" aria-label="פריסה של שישה ריבועים" viewBox={`0 0 ${width} ${height}`} style={{width:Math.min(width,250),height:'auto',maxWidth:'95%'}}>
    {squares.map(([x,y],i)=><rect key={i} x={10+x*side} y={10+y*side} width={side} height={side} fill={['#d9eaff','#e0d5ff','#d8f3ea','#ffe0ba','#f8d8ed','#aee6df'][i]} stroke={c.ink} strokeWidth="2"/>)}
  </svg>;
}
export function MathVisual({visual}:{visual?:Visual}) {
  if(!visual||visual.kind==='none')return null;
  let body:ReactNode=null;
  switch(visual.kind){
    case 'array': {
      const a=Math.min(visual.a??3,10),b=Math.min(visual.b??4,10);
      body=<div className="dot-array" role="img" aria-label={`${a} קבוצות של ${b}`}>
        {Array.from({length:a},(_,i)=><div className="dot-group" key={i}>{Array.from({length:b},(_,j)=><span key={j} className="dot"/>)}</div>)}
      </div>;break;
    }
    case 'angle': body=<Angle degree={visual.degrees??60}/>;break;
    case 'angles':body=<div className="two-pictures"><Angle degree={visual.degrees??45} label="א׳"/><Angle degree={visual.degrees2??120} label="ב׳"/></div>;break;
    case 'triangle':body=<Triangle type={visual.triangle??'equilateral'}/>;break;
    case 'clock':body=<Clock h={visual.h} m={visual.m}/>;break;
    case 'grid':body=<Grid rows={visual.a} cols={visual.b}/>;break;
    case 'twoGrids':body=<div className="two-pictures"><div><b>א׳</b><Grid rows={visual.a} cols={visual.b}/></div><div><b>ב׳</b><Grid rows={visual.c} cols={visual.d}/></div></div>;break;
    case 'bars':body=<BarChart labels={visual.labels} values={visual.values}/>;break;
    case 'table':body=<table className="visual-table"><thead><tr><th>פריט</th><th>כמות</th></tr></thead><tbody>{(visual.labels||[]).map((name,i)=><tr key={i}><td>{name}</td><td>{visual.values?.[i]}</td></tr>)}</tbody></table>;break;
    case 'pictogram':body=<div className="pictogram-view"><div className="pictogram-symbols">{Array.from({length:visual.a||4},(_,i)=><span key={i}>★</span>)}</div><div className="pictogram-key">מקרא: ★ = {visual.b||2} פריטים</div></div>;break;
    case 'doubleBars':body=<div><div className="double-chart">{(visual.labels||[]).map((label,i)=><div className="double-category" key={i}><div className="double-bars"><span style={{height:`${(visual.values?.[i]||0)/14*160}px`}} title={`קבוצה א: ${visual.values?.[i]}`}/><span style={{height:`${(visual.values2?.[i]||0)/14*160}px`}} title={`קבוצה ב: ${visual.values2?.[i]}`}/></div><small>{label}</small></div>)}</div><div className="double-legend"><span><i/>קבוצה א׳</span><span><i/>קבוצה ב׳</span></div></div>;break;
    case 'net':body=<Net valid={visual.valid} cells={visual.cells}/>;break;
    case 'place':body=<div className="place-visual" dir="ltr">{String(visual.number??4321).split('').map((s,i)=><span key={i} style={{background:['#d9d0fb','#d3f4eb','#ffe0c0','#f6d4e6'][i%4]}}>{s}</span>)}</div>;break;
  }
  return <div className="math-visual">{body}</div>;
}
