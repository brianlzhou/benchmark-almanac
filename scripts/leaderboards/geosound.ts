// GeoSound tests retrieval between geolocated audio and satellite images.
// Tables 1 and 2 report both retrieval directions. The first metric is the
// fraction of image queries that retrieve their sound in the top tenth.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2408.07050';
export default {
  benchmark:'geosound',url:feed,feed,static:'paper',
  terms:'Paper and license at https://arxiv.org/abs/2408.07050',
  headline:'The headline is image-to-audio recall at the top 10% of candidates for the specified imagery and evaluation setting.',
  parts:{a2i:'Audio-to-image recall at top 10%', i2aRank:{name:'Image-to-audio median rank',unit:'score',better:'lower'},
    a2iRank:{name:'Audio-to-image median rank',unit:'score',better:'lower'}} as Record<string,string|BoardPart>,
  async fetch() {
    const html = await paperHtml(feed);
    const figures = html.match(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>[\s\S]*?<\/figure>/gi) ?? [];
    const rows = ['Bing','Sentinel-2'].flatMap(imagery=>{
      const fig = figures.find(f=>f.match(/<figcaption[\s\S]*?<\/figcaption>/)?.[0].includes(imagery) && f.includes('meta/train'));
      const t = fig && paperTables(fig).map(grid).find(t=>t[0].join('|')==='method|loss|meta/train|text/eval|meta/eval|ZL|I2A R@10%|I2A MdR|A2I R@10%|A2I MdR');
      if (!t) throw new Error('Missing GeoSound table for '+imagery);
      return checked(t.slice(1).map(([method,loss,train,text,meta,zoom,i2a,i2aRank,a2i,a2iRank])=>{
        if (![train,text,meta].every(s=>s==='✓'||s==='✗')) throw new Error('Unexpected metadata flags');
        const mode=(v:string)=>v==='✓'?'on':'off';
        const setting = [imagery,loss,'zoom '+zoom,'training metadata '+mode(train),'test text '+mode(text),'test metadata '+mode(meta)].join(', ');
        return {model:method==='ours'?'PSM':method,setting,score:numberCell(i2a),
          metrics:{i2aRank:numberCell(i2aRank),a2i:numberCell(a2i),a2iRank:numberCell(a2iRank)}};
      }),18);
    });
    return checked(rows,36);
  },
} satisfies Leaderboard;
