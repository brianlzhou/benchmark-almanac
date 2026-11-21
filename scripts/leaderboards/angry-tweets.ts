// Angry Tweets tests Danish sentiment classification.
// EuroEval reports Matthews correlation as a percentage for the test split.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { text } from '../lib/html.ts';
const FEED='https://euroeval.com/leaderboards-csv/danish_all_models.csv';
const board:Leaderboard={benchmark:'angry-tweets',url:'https://euroeval.com/datasets/danish#angry-tweets',feed:FEED,terms:'EuroEval publishes this leaderboard publicly. The EuroEval software uses the MIT License. https://github.com/EuroEval/EuroEval/blob/main/LICENSE',async fetch(){
 const csv=await fetchText(FEED); const rows=parseCsv(csv.slice(csv.indexOf('Rank,Model,'))); const key=Object.keys(rows[0]).find(k=>k.includes('#angry-tweets')); if(!key)throw Error('Angry Tweets column missing');
 const out=rows.flatMap(r=>{const cell=r[key]; if(!cell||cell==='-')return []; const m=cell.match(/^(-?\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)(?:\s*\/\s*(-?\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?))?/); if(!m)throw Error('Invalid Angry Tweets score'); const label=text(r.Model).trim(); const setting=label.match(/\(([^)]+)\)$/)?.[1]; return [{model:label.replace(/ \([^)]+\)$/,''),setting,score:Number(m[1]),low:Number(m[1])-Number(m[2]),high:Number(m[1])+Number(m[2]),metrics:m[3]?{validation:Number(m[3])}:undefined}];});
 if(out.length<5)throw Error('Too few Angry Tweets rows'); return out;
}}; export default board;
