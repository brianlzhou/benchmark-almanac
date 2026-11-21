// VerticalRTK tests real-time search and answer APIs on 131 dated research questions from the July 2026 run.
// The headline score is answer accuracy, shown as a percentage in Tako's results table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://tako.com/benchmarks/verticalrtk/';
const PROVIDERS = ['Tako Answer', 'Exa', 'Parallel', 'Nimble', 'Tavily (advanced)', 'Brave Search', 'Ceramic'];

const board: Leaderboard = {
  benchmark: 'verticalrtk',
  url: PAGE,
  feed: PAGE,
  static: 'paper',
  terms: 'VerticalRTK is licensed under CC BY 4.0. Tako publishes the dated results table on its benchmark page. https://github.com/TakoData/VerticalRTK/blob/main/LICENSE',
  async fetch() {
    const html = await fetchText(PAGE);
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const start = text.indexOf('Provider Accuracy');
    const end = text.indexOf('131-question set', start);
    if (start < 0 || end < 0) throw new Error('VerticalRTK: results table missing');
    const section = text.slice(start, end);
    const rows: LeaderboardRow[] = [];
    for (const provider of PROVIDERS) {
      const m = section.match(new RegExp(`${provider.replace(/[()]/g, '\\$&')}\\s+(\\d+(?:\\.\\d+)?)%`));
      if (!m) throw new Error(`VerticalRTK: missing ${provider}`);
      const [model, setting] = provider === 'Tavily (advanced)' ? ['Tavily', 'advanced'] : [provider, undefined];
      rows.push({ model, setting, score: Number(m[1]) });
    }
    return rows;
  },
};
export default board;
