// CountBench: the paper's main classification table reports overall zero-shot counting accuracy in percent.
//  These are the paper's static results and will not refresh with new model releases.
//  Each backbone has five trained variants. Mean deviation remains a metric, not a separate leaderboard row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2302.12066";

const board: Leaderboard = {
  benchmark: "countbench",
  url: "https://teaching-clip-to-count.github.io/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(FEED)).find(t => t.some(r => r[0]?.text.startsWith('Mean deviation')));
    if (!t) throw new Error('CountBench accuracy table missing');
    const acc = t.find(r => r[0]?.text.startsWith('Accuracy'))!;
    const dev = t.find(r => r[0]?.text.startsWith('Mean deviation'))!;
    const variants = ['official baseline', 'internal baseline', 'without counting loss', 'naive filtering', 'counting loss'];
    return Array.from({length: 10}, (_, i) => {
      const score = num(acc[i + 1]?.text);
      if (score === undefined) throw new Error('CountBench score missing');
      const variant = i === 5 ? 'public baseline' : variants[i % 5];
      return {model: `${i < 5 ? 'CLIP-B/32' : 'BASIC-S'} (${variant})`, score, metrics: {meanDeviation: num(dev[i + 1]?.text)!}};
    });
  },
};
export default board;
