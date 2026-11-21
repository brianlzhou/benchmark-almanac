// TextVBench evaluates text rendering and preservation in generated videos.
// The paper reports separate T2V and Ref2V tracks and no combined score, so the headline is T2V TextVScore.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://arxiv.org/html/2610.13412';
function rowsIn(source: string, start: number, end: number): LeaderboardRow[] {
  const names = ['Wan2.1 T2V-1.3B', 'Wan2.2 T2V-A14B', 'Wan2.2 TI2V-5B', 'MiniMax-H3', 'LongCat-Video', 'Cosmos3-Nano', 'HunyuanVideo-1.5', 'Kandinsky-5 Pro'];
  const rows: LeaderboardRow[] = [];
  for (const name of names) {
    const i = source.indexOf(name, start); if (i < 0 || i >= end) continue;
    const nums = [...source.slice(i, i + 2500).matchAll(/>(\d+\.\d+)</g)].slice(0, 4).map(x => Number(x[1]));
    if (nums.length < 4) continue;
    rows.push({ model: name, score: nums[2], metrics: { spatial: nums[0], temporal: nums[1], extra: nums[3] } });
  }
  return rows;
}
const board: Leaderboard = { benchmark: 'textvbench', static: 'paper', url: FEED, feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt. Results are attributed to the paper authors.',
  headline: 'The paper reports no combined score, so this is the T2V TextVScore track, which the paper presents first.',
  parts: { spatial: { name: 'Spatial', group: 'T2V' }, temporal: { name: 'Temporal', group: 'T2V' }, ref2v: { name: 'Ref2V TextVScore', group: 'Track' } },
  stats: { extra: { name: 'TextVScore', unit: 'score', better: 'higher' } },
  async fetch() {
    const source = await fetchText(FEED);
    const start = source.indexOf('T2V: prompt-specified text'); const end = source.indexOf('Ref2V: reference text preservation');
    if (start < 0 || end < 0) throw new Error('Missing TextVBench T2V table');
    const out = rowsIn(source, start, end);
    if (out.length < 2) throw new Error('TextVBench table yielded too few rows');
    return out;
  },
};
export default board;
