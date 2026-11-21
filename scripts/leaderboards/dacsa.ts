// DACSA evaluates Catalan and Spanish news summarization.
// The source reports no overall score. The headline is the plain mean of Catalan TEST I and TEST NI ROUGE-L.
// This importer reads the Catalan results table in the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2022.naacl-main.434.pdf';
const board: Leaderboard = {
  benchmark: 'dacsa', static: 'paper', url: 'https://aclanthology.org/2022.naacl-main.434/', feed: FEED,
  terms: 'ACL Anthology terms. https://aclanthology.org/faq/copyright/',
  headline: 'The paper reports no overall score, so this is the plain mean of Catalan TEST I and TEST NI ROUGE-L.',
  parts: { testI: 'TEST I ROUGE-L', testNI: 'TEST NI ROUGE-L' },
  async fetch() {
    const text = await pdfText(FEED);
    const section = text.split('Table 5: Average F1 scores')[1]?.split('Table 6:')[0];
    if (!section) throw new Error('DACSA Catalan table missing');
    const byModel = new Map<string, number[]>();
    for (const line of section.split('\n')) {
      const m = line.match(/^\s*(mBART|mT5|SHANN)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$/);
      if (!m) continue;
      const values = byModel.get(m[1]) ?? []; values.push(Number(m[4])); byModel.set(m[1], values);
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, values] of byModel) { if (values.length !== 2) throw new Error('DACSA model missing part: ' + model); rows.push({ model, score: (values[0] + values[1]) / 2, metrics: { testI: values[0], testNI: values[1] } }); }
    return checked(rows, 3);
  },
};
export default board;
