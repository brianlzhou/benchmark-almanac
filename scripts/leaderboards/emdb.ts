// EMDB tests 3D body pose and trajectory estimation. Table 3 ranks systems by
// Procrustes-aligned mean per-joint position error in millimeters on EMDB 1.
// The paper also gives three EMDB 2 global trajectory errors for GLAMR.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://files.ait.ethz.ch/projects/emdb/main.pdf';
const measures = ['MPJPE','MPJPE-PA','MVE','MVE-PA','MPJAE','MPJAE-PA','Jitter'];
const board: Leaderboard = {
  benchmark: 'emdb', url: 'https://eth-ait.github.io/emdb/', feed, static: 'paper',
  terms: 'The authors publish their paper on the EMDB project site, which uses CC BY-SA 4.0. https://eth-ait.github.io/emdb/',
  headline: 'Table 3 ranks models by aligned joint position error on EMDB 1, measured in millimeters.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Method[ \t]+MPJPE ↓[ \t]+MPJPE-PA ↓([\s\S]+?)Table 3: Evaluations of state-of-the-art methods on EMDB 1/);
    if (!table || !table[1].includes('MPJAE-PA ↓')) throw new Error('Missing EMDB pose table');
    const rows: LeaderboardRow[] = [];
    for (const line of table[1].split('\n')) {
      const label = line.match(/^\s*(\S+) \[\d+\]\s+/);
      if (!label) continue;
      const cells = [...line.slice(label[0].length).matchAll(/([\d.]+)\s*±\s*([\d.]+)|n\/a/g)];
      if (cells.length !== measures.length) throw new Error('Missing pose error or standard deviation');
      const metrics: Record<string,number> = {};
      measures.forEach((k,i) => {
        if (!cells[i][1]) return;
        metrics[k] = Number(cells[i][1]);
        metrics[k + ' std'] = Number(cells[i][2]);
      });
      metrics.std = metrics['MPJPE-PA std'];
      const model = label[1].replace('*','');
      const setting = model === 'FastMETRO-L' ? (label[1].endsWith('*') ? 'Without SMPL regression head' : 'With SMPL regression head') : undefined;
      rows.push({model,setting,score:metrics['MPJPE-PA'],metrics});
    }
    const trajectory = paper.split('\n').map(line => line.slice(0,59)).join('\n');
    const global = trajectory.match(/G-MPJPE\s+of ([\d ]+) mm, a G-MVE of ([\d ]+) mm and acceleration of\s+([\d.]+) mm/);
    const glamr = rows.find(r => r.model === 'GLAMR');
    if (!global || !glamr) throw new Error('Missing GLAMR global trajectory results');
    board.parts = {};
    ['Global MPJPE','Global MVE','Global acceleration error'].forEach((k,i) => {
      glamr.metrics![k] = Number(global[i+1].replaceAll(' ',''));
      board.parts![k] = {name:k,group:'EMDB 2',unit:'score',better:'lower',note:i===2?'Millimeters per second squared.':'Millimeters.'};
    });
    return checked(rows, 9);
  },
};
export default board;
