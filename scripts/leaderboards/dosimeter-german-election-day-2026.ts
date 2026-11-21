// Dosimeter counts German election-day answers citing Russian state media or the Pravda network.
// Read the report's platform comparison, including the separately sampled Meta AI results.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://dosimeteraudit.org/research/election-day-ai-poisoning-germany";
const board: Leaderboard = {
  benchmark: "dosimeter-german-election-day-2026",
  url: "https://dosimeteraudit.org/research/election-day-ai-poisoning-germany",
  feed: FEED,
  terms: "Dosimeter licenses its data, lists, report, and documentation under CC BY 4.0. https://github.com/gurovdigital/election-day-ai-poisoning-germany-2026#licence The aggregate counts appear in the public report.",
  async fetch() {
    const table = tables(await fetchText(FEED)).map(t => t.map(row => row.map(c => c.text))).find(t => t[0]?.includes('Five platforms'));
    if (!table || table[0].length < 8) throw new Error('Missing Dosimeter platform comparison');
    const find = (label: string) => {
      const row = table.find(r => r[0] === label);
      if (!row) throw new Error('Missing Dosimeter measure: ' + label);
      return row;
    };
    const headline = find('Responses citing Russian state media or the Pravda network');
    const metricsByLabel = {
      linked: 'Responses citing blogs or sites linked to Russia Today', official: 'Responses citing an official or public-service source',
      withoutCitations: 'Responses without citations', combined: 'Responses citing Russia Today or blogs or sites linked to it',
    };
    return table[0].slice(2).map((model, index) => {
      const ratio = (cell: string) => {
        const pair = cell.match(/^(\d+) \/ (\d+)$/);
        if (!pair || !Number(pair[2])) throw new Error('Invalid Dosimeter count ' + cell);
        return { count: Number(pair[1]), n: Number(pair[2]) };
      };
      const {count, n} = ratio(headline[index + 2]);
      const metrics: Record<string, number> = { stateOrPravdaCount: count };
      for (const [key, label] of Object.entries(metricsByLabel)) {
        const v = ratio(find(label)[index + 2]);
        metrics[key] = 100 * v.count / v.n;
      }
      metrics.meanCitations = Number(find('Mean citations per response')[index + 2]);
      metrics.distinctDomains = Number(find('Distinct domains')[index + 2]);
      return { model, score: 100 * count / n, trials: n, setting: model === 'Meta AI' ? 'Separate Meta AI sample' : undefined, metrics };
    });
  },
};
export default board;
