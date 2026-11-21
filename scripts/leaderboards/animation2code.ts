// Animation2Code tests whether a model can reconstruct a video as executable web animation code.
// The project results table gives appearance similarity first among the two reconstruction quality measures.
// Temporal similarity and the percentage of programs that execute are retained separately.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://anya-ji.github.io/animation2code-website/';
const board: Leaderboard = {
  benchmark: 'animation2code', url: feed, feed,
  terms: 'The project website uses CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t =>
      t[0]?.map(c => c.text).join('|') === 'Setting / Model|FPS|Exec (%)|Appearance|Temporal');
    if (!table) throw new Error('Missing Animation2Code results table');
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const cells of table.slice(1)) {
      if (cells.length === 1) {
        group = cells[0].text;
        continue;
      }
      const [label, fps, execution, appearance, temporal] = cells.map(c => c.text);
      if (!group || cells.length !== 5 || ![fps, execution, appearance, temporal].every(s => /^\d+(\.\d+)?$/.test(s))) {
        throw new Error('Unexpected Animation2Code row');
      }
      const refinementModel = group.match(/^SFT \/ refinement \(([^,]+), video input\)$/)?.[1];
      rows.push({ model: refinementModel ?? label, setting: (refinementModel ? 'Video input ' + label : group) + ', ' + fps + ' FPS',
        score: Number(appearance), metrics: { temporal: Number(temporal), executionPercent: Number(execution) } });
    }
    return checked(rows, 14);
  },
};
export default board;
