// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// MultipanelVQA tests visual reasoning across panels. Table 2 reports three-run accuracy and standard deviation for each subset and question style.
import type { Leaderboard, BoardPart } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://aclanthology.org/2024.acl-long.370/';
const feed = 'https://aclanthology.org/2024.acl-long.370.pdf';
const parts: Record<string, BoardPart> = {};
const keys: string[] = [];
for (const [prefix, name] of [['synthetic','Synthetic data'], ['real','Real-world data']]) {
  for (const style of ['Q1','Q2','Q3','']) {
    const key = prefix + style;
    keys.push(key);
    parts[key] = {name: style || name, group: style ? name : 'Subset'};
  }
}
const board: Leaderboard = {
  benchmark: 'multipanelvqa', static: 'paper', url, feed, parts,
  terms: 'ACL Anthology copyright policy: https://aclanthology.org/faq/copyright/.',
  headline: 'The paper reports separate accuracies for synthetic and real-world data. The headline is their plain mean.',
  aliases: { LLaVA: 'llava-v1-5-13b', InstructBLIP: 'instructblip-flan-t5-xxl', 'Gemini Pro Vision': 'gemini-1-0-pro-vision' },
  async fetch() {
    const pdf = await pdfText(feed);
    const end = pdf.indexOf('Table 2: Average accuracy with standard deviation');
    const table = pdf.slice(pdf.lastIndexOf('\f', end), end);
    if (end < 0 || !/Synthetic data\s+Real-world data\s+Models\s+Q1\s+Q2\s+Q3\s+Avg\.\s+Q1\s+Q2\s+Q3\s+Avg\./.test(table)) {
      throw new Error('Missing Table 2 subset columns');
    }
    const rows = table.split('\n').filter(line => line.includes('±')).map(line => {
      const pairs = [...line.matchAll(/(\d+\.\d+)\s*±\s*(\d+\.\d+)/g)];
      if (pairs.length !== 8) throw new Error('Incomplete MultipanelVQA row');
      const model = line.slice(0,pairs[0].index).trim();
      const metrics: Record<string, number> = {};
      keys.forEach((key,i) => { metrics[key] = Number(pairs[i][1]); metrics[key + 'Std'] = Number(pairs[i][2]); });
      return {model, score: (metrics.synthetic + metrics.real) / 2, trials: 3, metrics};
    });
    return checked(rows, 8);
  },
};
export default board;
