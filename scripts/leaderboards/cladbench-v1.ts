// CladBench tests building regulation and retrofit decisions. The results tables give the mean score from two neutral judges,
// bootstrap intervals and scores by category, difficulty and policy status.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

function numeric(s: string | undefined) {
  if (!s || !Number.isFinite(Number(s))) throw new Error('Missing CladBench score');
  return Number(s);
}
function bounds(s: string) {
  const match = s?.match(/^\[([\d.]+), ([\d.]+)\]$/);
  if (!match) throw new Error('Missing CladBench interval');
  return [numeric(match[1]), numeric(match[2])];
}

const feed = "https://raw.githubusercontent.com/cladbrain/cladbench/main/docs/results_tables.md";
const board: Leaderboard = {
  benchmark: 'cladbench-v1',
  url: "https://github.com/cladbrain/cladbench#results",
  feed,
  terms: "The raw file host has no robots.txt. CladBrain licenses the code and dataset under Apache 2.0. https://github.com/cladbrain/cladbench#licence-and-source-material",
  parts: { settled: 'Settled', live: 'Live policy', foundation: 'Foundation', practitioner: 'Practitioner', expert: 'Expert' },
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    const overall = tables.find(t => t[0].join('|') === 'Rank|Model|Score|95% CI|Claude-marked|n');
    const policy = tables.find(t => t[0][2]?.startsWith('Settled (') && t[0][4]?.startsWith('Live policy ('));
    const difficulty = tables.find(t => ['foundation', 'practitioner', 'expert'].every((k,i) => t[0][i+1]?.startsWith(k + ' (')));
    const categories = tables.find(t => t[0][0] === 'Cat');
    if (!overall || overall.length < 8 || !policy || !difficulty || !categories || categories.length < 14)
      throw new Error('Incomplete CladBench tables');
    return overall.slice(1).map(([, model, score, ci, claude, n]) => {
      const p = policy.find(r => r[0] === model), d = difficulty.find(r => r[0] === model);
      const col = categories[0].indexOf(model);
      if (!p || !d || col < 1) throw new Error('Missing breakdown for ' + model);
      const [low, high] = bounds(ci), [settledLow, settledHigh] = bounds(p[3]);
      const metrics: Record<string, number> = { claudeMarked: numeric(claude), items: numeric(n), settledLow, settledHigh,
        settled: numeric(p[2]), live: numeric(p[4]), foundation: numeric(d[1]), practitioner: numeric(d[2]), expert: numeric(d[3]) };
      for (const [name, ...scores] of categories.slice(1)) {
        if (name === 'Overall') continue;
        const match = name.match(/^(\d+) (.+)$/);
        if (!match) throw new Error('Unexpected CladBench category');
        const key = 'category' + match[1];
        board.parts![key] = { name: match[2].replace('Prioritisation', 'Prioritization'), group: 'Category' };
        metrics[key] = numeric(scores[col-1]);
      }
      return { model, score: numeric(score), low, high, metrics };
    });
  },
};
export default board;
