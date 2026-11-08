// Readers for the H2 paper tables. Expand author row and column spans before selecting a score.
// Ambiguous provider families remain unlisted rather than inheriting a later model snapshot.
import { tables as htmlTables, text, type Cell } from '../html.ts';
export function paperTables(html:string):Cell[][][] {
 return htmlTables(html.replace(/<math\b([^>]*)>[\s\S]*?<\/math>/gi, (whole, attrs:string) => {
  const alt=attrs.match(/alttext="([^"]*)"/);
  return alt ? text(alt[1]).replace(/\\(?:bm|mathbf|mathrm|text|underline|overline)\{([^{}]*)\}/g,'$1') : whole;
 }));
}
import type { LeaderboardRow } from '../../leaderboards/types.ts';
export function grid(table: Cell[][]): string[][] {
 const out: string[][] = [];
 for (let y=0; y<table.length; y++) {
  out[y] ??= []; let x=0;
  for (const cell of table[y]) {
   while (out[y][x] !== undefined) x++;
   const rs=Number(cell.attrs.rowspan || 1), cs=Number(cell.attrs.colspan || 1);
   for(let dy=0;dy<rs;dy++) for(let dx=0;dx<cs;dx++) {out[y+dy]??=[];out[y+dy][x+dx]=cell.text;}
   x+=cs;
  }
 }
 return out;
}
export function uncertain(model: string): string {
 return /^(?:gpt[- ]?4o(?:[- ]mini)?|gpt[- ]?4(?:[- ]turbo)?|gpt[- ]?3[.]5(?:[- ]turbo)?|gemini[- ]?(?:pro[- ]?)?1[.]5(?:[- ]?(?:pro|flash))?|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5(?:[- ]?sonnet)?|deepseek[- ]?(?:v3|r1)|claude|qwen[- ]max)$/i.test(model.trim()) ? `${model.trim()} (snapshot unspecified)` : model.trim();
}
export function checked(rows: LeaderboardRow[], min=1): LeaderboardRow[] {
 if(rows.length<min) throw new Error(`H2 source changed: only ${rows.length} rows`);
 const seen=new Set<string>();
 for(const r of rows) {
  if(!r.model || !Number.isFinite(r.score)) throw new Error('H2 source has an invalid score');
  r.model=uncertain(r.model.replace(/\s*\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g,'').replace('Claude-3.5-Sonnet2','Claude-3.5-Sonnet'));
  const k=JSON.stringify([r.model,r.setting,r.harness]);
  if(seen.has(k)) throw new Error(`H2 duplicate configuration: ${k}`);
  seen.add(k);
 }
 return rows;
}
// Some arXiv cells contain layout-only tables. Flatten those before calling the shared HTML reader.
export function flatPaperTables(html:string):Cell[][][] {
 const stack:number[]=[], ranges:[number,number][]=[];
 for(const m of html.matchAll(/<\/?table\b[^>]*>/gi)) {
  if(!m[0].startsWith('</'))stack.push(m.index!);
  else {const start=stack.pop();if(start!==undefined&&stack.length===1)ranges.push([start,m.index!+m[0].length]);}
 }
 for(const [a,b] of ranges.reverse())html=html.slice(0,a)+text(html.slice(a,b))+html.slice(b);
 return paperTables(html);
}
