// JCoLA tests Japanese linguistic acceptability on in-domain and out-of-domain sentences.
// The paper's Table 4 reports accuracy for nine neural models plus GPT-3.5-Turbo and GPT-4.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/2024.lrec-main.828.pdf';
const board: Leaderboard = {
  benchmark: 'jcola', static: 'paper', url: 'https://aclanthology.org/2024.lrec-main.828/', feed: FEED,
  headline: 'The paper reports no overall score, so this is the plain mean of its in-domain and out-of-domain accuracy columns.',
  terms: 'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  parts: { inDomain: { name: 'In-domain', group: 'Split' }, outOfDomain: { name: 'Out-of-domain', group: 'Split' } },
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split('Model\n')[1]?.split('Table 4:')[0];
    if (!table || !table.includes('GPT-4')) throw new Error('Missing JCoLA Table 4');
    const names = ['Tohoku BERT base', 'Tohoku BERT base (char)', 'Tohoku BERT large', 'NICT BERT base', 'Waseda RoBERTa base', 'Waseda RoBERTa large (s128)', 'Waseda RoBERTa large (s512)', 'XLM RoBERTa base', 'XLM RoBERTa large', 'GPT-3.5-Turbo', 'GPT-4'];
    const rows: LeaderboardRow[] = [];
    for (const name of names) {
      const line = table.split('\n').find((candidate) => candidate.trim().startsWith(name));
      if (!line) throw new Error(`Missing JCoLA row ${name}`);
      const values = [...line.matchAll(/0\.\d+/g)].map((m) => Number(m[0]));
      if (values.length < 4) throw new Error(`Malformed JCoLA row ${name}`);
      rows.push({ model: name, score: (values[0] + values[2]) * 50, metrics: { inDomain: values[0] * 100, outOfDomain: values[2] * 100 } });
    }
    return rows;
  },
};
export default board;
