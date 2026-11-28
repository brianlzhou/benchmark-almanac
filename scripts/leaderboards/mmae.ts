// MMAE evaluates instruction-based audio editing. Table 2 reports instruction following, consistency and exact match.
// The headline uses the first overall measure, instruction following rate, for models evaluated on all 2,000 clips.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/pdf/2606.07229';
const groups = [['Single','Multiple','Overall'],['Sound','Music','Speech'],
  ['Sound-Music','Sound-Speech','Music-Speech','Sound-Music-Speech']];
const board: Leaderboard = {
  benchmark: 'mmae', static: 'paper', url: 'https://arxiv.org/abs/2606.07229', feed,
  terms: 'The authors publish Table 2 under the terms at https://arxiv.org/abs/2606.07229.',
  parts: Object.fromEntries(groups.flat().filter(k=>k !== 'Overall').map(name => [name,name])),
  stats: Object.fromEntries(groups.flat().flatMap(name => [
    [name + 'Consistency', { name: name + ' consistency rate', unit: '%' as const, better: 'higher' as const }],
    [name + 'ExactMatch', { name: name + ' exact match rate', unit: '%' as const, better: 'higher' as const }],
  ])),
  async fetch() {
    const pdf = await pdfText(feed);
    const page = pdf.split('Table 2 Main results on the MMAE benchmark.')[1]?.split('\f')[0];
    if (!page?.includes('801 samples')) throw new Error('Missing Table 2 scope note');
    const panels = page.split(/\([abc]\) Results (?:by complexity|on (?:single|mixed) modality)\./).slice(1);
    if (panels.length !== 3) throw new Error('Missing results panels');
    const models = new Map<string,Record<string,number>>();
    panels.forEach((panel,i) => {
      if (!groups[i].every(name=>panel.includes(name)) || !/IFR\s+CR\s+EMR/.test(panel)) throw new Error('Missing modality or metric');
      for (const m of panel.matchAll(/^\s*(Step-Audio-EditX|Ming-UniAudio)\s+([\d.]+(?:[ \t]+[\d.]+)+)[ \t]*$/gm)) {
        const values = m[2].trim().split(/\s+/).map(numberCell);
        if (values.length !== groups[i].length*3) throw new Error('Invalid MMAE result');
        const metrics = models.get(m[1]) ?? {};
        groups[i].forEach((key,j) => {
          metrics[key] = values[j*3];
          metrics[key+'Consistency'] = values[j*3+1];
          metrics[key+'ExactMatch'] = values[j*3+2];
        });
        models.set(m[1],metrics);
      }
    });
    return checked([...models].map(([model,metrics]) => {
      if (Object.keys(metrics).length !== 30) throw new Error('Missing scores for ' + model);
      const {Overall: score,...parts} = metrics;
      return {model,score,metrics:parts};
    }),2);
  },
};
export default board;
