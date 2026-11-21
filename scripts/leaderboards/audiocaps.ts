// AudioCaps tests audio captioning. Table 2 reports caption similarity metrics for named audio captioning models.
// The source reports no overall score, so this headline uses the first metric in the table, B-1.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/N19-1011.pdf';
const board: Leaderboard = {
  benchmark: 'audiocaps', static: 'paper', url: 'https://audiocaps.github.io/', feed,
  headline: 'The paper reports no overall score, so this is the B-1 caption similarity column, the first metric in Table 2.',
  terms: 'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',
  stats: { B2: { name: 'BLEU-2', unit: 'score', better: 'higher' }, B3: { name: 'BLEU-3', unit: 'score', better: 'higher' }, B4: { name: 'BLEU-4', unit: 'score', better: 'higher' }, METEOR: { name: 'METEOR', unit: 'score', better: 'higher' }, CIDEr: { name: 'CIDEr', unit: 'score', better: 'higher' }, ROUGE_L: { name: 'ROUGE-L', unit: 'score', better: 'higher' }, SPICE: { name: 'SPICE', unit: 'score', better: 'higher' } },
  async fetch() {
    const paper = await pdfText(feed);
    const section = paper.split(/Methods\s+B-1\s+B-2\s+B-3\s+B-4\s+METEOR\s+CIDEr\s+ROUGE-L\s+SPICE/)[1]?.split(/Table 2: Captioning results/)[0];
    if (!section) throw new Error('Missing AudioCaps Table 2');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const m = line.match(/^\s*(.+?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$/);
      if (!m || m[1].trim() === 'Human') continue;
      const [, model, b1, b2, b3, b4, meteor, cider, rougeL, spice] = m;
      rows.push({ model: model.trim(), score: Number(b1), metrics: { B2: Number(b2), B3: Number(b3), B4: Number(b4), METEOR: Number(meteor), CIDEr: Number(cider), ROUGE_L: Number(rougeL), SPICE: Number(spice) } });
    }
    return checked(rows, 16);
  },
};
export default board;
