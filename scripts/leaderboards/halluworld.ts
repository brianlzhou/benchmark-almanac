// HalluWorld's Combined leaderboard averages hallucination rates in Grid, Chess and Terminal.
// The page stores accuracy arrays. Its Chess column uses the incorrect-FEN condition.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://halluworld.ai/';
const tracks = {
  GRID: ['Grid', 'Grid P', 'Grid M', 'Grid C', 'Grid U', 'Grid X'],
  CHESS: ['Chess (No FEN)', ...['P','C','M','X'].map(p => 'Chess (No FEN) '+p), 'Chess', ...['P','C','M','X'].map(p => 'Chess (Incorrect FEN) '+p)],
  TERM: ['Terminal', 'Terminal C', 'Terminal X', 'Terminal M', 'Terminal P', 'Terminal U'],
};
const board: Leaderboard = {
  benchmark: 'halluworld', url: feed + '#leaderboard', feed,
  terms: 'Public results published by the HalluWorld authors on their project page.',
  parts: Object.fromEntries(Object.values(tracks).flat().map(k => [k,k])),
  async fetch() {
    const page = await fetchText(feed);
    const names = new Map([...((page.match(/const MODEL_NAMES = \{([\s\S]*?)\};/)?.[1] ?? '').matchAll(/'([^']+)'\s*:\s*'([^']+)'/g))].map(m => [m[1],m[2]]));
    const models = new Map<string, Record<string, number>>();
    for (const [track, cols] of Object.entries(tracks)) {
      const body = page.match(new RegExp(`const ${track} = \\{([\\s\\S]*?)\\n\\};`))?.[1] ?? '';
      for (const m of body.matchAll(/^\s*\['([^']+)',\s*([\d.,\s]+)\],?/gm)) {
        const model = names.get(m[1]) ?? m[1];
        const acc = m[2].split(',').map(Number);
        if (acc.length !== cols.length || !acc.every(v => v >= 0 && v <= 1)) throw new Error('HalluWorld columns changed');
        const metrics = models.get(model) ?? {};
        cols.forEach((col, i) => { metrics[col] = 100 * (1 - acc[i]); });
        models.set(model, metrics);
      }
    }
    const rows = [...models].filter(([,m]) => ['Grid','Chess','Terminal'].every(k => k in m))
      .map(([model, metrics]) => ({ model, score: (metrics.Grid + metrics.Chess + metrics.Terminal) / 3, metrics }));
    if (rows.length < 12) throw new Error('Incomplete HalluWorld combined ranking');
    return rows;
  },
};
export default board;
