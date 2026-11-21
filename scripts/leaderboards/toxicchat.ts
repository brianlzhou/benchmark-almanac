// ToxicChat tests toxicity detection on user prompts from the Vicuna demo.
// The headline is F1 score on the ToxicChat test set, in the paper's 0 to 100 scale.
// Table 1 reports precision, recall, F1, and jailbreak recall for four named detectors.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2310.17389';
const board:Leaderboard={benchmark:'toxicchat',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts[0];if(!t||t[0]?.[3]!=='F 1')throw new Error('ToxicChat table missing');const rows:LeaderboardRow[]=[];for(const r of t.slice(1)){if(!r[0])continue;rows.push({model:r[0],score:Number(r[3]),metrics:{precision:Number(r[1]),recall:Number(r[2]),jailbreakRecall:Number(r[4])}});}return checked(rows,4);}};export default board;
