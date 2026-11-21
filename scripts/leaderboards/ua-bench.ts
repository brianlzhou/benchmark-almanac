// UA-Bench measures whether audio-language models recognize underwater sounds.
// Table 4 gives accuracy on the final class across 2,600 recordings and Table 5 breaks it down by source family.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2610.16942';
function checkpoints(section: string | undefined, width: number) {
  if (!section) throw Error('Missing UA-Bench table');
  const result = new Map<string, number[]>();
  for (const match of section.matchAll(/^([\w.-]+)\s+\[\d+\][ \t]+([\d. \t]+)$/gm)) {
    const values = match[2].trim().split(/\s+/).map(Number);
    if (values.length !== width || !values.every(Number.isFinite) || result.has(match[1])) throw Error('Invalid checkpoint ' + match[1]);
    result.set(match[1], values);
  }
  return result;
}
const board: Leaderboard = {
  benchmark: 'ua-bench', feed, url: 'https://sunzhe12.github.io/ua-bench/', static: 'paper',
  terms: 'The paper is available under the license linked at https://arxiv.org/abs/2610.16942.',
  parts: { detectionPulse: 'Detection pulse', communicationWaveform: 'Communication waveform', shipNoise: 'Ship-radiated noise' },
  stats: {
    l1Accuracy: { name: 'Level 1 accuracy', unit: '%', better: 'higher' }, l2Accuracy: { name: 'Level 2 accuracy', unit: '%', better: 'higher' },
    macroF1: { name: 'Macro F1', unit: 'score', better: 'higher', note: 'Macro-averaged F1 across the hierarchical classes.' },
    l2GivenL1: { name: 'Level 2 accuracy given level 1', unit: '%', better: 'higher' }, l3GivenL2: { name: 'Level 3 accuracy given level 2', unit: '%', better: 'higher' },
  },
  aliases: { 'Voxtral-Small-24B-2507': 'voxtral-small' },
  async fetch() {
    const text = await pdfText(feed);
    const overall = checkpoints(text.split(/L1 Acc.↑\s+L2 Acc.↑\s+L3 Acc.↑\s+Macro F1↑\s+L2\|L1↑\s+L3\|L2↑/)[1]?.split('Table 4 Hierarchical classification')[0], 6);
    const families = checkpoints(text.split(/Detection pulse\s+Communication waveform\s+Ship-radiated noise\s+3 classes/)[1]?.split('Table 5 L3 accuracy')[0], 3);
    return checked([...overall].map(([model, [l1Accuracy, l2Accuracy, score, macroF1, l2GivenL1, l3GivenL2]]) => {
      const family = families.get(model);
      if (!family) throw Error('Missing source family scores for ' + model);
      const [detectionPulse, communicationWaveform, shipNoise] = family;
      return { model, score, setting: 'Strict single-letter decoder, zero-shot',
        metrics: { l1Accuracy, l2Accuracy, macroF1, l2GivenL1, l3GivenL2, detectionPulse, communicationWaveform, shipNoise } };
    }), 9);
  },
};
export default board;
