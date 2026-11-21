// CURIE evaluates long-context scientific problem solving across literature, materials, biology and protein tasks.
// The source reports no overall score. The headline is the plain mean of the eight primary task metrics in Table 1.
// This importer reads the benchmark paper's fixed results table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://proceedings.iclr.cc/paper_files/paper/2025/file/1ae4999aefb509d75d8608e07280922c-Paper-Conference.pdf';
const names = ['Mixtral', 'Command-R+', 'LongLLaMa', 'Gemini 1.0 Pro', 'GPT-4o', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Gemini 2.0 Flash', 'Claude 3 (Opus)'];
const board: Leaderboard = {
  benchmark: 'curie-biogr', static: 'paper', url: 'https://proceedings.iclr.cc/paper_files/paper/2025/hash/1ae4999aefb509d75d8608e07280922c-Abstract-Conference.html', feed: FEED,
  terms: 'ICLR proceedings terms. https://iclr.cc/Conferences/2025/CallForPapers',
  headline: 'The paper reports no overall score, so this is the plain mean of the eight primary task metrics in Table 1.',
  parts: { dft: 'DFT', mpv: 'MPV', hfd: 'HFD', hfe: 'HFE', qecc: 'QECC', geo: 'GEO', biogr: 'BIOGR', pdb: 'PDB' },
  async fetch() {
    const text = await pdfText(FEED);
    const section = text.split('DFT           MPV')[1]?.split('Table 1: Results')[0];
    if (!section) throw new Error('CURIE Table 1 missing');
    const rows: LeaderboardRow[] = [];
    for (const name of names) {
      const line = section.split('\n').find(l => l.trim().startsWith(name));
      if (!line) throw new Error('Missing CURIE model: ' + name);
      const values = [...line.matchAll(/(?<![A-Za-z])\d+\.\d+/g)].map(m => Number(m[0]));
      if (values.length < 14) throw new Error('CURIE row changed: ' + name);
      const metrics = { dft: values[1], mpv: values[3], hfd: values[5], hfe: values[7], qecc: values[9], geo: values[11], biogr: values[12], pdb: values[13] };
      rows.push({ model: name, score: Object.values(metrics).reduce((a, b) => a + b, 0) / 8, metrics });
    }
    return checked(rows, 8);
  },
};
export default board;
