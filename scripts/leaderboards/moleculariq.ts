// Gradio's public config contains the live overall table, even when its underlying dataset is private.
// Read data-value attributes for unrounded accuracy. The Space averages avg_accuracy across each model's rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
const feed='https://ml-jku-moleculariq-leaderboard.hf.space/config';
const board:Leaderboard={benchmark:'moleculariq',url:'https://huggingface.co/spaces/ml-jku/molecularIQ_leaderboard',feed,
 terms:'The authors publish this public Gradio leaderboard; the Almanac credits and links the original source.',
 async fetch():Promise<LeaderboardRow[]>{
  const d=await fetchJson<{components:{type:string;props:{value?:unknown}}[]}>(feed);let table:string|undefined;
  for(const c of d.components){if(c.type!=='html'||typeof c.props.value!=='string')continue;
   for(const t of c.props.value.match(/<table\b[\s\S]*?<\/table>/g)??[]){
    const head=tables(t)[0]?.[0]?.map(c=>c.text).join('|');
    if(head==='Rank|Model|Type|Size|Reasoning|Overall|Counting|Indexing|Generation'){table=t;break;}
   }if(table)break;
  }
  if(!table)throw new Error('MolecularIQ Overall table missing');const rows:LeaderboardRow[]=[];
  for(const tr of table.match(/<tr\b[\s\S]*?<\/tr>/g)??[]){
   const cells=[...tr.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/g)];if(cells.length!==9)continue;
   const values=cells.map(c=>text(c[2]));const scoreAt=(i:number)=>Number(cells[i][1].match(/data-value=['"]([^'"]+)['"]/)?.[1]??values[i]);
   const score=scoreAt(5);if(!Number.isFinite(score)||score<0||score>1)throw new Error('MolecularIQ accuracy outside 0–1');
   const effort=values[1].match(/\s*\((High|Medium|Low)\)$/i);let model=effort?values[1].slice(0,effort.index).trim():values[1];
   if(/^(GPT-4o|GPT-4o-mini|Gemini[- ]2\.5[- ](?:Pro|Flash)|Qwen-3 235B)$/i.test(model))model+=' [snapshot unspecified]';
   rows.push({model,score:score*100,setting:effort?.[1].toLowerCase(),metrics:{counting:scoreAt(6)*100,indexing:scoreAt(7)*100,generation:scoreAt(8)*100}});
  }if(!rows.length)throw new Error('MolecularIQ rows missing');return rows;
 }
};
export default board;
