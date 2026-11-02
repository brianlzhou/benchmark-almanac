// LongVideoBench. The longvideobench/LongVideoBench Space reads result.csv from its own repository and ranks
// by "Test Total", accuracy on the test split (0 to 100). Launch posts often quote the validation split ("Val
// Total", also in the file), so the test score here can differ from those claims. A "(0513)" style suffix is
// the snapshot's month and day in 2024 and becomes the row date, so the resolver picks that snapshot.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/longvideobench/LongVideoBench/resolve/main/result.csv';

const board: Leaderboard = {
  benchmark: 'longvideobench',
  url: 'https://huggingface.co/spaces/longvideobench/LongVideoBench',
  feed: `${FEED} (Test Total)`,
  terms: 'CSV in the longvideobench/LongVideoBench Hugging Face Space, licensed CC BY-NC-SA 4.0, cited to the LongVideoBench authors.',
  aliases: {
    'Phi-3-Vision-Instruct': 'phi-3-vision',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r['Test Total']);
      let model = r.Model?.trim();
      if (!model || !Number.isFinite(score)) continue;
      let date: string | undefined;
      const snap = model.match(/\s*\((\d\d)(\d\d)\)$/);
      if (snap) {
        date = `2024-${snap[1]}-${snap[2]}`;
        model = model.slice(0, snap.index);
      }
      rows.push({ model, score, date });
    }
    return rows;
  },
};
export default board;
