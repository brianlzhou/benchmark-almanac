// OmniDocBench v1.5 (OpenDataLab). The repository README holds the leaderboard as HTML tables. Since the
// v1.6 update (2026-04-10) the main branch shows v1.6 and later results, and the v1.5 board stays on the
// v1_5 branch, whose README is read here. The first table is end-to-end parsing: Model Type (a rowspan
// group), Methods, Size, Overall (higher is better: the mean of (1 - text edit distance) × 100, formula CDM
// and table TEDS), then the parts. Overall is the score. A method named without its size ("Qwen2.5-VL",
// Size 72B) gets the size appended so the resolver can place it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/opendatalab/OmniDocBench/v1_5/README.md';

const board: Leaderboard = {
  benchmark: 'omnidocbench-1-5',
  url: 'https://github.com/opendatalab/OmniDocBench/tree/v1_5#end-to-end-evaluation',
  feed: `${FEED} (end-to-end table, Overall)`,
  terms: 'README on the v1_5 branch of opendatalab/OmniDocBench, which is Apache-2.0.',
  aliases: {
    'Gemini-3 Pro': 'gemini-3-pro',
    'Gemini-3 Flash': 'gemini-3-flash',
    'Gemini-2.5 Pro': 'gemini-2-5-pro-jun-2025',
    GPT5: 'gpt-5',
    'GPT5.2': 'gpt-5-2',
  },
  async fetch() {
    const t = tables(await fetchText(FEED)).find((rows) => rows[0]?.some((c) => /^Overall/.test(c.text)) && rows[0]?.some((c) => c.text === 'Methods'));
    if (!t) throw new Error('end-to-end table not found');
    const head = t[0].map((c) => c.text);
    if (head[1] !== 'Methods' || head[2] !== 'Size' || !/^Overall/.test(head[3])) throw new Error(`unexpected columns: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      // the first row of each Model Type group carries the rowspan cell
      const cells = r.length === head.length ? r.slice(1) : r;
      let model = cells[0]?.text.trim();
      const size = cells[1]?.text.trim();
      const score = num(cells[2]?.text);
      if (!model || score === undefined) continue;
      if (size && /^\d+(\.\d+)?B$/.test(size) && !/\d+(\.\d+)?B\b/i.test(model)) model = `${model}-${size}`;
      rows.push({ model, score });
    }
    return rows;
  },
};
export default board;
