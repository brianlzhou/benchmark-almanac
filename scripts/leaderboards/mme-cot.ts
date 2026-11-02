// MME-CoT (chain-of-thought evaluation of multimodal models). mmecot.github.io has one static HTML
// leaderboard table with grouped headers: CoT Quality (F1 Score, Precision, Recall), CoT Robustness (Avg.
// Score, Stability, Efficacy) and CoT Efficiency (Avg. Score, Relevance Rate, Reflection Quality). The page
// ranks by CoT Quality F1, the number reports usually give, so F1 is the score. Medal emoji are stripped.
// The table dates from the paper (arXiv 2502.09621, 2025-02-13), so rows carry that date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://mmecot.github.io/';
const PAPER_DATE = '2025-02-13';

const board: Leaderboard = {
  benchmark: 'mme-cot',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (static HTML table, CoT Quality F1 Score)`,
  terms: 'Static GitHub Pages project page (no robots.txt, so nothing is disallowed); it publishes no terms.',
  aliases: {
    'QVQ-72B': 'qvq-72b-preview',
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
    'LLaVA-OV-72B': 'llava-onevision-72b',
    'LLaVA-OV-7B': 'llava-onevision-7b',
    // plain "gpt-4o" in the API pointed to the 2024-08-06 snapshot when the paper ran
    'GPT-4o': 'gpt-4o-aug-2024',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => /CoT Quality/.test(c.text)));
    if (!t) throw new Error('MME-CoT table not found');
    const sub = t[1]?.map((c) => c.text) ?? [];
    if (sub[0] !== 'F1 Score') throw new Error(`unexpected sub-header: ${sub.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const model = (r[1]?.text ?? '').replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
      const score = num(r[2]?.text);
      if (model && score !== undefined) rows.push({ model, score, date: PAPER_DATE });
    }
    return rows;
  },
};
export default board;
