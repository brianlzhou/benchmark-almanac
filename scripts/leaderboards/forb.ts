// FORB tests retrieval of flat objects across variations in viewpoint and lighting.
// Tables 4 and 5 give overall mean average precision at five, difficulty splits and eight object categories.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2309.16249';
const objects = ['Animated Card','Photorealistic Card','Book Cover','Painting','Currency','Logo','Packaged Goods','Movie Poster'];
const difficulty = ['Easy','Medium','Hard'];
const board: Leaderboard = {
  stats: {
    thresholdMAP: { name: 'Threshold mean average precision', unit: '%', better: 'higher' },
    ...Object.fromEntries([...objects, ...difficulty].map(name => [name + ' t-mAP', { name: name + ' threshold mAP at 5', unit: '%', better: 'higher' as const }])),
  },
  benchmark:'forb', url:'https://github.com/pxiangwu/FORB', feed, static:'paper',
  terms:'The authors publish Tables 4 and 5 in https://arxiv.org/abs/2309.16249.',
  parts:Object.fromEntries([...objects,...difficulty].map(name=>[name,name])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t=>t[0]?.[1] === 'mAP@5 (%)' && t[0]?.[5] === 't-mAP@5 (%)');
    const groups = tables.find(t=>t[0]?.[1] === 'mAP@5 (%) / t-mAP@5 (%)');
    if (main?.[1].join('|') !== 'Method|Overall|Easy|Medium|Hard|Overall|Easy|Medium|Hard' ||
        groups?.[1].slice(1).join('|') !== objects.join('|')) throw new Error('Missing FORB results columns');
    return checked(main.slice(2).map(([name,...cells])=>{
      const group = groups!.slice(2).find(r=>r[0]===name);
      if (!group || group.length !== 9 || cells.length !== 8) throw new Error('Incomplete FORB results for '+name);
      const metrics: Record<string,number> = {thresholdMAP:numberCell(cells[4])};
      difficulty.forEach((key,i) => {metrics[key]=numberCell(cells[i+1]); metrics[key+' t-mAP']=numberCell(cells[i+5]);});
      objects.forEach((key,i)=>{
        const [ap,tap] = group[i+1].split(' / ').map(numberCell);
        if (!Number.isFinite(tap)) throw new Error('Missing category score for '+key);
        metrics[key]=ap; metrics[key+' t-mAP']=tap;
      });
      return {model:name.replace(/ \(\+ rerank\)| †|\s*\[\s*\d+\s*\]/g,'').trim(),
        setting:name.includes('(+ rerank)')?'Reranking':undefined, score:numberCell(cells[0]), metrics};
    }),12);
  },
};
export default board;
