// VocalGrad tests whether audio models recognize increasing or decreasing acoustic properties.
// Table 2 gives mean accuracy and nine category scores. Table 5 breaks out trajectory scores.
// Tables 10, 11 and 14 report the same benchmark under three alternative prompts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.23745';
const categories = ['speed', 'pitch', 'volume', 'distortion', 'roughness', 'noise', 'echo', 'clarity', 'vibration'];
const trajectories = ['jump', 'linear', 'quad_first_flat', 'quad_last_flat'];
const board: Leaderboard = {
  benchmark: 'vocalgrad', static: 'paper', feed, url: feed,
  terms: 'The authors publish the paper on arXiv. https://info.arxiv.org/help/license/index.html',
  parts: Object.fromEntries([...categories, ...trajectories].map(k => [k, { name: k.replaceAll('_', ' '), group: categories.includes(k) ? 'Category' : 'Trajectory' }])),
  aliases: { 'Kimi-Audio': 'kimi-audio-7b-instruct', 'MiMo-Audio': 'mimo-audio-7b-instruct' },
  async fetch() {
    const html = await paperHtml(feed);
    function read(id: string, headers: string[]) {
      const section = html.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      const table = section && paperTables(section).map(grid)[0];
      if (!table || !headers.every((h, i) => table[0][i] === h)) throw new Error('Missing columns in ' + id);
      return table.slice(1).filter(([model]) => model !== 'Human Avg.').map(([model, ...values]) => {
        if (values.length !== headers.length - 1 || values.some(v => !/^\d+\.\d+$/.test(v))) throw new Error('Invalid accuracy for ' + model);
        return { model, metrics: Object.fromEntries(values.map((v, i) => [headers[i + 1], Number(v)])) };
      });
    }
    const trajectory = new Map(read('A3.T5', ['Model', ...trajectories]).map(r => [r.model, r.metrics]));
    const rows: LeaderboardRow[] = [];
    for (const [id, setting] of [['S4.T2', 'Default prompt'], ['A3.T10', 'swap_order'], ['A3.T11', 'audio_ref'], ['A3.T14', 'Four-shot']]) {
      for (const { model, metrics } of read(id, ['Model', 'Avg.', ...categories])) {
        const score = metrics['Avg.'];
        delete metrics['Avg.'];
        if (id === 'S4.T2') Object.assign(metrics, trajectory.get(model));
        rows.push({ model, score, setting, metrics });
      }
    }
    return checked(rows, 16);
  },
};
export default board;
