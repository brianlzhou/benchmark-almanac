// LLM-Coordination tests cooperation in games. The games use different scoring scales.
// The headline is Overcooked reward on Cramped Room, the first layout in Table 1.
// Tables 1 through 3 supply the remaining layout rewards, game outcomes and Hanabi scores.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2310.03903';
const layouts = ['Cramped Room', 'Asymmetric Advantages', 'Coordination Ring', 'Forced Coordination', 'Counter Circuit'];
const board: Leaderboard = {
  benchmark: 'llm-coordination', static: 'paper', feed, url: feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper uses different scoring scales across games. The headline is reward on Cramped Room, its first Overcooked layout.',
  parts: { ...Object.fromEntries(layouts.map(name => [name, name])), Hanabi: 'Hanabi',
    capture: { name: 'Capture Rate', unit: '%' }, escape: { name: 'Escape Rate', unit: '%' } },
  stats:{captureTurns:{name:'Average turns to capture',unit:'count'},escapeTurns:{name:'Average turns to escape',unit:'count'},
    ...Object.fromEntries([...layouts, 'Hanabi'].map(name => [name + ' uncertainty', {
      name: name + ' reward uncertainty', unit: 'score' as const,
      note: 'Absolute uncertainty shown after the source value.'
    }]))},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const overcooked = tables.find(t => t[0]?.join('|') === 'Agent|CR|AA|Ring|FC|CC');
    const collab = tables.find(t => t[1]?.join('|') === 'Agent|Capture Rate|Avg. Turns|Escape Rate|Avg. Turns');
    const hanabi = tables.find(t => t[0]?.join('|') === 'Agent|Score' && t[1]?.[0] === 'Bayesian Action Decoder');
    if (!overcooked || !collab || !hanabi) throw Error('Missing coordination game table');
    function reward(cell: string) {
      const fields = cell.split('\\pm').map(v => Number(v.trim()));
      if (fields.length !== 2 || !fields.every(Number.isFinite)) throw Error('Unexpected reward: ' + cell);
      return fields;
    }
    return checked(overcooked.slice(1).map(([model, ...cells]) => {
      const metrics: Record<string, number> = {};
      for (const [index, layout] of layouts.entries()) {
        [metrics[layout], metrics[layout + ' uncertainty']] = reward(cells[index]);
      }
      const name = model === 'Mixtral8x7B' ? 'Mixtral-8x7b' : model;
      const c = collab.find(r => r[0] === name);
      const h = hanabi.find(r => r[0] === name);
      if (c && h) {
        [metrics.Hanabi, metrics['Hanabi uncertainty']] = reward(h[1]);
        metrics.capture = Number(c[1]) * 100;
        metrics.captureTurns = Number(c[2]);
        metrics.escape = Number(c[3]) * 100;
        metrics.escapeTurns = Number(c[4]);
      } else if (model !== 'Self-Play (PPO)' && model !== 'PBT') {
        throw Error('Missing results for ' + model);
      }
      return { model, score: metrics[layouts[0]], metrics, ...(c ? { harness: 'CAC' } : {}) };
    }), 6);
  },
};
export default board;
