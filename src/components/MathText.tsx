import { Fragment } from 'react';
import { splitMath } from '../engine/mathtext';

/** Hebrew sentence with its arithmetic fragments isolated as left-to-right. */
export function MathText({ text }: { text: string }) {
  return <>{splitMath(text).map((s, i) => s.math ? <bdi key={i} dir="ltr" className="mx">{s.text}</bdi> : <Fragment key={i}>{s.text}</Fragment>)}</>;
}

/** Big exercise line, always LTR. Blanks and the unknown are drawn as friendly boxes. */
export function Expression({ text, small = false }: { text: string; small?: boolean }) {
  const parts = text.split(/(__|□|\?)/);
  return <div dir="ltr" className={`expression${small ? ' expression-small' : ''}`}>
    {parts.map((part, i) => part === '__' || part === '□' ? <span key={i} className="expr-blank" aria-label="מקום ריק"/> :
      part === '?' ? <span key={i} className="expr-ask">?</span> : <Fragment key={i}>{part}</Fragment>)}
  </div>;
}

const HEBREW = /[֐-׿]/;
/** Answers without Hebrew letters (numbers, <, >, times) must not be mirrored by the RTL context. */
export function AnswerText({ text }: { text: string }) {
  return HEBREW.test(text) ? <>{text}</> : <bdi dir="ltr" className="mx">{text}</bdi>;
}
