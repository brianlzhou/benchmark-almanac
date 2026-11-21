// TuRTLe reports exact-match percentages on RTL-Repo next-line predictions.
// Its simulation CSV has two header rows and uses minus one for missing results.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard/raw/main/src/data/results_icarus_november_2025.csv";
export async function turtleColumns(url: string, dataset: string, headline: string, minimum: number) {
  const [first, second, ...lines] = (await fetchText(url)).trim().split(/\r?\n/);
  const labels = first.split(','), sets = second.split(',');
  const columns = sets.flatMap((name, i) => name === dataset ? [{ key: labels[i], index: i }] : []);
  if (!columns.some(c => c.key === headline)) throw new Error('Missing TuRTLe columns for ' + dataset);
  const header = labels.map((_, i) => 'col' + i).join(',');
  const rows = parseCsv([header, ...lines].join('\n')).flatMap(r => {
    const metrics: Record<string, number> = {};
    for (const {key, index} of columns) {
      const value = r['col' + index];
      if (value === '' || value === '-1') continue;
      if (!Number.isFinite(Number(value))) throw new Error('Invalid TuRTLe value');
      metrics[key] = Number(value);
    }
    return metrics[headline] == null ? [] : [{ model: r.col0, score: metrics[headline], metrics }];
  });
  if (rows.length < minimum) throw new Error('Incomplete TuRTLe scores for ' + dataset);
  return rows;
}

const board: Leaderboard = {
  benchmark: "rtl-repo",
  url: "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard",
  feed,
  terms: "The leaderboard Space carries the Apache 2.0 license. robots.txt allows the feed path.",
  host: "TuRTLe",
  stats: { EM: { name: 'Exact match', unit: '%', better: 'higher' } },
  async fetch() {
    return turtleColumns(feed, 'RTL-Repo', 'EM', 25);
  },
};
export default board;
