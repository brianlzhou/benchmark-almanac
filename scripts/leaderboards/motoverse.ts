// MotoVerse tests maneuver anticipation and trajectory prediction in two-wheeler traffic.
// Tables 2 and 3 report different units. The headline is the first ranked measure, maneuver
// accuracy at 20% observation. Table 8 reports two additional LoRA configurations.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2611.06007';
const ratios = [20,30,50,100];
const accuracy = ['Accuracy','Weighted F1','Macro F1'];
const trajectory = ['ADE','FDE','sADE','sFDE','AIoU','FIoU'];
const parts: Record<string,BoardPart> = {};
for (const ratio of ratios) for (const name of accuracy) parts[name+ratio] = {name,group:ratio+'% observation',unit:'%'};
for (const name of trajectory) parts[name] = {name,group:'Trajectory prediction',unit:'score',better:name.endsWith('DE') ? 'lower' : 'higher',
  note:['ADE','FDE'].includes(name) ? 'Displacement in pixels.' : undefined};

const board: Leaderboard = {
  benchmark:'motoverse', static:'paper', feed, url:'https://arxiv.org/abs/2611.06007',
  terms:'The authors publish their paper under arXiv terms. https://arxiv.org/abs/2611.06007',
  parts, headline:'The headline is maneuver anticipation accuracy after observing the first 20% of the maneuver.',
  aliases:{'Qwen3-VL-4B':'qwen3-vl-4b-instruct','Qwen3-VL-2B':'qwen3-vl-2b-instruct'},
  async fetch() {
    const pdf = await pdfText(feed);
    const main = pdf.match(/Table 2\. ERMA performance across different observation ratios([\s\S]*?)best validation accuracy; TATP/);
    const tatp = pdf.match(/Table 3\. TATP performance comparison([\s\S]*?)4\.4\. Challenge-wise/);
    const extra = pdf.match(/Table 8\. Zero-shot vs\. LoRA-adapted VLMs([\s\S]*?)C\.2\. Full-Test-Set/);
    if (!main || !tatp || !extra || !main[1].includes('τ=1.0') || !tatp[1].includes('FIoU')) throw new Error('Missing MotoVerse results');
    const rows: LeaderboardRow[] = [];
    function add(model:string,setting:string,triples:string) {
      const metrics: Record<string,number> = {};
      const values = triples.trim().split(/\s+/);
      if (values.length !== 4) throw new Error('Missing observation ratios');
      ratios.forEach((ratio,i) => {
        const scores = values[i].split('/').map(Number);
        if (scores.length !== 3 || !scores.every(Number.isFinite)) throw new Error('Invalid maneuver metrics');
        accuracy.forEach((name,j) => metrics[name+ratio] = scores[j]);
      });
      rows.push({model,setting,score:metrics.Accuracy20,metrics});
    }
    for (const line of main[1].split('\n')) {
      const m = line.match(/([\w.-]+)†? \[\d+\]\s+((?:\d+\.\d+\/\d+\.\d+\/\d+\.\d+\s*){4})$/);
      if (m) add(m[1],['C2D','I3D','SlowFast','X3D'].includes(m[1]) ? 'Fine-tuned' : 'Zero-shot',m[2]);
    }
    for (const line of tatp[1].split('\n')) {
      const m = line.match(/^\s*([\w.-]+) \[\d+\]\s+((?:\d+\.\d+\s*){6})/);
      const row = m && rows.find(r => r.model === m[1]);
      if (m && row) m[2].trim().split(/\s+/).forEach((n,i) => row.metrics![trajectory[i]] = Number(n));
    }
    let parent = '';
    for (const line of extra[1].split('\n')) {
      const named = line.match(/^(Qwen3-VL-2B|UniDriveVLA)\s+\d/);
      if (named) parent = named[1];
      const match = line.match(/^\s*\+ LoRA\s+((?:\d+\.\d+\/\d+\.\d+\/\d+\.\d+\s*){4})/);
      if (match && parent) add(parent,'LoRA',match[1]);
      const distances = line.match(/^\s*\+ LoRA\s+((?:\d+\.\d+\s*){6})(?:\s|$)/);
      if (distances) {
        const row = rows.find(r => r.model === parent && r.setting === 'LoRA');
        if (!row) throw new Error('Missing LoRA maneuver row');
        distances[1].trim().split(/\s+/).forEach((n,i) => row.metrics![trajectory[i]] = Number(n));
      }
    }
    if (rows.filter(r => r.metrics?.FIoU !== undefined).length !== 9) throw new Error('Incomplete trajectory metrics');
    return checked(rows,14);
  },
};
export default board;
