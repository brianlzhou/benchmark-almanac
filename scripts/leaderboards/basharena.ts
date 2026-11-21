// BashArena measures undetected sabotage. Figure 4 names one aggregate attack success rate across all four side tasks.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const FEED = 'https://arxiv.org/html/2512.15688';

const board: Leaderboard = {
  benchmark: 'basharena', static: 'paper',
  url: 'https://arxiv.org/abs/2512.15688',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const html = await paperHtml(FEED);
    const caption = html.match(/<figure id="S4\.F4"[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const entry = caption?.match(/(Claude Sonnet 4\.5) is the most effective attacker, successfully completing an attack (\d+(?:\.\d+)?)% of the time on average over the four side tasks/);
    if (!entry) throw new Error('Missing cross-task sabotage result in Figure 4');
    return [{ model: entry[1], score: Number(entry[2]), setting: 'GPT-4.1 mini monitor, n=3, trajectory FPR 4%' }];
  },
};
export default board;
