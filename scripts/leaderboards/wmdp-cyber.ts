// WMDP Cyber: the paper's unlearning comparison gives Cyber accuracy on the full cyber split, in percent.
//  The Base and unlearning methods represent different trained systems. They remain separate model names.
//  These are the paper's static results and will not refresh with new model releases.
//  The parent WMDP record combines three domains and has no published overall in this table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2403.03218";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "wmdp-cyber",
  url: "https://www.wmdp.ai",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED)).find(t => t[0]?.some(c => c.text === 'Method') && t.some(r => r.some(c => c.text === 'zephyr-7b')));
    if (!t) throw new Error('WMDP unlearning table missing');
    let base = '';
    const out: LeaderboardRow[] = [];
    for (const row of t) {
      let r = row;
      if (r.length === 11 && /^(zephyr|Yi-|Mixtral|GPT-4)/.test(r[0].text)) {base = r[0].text; r = r.slice(1);}
      if (!base || r.length !== 10 || num(r[2]?.text) === undefined) continue;
      const method = r[0].text.replace(' (ours)', '');
      const model = method === 'Base' ? paperModel(base) : `${base} (${method})`;
      out.push({model, score: num(r[2].text)!, metrics: {mmlu: num(r[8].text)!, mtBench: num(r[9].text)!}});
    }
    if (out.length !== 10) throw new Error(`WMDP Cyber expected ten rows, found ${out.length}`);
    return out;
  },
};
export default board;
