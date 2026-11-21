// StateBench tests whether a generated video preserves and updates world states across segments.
// Table 1 reports SCS-All, the all-case state consistency score that assigns zero to unsuccessful actions.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2609.03673';
const levels = ['Past-visible', 'Occluded-process', 'Complex-transition'];
const measures = ['SES', 'SC', 'HR', 'SCS'];
const board: Leaderboard = {
  benchmark: 'statebench-video-continuation', feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: Object.fromEntries(levels.flatMap(l => measures.map(m => [l + ': ' + m, { name: l + ': ' + m,
    better: m === 'HR' ? 'lower' : 'higher' }]))),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === ['', ...levels.flatMap(l => Array(4).fill(l)), 'Overall','Overall','Overall'].join('|')
      && t[1]?.map(s => s.split(' ')[0]).join('|') === ['Method',...levels.flatMap(() => measures),'SES','SCS','SCS-All'].join('|'));
    if (!table) throw Error('Missing StateBench Table 1');
    return checked(table.slice(2).map(([name,...cells]) => {
      if (cells.length !== 15 || !cells.every(s => /^\d+\.\d+$/.test(s))) throw Error('Invalid StateBench result');
      const metrics: Record<string, number> = { SES: Number(cells[12]), SCS: Number(cells[13]) };
      levels.forEach((l,i) => measures.forEach((m,j) => { metrics[l + ': ' + m] = Number(cells[4*i+j]); }));
      let model = name.replace(/\s+\( [^()]+ \)$/, '');
      let setting: string | undefined;
      if (model === 'Wan-I2V') { model = 'Wan2.2-I2V-A14B'; setting = 'Final frame'; }
      if (model === 'LongCat-Video (recent frames)') { model = 'LongCat-Video'; setting = 'Recent frames'; }
      if (model === 'StoryMem + full KFs') { model = 'StoryMem'; setting = 'Full keyframes'; }
      return { model, score: Number(cells[14]), setting, metrics };
    }), 6);
  },
};
export default board;
