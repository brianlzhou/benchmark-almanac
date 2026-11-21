// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// VoiceMOS compares predicted and human speech-quality ratings. Figures 2 to 4 label each panel with system-level Spearman correlation.
// Section 3 names the two baseline models. Section 4 identifies T08's predictor as an SVM on UTMOS features.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://www.iis.sinica.edu.tw/papers/whm/25997-F.pdf';
const identities = { B01: 'SSL-MOS', B02: 'UTMOS', T08: 'SVM on UTMOS features' };
const parts = { hub: 'Blizzard Hub', spoke: 'Blizzard Spoke', svcc: 'Singing voice conversion', noisy: 'Noisy and enhanced speech' };
const board: Leaderboard = {
  benchmark: 'voicemos-challenge-2023', feed, url: 'https://voicemos-challenge-2023.github.io/', static: 'paper', parts,
  terms: 'The authors publish their ASRU paper at Academia Sinica. https://doi.org/10.1109/ASRU57964.2023.10389763',
  headline: 'The paper reports no overall correlation, so the headline is the plain mean of system-level Spearman correlations on the four evaluation sets.',
  async fetch() {
    const paper = await pdfText(feed);
    function panel(title: string, count: number) {
      const page = paper.split(title)[1]?.split(/Fig\. [234]\./)[0];
      if (!page) throw Error('Missing figure: ' + title);
      const scores = new Map<string, number[]>();
      const lines = page.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const ids = lines[i].match(/\b[BT]\d{2}\b/g);
        if (!ids || !lines[i + 1].includes('SRCC =')) continue;
        const values = [...lines[i + 1].matchAll(/SRCC = (-?\d+\.\d+)(?:, (-?\d+\.\d+))?/g)];
        if (values.length !== ids.length) throw Error('Misaligned figure labels');
        ids.forEach((id, index) => {
          const v = values[index].slice(1).filter(Boolean).map(Number);
          if (v.length !== count) throw Error('Wrong number of tracks for ' + id);
          scores.set(id, v);
        });
      }
      return scores;
    }
    const blizzard = panel('Predicted vs. Actual MOS for Hub and Spoke Blizzard Tasks', 2);
    const singing = panel('Predicted vs. Actual MOS for the Singing Voice Conversion Challenge', 1);
    const noisy = panel('Predicted vs. Actual MOS for Noisy and Enhanced Speech', 1);
    return checked(Object.entries(identities).map(([id, model]) => {
      const [hub, spoke] = blizzard.get(id) ?? [];
      const svcc = singing.get(id)?.[0], noise = noisy.get(id)?.[0];
      if (spoke === undefined || svcc === undefined || noise === undefined) throw Error('Missing track for ' + id);
      return { model, submitter: id === 'T08' ? id : undefined, score: (hub + spoke + svcc + noise) / 4,
        metrics: { hub, spoke, svcc, noisy: noise } };
    }), 3);
  },
};
export default board;
