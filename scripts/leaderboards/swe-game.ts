// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// SWE-Game tests construction, completion, repair and porting. The authors' README reproduces Table 3, with each track scored out of 100.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = 'https://raw.githubusercontent.com/Charly-chan/SWE-Game/HEAD/README.md';
const tracks = ['Brief-to-Game', 'GDD-to-Game', 'Skeleton Completion', 'Bug Repair', 'Godot-to-Unity Porting'];
const board: Leaderboard = {
  benchmark: 'swe-game', url: 'https://github.com/Charly-chan/SWE-Game#main-results', feed, static: 'paper',
  terms: 'The project repository uses Apache 2.0. https://github.com/Charly-chan/SWE-Game/blob/main/LICENSE',
  headline: 'The authors report no overall score, so this is the plain mean of the five track totals.',
  parts: Object.fromEntries(tracks.map(t => [t,t])),
  aliases: { Opus5: 'claude-opus-5' },
  async fetch() {
    const source = await fetchText(feed);
    const rows = new Map<string, LeaderboardRow & { metrics: Record<string, number> }>();
    for (const track of tracks) {
      const section = source.split('### ' + track + '\n')[1]?.split(/^##+ /m)[0] ?? '';
      const t = tables(section)[0];
      const header = t?.[0].map(c => c.text);
      if (header?.[0] !== 'Model' || header.at(-1) !== 'Total') throw Error('Missing track: ' + track);
      for (const [name,...cells] of t.slice(1)) {
        if (cells.length !== header.length-1 || cells.some(c => !/^\d+\.\d+$/.test(c.text))) throw Error('Invalid SWE-Game score');
        const model = name.text;
        const row = rows.get(model) ?? { model, score: 0, metrics: {} as Record<string, number> };
        if (track in row.metrics) throw Error('Duplicate track for ' + model);
        cells.forEach((cell,i) => {
          row.metrics[i === cells.length-1 ? track : track + ': ' + header[i+1]] = Number(cell.text);
        });
        rows.set(model,row);
      }
    }
    for (const row of rows.values()) {
      if (!tracks.every(t => t in row.metrics)) throw Error('Missing SWE-Game track for ' + row.model);
      row.score = tracks.reduce((n,t) => n + row.metrics[t],0)/tracks.length;
    }
    return checked([...rows.values()], 6);
  },
};
export default board;
