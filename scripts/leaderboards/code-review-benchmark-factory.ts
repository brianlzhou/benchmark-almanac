// Factory ranks code review models by mean F1 over pull requests. Its rankings and cost tables report quality, variability and usage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://factory.com/news/code-review-benchmark";

const board: Leaderboard = {
  benchmark: "code-review-benchmark-factory",
  url: "https://factory.com/news/code-review-benchmark",
  feed,
  terms: "The publisher displays results at https://factory.com/news/code-review-benchmark. I could not verify reuse terms. Its robots.txt allows the article.",
  aliases: { 'Opus 4.6': 'claude-opus-4-6', 'Sonnet 4.6': 'claude-sonnet-4-6', 'Opus 4.7': 'claude-opus-4-7' },
  async fetch() {
    const all = tables(await fetchText(feed));
    const ranking = all.find(t => t[0]?.some(c => c.text.includes('Stdev')));
    const costs = all.find(t => t[0]?.some(c => c.text.includes('Tokens/PR')));
    if (!ranking || ranking.length < 14 || !costs || !ranking[0][4].text.includes('Precision') || !ranking[0][5].text.includes('Recall')) throw new Error('Missing Factory results');
    return ranking.slice(1).map(r => {
      const model = r[1].text;
      const c = costs.find(c => c[0].text === model);
      if (!c) throw new Error('Missing cost row for ' + model);
      const values = [...r.slice(2), ...c.slice(2)].map(c => num(c.text));
      if (values.some(x => x == null)) throw new Error('Invalid Factory result');
      const [score, stdev, precision, recall, cost, dollarsPerF1Point, tokenCount] = values as number[];
      return { model, score, cost, metrics: { std: stdev, precision, recall, dollarsPerF1Point,
        totalTokens: tokenCount * (/k$/i.test(c[4].text) ? 1000 : 1) } };
    });
  },
};

export default board;
