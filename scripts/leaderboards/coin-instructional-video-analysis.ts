// COIN tests localization of steps in instructional videos. Table 2 reports mean average
// precision and recall at five overlap thresholds. The authors compare systems at IoU 0.5.
import type { Leaderboard, BoardPart } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = 'https://openaccess.thecvf.com/content_CVPR_2019/papers/Tang_COIN_A_Large-Scale_Dataset_for_Comprehensive_Instructional_Video_Analysis_CVPR_2019_paper.pdf';
const parts: Record<string, BoardPart> = {};
export default {
  benchmark:'coin-instructional-video-analysis',static:'paper',url:'https://coin-dataset.github.io/',feed,parts,
  terms:'CVF Open Access, https://openaccess.thecvf.com/content_CVPR_2019/html/Tang_COIN_A_Large-Scale_Dataset_for_Comprehensive_Instructional_Video_Analysis_CVPR_2019_paper.html',
  headline:'The headline is mean average precision for step localization at IoU 0.5.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Table 2\. Comparisons of the step localization accuracy \(%\) on the COIN dataset\.([\s\S]+?)\n\s*\n/)?.[1];
    if (!table?.includes('mAP @') || !table.includes('mAR @') || !/0\.1\s+0\.2\s+0\.3\s+0\.4\s+0\.5/.test(table)) throw new Error('Missing localization table');
    const rows = table.trim().split('\n').slice(2).filter(line => !/^\s*Random\b/.test(line)).map(line => {
      const match = line.trim().match(/^(\S+)(?:\s+\[\d+\])?\s+([\d.\s]+)$/);
      if (!match) throw new Error('Unknown localization row: '+line);
      const values = match[2].trim().split(/\s+/).map(Number);
      if (values.length !== 10 || !values.every(Number.isFinite)) throw new Error('Missing localization measure');
      const metrics: Record<string,number> = {};
      values.forEach((value,i) => {
        const metric = i<5 ? 'mAP' : 'mAR', index = i%5+1, key = metric+index;
        parts[key] = {name:metric+' at IoU 0.'+index};
        metrics[key] = value;
      });
      return {model:match[1],score:values[4],metrics};
    });
    return checked(rows,8);
  },
} satisfies Leaderboard;
