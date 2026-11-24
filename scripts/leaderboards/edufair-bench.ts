// The source reports no overall score. The headline is the plain mean of the 12 parts, computed by this importer.
// EduFair-Bench measures demographic differences in tutoring. Table 8 reports mean absolute
// rank-biserial correlations across five turn-level behaviors. Smaller values indicate less bias.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2609.12949';
const dimensions = ['Gender','Socioeconomic status','First language','Immigration'];
export default {
  benchmark: 'edufair-bench', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2609.12949',
  headline: 'The headline averages 12 explicit-condition bias scores across three subjects and four demographic dimensions. Lower scores indicate less bias.',
  aliases: {'DeepSeek-R1-70B': 'deepseek-r1-distill-llama-70b'},
  parts: {} as Record<string, BoardPart>,
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === 'Domain|Model|Gender|SES|Lang.|Immi.');
    if (!table) throw new Error('Missing explicit-condition bias scores');
    const models = new Map<string,Record<string,number>>();
    for (const [domain,model,...values] of table.slice(1)) {
      if (!['Math','Chemistry','Physics'].includes(domain) || values.length !== 4) throw new Error('Unexpected domain or dimensions');
      const metrics = models.get(model) ?? {};
      dimensions.forEach((dimension,i) => {
        const key = domain.toLowerCase() + dimension.replaceAll(' ','');
        if (key in metrics) throw new Error('Duplicate bias measurement');
        metrics[key] = numberCell(values[i]);
        (this.parts ??= {})[key] = {name: domain + ': ' + dimension, unit: 'score', better: 'lower'};
      });
      models.set(model,metrics);
    }
    return checked([...models].map(([model,metrics]) => {
      const values = Object.values(metrics);
      if (values.length !== 12) throw new Error('Incomplete explicit condition for ' + model);
      return {model, setting:'Explicit', score: values.reduce((a,b)=>a+b,0)/12, metrics};
    }),5);
  },
} satisfies Leaderboard;
