// AnthroBench measures anthropomorphic behaviours in language-model responses.
// The paper reports no overall score. The headline is the plain mean of its 13 behaviour scores, computed here.
// The table's three evaluator-model columns are treated as benchmark rows and every behaviour is retained in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2502.07077';
const names = ['Sentience','Personal relationships','Personal history','Sensory input','Physical movement','Physical embodiment','Desires','Agency','Emotions','Explicit human-AI relationship reference','Validation','Empathy','Relatability'];
const board: Leaderboard = { benchmark: 'anthrobench', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS, headline: 'The paper reports no overall score, so this is the plain mean of its 13 behaviour scores.', parts: Object.fromEntries(names.map(name => [name,{name}])), async fetch(): Promise<LeaderboardRow[]> {
 const ts = paperTables(await paperHtml(URL)).map(grid); const t = ts.find(x => x[0]?.[0] === 'Behaviour' && x[0]?.[1] === 'gpt-4-turbo'); if (!t) throw new Error('AnthroBench model table missing');
 const cols = ['gpt-4-turbo','gemini-1.5-flash','claude-3.5-sonnet']; const rows = cols.map((model,j) => { const vals=t.slice(2).map(r=>Number(r[j+1])); if(vals.some(v=>!Number.isFinite(v))) throw new Error('AnthroBench score missing'); return {model,score:vals.reduce((a,b)=>a+b,0)/vals.length*100,metrics:Object.fromEntries(names.map((n,i)=>[n,vals[i]*100]))}; }); return checked(rows,3);
}};
export default board;
