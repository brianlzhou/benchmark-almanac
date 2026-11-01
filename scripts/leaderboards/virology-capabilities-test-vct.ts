// Virology Capabilities Test (SecureBio). securebio.org/virologytest/ is a static page with the VCT results
// table: per model the accuracy on the 322 multiple-select questions (0 to 100) and the expert percentile.
// Accuracy is the score; the expert-virologist baseline row is skipped. The table dates from the April
// 2025 paper, so rows carry that date for snapshot matching. SecureBio's Biology Benchmark Dashboard shows
// newer runs, but only as Plotly charts rescaled from expert level to perfect, not as raw accuracy, so it is
// not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://securebio.org/virologytest/';
// the paper's release (arXiv 2504.16137)
const PAPER_DATE = '2025-04-21';

const board: Leaderboard = {
  benchmark: 'virology-capabilities-test-vct',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Accuracy)`,
  terms: 'Static page on securebio.org (robots.txt allows it; content signals: search yes, AI training no); SecureBio asks that reuse cite Goetting et al.',
  aliases: {
    'GPT-4.5 Preview': 'gpt-4-5',
  },
  async fetch() {
    const [t] = tables(await fetchText(PAGE));
    const head = t?.[0]?.map((c) => c.text);
    if (head?.[0] !== 'Model' || head?.[1] !== 'Accuracy') throw new Error(`unexpected VCT header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[0]?.text;
      const score = num(r[1]?.text);
      if (!model || score === undefined || /expert/i.test(model)) continue;
      rows.push({ model, score, date: PAPER_DATE });
    }
    return rows;
  },
};
export default board;
