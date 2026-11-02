// MultiLoKo (Meta). The makers keep the leaderboard as a markdown table in the facebookresearch/multiloko
// README: scores on the private test set, with "Average EM" (exact match averaged over 31 languages, 0 to 100,
// shown with a "± 2 standard errors" spread that is dropped) as the score. The board lists base and chat
// models of the same family ("Llama 3.1 405B" and "Llama 3.1 405B Chat"), while the registry keeps one record
// per family, so a base model's row carries the setting "base model". Rows are dated with the paper (arXiv
// 2504.10356, 2025-04-14) so the resolver picks the snapshots current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'facebookresearch/multiloko';
const FEED = ghRaw(REPO, 'README.md');

// the base models on the board (every other row is a chat or instruct model)
const BASE = new Set(['Llama 3.1 405B', 'Llama 3.1 70B', 'Mixtral 8x22B', 'Qwen2.5 72B']);

const board: Leaderboard = {
  benchmark: 'multiloko',
  url: `https://github.com/${REPO}#leaderboard`,
  feed: `${FEED} (Leaderboard table, Average EM)`,
  terms: 'README table in the facebookresearch/multiloko GitHub repository, which is MIT-licensed.',
  aliases: {
    'Llama 3.1 405B': 'llama-3-1-405b',
    'Llama 3.1 405B Chat': 'llama-3-1-405b',
    'Llama 3.1 70B': 'llama-3-1-70b',
    'Llama 3.1 70B Chat': 'llama-3-1-70b',
    'Mixtral 8x22B': 'mixtral-8x22b',
    'Mixtral 8x22B-it': 'mixtral-8x22b',
    'Qwen2.5 72B': 'qwen2-5-72b',
    'Qwen2.5 72B instruct': 'qwen2-5-72b',
  },
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => x.head.some((h) => /^Average EM/.test(h)));
    if (!t) throw new Error('MultiLoKo leaderboard table not found');
    const iModel = t.head.findIndex((h) => /^Model/.test(h));
    const iScore = t.head.findIndex((h) => /^Average EM/.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.rows) {
      const model = r[iModel];
      const score = parseFloat(r[iScore]);
      if (!model || !Number.isFinite(score)) continue;
      rows.push({ model, score, setting: BASE.has(model) ? 'base model' : undefined, date: '2025-04-14' });
    }
    return rows;
  },
};
export default board;
