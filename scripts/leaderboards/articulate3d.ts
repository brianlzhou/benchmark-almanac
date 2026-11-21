// Articulate3D ranks ECCV 2026 submissions by movable part AP50 with both axis and origin correct.
// The challenge page also lists interaction AP50 for teams that submitted to both tracks.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://insait-institute.github.io/articulate3d.github.io/challenge.html";
const board: Leaderboard = {
  benchmark: "articulate3d",
  url: "https://insait-institute.github.io/articulate3d.github.io/challenge.html",
  feed: FEED,
  terms: "The challenge website lists CC BY-SA 4.0. Its robots URL returns HTML.",
  parts: { interaction: 'Interaction Prediction' },
  async fetch() {
    const [movable, interaction] = tables(await fetchText(FEED)).map(table => table.map(row => row.map(c => c.text)));
    if (movable?.[0].join('|') !== 'Rank|Team|AP50 axis+origin ↑|AP50 ↑|AP50 axis ↑|AP50 origin ↑|# Subs' ||
        interaction?.[0].join('|') !== 'Rank|Team|AP50 ↑|# Subs' || movable.length < 13 || interaction.length < 9)
      throw new Error('Articulate3D standings changed');
    return movable.slice(1).map(([, name, ...cells]) => {
      const model = name.replace(' Official Baseline', '');
      const [score, ap50, axis, origin] = cells.slice(0, 4).map(Number);
      if (cells.length !== 5 || cells.slice(0, 4).some(v => !v || !Number.isFinite(Number(v)))) throw new Error('Invalid movable part score for ' + model);
      const other = interaction.slice(1).find(row => row[1] === model);
      return { model, submitter: name.includes('Official Baseline') ? undefined : model,
        score, metrics: { ap50, axis, origin, ...(other ? { interaction: Number(other[2]), interactionSubmissions: Number(other[3]) } : {}),
          ...(Number(cells[4]) > 0 ? { submissions: Number(cells[4]) } : {}) } };
    });
  },
};
export default board;
