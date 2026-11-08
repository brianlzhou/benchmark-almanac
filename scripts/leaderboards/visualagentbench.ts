// VisualAgentBench: AVG is the authors overall score across all five environments. Per-environment scores remain metrics.
// Fine-tuned systems retain their training label and parameter specification to avoid matching an untuned base model.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2408.06327";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "visualagentbench",
  url: "https://github.com/THUDM/VisualAgentBench",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED))[4];
    if (!t?.[0]?.some(c => c.text === 'AVG')) throw new Error('VAB table changed');
    const rows: LeaderboardRow[] = []; let tuned=false;
    for (let r of t.slice(2)) {
      if (r.length===9) {tuned=r[0].text.includes('Fine-tuning');r=r.slice(1);}
      if(r.length!==8 || num(r[2].text)===undefined) continue;
      const raw=r[0].text;
      rows.push({model:paperModel(raw)+(tuned?' (VAB fine-tuned, '+r[1].text.replace(/(\d+(?:[.]\d+)?) \1/g,'$1')+')':''),score:num(r[2].text)!, metrics:{omniGibson:num(r[3].text)!,minecraft:num(r[4].text)!,mobile:num(r[5].text)!,webArenaLite:num(r[6].text)!,css:num(r[7].text)!}});
    }
    if(rows.length!==17) throw new Error('VAB expected 17 models'); return rows;
  },
};
export default board;
