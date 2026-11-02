// CodeEditorBench (M-A-P, 2024). codeeditorbench.github.io has the leaderboard as static HTML tables. The
// first table is CodeEditorBench_Plus, the tab the page opens on (the second is the Primary set). Rows sit
// under "Zero-shot" and "Three-shot" group rows, which become the setting. Columns: Model, Size, Debug,
// Translation, Switch, Polishment Score, Win Rate. The page ranks by Win Rate (0 to 1, the share of
// pairwise comparisons a model wins across the four tasks), so Win Rate × 100 is the score. The table dates
// from the paper (arXiv 2404.03543, 2024-04-04), so rows carry that date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://codeeditorbench.github.io/';
const PAPER_DATE = '2024-04-04';

const board: Leaderboard = {
  benchmark: 'codeeditorbench',
  url: PAGE,
  feed: `${PAGE} (static HTML table, CodeEditorBench_Plus, Win Rate)`,
  terms: 'Static GitHub Pages project page (no robots.txt, so nothing is disallowed); the CodeEditorBench repository is Apache-2.0.',
  aliases: {
    'gpt-3.5-turbo-1106': 'gpt-3-5-turbo-nov-2023',
    'gemini-ultra': 'gemini-1-0-ultra',
    'deepseek-coder-33B-instruct': 'deepseek-coder-33b',
    'CodeLlama-34B-Instruct-hf': 'codellama-34b-instruct',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => c.text === 'Win Rate'));
    if (!t) throw new Error('CodeEditorBench table not found');
    const head = t[0].map((c) => c.text);
    const iWin = head.indexOf('Win Rate');
    if (head[0] !== 'Model' || iWin < 0) throw new Error(`unexpected columns: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    let setting: string | undefined;
    for (const r of t.slice(1)) {
      if (r.length === 1) {
        setting = r[0].text.toLowerCase();
        continue;
      }
      const score = num(r[iWin]?.text);
      if (!r[0]?.text || score === undefined) continue;
      rows.push({ model: r[0].text, score: Math.round(score * 1000) / 10, setting, date: PAPER_DATE });
    }
    return rows;
  },
};
export default board;
