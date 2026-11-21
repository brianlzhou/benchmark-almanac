// ChartX tests seven chart understanding tasks. Table 2 reports zero-shot results in different units.
// The headline is structural extraction AP@Strict, the first result in the authors' main table.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2402.12185';
const keys = ['strict','slight','high','type','title','qa','description','summary','redraw'];
const board: Leaderboard = {
  benchmark:'chartx', static:'paper', url, feed:url,
  terms:'The authors publish the paper and license at https://arxiv.org/abs/2402.12185.',
  headline:'The paper reports no overall score. The headline is structural extraction AP@Strict, the first metric in Table 2.',
  parts:{strict:'Structural extraction AP@Strict',slight:'Structural extraction AP@Slight',high:'Structural extraction AP@High',
    type:{name:'Chart type exact match',unit:'%'},title:{name:'Chart title exact match',unit:'%'},qa:{name:'QA GPT-acc',unit:'%'},
    description:'Chart description GPT-score',summary:'Chart summarization GPT-score',redraw:'Chart redrawing GPT-score'},
  aliases:{ 'LLaVA-1.5':'llava-v1-5-13b' },
  async fetch() {
    const html = (await paperHtml(url)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi,'');
    const t = paperTables(html).map(grid).find(t => t[2]?.join('|') === 'Model|#Params|AP@Strict|AP@Slight|AP@High|EM|EM|GPT-acc|GPT-score|GPT-score|GPT-score');
    if (!t || t[1].slice(5).join('|') !== 'Chart Type|Chart Title|QA|Chart Desc.|Chart Summ.|Chart Redraw.') throw new Error('Missing Table 2 columns');
    return checked(t.slice(3).filter(c => c[2]).map(c => {
      if (c.length !== 11) throw new Error('Missing ChartX metrics');
      const metrics: Record<string,number> = {};
      keys.forEach((key,i) => { if (c[i+2] !== '-') metrics[key] = numberCell(c[i+2]); });
      return {model:c[0],score:metrics.strict,metrics,params:c[1] === '-' ? undefined : parseFloat(c[1]),setting:'Zero-shot'};
    }),14);
  },
};
export default board;
