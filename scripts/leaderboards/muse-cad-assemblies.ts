// MUSE tests CAD assemblies generated from design specifications. The page sorts its JSON rows by Final,
// a design-intent score over all cases with failures counted as zero.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://dong7313.github.io/muse-benchmark/leaderboard.json";
type Entry = { model: string; family: string; final: number } & Record<'judged' | 'cases' | 'sandbox' | 'geom_valid' | 'functionality' | 'manufacturability' | 'assemblability', number>;

const board: Leaderboard = {
  benchmark: "muse-cad-assemblies",
  url: "https://dong7313.github.io/muse-benchmark/leaderboard.html",
  feed,
  terms: "The makers license the website and the dataset under CC BY 4.0. The host has no robots.txt.",
  parts: { functionality: 'Functionality', manufacturability: 'Manufacturability', assemblability: 'Assemblability' },
  async fetch() {
    const { rows } = await fetchJson<{ rows: Entry[] }>(feed);
    if (rows.length < 15) throw new Error('Missing MUSE configurations');
    return rows.map(({ model, family, final, ...metrics }) => {
      if (!model || ![final, metrics.sandbox, metrics.geom_valid, metrics.functionality, metrics.manufacturability, metrics.assemblability].every(Number.isFinite))
        throw new Error('Incomplete MUSE row');
      return { model, score: final, open: family === 'open', metrics };
    });
  },
};
export default board;
