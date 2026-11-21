// Hi4D tests body reconstruction for people in close physical contact.
// Table 3 reports mean per-joint position error in millimeters for SMPL body estimation.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://openaccess.thecvf.com/content/CVPR2023/papers/Yin_Hi4D_4D_Instance_Segmentation_of_Close_Human_Interaction_CVPR_2023_paper.pdf';
const board: Leaderboard = {
  benchmark: 'hi4d', static: 'paper', url: 'https://yifeiyin04.github.io/Hi4D/', feed,
  terms: 'The Computer Vision Foundation provides open access to the authors’ paper at https://openaccess.thecvf.com/CVPR2023.',
  headline: 'The headline is mean per-joint position error in millimeters, the first measure in the SMPL estimation table.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Setting\s+Method\s+MPJPE ↓\s+MVE ↓\s+NMJE ↓\s+NMVE ↓\s+F1 ↑\s+PCDR0.10 ↑\s+CD ↓([\s\S]+?)Table 3\. SMPL estimation/);
    if (!table) throw new Error('Missing Hi4D SMPL estimation columns');
    const rows = [...table[1].matchAll(/(\w+)(?: \((\d+)-views\))? \[\d+\]\s+([\d.]+(?: +[\d.]+){6})/g)].map(match => {
      const [score, MVE, NMJE, NMVE, F1, PCDR, CD] = match[3].trim().split(/\s+/).map(Number);
      return { model: match[1], setting: match[2] ? match[2] + ' views' : 'Monocular', score,
        metrics: { MVE, NMJE, NMVE, F1, PCDR, CD } };
    });
    return checked(rows, 5);
  },
};
export default board;
