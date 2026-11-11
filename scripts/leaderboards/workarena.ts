// WorkArena: Table 2 WorkArena (33 tasks) is the original benchmark success rate.
// MiniWoB, WebArena, and WorkArena++ are separate tests. GPT-4o-V adds vision to the same base model.
// Category scores and standard error remain metrics.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2403.07718";
const board: Leaderboard = {
 benchmark: "workarena",
 url: "https://arxiv.org/html/2403.07718",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t.some(r=>r[0]==='WorkArena (33 tasks)'));
 if(!t)throw new Error('WorkArena overall row missing');const all=t.find(r=>r[0]==='WorkArena (33 tasks)')!;
 return checked(t[0].slice(1).map((model,j)=>({model:model==='GPT-4o-V'?'GPT-4o':model==='Llama3'?'Llama 3 (size unspecified)':model,setting:model==='GPT-4o-V'?'vision and accessibility tree':'accessibility tree',harness:'BrowserGym baseline agent',score:num(all[1+j*2])!,metrics:{standardError:num(all[2+j*2])!,...Object.fromEntries(t.slice(3,10).map(r=>[r[0],num(r[1+j*2])!]))}})),4);
 },
};
export default board;
