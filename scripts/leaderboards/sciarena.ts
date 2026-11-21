// SciArena: Elo Score is the combined rating across scientific disciplines, not the SciArena-Eval judge-accuracy task.
// Cost per 100 calls remains a metric because calls are not benchmark tasks. Release-month inconsistencies are not model aliases.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2507.01001";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "sciarena", static: 'paper',
  parts: {
    naturalScience: { name: 'Natural science', group: 'Domain' },
    healthcare: { name: 'Healthcare', group: 'Domain' },
    humanities: { name: 'Humanities', group: 'Domain' },
    engineering: { name: 'Engineering', group: 'Domain' },
  },
  url: "https://sciarena.allen.ai/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  aliases: {
    'Claude-4.1-Opus': 'claude-opus-4-1', 'Claude-4-Opus': 'claude-opus-4',
    'Claude-4-Sonnet': 'claude-sonnet-4',
    'Qwen3-235B-A22B-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-30B-A3B-Instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const published = await paperTables(FEED);
    const t = published[4];
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const weights = new Map<string, boolean>();
    let open: boolean | undefined;
    for (const row of published.find(table => table[0]?.[0]?.text === 'Organization') ?? []) {
      if (row.length === 1) {
        open = /open.source/i.test(row[0].text) ? true : row[0].text === 'Proprietary Models' ? false : undefined;
      } else if (open !== undefined && row.length >= 4) {
        weights.set(normalize(row.at(-4)!.text), open);
        weights.set(normalize(row.at(-2)!.text), open);
      }
    }
    if(!t?.[0]?.some(c=>c.text==='Elo Score'))throw new Error('SciArena table changed');
    const rows:LeaderboardRow[]=[];
    for(const r of t){if(r.length!==9 || num(r[8].text)===undefined)continue;
      const model=paperModel(r[0].text.replace(/\s*\(\s*\)\s*$/,''));
      rows.push({model,open:weights.get(normalize(r[0].text)),score:num(r[8].text)!,metrics:{battles:num(r[2].text)!,naturalScience:num(r[3].text)!,healthcare:num(r[4].text)!,humanities:num(r[5].text)!,engineering:num(r[6].text)!,costPer100Calls:num(r[7].text)!}});
    }if(rows.length<38)throw new Error('SciArena expected 38 rows');return rows;
  },
};
export default board;
