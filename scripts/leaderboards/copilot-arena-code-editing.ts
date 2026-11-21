// Copilot Arena Code Editing compares code-edit suggestions by pairwise user votes.
// The importer reads the six-model Arena Score table embedded in Arena's article.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables} from '../lib/html.ts';
const FEED='https://arena.ai/blog/code-editing-in-copilot-arena-copilot';
const board:Leaderboard={benchmark:'copilot-arena-code-editing',url:FEED,feed:FEED,terms:'Arena publishes this article and its table. Results are credited to Arena.',aliases:{'Claude 3.5 Sonnet (10/22)':'claude-3-5-sonnet','GPT-4o (08/06)':'gpt-4o','GPT-4o-mini (07/18)':'gpt-4o-mini','Qwen2.5-Coder-32B-Instruct (07/18)':'qwen-2-5-coder-32b-instruct','Gemini-1.5-pro-002':'gemini-1-5-pro','Meta-Llama-3.1-405B-Instruct':'llama-3-1-405b-instruct'},async fetch(){
 const raw=await fetchText(FEED); const html=raw.replaceAll('\\u003c','<').replaceAll('\\u003e','>').replaceAll('\\u0026','&').replaceAll('\\"','"'); const table=tables(html).find(t=>t.some(r=>r.some(c=>c.text==='Arena Score'))); if(!table)throw new Error('Copilot Arena table missing');
 const rows:LeaderboardRow[]=[]; for(const c of table.slice(1)){const model=c[0]?.text.trim(); const score=Number(c[1]?.text); const m=c[2]?.text.match(/\+(\d+)\/-([0-9]+)/); if(!model||!Number.isFinite(score)||!m)throw new Error('Copilot Arena row changed'); rows.push({model,score,low:score-Number(m[2]),high:score+Number(m[1])});} if(rows.length!==6)throw new Error(`Copilot Arena has ${rows.length} rows`); return rows;
}}; export default board;
