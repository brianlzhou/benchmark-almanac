// Apollo strategic-deception evaluations: covert action rate over all 26 OOD evaluations.
// The abstract gives the exact before/after rates. Lower is better.
// AS names identify research-trained variants, not the later production releases.
// These static paper results will not gain new models automatically.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2509.15541";
const board: Leaderboard = {
 benchmark: "apollo-research-strategic-deception-evaluations",
 url: "https://arxiv.org/html/2509.15541",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {

 const s = text(await fetchText(FEED));
 const m = s.match(/OpenAI o3:\s*([\d.]+)%\s*[→➝]\s*([\d.]+)%;\s*OpenAI o4-mini:\s*([\d.]+)%\s*[→➝]\s*([\d.]+)%/);
 if (!m) throw new Error('Apollo abstract score pattern changed');
 return checked([{model:'o3 (paper baseline)',score:Number(m[1])},{model:'o3 AS (research variant)',score:Number(m[2])},{model:'o4-mini (paper baseline)',score:Number(m[3])},{model:'o4-mini AS (research variant)',score:Number(m[4])}]);

 },
};
export default board;
