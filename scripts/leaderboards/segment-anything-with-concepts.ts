// Segment Anything with Concepts tests whether a model can segment every instance of a named concept.
// SOTA2 ranks image segmentation by Gold cgF1. Bio uses positive micro F1, so the scores use different measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/instance-segmentation-on-sa-co';
const board: Leaderboard = {
  benchmark: 'segment-anything-with-concepts', url: feed, feed, host: 'SOTA2',
  terms: 'SOTA2 attributes the evaluation results to their source papers at ' + feed + '.',
  headline: 'The headline is Gold cgF1 for image segmentation, the measure used to rank this leaderboard.',
  parts: {silver:'Silver cgF1', bronze:'Bronze cgF1', bio:'Bio pmF1'},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Method|Links|Gold cgF1|Silver cgF1|Bronze cgF1|Bio pmF1');
    if (!table) throw new Error('Missing SA-Co instance segmentation table');
    const rows: LeaderboardRow[] = [];
    for (const [method,,gold,...rest] of table.slice(1)) {
      const label = text(method.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? '');
      if (label === 'Human') continue;
      if (!label || rest.length !== 3) throw new Error('Invalid SA-Co row');
      const setting = text(method.html.match(/role="tooltip">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const metrics: Record<string, number> = {};
      ['silver','bronze','bio'].forEach((key, i) => {if (rest[i].text !== '—') metrics[key] = numberCell(rest[i].text);});
      rows.push({model: label.replace(/\*$/, ''), setting: setting || undefined, score: numberCell(gold.text), metrics});
    }
    return checked(rows, 8);
  },
};
export default board;
