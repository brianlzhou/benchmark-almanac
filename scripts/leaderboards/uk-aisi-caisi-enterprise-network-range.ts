// UK AISI and CAISI: Table 1 reports average steps completed on The Last Ones, the entire 32-step range.
// Token budgets are whole-range configurations. Maximum steps remain metrics. Cooling Tower is a different range.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2603.11214";
import { paperTables } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "uk-aisi-caisi-enterprise-network-range",
  url: "https://www.aisi.gov.uk/blog/how-do-frontier-ai-agents-perform-in-multi-step-cyber-attack-scenarios",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED)).find(t=>t[0]?.some(c=>c.text.includes('The Last Ones')));
    if(!t)throw new Error('AISI headline table missing');
    const names:Record<string,string>={'GPT-4o':'gpt-4o-2024-08-06','Sonnet 3.7':'Claude Sonnet 3.7','Sonnet 4.5':'Claude Sonnet 4.5','5.1 Codex':'GPT-5.1-Codex','Opus 4.5':'Claude Opus 4.5','5.3 Codex':'GPT-5.3-Codex','Opus 4.6':'Claude Opus 4.6'};
    const rows:LeaderboardRow[]=[];let model='';
    for(let r of t.slice(2)){
      if(r.length===8){model=names[r[0].text];r=r.slice(2);}if(r.length!==6||!model)throw new Error('AISI table structure changed');
      const budget=r[2].text.match(/^(\d+)@(\d+)M$/);if(!budget)throw new Error('AISI budget missing');
      rows.push({model,score:num(r[0].text)!,setting:budget[2]+'M token budget',metrics:{maximumSteps:num(r[1].text)!,runs:Number(budget[1])}});
    }if(rows.length!==12)throw new Error('AISI expected twelve configurations');return rows;
  },
};
export default board;
