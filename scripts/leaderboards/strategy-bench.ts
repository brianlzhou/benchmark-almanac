// Strategy Bench evaluates social deduction in games. The public leaderboard's first score is the Deception Index.
// Freysa defines it as the average win rate across five deception roles. The board also gives defense and role scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://strategy.freysa.ai/leaderboard';
const headers = ['Deception (%)', 'Detection (%)', 'SH Liberal (%)', 'SH Fascist (%)', 'AU Impostor (%)', 'AU Crewmate (%)',
  'Avalon Good (%)', 'Avalon Evil (%)', 'Spyfall Spy (%)', 'WW Villager (%)', 'WW Werewolf (%)', 'Sheriff Truth', 'Sheriff Accuracy'];
const parts = Object.fromEntries(headers.map(name => [name.replace(/ \(%\)$/, '').replaceAll(' ', ''), { name: name.replace(/ \(%\)$/, ''), unit: '%' as const }]));
const board: Leaderboard = {
  benchmark: 'strategy-bench', feed, url: feed, parts, terms: 'Public standings credited to Freysa, https://strategy.freysa.ai/leaderboard.',
  headline: 'The board publishes the Deception Index as a percentage. It ranks by normalized Elo but does not show the Elo values.',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === ['Model', ...headers].join('|'));
    if (!table) throw new Error('Missing cross-game statistics table');
    const keys = Object.keys(parts);
    return checked(table.slice(1).map(cells => {
      const values = cells.slice(1).map(c => /^\d+(?:\.\d+)?$/.test(c.text) ? Number(c.text) : NaN);
      if (values.length !== keys.length || !values.every(Number.isFinite)) throw new Error('Incomplete Strategy Bench row');
      return { model: cells[0].text, score: values[0], metrics: Object.fromEntries(keys.map((k, i) => [k, values[i]])) };
    }), 9);
  },
};
export default board;
