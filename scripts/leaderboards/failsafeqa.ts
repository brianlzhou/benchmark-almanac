// FailSafeQA tests answers to financial questions under query and document failures.
// Table 2 reports the authors' Compliance score combining robustness and context
// grounding with beta 0.5. Table 1 supplies baseline and perturbed-query scores.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2502.06329';
const parts = {irrelevant:'Irrelevant context', missing:'No context', qa:'Context grounding QA',
  tg:'Context grounding TG', grounding:'Context grounding', robustness:'Robustness', baseline:'Baseline',
  misspelled:'Misspelled', incomplete:'Incomplete', outOfDomain:'Out-of-domain', ocr:'OCR context'};
export default {
  benchmark:'failsafeqa', url:feed, feed, static:'paper', parts,
  terms:'Paper and license at https://arxiv.org/abs/2502.06329',
  aliases:{'OpenAI o1':'o1','OpenAI o3-mini':'o3-mini','Nemotron-70B-Instruct-HF':'llama-3-1-nemotron-70b-instruct','DeepSeek-R1 (snapshot unspecified)':'deepseek-r1'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t=>t[0].join('|') === 'Model Name|Irrelevant Ctx|No Ctx|Ctx Grounding QA|Ctx Grounding TG|Ctx Grounding|Robustness|Compliance');
    const robustness = tables.find(t=>t[0][1] === 'Baseline' && t[0][2].startsWith('Mispelled') && t[0][6].startsWith('Robustness'));
    if (!main || !robustness) throw new Error('Missing FailSafeQA results columns');
    const byModel = new Map(robustness.slice(1).map(c=>[c[0],c]));
    const rows = main.slice(1).map(([model,...c]) => {
      const aux = byModel.get(model);
      if (!aux || aux.length!==7 || c.length!==7) throw new Error('Incomplete results for '+model);
      const metrics: Record<string,number> = {};
      Object.keys(parts).slice(0,6).forEach((key,i)=>{metrics[key]=numberCell(c[i]);});
      Object.keys(parts).slice(6).forEach((key,i)=>{metrics[key]=numberCell(aux[i+1].split(' ')[0]);});
      return {model, score:numberCell(c[6]), metrics};
    });
    return checked(rows,24);
  },
} satisfies Leaderboard;
