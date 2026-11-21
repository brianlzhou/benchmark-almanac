// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// GenomeQA tests sequence-based genome inference. Tables 2 and 3 give average accuracy for binary and multiple-choice questions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2604.05774';
const board: Leaderboard = {
  benchmark:'genomeqa', url:'https://github.com/ai4nucleome/GenomeQA', feed, static:'paper',
  terms:'The authors publish Tables 2 and 3 under the paper terms at https://arxiv.org/abs/2604.05774.',
  aliases:{'Llama-4':'llama-4-maverick'},
  headline:'The paper reports accuracy by question format, so the headline averages its binary and multiple-choice scores.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t=>t[0]?.[1]==='Thinking' && t[0].at(-1)==='Avg.');
    const ablation = tables.find(t=>t[0].join('|')==='model|Thinking|BCQ|MCQ');
    if (!t || t[0].length!==9 || !ablation) throw new Error('GenomeQA tables missing');
    const parts: Record<string,string> = {BCQ:'Binary-choice questions',MCQ:'Multiple-choice questions'};
    const rows = new Map<string,LeaderboardRow>();
    function record(model:string,thinking:string,format:string,score:number) {
      if (!['✔','✘'].includes(thinking) || !['BCQ','MCQ'].includes(format)) throw new Error('Unknown GenomeQA setting');
      const key = model+thinking;
      const row = rows.get(key) ?? {model,setting:thinking==='✔'?'Thinking':'Non-thinking',score:0,metrics:{}};
      if (row.metrics![format] !== undefined && row.metrics![format] !== score) throw new Error('Conflicting GenomeQA score');
      row.metrics![format]=score; rows.set(key,row);
      return row;
    }
    let format = '';
    for (const [model,thinking,...cells] of t.slice(1)) {
      if (model === 'BCQ' || model === 'MCQ') {format=model;continue;}
      if (model === 'Random') continue;
      const row = record(model,thinking,format,numberCell(cells[6]));
      for (const [i,name] of t[0].slice(2,-1).entries()) {
        const key = format+': '+name; parts[key]=key; row.metrics![key]=numberCell(cells[i]);
      }
    }
    for (const [model,thinking,bcq,mcq] of ablation.slice(1)) {
      record(model,thinking,'BCQ',numberCell(bcq)); record(model,thinking,'MCQ',numberCell(mcq));
    }
    board.parts=parts;
    for (const row of rows.values()) row.score=(row.metrics!.BCQ+row.metrics!.MCQ)/2;
    return checked([...rows.values()],8);
  },
};
export default board;
