// SquadStack scores the share of passing judgments across seven criteria and all judged turns.
// The public dataset card gives the headline, confidence interval and time to first token.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://huggingface.co/datasets/Squadstack/conversational-llm-benchmark#results";

const board: Leaderboard = {
  benchmark: "squadstack-conversational-llm-benchmark",
  url: "https://huggingface.co/datasets/Squadstack/conversational-llm-benchmark#results",
  feed,
  terms: "SquadStack encourages publication of results. Its dataset card assigns separate licenses to verdicts and metadata and prohibits redistribution of conversations. Review reuse of the public aggregate table before importing. robots.txt allows the feed path.",
  stats: { mandateMean: { name: 'Mean of four mandates', unit: '%', better: 'higher' }, ttftMedianMs: { name: 'Time to first token', unit: 'ms', better: 'lower' } },
  async fetch() {
    const header = ["#", "System", "Vendor", "Category", "Overall pass-rate", "95% CI", "Mean of 4 mandates", "Tied with #1", "Turns judged", "TTFT P50 (ms)"];
    const table = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text))).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 11) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const [, name, , category, score, range, mandates, , count, ttft] = cells;
      const ci = range.match(/^([\d.]+)[–-]([\d.]+)$/);
      if (!ci || !score || !Number.isFinite(Number(score))) throw new Error('Missing conversational benchmark score');
      return { model: name.replace(/\s*★$/, ''), score: Number(score), low: Number(ci[1]), high: Number(ci[2]),
        trials: Number(count.replaceAll(',', '')), open: category === 'Open weights' ? true : undefined,
        metrics: { mandateMean: Number(mandates), ttftMedianMs: Number(ttft.replaceAll(',', '')) } };
    });
  },
};
export default board;
