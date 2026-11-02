// AlpacaEval 2.0 (Stanford Tatsu Lab). tatsu-lab.github.io/alpaca_eval/ draws its board from a CSV in the
// alpaca_eval repository: name, length_controlled_winrate, win_rate, avg_length, link, samples and filter.
// The length-controlled win rate against GPT-4 Turbo (0 to 100) is the headline the page and model cards
// use, so it is the score. The page shows the "verified" view by default (rows whose filter is verified or
// minimal), and only those rows are kept, so community submissions such as adversarial null models stay out.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/tatsu-lab/alpaca_eval/main/docs/data_AlpacaEval_2/weighted_alpaca_eval_gpt4_turbo_leaderboard.csv';

const board: Leaderboard = {
  benchmark: 'alpacaeval-2-0',
  url: 'https://tatsu-lab.github.io/alpaca_eval/',
  feed: `${FEED} (length_controlled_winrate, verified view)`,
  terms: 'CSV in the tatsu-lab/alpaca_eval repository, which is Apache-2.0.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      if (r.filter !== 'verified' && r.filter !== 'minimal') continue;
      const score = Number(r.length_controlled_winrate);
      if (!r.name || !Number.isFinite(score)) continue;
      rows.push({ model: r.name.trim(), score });
    }
    if (!rows.length) throw new Error('no verified rows in the AlpacaEval 2.0 CSV');
    return rows;
  },
};
export default board;
