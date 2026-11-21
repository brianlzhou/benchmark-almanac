// Published Overall success percentage, including the appendix delay and few-shot settings.
// Table 6 splits the main result by how many tasks run together and whether they share a scenario.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2605.27995';
const splits = {similar2: 'SIMILAR#2', similar3: 'SIMILAR#3', cross2: 'CROSS#2', cross3: 'CROSS#3'};
const board: Leaderboard = {
  benchmark: 'asynctool', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  parts: Object.fromEntries(Object.entries(splits).map(([key,name]) => [key, {name, group: 'Task combination'}])),
  stats: {
    function: { name: 'Function F1', unit: '%', better: 'higher', note: 'F1 score for matching the model’s function results with ground truth.' },
    parameter: { name: 'Parameter F1', unit: '%', better: 'higher', note: 'F1 score for matching the model’s parameter results with ground truth.' },
    subtaskCharacter: { name: 'Subtask path match', unit: '%', better: 'higher', note: 'Path matching at the subtask level.' },
    subtaskEnvironment: { name: 'Subtask environment match', unit: '%', better: 'higher', note: 'Matching multiple execution result environments at the subtask level.' },
    subtaskAccuracy: { name: 'Subtask accuracy', unit: '%', better: 'higher' },
    taskCharacter: { name: 'Task path match', unit: '%', better: 'higher', note: 'Path matching at the task level.' },
    taskEnvironment: { name: 'Task environment match', unit: '%', better: 'higher', note: 'Matching multiple execution result environments at the task level.' },
  },
  async fetch() {
    const page = await paperHtml(URL);
    const figures = new Map<string, string[][]>();
    for (const m of page.matchAll(/<figure id="[^"]*\.T(\d+)"[^>]*>([\s\S]*?)<\/figure>/g)) {
      const table = paperTables(m[2])[0];
      if (table) figures.set(m[1], grid(table));
    }
    const settings: [string, string | undefined][] = [
      ['1', undefined], ['8', 'Two-turn delay'], ['9', 'Random zero-to-one-turn delay'],
      ['10', 'Random one-to-two-turn delay'], ['11', 'Few-shot'],
    ];
    const out: LeaderboardRow[] = [];
    for (const [id, setting] of settings) {
      const table = figures.get(id);
      if (table?.[0].at(-1) !== 'Overall' || table[1]?.[1] !== 'Func.') throw new Error('Overall table changed');
      let open: boolean | undefined;
      let fewShotModel = '';
      for (const c of table.slice(2)) {
        if (/^(Open|Closed)[ -]Sourc/i.test(c[0])) { open = /^Open/i.test(c[0]); continue; }
        if (!/^\d+(?:\.\d+)?%?$/.test(c[8]?.trim() ?? '')) continue;
        if (id === '11' && c[0] !== '+fewshot') { fewShotModel = c[0]; continue; }
        const label = id === '11' ? fewShotModel : c[0];
        const model = label.replace('Gemini 2.5Pro', 'Gemini 2.5 Pro').replace(/\s*\[[^\]]+\]/g,'');
        const score = parseFloat(c[8]);
        const metrics: Record<string, number> = {};
        const keys = ['function','parameter','subtaskCharacter','subtaskEnvironment','subtaskAccuracy','taskCharacter','taskEnvironment'];
        keys.forEach((key, i) => { const n = parseFloat(c[i+1]); if (Number.isFinite(n)) metrics[key] = n; });
        if (id === '1') {
          const split = figures.get('6')?.find(r => r[0].toLowerCase() === model.toLowerCase() && parseFloat(r[5]) === score);
          if (split) Object.keys(splits).forEach((key,i) => { const n = parseFloat(split[i+1]); if (Number.isFinite(n)) metrics[key] = n; });
        }
        out.push({model, score, setting, open, metrics});
      }
    }
    return checked(out,3);
  },
};
export default board;
