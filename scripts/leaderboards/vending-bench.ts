// Vending-Bench (the first version, deprecated by Andon Labs in November 2025 for Vending-Bench 2) on
// andonlabs.com. The eval page is server-rendered with one leaderboard table: Model | Net worth (mean) |
// Net worth (min) | units sold and days until sales stop. Mean net worth in US dollars is the score, the
// almanac's unit for this benchmark. A "New" badge after a name is dropped, and the human baseline row is
// skipped. The reader lives in visulogic.ts.
// The table's other columns go in `metrics`: "netWorthMin" (US dollars), "unitsSold" and "unitsSoldMin", and
// "daysToStall" (mean days until sales stop).
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://andonlabs.com/evals/vending-bench';

const board: Leaderboard = {
  benchmark: 'vending-bench',
  url: URL,
  feed: `${URL} (leaderboard table, Net worth (mean))`,
  terms: 'Server-rendered public page of andonlabs.com; the site publishes no terms of use or robots.txt, so the scores are cited to Andon Labs.',
  aliases: {
    'Gemini 2.5 Pro (preview-03-25)': 'gemini-2-5-pro-mar-2025',
    // the paper (arXiv 2502.15840, February 2025) ran the then-current claude-3-5-sonnet-20241022
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet-october-2024',
  },
  fetch: () =>
    tableRows(URL, {
      model: /^Model$/i,
      score: /^Net worth \(mean\)$/i,
      skip: /^(Human|Random)/i,
      metrics: {
        netWorthMin: /^Net worth \(min\)$/i,
        unitsSold: /^Units sold \(mean\)$/i,
        unitsSoldMin: /^Units sold \(min\)$/i,
        daysToStall: /^Days until sales stop \(mean\)$/i,
      },
      name: (c) => c.text.replace(/\s+New$/, ''),
    }),
};
export default board;
