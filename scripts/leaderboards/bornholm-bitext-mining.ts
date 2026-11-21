// The Scandinavian Embedding Benchmark tests sentence matching between Bornholmsk and Danish.
// The Danish board's Datawrapper CSV has a separate percentage column for Bornholm Parallel.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://datawrapper.dwcdn.net/us1YK/12/dataset.csv";
const board: Leaderboard = {
  benchmark: 'bornholm-bitext-mining',
  url: "https://datawrapper.dwcdn.net/us1YK/12/",
  feed,
  terms: "Datawrapper robots.txt allows this chart. The project repository uses the MIT license. The embedded Datawrapper table gives no separate license for scores. https://github.com/KennethEnevoldsen/scandinavian-embedding-benchmark/blob/main/LICENSE",
  async fetch() {
    const records = parseCsv(await fetchText(feed));
    if (records.length < 18) throw new Error('Expected at least 18 Bornholm Parallel results');
    return records.map(row => {
      const model = row.Model?.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)/);
      const value = row['Bornholm Parallel'];
      if (!model || !value?.trim() || !Number.isFinite(Number(value))) throw new Error('Incomplete Bornholm Parallel row');
      return { model: model[1], link: model[2], score: Number(value) };
    });
  },
};
export default board;
