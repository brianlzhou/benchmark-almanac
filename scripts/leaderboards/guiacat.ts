// GuiaCat evaluates Catalan language understanding and generation tasks.
// The headline is the GuiaCat Matthews correlation coefficient, reported as percentages.
// This importer reads EuroEval's Catalan all-models table and keeps its validation and test values.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const PAGE='https://euroeval.com/datasets/catalan';
const board:Leaderboard={benchmark:'guiacat',url:PAGE,feed:PAGE,terms:'EuroEval publishes the leaderboard at https://euroeval.com/ under its public project terms.',parts:{guiaCat:{name:'GuiaCat MCC'}},async fetch(){
 const page=await fetchText(PAGE); const boot=page.match(/<script[^>]+src="([^"]+index-[^"]+\.js)"/); if(!boot)throw new Error('EuroEval bootstrap asset missing');
 const index=await fetchText(new URL(boot[1],PAGE).href); const m=index.match(/catalan_all_models-[A-Za-z0-9_-]+\.js/); if(!m)throw new Error('Catalan EuroEval asset missing');
 const js=await fetchText(`https://euroeval.com/assets/${m[0]}`); const start=js.indexOf('`'), end=js.lastIndexOf('`'); if(start<0||end<=start)throw new Error('Catalan table payload missing');
 const payload=js.slice(start+1,end); const header=payload.indexOf('Rank,'); if(header<0)throw new Error('Catalan CSV header missing'); const rows=parseCsv(payload.slice(header)); const out:LeaderboardRow[]=[]; const modelKey=Object.keys(rows[0]||{}).find(k=>k.includes('dummy'))||'Model'; const scoreKey=Object.keys(rows[0]||{}).find(k=>k.includes('sentiment')||k.includes('guia_cat'))||'guia_cat';
 for(const r of rows){const model=(r[modelKey]||'').replace(/<[^>]+>/g,'').trim(); const raw=(r[scoreKey]||'').replace(/<[^>]+>/g,''); const v=raw.match(/^([0-9.]+)/); if(!model||!v)continue; const vals=(raw.match(/[0-9.]+/g)||[]).map(Number); out.push({model,setting:/\(([^)]+)\)/.exec(model)?.[1],score:Number(v[1]),metrics:{guiaCat:vals[0]}});}
 return checked(out,2);
}}; export default board;
