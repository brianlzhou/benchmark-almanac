import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables,text,num } from '../lib/html.ts';
const URL='https://frontier-cs.org/v1/';
const board:Leaderboard={benchmark:'frontiercs-1-1',url:URL,feed:URL,terms:'Public MIT-licensed project results. The Almanac credits FrontierCS and links the source.',async fetch(){
 const t=tables(await fetchText(URL)).find(t=>t[0]?.some(c=>c.text==='Reasoning'));
 if(!t)throw new Error('FrontierCS 1.1 table missing');
 return t.slice(1).flatMap(r=>{const score=num(r[2]?.text);if(score===undefined)return [];
 const inner=r[1].html.match(/<span>([\s\S]*?)<\/span>\s*<\/span>/)?.[1]??r[1].html;const [model,h]=inner.split(/<small>/);
 return [{model:text(model),score,harness:h?text(h):undefined,setting:r[3]?.text}];});
 }};export default board;
