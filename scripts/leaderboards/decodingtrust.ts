// DecodingTrust. decodingtrust.github.io/leaderboard loads static/csv/leaderboard.csv: per model the score on
// each of the eight trustworthiness perspectives (0 to 100) and their Average, the board's summary column,
// which is the score. Most rows are compressed Llama 2 and Vicuna variants (AWQ, GPTQ, pruning) from the
// compression study, which stay unmatched. The aliases follow the paper's checkpoints (gpt-3.5-turbo-0301,
// gpt-4-0314); the 7B chat models the paper ran (MPT, Vicuna, Falcon, RedPajama, Alpaca, all listed by family
// name only) and the undated "Claude" row are left unmatched rather than guessed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = 'https://decodingtrust.github.io/leaderboard/static/csv/leaderboard.csv';

const board: Leaderboard = {
  benchmark: 'decodingtrust',
  url: 'https://decodingtrust.github.io/leaderboard/',
  feed: `${FEED} (Average)`,
  terms: 'Static CSV on the DecodingTrust GitHub Pages site; the DecodingTrust repository is CC BY-SA 4.0.',
  aliases: {
    'GPT-3.5': 'gpt-3-5-turbo-mar-2023',
    'GPT-4': 'gpt-4-mar-2023',
    'Gemini-Pro-1.0': 'gemini-1-0-pro',
    'Llama2-7b-chat': 'llama-2-7b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = num(r.Average);
      if (!r.Model || score === undefined || /^(Claude|MPT|Vicuna|Falcon|RedPajama|Alpaca)$/.test(r.Model)) continue;
      rows.push({ model: r.Model, score });
    }
    return rows;
  },
};
export default board;
