// Quant Arena (Einsia AI). The leaderboard page at quant.lab.einsia.ai/arena/leaderboard reads its board
// from the site's public API: /v1/legacy-boards/<id> returns, per track, one entry per model (its best
// run) with a values object (total score, in-sample and out-of-sample scores and trading metrics). The
// record describes the Iterative research track ("vanilla": models revise strategies with bounded feedback,
// then commit one), whose Total score (70% sealed 2024 window, 30% research window) ranks the track and is
// the score. The site's terms (4.4) make leaderboard results public to view and cite with credit, and bar
// only high-frequency scraping; this reads one file a day.
// The in-sample and out-of-sample scores and the out-of-sample annual return, Sharpe ratio and maximum
// drawdown (percent) are kept as metrics: inSample, outOfSample, oosReturn, oosSharpe and oosDrawdown.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const BOARD = 'v1-daily-stock-selection-2022-2024';
const FEED = `https://quant.lab.einsia.ai/v1/legacy-boards/${BOARD}`;

interface Board {
  tracks: { key: string; entries: { name: string; values?: { total?: number } & Record<string, number | null | undefined> }[] }[];
}

// table columns kept as metrics: [metrics key, values key, scale]; returns and drawdown become percentages
const EXTRA: [string, string, number][] = [
  ['inSample', 'in_sample', 1],
  ['outOfSample', 'out_of_sample', 1],
  ['oosReturn', 'oos.arr', 100],
  ['oosSharpe', 'oos.sharpe', 1],
  ['oosDrawdown', 'oos.mdd', 100],
];

const board: Leaderboard = {
  benchmark: 'quant-arena',
  url: 'https://quant.lab.einsia.ai/arena/leaderboard',
  feed: `${FEED} (track "vanilla", values.total)`,
  terms: 'Public JSON API behind the leaderboard page; robots.txt sets no Disallow, and the terms (4.4) let anyone view and cite results with credit while barring high-frequency scraping.',
  async fetch() {
    const data = await fetchJson<Board>(FEED);
    const track = data.tracks.find((t) => t.key === 'vanilla');
    if (!track) throw new Error('no Iterative research track on the Quant Arena board');
    const rows: LeaderboardRow[] = [];
    for (const e of track.entries) {
      const total = e.values?.total;
      if (!e.name || typeof total !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [k, key, scale] of EXTRA) {
        const v = e.values?.[key];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v * scale;
      }
      rows.push({ model: e.name, score: Number(total.toFixed(2)), ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
