// AgencyBench V2: S_Avg reports the complete 138-task benchmark score. Signed differences are annotations, not scores.
// The efficiency table reports average total tokens, hours, and turns per scenario. These remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2601.11044";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "agencybench",
  url: "https://github.com/GAIR-NLP/AgencyBench",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  aliases: { 'Claude-4.5-Opus': 'claude-opus-4-5', 'Claude-4.5-Sonnet': 'claude-sonnet-4-5' },
  async fetch(): Promise<LeaderboardRow[]> {
    const ts=await paperTables(FEED),t=ts[4];
    if(!t?.[0]?.some(c=>c.text.includes('S_{Avg}')))throw new Error('AgencyBench headline table changed');
    const efficiency=new Map(ts[9].filter(r=>r.length===4&&num(r[1].text)!==undefined).map(r=>[r[0].text.toLowerCase(),r]));
    const keys=['game','frontend','backend','code','research','mcp','averageScore','attempts'];
    const rows:LeaderboardRow[]=[];
    for(const r of t){if(r.length!==9||num(r[7].text)===undefined)continue;
      const metrics:Record<string,number>={};keys.forEach((k,i)=>metrics[k]=num(r[i+1].text)!);
      const e=efficiency.get(r[0].text.toLowerCase());if(e){metrics.totalTokensPerScenario=num(e[1].text)!*1e6;metrics.secondsPerScenario=num(e[2].text)!*3600;metrics.turnsPerScenario=num(e[3].text)!;}
      rows.push({model:paperModel(r[0].text),score:num(r[7].text)!,metrics});
    }if(rows.length!==9)throw new Error('AgencyBench expected nine models');return rows;
  },
};
export default board;
