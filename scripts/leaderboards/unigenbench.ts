// UniGenBench: the author Space Overall leaderboard reports the whole-set score.
// The current paper is UniGenBench++, the paper linked by this catalog record.
// Only primary dimension averages remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://huggingface.co/spaces/CodeGoat24/UniGenBench_Leaderboard/resolve/main/leaderboard_data.json";
const board: Leaderboard = {
 benchmark: "unigenbench",
 url: "https://huggingface.co/spaces/CodeGoat24/UniGenBench_Leaderboard/resolve/main/leaderboard_data.json",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const data=await fetchJson<{leaderboard:Record<string,any>[]}>(FEED);
 const keys=['Style','World Knowledge','Attribute-Overall','Action-Overall','Relationship-Overall','Compound-Overall','Grammar-Overall','Layout-Overall','Logical Reasoning','Text'];
 return checked(data.leaderboard.map(r=>({model:r.model==='GPT-4o-1.5'?'GPT-Image-1.5':r.model,score:Number(r.Overall),metrics:Object.fromEntries(keys.filter(k=>Number.isFinite(r[k])).map(k=>[k,r[k]]))})),10);
 },
};
export default board;
