/** Hebrew text is right-to-left, but arithmetic is always read left-to-right.
 *  Without help the browser's bidi algorithm shows "12 ÷ 3" inside a Hebrew sentence as "3 ÷ 12"
 *  and mirrors "<" into ">". splitMath() finds the arithmetic fragments so the UI can isolate them as LTR. */
export type Segment = { text: string; math: boolean };

const CANDIDATE = /[\d(□][\d,.:()□_×÷+−=<>≈? ]*[\d)□?_]/g;
const OPERATOR = /[×÷+−=<>≈]/;
const BLANK = /__|□/;

export function splitMath(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  const push = (from: number, to: number, math: boolean) => {
    if (to <= from) return;
    const prev = out[out.length - 1];
    if (prev && prev.math === math && !math) prev.text += text.slice(from, to);
    else out.push({ text: text.slice(from, to), math });
  };
  for (const match of text.matchAll(CANDIDATE)) {
    const start = match.index, raw = match[0];
    if (!OPERATOR.test(raw) && !BLANK.test(raw)) continue;
    // A list such as "6×2=12, 12×2=24" is several statements: each is LTR, the list itself stays RTL.
    // A sequence with a blank ("120, 140, __") is kept as one LTR unit.
    const pieces = OPERATOR.test(raw) ? raw.split(/([,;] +)/) : [raw];
    let offset = start;
    pieces.forEach((piece, k) => {
      if (k % 2 === 0) {
        let body = piece.replace(/[,;.: ]+$/, '');
        // "4 × 6?" ends a Hebrew question; "4 × 6 = ?" is part of the exercise.
        if (/\?$/.test(body) && !/[=≈<>×÷+−]\s*\?$/.test(body)) body = body.replace(/\s*\?$/, '');
        if (OPERATOR.test(body) || BLANK.test(body)) {
          push(last, offset, false);
          push(offset, offset + body.length, true);
          last = offset + body.length;
        }
      }
      offset += piece.length;
    });
  }
  push(last, text.length, false);
  return out;
}
