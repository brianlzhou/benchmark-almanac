// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// OpenLex3D tests indoor 3D representations. Table 2 leads with top-five synonym frequency on three datasets.
// The paper treats other label categories as errors. Tables 3 and 4 separately report set ranking and object retrieval.
import type { BoardStat, Leaderboard, BoardPart} from './types.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2503.19764';
const datasets = ['Replica','ScanNet++','HM3D'];
const stats: Record<string, BoardStat> = Object.fromEntries(datasets.flatMap((dataset) => [
  [`${dataset}Mean ranking score`, { name: `${dataset} mean ranking score`, unit: 'score', better: 'higher' as const }],
  [`${dataset}Synonym inlier rate`, { name: `${dataset} synonym inlier rate`, unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' }],
  [`${dataset}Synonym penalty`, { name: `${dataset} synonym penalty`, unit: 'score', better: 'lower' }],
  [`${dataset}Depiction and visually similar inlier rate`, { name: `${dataset} depiction and visually similar inlier rate`, unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' }],
  [`${dataset}Depiction and visually similar underscoring penalty`, { name: `${dataset} underscoring penalty`, unit: 'score', better: 'lower' }],
  [`${dataset}Depiction and visually similar overscoring penalty`, { name: `${dataset} overscoring penalty`, unit: 'score', better: 'lower' }],
  [`${dataset} mAP`, { name: `${dataset} mean average precision`, unit: '%', better: 'higher' }],
  [`${dataset} AP50`, { name: `${dataset} average precision at 50% IoU`, unit: '%', better: 'higher' }],
  [`${dataset} AP25`, { name: `${dataset} average precision at 25% IoU`, unit: '%', better: 'higher' }],
  [`${dataset} NMS mAP`, { name: `${dataset} NMS mean average precision`, unit: '%', better: 'higher' }],
  [`${dataset} NMS AP50`, { name: `${dataset} NMS average precision at 50% IoU`, unit: '%', better: 'higher' }],
  [`${dataset} NMS AP25`, { name: `${dataset} NMS average precision at 25% IoU`, unit: '%', better: 'higher' }],
]));
const categories = ['Synonyms','Depictions','Visually similar','Clutter','Missing','Incorrect'];
const parts: Record<string, BoardPart> = Object.fromEntries(datasets.flatMap((dataset) =>
  categories.map((category, j) => [dataset + category, { name: category, group: dataset, ...(j ? { better: 'lower' as const } : {}) }])
));
const board: Leaderboard = {
  benchmark:'openlex3d', static:'paper', feed, url:'https://openlex3d.github.io/',
  parts,
  stats,
  terms:PAPER_TERMS + ' https://arxiv.org/abs/2503.19764',
  headline:'The headline is the plain mean of top-five synonym frequency on Replica, ScanNet++ and HM3D.',
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(feed));
    const freq = tables.find(t=>t[0]?.[2]?.includes(' S ↑') && t[0]?.[3] === 'D ↓');
    const ranking = tables.find(t=>t[0]?.[2] === 'mR\\uparrow');
    const retrieval = tables.find(t=>t[0]?.[2] === 'mAP\\uparrow');
    const std = tables.find(t=>t[0]?.[0] === 'N' && t.some(r=>r[0]==='5'));
    if (freq?.length !== 22 || ranking?.length !== 22 || retrieval?.length !== 16 || !std) {
      throw new Error('Missing OpenLex3D results');
    }
    const groups = new Map<string,Record<string,number>>();
    const clean = (s:string)=>s.replace(/\s*\[\s*\d+\s*\]/,'').trim();
    const num = (s:string)=>numberCell(s.replace(/\s/g,''));
    const ranks = ['Mean ranking score','Synonym inlier rate','Synonym penalty','Depiction and visually similar inlier rate',
      'Depiction and visually similar underscoring penalty','Depiction and visually similar overscoring penalty'];
    for (const [d,dataset] of datasets.entries()) {
      const block = freq.slice(1+d*7,8+d*7);
      if (!block.some(r=>r[0]===dataset)) throw new Error('Missing frequency panel: ' + dataset);
      for (const r of block) {
        const model = clean(r[1]);
        const metrics = groups.get(model) ?? {};
        const rankingRow = ranking.find(v=>v[0]===dataset && clean(v[1])===model);
        const stdRow = std.find(v=>v[0]==='5' && v[1]===dataset && v[2]===model);
        if (!rankingRow || !stdRow || r.length !== 8) throw new Error('Missing statistics for ' + model);
        for (const [j,category] of categories.entries()) {
          const k = dataset+category;
          metrics[k] = 100*num(r[j+2]);
          metrics[k+'Std'] = 100*num(stdRow[j+3]);
        }
        ranks.forEach((name,j)=>metrics[dataset+name]=num(rankingRow[j+2]));
        const ap = retrieval.find(v=>v[0]===dataset && clean(v[1]).replace(' + NMS','')===model);
        if (ap) ['mAP','AP50','AP25'].forEach((k,j)=>metrics[dataset+(model==='OpenMask3D'?' NMS ':' ')+k]=num(ap[j+2]));
        groups.set(model,metrics);
      }
    }
    return checked([...groups].map(([model,metrics])=>({model,metrics,
      score:datasets.reduce((sum,d)=>sum+metrics[d+'Synonyms'],0)/datasets.length})),7);
  },
};
export default board;
