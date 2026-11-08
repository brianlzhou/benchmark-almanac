// BIG-Bench Hard: Table 2 reports BBH all (23 tasks), in percent, for three models and two prompting modes.
//  These are the paper's static results and will not refresh with new model releases.
//  The main table gives PaLM CoT 65.2, while appendix Table 3 says 63.3. Keep the main headline table.
//  NLP and algorithmic scores are secondary metrics. Human and composite prior-best rows are not model runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2210.09261";

const board: Leaderboard = {
  benchmark: "big-bench-hard",
  url: "https://github.com/suzgunmirac/BIG-Bench-Hard",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text.includes('BBH all')));
    if (!t) throw new Error('BBH main results table missing');
    let model = '';
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const label = r[0]?.text ?? '';
      if (/^PaLM|^InstructGPT|^Codex/.test(label)) model = label;
      if (!model || !/^[-−] (Answer-only|CoT) prompting/.test(label)) continue;
      const score = num(r[1]?.text);
      if (score === undefined) throw new Error('BBH score missing');
      rows.push({model, score, setting: label.replace(/^[-−] /, ''), metrics: {nlp: num(r[2].text)!, algorithmic: num(r[3].text)!}});
    }
    if (rows.length !== 6) throw new Error(`BBH expected six paper rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
