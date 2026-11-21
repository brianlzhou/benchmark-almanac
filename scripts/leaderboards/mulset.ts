// MulSeT tests spatial reasoning across two views. Table 8 reports overall accuracy and accuracy
// on three tasks for two model backbones with different positional encoding configurations.
// Parentheses contain changes from the vanilla model, not additional accuracy scores.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2509.02359';
const tasks = ['Occlusion Restoration','Distance Comparison','Azimuth Transfer'];
function accuracy(cell:string) {
  const match = cell.match(/^(\d+\.\d+)\s*(?:\([+-]\d+\.\d+\))?$/);
  if (!match) throw new Error('Invalid MulSeT accuracy: '+cell);
  return numberCell(match[1]);
}
const board: Leaderboard = {
  benchmark:'mulset', static:'paper', url, feed:url, terms:PAPER_TERMS,
  parts:Object.fromEntries(tasks.map(name => [name,{name,unit:'%'}])),
  aliases:{'Qwen2.5-VL-7b':'qwen2-5-vl-7b','Llava-OV-7b':'llava-onevision-7b'},
  async fetch() {
    const table = flatPaperTables(await paperHtml(url)).map(grid).find(t => t[0].join('|') === ['Model','Ablation Type',...tasks,'Overall'].join('|'));
    if (!table) throw new Error('Missing MulSeT Table 8');
    let model = '';
    return checked(table.slice(1).map(([label,setting,...values]) => {
      if (label) model = label;
      if (values.length !== 4) throw new Error('Incomplete MulSeT row');
      return {model, setting, score:accuracy(values[3]), metrics:Object.fromEntries(tasks.map((name,i) => [name,accuracy(values[i])]))};
    }),35);
  },
};
export default board;
