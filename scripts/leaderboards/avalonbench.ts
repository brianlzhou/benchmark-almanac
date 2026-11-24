// AvalonBench tests how well a language model plays Resistance Avalon against rule-based bots.
// The project site reports Player 0's win rate across 20 assigned games using the v0.2 environment.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://avalonbench.github.io/';
const board: Leaderboard = {
  benchmark: 'avalonbench', url: feed, feed,
  terms: 'The AvalonBench authors publish these results on GitHub Pages. https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  stats: {
    deductionAccuracy: { name: 'Average deduction accuracy', unit: 'score', better: 'higher', note: 'Player 0 average deduction accuracy, from 0 to 1.' },
    validGames: { name: 'Valid games', unit: 'count', better: 'higher' },
    secondsPerGame: { name: 'Average time per game', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const section = (await fetchText(feed)).split('Initial Results with New Codebase')[1]?.split('</section>')[0];
    if (!section) throw new Error('Missing v0.2 results');
    const blocks = section.matchAll(/<pre>\s*<code>([\s\S]*?)<\/code>\s*<\/pre>\s*<h5[^>]*>\s*Results of <span>([^<]+)<\/span>/g);
    const rows = Array.from(blocks, ([, raw, model]) => {
      const { total, custom } = JSON.parse(raw.replace(/,\s*}/g, '}'));
      const score = custom['Win rate of Player 0'];
      const deduction = custom['Avg deduction acc of Player 0'];
      const validGames = custom['Valid number of games'];
      const time = /^(\d+):(\d{2})$/.exec(custom['Average time cost']);
      if (![total, score, deduction, validGames].every(Number.isFinite) || !time) throw new Error('Incomplete Player 0 statistics');
      return { model, score, trials: total, setting: 'v0.2 against rule-based bots',
        metrics: { deductionAccuracy: deduction, validGames, secondsPerGame: Number(time[1]) * 60 + Number(time[2]) } };
    });
    return checked(rows, 2);
  },
};
export default board;
