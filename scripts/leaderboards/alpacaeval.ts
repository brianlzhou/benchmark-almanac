// AlpacaEval 1.0 (GPT-4 judge against text-davinci-003). tatsu-lab.github.io/alpaca_eval loads its 1.0 board
// from the repository's docs/data_AlpacaEval/alpaca_eval_gpt4_leaderboard.csv: name, length-controlled win
// rate, win rate, average length, link, samples and a filter tag (minimal, verified, community). The win
// rate (0 to 100) is the 1.0 headline and the score. AlpacaEval 2.0 has its own record and file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/tatsu-lab/alpaca_eval/main/docs/data_AlpacaEval/alpaca_eval_gpt4_leaderboard.csv';

const board: Leaderboard = {
  benchmark: 'alpacaeval',
  url: 'https://tatsu-lab.github.io/alpaca_eval/',
  feed: FEED,
  terms: 'CSV in the tatsu-lab/alpaca_eval GitHub repository, which is Apache-2.0.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.win_rate);
      if (!r.name || !Number.isFinite(score)) continue;
      rows.push({ model: r.name.trim(), score });
    }
    if (!rows.length) throw new Error('no rows in the AlpacaEval 1.0 CSV');
    return rows;
  },
};
export default board;
