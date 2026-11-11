// BrowserART: attack success rate is lower-is-better for the target browser agents. All six attack settings cover 100 behaviors.
// Section 4 names exact model snapshots and the Llama size. Attack techniques remain whole-benchmark settings.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2410.13886";
import { paperTables } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "browserart",
  url: "https://github.com/scaleapi/browser-art",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED))[1];if(!t?.[0]?.[0]?.text.includes('ASR'))throw new Error('BrowserART ASR table changed');
    const models=['o1-preview','o1-mini','gpt-4o-2024-08-06','gpt-4-turbo-2024-04-09','claude-3-opus-20240229','claude-3-5-sonnet-20240620','gemini-1.5-pro-001','Llama-3.1-405B-Instruct'];
    const rows:LeaderboardRow[]=[];for(const r of t.slice(2)){if(r.length!==9)continue;models.forEach((model,i)=>rows.push({model,score:num(r[i+1].text)!,setting:r[0].text,harness:'BrowserART browser agent'}));}
    if(rows.length!==48)throw new Error('BrowserART expected 48 configurations');return rows;
  },
};
export default board;
