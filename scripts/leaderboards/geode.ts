// GeoDE tests image classification across six world regions. Table 5 gives overall
// test accuracy for two linear classifiers on PASS ResNet50 features. Section 6
// reports overall CLIP ViT-B/32 accuracy and Figure 8 gives its regional breakdown.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2301.02560';
const keys = ['westAsia','africa','eastAsia','southeastAsia','americas','europe'];
export default {
  benchmark:'geode',url:feed,feed,static:'paper',
  terms:'Paper and license at https://arxiv.org/abs/2301.02560',
  parts:{westAsia:'West Asia',africa:'Africa',eastAsia:'East Asia',southeastAsia:'Southeast Asia',americas:'Americas',europe:'Europe'},
  async fetch() {
    const html = await paperHtml(feed);
    const tables = paperTables(html).map(grid);
    const main = tables.find(t=>t[0][1]==='Tested on GeoDE' && t[1]?.slice(1,8).join('|')==='West Asia|Africa|East Asia|SE Asia|Americas|Europe|Overall');
    const regions = tables.find(t=>t[0].join('|')==='Model|WAsia|Africa|EAsia|SEAsia|Americas|Europe');
    const clip = regions?.find(r=>r[0]==='CLIP');
    const overall = text(html).match(/per-object accuracy for CLIP\.\s*While the average accuracy is ([\d.]+)%/);
    if(!main || !clip || !overall) throw new Error('Missing GeoDE overall or regional scores');
    const metrics = (r:string[])=>Object.fromEntries(keys.map((key,i)=>[key,numberCell(r[i+1])]));
    const rows = main.slice(2).map(r=>{
      if (!['ImageNet','+GeoDE'].includes(r[0])) throw new Error('Unexpected training set');
      return {model:'ResNet50 (PASS)',setting:r[0]==='ImageNet'?'ImageNet':'ImageNet + GeoDE',score:numberCell(r[7]),metrics:metrics(r)};
    });
    rows.push({model:'CLIP ViT-B/32',setting:'Zero-shot',score:numberCell(overall[1]),metrics:metrics(clip)});
    return checked(rows,3);
  },
} satisfies Leaderboard;
