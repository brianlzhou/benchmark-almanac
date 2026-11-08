// SafeLIBERO: published Average task success rate TSR is the headline.
// Collision avoidance rate and execution steps remain metrics. No new average is computed.
// Translational and full action spaces are whole-benchmark configurations. Ours is AEGIS.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2512.11891";
const board: Leaderboard = {
 benchmark: "safelibero",
 url: "https://arxiv.org/html/2512.11891",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(grid).find(t=>t[0]?.[1]==='Translational Action Space Only');if(!t)throw new Error('SafeLIBERO table missing');const avg=t.find(r=>r[0]==='Average');if(!avg)throw new Error('SafeLIBERO average missing');const rows:LeaderboardRow[]=[];
 for(let i=1;i<19;i+=3){const raw=t[1][i];const model=raw.startsWith('Ours')?'AEGIS':raw.startsWith('\\pi')?'pi0.5':'OpenVLA-OFT';rows.push({model,score:num(avg[i+1])!,setting:i<10?'translational action space':'full action space',metrics:{collisionAvoidance:num(avg[i])!,executionSteps:num(avg[i+2])!}});}return checked(rows,6);
 },
};
export default board;
