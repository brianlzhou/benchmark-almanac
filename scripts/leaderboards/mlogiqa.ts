// MLogiQA: the P-MMEval main table publishes accuracy averaged across its ten languages.
//  The MLogiQA column alone is the score. Other suite benchmarks are excluded.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num } from '../lib/html.ts';
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const FEED = "https://arxiv.org/html/2411.09116";
const board: Leaderboard = {
  benchmark: "mlogiqa", static: 'paper',
  url: "https://huggingface.co/datasets/Qwen/P-MMEval",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const ts = await paperTables(FEED);
    const t = ts[2];
    if (!t || !t.slice(0, 12).some(r => r.some(c => c.text.includes('MLogiQA')))) throw new Error('paper table changed: MLogiQA');
    const rows: LeaderboardRow[] = [];
    let open: boolean | undefined;
    for (const r of t) {
      if (r.length < 11) {
        const line = r.map(c => c.text).join(' ');
        if (/open-source models/i.test(line)) open = true;
        else if (/closed-source models/i.test(line)) open = false;
        continue;
      }
      const raw = r[0]?.text ?? '';
      const score = num(r[5]?.text);
      if (!raw || score === undefined || /^(Human|Random|Average|Model|Method|Dataset|Overall|Total)\b/i.test(raw) || /^Avg[.]$/.test(raw)) continue;
      const pMatch = raw.match(/(?:^|[- ])(\d+(?:\.\d+)?)B\b/i);
      const params = pMatch ? Number(pMatch[1]) : undefined;
      rows.push({ model: paperModel(raw), score, ...(open !== undefined ? { open } : {}), ...(params !== undefined ? { params } : {}) });
    }
    if (rows.length < 20) throw new Error(`paper returned only ${rows.length} rows, expected at least 20`);
    return rows;
  },
};
export default board;
