// Domain Dynamics evaluates English-to-Hindi translation. Table 3 reports full-set BLEU, COMET and human ratings.
// Tables 1 and 2 give the same measures for six domains.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2024.wmt-1.27.pdf";
const board: Leaderboard = {
  benchmark: "domain-dynamics-english-hindi", static: 'paper',
  url: "https://github.com/sohamb37/wmt24-test-suite/blob/main/bleu_scores.csv",
  feed: FEED,
  terms: "The CSV contains six domain scores per system. The repository lists no reuse license. https://github.com/sohamb37/wmt24-test-suite The ACL Anthology robots URL returns HTML.",
  parts: { Education: 'Education', General: 'General', Judicial: 'Judicial', Literature: 'Literature', Noisy: 'Noisy', Review: 'Review' },
  async fetch() {
    const paper = await pdfText(FEED);
    const overall = paper.match(/Model +BLEU +COMET +HUMAN\n([\s\S]*?)Table 3: Performance of models on the full dataset/);
    if (!overall) throw new Error('Missing full-dataset translation scores');
    const rows = [...overall[1].matchAll(/(?:^| {2,})([\w.-]+) +([\d.]+) +([\d.]+) +([\d.]+) *$/gm)].map(m => ({
      model: m[1], score: Number(m[2]), metrics: { comet: Number(m[3]), human: Number(m[4]) } as Record<string, number>,
    }));
    if (rows.length !== 16) throw new Error('Expected 16 full-dataset results');
    const groups = [['Education', 'General', 'Judicial'], ['Literature', 'Noisy', 'Review']];
    const tables = [...paper.matchAll(/BLEU +COMET +HUMAN +BLEU +COMET +HUMAN +BLEU +COMET +HUMAN\n([\s\S]*?)Table [12]:/g)];
    if (tables.length !== 2) throw new Error('Missing translation domain tables');
    tables.forEach((table, i) => {
      for (const row of rows) {
        const line = table[1].split('\n').find(l => l.trim().split(/\s+/)[0] === row.model);
        const scores = line?.trim().split(/\s+/).slice(1).map(Number);
        if (!scores || scores.length !== 9 || !scores.every(Number.isFinite)) throw new Error('Missing domains for ' + row.model);
        groups[i].forEach((domain, k) => {
          row.metrics[domain] = scores[k * 3];
          row.metrics[domain + 'Comet'] = scores[k * 3 + 1];
          row.metrics[domain + 'Human'] = scores[k * 3 + 2];
        });
      }
    });
    return rows;
  },
};
export default board;
