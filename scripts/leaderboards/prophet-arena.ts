// Prophet Arena (forecasting on Kalshi events) on prophetarena.co. The forecast leaderboard is
// server-rendered with one table: Rank | Org | Model | Type | Arena score | Avg Return | ECE | Events. Arena
// score (a difficulty-adjusted accuracy score, the board's unit, shown "85.97 ± 0.68") is the score and Type
// (OpenCode Harness or Fixed Context) the harness. Model names end in the date the board was refreshed
// ("Claude Opus 5.5 — Nov 2") and sometimes a "New" badge, both dropped. The prediction-market baseline
// row ("Market") is skipped. The reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://www.prophetarena.co/leaderboard/forecast';

const board: Leaderboard = {
  benchmark: 'prophet-arena',
  url: URL,
  feed: `${URL} (leaderboard table, Arena score)`,
  terms: 'Server-rendered public page; robots.txt allows all paths for generic agents with a search=yes, ai-train=no content signal, and the site publishes no terms.',
  aliases: {},
  fetch: () =>
    tableRows(URL, {
      model: /^Model$/i,
      score: /^Arena score/i,
      harness: /^Type$/i,
      skip: /^Market$/i,
      name: (c) => c.text.replace(/\s+—\s+\w{3} \d{1,2}$/, '').replace(/\s+New$/, ''),
    }),
};
export default board;
