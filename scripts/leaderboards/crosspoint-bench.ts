// CrossPoint-Bench tests point correspondence across camera views. Table 2 reports overall accuracy
// and task scores. Tables 5 and 9 report training and prompting variants.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2512.04686';
const tasks = ['Fine-grained Grounding', 'Visibility Reasoning', 'Correspondence Judgment', 'Correspondence Pointing'];
const board: Leaderboard = {
  benchmark: 'crosspoint-bench', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2512.04686",

  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.[1] === 'Score' && t[0]?.[2] === 'Fine-grained Ground.');
    const training = tables.find(t => t[2]?.[0] === '+CrossPoint-378K');
    const prompting = tables.find(t => t[2]?.[0] === '+ CoT');
    if (!main || !training || !prompting || main[0].length !== 14) throw new Error('Missing CrossPoint-Bench table');
    const rows: LeaderboardRow[] = [];
    board.parts = {};
    const keys = tasks.flatMap(task => [task + ': object', task + ': part', task]);
    for (const key of keys) board.parts[key] = {name: key, unit: '%'};
    for (const [name, score, ...values] of main.slice(2)) {
      if (name === score || name === 'Human') continue;
      if (values.length !== 12) throw new Error('Missing CrossPoint-Bench task score');
      const [model, setting] = name.replace(/\)$/, '').split('(');
      rows.push({model, setting, trials: 1000, score: numberCell(score),
        metrics: Object.fromEntries(keys.map((k, i) => [k, numberCell(values[i])]))});
    }
    function addVariant(model: string, setting: string, cells: string[]) {
      const [score, ...values] = cells.slice(1).map(v => numberCell(v.replace(/\s*[↑↓]$/, '')));
      if (values.length !== tasks.length) throw new Error('Missing variant task score');
      rows.push({model, setting, trials: 1000, score, metrics: Object.fromEntries(tasks.map((k,i) => [k,values[i]]))});
    }
    addVariant('Qwen2.5-VL-3B-Instruct', 'Trained with CrossPoint-378K', training[2]);
    const names: Record<string,string> = {'Gemini-2.5-Pro':'Gemini-2.5-Pro', 'Qwen3-VL-235B':'Qwen3-VL-235B-A22B-Thinking', 'Qwen2.5-VL-7B':'Qwen2.5-VL-7B-Instruct'};
    for (let i = 2; i < prompting.length; i += 2) {
      const model = names[prompting[i-1][0]];
      if (!model || prompting[i][0] !== '+ CoT') throw new Error('Unknown prompting variant');
      addVariant(model, 'Chain of thought', prompting[i]);
    }
    return checked(rows, 22);
  },
};
export default board;
