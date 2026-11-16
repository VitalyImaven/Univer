/** Exact combinatorial generator and 3D-fold validity checker for six-square nets.
 * There are 35 free hexominoes: 11 are cube nets. No answer is guessed.
 */
export type Cell=[number,number];
type Vec=[number,number,number];
type Basis={u:Vec;v:Vec;n:Vec};
const negate=(a:Vec):Vec=>[-a[0],-a[1],-a[2]];
const eq=(a:Vec,b:Vec)=>a.every((x,i)=>x===b[i]);
const vecKey=(v:Vec)=>v.join(',');
const key=(x:number,y:number)=>`${x},${y}`;
export function normalizeCells(cells:Cell[]):Cell[]{
  const minX=Math.min(...cells.map(c=>c[0])),minY=Math.min(...cells.map(c=>c[1]));
  return cells.map(([x,y]):Cell=>[x-minX,y-minY]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
}
function transform(cells:Cell[],rotation:number,mirror:boolean):Cell[]{
  return normalizeCells(cells.map(([x,y])=>{
    let a=mirror?-x:x,b=y;
    for(let n=0;n<rotation;n++)[a,b]=[-b,a];
    return [a,b];
  }));
}
function shapeKey(cells:Cell[]):string {return cells.map(([x,y])=>key(x,y)).join(';');}
function canonicalKey(cells:Cell[]):string {
  const keys:string[]=[];
  for(let rot=0;rot<4;rot++)for(const mirrored of [false,true])keys.push(shapeKey(transform(cells,rot,mirrored)));
  return keys.sort()[0];
}
export function enumerateHexominoes():Cell[][]{
  let current:Cell[][]=[[[0,0]]];
  for(let size=2;size<=6;size++){
    const next=new Map<string,Cell[]>();
    for(const cells of current){
      const present=new Set(cells.map(([x,y])=>key(x,y)));
      for(const [x,y] of cells)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const newX=x+dx,newY=y+dy;
        if(present.has(key(newX,newY)))continue;
        const expanded=normalizeCells([...cells,[newX,newY]]);
        const canonical=canonicalKey(expanded);
        if(!next.has(canonical))next.set(canonical,expanded);
      }
    }
    current=[...next.values()];
  }
  return current;
}
export function isCubeNet(cells:Cell[]):boolean {
  if(cells.length!==6)return false;
  const lookup=new Set(cells.map(([x,y])=>key(x,y)));
  if(lookup.size!==6)return false;
  const start:Basis={u:[1,0,0],v:[0,1,0],n:[0,0,1]};
  const orientations=new Map<string,Basis>();
  const queue:Cell[]=[cells[0]];
  orientations.set(key(...cells[0]),start);
  while(queue.length){
    const [x,y]=queue.shift()!;
    const basis=orientations.get(key(x,y))!;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const k=key(x+dx,y+dy);
      if(!lookup.has(k))continue;
      let next:Basis;
      if(dx===1)next={u:negate(basis.n),v:basis.v,n:basis.u};
      else if(dx===-1)next={u:basis.n,v:basis.v,n:negate(basis.u)};
      else if(dy===1)next={u:basis.u,v:negate(basis.n),n:basis.v};
      else next={u:basis.u,v:basis.n,n:negate(basis.v)};
      const existing=orientations.get(k);
      if(existing){if(!eq(existing.u,next.u)||!eq(existing.v,next.v)||!eq(existing.n,next.n))return false;}
      else{orientations.set(k,next);queue.push([x+dx,y+dy]);}
    }
  }
  return orientations.size===6&&new Set([...orientations.values()].map(v=>vecKey(v.n))).size===6;
}
export const HEXOMINOES=enumerateHexominoes();
export const CUBE_NETS=HEXOMINOES.filter(isCubeNet);
export const NON_CUBE_NETS=HEXOMINOES.filter(c=>!isCubeNet(c));
export function rotateNet(cells:Cell[],rotation:number,mirror:boolean):Cell[]{return transform(cells,rotation,mirror);}
