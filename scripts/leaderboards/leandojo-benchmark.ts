// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// LeanDojo tests theorem proving. Table 2 and Table C report pass@1 on random and novel-premise splits in Lean 3 and Lean 4.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://proceedings.neurips.cc/paper_files/paper/2023/file/4441469427094f8873d0fecb0c4e1cee-Paper-Datasets_and_Benchmarks.pdf';
const board: Leaderboard = {
  benchmark: 'leandojo-benchmark', url: 'https://leandojo.org/', feed, static: 'paper',
  terms: 'NeurIPS publishes the paper at https://proceedings.neurips.cc/paper_files/paper/2023/hash/4441469427094f8873d0fecb0c4e1cee-Abstract-Datasets_and_Benchmarks.html.',
  headline: 'The paper reports no overall score, so this is mean pass@1 on its random and novel-premise splits.',
  parts: { random: 'Random', novelPremises: 'Novel premises' },
  async fetch() {
    const pdf = await pdfText(feed);
    const rows: LeaderboardRow[] = [];
    for (const [table, version] of [['Table 2', 'Lean 3'], ['Table C', 'Lean 4']]) {
      const block = pdf.split(table + ': Theorem proving Pass@1 (%) on the testing data')[1]?.split(/\n\s*\n/)[0];
      if (!block?.match(/Method\s+random\s+novel_premises/)) throw new Error('Missing LeanDojo split columns');
      for (const m of block.matchAll(/^\s*(GPT-4|ReProver(?: \(ours\))?|[Ww]\/o retrieval)\s+([\d.]+)\s+([\d.]+)\s*$/gm)) {
        const model = m[1] === 'GPT-4' ? 'GPT-4' : 'ReProver';
        const setting = /retrieval/i.test(m[1]) ? version + ', without retrieval' : version;
        const random = Number(m[2]), novelPremises = Number(m[3]);
        rows.push({ model, setting, score: (random + novelPremises) / 2, metrics: { random, novelPremises } });
      }
    }
    return checked(rows, 5);
  },
};
export default board;
