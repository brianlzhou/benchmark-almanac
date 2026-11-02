// KOR-Bench (knowledge-orthogonal reasoning) on kor-bench.github.io. The leaderboard table is filled from
// static/data/kor_leaderboard_data.json: per model the overall accuracy (0 to 100, a string), five
// category scores, the evaluation date and a type. The page opens on "chat model" rows, and base-model
// rows sit behind a toggle, so only chat models are read. A snapshot date in the name
// ("O1-Preview(2024-09-12)") becomes the row date so the resolver picks that snapshot.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://kor-bench.github.io/static/data/kor_leaderboard_data.json';

interface Entry {
  model?: string;
  date?: string;
  overall?: string | number;
  type?: string;
}

const board: Leaderboard = {
  benchmark: 'kor-bench',
  url: 'https://kor-bench.github.io/',
  feed: `${FEED} (type "chat model")`,
  terms: 'Static JSON on a GitHub Pages project site with no robots.txt and no terms; the KOR-Bench repository is public and the scores are cited to the authors.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const e of await fetchJson<Entry[]>(FEED)) {
      if ((e.type ?? 'chat model') !== 'chat model' || !e.model) continue;
      const score = Number(e.overall);
      if (!Number.isFinite(score)) continue;
      let model = e.model.trim();
      let date = e.date;
      const snap = model.match(/\s*\((\d{4}-\d\d-\d\d)\)$/);
      if (snap) {
        date = snap[1];
        model = model.slice(0, snap.index).trim();
      }
      rows.push({ model, score, date });
    }
    if (!rows.length) throw new Error('no chat-model rows in the KOR-Bench data');
    return rows;
  },
};
export default board;
