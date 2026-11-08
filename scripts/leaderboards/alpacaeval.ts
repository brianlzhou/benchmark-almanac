// AlpacaEval 1.0 (GPT-4 judge against text-davinci-003). tatsu-lab.github.io/alpaca_eval loads its 1.0 board
// from the repository's docs/data_AlpacaEval/alpaca_eval_gpt4_leaderboard.csv: name, length-controlled win
// rate, win rate, average length, link, samples and a filter tag (minimal, verified, community). The win
// rate (0 to 100) is the 1.0 headline and the score. AlpacaEval 2.0 has its own record and file. Each row also
// carries the length-controlled win rate ("lcWinRate", %) and the average output length ("length", characters).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/tatsu-lab/alpaca_eval/main/docs/data_AlpacaEval/alpaca_eval_gpt4_leaderboard.csv';

// Undated API labels remain unlisted instead of resolving to an arbitrary snapshot.
const AMBIGUOUS = new Set(['GPT-4', 'GPT-3.5', 'Claude']);

const board: Leaderboard = {
  benchmark: 'alpacaeval',
  url: 'https://tatsu-lab.github.io/alpaca_eval/',
  feed: FEED,
  terms: 'CSV in the tatsu-lab/alpaca_eval GitHub repository, which is Apache-2.0.',
  aliases: {
    'GPT-4 Preview (11/06)': 'gpt-4-turbo-nov-2023',
    'GPT-4 (03/14)': 'gpt-4-mar-2023',
    'GPT-4 (06/13)': 'gpt-4-jun-2023',
    'GPT 3.5 Turbo (06/13)': 'gpt-3-5-turbo-jun-2023',
    'GPT 3.5 Turbo (03/01)': 'gpt-3-5-turbo-mar-2023',
    'GPT 3.5 Turbo (11/06)': 'gpt-3-5-turbo-nov-2023',
    'Yi 34B Chat': 'yi-34b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.win_rate);
      if (!r.name || !Number.isFinite(score)) continue;
      const lc = Number(r.length_controlled_winrate);
      const length = Number(r.avg_length);
      const metrics: Record<string, number> = {};
      if (r.length_controlled_winrate && Number.isFinite(lc)) metrics.lcWinRate = lc;
      if (length > 0) metrics.length = length;
      rows.push({ model: AMBIGUOUS.has(r.name.trim()) ? `${r.name.trim()} (snapshot unspecified)` : r.name.trim(), score, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    if (!rows.length) throw new Error('no rows in the AlpacaEval 1.0 CSV');
    return rows;
  },
};
export default board;
