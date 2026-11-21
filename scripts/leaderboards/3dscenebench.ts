// Full 49-scene L0 evaluation. The ten/eleven-scene L1 ablation is not a leaderboard row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
const url = 'https://pranalabs.github.io/3DSceneBench/';
const feed = `${url}data/results.js`;
export default {
  benchmark: '3dscenebench', url, feed,
  parts: {
    A: { name: 'Appearance', group: 'Dimension' },
    G: { name: 'Geometry', group: 'Dimension' },
    F: { name: 'Functionality', group: 'Dimension' },
    inventory: { name: 'Inventory', group: 'Dimension' },
    shape: { name: 'Shape', group: 'Dimension' },
    pose_size: { name: 'Pose and size', group: 'Dimension' },
    relations: { name: 'Relations', group: 'Dimension' },
    placement: { name: 'Placement', group: 'Dimension' },
    balance: { name: 'Balance', group: 'Dimension' },
    response: { name: 'Response', group: 'Dimension' },
    affordance: { name: 'Affordance', group: 'Dimension' },
    interaction: { name: 'Interaction', group: 'Dimension' },
  },
  terms: 'Prana Labs publishes this results file on its project site; robots.txt has no restrictions and no separate extraction terms are stated.',
  stats: { siglip: { name: 'SigLIP similarity', unit: 'score', better: 'higher' }, dino: { name: 'DINO similarity', unit: 'score', better: 'higher' }, pose_cm: { name: 'Pose error', unit: 'score', better: 'lower', note: 'Mean pose error in centimeters.' }, size_ratio: { name: 'Size ratio', unit: 'score', note: 'Generated-to-reference size ratio.' }, tasks_full_pct: { name: 'Tasks fully completed', unit: '%', better: 'higher' }, valid_pct: { name: 'Valid object percentage', unit: '%', better: 'higher' }, minutes: { name: 'Time', unit: 'minutes', better: 'lower' }, usd_list: { name: 'List price', unit: 'usd', better: 'lower' }, publishedSceneRank: { name: 'Published scene rank', unit: 'count', better: 'lower' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const d = jsonAfter<{table: ({agent: string; effort: string; A: number; G: number; F: number} & Record<string, unknown>)[]}>(await fetchText(feed), 'window.SB_RESULTS=');
    const rows = d.table.map(r => ({
      model: r.agent, setting: `L0; ${r.effort} effort`, score: (r.A + r.G + r.F) / 3,
      metrics: Object.fromEntries(Object.entries(r).filter((x): x is [string, number] => typeof x[1] === 'number').map(([key, value]) => [key === 'rank' ? 'publishedSceneRank' : key, value])),
    }));
    if (rows.length < 3 || rows.some(r => !Number.isFinite(r.score))) throw new Error('3DSceneBench full-suite rows missing');
    return rows;
  },
} satisfies Leaderboard;
