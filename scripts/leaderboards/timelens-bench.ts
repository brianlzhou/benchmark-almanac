// TimeLens-Bench ranks temporal grounding models by the average of twelve metrics.
// The leaderboard script supplies all values and rounds their mean to one decimal place.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://timelens-arc-lab.github.io/';
const FEED = URL + 'static/js/index.js';
const parts: Record<string, string> = {};
for (const [prefix, dataset] of Object.entries({ c: 'Charades-TimeLens', a: 'ActivityNet-TimeLens', q: 'QVHighlights-TimeLens' })) {
  for (const [key, name] of Object.entries({ r1_03: 'R1@0.3', r1_05: 'R1@0.5', r1_07: 'R1@0.7', miou: 'mIoU' })) {
    parts[prefix + '_' + key] = dataset + ' ' + name;
  }
}
const board: Leaderboard = {
  benchmark: 'timelens-bench', url: URL, feed: FEED, parts,
  aliases: { 'Qwen3-VL-8B': 'qwen3-vl-8b-instruct' },
  terms: 'Public project leaderboard. robots.txt returns 404 and the page lists no separate data terms.',
  async fetch() {
    const js = await fetchText(FEED);
    const data = js.match(/const leaderboardData\s*=\s*\{([\s\S]*?)\n\};/)?.[1];
    if (!data || !js.includes('(sum / metrics.length).toFixed(1)')) throw new Error('TimeLens data or scoring changed');
    const rows: LeaderboardRow[] = [];
    for (const section of data.matchAll(/(proprietary|opensource):\s*\[([\s\S]*?)\]/g)) {
      for (const entry of section[2].matchAll(/\{([^{}]*)\}/g)) {
        const model = entry[1].match(/\bmodel:\s*"([^"]+)"/)?.[1];
        const link = entry[1].match(/\burl:\s*"([^"]+)"/)?.[1];
        const metrics = Object.fromEntries([...entry[1].matchAll(/\b([acq]_(?:r1_0[357]|miou)):\s*(\d+(?:\.\d+)?)/g)].map(m => [m[1], Number(m[2])]));
        if (!model || Object.keys(parts).some(key => metrics[key] === undefined)) throw new Error('Incomplete TimeLens entry');
        const sum = Object.keys(parts).reduce((total, k) => total + metrics[k], 0);
        rows.push({ model, link, open: section[1] === 'opensource', score: Number((sum / 12).toFixed(1)), metrics });
      }
    }
    if (rows.length < 24 || rows.length !== (data.match(/\bmodel:/g) ?? []).length) throw new Error('Incomplete TimeLens leaderboard');
    return rows;
  },
};
export default board;
