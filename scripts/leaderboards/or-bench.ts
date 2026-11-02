// OR-Bench (over-refusal). The OR-Bench README links its leaderboard Space, bench-llms/or-bench-leaderboard,
// a static page whose index.html loads data/or-bench.html: one table with over refusal (%) on
// OR-Bench-Hard-1K, toxic acceptance (%) on OR-Bench-Toxic, and their average. The record tracks the
// over-refusal rate (lower is better), the number lab reports cite as the OR-Bench false refusal rate, so
// that column is the score. The runs date from mid-2024 (Space updated 2024-07-04); "-latest" API names get
// the snapshot that was current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const SPACE = 'https://huggingface.co/spaces/bench-llms/or-bench-leaderboard';
const FEED = `${SPACE}/raw/main/data/or-bench.html`;

const board: Leaderboard = {
  benchmark: 'or-bench',
  url: SPACE,
  feed: `${FEED} (over refusal %)`,
  terms: 'Public Hugging Face Space, Apache-2.0 (README front matter and LICENSE); huggingface.co robots.txt allows Space files.',
  aliases: {
    'GPT-4o': 'gpt-4o-may-2024',
    'GPT-4-0125-preview': 'gpt-4-turbo-jan-2024',
    'Gemini-1.5-pro-latest': 'gemini-1-5-pro-may-2024',
    'Gemini-1.5-flash-latest': 'gemini-1-5-flash-may-2024',
    'Claude-3.5-sonnet': 'claude-3-5-sonnet',
    'GPT-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023',
    'GPT-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024',
    'Mistral-small-latest': 'mistral-small-2402',
  },
  async fetch() {
    const t = tables(await fetchText(FEED))[0];
    const head = t?.[0]?.map((c) => c.text.toLowerCase()) ?? [];
    const iModel = head.indexOf('model');
    const iOver = head.findIndex((h) => h.startsWith('over refusal'));
    if (iModel < 0 || iOver < 0) throw new Error(`unexpected OR-Bench header: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[iModel]?.text;
      const score = num(r[iOver]?.text);
      if (model && score !== undefined) rows.push({ model, score });
    }
    return rows;
  },
};
export default board;
