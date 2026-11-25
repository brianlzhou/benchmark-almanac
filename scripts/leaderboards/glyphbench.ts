// The source reports no overall score. The headline is the plain mean of the 303 parts, computed by this importer.
// Figure 3a plots each model's mean return on each task across 25 matched seeds.
// Read the actual vector point centers and calibrate them to the labeled return axis.
// The chart hash pins the axis, color and task positions. Section 5.1 reports the paired gain as 0.436.
import { createHash } from 'node:crypto';
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2609.34214v1/eval_paired_violins.svg';
const suites = ['Classics','MiniGrid','MiniHack','Craftax','Miniatari','Procgen'];
const board:Leaderboard = {
  benchmark:'glyphbench',url:'https://arxiv.org/html/2609.34214',feed,static:'paper',
  terms:'The authors publish Figure 3 in the GlyphBench paper. https://arxiv.org/abs/2609.34214',
  headline:'The headline is the plain mean of the 303 task returns plotted in Figure 3.',
  parts:Object.fromEntries(suites.map(name => [name,{name,unit:'score' as const}])),
  stats:{steps:{name:'Mean steps',unit:'count'},totalTokens:{name:'Total tokens',unit:'tokens'}},
  async fetch() {
    const svg = await paperHtml(feed);
    if (createHash('sha256').update(svg).digest('hex') !== 'c0a350715063a771c62de3807964c3cc62557a6147e3c0732e94bbf87e52d0b4') throw new Error('GlyphBench figure changed');
    const points = [...svg.matchAll(/<path transform="matrix\(1,0,0,-1,([\d.]+),([\d.]+)\)"[^>]*fill="(#[a-f0-9]+)" fill-opacity="\.65"/g)];
    const mean = (values:number[]) => Number((values.reduce((a,b) => a+b,0)/values.length).toFixed(3));
    return checked(['Qwen3.5-4B','Qwen3.8-27B'].map((model,index) => {
      const color = ['#94a19b','#169e61'][index];
      const groups = suites.map(() => [] as number[]);
      for (const [,x,y,fill] of points) {
        if (fill !== color) continue;
        const suite = Math.round((Number(x)-69.59564)/55.56774);
        groups[suite].push((234.2617-Number(y)-157.7085)/45.79588);
      }
      if (groups.map(g => g.length).join(',') !== '50,71,63,60,43,16') throw new Error('Missing task returns');
      return {model,score:mean(groups.flat()),setting:'Zero-shot',trials:25,
        metrics:{...Object.fromEntries(suites.map((k,i) => [k,mean(groups[i])])),steps:[72.8,23.9][index],totalTokens:[2150000,596000][index]}};
    }),2);
  },
};
export default board;
