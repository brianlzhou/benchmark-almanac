// DaLAJ tests Swedish linguistic acceptability. The Scandinavian Embedding Benchmark chart publishes DaLAJ accuracy in its own column.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const FEED = "https://datawrapper.dwcdn.net/aL23t/12/dataset.csv";
const board: Leaderboard = {
  benchmark: "dalaj",
  url: "https://datawrapper.dwcdn.net/aL23t/12/",
  feed: FEED,
  terms: "The project repository uses the MIT license. The embedded Datawrapper table gives no separate license for scores. https://github.com/KennethEnevoldsen/scandinavian-embedding-benchmark/blob/main/LICENSE Datawrapper robots.txt permits this chart.",
  async fetch() {
    const records = parseCsv(await fetchText(FEED));
    if (records.length < 18 || !('DaLAJ' in records[0])) throw new Error('Missing DaLAJ ranking');
    return records.map(row => {
      const name = row.Model.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      if (!name || !row.DaLAJ.trim() || !Number.isFinite(Number(row.DaLAJ))) throw new Error('Invalid DaLAJ row');
      return { model: name[1], link: name[2], score: Number(row.DaLAJ) };
    });
  },
};
export default board;
