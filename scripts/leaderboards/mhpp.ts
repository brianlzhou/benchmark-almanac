// MHPP (Mostly Hard Python Problems). The makers' leaderboard at sparksofagi.github.io/MHPP (linked from the
// SparksofAGI/MHPP README) loads new_mhpp.csv and ranks models by "Greedy", pass@1 with greedy decoding over
// the 210 problems (0 to 100). Greedy is the score. Sampled pass@1 and pass@5 are other columns and are not
// kept. Names carry the snapshot date ("GPT-4o-2024-05-13"), which the resolver reads, or the size.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://sparksofagi.github.io/MHPP/new_mhpp.csv';

const board: Leaderboard = {
  benchmark: 'mhpp',
  url: 'https://sparksofagi.github.io/MHPP/',
  feed: `${FEED} (Greedy)`,
  terms: 'Static CSV on the MHPP GitHub Pages site, which states no license; scores are cited to the MHPP authors.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.Greedy);
      const model = r.Model?.trim();
      if (!model || !Number.isFinite(score)) continue;
      const stamp = model.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
      rows.push({ model, score, date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : undefined });
    }
    return rows;
  },
};
export default board;
