// MME-CC: the maker's Overall percentage, with spatial, geometric and visual-knowledge accuracy as metrics.
// Exclude the human reference. Undated Gemini API labels do not identify an exact snapshot.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const PAGE = 'https://randomtutu.github.io/MME-CC/';
const board: Leaderboard = {
  benchmark: 'mme-cc', url: PAGE, feed: `${PAGE} (Overall leaderboard table)`,
  terms: 'The public MME-CC project page publishes these results; the Almanac credits and links the source.',
  async fetch(): Promise<LeaderboardRow[]> {
    const table = tables(await fetchText(PAGE)).map(t => t.map(r => r.map(c => c.text))).find(t => t[0]?.join('|') === 'Rank|Models|Reasoning|Overall|SR|GR|VKR');
    if (!table) throw new Error('MME-CC leaderboard missing');
    const rows = table.slice(1).filter(r => r[1] !== 'Human' && num(r[3]) !== undefined).map(r => {
      const effort = r[1].match(/\s*\((high|low|Think|Nonthink)\)$/i);
      let model = effort ? r[1].slice(0,effort.index).trim() : r[1];
      if (/^Gemini-2\.5-/.test(model)) model += ' [snapshot unspecified]';
      if (model === 'GPT-4o-1120') model = 'gpt-4o-2024-11-20';
      return { model, score: num(r[3])!, setting: effort?.[1].toLowerCase(), metrics: { spatial: num(r[4])!, geometric: num(r[5])!, visualKnowledge: num(r[6])! } };
    });
    if (!rows.length) throw new Error('MME-CC has no model rows');
    return rows;
  },
};
export default board;
