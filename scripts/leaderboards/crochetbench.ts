// CrochetBench tests vision-language models on stitch recognition, instruction selection and instruction generation.
// The headline is stitch-recognition F1 in percent, with the other task metrics kept beside it.
// This importer reads Table 2 of the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2026.acl-long.604.pdf';
const board: Leaderboard = {
  benchmark: 'crochetbench', static: 'paper', url: 'https://aclanthology.org/2026.acl-long.604/', feed: FEED,
  terms: 'ACL Anthology terms. https://aclanthology.org/faq/copyright/',
  stats: { precision: { name: 'Precision', unit: '%', better: 'higher' }, recall: { name: 'Recall', unit: '%', better: 'higher' }, instructionSelection: { name: 'Instruction selection', unit: '%', better: 'higher' }, bleu: { name: 'BLEU', unit: 'score', better: 'higher' }, rougeL: { name: 'ROUGE-L', unit: 'score', better: 'higher' }, chrf: { name: 'chrF score', unit: 'score', better: 'higher' } },
  async fetch() {
    const text = await pdfText(FEED);
    const section = text.split('Model                               Size   Stitch Recognition')[1]?.split('Table 2:')[0];
    if (!section) throw new Error('CrochetBench Table 2 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const m = line.match(/^\s*(.+?)\s+(\d+B|–)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$/);
      if (!m) continue;
      const model = m[1].trim();
      const cleanModel = model.replace(/^(?:(?:Open|Closed|Source|Finetuned)\s+)+/, '').trim();
      if (!cleanModel || /^(?:Open|Closed|Source|Finetuned)$/.test(cleanModel)) continue;
      rows.push({ model: `${cleanModel} (${m[2]})`, score: Number(m[5]), metrics: { precision: Number(m[3]), recall: Number(m[4]), instructionSelection: Number(m[6]), bleu: Number(m[7]), rougeL: Number(m[8]), chrf: Number(m[9]) } });
    }
    return checked(rows, 8);
  },
};
export default board;
