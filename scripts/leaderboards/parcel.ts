// PARCEL tests legal claim verification with holding, reasoning, facts and related-label claims.
// The score is overall accuracy, reported as a percentage in the paper's model comparison table.
// This importer reads Table 2, Model performance metrics, from the paper HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED = 'https://arxiv.org/html/2610.10971';
const board: Leaderboard = { benchmark: 'parcel', static: 'paper', url: FEED, feed: FEED, terms: PAPER_TERMS,
  async fetch() { const t=grid(paperTables(await paperHtml(FEED))[2]); if(t[0]?.[1]!=='Overall Accuracy') throw new Error('PARCEL table changed'); const rows=t.slice(2).filter(r=>r[0]).map(r=>({model:r[0],score:Number(r[1])*100,metrics:{macroF1:Number(r[2])*100,supportedF1:Number(r[3])*100,refutedF1:Number(r[6])*100,notFoundF1:Number(r[9])*100}})); return checked(rows,7); }
}; export default board;
