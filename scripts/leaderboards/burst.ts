// BURST measures object tracking and segmentation in videos. Table 4 reports HOTA for five tasks
// and OWTA for open-world tracking. The first task, mask-guided tracking, supplies the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://openaccess.thecvf.com/content/WACV2023/papers/Athar_BURST_A_Benchmark_for_Unifying_Object_Recognition_Segmentation_and_Tracking_WACV_2023_paper.pdf';
const configurations = [
  ['STCN', 'Mask-guided', 'STCN'], ['Box Tracker', 'Mask-guided', 'Box Tracker*'],
  ['STCN', 'Box-guided (PointRend)', 'STCN (PointRend)'],
  ['STCN', 'Box-guided (matched detection)', 'STCN (Matched Det*)'], ['Box Tracker', 'Box-guided', 'Box Tracker*'],
  ['STCN', 'Point-guided (matched detection)', 'STCN (Matched Det*)'], ['Box Tracker', 'Point-guided', 'Box Tracker*'],
  ['STCN', 'Common (COCO detector)', 'STCN Tracker*'], ['Box Tracker', 'Common (COCO detector)', 'Box Tracker*'],
  ['STCN', 'Long-tail (LVIS detector)', 'STCN Tracker†'], ['Box Tracker', 'Long-tail (LVIS detector)', 'Box Tracker†'],
  ['STCN', 'Open-world', 'STCN Tracker'], ['Box Tracker', 'Open-world', 'Box Tracker'],
  ['OWTB', 'Open-world', 'OWTB'],
];
const board: Leaderboard = {
  benchmark: 'burst', url: feed, feed, static: 'paper',
  terms: 'CVF open access paper credited to Ali Athar and colleagues. https://openaccess.thecvf.com/WACV2023',
  headline: 'The paper gives no overall score. The headline is all-class HOTA on mask-guided tracking, its first task.',
  async fetch() {
    const paper = await pdfText(feed);
    const section = paper.split('Table 4. Baseline results for all tasks')[1]?.split(/\n\s*\n/)[0];
    if (!section?.includes('HOTAall') || !section.includes('OWTAall') || !section.includes('Validation') || !section.includes('Test')) throw new Error('Missing Table 4 metrics');
    const lines = section.split('\n').filter(line => /(?:\s+(?:\d+\.\d+|-)){6}\s*$/.test(line));
    if (lines.length !== configurations.length) throw new Error('Unexpected Table 4 length');
    board.parts = {};
    const rows: LeaderboardRow[] = [];
    for (const [i,[model,task,label]] of configurations.entries()) {
      const match = lines[i].match(/((?:\s+(?:\d+\.\d+|-)){6})\s*$/);
      if (!match || !lines[i].slice(0,match.index).trim().replace(/\s*\[\d+\]$/,'').endsWith(label)) throw new Error('Unexpected method for ' + task);
      const cells = match[1].trim().split(/\s+/);
      for (const [j,setting] of ['Validation','Test'].entries()) {
        let row = rows.find(r => r.setting === setting && r.model === model);
        if (task === 'Mask-guided') {
          row = { model, setting, score: Number(cells[3*j]), metrics: {} };
          rows.push(row);
        }
        if (!row) continue;
        for (const [k,group] of ['all','common','uncommon'].entries()) {
          const cell = cells[3*j+k];
          if (cell === '-') continue;
          const name = task + ': ' + (task === 'Open-world' ? 'OWTA' : 'HOTA') + ' (' + group + ')';
          board.parts[name] = { name, unit: '%' };
          row.metrics![name] = Number(cell);
        }
      }
    }
    return checked(rows, 4);
  },
};
export default board;
