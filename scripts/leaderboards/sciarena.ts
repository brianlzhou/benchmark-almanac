// SciArena: Elo Score is the combined rating across scientific disciplines, not the SciArena-Eval judge-accuracy task.
// Cost per 100 calls remains a metric because calls are not benchmark tasks. Release-month inconsistencies are not model aliases.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2507.01001";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "sciarena",
  url: "https://sciarena.allen.ai/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  aliases: {
    'Claude-4.1-Opus': 'claude-opus-4-1', 'Claude-4-Opus': 'claude-opus-4',
    'Claude-4-Sonnet': 'claude-sonnet-4',
    'Qwen3-235B-A22B-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-30B-A3B-Instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
  },
  aliases: {
    'Claude-4.1-Opus': 'claude-opus-4-1', 'Claude-4-Opus': 'claude-opus-4',
    'Claude-4-Sonnet': 'claude-sonnet-4',
    'Qwen3-235B-A22B-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-30B-A3B-Instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED))[4];
    if(!t?.[0]?.some(c=>c.text==='Elo Score'))throw new Error('SciArena table changed');
    const rows:LeaderboardRow[]=[];
    for(const r of t){if(r.length!==9 || num(r[8].text)===undefined)continue;
      const model=paperModel(r[0].text.replace(/\s*\(\s*\)\s*$/,''));
      rows.push({model,score:num(r[8].text)!,metrics:{naturalScience:num(r[3].text)!,healthcare:num(r[4].text)!,humanities:num(r[5].text)!,engineering:num(r[6].text)!,costPer100Calls:num(r[7].text)!}});
    }if(rows.length<38)throw new Error('SciArena expected 38 rows');return rows;
  },
};
export default board;
