// COCO-O measures object detection under six natural distribution shifts. Tables 2 to 4, 6, and 7
// report mean average precision across the domains. The appendix also reports inference speed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2307.12730';
const domains = ['Sketch','Weather','Cartoon','Painting','Tattoo','Handmake'];
function num(cell:string) {
  if (!/^[+-]?\d+(\.\d+)?$/.test(cell)) throw new Error('Invalid COCO-O metric: ' + cell);
  return Number(cell);
}
const board: Leaderboard = {
  benchmark:'coco-o', url:feed, feed, static:'paper',
  terms:'Results credited to Xiaofeng Mao and colleagues. https://arxiv.org/abs/2307.12730',
  parts:Object.fromEntries(domains.map(name=>[name,{name,unit:'%'}])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const ranked = tables.filter(t=>t[0]?.join('|') === 'Detection|BackBone|COCO|COCO|COCO-O|COCO-O|Effective|Rank|Use|Additional|FPS');
    const details = tables.filter(t=>t[1]?.join('|').includes(['mAP',...domains,'Avg.','Robustness'].join('|')));
    const robust = tables.find(t=>t[0]?.join('|') === 'Baseline|Robust|COCO|COCO-O|Effective');
    if (ranked.length !== 2 || details.length !== 2 || !robust) throw new Error('Missing COCO-O tables');
    const rows: LeaderboardRow[] = [];
    // When the paper repeats a configuration in a second comparison, retain its original row.
    function add(model:string, setting:string, score:number, metrics:Record<string,number>) {
      const row = rows.find(r=>r.model===model && r.setting===setting);
      if (!row) rows.push({model,setting,score,metrics});
      else {
        if (row.score !== score) row.metrics!.alternateMap = score;
        for (const [k,v] of Object.entries(metrics)) if (!(k in row.metrics!)) row.metrics![k] = v;
      }
    }
    for (const t of ranked) for (const [model,backbone,coco,,score,,effective,,mask,extra,fps] of t.slice(2)) {
      add(model,backbone==='-'?'Standard':backbone,num(score),{coco:num(coco),effectiveRobustness:num(effective),fps:num(fps),useMask:Number(mask==='✓'),additionalData:Number(extra==='✓')});
    }
    for (const t of details) for (const r of t.slice(2)) {
      const labels = r.slice(0,-9).map(s=>s.replace(/\s*\[\s*\d+\s*\]/g,''));
      let [model,group,variant] = labels;
      let setting:string;
      if (labels.length===4) {
        const [method,data,detector] = labels.slice(1);
        setting = method==='Sup' && data==='IN-1K' && detector==='-' ? 'ResNet-50' :
          [method==='-'?'No pretraining':method,data,detector].filter(s=>s!=='-').join(', ');
      } else if (group===model) {
        if (model==='Deformable DETR') model='Deformable-DETR';
        setting='ResNet-50';
      } else if (group==='BackBone') setting=variant.replace(/^RN-/, 'ResNet-');
      else if (variant==='FPN' || variant==='Standard') setting='ResNet-50';
      else if (model==='Faster R-CNN' && variant==='Cascade') {model='Cascade R-CNN';setting='ResNet-50';}
      else setting=group + ': ' +variant;
      const [coco,...values]=r.slice(-9).map(num);
      add(model,setting,values[6],{coco,effectiveRobustness:values[7],...Object.fromEntries(domains.map((name,i)=>[name,values[i]]))});
    }
    for (const [model,method,coco,score,effective] of robust.slice(2)) {
      const setting = method !== '-' ? method : model==='Faster R-CNN'?'ResNet-50':'Robustness study baseline';
      add(model,setting,num(score),{coco:num(coco),effectiveRobustness:num(effective)});
    }
    if (ranked[0].length!==27 || ranked[1].length!==55) throw new Error('Changed appendix cohort sizes');
    return checked(rows, 107);
  },
};
export default board;
