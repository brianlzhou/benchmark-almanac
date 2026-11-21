// PROST tests reasoning about ten physical concepts in text. Table 5 reports overall macro-average accuracy.
// T5 and UnifiedQA have no Slide scores. Their starred nine-concept averages do not cover the full benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2021.findings-acl.404.pdf';
const concepts = ['Direction', 'Mass', 'Height', 'Circum.', 'Stack', 'Roll', 'Grasp', 'Break', 'Slide', 'Bounce'];
const sizes: Record<string, string> = { B: 'Base', M: 'Medium', L: 'Large', XL: 'XL', XXL: 'XXL' };
const board: Leaderboard = {
  benchmark: 'prost', url: 'https://aclanthology.org/2021.findings-acl.404/', feed, static: 'paper',
  terms: 'The authors publish the paper under the terms at https://aclanthology.org/info/copyright/.',
  aliases: { 'GPT2 XL': 'gpt-2-1-5b' },
  parts: Object.fromEntries(concepts.map(s => [s, s === 'Circum.' ? 'Circumference' : s])),
  async fetch() {
    const pdf = await pdfText(feed);
    const section = pdf.split(/Model\s+Direction Mass Height Circum\. Stack Roll Grasp Break Slide Bounce Macro Average/)[1]?.split('Task Average')[0];
    if (!section) throw new Error('PROST Table 5 missing');
    const rows: LeaderboardRow[] = [];
    let family = '';
    for (const line of section.trim().split('\n')) {
      const tokens = line.trim().split(/\s+/);
      const values = tokens.splice(-11);
      if (values.includes('—') && values[10].endsWith('∗')) continue;
      let size = '';
      if (tokens.at(-1)! in sizes) size = sizes[tokens.pop()!];
      if (tokens.length) family = tokens.join(' ');
      if (!family || values.length !== 11) throw new Error('Unexpected PROST model row');
      const metrics = Object.fromEntries(concepts.map((key, i) => [key, numberCell(values[i])]));
      rows.push({ model: [family, size].filter(Boolean).join(' '), score: numberCell(values[10]), metrics });
    }
    return checked(rows, 13);
  },
};
export default board;
