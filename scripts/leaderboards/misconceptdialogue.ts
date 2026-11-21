// MisconceptDialogue tests whether a math tutor can correct simulated students' misconceptions.
// Tables 3 and 16 report remediation success across 450 dialogues per tutor. The headline uses
// the in-experiment GPT-5-mini judge. Other judges, automatic criteria and answer reveals are retained.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const url = 'https://arxiv.org/html/2610.31679';
const checkpoints: Record<string,string> = {
  'Qwen-2.5-7B':'Qwen2.5-7B-Instruct', 'Mistral-7B':'Mistral-7B-Instruct-v0.3', 'Llama-3.1-8B':'Llama-3.1-8B-Instruct',
};
const board: Leaderboard = {
  benchmark:'misconceptdialogue', static:'paper', url, feed:url, terms:PAPER_TERMS,
  headline:'The score is the percentage of simulated tutoring dialogues that GPT-5-mini judged successful.',
  parts:{strict:{name:'Strict match',unit:'%'},numeric:{name:'Numeric extraction',unit:'%'},
    gpt:{name:'GPT-5-mini judge',unit:'%'},claude:{name:'Claude Haiku 4.5 judge',unit:'%'},gemini:{name:'Gemini 3.1 Flash Lite judge',unit:'%'},
    arr:{name:'Answer reveal rate',unit:'%',better:'lower'}},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(url));
    const main = tables.find(t => t[1]?.join('|') === 'Tutor Model|Strict|Numeric|GPT|Claude|Gemini|ARR');
    const all = tables.find(t => t[0]?.join('|') === 'Tutor|Strict|GPT|Claude|Gemini');
    if (!main || !all) throw new Error('Missing remediation success tables');
    const rows = all.slice(2).filter(r => /^\d+(?:\.\d+)?$/.test(r[1]) && r[0] !== 'Mean').map(([label,strict,gpt,claude,gemini]) => {
      const metrics: Record<string,number> = {strict:numberCell(strict),gpt:numberCell(gpt),claude:numberCell(claude),gemini:numberCell(gemini)};
      const more = main.find(r => r[0] === label);
      if (more) { metrics.numeric = numberCell(more[2]); metrics.arr = numberCell(more[6]); }
      return {model:checkpoints[label] || label,score:metrics.gpt,metrics};
    });
    return checked(rows,7);
  },
};
export default board;
