// MDMR-Bench tests image editing with multiple reference images. The headline is the authors' overall checklist score in Table 2.
// Table 3 gives the five task scores. Its separately printed overall can differ slightly from Table 2.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://github.com/LHRYANG/MDMR-Bench';
const feed = 'https://raw.githubusercontent.com/LHRYANG/MDMR-Bench/main/README.md';
const dimensions = ['Following', 'Consistency', 'Composition', 'Minimality', 'Quality'];
const tasks = ['Entity Fusion', 'Multi-Element Extraction', 'Visual Reasoning', 'Attribute Transfer', 'Infographic Manip.'];
const board: Leaderboard = {
  benchmark: 'mdmr-bench', feed, url,
  terms: 'The authors publish this public README under GitHub’s terms at https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  aliases: { 'FLUX.2': 'flux-2-dev', 'Qwen-Image-Edit': 'qwen-image-edit-2511' },
  parts: Object.fromEntries([...dimensions, ...tasks, 'taskOverall'].map(name => [name, {
    name: name === 'taskOverall' ? 'Overall task score' : name,
    group: name === 'taskOverall' || tasks.includes(name) ? 'Task' : 'Dimension',
  }])),
  async fetch() {
    const grids = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)));
    const results = new Map<string, LeaderboardRow>();
    for (const names of [dimensions, tasks]) {
      const t = grids.find(t => t[0]?.join('|') === ['Model', ...names, 'Overall'].join('|'));
      if (!t) throw new Error('Missing checklist table for ' + names[0]);
      let open: boolean | undefined;
      for (const [model, ...cells] of t.slice(1)) {
        if (model === 'Open-source Models' || model === 'Closed-source Models') {
          open = model.startsWith('Open');
          continue;
        }
        if (open === undefined || cells.length !== 6) throw new Error('Incomplete checklist row');
        const values = cells.map(numberCell);
        const metrics = Object.fromEntries(names.map((key, i) => [key, values[i]]));
        if (names === dimensions) {
          if (results.has(model)) throw new Error('Duplicate model: ' + model);
          results.set(model, { model, open, score: values[5], metrics });
        } else {
          const row = results.get(model);
          if (!row || row.metrics!.taskOverall !== undefined) throw new Error('Unexpected task result for ' + model);
          Object.assign(row.metrics!, metrics, { taskOverall: values[5] });
        }
      }
    }
    const rows = [...results.values()];
    if (rows.some(r => r.metrics!.taskOverall === undefined)) throw new Error('Missing task scores');
    return checked(rows, 11);
  },
};
export default board;
