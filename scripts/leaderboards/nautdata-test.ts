// NautData tests underwater scene understanding. Table 2 reports classification, captioning,
// grounding, detection and visual question answering. The headline is coarse classification
// accuracy, the first column. METEOR is kept on the paper's scale.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2510.27481';
const names = ['Coarse accuracy','Fine accuracy','Image caption METEOR','Region caption METEOR','Grounding mIoU',
  'Grounding PR@0.5','Detection mAP','Detection mAP@0.5','VQA METEOR'];
const parts:Record<string,BoardPart> = {};
for (const name of names) parts[name] = {name,unit:name.endsWith('METEOR') ? 'score' : '%'};
const board: Leaderboard = {
  benchmark:'nautdata-test',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,
  headline:'The paper reports distinct task metrics. The headline is coarse classification accuracy, its first column.',
  aliases:{'InternVL-2.5':'internvl2-5-8b','Qwen2.5-VL':'qwen2-5-vl-7b','LLaVA-1.5':'llava-v1-5-7b','mPLUG-Owl3':'mplug-owl3-7b'},
  async fetch() {
    const t=flatPaperTables(await paperHtml(url)).map(grid).find(t => t[1]?.join('|') === 'Methods|Reference|Coarse|Fine|Image|Region|Grounding|Grounding|Detection|Detection|VQA' && t[2][10]?.startsWith('METEOR'));
    if (!t) throw new Error('Missing NautData Table 2');
    const rows:LeaderboardRow[] = [];
    let setting='';
    for (const row of t.slice(3)) {
      if (row.every(c => c === row[0])) {setting=row[0].replace(' experiments',''); continue;}
      if (!setting || row.length !== names.length+2) throw new Error('Incomplete NautData configuration');
      const metrics = Object.fromEntries(names.map((name,i) => [name,numberCell(row[i+2].split(' (')[0])]));
      rows.push({model:row[0].replace(/\s*\[\s*\d+\s*\]/g,''),setting,score:metrics[names[0]],metrics});
    }
    return checked(rows,10);
  },
};
export default board;
