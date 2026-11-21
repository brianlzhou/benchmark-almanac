// Hidden Voices tests zero-shot ranking of piano performance difficulty.
// Table VI reports Kendall's tau-c and standard deviation across five trained
// splits for the constant-Q transform and piano-roll models.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2403.03947';
export default {
  benchmark:'hidden-voices-audio-difficulty',url:feed,feed,static:'paper',
  terms:'Paper and license at https://arxiv.org/abs/2403.03947',
  async fetch(){
    const t=paperTables(await paperHtml(feed)).map(grid).find(t=>t[0].join('|')==='Representation|Single|Multi-task|Multi-task' && t[1]?.join('|')==='Representation|Single|Era|Ranking');
    if(!t) throw new Error('Missing Hidden Voices transfer results');
    return checked(t.slice(2).flatMap(([model,...values])=>values.map((v,i)=>{
      const pair=v.match(/^(-?\d*\.\d+) \((\d*\.\d+)\)$/);
      if(!pair || i>2) throw new Error('Unexpected correlation and standard deviation: '+v);
      return {model,setting:['Single','Multi-task with era','Multi-task with ranking'][i],score:Number(pair[1]),trials:5,metrics:{std:Number(pair[2])}};
    })),6);
  },
} satisfies Leaderboard;
