// Frontier3DBench (Einsia/Navers lab): 145 Blender and Unreal Engine creation tasks.
// Total is the published 0-to-100 headline score: 30% L1, 30% L2 and 40% L3. Read Total
// directly from the full results table; keep level scores as diagnostics and the named harness.
// The page's cost-quality chart is a raster image, with no numerical cost feed in the public repo.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const PAGE = 'https://lab.einsia.ai/frontier3dbench';
const board: Leaderboard = {
  benchmark: 'frontier3dbench',
  url: PAGE,
  feed: `${PAGE} (Full results table, Total)`,
  terms: 'Einsia publishes this static results table and Apache-2.0 benchmark code; task assets retain their own licenses and attribution.',
  async fetch(): Promise<LeaderboardRow[]> {
    const table = tables(await fetchText(PAGE)).find(t => t[0]?.some(c => /^Total/.test(c.text)) && t[0]?.some(c => c.text === 'Harness'));
    if (!table) throw new Error('Frontier3DBench full results table missing');
    const out = table.slice(1).map(r => {
      const values = [3,4,5,6].map(i => num(r[i]?.text));
      if (!r[1]?.text || values.some(v => v === undefined)) throw new Error('Frontier3DBench invalid row');
      return { model: r[1].text, setting: r[2].text, score: values[3]!, harness: r[7].text,
        metrics: { l1: values[0]!, l2: values[1]!, l3: values[2]! } };
    });
    if (!out.length) throw new Error('Frontier3DBench has no results');
    return out;
  },
};
export default board;
