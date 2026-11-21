// GEBench evaluates image generation models as GUI environments across five task categories.
// The headline score is the page's GE Score, the mean of its five category scores on a 0 to 100 scale.
// This importer reads the Chinese and English result columns in the public project page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
const PAGE='https://stepfun-ai.github.io/GEBench/';
const board:Leaderboard={
 benchmark:'gebench-stepfun',url:PAGE,feed:`${PAGE} (Chinese and English result table)`,terms:'The GEBench repository is Apache 2.0 licensed. Results are credited to StepFun and collaborators with a link to the project.',
 parts:{singleStep:{name:'Single-Step',group:'Task category'},multiStep:{name:'Multi-Step',group:'Task category'},fictionApp:{name:'Fiction-App',group:'Task category'},realApp:{name:'Real-App',group:'Task category'},grounding:{name:'Grounding',group:'Task category'}},
 async fetch(){
  const ts=tables(await fetchText(PAGE)); const t=ts.find(x=>x[0]?.[0]?.text==='Model'&&x[1]?.[0]?.text==='single -step'); if(!t) throw new Error('GEBench: results table missing');
  const rows:LeaderboardRow[]=[];
  for(const r of t.slice(2)){if(r.length<13||!r[0].text.trim())continue;const v=r.slice(1,13).map(c=>Number(c.text));if(v.some(x=>!Number.isFinite(x)))continue;
   rows.push({model:r[0].text.trim(),setting:'Chinese',score:v[5],metrics:{singleStep:v[0],multiStep:v[1],fictionApp:v[2],realApp:v[3],grounding:v[4]}});
   rows.push({model:r[0].text.trim(),setting:'English',score:v[11],metrics:{singleStep:v[6],multiStep:v[7],fictionApp:v[8],realApp:v[9],grounding:v[10]}});
  }
  if(rows.length<24)throw new Error(`GEBench: ${rows.length} rows, expected 24`);return rows;
 }
}; export default board;
