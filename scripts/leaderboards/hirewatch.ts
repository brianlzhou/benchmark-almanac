// HireWatch measures the percentage of interview questions selected that are unlawful.
// Table 17 gives the mean unlawful selection rate across all seven pressure tiers without a compliance instruction.
// The headline includes all trials, including those that returned the wrong number of items.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.24970';
const board: Leaderboard = {
  benchmark:'hirewatch', static:'paper',url:feed,feed,terms:PAPER_TERMS + ' https://arxiv.org/licenses/',
  stats:{delta:{name:'Selection rate change',unit:'%',better:'lower'},filteredTrials:{name:'Filtered trials',unit:'count'}},
  aliases:{'Haiku 3.5':'claude-3-5-haiku','Haiku 4.5':'claude-haiku-4-5','Sonnet 4.6':'claude-sonnet-4-6',
    'Opus 4.7':'claude-opus-4-7','Llama 3.3 70B':'llama-3-3-70b-instruct','Llama 4 Mav':'llama-4-maverick',
    'Qwen3 235B':'qwen3-235b-a22b','DeepSeek V3 (snapshot unspecified)':'deepseek-v3-mar-2025',
    'Mistral Small':'mistral-small-3-1','Mistral Large':'mistral-large-2-nov-2024'},
  parts:{filtered:{name:'ISR on format-compliant trials',unit:'%',better:'lower'}},
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Model|ISR-all (%)|ISR-filtered (%)|\\Delta|N_{all}|N_{filt}');
    if (!table) throw Error('Missing Table 17 selection rates');
    return checked(table.slice(1).map(r => {
      const values = r.slice(1).map(s=>s.trim()? Number(s):NaN);
      if (!values.every(Number.isFinite)) throw Error('Missing rates for '+r[0]);
      return {model:r[0],score:values[0],setting:'No compliance instruction, temperature 0',trials:values[3],
        metrics:{filtered:values[1],delta:values[2],filteredTrials:values[4]}};
    }),18);
  },
};
export default board;
