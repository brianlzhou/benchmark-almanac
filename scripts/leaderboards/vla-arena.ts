// VLA-Arena (robot vision-language-action policies). vla-arena.github.io builds its board from
// data/results/models.json and one data/results/<model>.json per policy, each listing 11 task suites with a
// success rate (sr) at difficulty levels L0, L1 and L2. The page's "Avg SR" column averages the chosen
// track's level values within each suite, then across suites; the page picks its starting track at random
// on each load, so no single default exists. The score here is the "Average (L0+L1+L2)" track, the only one
// covering every level, as a percent. "-FFT" entries are full-parameter fine-tunes of a policy the board
// also lists in its standard fine-tune, so they get the setting "full fine-tune". The board's other column,
// Avg CC (the cumulative safety cost of the suites that report one, averaged over the same levels, lower is
// better), is kept as metrics.cc.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const BASE = 'https://vla-arena.github.io/data/results';

interface Result {
  name: string;
  tasks: { hasCC?: boolean; data?: { sr?: (number | null)[]; cc?: (number | null)[] } }[];
}

const board: Leaderboard = {
  benchmark: 'vla-arena',
  url: 'https://vla-arena.github.io/#leaderboard',
  feed: `${BASE}/models.json and ${BASE}/<model>.json (sr, Average L0+L1+L2)`,
  terms: 'Static JSON on GitHub Pages; robots.txt allows every path and the VLA-Arena repository is Apache-2.0.',
  aliases: {
    'GR00T-N1.6': 'gr00t-n1-6',
    'GR00T-N1.7': 'gr00t-n1-7',
    MolmoAct2: 'molmoact-2',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const { models } = await fetchJson<{ models: string[] }>(`${BASE}/models.json`);
    const rows: LeaderboardRow[] = [];
    for (const id of models) {
      const r = await fetchJson<Result>(`${BASE}/${encodeURIComponent(id)}.json`);
      const perSuite = r.tasks
        .map((t) => t.data?.sr)
        .filter((sr): sr is number[] => Array.isArray(sr) && sr.length >= 3 && sr.slice(0, 3).every(Number.isFinite))
        .map((sr) => (sr[0] + sr[1] + sr[2]) / 3);
      if (!perSuite.length) continue;
      const score = (perSuite.reduce((a, b) => a + b, 0) / perSuite.length) * 100;
      const ccSuites = r.tasks
        .filter((t) => t.hasCC)
        .map((t) => t.data?.cc)
        .filter((cc): cc is number[] => Array.isArray(cc) && cc.length >= 3 && cc.slice(0, 3).every(Number.isFinite))
        .map((cc) => (cc[0] + cc[1] + cc[2]) / 3);
      const cc = ccSuites.length ? ccSuites.reduce((a, b) => a + b, 0) / ccSuites.length : undefined;
      // "π₀.₅-FFT" -> "pi0.5" with a setting (the shared name key drops the Greek letters entirely)
      const name = r.name.replace(/π₀\.₅/g, 'pi0.5').replace(/π₀/g, 'pi0');
      const fft = /-FFT$/.test(name);
      rows.push({ model: name.replace(/-FFT$/, ''), score, setting: fft ? 'full fine-tune' : undefined, metrics: cc === undefined ? undefined : { cc } });
    }
    return rows;
  },
};
export default board;
