// Command Code grades Flappy Bird implementations on six five-point criteria.
// Its pinned README scorecard reports the mean and cost per generation, including estimates.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/CommandCodeAI/slash-design-showcase/17291ee5e1d8f62ef2e26c851f61a35f4364e26b/flappy-bird/readme.md";
const criteria = ["Spec/cute", "Collision", "Architecture", "Resize robustness", "Polish", "Offline-safe"];

const board: Leaderboard = {
  benchmark: "flappy-bird-command-code",
  url: "https://github.com/CommandCodeAI/slash-design-showcase/blob/17291ee5e1d8f62ef2e26c851f61a35f4364e26b/flappy-bird/readme.md#scorecard",
  feed,
  terms: "The repository has no published score reuse license. The cost column includes estimates. The host has no robots.txt.",
  parts: Object.fromEntries(criteria.map(c => [c, c])),
  stats: {
    qualityPerDollar: { name: 'Quality per dollar', unit: 'score', better: 'higher', note: 'Mean quality score divided by generation cost in US dollars.' },
  },
  reference: ['Command Code'],
  aliases: { 'DeepSeek': 'deepseek-v4-pro', 'Opus 5': 'claude-opus-5', 'Fable 5': 'claude-fable-5' },
  async fetch() {
    const header = ["Model", "Spec/cute", "Collision", "Architecture", "Resize robustness", "Polish", "Offline-safe", "Mean", "Cost", "Quality/$"];
    const table = markdownTables(await fetchText(feed)).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 6) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const values = cells.slice(1).map(s => Number(s.replace(/[~$,]/g, '')));
      if (values.length !== 9 || !values.every(Number.isFinite)) throw new Error('Invalid Flappy Bird scorecard');
      const metrics = Object.fromEntries(criteria.map((c, i) => [c, values[i]]));
      metrics.qualityPerDollar = values[8];
      return { model: cells[0], harness: 'Command Code', score: values[6], cost: values[7], metrics };
    });
  },
};
export default board;
