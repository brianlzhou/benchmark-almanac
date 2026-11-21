// CryptanalysisBench measures the success rate of models breaking cryptographic tasks.
// The paper reports Tier 1 plus three Tier 2 variants and their full aggregate, with no single overall column.
// This importer stores the plain mean of those five success rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED = 'https://arxiv.org/html/2607.18538';
const board: Leaderboard = { benchmark: 'cryptanalysisbench', static: 'paper', url: FEED, feed: FEED, terms: PAPER_TERMS, headline: 'The paper reports no overall score, so this is the plain mean of Tier 1 and its four Tier 2 success-rate columns.', async fetch(): Promise<LeaderboardRow[]> {
 const t = paperTables(await paperHtml(FEED)).map(grid).find(t => t[1]?.[0] === 'Model' && t[1]?.[1] === 'Tier 1'); if (!t) throw new Error('CryptanalysisBench table missing');
 const rows = t.slice(2).map(r => { const model=r[0], v=r.slice(1,6).map(x=>Number(x.replace('%',''))); if (!model || v.length!==5 || v.some(x=>!Number.isFinite(x))) throw new Error(`Invalid row: ${r.join('|')}`); return {model, score:v.reduce((a,b)=>a+b,0)/5, metrics:{tier1:v[0],tier2Easy:v[1],tier2Medium:v[2],tier2Hard:v[3],tier2Full:v[4]}}; });
 return checked(rows,5);
}}; export default board;
