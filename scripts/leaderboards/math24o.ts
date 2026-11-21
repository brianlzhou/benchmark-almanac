// Math24o measures single-attempt accuracy on Chinese Olympiad problems. The project README gives the total score, access method and publication date.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/CLUEbenchmark/Math24o/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "math24o",
  url: "https://github.com/CLUEbenchmark/Math24o",
  feed: FEED,
  terms: "The repository publishes comparison results. The README does not specify separate reuse terms for these scores. https://github.com/CLUEbenchmark/Math24o",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0].join('|') === '排名|模型|机构|总分|使用方式|发布日期');
    if (!table || table.length < 8) throw new Error('Incomplete Math24o results');
    return table.slice(1).map(([, model, , score, harness, published]) => {
      if (!model || !score || !Number.isFinite(Number(score)) || !/^\d{4}\.\d{2}\.\d{2}$/.test(published))
        throw new Error('Invalid Math24o row');
      return { model, score: Number(score), setting: model.match(/\((high)\)$/)?.[1], harness,
        date: published.replaceAll('.', '-'), trials: 1 };
    });
  },
};
export default board;
