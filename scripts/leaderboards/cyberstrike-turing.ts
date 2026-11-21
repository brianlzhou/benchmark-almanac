// CyberStrike ranks six model configurations by mean task pass rate. Turing's chart data supplies each result and its standard error.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://labs.turing.com/assets/index-BZIruKnx.js";

const board: Leaderboard = {
 stats: { known: { name: 'Known findings', unit: 'count' }, maybe: { name: 'Maybe findings', unit: 'count' }, unknown: { name: 'Unknown findings', unit: 'count' }, refused: { name: 'Refused tasks', unit: 'count' } },
  benchmark: "cyberstrike-turing",
  url: "https://labs.turing.com/benchmarks/cyberstrike",
  feed,
  terms: "The publisher gives no reuse license on the benchmark page. https://labs.turing.com/benchmarks/cyberstrike The robots.txt URL serves site HTML.",
  reference: ['terminus-2'],
  async fetch() {
    const source = await fetchText(feed);
    const rows = [...source.matchAll(/\{model:"([^"]+)",provider:"[^"]+",logo:"[^"]+",color:"[^"]+",effort:"([^"]+)",acc:([\d.]+),se:([\d.]+),known:(\d+),maybe:(\d+),unknown:(\d+),refused:(\d+)\}/g)].map(
      ([, model, setting, acc, se, known, maybe, unknown, refused]) => ({
        model, setting, harness: 'terminus-2', trials: 3, score: Number(acc), low: Number(acc) - Number(se), high: Number(acc) + Number(se),
        metrics: { known: Number(known), maybe: Number(maybe), unknown: Number(unknown), refused: Number(refused) },
      }));
    if (rows.length < 6) throw new Error('Missing CyberStrike chart entries');
    return rows;
  },
};

export default board;
