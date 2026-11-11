// Official competition AUC as a percentage; specialized systems remain unlisted.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables,text,num} from '../lib/html.ts';
const PAGE='https://stanfordmlgroup.github.io/competitions/chexpert/';
const board:Leaderboard={benchmark:'chexpert',url:PAGE,feed:PAGE,terms:'Public Stanford competition leaderboard. The Almanac credits and links the source.',async fetch(){
 const t=tables(await fetchText(PAGE)).find(t=>t[0].some(c=>c.text==='AUC'));if(!t)throw new Error('CheXpert AUC table missing');
 return t.slice(1).flatMap(r=>{const score=num(r[3]?.text);if(score===undefined)return [];const model=text(r[2].html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,''));const ms=Date.parse(r[1].text);return [{model,score:score*100,date:Number.isFinite(ms)?new Date(ms).toISOString().slice(0,10):undefined,metrics:{radiologistsBelowCurve:num(r[4].text)!}}];});
}};export default board;
