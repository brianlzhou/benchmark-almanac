// ARC paper test accuracy. Read the Challenge test count and the code link for solvers marked with a double dagger.
// The Challenge and Easy columns belong to separate catalog records. Random and dataset-definition baselines are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/1803.05457";
const board: Leaderboard = {
  benchmark: "arc-challenge", static: 'paper',
  url: "https://arxiv.org/html/1803.05457",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const source = tables(await fetchText(FEED));
      const t = source.find(t => t.some(r => r[0]?.text === 'Solver'));
      if (!t) throw new Error('ARC test table missing');
      const splitTable = source.find(table => table.some(row => row[0]?.text === 'Train') && table.some(row => row[0]?.text === 'Test'));
      const questions = num(splitTable?.find(row => row[0]?.text === 'Test')?.[1]?.text);
      return t.filter(r => r.length === 3 && num(r[1].text) !== undefined && !/dataset defn|random/i.test(r[0].text)).map(r => ({model:r[0].text.replace(/[‡†]/g,''),score:num(r[1].text)!, metrics: questions === undefined ? undefined : { questions },
        link: r[0].text.includes('‡') ? 'https://github.com/allenai/arc-solvers' : undefined}));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
